from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, StudentProfile, HostelOwnerProfile, RestaurantOwnerProfile, DeliveryProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['university', 'gender_preference', 'budget', 'phone_number']

class HostelOwnerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelOwnerProfile
        fields = ['hostel_name', 'address', 'phone_number', 'business_reg_no']

class RestaurantOwnerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantOwnerProfile
        fields = ['restaurant_name', 'address', 'phone_number']

class DeliveryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProfile
        fields = ['vehicle_type', 'license_no', 'phone_number']

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'is_approved', 'profile']
    
    def get_profile(self, obj):
        if obj.user_type == 'student' and hasattr(obj, 'student_profile'):
            return StudentProfileSerializer(obj.student_profile).data
        elif obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            return HostelOwnerProfileSerializer(obj.hostel_profile).data
        elif obj.user_type == 'restaurant_owner' and hasattr(obj, 'restaurant_profile'):
            return RestaurantOwnerProfileSerializer(obj.restaurant_profile).data
        elif obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            return DeliveryProfileSerializer(obj.delivery_profile).data
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    profile = serializers.JSONField()
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'user_type', 'profile']
    
    def validate_user_type(self, value):
        valid_types = ['student', 'hostel_owner', 'restaurant_owner', 'delivery']
        if value not in valid_types:
            raise serializers.ValidationError("Invalid user type")
        return value
    
    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user_type = validated_data['user_type']
        
        # Set is_approved based on user_type
        validated_data['is_approved'] = (user_type == 'student')
        
        user = User.objects.create_user(**validated_data)
        
        # Create appropriate profile
        if user_type == 'student':
            StudentProfile.objects.create(user=user, **profile_data)
        elif user_type == 'hostel_owner':
            HostelOwnerProfile.objects.create(user=user, **profile_data)
        elif user_type == 'restaurant_owner':
            RestaurantOwnerProfile.objects.create(user=user, **profile_data)
        elif user_type == 'delivery':
            DeliveryProfile.objects.create(user=user, **profile_data)
        
        return user

class PendingUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'is_approved', 'date_joined', 'profile']
    
    def get_profile(self, obj):
        if obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            return HostelOwnerProfileSerializer(obj.hostel_profile).data
        elif obj.user_type == 'restaurant_owner' and hasattr(obj, 'restaurant_profile'):
            return RestaurantOwnerProfileSerializer(obj.restaurant_profile).data
        elif obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            return DeliveryProfileSerializer(obj.delivery_profile).data
        return None
