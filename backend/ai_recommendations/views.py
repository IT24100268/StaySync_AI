from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import RoomRecommendRequest, MealPlanRequest
from .room_recommender import recommend_rooms
from .meal_planner import generate_meal_plan


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommend_rooms_view(request):
    serializer = RoomRecommendRequest(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    d = serializer.validated_data
    try:
        results = recommend_rooms(
            area=d['area'],
            gender=d['gender'],
            total_budget=d['total_budget'],
            room_type=d['room_type'],
            facilities=d['facilities'],
            top_n=d['top_n'],
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not results:
        return Response(
            {'error': f"No rooms found matching your criteria in {d['area']}"},
            status=status.HTTP_404_NOT_FOUND
        )

    initial_rent_budget = int(d['total_budget'] * 0.40)
    return Response({
        'status':              'success',
        'total_budget':        d['total_budget'],
        'initial_rent_budget': initial_rent_budget,
        'initial_food_budget': d['total_budget'] - initial_rent_budget,
        'rooms_found':         len(results),
        'rooms':               results,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def meal_plan_view(request):
    serializer = MealPlanRequest(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    d = serializer.validated_data

    try:
        from rooms.models import Room
        room = Room.objects.get(hostel_id=d['hostel_id'], status='APPROVED')
    except Room.DoesNotExist:
        return Response({'error': f"Hostel '{d['hostel_id']}' not found"}, status=status.HTTP_404_NOT_FOUND)

    if not room.latitude or not room.longitude:
        return Response({'error': 'Selected room has no location data'}, status=status.HTTP_400_BAD_REQUEST)

    actual_rent = int(room.price)
    allow_partial = d['allow_partial']

    try:
        result = generate_meal_plan(
            hostel_lat=float(room.latitude),
            hostel_lng=float(room.longitude),
            hostel_area=room.area,
            monthly_total_budget=d['total_budget'],
            selected_room_rent=actual_rent,
            veg_only=d['veg_only'],
            allow_partial=allow_partial,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if result['status'] == 'needs_confirmation':
        return Response(result, status=status.HTTP_200_OK)

    if result['status'] != 'success':
        return Response({'error': result.get('message', 'Optimizer failed')}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status':    'success',
        'hostel_id': d['hostel_id'],
        'meal_plan': result['plan'],
        'summary':   result['summary'],
    })
