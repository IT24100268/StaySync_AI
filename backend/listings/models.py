from django.db import models
from owners.models import OwnerProfile

class Listing(models.Model):
    ROOM_TYPE_CHOICES = [
        ('single', 'Single'),
        ('shared', 'Shared'),
        ('hostel', 'Hostel'),
        ('annex', 'Annex'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('mixed', 'Mixed'),
    ]
    
    AVAILABILITY_CHOICES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
    ]
    
    owner = models.ForeignKey(OwnerProfile, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=255)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    gender_allowed = models.CharField(max_length=20, choices=GENDER_CHOICES)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='available')
    
    wifi = models.BooleanField(default=False)
    water = models.BooleanField(default=False)
    electricity = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    attached_bathroom = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class ListingPhoto(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='listing_photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Photo for {self.listing.title}"
