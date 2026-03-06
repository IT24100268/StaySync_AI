from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string


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
