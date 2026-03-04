from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from users.models import User
try:
    from rooms.models import Room
except ImportError:
    Room = None
try:
    from orders.models import Order
except ImportError:
    Order = None
try:
    from restaurants.models import Restaurant
except ImportError:
    Restaurant = None

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        stats = {
            'totalUsers': User.objects.count(),
            'pendingUsers': User.objects.filter(is_approved=False).count(),
            'totalRooms': Room.objects.count() if Room else 0,
            'totalOrders': Order.objects.count() if Order else 0,
            'totalRestaurants': Restaurant.objects.count() if Restaurant else 0,
        }
        return Response(stats)
