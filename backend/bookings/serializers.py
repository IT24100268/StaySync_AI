from rest_framework import serializers
from .models import Booking, BookingMessage
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


class BookingMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = BookingMessage
        fields = ['id', 'booking', 'sender_id', 'sender_name', 'sender_role', 'text', 'image', 'created_at']
        read_only_fields = ['id', 'booking', 'sender_id', 'sender_name', 'sender_role', 'image', 'created_at']

    def get_sender_name(self, obj):
        full_name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return full_name or obj.sender.username or obj.sender.email

    def get_sender_role(self, obj):
        if obj.booking.student_id == obj.sender_id:
            return 'student'
        return 'owner'

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
