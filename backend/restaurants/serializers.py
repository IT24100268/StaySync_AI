from rest_framework import serializers
from .models import Restaurant, Menu


class RestaurantSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id',
            'restaurant_id',
            'owner',
            'name',
            'email',
            'phone',
            'address',
            'latitude',
            'longitude',
            'is_approved',
            'status',
            'review_note',
            'reviewed_at',
            'reviewed_by',
            'created_at',
            'image',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        # Use model image field first, fall back to owner profile
        image = obj.image
        if not image:
            profile = getattr(getattr(obj, 'owner', None), 'restaurant_profile', None)
            image = getattr(profile, 'display_image', None)
        if not image:
            return None
        if request:
            return request.build_absolute_uri(image.url)
        return image.url


class MenuSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'image', 'image_url', 'is_available', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
