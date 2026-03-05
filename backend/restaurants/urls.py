from django.urls import path
from .views import RestaurantListView, RestaurantDetailView, RestaurantMenuView

urlpatterns = [
    path('', RestaurantListView.as_view(), name='restaurant-list'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('<int:pk>/menu/', RestaurantMenuView.as_view(), name='restaurant-menu'),
]
