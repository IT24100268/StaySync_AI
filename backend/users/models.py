from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string

class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ('student', 'Student'),
        ('hostel_owner', 'Hostel Owner'),
        ('restaurant_owner', 'Restaurant Owner'),
        ('delivery', 'Delivery Partner'),
    ]
    
    email = models.EmailField(unique=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='student')
    is_approved = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    block_reason = models.TextField(null=True, blank=True)
    warnings_count = models.IntegerField(default=0)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

class StudentProfile(models.Model):
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female'), ('any', 'Any')]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    university = models.CharField(max_length=255)
    gender_preference = models.CharField(max_length=10, choices=GENDER_CHOICES, default='any')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    display_image = models.ImageField(upload_to='student_profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class HostelOwnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hostel_profile')
    hostel_name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    business_reg_no = models.CharField(max_length=100, blank=True)
    display_image = models.ImageField(upload_to='owner_profiles/', null=True, blank=True)
    is_under_verification = models.BooleanField(default=False)
    verification_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class OwnerVerificationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_request')
    nic_passport_number = models.CharField(max_length=100, blank=True)
    address_proof = models.TextField(blank=True)
    business_reg_no = models.CharField(max_length=100, blank=True)
    nic_doc = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    address_doc = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    business_doc = models.FileField(upload_to='verification_docs/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.owner.username} - {self.status}"

class RestaurantOwnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='restaurant_profile')
    restaurant_name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    display_image = models.ImageField(upload_to='owner_profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class DeliveryProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_profile')
    vehicle_type = models.CharField(max_length=50)
    license_no = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    display_image = models.ImageField(upload_to='owner_profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# Keep old Profile for backward compatibility
class Profile(models.Model):
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female'), ('any', 'Any')]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    university = models.CharField(max_length=255)
    gender_preference = models.CharField(max_length=10, choices=GENDER_CHOICES, default='any')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - Profile"


class OTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=[
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset')
    ])
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.is_verified and timezone.now() < self.expires_at

    @staticmethod
    def generate_otp():
        return ''.join(random.choices(string.digits, k=6))

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} - {self.purpose} - {self.otp_code}"
