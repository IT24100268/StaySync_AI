from django.db import models
from users.models import User


class AdminNotification(models.Model):
    TYPE_CHOICES = [
        ('new_owner', 'New Owner Registration'),
        ('new_student', 'New Student Registration'),
        ('new_restaurant_owner', 'New Restaurant Owner'),
        ('new_delivery_partner', 'New Delivery Partner'),
        ('pending_room', 'Pending Room Approval'),
        ('pending_restaurant', 'Pending Restaurant Approval'),
        ('pending_partner', 'Pending Partner Approval'),
        ('new_report', 'New Report Submitted'),
        ('new_booking', 'New Booking'),
        ('new_order', 'New Order'),
        ('general', 'General'),
    ]

    title = models.CharField(max_length=255)
    body = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    is_read = models.BooleanField(default=False)
    target_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} - {self.title}"


class Report(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('INVESTIGATING', 'Investigating'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    ]
    
    TARGET_TYPES = [
        ('ROOM', 'Room'),
        ('RESTAURANT', 'Restaurant'),
        ('ORDER', 'Order'),
        ('USER', 'User'),
    ]
    
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    target_type = models.CharField(max_length=20, choices=TARGET_TYPES)
    target_id = models.IntegerField()
    reason = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.target_type} #{self.target_id} - {self.status}"


class AdminLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=50)
    target_id = models.IntegerField()
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.admin.username} - {self.action} - {self.created_at}"
