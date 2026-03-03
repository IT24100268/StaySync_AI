from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Listing
from .serializers import ListingSerializer

class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Listing.objects.filter(owner=self.request.user.owner_profile)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user.owner_profile)
    
    @action(detail=True, methods=['patch'])
    def update_availability(self, request, pk=None):
        listing = self.get_object()
        availability = request.data.get('availability_status')
        
        if availability not in ['available', 'unavailable']:
            return Response({'error': 'Invalid availability status'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        listing.availability_status = availability
        listing.save()
        
        return Response({'message': 'Availability updated successfully',
                        'availability_status': listing.availability_status})
