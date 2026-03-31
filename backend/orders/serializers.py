from decimal import Decimal

from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
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
        read_only_fields = ['id', 'menu_item']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.IntegerField(write_only=True)
    status = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_phone = serializers.SerializerMethodField()
    student_university = serializers.SerializerMethodField()
    student_display_image = serializers.SerializerMethodField()
    delivery_partner_id = serializers.SerializerMethodField()
    delivery_partner_name = serializers.SerializerMethodField()
    delivery_partner_phone = serializers.SerializerMethodField()
    delivery_partner_vehicle_type = serializers.SerializerMethodField()
    delivery_partner_vehicle_number = serializers.SerializerMethodField()
    delivery_partner_display_image = serializers.SerializerMethodField()
    rider_current_latitude = serializers.SerializerMethodField()
    rider_current_longitude = serializers.SerializerMethodField()
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_address = serializers.CharField(source='restaurant.address', read_only=True)
    restaurant_contact = serializers.CharField(source='restaurant.phone', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'student', 'student_name', 'student_email', 'student_phone', 'student_university',
                  'student_display_image', 'restaurant', 'restaurant_id', 'restaurant_name', 
                  'restaurant_address', 'restaurant_contact',
                  'delivery_partner_id', 'delivery_partner_name', 'delivery_partner_phone',
                  'delivery_partner_vehicle_type', 'delivery_partner_vehicle_number',
                  'delivery_partner_display_image',
                  'rider_current_latitude', 'rider_current_longitude',
                  'items', 'order_type', 'food_price', 
                  'delivery_charge', 'total_price', 'payment_method', 'status', 'delivery_address', 
                  'delivery_latitude', 'delivery_longitude',
                  'preparation_time', 'estimated_delivery_time', 'route_distance_km',
                  'route_duration_minutes', 'traffic_eta_minutes', 'total_eta_minutes',
                  'delivery_fee_raw', 'delivery_fee_rounded', 'maps_route_url',
                  'pickup_ready_at', 'estimated_delivery_at', 'ai_model_version', 'pricing_snapshot',
                  'rejection_reason',
                  'created_at', 'updated_at']
        read_only_fields = ['student', 'restaurant', 'status', 'created_at', 'updated_at',
                            'delivery_charge', 'estimated_delivery_time', 'route_distance_km',
                            'route_duration_minutes', 'traffic_eta_minutes', 'total_eta_minutes',
                            'delivery_fee_raw', 'delivery_fee_rounded', 'maps_route_url',
                            'pickup_ready_at', 'estimated_delivery_at', 'ai_model_version', 'pricing_snapshot']

    def _get_delivery_partner(self, obj):
        return obj.delivery_partner if getattr(obj, 'delivery_partner_id', None) else None

    def _get_delivery_flow(self, obj):
        snapshot = obj.pricing_snapshot if isinstance(obj.pricing_snapshot, dict) else {}
        flow = snapshot.get('_delivery_flow') if isinstance(snapshot.get('_delivery_flow'), dict) else {}
        return flow

    def _to_coordinate(self, value, axis):
        if value in (None, ''):
            return None
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return None

        if axis == 'lat' and not (-90 <= numeric <= 90):
            return None
        if axis == 'lng' and not (-180 <= numeric <= 180):
            return None
        return round(numeric, 6)

    def _get_tracking_obj(self, obj):
        try:
            return obj.tracking
        except ObjectDoesNotExist:
            return None

    def _get_rider_coordinate(self, obj, axis):
        tracking = self._get_tracking_obj(obj)
        if tracking:
            value = getattr(
                tracking,
                'current_latitude' if axis == 'lat' else 'current_longitude',
                None,
            )
            parsed = self._to_coordinate(value, axis)
            if parsed is not None:
                return parsed

        flow = self._get_delivery_flow(obj)
        flow_keys = (
            ('last_rider_latitude', 'accepted_rider_latitude')
            if axis == 'lat'
            else ('last_rider_longitude', 'accepted_rider_longitude')
        )

        for key in flow_keys:
            parsed = self._to_coordinate(flow.get(key), axis)
            if parsed is not None:
                return parsed
        return None

    def _is_pickup_confirmed(self, obj):
        flow = self._get_delivery_flow(obj)
        return bool(flow.get('picked_confirmed'))

    def get_status(self, obj):
        status_value = str(getattr(obj, 'status', '') or '')
        if (
            status_value == 'out_for_delivery' and
            str(getattr(obj, 'order_type', '') or '').lower() == 'delivery' and
            getattr(obj, 'delivery_partner_id', None) and
            not self._is_pickup_confirmed(obj)
        ):
            # Backward-compatibility normalization: treat legacy auto-transitioned rows as ready
            # until partner explicitly confirms pickup.
            return 'ready'
        return status_value

    def get_student_phone(self, obj):
        profile = getattr(obj.student, 'student_profile', None)
        return getattr(profile, 'phone_number', '') if profile else ''

    def get_student_university(self, obj):
        profile = getattr(obj.student, 'student_profile', None)
        return getattr(profile, 'university', '') if profile else ''

    def get_student_display_image(self, obj):
        profile = getattr(obj.student, 'student_profile', None)
        display_image = getattr(profile, 'display_image', None) if profile else None
        if not display_image:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(display_image.url)
        return display_image.url

    def get_delivery_partner_id(self, obj):
        partner = self._get_delivery_partner(obj)
        return partner.id if partner else None

    def get_delivery_partner_name(self, obj):
        partner = self._get_delivery_partner(obj)
        if not partner:
            return None
        full_name = f"{partner.first_name or ''} {partner.last_name or ''}".strip()
        return full_name or partner.username

    def get_delivery_partner_phone(self, obj):
        partner = self._get_delivery_partner(obj)
        if not partner:
            return None

        profile = getattr(partner, 'delivery_profile', None)
        profile_phone = getattr(profile, 'phone_number', '') if profile else ''
        if profile_phone:
            return profile_phone

        legacy_partner = getattr(partner, 'deliverypartner', None)
        legacy_phone = getattr(legacy_partner, 'phone', '') if legacy_partner else ''
        return legacy_phone or None

    def get_delivery_partner_vehicle_type(self, obj):
        partner = self._get_delivery_partner(obj)
        if not partner:
            return None

        profile = getattr(partner, 'delivery_profile', None)
        profile_type = getattr(profile, 'vehicle_type', '') if profile else ''
        if profile_type:
            return profile_type

        legacy_partner = getattr(partner, 'deliverypartner', None)
        legacy_type = getattr(legacy_partner, 'vehicle_type', '') if legacy_partner else ''
        return legacy_type or None

    def get_delivery_partner_vehicle_number(self, obj):
        partner = self._get_delivery_partner(obj)
        if not partner:
            return None

        profile = getattr(partner, 'delivery_profile', None)
        license_no = getattr(profile, 'license_no', '') if profile else ''
        if license_no:
            return license_no

        legacy_partner = getattr(partner, 'deliverypartner', None)
        vehicle_number = getattr(legacy_partner, 'vehicle_number', '') if legacy_partner else ''
        return vehicle_number or None

    def get_delivery_partner_display_image(self, obj):
        partner = self._get_delivery_partner(obj)
        if not partner:
            return None

        profile = getattr(partner, 'delivery_profile', None)
        display_image = getattr(profile, 'display_image', None) if profile else None
        if not display_image:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(display_image.url)
        return display_image.url

    def get_rider_current_latitude(self, obj):
        return self._get_rider_coordinate(obj, 'lat')

    def get_rider_current_longitude(self, obj):
        return self._get_rider_coordinate(obj, 'lng')
    
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

    def validate(self, attrs):
        order_type = attrs.get('order_type', 'delivery')
        if order_type == 'delivery':
            lat = attrs.get('delivery_latitude')
            lng = attrs.get('delivery_longitude')
            if lat in (None, '') or lng in (None, ''):
                raise serializers.ValidationError(
                    {'delivery_latitude': 'Delivery location is required for delivery orders.'}
                )
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        restaurant_id = validated_data.pop('restaurant_id')
        order_type = validated_data.get('order_type', 'delivery')
        food_price = Decimal(str(validated_data.get('food_price', 0) or 0))
        delivery_charge = Decimal(str(validated_data.get('delivery_charge', 0) or 0))
        
        # Persist all quote/location fields passed from OrderCreateView so order data stays consistent.
        order_payload = {
            'student': validated_data['student'],
            'restaurant_id': restaurant_id,
            'order_type': order_type,
            'food_price': food_price,
            'delivery_charge': delivery_charge,
            'total_price': validated_data.get('total_price', food_price + delivery_charge),
            'payment_method': validated_data.get('payment_method', 'cod'),
            'delivery_address': validated_data.get('delivery_address', ''),
            'status': validated_data.get('status', 'pending'),
            'delivery_latitude': validated_data.get('delivery_latitude'),
            'delivery_longitude': validated_data.get('delivery_longitude'),
            'preparation_time': validated_data.get('preparation_time'),
            'estimated_delivery_time': validated_data.get('estimated_delivery_time'),
            'route_distance_km': validated_data.get('route_distance_km'),
            'route_duration_minutes': validated_data.get('route_duration_minutes'),
            'traffic_eta_minutes': validated_data.get('traffic_eta_minutes'),
            'total_eta_minutes': validated_data.get('total_eta_minutes'),
            'delivery_fee_raw': validated_data.get('delivery_fee_raw'),
            'delivery_fee_rounded': validated_data.get('delivery_fee_rounded'),
            'maps_route_url': validated_data.get('maps_route_url', ''),
            'pickup_ready_at': validated_data.get('pickup_ready_at'),
            'estimated_delivery_at': validated_data.get('estimated_delivery_at'),
            'ai_model_version': validated_data.get('ai_model_version', ''),
            'pricing_snapshot': validated_data.get('pricing_snapshot', {}),
            'rejection_reason': validated_data.get('rejection_reason'),
        }
        order = Order.objects.create(**order_payload)
        
        total_amount = Decimal('0')
        for item_data in items_data:
            menu_item_id = item_data.get('menu_item_id')
            quantity = int(item_data.get('quantity', 1))
            menu_item = Menu.objects.filter(id=menu_item_id, restaurant_id=restaurant_id).first()
            if not menu_item:
                raise serializers.ValidationError(
                    {'items': [f'Menu item {menu_item_id} does not belong to selected restaurant.']}
                )

            unit_price = Decimal(str(menu_item.price))
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                price=unit_price,
            )
            total_amount += unit_price * Decimal(quantity)

        # Keep server-calculated totals consistent even if client payload differs.
        update_fields = []
        if not order.food_price or order.food_price == 0:
            order.food_price = total_amount
            update_fields.append('food_price')
        if order.total_price == 0:
            order.total_price = total_amount + delivery_charge
            update_fields.append('total_price')
        if update_fields:
            order.save(update_fields=update_fields)
        
        return order
