import math
from decimal import Decimal, InvalidOperation
from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_panel.utils import create_admin_log
from restaurants.models import Menu, Restaurant

from .delivery_pricing import DeliveryPricingError, estimate_delivery_quote
from .models import Order
from .serializers import OrderSerializer

DELIVERY_FLOW_KEY = '_delivery_flow'


def _to_decimal(value, default='0'):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


def _get_delivery_flow(order):
    snapshot = order.pricing_snapshot if isinstance(order.pricing_snapshot, dict) else {}
    flow = snapshot.get(DELIVERY_FLOW_KEY) if isinstance(snapshot.get(DELIVERY_FLOW_KEY), dict) else {}
    return dict(snapshot), dict(flow)


def _set_delivery_flow(order, **updates):
    snapshot, flow = _get_delivery_flow(order)
    flow.update(updates)
    snapshot[DELIVERY_FLOW_KEY] = flow
    order.pricing_snapshot = snapshot


def _is_pickup_confirmed(order):
    _, flow = _get_delivery_flow(order)
    return bool(flow.get('picked_confirmed'))


def _coerce_coordinate(value, axis):
    if value in (None, ''):
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None

    if axis == 'lat' and not (-90 <= numeric <= 90):
        return None
    if axis == 'lng' and not (-180 <= numeric <= 180):
        return None

    return round(numeric, 6)


def _extract_rider_coordinates(request):
    lat_candidates = [
        request.data.get('rider_latitude'),
        request.data.get('latitude'),
        request.data.get('current_latitude'),
    ]
    lng_candidates = [
        request.data.get('rider_longitude'),
        request.data.get('longitude'),
        request.data.get('current_longitude'),
    ]

    rider_lat = None
    for candidate in lat_candidates:
        parsed = _coerce_coordinate(candidate, 'lat')
        if parsed is not None:
            rider_lat = parsed
            break

    rider_lng = None
    for candidate in lng_candidates:
        parsed = _coerce_coordinate(candidate, 'lng')
        if parsed is not None:
            rider_lng = parsed
            break

    return rider_lat, rider_lng


def _get_delivery_partner_phone(user):
    profile = getattr(user, 'delivery_profile', None)
    profile_phone = str(getattr(profile, 'phone_number', '') or '').strip() if profile else ''
    if profile_phone:
        return profile_phone

    legacy_partner = getattr(user, 'deliverypartner', None)
    legacy_phone = str(getattr(legacy_partner, 'phone', '') or '').strip() if legacy_partner else ''
    return legacy_phone


def _upsert_tracking_for_order(order, rider, rider_latitude=None, rider_longitude=None):
    if not order or str(getattr(order, 'order_type', '') or '').lower() != 'delivery' or not rider:
        return

    from tracking.models import Tracking

    current_lat = _coerce_coordinate(rider_latitude, 'lat')
    current_lng = _coerce_coordinate(rider_longitude, 'lng')

    tracking_obj = Tracking.objects.filter(order=order).only('current_latitude', 'current_longitude').first()

    if current_lat is None or current_lng is None:
        if tracking_obj:
            current_lat = _coerce_coordinate(getattr(tracking_obj, 'current_latitude', None), 'lat')
            current_lng = _coerce_coordinate(getattr(tracking_obj, 'current_longitude', None), 'lng')

    if current_lat is None or current_lng is None:
        current_lat = _coerce_coordinate(getattr(order.restaurant, 'latitude', None), 'lat')
        current_lng = _coerce_coordinate(getattr(order.restaurant, 'longitude', None), 'lng')

    if current_lat is None or current_lng is None:
        return

    full_name = f"{rider.first_name or ''} {rider.last_name or ''}".strip()
    rider_name = full_name or rider.username or 'Delivery Partner'
    rider_phone = _get_delivery_partner_phone(rider)

    eta_minutes = int(math.ceil(float(order.estimated_delivery_time or 0))) if order.estimated_delivery_time else 30
    if eta_minutes <= 0:
        eta_minutes = 30

    Tracking.objects.update_or_create(
        order=order,
        defaults={
            'rider_name': rider_name,
            'rider_phone': rider_phone or 'Not available',
            'current_latitude': current_lat,
            'current_longitude': current_lng,
            'eta_minutes': eta_minutes,
        },
    )


