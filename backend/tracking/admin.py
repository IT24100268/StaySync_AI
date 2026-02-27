from django.contrib import admin
from .models import Tracking

@admin.register(Tracking)
class TrackingAdmin(admin.ModelAdmin):
    list_display = ['order', 'rider_name', 'rider_phone', 'eta_minutes', 'updated_at']
