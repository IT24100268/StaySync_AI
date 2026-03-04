from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.apps import apps

User = get_user_model()
Room = apps.get_model('rooms', 'Room')
Restaurant = apps.get_model('restaurants', 'Restaurant')
DeliveryPartner = apps.get_model('deliveries', 'DeliveryPartner')
from .permissions import IsAdminRole

# Approve Room
class ApproveRoom(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        room = Room.objects.get(id=pk)
        room.status = "approved"
        room.save()
        return Response({"message": "Room Approved"})

# Block User
class BlockUser(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        user = User.objects.get(id=pk)
        user.is_blocked = True
        user.save()
        return Response({"message": "User Blocked"})

# Dashboard Stats
class AdminDashboardStats(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        data = {
            "pending_rooms": Room.objects.filter(status="pending").count(),
            "pending_restaurants": Restaurant.objects.filter(status="pending").count(),
            "pending_delivery": DeliveryPartner.objects.filter(status="pending").count(),
            "blocked_users": User.objects.filter(is_blocked=True).count(),
        }
        return Response(data)