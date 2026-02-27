from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoodItem, Order, Restaurant
from .permissions import IsRestaurantOwner
from .serializers import (
    FoodItemSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    RestaurantRegisterSerializer,
    RestaurantSerializer,
)


class RestaurantRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RestaurantRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return Response(payload, status=status.HTTP_201_CREATED)


class RestaurantScopedMixin:
    permission_classes = [IsAuthenticated]

    def get_restaurant(self):
        return generics.get_object_or_404(Restaurant, owner=self.request.user)


class RestaurantProfileView(RestaurantScopedMixin, APIView):
    def get(self, request):
        restaurant = self.get_restaurant()
        serializer = RestaurantSerializer(restaurant)
        return Response(serializer.data)

    def put(self, request):
        restaurant = self.get_restaurant()
        serializer = RestaurantSerializer(restaurant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RestaurantFoodListCreateView(RestaurantScopedMixin, generics.ListCreateAPIView):
    serializer_class = FoodItemSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        restaurant = self.get_restaurant()
        return FoodItem.objects.filter(restaurant=restaurant).order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(restaurant=self.get_restaurant())


class RestaurantFoodDetailView(RestaurantScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodItemSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        restaurant = self.get_restaurant()
        return FoodItem.objects.filter(restaurant=restaurant)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ToggleFoodAvailabilityView(RestaurantScopedMixin, APIView):
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def patch(self, request, food_item_id):
        restaurant = self.get_restaurant()
        food_item = generics.get_object_or_404(FoodItem, id=food_item_id, restaurant=restaurant)
        self.check_object_permissions(request, food_item)
        food_item.is_available = not food_item.is_available
        food_item.save(update_fields=['is_available'])
        return Response({'id': food_item.id, 'is_available': food_item.is_available})


class RestaurantOrderListView(RestaurantScopedMixin, generics.ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        restaurant = self.get_restaurant()
        queryset = Order.objects.filter(restaurant=restaurant).select_related('student', 'restaurant').prefetch_related(
            'items__food_item'
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class RestaurantOrderDetailView(RestaurantScopedMixin, generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        restaurant = self.get_restaurant()
        return Order.objects.filter(restaurant=restaurant).select_related('student', 'restaurant').prefetch_related(
            'items__food_item'
        )


class UpdateOrderStatusView(RestaurantScopedMixin, APIView):
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def patch(self, request, order_id):
        restaurant = self.get_restaurant()
        order = generics.get_object_or_404(Order, id=order_id, restaurant=restaurant)
        self.check_object_permissions(request, order)

        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(order, context={'request': request}).data)


class DashboardOverviewView(RestaurantScopedMixin, APIView):
    def get(self, request):
        restaurant = self.get_restaurant()
        today = timezone.now().date()
        orders = Order.objects.filter(restaurant=restaurant).select_related('student')
        today_orders = orders.filter(created_at__date=today)
        active_statuses = [Order.Status.PENDING, Order.Status.ACCEPTED, Order.Status.PREPARING, Order.Status.READY]
        active_orders = orders.filter(status__in=active_statuses).count()
        revenue = orders.filter(status=Order.Status.DELIVERED).aggregate(total=Sum('total_amount'))['total'] or 0
        recent_orders = orders.prefetch_related('items__food_item')[:10]

        return Response(
            {
                'todays_orders_count': today_orders.count(),
                'total_revenue': revenue,
                'active_orders': active_orders,
                'ratings': 4.7,
                'recent_orders': OrderSerializer(recent_orders, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
