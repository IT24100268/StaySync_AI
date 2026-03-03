from rest_framework import serializers
from .models import Listing, ListingPhoto

class ListingPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingPhoto
        fields = ['id', 'image', 'uploaded_at']

class ListingSerializer(serializers.ModelSerializer):
    photos = ListingPhotoSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Listing
        fields = ['id', 'title', 'rent', 'deposit', 'room_type', 'gender_allowed',
                  'availability_status', 'wifi', 'water', 'electricity', 'parking',
                  'attached_bathroom', 'ac', 'latitude', 'longitude', 'views_count',
                  'created_at', 'updated_at', 'photos', 'uploaded_images']
        read_only_fields = ['views_count', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        listing = Listing.objects.create(**validated_data)
        
        for image in uploaded_images:
            ListingPhoto.objects.create(listing=listing, image=image)
        
        return listing
    
    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        for image in uploaded_images:
            ListingPhoto.objects.create(listing=instance, image=image)
        
        return instance
