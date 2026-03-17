from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomReviewViewSet, RestaurantReviewViewSet

router = DefaultRouter()
router.register(r'rooms', RoomReviewViewSet, basename='room-review')
router.register(r'restaurants', RestaurantReviewViewSet, basename='restaurant-review')

urlpatterns = [
    path('', include(router.urls)),
]
