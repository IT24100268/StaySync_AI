import logging

from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rooms.models import Room, RoomImage
from bookings.models import Booking
from .serializers import OwnerRoomSerializer

logger = logging.getLogger(__name__)


def build_media_url(request, file_field):
    if not file_field:
        return None
    try:
        return request.build_absolute_uri(file_field.url)
    except Exception:
        try:
            return file_field.url
        except Exception:
            return None


def get_owner_contacts(user):
    """Get all likely owner-contact values used in room records."""
    contacts = []

    try:
        phone = (user.hostel_profile.phone_number or '').strip()
        if phone:
            contacts.append(phone)
    except Exception:
        pass

    email = (user.email or '').strip()
    if email:
        contacts.append(email)

    # owner_contact is max_length=20, so include truncated variants too.
    normalized = []
    for contact in contacts:
        normalized.append(contact)
        normalized.append(contact[:20])

    deduped = []
    for contact in normalized:
        if contact and contact not in deduped:
            deduped.append(contact)
    return deduped


def get_primary_owner_contact(user):
    contacts = get_owner_contacts(user)
    return contacts[0] if contacts else ''


def get_owner_rooms(user):
    owner_contacts = get_owner_contacts(user)
    return Room.objects.filter(owner_contact__in=owner_contacts)


def sync_room_images(room, request):
    sync_existing = str(request.data.get('sync_existing', '')).lower() in ('1', 'true', 'yes')
    replace_existing = str(request.data.get('replace', '')).lower() in ('1', 'true', 'yes')

    if replace_existing:
        room.images.all().delete()
    elif sync_existing:
        keep_ids = set()
        for value in request.data.getlist('keep_existing_ids'):
            try:
                keep_ids.add(int(value))
            except (TypeError, ValueError):
                continue
        room.images.exclude(id__in=keep_ids).delete()

    for photo in request.FILES.getlist('photos'):
        RoomImage.objects.create(room=room, image=photo)


