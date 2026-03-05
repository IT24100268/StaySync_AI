from rest_framework.permissions import BasePermission
from .models import DeliveryPartner


class DeliveryPartnerOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return DeliveryPartner.objects.filter(user=request.user).exists()
