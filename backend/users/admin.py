from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, HostelOwnerProfile, RestaurantOwnerProfile, DeliveryProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_approved', 'is_staff', 'date_joined']
    list_filter = ['user_type', 'is_approved', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('user_type', 'is_approved')}),
    )
    actions = ['approve_users']
    
    def approve_users(self, request, queryset):
        queryset.update(is_approved=True)
    approve_users.short_description = "Approve selected users"

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'university', 'phone_number', 'budget', 'created_at']
    search_fields = ['user__email', 'university']

@admin.register(HostelOwnerProfile)
class HostelOwnerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'hostel_name', 'phone_number', 'created_at']
    search_fields = ['user__email', 'hostel_name']

@admin.register(RestaurantOwnerProfile)
class RestaurantOwnerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'restaurant_name', 'phone_number', 'created_at']
    search_fields = ['user__email', 'restaurant_name']

@admin.register(DeliveryProfile)
class DeliveryProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'license_no', 'phone_number', 'created_at']
    search_fields = ['user__email', 'license_no']
