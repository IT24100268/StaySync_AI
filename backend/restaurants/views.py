from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Restaurant, Menu
from .serializers import RestaurantSerializer, MenuSerializer

class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

class RestaurantDetailView(generics.RetrieveAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]

class MenuListView(generics.ListAPIView):
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        restaurant_id = self.kwargs.get('restaurant_id')
        return Menu.objects.filter(restaurant_id=restaurant_id, is_available=True)
