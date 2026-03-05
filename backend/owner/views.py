from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rooms.models import Room, RoomImage
from bookings.models import Booking
from .serializers import OwnerRoomSerializer
import logging

logger = logging.getLogger(__name__)


def get_owner_contact(user):
    """Get owner contact from profile or email"""
    try:
        if hasattr(user, 'hostel_profile'):
            return user.hostel_profile.phone_number
    except:
        pass
    return user.email


class OwnerRoomViewSet(viewsets.ModelViewSet):
    serializer_class = OwnerRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Owner sees only their own rooms
        owner_contact = get_owner_contact(self.request.user)
        return Room.objects.filter(owner_contact=owner_contact).order_by('-created_at')
    
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
            
            # Set owner contact and status
            data['owner_contact'] = get_owner_contact(request.user)
            data['status'] = 'PENDING'
            
            logger.info(f"Processed data: {data}")
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
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
        # Toggle between APPROVED and SUSPENDED
        if available:
            room.status = 'APPROVED' if room.status == 'SUSPENDED' else room.status
        else:
            room.status = 'SUSPENDED'
        room.save()
        return Response(self.get_serializer(room).data)
    
    @action(detail=True, methods=['post'], url_path='photos')
    def photos(self, request, pk=None):
        room = self.get_object()
        photos = request.FILES.getlist('photos')
        for photo in photos:
            RoomImage.objects.create(room=room, image=photo)
        return Response({'message': 'Photos uploaded'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_room_photos(request, pk):
    """Upload photos for a room listing"""
    try:
        owner_contact = get_owner_contact(request.user)
        room = Room.objects.get(pk=pk, owner_contact=owner_contact)
        
        photos = request.FILES.getlist('photos')
        for photo in photos:
            RoomImage.objects.create(room=room, image=photo)
        
        return Response({'message': f'{len(photos)} photos uploaded successfully'}, status=status.HTTP_201_CREATED)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_analytics_summary(request):
    """Get owner dashboard analytics"""
    owner_contact = get_owner_contact(request.user)
    rooms = Room.objects.filter(owner_contact=owner_contact)
    
    return Response({
        'listings': rooms.count(),
        'views': sum(getattr(r, 'views', 0) for r in rooms),
        'enquiries': 0,  # TODO: Connect to bookings
        'revenue': 0,  # TODO: Connect to payments
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_enquiries(request):
    """Get bookings/enquiries for owner's rooms"""
    owner_contact = get_owner_contact(request.user)
    rooms = Room.objects.filter(owner_contact=owner_contact)
    room_ids = list(rooms.values_list('id', flat=True))
    
    bookings = Booking.objects.filter(room_id__in=room_ids).select_related('student', 'room').order_by('-created_at')
    
    data = []
    for booking in bookings:
        data.append({
            'id': booking.id,
            'room_title': booking.room.title,
            'room_id': booking.room.id,
            'student_name': f"{booking.student.first_name} {booking.student.last_name}".strip() or booking.student.email,
            'student_email': booking.student.email,
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
        owner_contact = get_owner_contact(request.user)
        rooms = Room.objects.filter(owner_contact=owner_contact)
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
