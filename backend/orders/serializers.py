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
    student = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'student', 'restaurant', 'restaurant_id', 'items', 'total_price', 
                  'payment_method', 'status', 'delivery_address', 'created_at', 'updated_at']
        read_only_fields = ['student', 'restaurant', 'status', 'created_at', 'updated_at', 'items']
    
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
        items_data = validated_data.pop('items')
        restaurant_id = validated_data.pop('restaurant_id')
        
        # Create order in orders app
        order = Order.objects.create(
            student=validated_data['student'],
            restaurant_id=restaurant_id,
            total_price=validated_data['total_price'],
            payment_method=validated_data['payment_method'],
            delivery_address=validated_data['delivery_address']
        )
        
        total_amount = 0
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            total_amount += item_data['price'] * item_data['quantity']
        
        # Also create in restaurant app for dashboard
        try:
            from restaurant.models import Restaurant as RestaurantModel
            restaurant = RestaurantModel.objects.filter(id=restaurant_id).first()
            if restaurant:
                restaurant_order = RestaurantOrder.objects.create(
                    student=validated_data['student'],
                    restaurant=restaurant,
                    total_amount=total_amount,
                    status='PENDING'
                )
                
                # Create order items
                for item_data in items_data:
                    menu_item = Menu.objects.get(id=item_data['menu_item_id'])
                    # Try to find matching FoodItem - try exact match first, then partial
                    food_item = FoodItem.objects.filter(
                        restaurant=restaurant,
                        name__iexact=menu_item.name
                    ).first()
                    
                    if not food_item:
                        # Try partial match on first word
                        first_word = menu_item.name.split()[0].lower()
                        food_item = FoodItem.objects.filter(
                            restaurant=restaurant,
                            name__icontains=first_word
                        ).first()
                    
                    if not food_item:
                        # Create a FoodItem if it doesn't exist
                        food_item = FoodItem.objects.create(
                            restaurant=restaurant,
                            name=menu_item.name,
                            price=item_data['price'],
                            is_available=True
                        )
                    
                    RestaurantOrderItem.objects.create(
                        order=restaurant_order,
                        food_item=food_item,
                        quantity=item_data['quantity'],
                        subtotal=item_data['price'] * item_data['quantity']
                    )
        except Exception as e:
            print(f"Failed to create restaurant order: {e}")
        
        return order
