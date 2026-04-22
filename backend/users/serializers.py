from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, StudentProfile, HostelOwnerProfile, RestaurantOwnerProfile, DeliveryProfile


def build_media_url(request, file_field):
    if not file_field:
        return None
    if request:
        return request.build_absolute_uri(file_field.url)
    return file_field.url

class StudentProfileSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ['university', 'gender_preference', 'budget', 'phone_number', 'latitude', 'longitude', 'display_image']

    def get_display_image(self, obj):
        return build_media_url(self.context.get('request'), obj.display_image)

class HostelOwnerProfileSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = HostelOwnerProfile
        fields = ['hostel_name', 'address', 'latitude', 'longitude', 'phone_number', 'business_reg_no', 'display_image']

    def get_display_image(self, obj):
        return build_media_url(self.context.get('request'), obj.display_image)

class RestaurantOwnerProfileSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantOwnerProfile
        fields = ['restaurant_name', 'area', 'address', 'latitude', 'longitude', 'phone_number', 'display_image']

    def get_display_image(self, obj):
        return build_media_url(self.context.get('request'), obj.display_image)

class DeliveryProfileSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryProfile
        fields = ['vehicle_type', 'license_no', 'phone_number', 'display_image']

    def get_display_image(self, obj):
        return build_media_url(self.context.get('request'), obj.display_image)

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'user_type',
            'is_approved',
            'is_superuser',
            'is_staff',
            'profile',
        ]
    
    def get_profile(self, obj):
        if obj.user_type == 'student' and hasattr(obj, 'student_profile'):
            return StudentProfileSerializer(obj.student_profile, context=self.context).data
        elif obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            return HostelOwnerProfileSerializer(obj.hostel_profile, context=self.context).data
        elif obj.user_type == 'restaurant_owner' and hasattr(obj, 'restaurant_profile'):
            return RestaurantOwnerProfileSerializer(obj.restaurant_profile, context=self.context).data
        elif obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            return DeliveryProfileSerializer(obj.delivery_profile, context=self.context).data
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password], min_length=8)
    profile = serializers.DictField()
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'user_type', 'profile']
    
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters")
        return value
    
    def validate_user_type(self, value):
        valid_types = ['student', 'hostel_owner', 'restaurant_owner', 'delivery']
        if value not in valid_types:
            raise serializers.ValidationError("Invalid user type")
        return value
    
    def validate_profile(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Profile must be a valid object")
        
        # Validate phone number format
        phone = value.get('phone_number', '')
        if phone and not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("Invalid phone number format")
        
        return value
    
    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user_type = validated_data['user_type']
        display_image = profile_data.pop('display_image', None)
        
        # Auto-approve only students, others need admin approval
        if user_type == 'student':
            validated_data['is_approved'] = True
        else:
            validated_data['is_approved'] = False
        
        user = User.objects.create_user(**validated_data)
        
        # Create appropriate profile
        if user_type == 'student':
            StudentProfile.objects.create(user=user, display_image=display_image, **profile_data)
        elif user_type == 'hostel_owner':
            HostelOwnerProfile.objects.create(user=user, display_image=display_image, **profile_data)
        elif user_type == 'restaurant_owner':
            RestaurantOwnerProfile.objects.create(user=user, display_image=display_image, **profile_data)
        elif user_type == 'delivery':
            DeliveryProfile.objects.create(user=user, display_image=display_image, **profile_data)
            from delivery.models import DeliveryPartner
            DeliveryPartner.objects.create(
                user=user,
                phone=profile_data.get('phone_number', ''),
                vehicle_type=profile_data.get('vehicle_type', ''),
                vehicle_number=profile_data.get('license_no', ''),
                status='APPROVED' if user.is_approved else 'PENDING'
            )
        
        return user

class PendingUserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'user_type', 'is_approved', 'date_joined', 'profile']
    
    def get_profile(self, obj):
        if obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            return HostelOwnerProfileSerializer(obj.hostel_profile, context=self.context).data
        elif obj.user_type == 'restaurant_owner' and hasattr(obj, 'restaurant_profile'):
            return RestaurantOwnerProfileSerializer(obj.restaurant_profile, context=self.context).data
        elif obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            return DeliveryProfileSerializer(obj.delivery_profile, context=self.context).data
        return None
