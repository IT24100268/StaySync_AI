from rest_framework.permissions import BasePermission
from .models import DeliveryPartner


class DeliveryPartnerOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if getattr(request.user, 'user_type', '') != 'delivery':
            return False
            
        defaults = {
            'status': 'APPROVED' if getattr(request.user, 'is_approved', False) else 'PENDING'
        }
        if hasattr(request.user, 'delivery_profile'):
            defaults['phone'] = getattr(request.user.delivery_profile, 'phone_number', '')
            defaults['vehicle_type'] = getattr(request.user.delivery_profile, 'vehicle_type', '')
            defaults['vehicle_number'] = getattr(request.user.delivery_profile, 'license_no', '')
            
        DeliveryPartner.objects.get_or_create(
            user=request.user,
            defaults=defaults
        )
        return True
