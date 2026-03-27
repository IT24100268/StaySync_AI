from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import RoomReview, RestaurantReview
from .serializers import RoomReviewSerializer, RestaurantReviewSerializer


def get_owner_contacts(user):
    contacts = []
    try:
        phone = (user.hostel_profile.phone_number or "").strip()
        if phone:
            contacts.append(phone)
    except Exception:
        pass

    email = (user.email or "").strip()
    if email:
        contacts.append(email)
        contacts.append(email[:20])

    deduped = []
    for contact in contacts:
        if contact and contact not in deduped:
            deduped.append(contact)
    return deduped


class RoomReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RoomReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = RoomReview.objects.select_related("room", "user").order_by("-created_at")

        if getattr(user, "user_type", "") == "student":
            return queryset.filter(user=user)

        if getattr(user, "user_type", "") == "hostel_owner":
            owner_contacts = get_owner_contacts(user)
            return queryset.filter(room__owner_contact__in=owner_contacts)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RestaurantReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = RestaurantReview.objects.select_related("restaurant", "user").order_by("-created_at")

        if getattr(user, "user_type", "") == "student":
            return queryset.filter(user=user)

        if getattr(user, "user_type", "") == "restaurant_owner":
            return queryset.filter(restaurant__owner=user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
