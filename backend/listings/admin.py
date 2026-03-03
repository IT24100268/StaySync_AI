from django.contrib import admin
from .models import Listing, ListingPhoto

class ListingPhotoInline(admin.TabularInline):
    model = ListingPhoto
    extra = 1

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'rent', 'room_type', 'availability_status', 'created_at']
    list_filter = ['room_type', 'availability_status', 'gender_allowed']
    search_fields = ['title', 'owner__full_name']
    inlines = [ListingPhotoInline]
