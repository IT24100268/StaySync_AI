from django.db import models
from users.models import User
from restaurants.models import Restaurant, Menu

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready for Pickup'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
    ]
    
    ORDER_TYPE_CHOICES = [
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
    ]
    
    PAYMENT_CHOICES = [
        ('cod', 'Cash on Delivery'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    delivery_partner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='delivery')
    food_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cod')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    delivery_address = models.TextField()
    preparation_time = models.PositiveIntegerField(null=True, blank=True, help_text='Preparation time in minutes')
    estimated_delivery_time = models.PositiveIntegerField(null=True, blank=True, help_text='Estimated delivery time in minutes')
    
    rejection_reason = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order #{self.id} - {self.student.email}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(Menu, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"
