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

    return [c for c in contacts if c]


def get_primary_owner_contact(user):
    contacts = get_owner_contacts(user)
    return contacts[0] if contacts else ''


def get_owner_rooms(user):
    return Room.objects.filter(owner=user)


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
        return Room.objects.filter(owner=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        # Block room creation if owner is under verification
        try:
            if request.user.hostel_profile.is_under_verification:
                return Response(
                    {'error': 'Your account is under verification. You cannot add new rooms until the admin completes verification.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass
        try:
            data = dict(request.data)
            # Unwrap single-item lists from multipart (not needed for JSON but safe)
            data = {k: v[0] if isinstance(v, list) and len(v) == 1 and k != 'facilities' else v for k, v in data.items()}

            if 'rent' in data:
                data['price'] = data.pop('rent')
            if 'genderAllowed' in data:
                data['gender_allowed'] = data.pop('genderAllowed')

            data['latitude'] = data.get('latitude') or '0.0'
            data['longitude'] = data.get('longitude') or '0.0'
            data['distance_from_university'] = data.get('distance_from_university') or '0.0'
            data['rules'] = data.get('rules') or ''
            data['deposit'] = data.get('deposit') or '0'
            data['address'] = data.get('address') or ''
            if 'hostel_id' in data:
                data['hostel_id'] = str(data['hostel_id']).strip().upper()

            logger.info(f"Create room data: {data}")
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(
                owner=request.user,
                owner_contact=get_primary_owner_contact(request.user),
                status='APPROVED',
            )
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating room: {str(e)}", exc_info=True)
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
                    {'error': f'Room status is {room.status}. Only suspended rooms can be marked available.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if room.status == 'APPROVED':
                room.status = 'SUSPENDED'
            elif room.status != 'SUSPENDED':
                return Response(
                    {'error': f'Only approved rooms can be suspended.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        room.save()
        return Response(self.get_serializer(room).data)
    
    @action(detail=True, methods=['post'], url_path='photos')
    def photos(self, request, pk=None):
        room = self.get_object()
        sync_room_images(room, request)
        return Response({'message': 'Photos uploaded'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_hostel_id(request):
    import re
    hostel_id = request.query_params.get('hostel_id', '').strip().upper()
    if not hostel_id:
        return Response({'available': False, 'error': 'Hostel ID is required.'})
    if not re.match(r'^H\d{4}$', hostel_id):
        return Response({'available': False, 'error': 'Format must be H followed by 4 digits (e.g. H0010).'})
    exists = Room.objects.filter(hostel_id=hostel_id).exists()
    return Response({'available': not exists, 'error': 'This Hostel ID is already taken.' if exists else ''})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_room_photos(request, pk):
    """Upload photos for a room listing"""
    try:
        room = Room.objects.get(pk=pk, owner=request.user)

        sync_room_images(room, request)
        return Response({'message': f'{room.images.count()} photos saved successfully'}, status=status.HTTP_201_CREATED)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_analytics_summary(request):
    """Get owner dashboard analytics"""
    rooms = Room.objects.filter(owner=request.user)
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
    rooms = Room.objects.filter(owner=request.user)
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
        rooms = Room.objects.filter(owner=request.user)
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_verification_status(request):
    try:
        profile = request.user.hostel_profile
    except Exception:
        return Response({'error': 'Not a hostel owner'}, status=status.HTTP_403_FORBIDDEN)

    vr = None
    try:
        vr = request.user.verification_request
    except Exception:
        pass

    return Response({
        'is_under_verification': profile.is_under_verification,
        'verification_note': profile.verification_note,
        'verification': {
            'status': vr.status,
            'nic_passport_number': vr.nic_passport_number,
            'address_proof': vr.address_proof,
            'business_reg_no': vr.business_reg_no,
            'admin_note': vr.admin_note,
            'submitted_at': vr.submitted_at,
        } if vr else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def owner_submit_verification(request):
    from users.models import OwnerVerificationRequest
    from django.utils import timezone

    try:
        profile = request.user.hostel_profile
    except Exception:
        return Response({'error': 'Not a hostel owner'}, status=status.HTTP_403_FORBIDDEN)

    if not profile.is_under_verification:
        return Response({'error': 'No verification request pending.'}, status=status.HTTP_400_BAD_REQUEST)

    nic = request.data.get('nic_passport_number', '').strip()
    address = request.data.get('address_proof', '').strip()
    business = request.data.get('business_reg_no', '').strip()

    if not nic or not address:
        return Response({'error': 'NIC/Passport number and address proof are required.'}, status=status.HTTP_400_BAD_REQUEST)

    vr, _ = OwnerVerificationRequest.objects.get_or_create(owner=request.user)
    vr.nic_passport_number = nic
    vr.address_proof = address
    vr.business_reg_no = business
    vr.status = 'submitted'
    vr.submitted_at = timezone.now()

    if 'nic_doc' in request.FILES:
        vr.nic_doc = request.FILES['nic_doc']
    if 'address_doc' in request.FILES:
        vr.address_doc = request.FILES['address_doc']
    if 'business_doc' in request.FILES:
        vr.business_doc = request.FILES['business_doc']

    vr.save()
    return Response({'message': 'Verification form submitted successfully.'})
