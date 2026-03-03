from rest_framework import serializers
from django.contrib.auth.models import User
from .models import OwnerProfile

class OwnerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField()
    phone = serializers.CharField()
    nic_passport = serializers.CharField()
    address = serializers.CharField()
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'phone', 'nic_passport', 'address']
    
    def create(self, validated_data):
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone'),
            'nic_passport': validated_data.pop('nic_passport'),
            'address': validated_data.pop('address'),
        }
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        OwnerProfile.objects.create(user=user, **profile_data)
        return user

class OwnerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = OwnerProfile
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'nic_passport', 
                  'address', 'verification_document', 'verification_status', 'created_at']
        read_only_fields = ['verification_status', 'created_at']