class OwnerRoomViewSet(viewsets.ModelViewSet):
    serializer_class = OwnerRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Owner sees only their own rooms
        owner_contacts = get_owner_contacts(self.request.user)
        return Room.objects.filter(owner_contact__in=owner_contacts).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        try:
            # Map frontend field names to backend model fields
            data = request.data.copy()
            logger.info(f"Received data: {data}")
            
            # Map fields
            if 'rent' in data:
                data['price'] = data.pop('rent')
            if 'genderAllowed' in data:
                data['gender_allowed'] = data.pop('genderAllowed')
            
            # Set defaults for required fields
            if 'latitude' not in data or not data['latitude']:
                data['latitude'] = '0.0'
            if 'longitude' not in data or not data['longitude']:
                data['longitude'] = '0.0'
            if 'distance_from_university' not in data:
                data['distance_from_university'] = '0.0'
            if 'rules' not in data:
                data['rules'] = ''
            if 'deposit' not in data:
                data['deposit'] = '0'
            if 'address' not in data:
                data['address'] = ''
            
            logger.info(f"Processed data: {data}")
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(
                owner_contact=get_primary_owner_contact(request.user),
                status='PENDING'
            )
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating room: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        try:
            # Map frontend field names to backend model fields
            data = request.data.copy()
            logger.info(f"Update received data: {data}")
            
            # Map fields
            if 'rent' in data:
                data['price'] = data.pop('rent')
            if 'genderAllowed' in data:
                data['gender_allowed'] = data.pop('genderAllowed')
            
            # Set defaults for optional fields
            if 'latitude' not in data or not data['latitude']:
                data['latitude'] = '0.0'
            if 'longitude' not in data or not data['longitude']:
                data['longitude'] = '0.0'
            if 'distance_from_university' not in data:
                data['distance_from_university'] = '0.0'
            if 'rules' not in data:
                data['rules'] = ''
            if 'deposit' not in data:
                data['deposit'] = '0'
            if 'address' not in data:
                data['address'] = ''
            
            logger.info(f"Processed update data: {data}")
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating room: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def availability(self, request, pk=None):
        room = self.get_object()
        available = request.data.get('available', True)

        # Owner can toggle only between APPROVED <-> SUSPENDED.
        # PENDING/REJECTED/NEEDS_CHANGES require admin review, so do not auto-approve here.
        if available:
            if room.status == 'SUSPENDED':
                room.status = 'APPROVED'
            elif room.status != 'APPROVED':
                return Response(
                    {
                        'error': f'Cannot mark as available while room status is {room.status}. '
                                 'Wait for admin approval or update based on review notes.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if room.status == 'APPROVED':
                room.status = 'SUSPENDED'
            elif room.status != 'SUSPENDED':
                return Response(
                    {'error': f'Room is currently {room.status}; availability toggle is only for approved listings.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        room.save()
        return Response(self.get_serializer(room).data)
    
    @action(detail=True, methods=['post'], url_path='photos')
    def photos(self, request, pk=None):
        room = self.get_object()
        sync_room_images(room, request)
        return Response({'message': 'Photos uploaded'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_room_photos(request, pk):
    """Upload photos for a room listing"""
    try:
        owner_contacts = get_owner_contacts(request.user)
        room = Room.objects.get(pk=pk, owner_contact__in=owner_contacts)

        sync_room_images(room, request)
        return Response({'message': f'{room.images.count()} photos saved successfully'}, status=status.HTTP_201_CREATED)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_analytics_summary(request):
    """Get owner dashboard analytics"""
    owner_contacts = get_owner_contacts(request.user)
    rooms = Room.objects.filter(owner_contact__in=owner_contacts)
    room_ids = list(rooms.values_list('id', flat=True))
    bookings = Booking.objects.filter(room_id__in=room_ids).select_related('room')

    approved_bookings = bookings.filter(status='approved')
    estimated_revenue = 0
    for booking in approved_bookings:
        estimated_revenue += getattr(booking.room, 'price', 0) or 0
    total_views = rooms.aggregate(total=Sum('views')).get('total') or 0
    
    return Response({
        'listings': rooms.count(),
        'views': int(total_views),
        'enquiries': bookings.count(),
        'revenue': estimated_revenue,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_enquiries(request):
    """Get bookings/enquiries for owner's rooms"""
    owner_contacts = get_owner_contacts(request.user)
    rooms = Room.objects.filter(owner_contact__in=owner_contacts)
    room_ids = list(rooms.values_list('id', flat=True))
    
    bookings = (
        Booking.objects.filter(room_id__in=room_ids)
        .select_related('student', 'student__student_profile', 'room')
        .order_by('-created_at')
    )
    
    data = []
    for booking in bookings:
        student_profile = getattr(booking.student, 'student_profile', None)
        data.append({
            'id': booking.id,
            'room_title': booking.room.title,
            'room_id': booking.room.id,
            'student_name': f"{booking.student.first_name} {booking.student.last_name}".strip() or booking.student.email,
            'student_email': booking.student.email,
            'student_phone': getattr(student_profile, 'phone_number', ''),
            'student_university': getattr(student_profile, 'university', ''),
            'student_display_image': build_media_url(request, getattr(student_profile, 'display_image', None)),
            'message': booking.message or '',
            'status': booking.status,
            'created_at': booking.created_at,
        })
    
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    """Approve or reject a booking"""
    try:
        owner_contacts = get_owner_contacts(request.user)
        rooms = Room.objects.filter(owner_contact__in=owner_contacts)
        room_ids = list(rooms.values_list('id', flat=True))
        
        booking = Booking.objects.get(id=booking_id, room_id__in=room_ids)
        new_status = request.data.get('status')
        
        if new_status not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = new_status
        booking.save()
        
        return Response({'message': f'Booking {new_status}', 'status': booking.status})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
