from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta
import json

from .models import Report, AdminLog
from .serializers import (
    ReportSerializer, AdminLogSerializer, RoomAdminSerializer,
    RestaurantAdminSerializer, DeliveryPartnerAdminSerializer, UserAdminSerializer
)
from .permissions import IsAdminUser
from rooms.models import Room
from restaurants.models import Restaurant
from delivery.models import DeliveryPartner
from users.models import User
from orders.models import Order


def create_admin_log(admin, action, target_type, target_id, details):
    """Helper function to create admin logs"""
    AdminLog.objects.create(
        admin=admin,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if isinstance(details, dict) else str(details)
    )


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
    queryset = User.objects.all().order_by('-date_joined')
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
