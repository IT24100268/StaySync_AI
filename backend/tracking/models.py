from django.db import models
from orders.models import Order

class Tracking(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='tracking')
    rider_name = models.CharField(max_length=255)
    rider_phone = models.CharField(max_length=20)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    eta_minutes = models.PositiveIntegerField(default=30)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Tracking for Order #{self.order.id}"
