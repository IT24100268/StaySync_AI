from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from restaurant.models import Restaurant, FoodItem
from restaurant.serializers import RestaurantSerializer, FoodItemSerializer


class RestaurantListView(generics.ListAPIView):
    """Public list of approved restaurants for students"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    queryset = Restaurant.objects.filter(is_approved=True)


class RestaurantDetailView(generics.RetrieveAPIView):
    """Restaurant detail with menu items"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    queryset = Restaurant.objects.filter(is_approved=True)


class RestaurantMenuView(generics.ListAPIView):
    """Get menu items for a specific restaurant"""
    serializer_class = FoodItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        restaurant_id = self.kwargs.get('pk')
        return FoodItem.objects.filter(restaurant_id=restaurant_id, is_available=True)
