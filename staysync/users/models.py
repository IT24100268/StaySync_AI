from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):

    ROLE_CHOICES = (
        ('student', 'Student'),
        ('owner', 'Room Owner'),
        ('restaurant', 'Restaurant'),
        ('delivery', 'Delivery Partner'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return self.username