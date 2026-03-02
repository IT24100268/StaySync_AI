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


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    user_type = serializers.ChoiceField(choices=['delivery', 'student', 'restaurant_owner', 'hostel_owner'])

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


class DeliverySerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Delivery
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'
