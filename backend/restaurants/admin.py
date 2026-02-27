from django.contrib import admin
from .models import Restaurant, Menu

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'latitude', 'longitude']

@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['restaurant', 'name', 'price', 'is_available']
    list_filter = ['restaurant', 'is_available']
