from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import RoomReview, RestaurantReview
from .serializers import RoomReviewSerializer, RestaurantReviewSerializer

class RoomReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RoomReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'owner':
            return RoomReview.objects.filter(room__owner=self.request.user)
        return RoomReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RestaurantReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'restaurant':
            return RestaurantReview.objects.filter(restaurant__owner=self.request.user)
        return RestaurantReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
