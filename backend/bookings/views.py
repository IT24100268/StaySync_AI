from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models

from .models import Booking, BookingMessage
from .serializers import BookingMessageSerializer, BookingSerializer
from admin_panel.utils import create_admin_log


def get_owner_contacts_for_user(user):
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

    username = (user.username or '').strip()
    if username:
        contacts.append(username)

    normalized = []
    for contact in contacts:
        normalized.append(contact)
        normalized.append(contact[:20])

    deduped = []
    for contact in normalized:
        if contact and contact not in deduped:
            deduped.append(contact)
    return deduped


def can_access_booking(user, booking):
    if booking.student_id == user.id:
        return True

    owner_contacts = get_owner_contacts_for_user(user)
    return booking.room.owner_contact in owner_contacts

class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # Block booking if the room's owner is under verification
        if room:
            from users.models import HostelOwnerProfile
            owner_contact = room.owner_contact
            blocked = HostelOwnerProfile.objects.filter(
                is_under_verification=True
            ).filter(
                models.Q(phone_number=owner_contact) | models.Q(user__email=owner_contact)
            ).exists()
            if blocked:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('This room is temporarily unavailable while the owner completes verification.')

        booking = serializer.save(student=self.request.user)
        create_admin_log(
            actor=self.request.user,
            action='Room booking created',
            target_type='BOOKING',
            target_id=booking.id,
            details={
                'room_title': booking.room.title,
                'status': booking.status,
            }
        )

class BookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(student=self.request.user).order_by('-created_at')


class BookingMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_booking(self, booking_id):
        return generics.get_object_or_404(
            Booking.objects.select_related('room', 'student'),
            id=booking_id,
        )

    def get(self, request, booking_id):
        booking = self._get_booking(booking_id)
        if not can_access_booking(request.user, booking):
            return Response({'detail': 'You do not have access to this booking chat.'}, status=status.HTTP_403_FORBIDDEN)

        messages = booking.messages.select_related('sender').all()
        serializer = BookingMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, booking_id):
        booking = self._get_booking(booking_id)
        if not can_access_booking(request.user, booking):
            return Response({'detail': 'You do not have access to this booking chat.'}, status=status.HTTP_403_FORBIDDEN)

        text = str(request.data.get('text', '')).strip()
        image = request.FILES.get('image')

        if not text and not image:
            return Response({'detail': 'Message must include text or an image.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(text) > 2000:
            return Response({'detail': 'Message is too long (max 2000 chars).'}, status=status.HTTP_400_BAD_REQUEST)
        if image:
            content_type = str(getattr(image, 'content_type', '') or '').lower()
            if content_type and not content_type.startswith('image/'):
                return Response({'detail': 'Only image files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
            if getattr(image, 'size', 0) > 5 * 1024 * 1024:
                return Response({'detail': 'Image is too large (max 5MB).'}, status=status.HTTP_400_BAD_REQUEST)

        message = BookingMessage.objects.create(
            booking=booking,
            sender=request.user,
            text=text,
            image=image,
        )

        create_admin_log(
            actor=request.user,
            action='Booking chat message sent',
            target_type='BOOKING',
            target_id=booking.id,
            details={'booking_status': booking.status}
        )

        serializer = BookingMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