def _build_food_total(restaurant_id, items):
    if not items:
        raise ValueError("Order must include at least one item.")

    menu_ids = [int(item.get('menu_item_id')) for item in items if item.get('menu_item_id') is not None]
    menus = Menu.objects.filter(id__in=menu_ids, restaurant_id=restaurant_id)
    menu_map = {item.id: item for item in menus}

    total = Decimal('0')
    for item in items:
        menu_item_id = int(item.get('menu_item_id'))
        quantity = int(item.get('quantity', 1))
        menu_item = menu_map.get(menu_item_id)
        if menu_item is None:
            raise ValueError(f"Menu item {menu_item_id} does not belong to selected restaurant.")
        if quantity <= 0:
            raise ValueError("Item quantity must be greater than zero.")

        total += Decimal(str(menu_item.price)) * Decimal(quantity)

    return total


class OrderEstimateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        restaurant_id = request.data.get('restaurant_id')
        order_type = str(request.data.get('order_type', 'delivery')).lower()
        delivery_lat = request.data.get('delivery_latitude')
        delivery_lng = request.data.get('delivery_longitude')
        preparation_time = request.data.get('preparation_time', 0)
        food_price = _to_decimal(request.data.get('food_price', 0))

        if not restaurant_id:
            return Response({'error': 'restaurant_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = Restaurant.objects.filter(id=restaurant_id).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            quote = estimate_delivery_quote(
                restaurant_lat=restaurant.latitude,
                restaurant_lng=restaurant.longitude,
                student_lat=delivery_lat,
                student_lng=delivery_lng,
                order_type=order_type,
                preparation_time_min=_to_decimal(preparation_time, default='0'),
            )
        except DeliveryPricingError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        total_price = food_price + _to_decimal(quote.get('delivery_charge', 0))
        return Response(
            {
                'quote': quote,
                'food_price': float(food_price),
                'total_price': float(total_price),
                'order_type': order_type,
            },
            status=status.HTTP_200_OK,
        )


class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant_id = serializer.validated_data.get('restaurant_id')
        order_type = str(serializer.validated_data.get('order_type', 'delivery')).lower()
        items = serializer.validated_data.get('items') or []
        delivery_lat = serializer.validated_data.get('delivery_latitude')
        delivery_lng = serializer.validated_data.get('delivery_longitude')

        try:
            food_price = _build_food_total(restaurant_id, items)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = Restaurant.objects.filter(id=restaurant_id).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        quote = None
        if delivery_lat is not None and delivery_lng is not None:
            try:
                quote = estimate_delivery_quote(
                    restaurant_lat=restaurant.latitude,
                    restaurant_lng=restaurant.longitude,
                    student_lat=delivery_lat,
                    student_lng=delivery_lng,
                    order_type=order_type,
                    preparation_time_min=0,
                )
            except DeliveryPricingError as exc:
                return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        elif order_type == 'delivery':
            return Response(
                {'error': 'Delivery location coordinates are required for delivery orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery_charge = _to_decimal((quote or {}).get('delivery_charge', 0))
        total_price = food_price + delivery_charge

        save_kwargs = {
            'student': request.user,
            'delivery_charge': delivery_charge,
            'food_price': food_price,
            'total_price': total_price,
            'status': 'pending',
            'estimated_delivery_time': (
                int(math.ceil(float(quote.get('predicted_traffic_eta_min', 0))))
                if quote and order_type == 'delivery'
                else None
            ),
            'route_distance_km': _to_decimal((quote or {}).get('distance_km', 0)) if quote else None,
            'route_duration_minutes': _to_decimal((quote or {}).get('route_duration_min', 0)) if quote else None,
            'traffic_eta_minutes': _to_decimal((quote or {}).get('predicted_traffic_eta_min', 0)) if quote else None,
            'total_eta_minutes': _to_decimal((quote or {}).get('total_eta_min', 0)) if quote else None,
            'delivery_fee_raw': _to_decimal((quote or {}).get('delivery_fee_raw', 0)) if quote else Decimal('0'),
            'delivery_fee_rounded': _to_decimal((quote or {}).get('delivery_fee_rounded', 0)) if quote else Decimal('0'),
            'maps_route_url': (quote or {}).get('maps_route_url', ''),
            'ai_model_version': (quote or {}).get('model_version', ''),
            'pricing_snapshot': quote or {},
        }

        serializer.save(**save_kwargs)
        create_admin_log(
            actor=request.user,
            action='Food order placed',
            target_type='ORDER',
            target_id=serializer.instance.id,
            details={
                'restaurant_name': serializer.instance.restaurant.name,
                'order_type': serializer.instance.order_type,
                'status': serializer.instance.status,
                'food_price': float(serializer.instance.food_price or 0),
                'delivery_charge': float(serializer.instance.delivery_charge or 0),
                'total_price': float(serializer.instance.total_price or 0),
                'distance_km': float(serializer.instance.route_distance_km or 0),
                'traffic_eta_minutes': float(serializer.instance.traffic_eta_minutes or 0),
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(student=self.request.user)
            .select_related(
                'student',
                'student__student_profile',
                'restaurant',
                'delivery_partner',
                'delivery_partner__delivery_profile',
                'tracking',
            )
            .prefetch_related('items__menu_item')
            .order_by('-created_at')
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(student=self.request.user)
            .select_related(
                'student',
                'student__student_profile',
                'restaurant',
                'delivery_partner',
                'delivery_partner__delivery_profile',
                'tracking',
            )
            .prefetch_related('items__menu_item')
        )


class RestaurantOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Order.objects.filter(restaurant__owner=self.request.user)
            .select_related(
                'student',
                'student__student_profile',
                'restaurant',
                'delivery_partner',
                'delivery_partner__delivery_profile',
                'tracking',
            )
            .prefetch_related('items__menu_item')
            .order_by('-created_at')
        )
        status_filter = str(self.request.query_params.get('status', '')).strip().lower()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AcceptOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, restaurant__owner=request.user)
            preparation_time = request.data.get('preparation_time')

            if preparation_time in (None, ''):
                return Response(
                    {'error': 'Preparation time is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            preparation_time = int(preparation_time)
            if preparation_time < 0:
                return Response(
                    {'error': 'Preparation time cannot be negative'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            now = timezone.now()
            order.status = 'accepted'
            order.preparation_time = preparation_time
            order.pickup_ready_at = now + timedelta(minutes=preparation_time)

            if order.order_type == 'delivery':
                traffic_eta = float(order.traffic_eta_minutes or 0)
                if traffic_eta <= 0:
                    traffic_eta = float(order.estimated_delivery_time or 30)
                total_eta = float(preparation_time) + traffic_eta

                order.total_eta_minutes = Decimal(str(round(total_eta, 2)))
                order.estimated_delivery_time = int(math.ceil(total_eta))
                order.estimated_delivery_at = now + timedelta(minutes=total_eta)

                # Mark as ready for delivery partners to see.
                order.status = 'ready'
            else:
                order.total_eta_minutes = Decimal(str(round(float(preparation_time), 2)))
                order.estimated_delivery_time = preparation_time
                order.estimated_delivery_at = order.pickup_ready_at

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


class MarkTakeawayReadyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, restaurant__owner=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if str(order.order_type or '').lower() != 'takeaway':
            return Response(
                {'error': 'This action is only available for takeaway orders.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_status = str(order.status or '').lower()
        if current_status == 'out_for_delivery':
            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_200_OK
            )

        if current_status not in {'accepted', 'preparing', 'ready'}:
            return Response(
                {'error': 'Only accepted or preparing takeaway orders can be marked as ready for pickup.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        order.status = 'out_for_delivery'
        if not order.pickup_ready_at:
            order.pickup_ready_at = now
        if not order.estimated_delivery_at:
            order.estimated_delivery_at = order.pickup_ready_at or now

        order.save(update_fields=['status', 'pickup_ready_at', 'estimated_delivery_at', 'updated_at'])

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class MarkCollectedByPartnerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, restaurant__owner=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        current_status = str(order.status or '').lower()
        if current_status != 'out_for_delivery':
            return Response(
                {'error': 'This action is only allowed for orders that are out for delivery.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order_type = str(order.order_type or '').lower()
        if order_type == 'delivery' and not order.delivery_partner_id:
            return Response(
                {'error': 'No delivery partner assigned for this order yet.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if order_type not in {'delivery', 'takeaway'}:
            return Response(
                {'error': 'Unsupported order type for completion.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'delivered'
        if not order.estimated_delivery_at:
            order.estimated_delivery_at = timezone.now()
        order.save(update_fields=['status', 'estimated_delivery_at', 'updated_at'])

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class AvailableDeliveriesView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            order_type='delivery',
            status='ready',
            delivery_partner__isnull=True
        ).select_related(
            'student',
            'student__student_profile',
            'restaurant',
            'delivery_partner',
            'delivery_partner__delivery_profile',
            'tracking',
        ).prefetch_related('items__menu_item').order_by('-created_at')


class AcceptDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            rider_latitude, rider_longitude = _extract_rider_coordinates(request)

            order = Order.objects.get(
                id=order_id,
                order_type='delivery',
                status='ready',
                delivery_partner__isnull=True
            )

            order.delivery_partner = request.user
            # Keep status as "ready" until rider confirms pickup.
            flow_updates = {
                'accepted_at': timezone.now().isoformat(),
                'picked_confirmed': False,
                'picked_confirmed_at': None,
            }
            if rider_latitude is not None and rider_longitude is not None:
                flow_updates.update(
                    accepted_rider_latitude=rider_latitude,
                    accepted_rider_longitude=rider_longitude,
                    last_rider_latitude=rider_latitude,
                    last_rider_longitude=rider_longitude,
                    last_location_at=timezone.now().isoformat(),
                )
            _set_delivery_flow(
                order,
                **flow_updates,
            )
            order.save(update_fields=['delivery_partner', 'pricing_snapshot', 'updated_at'])
            _upsert_tracking_for_order(order, request.user, rider_latitude, rider_longitude)

            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or already assigned'},
                status=status.HTTP_404_NOT_FOUND
            )


class MarkDeliveryPickedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            rider_latitude, rider_longitude = _extract_rider_coordinates(request)

            order = Order.objects.get(
                id=order_id,
                order_type='delivery',
                delivery_partner=request.user
            )

            current_status = str(order.status or '').lower()
            if current_status == 'out_for_delivery' and _is_pickup_confirmed(order):
                return Response(
                    OrderSerializer(order, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

            if current_status not in {'ready', 'accepted', 'out_for_delivery'}:
                return Response(
                    {'error': 'Pickup can only be confirmed for ready deliveries.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = 'out_for_delivery'
            flow_updates = {
                'picked_confirmed': True,
                'picked_confirmed_at': timezone.now().isoformat(),
            }
            if rider_latitude is not None and rider_longitude is not None:
                flow_updates.update(
                    last_rider_latitude=rider_latitude,
                    last_rider_longitude=rider_longitude,
                    last_location_at=timezone.now().isoformat(),
                )
            _set_delivery_flow(
                order,
                **flow_updates,
            )
            order.save(update_fields=['status', 'pricing_snapshot', 'updated_at'])
            _upsert_tracking_for_order(order, request.user, rider_latitude, rider_longitude)

            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND
            )


class CancelDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, order_type='delivery')
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        status_value = str(order.status or '').lower()
        is_available_job = status_value == 'ready' and order.delivery_partner_id is None
        is_assigned_to_me = order.delivery_partner_id == request.user.id and status_value in {
            'accepted',
            'ready',
            'out_for_delivery',
        }

        if not (is_available_job or is_assigned_to_me):
            return Response(
                {'error': 'This delivery cannot be cancelled from your account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = str(request.data.get('reason', '') or '').strip() or 'Cancelled by delivery partner'

        # Keep a delivery history trail for this partner so the order appears in cancelled lists.
        if order.delivery_partner_id is None:
            order.delivery_partner = request.user

        order.status = 'rejected'
        order.rejection_reason = reason
        order.save(update_fields=['delivery_partner', 'status', 'rejection_reason', 'updated_at'])

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class MarkDeliveryDeliveredView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                id=order_id,
                order_type='delivery',
                delivery_partner=request.user
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND
            )

        current_status = str(order.status or '').lower()
        if current_status == 'delivered':
            return Response(
                OrderSerializer(order, context={'request': request}).data,
                status=status.HTTP_200_OK
            )

        if current_status != 'out_for_delivery':
            return Response(
                {'error': 'Delivery can only be completed after pickup.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not _is_pickup_confirmed(order):
            return Response(
                {'error': 'Please press Mark Picked before marking delivered.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'delivered'
        if not order.estimated_delivery_at:
            order.estimated_delivery_at = timezone.now()
        order.save(update_fields=['status', 'estimated_delivery_at', 'updated_at'])

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class MyDeliveriesView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status', 'all')
        queryset = Order.objects.filter(
            delivery_partner=self.request.user
        ).select_related(
            'student',
            'student__student_profile',
            'restaurant',
            'delivery_partner',
            'delivery_partner__delivery_profile',
            'tracking',
        ).prefetch_related('items__menu_item').order_by('-created_at')

        if status_filter == 'active':
            queryset = queryset.filter(status__in=['ready', 'accepted', 'out_for_delivery'])
        elif status_filter == 'completed':
            queryset = queryset.filter(status='delivered')

        return queryset
