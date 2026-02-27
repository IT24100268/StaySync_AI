from rest_framework import serializers
from .models import Booking
from rooms.serializers import RoomSerializer

class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'room', 'room_id', 'status', 'message', 'created_at', 'updated_at']
        read_only_fields = ['status', 'created_at', 'updated_at']
