from rest_framework import serializers
from django.db.models import Q
from .models import Room, RoomImage, Favorite
from users.models import User

class RoomImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomImage
        fields = ['id', 'image']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None

class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    hostel_owner_id = serializers.SerializerMethodField()
    hostel_name = serializers.SerializerMethodField()
    hostel_address = serializers.SerializerMethodField()
    hostel_image = serializers.SerializerMethodField()
    hostel_phone = serializers.SerializerMethodField()
    hostel_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'
    
    def validate_price(self, value):
        if value < 1000:
            raise serializers.ValidationError('Price must be at least LKR 1,000')
        if value > 1000000:
            raise serializers.ValidationError('Price seems too high')
        return value
    
    def validate_title(self, value):
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters')
        return value.strip()
    
    def validate_description(self, value):
        if value and len(value.strip()) < 20:
            raise serializers.ValidationError('Description must be at least 20 characters')
        return value
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, room=obj).exists()
        return False

    def _resolve_owner_payload(self, obj):
        contact = (obj.owner_contact or '').strip()
        cache_key = contact or '__missing__'
        cache = getattr(self, '_owner_payload_cache', {})
        if cache_key in cache:
            return cache[cache_key]

        payload = {
            'owner_id': None,
            'hostel_name': None,
            'hostel_address': None,
            'hostel_image': None,
            'hostel_phone': contact or None,
            'hostel_email': None,
        }

        if contact:
            owner_user = (
                User.objects.filter(user_type='hostel_owner')
                .select_related('hostel_profile')
                .filter(
                    Q(hostel_profile__phone_number=contact)
                    | Q(email=contact)
                    | Q(email__startswith=contact)
                )
                .first()
            )

            if owner_user and hasattr(owner_user, 'hostel_profile'):
                profile = owner_user.hostel_profile
                payload = {
                    'owner_id': owner_user.id,
                    'hostel_name': profile.hostel_name or None,
                    'hostel_address': profile.address or None,
                    'hostel_image': profile.display_image if getattr(profile, 'display_image', None) else None,
                    'hostel_phone': profile.phone_number or contact or None,
                    'hostel_email': owner_user.email or None,
                }

        cache[cache_key] = payload
        self._owner_payload_cache = cache
        return payload

    def _build_media_url(self, file_field):
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        return file_field.url

    def get_hostel_owner_id(self, obj):
        return self._resolve_owner_payload(obj).get('owner_id')

    def get_hostel_name(self, obj):
        return self._resolve_owner_payload(obj).get('hostel_name')

    def get_hostel_address(self, obj):
        return self._resolve_owner_payload(obj).get('hostel_address')

    def get_hostel_image(self, obj):
        return self._build_media_url(self._resolve_owner_payload(obj).get('hostel_image'))

    def get_hostel_phone(self, obj):
        return self._resolve_owner_payload(obj).get('hostel_phone')

    def get_hostel_email(self, obj):
        return self._resolve_owner_payload(obj).get('hostel_email')

class FavoriteSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'room', 'created_at']
