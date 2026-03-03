from django.contrib import admin
from .models import OwnerProfile

@admin.register(OwnerProfile)
class OwnerProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'verification_status', 'created_at']
    list_filter = ['verification_status']
    search_fields = ['full_name', 'phone', 'nic_passport']
