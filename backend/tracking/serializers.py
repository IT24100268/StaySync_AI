from rest_framework import serializers
from .models import Tracking

class TrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tracking
        fields = ['id', 'order', 'rider_name', 'rider_phone', 'current_latitude', 
                  'current_longitude', 'eta_minutes', 'updated_at']
