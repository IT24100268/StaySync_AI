from rest_framework import serializers
from .models import Order, Delivery, LiveLocation, Earnings, ActivityLog, DeliveryPartner


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"


class DeliverySerializer(serializers.ModelSerializer):
    order_details = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()
    drop_address = serializers.SerializerMethodField()
    earning_amount = serializers.SerializerMethodField()

    def get_order_details(self, obj):
        order = obj.order
        return {
            "id": order.id,
            "restaurant_name": order.restaurant_name,
            "drop_address": order.drop_address,
            "total_price": str(order.total_price),
            "student_name": order.student_name,
        }

    def get_restaurant_name(self, obj):
        return obj.order.restaurant_name

    def get_drop_address(self, obj):
        return obj.order.drop_address

    def get_earning_amount(self, obj):
        # Show computed earning even if Earnings row doesn't exist yet.
        if hasattr(obj, "earnings"):
            return str(obj.earnings.amount)
        return str(obj.order.total_price * 0.2)

    class Meta:
        model = Delivery
        fields = "__all__"


class LiveLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveLocation
        fields = "__all__"


class EarningsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Earnings
        fields = "__all__"


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = "__all__"


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = "__all__"
