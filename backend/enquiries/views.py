from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Enquiry
from .serializers import EnquirySerializer

class EnquiryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Enquiry.objects.filter(listing__owner=self.request.user.owner_profile)
    
    @action(detail=True, methods=['patch'])
    def accept(self, request, pk=None):
        enquiry = self.get_object()
        enquiry.status = 'accepted'
        enquiry.save()
        return Response({'message': 'Enquiry accepted', 'status': enquiry.status})
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        enquiry = self.get_object()
        enquiry.status = 'rejected'
        enquiry.save()
        return Response({'message': 'Enquiry rejected', 'status': enquiry.status})
