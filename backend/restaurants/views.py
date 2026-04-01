from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Menu, Restaurant
from .serializers import MenuSerializer, RestaurantSerializer
from restaurant.models import FoodItem as LegacyFoodItem
from restaurant.models import Restaurant as LegacyRestaurant


def sync_legacy_restaurants_and_menu():
    """
    Bridge legacy `restaurant` app data into `restaurants` app tables.
    Student endpoints and order creation use `restaurants` models, while
    restaurant-owner dashboard currently writes to legacy models.
    """
    legacy_rows = LegacyRestaurant.objects.select_related('owner').all()

    for legacy in legacy_rows:
        approved_flag = bool(legacy.is_approved or getattr(legacy.owner, 'is_approved', False))
        target_status = 'APPROVED' if approved_flag else 'PENDING'

        mapped = Restaurant.objects.filter(owner=legacy.owner).first()
        if not mapped:
            mapped = Restaurant.objects.create(
                owner=legacy.owner,
                name=legacy.name,
                email=legacy.email,
                phone=legacy.phone,
                address=legacy.address,
                latitude=legacy.latitude,
                longitude=legacy.longitude,
                is_approved=approved_flag,
                status=target_status,
                image=getattr(getattr(legacy.owner, 'restaurant_profile', None), 'display_image', None),
            )
        else:
            changed = False
            for field, value in (
                ('name', legacy.name),
                ('email', legacy.email),
                ('phone', legacy.phone),
                ('address', legacy.address),
                ('latitude', legacy.latitude),
                ('longitude', legacy.longitude),
            ):
                if getattr(mapped, field) != value:
                    setattr(mapped, field, value)
                    changed = True

            locked_statuses = {'REJECTED', 'SUSPENDED', 'NEEDS_CHANGES'}
            status_mutable = mapped.status not in locked_statuses

            if status_mutable and mapped.is_approved != approved_flag:
                mapped.is_approved = approved_flag
                changed = True

            if status_mutable and mapped.status != target_status:
                mapped.status = target_status
                changed = True

            if changed:
                mapped.save()

        legacy_foods = LegacyFoodItem.objects.filter(restaurant=legacy).order_by('-created_at')
        for legacy_food in legacy_foods:
            menu_item, _ = Menu.objects.get_or_create(
                restaurant=mapped,
                name=legacy_food.name,
                defaults={
                    'description': legacy_food.description,
                    'price': legacy_food.price,
                    'is_available': legacy_food.is_available,
                },
            )

            menu_changed = False
            if menu_item.description != legacy_food.description:
                menu_item.description = legacy_food.description
                menu_changed = True
            if menu_item.price != legacy_food.price:
                menu_item.price = legacy_food.price
                menu_changed = True
            if menu_item.is_available != legacy_food.is_available:
                menu_item.is_available = legacy_food.is_available
                menu_changed = True

            legacy_image = getattr(legacy_food, 'image', None)
            if legacy_image and getattr(legacy_image, 'name', ''):
                if not menu_item.image or menu_item.image.name != legacy_image.name:
                    menu_item.image = legacy_image
                    menu_changed = True

            if menu_changed:
                menu_item.save()


class RestaurantListView(generics.ListAPIView):
    """Public list of restaurants for students"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sync_legacy_restaurants_and_menu()
        return Restaurant.objects.filter(status='APPROVED').order_by('-created_at')


class RestaurantDetailView(generics.RetrieveAPIView):
    """Restaurant detail with menu items"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sync_legacy_restaurants_and_menu()
        return Restaurant.objects.filter(status='APPROVED')


class RestaurantMenuView(generics.ListAPIView):
    """Get menu items for a specific restaurant"""
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        sync_legacy_restaurants_and_menu()
        restaurant_id = self.kwargs.get('pk')
        return Menu.objects.filter(restaurant_id=restaurant_id, is_available=True).order_by('-created_at')
