from django.db import models
from users.models import User

class Room(models.Model):
    GENDER_CHOICES = [
        ('girls', 'Girls'),
        ('boys', 'Boys'),
        ('both', 'Both'),
    ]

    AREA_CHOICES = [
        ('Annasathiram', 'Annasathiram'),
        ('Arasadi', 'Arasadi'),
        ('Ariyalai', 'Ariyalai'),
        ('Chunnakam', 'Chunnakam'),
        ('Jaffna Town', 'Jaffna Town'),
        ('Kaithady', 'Kaithady'),
        ('Kaladdy', 'Kaladdy'),
        ('Kantharmadam', 'Kantharmadam'),
        ('Kokuvil', 'Kokuvil'),
        ('Kokuvil East', 'Kokuvil East'),
        ('Kondavil', 'Kondavil'),
        ('Manipay', 'Manipay'),
        ('Nachimar Koviladi', 'Nachimar Koviladi'),
        ('Nallur', 'Nallur'),
        ('Navatkuli', 'Navatkuli'),
        ('Tellippalai', 'Tellippalai'),
        ('Thirunelvely', 'Thirunelvely'),
        ('Uduvil', 'Uduvil'),
        ('Vannarpannai', 'Vannarpannai'),
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
    estimated_rating = models.DecimalField(max_digits=3, decimal_places=1, default=3.5)
    area = models.CharField(max_length=100, choices=AREA_CHOICES, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    facilities = models.JSONField(default=list)
    gender_allowed = models.CharField(max_length=10, choices=GENDER_CHOICES, default='both')
    attached_bathroom = models.BooleanField(default=False)
    ac_available = models.BooleanField(default=False)
    fan_available = models.BooleanField(default=False)
    furnished = models.BooleanField(default=False)
    study_table = models.BooleanField(default=False)
    cupboard = models.BooleanField(default=False)
    balcony = models.BooleanField(default=False)
    distance_from_university = models.DecimalField(max_digits=5, decimal_places=2, help_text="Distance in km")
    owner_contact = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_rooms')
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


class RoomInteraction(models.Model):
    EVENT_CLICK = 'click'
    EVENT_VIEW  = 'view'
    EVENT_SAVE  = 'save'
    EVENT_CHOICES = [
        (EVENT_CLICK, 'Click'),
        (EVENT_VIEW,  'View'),
        (EVENT_SAVE,  'Save'),
    ]
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_interactions')
    room        = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='interactions')
    event_type  = models.CharField(max_length=10, choices=EVENT_CHOICES)
    time_spent  = models.PositiveIntegerField(default=0)  # seconds
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} {self.event_type} room {self.room_id}"


class RoomSearchHistory(models.Model):
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_searches')
    budget_min     = models.IntegerField(null=True, blank=True)
    budget_max     = models.IntegerField(null=True, blank=True)
    max_distance   = models.FloatField(null=True, blank=True)
    gender_allowed = models.CharField(max_length=10, blank=True)
    location       = models.CharField(max_length=100, blank=True)
    facility       = models.CharField(max_length=100, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} search at {self.created_at}"
