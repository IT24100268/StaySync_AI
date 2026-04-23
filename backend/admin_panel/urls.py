from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomAdminViewSet, RestaurantAdminViewSet, DeliveryPartnerAdminViewSet,
    UserAdminViewSet, ReportViewSet, AdminLogViewSet, admin_analytics_summary,
    admin_orders_monitor, admin_analytics_detail, admin_dashboard_overview,
    AdminNotificationViewSet, admin_restaurant_menu, my_notifications
)

router = DefaultRouter()
router.register(r'rooms', RoomAdminViewSet, basename='admin-rooms')
router.register(r'restaurants', RestaurantAdminViewSet, basename='admin-restaurants')
router.register(r'partners', DeliveryPartnerAdminViewSet, basename='admin-partners')
router.register(r'users', UserAdminViewSet, basename='admin-users')
router.register(r'reports', ReportViewSet, basename='admin-reports')
router.register(r'logs', AdminLogViewSet, basename='admin-logs')
router.register(r'notifications', AdminNotificationViewSet, basename='admin-notifications')

urlpatterns = [
    path('analytics/summary/', admin_analytics_summary, name='admin-analytics-summary'),
    path('analytics/detail/', admin_analytics_detail, name='admin-analytics-detail'),
    path('orders/monitor/', admin_orders_monitor, name='admin-orders-monitor'),
    path('dashboard/overview/', admin_dashboard_overview, name='admin-dashboard-overview'),
    path('restaurants/<int:restaurant_id>/menu/', admin_restaurant_menu, name='admin-restaurant-menu'),
    path('my-notifications/', my_notifications, name='my-notifications'),
    path('', include(router.urls)),
]
