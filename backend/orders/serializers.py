from rest_framework import serializers
from orders.models import Order, OrderItem
from restaurant.models import Order as RestaurantOrder, OrderItem as RestaurantOrderItem, FoodItem
from restaurants.models import Restaurant, Menu
from restaurants.serializers import MenuSerializer, RestaurantSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuSerializer(read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_id', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.IntegerField(write_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_address = serializers.CharField(source='restaurant.address', read_only=True)
    restaurant_contact = serializers.CharField(source='restaurant.contact_number', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'student', 'student_name', 'restaurant', 'restaurant_id', 'restaurant_name', 
                  'restaurant_address', 'restaurant_contact', 'items', 'order_type', 'food_price', 
                  'delivery_charge', 'total_price', 'payment_method', 'status', 'delivery_address', 
                  'preparation_time', 'estimated_delivery_time', 'rejection_reason', 
                  'created_at', 'updated_at']
        read_only_fields = ['student', 'restaurant', 'status', 'created_at', 'updated_at', 'items', 
                           'delivery_charge', 'estimated_delivery_time']
    
    def validate_restaurant_id(self, value):
        if not Restaurant.objects.filter(id=value).exists():
            raise serializers.ValidationError("Restaurant not found")
        return value
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must have at least one item")
        for item in value:
            if not Menu.objects.filter(id=item['menu_item_id']).exists():
                raise serializers.ValidationError(f"Menu item {item['menu_item_id']} not found")
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        restaurant_id = validated_data.pop('restaurant_id')
        order_type = validated_data.get('order_type', 'delivery')
        food_price = validated_data.get('food_price', 0)
        delivery_charge = validated_data.get('delivery_charge', 0)
        
        # Create order in orders app
        order = Order.objects.create(
            student=validated_data['student'],
            restaurant_id=restaurant_id,
            order_type=order_type,
            food_price=food_price,
            delivery_charge=delivery_charge,
            total_price=validated_data.get('total_price', food_price + delivery_charge),
            payment_method=validated_data.get('payment_method', 'cod'),
            delivery_address=validated_data.get('delivery_address', ''),
            status='pending'
        )
        
        total_amount = 0
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            total_amount += item_data['price'] * item_data['quantity']
        
        return order
