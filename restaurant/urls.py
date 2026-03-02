from django.urls import path

from .views import (
    DashboardOverviewView,
    RestaurantFoodDetailView,
    RestaurantFoodListCreateView,
    RestaurantOrderDetailView,
    RestaurantOrderListView,
    RestaurantProfileView,
    ToggleFoodAvailabilityView,
    UpdateOrderStatusView,
)

urlpatterns = [
    path('profile/', RestaurantProfileView.as_view(), name='restaurant-profile'),
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='restaurant-dashboard-overview'),
    path('foods/', RestaurantFoodListCreateView.as_view(), name='restaurant-food-list-create'),
    path('foods/<int:pk>/', RestaurantFoodDetailView.as_view(), name='restaurant-food-detail'),
    path('foods/<int:food_item_id>/toggle-availability/', ToggleFoodAvailabilityView.as_view(), name='food-toggle-availability'),
    path('orders/', RestaurantOrderListView.as_view(), name='restaurant-order-list'),
    path('orders/<int:pk>/', RestaurantOrderDetailView.as_view(), name='restaurant-order-detail'),
    path('orders/<int:order_id>/status/', UpdateOrderStatusView.as_view(), name='update-order-status'),
]
