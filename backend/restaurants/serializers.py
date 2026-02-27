from rest_framework import serializers
from .models import Restaurant, Menu

class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = ['id', 'name', 'price', 'description', 'image', 'is_available']

class RestaurantSerializer(serializers.ModelSerializer):
    menu_items = MenuSerializer(many=True, read_only=True)
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'latitude', 'longitude', 'image', 'menu_items']
