from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Tracking
from .serializers import TrackingSerializer

class TrackingDetailView(generics.RetrieveAPIView):
    serializer_class = TrackingSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_id'
    
    def get_queryset(self):
        return Tracking.objects.filter(order__student=self.request.user)
