from rest_framework import serializers
from .models import Report, AdminLog
from rooms.models import Room
from restaurants.models import Restaurant
from delivery.models import DeliveryPartner
from users.models import User


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    
    class Meta:
        model = Report
        fields = ['id', 'reporter', 'reporter_username', 'target_type', 'target_id', 
                  'reason', 'description', 'status', 'admin_note', 'created_at', 'resolved_at']
        read_only_fields = ['reporter', 'created_at', 'resolved_at']


class AdminLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    
    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_username', 'action', 'target_type', 
                  'target_id', 'details', 'created_at']
        read_only_fields = ['admin', 'created_at']


class RoomAdminSerializer(serializers.ModelSerializer):
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Room
        fields = ['id', 'title', 'description', 'price', 'status', 'review_note', 
                  'reviewed_at', 'reviewed_by', 'reviewed_by_username', 'created_at', 
                  'owner_contact', 'facilities', 'gender_allowed']
        read_only_fields = ['reviewed_at', 'reviewed_by', 'created_at']


class RestaurantAdminSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'email', 'phone', 'address', 'owner', 'owner_username',
                  'status', 'review_note', 'reviewed_at', 'reviewed_by', 
                  'reviewed_by_username', 'created_at']
        read_only_fields = ['owner', 'reviewed_at', 'reviewed_by', 'created_at']



class UserAdminSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type', 'is_approved', 'is_blocked',
                  'block_reason', 'warnings_count', 'date_joined', 'last_login', 'profile']
        read_only_fields = ['date_joined', 'last_login']

    def get_profile(self, obj):
        if obj.user_type == 'restaurant_owner' and hasattr(obj, 'restaurant_profile'):
            profile = obj.restaurant_profile
            return {
                'restaurant_name': profile.restaurant_name,
                'address': profile.address,
                'phone_number': profile.phone_number,
            }
        if obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            profile = obj.hostel_profile
            return {
                'hostel_name': profile.hostel_name,
                'address': profile.address,
                'phone_number': profile.phone_number,
                'business_reg_no': profile.business_reg_no,
            }
        if obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            profile = obj.delivery_profile
            return {
                'vehicle_type': profile.vehicle_type,
                'license_no': profile.license_no,
                'phone_number': profile.phone_number,
            }
        return None


class DeliveryPartnerAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(read_only=True)
    vehicle_type = serializers.CharField(read_only=True)
    vehicle_number = serializers.CharField(read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = DeliveryPartner
        fields = ['id', 'user', 'username', 'email', 'phone', 'vehicle_type', 'vehicle_number',
                  'rating', 'status', 'review_note', 'reviewed_at', 'reviewed_by', 
                  'reviewed_by_username', 'created_at', 'is_online']
        read_only_fields = ['user', 'reviewed_at', 'reviewed_by', 'created_at']
