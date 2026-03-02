from rest_framework.permissions import BasePermission

from .models import FoodItem, Order, Restaurant


class IsRestaurantOwner(BasePermission):
    message = 'You do not have permission to access this restaurant data.'

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Restaurant):
            return obj.owner_id == request.user.id
        if isinstance(obj, FoodItem):
            return obj.restaurant.owner_id == request.user.id
        if isinstance(obj, Order):
            return obj.restaurant.owner_id == request.user.id
        restaurant = getattr(obj, 'restaurant', None)
        if restaurant:
            return restaurant.owner_id == request.user.id
        return False
