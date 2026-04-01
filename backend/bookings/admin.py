from django.contrib import admin
from .models import Booking, BookingMessage

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['student', 'room', 'status', 'created_at']
    list_filter = ['status']


@admin.register(BookingMessage)
class BookingMessageAdmin(admin.ModelAdmin):
    list_display = ['booking', 'sender', 'created_at']
    list_filter = ['created_at']
