from rest_framework import serializers
from django.contrib.auth.models import User
from .models import DeliveryPartner, Order, Delivery, ActivityLog, UserProfile


class UserSerializer(serializers.ModelSerializer):
    user_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type']
    
    def get_user_type(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.user_type
        return 'student'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        return value.strip()

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError('Password must be at least 6 characters long.')
        return value

    def validate_username(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        return value.strip()

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError('Password must be at least 6 characters long.')
        return value


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    user_type = serializers.ChoiceField(choices=['delivery', 'student', 'restaurant_owner', 'hostel_owner'])

    def validate_username(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        if User.objects.filter(username=value.strip()).exists():
            raise serializers.ValidationError('Username already exists.')
        return value.strip()

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value

    def validate_username(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        from django.contrib.auth.models import User
        if User.objects.filter(username=value.strip()).exists():
            raise serializers.ValidationError('Username already exists.')
        return value.strip()

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value

    def validate_email(self, value):
        if value:
            from django.contrib.auth.models import User
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError('Email already exists.')
        return value

    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        user = User.objects.create_user(**validated_data)
        
        # Create user profile with user_type
        UserProfile.objects.create(user=user, user_type=user_type)
        
        # Create delivery partner if user_type is delivery
        if user_type == 'delivery':
            DeliveryPartner.objects.create(user=user)
        
        return user


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

    def validate_total_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('Total amount cannot be negative.')
        if value > 1000000:
            raise serializers.ValidationError('Total amount exceeds maximum limit.')
        return value

    def validate_total_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('Total amount cannot be negative.')
        if value > 1000000:
            raise serializers.ValidationError('Total amount exceeds maximum limit.')
        return value


class DeliverySerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Delivery
        fields = '__all__'

    def validate_status(self, value):
        valid_statuses = ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled']
        if value and value.lower() not in valid_statuses:
            raise serializers.ValidationError(f'Invalid status. Must be one of: {', '.join(valid_statuses)}')
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
