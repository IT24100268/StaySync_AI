from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta

from .models import Report, AdminLog, AdminNotification
from .serializers import (
    ReportSerializer, AdminLogSerializer, RoomAdminSerializer,
    RestaurantAdminSerializer, DeliveryPartnerAdminSerializer, UserAdminSerializer,
    AdminOrderMonitorSerializer, AdminNotificationSerializer
)
from .permissions import IsAdminUser
from rooms.models import Room
from restaurants.models import Restaurant
from restaurants.serializers import MenuSerializer
from delivery.models import DeliveryPartner
from users.models import User
from orders.models import Order
from orders.models import OrderItem
from bookings.models import Booking
from .utils import create_admin_log


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    """Returns only warnings and block notifications for the currently logged-in user."""
    import json
    user = request.user
    notifications = []

    logs = AdminLog.objects.filter(
        target_type='USER',
        target_id=user.id
    ).order_by('-created_at')[:50]

    for log in logs:
        action_lower = (log.action or '').lower()
        # Only include warnings and block actions
        if not any(word in action_lower for word in ['warn', 'block', 'suspend', 'restrict']):
            continue
        try:
            details = json.loads(log.details) if isinstance(log.details, str) else (log.details or {})
        except Exception:
            details = {}
        notifications.append({
            'id': log.id,
            'action': log.action,
            'details': details,
            'created_at': log.created_at.isoformat(),
        })

    return Response({'notifications': notifications, 'warnings_count': user.warnings_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_analytics_summary(request):
    """Get admin dashboard analytics summary"""
    today = timezone.now().date()
    
    total_users = User.objects.count()
    blocked_users = User.objects.filter(is_blocked=True).count()
    
    pending_rooms = Room.objects.filter(status='PENDING').count()
    approved_rooms = Room.objects.filter(status='APPROVED').count()

    pending_hostel_owners = User.objects.filter(user_type='hostel_owner', is_approved=False, is_blocked=False).count()
    blocked_hostel_owners = User.objects.filter(user_type='hostel_owner', is_blocked=True).count()

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
        'pending_hostel_owners': pending_hostel_owners,
        'blocked_hostel_owners': blocked_hostel_owners,
        'pending_restaurants': pending_restaurants,
        'pending_partners': pending_partners,
        'pending_reports': pending_reports,
        'total_orders_today': total_orders_today,
        'disputes_pending': disputes_pending
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_overview(request):
    """Single endpoint for all admin dashboard data"""
    today = timezone.now().date()
    start_date = today - timedelta(days=6)

    # --- user registrations per day (last 7 days) ---
    users_by_day = {
        item['day']: item['count']
        for item in (
            User.objects.filter(date_joined__date__gte=start_date)
            .annotate(day=TruncDate('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
        )
    }
    trend = []
    for offset in range(7):
        day = start_date + timedelta(days=offset)
        trend.append({
            'day': day.strftime('%a'),
            'date': day.isoformat(),
            'users': users_by_day.get(day, 0),
        })

    # --- recent admin logs ---
    recent_logs = (
        AdminLog.objects.select_related('admin')
        .order_by('-created_at')[:8]
    )
    logs_data = [
        {
            'id': log.id,
            'action': log.action,
            'target_type': log.target_type,
            'admin_username': log.admin.username,
            'created_at': log.created_at.isoformat(),
        }
        for log in recent_logs
    ]

    return Response({
        'new_users_today': User.objects.filter(date_joined__date=today).count(),
        'new_users_7d': User.objects.filter(date_joined__date__gte=start_date).count(),
        'user_trend': trend,
        'recent_logs': logs_data,
        'orders_total': Order.objects.count(),
        'approved_hostel_owners': User.objects.filter(user_type='hostel_owner', is_approved=True, is_blocked=False).count(),
        'approved_restaurants': Restaurant.objects.filter(status='APPROVED').count(),
        'approved_partners': DeliveryPartner.objects.filter(status='APPROVED').count(),
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

        # Auto-assign restaurant_id when approved for the first time
        if new_status == 'APPROVED' and not restaurant.restaurant_id:
            last = Restaurant.objects.filter(
                restaurant_id__isnull=False
            ).order_by('restaurant_id').last()
            next_num = 1
            if last and last.restaurant_id:
                try:
                    next_num = int(last.restaurant_id[1:]) + 1
                except ValueError:
                    next_num = Restaurant.objects.filter(restaurant_id__isnull=False).count() + 1
            restaurant.restaurant_id = f'R{next_num:04d}'

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
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        is_approved = self.request.query_params.get('is_approved')
        user_type = self.request.query_params.get('user_type')

        if is_approved in ['true', 'false']:
            queryset = queryset.filter(is_approved=(is_approved == 'true'))
            # When fetching pending (unapproved) users, exclude blocked/rejected ones
            if is_approved == 'false':
                queryset = queryset.filter(is_blocked=False)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        user = self.get_object()
        user.is_approved = True
        user.save(update_fields=['is_approved'])

        # If approving a hostel owner, approve all their pending rooms
        if user.user_type == 'hostel_owner':
            owner_contacts = []
            try:
                phone = (user.hostel_profile.phone_number or '').strip()
                if phone:
                    owner_contacts.append(phone)
            except Exception:
                pass
            if user.email:
                owner_contacts.append(user.email.strip())
            if owner_contacts:
                Room.objects.filter(
                    owner_contact__in=owner_contacts,
                    status='PENDING'
                ).update(status='APPROVED', reviewed_by=request.user, reviewed_at=timezone.now())

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
    def reject(self, request, pk=None):
        user = self.get_object()
        reject_reason = request.data.get('reject_reason', 'Account registration rejected by admin')

        user.is_approved = False
        user.is_blocked = True
        user.block_reason = reject_reason
        user.save(update_fields=['is_approved', 'is_blocked', 'block_reason'])

        # Reject all pending restaurant records for this owner
        if user.user_type == 'restaurant_owner':
            Restaurant.objects.filter(owner=user, status='PENDING').update(
                status='REJECTED',
                review_note=reject_reason,
                is_approved=False,
                reviewed_by_id=request.user.id,
                reviewed_at=timezone.now()
            )

        create_admin_log(
            admin=request.user,
            action='User account rejected',
            target_type='USER',
            target_id=user.id,
            details={'reject_reason': reject_reason}
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def request_verification(self, request, pk=None):
        """Admin triggers verification for a hostel owner."""
        user = self.get_object()
        if user.user_type != 'hostel_owner':
            return Response({'error': 'User is not a hostel owner'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = user.hostel_profile
        except Exception:
            return Response({'error': 'Hostel profile not found'}, status=status.HTTP_400_BAD_REQUEST)

        note = request.data.get('note', 'Admin has requested identity verification. Please complete the verification form.')
        profile.is_under_verification = True
        profile.verification_note = note
        profile.save(update_fields=['is_under_verification', 'verification_note'])

        # Reset any existing verification request to pending
        from users.models import OwnerVerificationRequest
        OwnerVerificationRequest.objects.filter(owner=user).update(status='pending', admin_note='')

        create_admin_log(
            admin=request.user,
            action='Verification requested for hostel owner',
            target_type='USER',
            target_id=user.id,
            details={'note': note}
        )
        return Response({'message': 'Verification request sent to owner.'})

    @action(detail=True, methods=['get'])
    def verification_form(self, request, pk=None):
        """Admin views the submitted verification form."""
        user = self.get_object()
        try:
            vr = user.verification_request
        except Exception:
            return Response({'detail': 'No verification form submitted yet.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': vr.id,
            'status': vr.status,
            'nic_passport_number': vr.nic_passport_number,
            'address_proof': vr.address_proof,
            'business_reg_no': vr.business_reg_no,
            'admin_note': vr.admin_note,
            'submitted_at': vr.submitted_at,
            'nic_doc': request.build_absolute_uri(vr.nic_doc.url) if vr.nic_doc else None,
            'address_doc': request.build_absolute_uri(vr.address_doc.url) if vr.address_doc else None,
            'business_doc': request.build_absolute_uri(vr.business_doc.url) if vr.business_doc else None,
        })

    @action(detail=True, methods=['patch'])
    def complete_verification(self, request, pk=None):
        """Admin marks verification as complete — owner regains full access."""
        user = self.get_object()
        try:
            profile = user.hostel_profile
        except Exception:
            return Response({'error': 'Hostel profile not found'}, status=status.HTTP_400_BAD_REQUEST)

        profile.is_under_verification = False
        profile.verification_note = ''
        profile.save(update_fields=['is_under_verification', 'verification_note'])

        from users.models import OwnerVerificationRequest
        OwnerVerificationRequest.objects.filter(owner=user).update(
            status='verified',
            reviewed_at=timezone.now()
        )

        create_admin_log(
            admin=request.user,
            action='Hostel owner verification completed',
            target_type='USER',
            target_id=user.id,
            details={}
        )
        return Response({'message': 'Owner verified. Full access restored.'})
    
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


class AdminNotificationViewSet(viewsets.ModelViewSet):
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ['get', 'patch', 'delete']

    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        AdminNotification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        AdminNotification.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(AdminNotificationSerializer(notif).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_restaurant_menu(request, restaurant_id):
    from restaurants.models import Menu
    items = Menu.objects.filter(restaurant_id=restaurant_id).order_by('name')
    serializer = MenuSerializer(items, many=True, context={'request': request})
    return Response(serializer.data)
