from django.db import models
from django.contrib.auth.models import User

class OwnerProfile(models.Model):
    VERIFICATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owner_profile')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    nic_passport = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    verification_document = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.verification_status}"
