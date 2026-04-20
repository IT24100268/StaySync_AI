from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Tracking
from .serializers import TrackingSerializer

class TrackingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        tracking = Tracking.objects.filter(
            order_id=order_id,
            order__student=request.user
        ).first()
        if not tracking:
            return Response({
                'available': False,
                'message': 'Tracking not available yet. A delivery partner has not been assigned.'
            }, status=status.HTTP_200_OK)
        data = TrackingSerializer(tracking).data
        data['available'] = True
        return Response(data, status=status.HTTP_200_OK)
