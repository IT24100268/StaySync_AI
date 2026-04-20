from django.db import models
from users.models import User

class Room(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male Only'),
        ('female', 'Female Only'),
        ('any', 'Any'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('NEEDS_CHANGES', 'Needs Changes'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    ROOM_TYPE_CHOICES = [
        ('single', 'Single'),
        ('shared', 'Shared'),
    ]

    hostel_id = models.CharField(max_length=10, unique=True, blank=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPE_CHOICES, default='single')
    max_capacity = models.PositiveSmallIntegerField(default=1)
    estimated_rating = models.DecimalField(max_digits=2, decimal_places=1, default=3.0)
    area = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    facilities = models.JSONField(default=list)
    gender_allowed = models.CharField(max_length=10, choices=GENDER_CHOICES, default='any')
    distance_from_university = models.DecimalField(max_digits=5, decimal_places=2, help_text="Distance in km")
    owner_contact = models.CharField(max_length=255)
    rules = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPROVED')
    views = models.IntegerField(default=0)
    review_note = models.TextField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_rooms')
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.hostel_id:
            last = Room.objects.order_by('-id').first()
            next_num = (last.id + 1) if last else 1
            self.hostel_id = f'H{next_num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='rooms/')
    
    def __str__(self):
        return f"Image for {self.room.title}"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'room']
    
    def __str__(self):
        return f"{self.user.email} - {self.room.title}"
