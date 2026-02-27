from rest_framework import serializers
from .models import Room, RoomImage, Favorite

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image']

class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, room=obj).exists()
        return False

class FavoriteSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'room', 'created_at']
