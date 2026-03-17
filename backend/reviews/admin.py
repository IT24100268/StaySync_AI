from django.contrib import admin
from .models import RoomReview, RestaurantReview

@admin.register(RoomReview)
class RoomReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']

@admin.register(RestaurantReview)
class RestaurantReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'restaurant', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
