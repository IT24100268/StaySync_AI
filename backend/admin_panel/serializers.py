from rest_framework import serializers
from django.db.models import Q
from .models import Report, AdminLog
from rooms.models import Room
from restaurants.models import Restaurant
from delivery.models import DeliveryPartner
from users.models import User
from orders.models import Order


def build_media_url(request, file_field):
    if not file_field:
        return None
    if request:
        return request.build_absolute_uri(file_field.url)
    return file_field.url


def get_hostel_owner_for_room(room):
    contact = (room.owner_contact or '').strip()
    if not contact:
        return None

    return (
        User.objects.filter(
            user_type='hostel_owner'
        )
        .filter(
            Q(hostel_profile__phone_number=contact)
            | Q(hostel_profile__phone_number__startswith=contact)
            | Q(email=contact)
            | Q(email__startswith=contact)
        )
        .select_related('hostel_profile')
        .first()
    )


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    
    class Meta:
        model = Report
        fields = ['id', 'reporter', 'reporter_username', 'target_type', 'target_id', 
                  'reason', 'description', 'status', 'admin_note', 'created_at', 'resolved_at']
        read_only_fields = ['reporter', 'created_at', 'resolved_at']


class AdminLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    actor_role = serializers.SerializerMethodField()
    target_user = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_username', 'actor_role', 'target_user', 'action', 'target_type', 
                  'target_id', 'details', 'created_at']
        read_only_fields = ['admin', 'created_at']

    def get_actor_role(self, obj):
        if obj.admin.is_staff or obj.admin.is_superuser:
            return 'administrator'
        return obj.admin.user_type

    def get_target_user(self, obj):
        if obj.target_type != 'USER':
            return None
        try:
            user = User.objects.get(id=obj.target_id)
        except User.DoesNotExist:
            return None
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'effective_role': 'administrator' if (user.is_staff or user.is_superuser) else user.user_type,
            'is_approved': user.is_approved,
            'is_blocked': user.is_blocked,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }


class RoomAdminSerializer(serializers.ModelSerializer):
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    images = serializers.SerializerMethodField()
    owner_display_image = serializers.SerializerMethodField()
    owner_username = serializers.SerializerMethodField()
    owner_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'title', 'description', 'price', 'status', 'review_note', 
                  'reviewed_at', 'reviewed_by', 'reviewed_by_username', 'created_at', 
                  'owner_contact', 'facilities', 'gender_allowed', 'images', 'owner_display_image',
                  'owner_username', 'owner_profile']
        read_only_fields = ['reviewed_at', 'reviewed_by', 'created_at']

    def get_images(self, obj):
        request = self.context.get('request')
        return [
            {
                'id': image.id,
                'image': build_media_url(request, image.image),
            }
            for image in obj.images.all()
        ]

    def get_owner_display_image(self, obj):
        request = self.context.get('request')
        owner = get_hostel_owner_for_room(obj)
        if owner and hasattr(owner, 'hostel_profile'):
            return build_media_url(request, owner.hostel_profile.display_image)
        return None

    def get_owner_username(self, obj):
        owner = get_hostel_owner_for_room(obj)
        return owner.username if owner else None

    def get_owner_profile(self, obj):
        owner = get_hostel_owner_for_room(obj)
        if not owner or not hasattr(owner, 'hostel_profile'):
            return None
        profile = owner.hostel_profile
        return {
            'hostel_name': profile.hostel_name,
            'address': profile.address,
            'phone_number': profile.phone_number,
            'business_reg_no': profile.business_reg_no,
            'display_image': build_media_url(self.context.get('request'), profile.display_image),
            'email': owner.email,
            'username': owner.username,
        }


class RestaurantAdminSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    owner_display_image = serializers.SerializerMethodField()
    owner_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'email', 'phone', 'address', 'owner', 'owner_username',
                  'status', 'review_note', 'reviewed_at', 'reviewed_by', 
                  'reviewed_by_username', 'created_at', 'owner_display_image', 'owner_profile']
        read_only_fields = ['owner', 'reviewed_at', 'reviewed_by', 'created_at']

    def get_owner_display_image(self, obj):
        if hasattr(obj.owner, 'restaurant_profile'):
            return build_media_url(self.context.get('request'), obj.owner.restaurant_profile.display_image)
        return None

    def get_owner_profile(self, obj):
        if not hasattr(obj.owner, 'restaurant_profile'):
            return None
        profile = obj.owner.restaurant_profile
        return {
            'restaurant_name': profile.restaurant_name,
            'address': profile.address,
            'phone_number': profile.phone_number,
            'display_image': build_media_url(self.context.get('request'), profile.display_image),
            'email': obj.owner.email,
            'username': obj.owner.username,
        }



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
                'display_image': build_media_url(self.context.get('request'), profile.display_image),
            }
        if obj.user_type == 'hostel_owner' and hasattr(obj, 'hostel_profile'):
            profile = obj.hostel_profile
            return {
                'hostel_name': profile.hostel_name,
                'address': profile.address,
                'phone_number': profile.phone_number,
                'business_reg_no': profile.business_reg_no,
                'display_image': build_media_url(self.context.get('request'), profile.display_image),
            }
        if obj.user_type == 'delivery' and hasattr(obj, 'delivery_profile'):
            profile = obj.delivery_profile
            return {
                'vehicle_type': profile.vehicle_type,
                'license_no': profile.license_no,
                'phone_number': profile.phone_number,
                'display_image': build_media_url(self.context.get('request'), profile.display_image),
            }
        return None


class DeliveryPartnerAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(read_only=True)
    vehicle_type = serializers.CharField(read_only=True)
    vehicle_number = serializers.CharField(read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    partner_display_image = serializers.SerializerMethodField()
    partner_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryPartner
        fields = ['id', 'user', 'username', 'email', 'phone', 'vehicle_type', 'vehicle_number',
                  'rating', 'status', 'review_note', 'reviewed_at', 'reviewed_by', 
                  'reviewed_by_username', 'created_at', 'is_online', 'partner_display_image',
                  'partner_profile']
        read_only_fields = ['user', 'reviewed_at', 'reviewed_by', 'created_at']

    def get_partner_display_image(self, obj):
        if hasattr(obj.user, 'delivery_profile'):
            return build_media_url(self.context.get('request'), obj.user.delivery_profile.display_image)
        return None

    def get_partner_profile(self, obj):
        if not hasattr(obj.user, 'delivery_profile'):
            return None
        profile = obj.user.delivery_profile
        return {
            'username': obj.user.username,
            'email': obj.user.email,
            'phone_number': profile.phone_number,
            'vehicle_type': profile.vehicle_type,
            'license_no': profile.license_no,
            'display_image': build_media_url(self.context.get('request'), profile.display_image),
        }


class AdminOrderMonitorSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_address = serializers.CharField(source='restaurant.address', read_only=True)
    delivery_partner_name = serializers.SerializerMethodField()
    delivery_partner_email = serializers.SerializerMethodField()
    room_context = serializers.SerializerMethodField()
    items_preview = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'student_name',
            'student_email',
            'restaurant_name',
            'restaurant_address',
            'delivery_partner_name',
            'delivery_partner_email',
            'room_context',
            'items_preview',
            'items_count',
            'order_type',
            'food_price',
            'delivery_charge',
            'total_price',
            'payment_method',
            'status',
            'delivery_address',
            'preparation_time',
            'estimated_delivery_time',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]

    def get_delivery_partner_name(self, obj):
        return obj.delivery_partner.username if obj.delivery_partner else None

    def get_delivery_partner_email(self, obj):
        return obj.delivery_partner.email if obj.delivery_partner else None

    def get_room_context(self, obj):
        latest_booking = getattr(obj.student, 'latest_approved_booking', None)
        if latest_booking is None:
            latest_booking = (
                obj.student.bookings.select_related('room')
                .filter(status='approved')
                .order_by('-updated_at', '-created_at')
                .first()
            )

        if not latest_booking:
            return None

        room = latest_booking.room
        return {
            'booking_id': latest_booking.id,
            'room_id': room.id,
            'room_title': room.title,
            'room_address': room.address,
            'room_price': room.price,
            'owner_contact': room.owner_contact,
        }

    def get_items_preview(self, obj):
        items = getattr(obj, 'prefetched_items', None) or obj.items.select_related('menu_item').all()
        preview = []
        for item in items[:3]:
            preview.append({
                'name': item.menu_item.name,
                'quantity': item.quantity,
                'price': item.price,
            })
        return preview

    def get_items_count(self, obj):
        items = getattr(obj, 'prefetched_items', None) or obj.items.all()
        return len(items)
