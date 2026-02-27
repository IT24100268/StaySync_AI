from rest_framework import serializers
from .models import Order, OrderItem
from restaurants.serializers import MenuSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuSerializer(read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_id', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    restaurant_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'restaurant', 'restaurant_id', 'items', 'total_price', 
                  'payment_method', 'status', 'delivery_address', 'created_at', 'updated_at']
        read_only_fields = ['status', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order
