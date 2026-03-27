from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta

from .models import Report, AdminLog
from .serializers import (
    ReportSerializer, AdminLogSerializer, RoomAdminSerializer,
    RestaurantAdminSerializer, DeliveryPartnerAdminSerializer, UserAdminSerializer,
    AdminOrderMonitorSerializer
)
from .permissions import IsAdminUser
from rooms.models import Room
from restaurants.models import Restaurant
from delivery.models import DeliveryPartner
from users.models import User
from orders.models import Order
from orders.models import OrderItem
from bookings.models import Booking
from .utils import create_admin_log


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_analytics_summary(request):
    """Get admin dashboard analytics summary"""
    today = timezone.now().date()
    
    total_users = User.objects.count()
    blocked_users = User.objects.filter(is_blocked=True).count()
    
    pending_rooms = Room.objects.filter(status='PENDING').count()
    approved_rooms = Room.objects.filter(status='APPROVED').count()
    
    pending_restaurants = Restaurant.objects.filter(status='PENDING').count()
    pending_partners = DeliveryPartner.objects.filter(status='PENDING').count()
    
    pending_reports = Report.objects.filter(status='PENDING').count()
    
    try:
        total_orders_today = Order.objects.filter(created_at__date=today).count()
    except:
        total_orders_today = 0
    
    disputes_pending = Report.objects.filter(
        status__in=['PENDING', 'INVESTIGATING'],
        target_type='ORDER'
    ).count()
    
    return Response({
        'total_users': total_users,
        'blocked_users': blocked_users,
        'pending_rooms': pending_rooms,
        'approved_rooms': approved_rooms,
        'pending_restaurants': pending_restaurants,
        'pending_partners': pending_partners,
        'pending_reports': pending_reports,
        'total_orders_today': total_orders_today,
        'disputes_pending': disputes_pending
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_orders_monitor(request):
    today = timezone.now().date()
    latest_booking_prefetch = Prefetch(
        'student__bookings',
        queryset=Booking.objects.filter(status='approved').select_related('room').order_by('-updated_at', '-created_at'),
        to_attr='approved_bookings_cache'
    )
    item_prefetch = Prefetch(
        'items',
        queryset=OrderItem.objects.select_related('menu_item'),
        to_attr='prefetched_items'
    )

    orders = (
        Order.objects.select_related('student', 'restaurant', 'delivery_partner')
        .prefetch_related(item_prefetch, latest_booking_prefetch)
        .order_by('-created_at')[:120]
    )

    for order in orders:
        approved_bookings = getattr(order.student, 'approved_bookings_cache', [])
        order.student.latest_approved_booking = approved_bookings[0] if approved_bookings else None

    serialized_orders = AdminOrderMonitorSerializer(orders, many=True).data

    status_counts = {key: 0 for key, _ in Order.STATUS_CHOICES}
    for order in orders:
        status_counts[order.status] = status_counts.get(order.status, 0) + 1

    response_data = {
        'summary': {
            'total_orders': len(serialized_orders),
            'today_orders': sum(1 for order in orders if order.created_at.date() == today),
            'delivery_orders': sum(1 for order in orders if order.order_type == 'delivery'),
            'takeaway_orders': sum(1 for order in orders if order.order_type == 'takeaway'),
            'with_room_context': sum(1 for order in serialized_orders if order.get('room_context')),
            'assigned_delivery_partners': sum(1 for order in orders if order.delivery_partner_id),
            'status_counts': status_counts,
        },
        'orders': serialized_orders,
    }
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_analytics_detail(request):
    today = timezone.now().date()
    start_date = today - timedelta(days=6)

    users_by_day = {
        item['day']: item['count']
        for item in (
            User.objects.filter(date_joined__date__gte=start_date)
            .annotate(day=TruncDate('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
        )
    }
    orders_by_day = {
        item['day']: item['count']
        for item in (
            Order.objects.filter(created_at__date__gte=start_date)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
    }
    reports_by_day = {
        item['day']: item['count']
        for item in (
            Report.objects.filter(created_at__date__gte=start_date)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
    }

    trend = []
    for offset in range(7):
        day = start_date + timedelta(days=offset)
        trend.append({
            'date': day.isoformat(),
            'label': day.strftime('%a'),
            'users': users_by_day.get(day, 0),
            'orders': orders_by_day.get(day, 0),
            'reports': reports_by_day.get(day, 0),
        })

    user_mix = [
        {'name': label, 'value': User.objects.filter(user_type=key).count()}
        for key, label in User.USER_TYPE_CHOICES
    ]

    order_status = [
        {'name': label, 'value': Order.objects.filter(status=key).count()}
        for key, label in Order.STATUS_CHOICES
    ]

    moderation_pipeline = [
        {
            'name': 'Rooms',
            'pending': Room.objects.filter(status='PENDING').count(),
            'approved': Room.objects.filter(status='APPROVED').count(),
            'rejected': Room.objects.filter(status='REJECTED').count(),
        },
        {
            'name': 'Restaurants',
            'pending': Restaurant.objects.filter(status='PENDING').count(),
            'approved': Restaurant.objects.filter(status='APPROVED').count(),
            'rejected': Restaurant.objects.filter(status='REJECTED').count(),
        },
        {
            'name': 'Partners',
            'pending': DeliveryPartner.objects.filter(status='PENDING').count(),
            'approved': DeliveryPartner.objects.filter(status='APPROVED').count(),
            'rejected': DeliveryPartner.objects.filter(status='REJECTED').count(),
        },
    ]

    top_restaurants = list(
        Order.objects.values('restaurant__name')
        .annotate(order_count=Count('id'))
        .order_by('-order_count')[:5]
    )
    top_restaurants = [
        {
            'name': item['restaurant__name'] or 'Unknown Restaurant',
            'orders': item['order_count'],
        }
        for item in top_restaurants
    ]

    recent_admin_actions = list(
        AdminLog.objects.select_related('admin')
        .values('id', 'action', 'target_type', 'target_id', 'created_at', 'admin__username')[:6]
    )

    metrics = {
        'total_users': User.objects.count(),
        'new_users_7d': User.objects.filter(date_joined__date__gte=start_date).count(),
        'blocked_users': User.objects.filter(is_blocked=True).count(),
        'orders_total': Order.objects.count(),
        'orders_today': Order.objects.filter(created_at__date=today).count(),
        'delivery_orders_active': Order.objects.filter(status__in=['ready', 'out_for_delivery']).count(),
        'reports_open': Report.objects.filter(status__in=['PENDING', 'INVESTIGATING']).count(),
        'delivery_online': DeliveryPartner.objects.filter(is_online=True, status='APPROVED').count(),
        'approval_backlog': (
            Room.objects.filter(status='PENDING').count()
            + Restaurant.objects.filter(status='PENDING').count()
            + DeliveryPartner.objects.filter(status='PENDING').count()
        ),
    }

    return Response({
        'metrics': metrics,
        'trend': trend,
        'user_mix': user_mix,
        'order_status': order_status,
        'moderation_pipeline': moderation_pipeline,
        'top_restaurants': top_restaurants,
        'recent_admin_actions': recent_admin_actions,
    })


class RoomAdminViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        room = self.get_object()
        new_status = request.data.get('status')
        review_note = request.data.get('review_note', '')
        
        if new_status not in dict(Room.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = room.status
        room.status = new_status
        room.review_note = review_note
        room.reviewed_at = timezone.now()
        room.reviewed_by = request.user
        room.save()
        
        # Create admin log
        create_admin_log(
            admin=request.user,
            action=f'Room status changed from {old_status} to {new_status}',
            target_type='ROOM',
            target_id=room.id,
            details={'old_status': old_status, 'new_status': new_status, 'review_note': review_note}
        )
        
        serializer = self.get_serializer(room)
        return Response(serializer.data)


class RestaurantAdminViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all().order_by('-created_at')
    serializer_class = RestaurantAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        restaurant = self.get_object()
        new_status = request.data.get('status')
        review_note = request.data.get('review_note', '')
        
        if new_status not in dict(Restaurant.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = restaurant.status
        restaurant.status = new_status
        restaurant.review_note = review_note
        restaurant.reviewed_at = timezone.now()
        restaurant.reviewed_by = request.user
        
        # Update is_approved for backward compatibility
        restaurant.is_approved = (new_status == 'APPROVED')
        restaurant.save()
        
        create_admin_log(
            admin=request.user,
            action=f'Restaurant status changed from {old_status} to {new_status}',
            target_type='RESTAURANT',
            target_id=restaurant.id,
            details={'old_status': old_status, 'new_status': new_status, 'review_note': review_note}
        )
        
        serializer = self.get_serializer(restaurant)
        return Response(serializer.data)



class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_staff=False, is_superuser=False).order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_approved = self.request.query_params.get('is_approved')
        user_type = self.request.query_params.get('user_type')

        if is_approved in ['true', 'false']:
            queryset = queryset.filter(is_approved=(is_approved == 'true'))
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        user = self.get_object()
        user.is_approved = True
        user.save(update_fields=['is_approved'])

        create_admin_log(
            admin=request.user,
            action='User approved',
            target_type='USER',
            target_id=user.id,
            details={'is_approved': True}
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def block(self, request, pk=None):
        user = self.get_object()
        block_reason = request.data.get('block_reason', 'No reason provided')
        
        user.is_blocked = True
        user.block_reason = block_reason
        user.save()
        
        create_admin_log(
            admin=request.user,
            action='User blocked',
            target_type='USER',
            target_id=user.id,
            details={'reason': block_reason}
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def unblock(self, request, pk=None):
        user = self.get_object()
        
        user.is_blocked = False
        user.block_reason = None
        user.save()
        
        create_admin_log(
            admin=request.user,
            action='User unblocked',
            target_type='USER',
            target_id=user.id,
            details={}
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def warn(self, request, pk=None):
        user = self.get_object()
        warning_note = request.data.get('warning_note', '')
        
        user.warnings_count += 1
        user.save()
        
        create_admin_log(
            admin=request.user,
            action=f'User warned (Total warnings: {user.warnings_count})',
            target_type='USER',
            target_id=user.id,
            details={'warning_note': warning_note, 'warnings_count': user.warnings_count}
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class DeliveryPartnerAdminViewSet(viewsets.ModelViewSet):
    queryset = DeliveryPartner.objects.all().order_by('-created_at')
    serializer_class = DeliveryPartnerAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        partner = self.get_object()
        new_status = request.data.get('status')
        review_note = request.data.get('review_note', '')
        
        if new_status not in dict(DeliveryPartner.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = partner.status
        partner.status = new_status
        partner.review_note = review_note
        partner.reviewed_at = timezone.now()
        partner.reviewed_by = request.user
        partner.save()
        
        create_admin_log(
            admin=request.user,
            action=f'Partner status changed from {old_status} to {new_status}',
            target_type='PARTNER',
            target_id=partner.id,
            details={'old_status': old_status, 'new_status': new_status, 'review_note': review_note}
        )
        
        serializer = self.get_serializer(partner)
        return Response(serializer.data)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update_status']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            queryset = super().get_queryset()
            status_filter = self.request.query_params.get('status', None)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        return Report.objects.filter(reporter=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        report = self.get_object()
        new_status = request.data.get('status')
        admin_note = request.data.get('admin_note', '')
        
        if new_status not in dict(Report.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = report.status
        report.status = new_status
        report.admin_note = admin_note
        
        if new_status in ['RESOLVED', 'DISMISSED']:
            report.resolved_at = timezone.now()
        
        report.save()
        
        create_admin_log(
            admin=request.user,
            action=f'Report status changed from {old_status} to {new_status}',
            target_type='REPORT',
            target_id=report.id,
            details={'old_status': old_status, 'new_status': new_status, 'admin_note': admin_note}
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class AdminLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AdminLog.objects.all().order_by('-created_at')
    serializer_class = AdminLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
