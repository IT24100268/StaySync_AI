from django.contrib import admin
from .models import Room, RoomImage, Favorite

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'price', 'gender_allowed', 'distance_from_university']
    list_filter = ['gender_allowed']
    inlines = [RoomImageInline]

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'created_at']
