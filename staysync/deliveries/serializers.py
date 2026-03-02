from rest_framework import serializers
from .models import DeliveryPartner

class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = "__all__"