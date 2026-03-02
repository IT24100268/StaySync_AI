from rest_framework import viewsets
from .models import DeliveryPartner
from .serializers import DeliveryPartnerSerializer

class DeliveryPartnerViewSet(viewsets.ModelViewSet):
    queryset = DeliveryPartner.objects.all()
    serializer_class = DeliveryPartnerSerializer