from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomAdminViewSet, RestaurantAdminViewSet, DeliveryPartnerAdminViewSet,
    UserAdminViewSet, ReportViewSet, AdminLogViewSet, admin_analytics_summary
)

router = DefaultRouter()
router.register(r'rooms', RoomAdminViewSet, basename='admin-rooms')
router.register(r'restaurants', RestaurantAdminViewSet, basename='admin-restaurants')
router.register(r'partners', DeliveryPartnerAdminViewSet, basename='admin-partners')
router.register(r'users', UserAdminViewSet, basename='admin-users')
router.register(r'reports', ReportViewSet, basename='admin-reports')
router.register(r'logs', AdminLogViewSet, basename='admin-logs')

urlpatterns = [
    path('analytics/summary/', admin_analytics_summary, name='admin-analytics-summary'),
    path('', include(router.urls)),
]
