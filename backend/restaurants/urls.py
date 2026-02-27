from django.urls import path
from .views import RestaurantListView, RestaurantDetailView, MenuListView

urlpatterns = [
    path('', RestaurantListView.as_view(), name='restaurant-list'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('<int:restaurant_id>/menu/', MenuListView.as_view(), name='menu-list'),
]
