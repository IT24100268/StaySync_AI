from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer
from admin_panel.utils import create_admin_log

class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
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
