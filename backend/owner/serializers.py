from rest_framework import serializers
from rooms.models import Room, RoomImage


class OwnerRoomSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    rent = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    available = serializers.SerializerMethodField()
    views = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'title', 'description', 'price', 'rent', 'latitude', 'longitude',
            'location', 'facilities', 'gender_allowed', 'distance_from_university',
            'owner_contact', 'rules', 'status', 'available', 'views', 'created_at', 'images'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'owner_contact', 'rent', 'available', 'views', 'location']
    
    def get_images(self, obj):
        return [{'id': img.id, 'url': img.image.url} for img in obj.images.all()]
    
    def get_available(self, obj):
        return obj.status == 'APPROVED'
    
    def get_views(self, obj):
        return 0  # TODO: Implement view tracking
    
    def get_location(self, obj):
        if obj.latitude and obj.longitude:
            return f"{obj.latitude}, {obj.longitude}"
        return "Location not set"
