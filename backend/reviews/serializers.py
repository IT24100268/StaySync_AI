from rest_framework import serializers
from .models import RoomReview, RestaurantReview

class RoomReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    room_title = serializers.CharField(source='room.title', read_only=True)
    room_image = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomReview
        fields = [
            'id',
            'room',
            'user',
            'user_name',
            'room_title',
            'room_image',
            'rating',
            'comment',
            'created_at',
        ]
        read_only_fields = ['user', 'created_at']

    def get_room_image(self, obj):
        first_image = obj.room.images.first()
        if not first_image or not first_image.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(first_image.image.url)
        return first_image.image.url

class RestaurantReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_image = serializers.SerializerMethodField()
    
    class Meta:
        model = RestaurantReview
        fields = [
            'id',
            'restaurant',
            'user',
            'user_name',
            'restaurant_name',
            'restaurant_image',
            'rating',
            'comment',
            'created_at',
        ]
        read_only_fields = ['user', 'created_at']

    def get_restaurant_image(self, obj):
        profile = getattr(getattr(obj.restaurant, "owner", None), "restaurant_profile", None)
        image = getattr(profile, "display_image", None)
        if not image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(image.url)
        return image.url
