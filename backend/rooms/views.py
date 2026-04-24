from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Room, Favorite, RoomInteraction, RoomSearchHistory
from .serializers import RoomSerializer, FavoriteSerializer
from .filters import RoomFilter
from .geocoding_service import GeocodingService

class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = RoomFilter
    ordering_fields = ['price', 'distance_from_university', 'created_at']
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        from users.models import HostelOwnerProfile
        blocked_contacts = list(
            HostelOwnerProfile.objects.filter(user__is_blocked=True)
            .values_list('phone_number', flat=True)
        )
        blocked_emails = list(
            HostelOwnerProfile.objects.filter(user__is_blocked=True)
            .values_list('user__email', flat=True)
        )
        # Filter out None and empty strings to avoid accidentally excluding rooms
        excluded_contacts = [c for c in blocked_contacts + blocked_emails if c and c.strip()]
        qs = Room.objects.filter(status='APPROVED')
        if excluded_contacts:
            qs = qs.exclude(owner_contact__in=excluded_contacts)
        return qs

class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        from users.models import HostelOwnerProfile
        blocked_contacts = list(
            HostelOwnerProfile.objects.filter(user__is_blocked=True)
            .values_list('phone_number', flat=True)
        )
        blocked_emails = list(
            HostelOwnerProfile.objects.filter(user__is_blocked=True)
            .values_list('user__email', flat=True)
        )
        excluded_contacts = [c for c in blocked_contacts + blocked_emails if c and c.strip()]
        qs = Room.objects.filter(status='APPROVED')
        if excluded_contacts:
            qs = qs.exclude(owner_contact__in=excluded_contacts)
        return qs

    def retrieve(self, request, *args, **kwargs):
        room = self.get_object()

        if getattr(request.user, 'user_type', None) == 'student':
            Room.objects.filter(id=room.id).update(views=F('views') + 1)
            room.refresh_from_db(fields=['views'])
            RoomInteraction.objects.create(
                user=request.user, room=room, event_type=RoomInteraction.EVENT_VIEW
            )

        serializer = self.get_serializer(room)
        return Response(serializer.data)

class FavoriteToggleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        room_id = request.data.get('room_id')
        try:
            room = Room.objects.get(id=room_id)
            favorite, created = Favorite.objects.get_or_create(user=request.user, room=room)
            if not created:
                favorite.delete()
                return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
            RoomInteraction.objects.create(
                user=request.user, room=room, event_type=RoomInteraction.EVENT_SAVE
            )
            return Response({'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_search(request):
    if getattr(request.user, 'user_type', None) == 'student':
        RoomSearchHistory.objects.create(
            user=request.user,
            budget_min=request.data.get('min_price') or None,
            budget_max=request.data.get('max_price') or None,
            max_distance=request.data.get('max_distance') or None,
            gender_allowed=request.data.get('gender_allowed', ''),
            location=request.data.get('location', ''),
            facility=request.data.get('facility', ''),
        )
    return Response({'status': 'logged'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_click(request):
    """Log a click interaction when a student clicks View Details on a room card."""
    if getattr(request.user, 'user_type', None) != 'student':
        return Response({'status': 'skipped'})
    room_id = request.data.get('room_id')
    try:
        room = Room.objects.get(id=room_id, status='APPROVED')
        RoomInteraction.objects.create(
            user=request.user, room=room, event_type=RoomInteraction.EVENT_CLICK
        )
    except Room.DoesNotExist:
        pass
    return Response({'status': 'logged'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_rooms(request):
    """
    Uses the smart-room-recommender ML model:
    - Builds a weighted user profile vector from interaction history (view/save/click)
    - Ranks candidate rooms via cosine similarity on the room feature matrix
    - Applies search-history boost on top of similarity score
    - Cold-start fallback: top-rated rooms for new users with no history
    """
    import joblib
    import numpy as np
    import pandas as pd
    from pathlib import Path
    from sklearn.metrics.pairwise import cosine_similarity

    ML_DIR = Path(__file__).resolve().parent / 'ml'
    user   = request.user
    top_k  = int(request.query_params.get('top_k', 6))

    # ── Load model artifacts ──────────────────────────────────────────────────
    try:
        room_matrix = joblib.load(ML_DIR / 'room_feature_matrix.pkl')
        room_ids    = joblib.load(ML_DIR / 'room_ids.pkl')   # list of str DB ids
        rooms_df    = pd.read_csv(ML_DIR / 'rooms_processed.csv')
    except FileNotFoundError:
        return Response(
            {'error': 'Model not trained. Run: python -m rooms.ml.train_recommender'},
            status=500
        )

    rooms_df['room_id'] = rooms_df['room_id'].astype(str)
    room_index = {rid: idx for idx, rid in enumerate(room_ids)}  # str_id -> matrix row

    # ── Build interactions DataFrame from live DB ─────────────────────────────
    EVENT_WEIGHTS = {
        RoomInteraction.EVENT_CLICK: 1.0,
        RoomInteraction.EVENT_VIEW:  1.5,
        RoomInteraction.EVENT_SAVE:  3.0,
    }

    raw_interactions = list(
        RoomInteraction.objects.filter(user=user)
        .values('room_id', 'event_type', 'time_spent')
    )

    interacted_ids = set()
    profile_vector = None

    if raw_interactions:
        int_df = pd.DataFrame(raw_interactions)
        int_df['room_id'] = int_df['room_id'].astype(str)

        def _time_score(s):
            s = float(s or 0)
            return 0.0 if s < 10 else (1.0 if s < 30 else 2.0)

        int_df['event_weight']      = int_df['event_type'].map(EVENT_WEIGHTS).fillna(1.0)
        int_df['time_score']        = int_df['time_spent'].apply(_time_score)
        int_df['interaction_score'] = int_df['event_weight'] + int_df['time_score']

        valid = int_df[int_df['room_id'].isin(room_index)]
        interacted_ids = set(valid['room_id'].tolist())

        if not valid.empty:
            indices = valid['room_id'].map(room_index).tolist()
            weights = np.array(valid['interaction_score'].astype(float).tolist())
            weights = weights / weights.sum()
            sub_matrix = room_matrix[indices]
            if hasattr(sub_matrix, 'multiply'):          # sparse matrix
                profile_vector = sub_matrix.multiply(weights.reshape(-1, 1)).sum(axis=0)
            else:                                        # dense matrix
                profile_vector = np.sum(
                    np.asarray(sub_matrix) * weights.reshape(-1, 1), axis=0, keepdims=True
                )

    # ── Candidate rooms — include all interacted rooms since boost handles priority ──
    # Only exclude rooms viewed many times with no save/click (already well-known)
    view_counts = {}
    for row in raw_interactions:
        if row['event_type'] == RoomInteraction.EVENT_VIEW:
            rid = str(row['room_id'])
            view_counts[rid] = view_counts.get(rid, 0) + 1

    saved_str_ids = set(
        str(rid) for rid in RoomInteraction.objects
        .filter(user=user, event_type=RoomInteraction.EVENT_SAVE)
        .values_list('room_id', flat=True)
    )
    clicked_str_ids = set(
        str(rid) for rid in RoomInteraction.objects
        .filter(user=user, event_type=RoomInteraction.EVENT_CLICK)
        .values_list('room_id', flat=True)
    )
    # Only exclude rooms viewed 5+ times with no save or click
    exclude_ids = {
        rid for rid, cnt in view_counts.items()
        if cnt >= 5 and rid not in saved_str_ids and rid not in clicked_str_ids
    }
    candidate_rooms = rooms_df[~rooms_df['room_id'].isin(exclude_ids)].copy()

    if candidate_rooms.empty:
        # All rooms seen — fall back to top-rated
        top_rooms = Room.objects.filter(status='APPROVED').order_by('-estimated_rating')[:top_k]
        serializer = RoomSerializer(top_rooms, many=True, context={'request': request})
        return Response(serializer.data)

    candidate_indices = candidate_rooms['room_id'].map(room_index).tolist()
    candidate_matrix  = room_matrix[candidate_indices]

    # ── Score: cosine similarity + search-history boost ───────────────────────
    SEARCH_BOOST_WEIGHTS = {'budget': 0.20, 'distance': 0.20, 'gender': 0.10}

    if profile_vector is None:
        # Cold-start: rank by rating + affordability
        max_price = candidate_rooms['monthly_rent_lkr'].astype(float).max() + 1
        rating_score  = candidate_rooms['rating'].fillna(3.5).astype(float) / 5.0
        price_score   = 1 - candidate_rooms['monthly_rent_lkr'].astype(float) / max_price
        candidate_rooms['final_score'] = rating_score * 0.6 + price_score * 0.4
        # Boost interacted rooms in cold-start too
        saved_ids_str = set(
            str(rid) for rid in Favorite.objects.filter(user=user).values_list('room_id', flat=True)
        )
        viewed_ids_str = set(
            str(rid) for rid in RoomInteraction.objects
            .filter(user=user, event_type=RoomInteraction.EVENT_VIEW)
            .values_list('room_id', flat=True)
        )
        clicked_ids_str = set(
            str(rid) for rid in RoomInteraction.objects
            .filter(user=user, event_type=RoomInteraction.EVENT_CLICK)
            .values_list('room_id', flat=True)
        )
        interaction_boost = (
            candidate_rooms['room_id'].isin(saved_ids_str).astype(float) * 2.0
            + candidate_rooms['room_id'].isin(viewed_ids_str).astype(float) * 1.0
            + candidate_rooms['room_id'].isin(clicked_ids_str).astype(float) * 0.5
        )
        candidate_rooms['final_score'] = candidate_rooms['final_score'] + interaction_boost
    else:
        sims = cosine_similarity(profile_vector, candidate_matrix).flatten()
        candidate_rooms = candidate_rooms.copy()
        candidate_rooms['similarity_score'] = sims

        # Search-history boost from latest search
        boost = np.zeros(len(candidate_rooms))
        latest_search = (
            RoomSearchHistory.objects.filter(user=user)
            .order_by('-created_at')
            .first()
        )
        if latest_search:
            prices  = candidate_rooms['monthly_rent_lkr'].astype(float).values
            dists   = candidate_rooms['distance_to_uoj_km'].astype(float).values
            genders = candidate_rooms['gender_allowed'].astype(str).str.lower().values
            bmax    = float(latest_search.budget_max or 0)
            bmin    = float(latest_search.budget_min or 0)
            dmax    = float(latest_search.max_distance or 0)
            gender  = str(latest_search.gender_allowed or '').strip().lower()
            if bmax > 0:
                boost += (prices <= bmax).astype(float) * SEARCH_BOOST_WEIGHTS['budget']
            if bmin > 0:
                boost += (prices >= bmin).astype(float) * (SEARCH_BOOST_WEIGHTS['budget'] / 2)
            if dmax > 0:
                boost += (dists <= dmax).astype(float) * SEARCH_BOOST_WEIGHTS['distance']
            if gender and gender != 'unknown':
                boost += np.isin(genders, [gender, 'both']).astype(float) * SEARCH_BOOST_WEIGHTS['gender']

        candidate_rooms['final_score'] = candidate_rooms['similarity_score'] + boost

    # ── Boost rooms based on interaction type ─────────────────────────────────
    # saved=+2.0, viewed=+1.0, clicked=+0.5
    saved_ids_str = set(
        str(rid) for rid in Favorite.objects.filter(user=user).values_list('room_id', flat=True)
    )
    viewed_ids_str = set(
        str(rid) for rid in RoomInteraction.objects
        .filter(user=user, event_type=RoomInteraction.EVENT_VIEW)
        .values_list('room_id', flat=True)
    )
    clicked_ids_str = set(
        str(rid) for rid in RoomInteraction.objects
        .filter(user=user, event_type=RoomInteraction.EVENT_CLICK)
        .values_list('room_id', flat=True)
    )
    interaction_boost = (
        candidate_rooms['room_id'].isin(saved_ids_str).astype(float) * 2.0
        + candidate_rooms['room_id'].isin(viewed_ids_str).astype(float) * 1.0
        + candidate_rooms['room_id'].isin(clicked_ids_str).astype(float) * 0.5
    )
    candidate_rooms['final_score'] = candidate_rooms['final_score'] + interaction_boost

    # ── Return top-k by final_score ───────────────────────────────────────────
    top_df   = candidate_rooms.nlargest(top_k, 'final_score')
    db_ids   = [int(rid) for rid in top_df['room_id'].tolist()]
    rooms_qs = Room.objects.filter(id__in=db_ids, status='APPROVED')
    id_order = {rid: idx for idx, rid in enumerate(db_ids)}
    rooms_sorted = sorted(rooms_qs, key=lambda r: id_order.get(r.id, 999))

    serializer = RoomSerializer(rooms_sorted, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_location(request):
    """
    Detect latitude and longitude from address using OpenStreetMap Nominatim
    """
    address_data = {
        'address_line_1': request.data.get('address_line_1', ''),
        'address_line_2': request.data.get('address_line_2', ''),
        'area': request.data.get('area', ''),
        'city': request.data.get('city', ''),
        'landmark': request.data.get('landmark', ''),
        'postal_code': request.data.get('postal_code', ''),
    }
    
    result = GeocodingService.geocode_address(address_data)
    return Response(result)
