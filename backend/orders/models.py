from django.db import models
from users.models import User
from restaurants.models import Restaurant, Menu

class Order(models.Model):
    STATUS_CHOICES = [
        ('ordered', 'Ordered'),
        ('preparing', 'Preparing'),
        ('on_the_way', 'On The Way'),
        ('delivered', 'Delivered'),
    ]
    
    PAYMENT_CHOICES = [
        ('cod', 'Cash on Delivery'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cod')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ordered')
    delivery_address = models.TextField()
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
