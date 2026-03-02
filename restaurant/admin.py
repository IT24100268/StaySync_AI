from django.contrib import admin
from .models import FoodItem, Order, OrderItem, Restaurant


admin.site.register(Restaurant)
admin.site.register(FoodItem)
admin.site.register(Order)
admin.site.register(OrderItem)
