from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('student', 'Student'),
        ('hostel_owner', 'Hostel Owner'),
        ('restaurant_owner', 'Restaurant Owner'),
        ('delivery', 'Delivery Partner'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.user_type}"


class DeliveryPartner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_index=True)
    is_online = models.BooleanField(default=False)
    rating = models.FloatField(default=5.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class Order(models.Model):
    STATUS_CHOICES = [
        ('ready', 'Ready'),
        ('assigned', 'Assigned'),
        ('picked', 'Picked'),
        ('onway', 'On the Way'),
        ('delivered', 'Delivered'),
    ]

    restaurant_name = models.CharField(max_length=200)
    student_name = models.CharField(max_length=200)
    pickup_address = models.TextField()
    drop_address = models.TextField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ready', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id}"


class Delivery(models.Model):
    DELIVERY_STATUS = [
        ('assigned', 'Assigned'),
        ('picked', 'Picked'),
        ('onway', 'On the Way'),
        ('delivered', 'Delivered'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='assigned', db_index=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery {self.id}"


class LiveLocation(models.Model):
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, db_index=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)


class Earnings(models.Model):
    partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE, db_index=True)
    delivery = models.OneToOneField(Delivery, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):
    partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)



class ApiRequestLog(models.Model):
    path = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status_code = models.IntegerField()
    execution_time = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code}"
