from rest_framework import serializers
from .models import Enquiry

class EnquirySerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    
    class Meta:
        model = Enquiry
        fields = ['id', 'listing', 'listing_title', 'user_name', 'email', 'phone', 
                  'message', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
