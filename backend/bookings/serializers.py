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
    
    def validate_message(self, value):
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError('Message must be at least 10 characters')
        return value
    
    def validate_room_id(self, value):
        from rooms.models import Room
        if not Room.objects.filter(id=value).exists():
            raise serializers.ValidationError('Room does not exist')
        return value
