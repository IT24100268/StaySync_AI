from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer

class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Calculate delivery charge
        order_type = request.data.get('order_type', 'delivery')
        delivery_charge = 200 if order_type == 'delivery' else 0
        
        serializer.save(
            student=request.user,
            delivery_charge=delivery_charge,
            status='pending'
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(student=self.request.user).order_by('-created_at')

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(student=self.request.user)

class RestaurantOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(
            restaurant__owner=self.request.user
        ).order_by('-created_at')

class AcceptOrderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, restaurant__owner=request.user)
            preparation_time = request.data.get('preparation_time')
            
            if not preparation_time:
                return Response(
                    {'error': 'Preparation time is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order.status = 'accepted'
            order.preparation_time = preparation_time
            
            # Set estimated delivery time (preparation + 30 mins delivery)
            if order.order_type == 'delivery':
                order.estimated_delivery_time = int(preparation_time) + 30
                # Mark as ready for delivery partners to see
                order.status = 'ready'
            else:
                order.estimated_delivery_time = int(preparation_time)
            
            order.save()
            
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class RejectOrderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, restaurant__owner=request.user)
            reason = request.data.get('reason', 'Restaurant is busy')
            
            order.status = 'rejected'
            order.rejection_reason = reason
            order.save()
            
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class AvailableDeliveriesView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(
            order_type='delivery',
            status='ready',
            delivery_partner__isnull=True
        ).order_by('-created_at')

class AcceptDeliveryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                id=order_id,
                order_type='delivery',
                status='ready',
                delivery_partner__isnull=True
            )
            
            order.delivery_partner = request.user
            order.status = 'out_for_delivery'
            order.save()
            
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or already assigned'},
                status=status.HTTP_404_NOT_FOUND
            )

class MyDeliveriesView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', 'all')
        queryset = Order.objects.filter(
            delivery_partner=self.request.user
        ).order_by('-created_at')
        
        if status_filter == 'active':
            queryset = queryset.filter(status__in=['out_for_delivery'])
        elif status_filter == 'completed':
            queryset = queryset.filter(status='delivered')
        
        return queryset
