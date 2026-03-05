from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import FoodItem, Order, OrderItem, Restaurant


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            'id',
            'owner',
            'name',
            'email',
            'phone',
            'address',
            'latitude',
            'longitude',
            'is_approved',
            'created_at',
        ]
        read_only_fields = ['id', 'owner', 'is_approved', 'created_at']


class FoodItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = FoodItem
        fields = [
            'id',
            'restaurant',
            'name',
            'description',
            'price',
            'image',
            'image_url',
            'is_available',
            'created_at',
        ]
        read_only_fields = ['id', 'restaurant', 'created_at', 'image_url']

    def validate_name(self, value):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError('Name must be at least 3 characters')
        return value.strip()

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price cannot be negative')
        if value > 100000:
            raise serializers.ValidationError('Price seems too high')
        return value

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food_item.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'food_item', 'food_name', 'quantity', 'subtotal']
        read_only_fields = ['id', 'food_name']


class OrderSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'student',
            'student_name',
            'restaurant',
            'total_amount',
            'status',
            'created_at',
            'items',
        ]
        read_only_fields = ['id', 'student', 'restaurant', 'total_amount', 'created_at', 'items', 'student_name']
    
    def get_student_name(self, obj):
        if hasattr(obj.student, 'first_name') and obj.student.first_name:
            return f"{obj.student.first_name} {obj.student.last_name}".strip()
        return obj.student.email or obj.student.username


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']

    def validate_status(self, value):
        valid = {choice[0] for choice in Order.Status.choices}
        if value not in valid:
            raise serializers.ValidationError('Invalid order status.')
        return value


class OrderCreateItemSerializer(serializers.Serializer):
    food_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1')
        if value > 100:
            raise serializers.ValidationError('Quantity cannot exceed 100')
        return value


class OrderCreateSerializer(serializers.Serializer):
    restaurant_id = serializers.IntegerField()
    items = OrderCreateItemSerializer(many=True)

    @transaction.atomic
    def create(self, validated_data):
        raise NotImplementedError('Student order creation is outside this dashboard module scope.')


class RestaurantRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    role = serializers.CharField(max_length=32, required=False, allow_blank=True, default='restaurant')
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    restaurant_name = serializers.CharField(max_length=255)
    restaurant_email = serializers.EmailField(max_length=255)
    phone = serializers.CharField(max_length=32)
    address = serializers.CharField()

    def validate_username(self, value):
        user_model = get_user_model()
        if user_model.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def validate_restaurant_email(self, value):
        if Restaurant.objects.filter(email=value).exists():
            raise serializers.ValidationError('Restaurant email already exists.')
        return value

    def validate_role(self, value):
        normalized = (value or '').strip().lower()
        if normalized != 'restaurant':
            raise serializers.ValidationError('Only role="restaurant" is supported for this endpoint.')
        return normalized

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user_model = get_user_model()
        role = validated_data.get('role', 'restaurant')
        user = user_model.objects.create_user(
            username=validated_data['username'],
            email=validated_data['restaurant_email'],
            password=validated_data['password'],
        )

        if hasattr(user, 'role'):
            user.role = role
            user.save(update_fields=['role'])

        restaurant = Restaurant.objects.create(
            owner=user,
            name=validated_data['restaurant_name'],
            email=validated_data['restaurant_email'],
            phone=validated_data['phone'],
            address=validated_data['address'],
        )

        return {'user': user, 'restaurant': restaurant, 'role': role}
