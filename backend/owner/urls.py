from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'listings', views.OwnerRoomViewSet, basename='owner-listings')

urlpatterns = [
    path('analytics/summary/', views.owner_analytics_summary, name='owner-analytics'),
    path('enquiries/', views.owner_enquiries, name='owner-enquiries'),
    path('enquiries/<int:booking_id>/status/', views.update_booking_status, name='update-booking-status'),
    path('listings/<int:pk>/photos/', views.upload_room_photos, name='upload-photos'),
    path('', include(router.urls)),
]
