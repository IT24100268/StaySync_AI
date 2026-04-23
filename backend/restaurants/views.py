from collections import defaultdict

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Menu, Restaurant
from .serializers import MenuSerializer, RestaurantSerializer
from restaurant.models import FoodItem as LegacyFoodItem
from restaurant.models import Restaurant as LegacyRestaurant


def _first_non_empty(*values):
    for value in values:
        if value not in (None, ''):
            return value
    return None


def _sync_public_rows(owner, payload, approved_flag):
    target_status = 'APPROVED' if approved_flag else 'PENDING'
    public_rows = list(Restaurant.objects.filter(owner=owner).order_by('id'))

    if not public_rows:
        created = Restaurant.objects.create(
            owner=owner,
            name=payload['name'],
            email=payload['email'],
            phone=payload['phone'],
            address=payload['address'],
            latitude=payload['latitude'],
            longitude=payload['longitude'],
            is_approved=approved_flag,
            status=target_status,
        )
        return created

    locked_statuses = {'REJECTED', 'SUSPENDED', 'NEEDS_CHANGES'}
    for row in public_rows:
        changed_fields = []
        for field in ('name', 'email', 'phone', 'address', 'latitude', 'longitude'):
            next_value = payload[field]
            if getattr(row, field) != next_value:
                setattr(row, field, next_value)
                changed_fields.append(field)

        status_mutable = row.status not in locked_statuses

        # Only upgrade to APPROVED, never downgrade an admin-approved record
        if status_mutable and approved_flag and not row.is_approved:
            row.is_approved = True
            row.status = 'APPROVED'
            changed_fields.extend(['is_approved', 'status'])

        if changed_fields:
            row.save(update_fields=changed_fields)

    return public_rows[0]


def _sync_legacy_rows(legacy_rows, payload, approved_flag):
    for row in legacy_rows:
        changed_fields = []
        for field in ('name', 'email', 'phone', 'address', 'latitude', 'longitude'):
            next_value = payload[field]
            if getattr(row, field) != next_value:
                setattr(row, field, next_value)
                changed_fields.append(field)

        if row.is_approved != approved_flag:
            row.is_approved = approved_flag
            changed_fields.append('is_approved')

        if changed_fields:
            row.save(update_fields=changed_fields)


def _resolve_payload(owner, legacy_rows):
    profile = getattr(owner, 'restaurant_profile', None)
    latest_legacy = legacy_rows[-1] if legacy_rows else None

    profile_name = getattr(profile, 'restaurant_name', None) if profile else None
    profile_phone = getattr(profile, 'phone_number', None) if profile else None
    profile_address = getattr(profile, 'address', None) if profile else None
    profile_latitude = getattr(profile, 'latitude', None) if profile else None
    profile_longitude = getattr(profile, 'longitude', None) if profile else None
    has_profile_coordinates = (
        profile_latitude is not None
        and profile_longitude is not None
        and not (abs(profile_latitude) < 0.000001 and abs(profile_longitude) < 0.000001)
    )

    return {
        'name': _first_non_empty(profile_name, getattr(latest_legacy, 'name', None), owner.username, 'Restaurant'),
        'email': _first_non_empty(owner.email, getattr(latest_legacy, 'email', None), ''),
        'phone': _first_non_empty(profile_phone, getattr(latest_legacy, 'phone', None), ''),
        'address': _first_non_empty(profile_address, getattr(latest_legacy, 'address', None), ''),
        'latitude': _first_non_empty(
            profile_latitude if has_profile_coordinates else None,
            getattr(latest_legacy, 'latitude', None),
        ),
        'longitude': _first_non_empty(
            profile_longitude if has_profile_coordinates else None,
            getattr(latest_legacy, 'longitude', None),
        ),
    }


def sync_legacy_restaurants_and_menu():
    """
    Keep public student restaurant rows in sync with latest owner profile and legacy data.
    This avoids stale duplicate rows overriding map coordinates.
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

            # Only upgrade status (PENDING→APPROVED), never downgrade admin-approved records
            if status_mutable and approved_flag and not mapped.is_approved:
                mapped.is_approved = True
                mapped.status = 'APPROVED'
                changed = True

            if changed:
                mapped.save()

        legacy_foods = LegacyFoodItem.objects.filter(restaurant=legacy).order_by('-created_at')
        for legacy_food in legacy_foods:
            menu_item, created = Menu.objects.get_or_create(
                restaurant=mapped,
                name=legacy_food.name,
                price=legacy_food.price,
                defaults={
                    'description': legacy_food.description,
                    'is_available': legacy_food.is_available,
                },
            )

            if not created:
                menu_changed = False
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

    # Backfill owners who have profile/public rows but no legacy row yet.
    User = get_user_model()
    legacy_owner_ids = set(legacy_rows.values_list('owner_id', flat=True))
    owners_without_legacy = User.objects.filter(
        user_type='restaurant_owner',
        owned_restaurants__isnull=False,
    ).exclude(id__in=legacy_owner_ids).distinct()

    for owner in owners_without_legacy:
        payload = _resolve_payload(owner, [])
        approved_flag = bool(getattr(owner, 'is_approved', False))
        _sync_public_rows(owner, payload, approved_flag)


class RestaurantListView(generics.ListAPIView):
    """Public list of restaurants for students"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def _deduplicate_by_owner(self, queryset):
        seen_owner_ids = set()
        selected_ids = []

        for restaurant in queryset:
            if restaurant.owner_id in seen_owner_ids:
                continue
            seen_owner_ids.add(restaurant.owner_id)
            selected_ids.append(restaurant.id)

        return Restaurant.objects.filter(id__in=selected_ids).order_by('-created_at')

    def get_queryset(self):
        sync_legacy_restaurants_and_menu()
        qs = Restaurant.objects.filter(
            status='APPROVED',
            owner__is_blocked=False
        ).order_by('owner_id', '-created_at')
        return self._deduplicate_by_owner(qs)


class RestaurantDetailView(generics.RetrieveAPIView):
    """Restaurant detail with menu items"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sync_legacy_restaurants_and_menu()
        return Restaurant.objects.filter(status='APPROVED', owner__is_blocked=False)


class RestaurantMenuView(generics.ListAPIView):
    """Get menu items for a specific restaurant"""
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('pk')
        return Menu.objects.filter(
            restaurant_id=restaurant_id,
            is_available=True,
            restaurant__status='APPROVED',
            restaurant__owner__is_blocked=False
        ).order_by('-created_at')
