from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Room, Favorite
from .serializers import RoomSerializer, FavoriteSerializer
from .filters import RoomFilter
from .geocoding_service import GeocodingService

class RoomListView(generics.ListAPIView):
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = RoomFilter
    ordering_fields = ['price', 'distance_from_university', 'created_at']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show APPROVED rooms to students
        return Room.objects.filter(status='APPROVED')

class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show APPROVED rooms
        return Room.objects.filter(status='APPROVED')

class FavoriteToggleView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        room_id = request.data.get('room_id')
        try:
            room = Room.objects.get(id=room_id)
            favorite, created = Favorite.objects.get_or_create(user=request.user, room=room)
            if not created:
                favorite.delete()
                return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
            return Response({'message': 'Added to favorites'}, status=status.HTTP_201_CREATED)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_location(request):
    """
    Detect latitude and longitude from address using OpenStreetMap Nominatim
    """
    address_data = {
        'address_line_1': request.data.get('address_line_1', ''),
        'address_line_2': request.data.get('address_line_2', ''),
        'area': request.data.get('area', ''),
        'city': request.data.get('city', ''),
        'landmark': request.data.get('landmark', ''),
        'postal_code': request.data.get('postal_code', ''),
    }
    
    result = GeocodingService.geocode_address(address_data)
    return Response(result)
