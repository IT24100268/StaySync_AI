from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Sum
from django.db import transaction
from django.core.cache import cache
from datetime import timedelta

from .models import Order, DeliveryPartner, Delivery, ActivityLog, LiveLocation, Earnings
from .serializers import OrderSerializer, DeliverySerializer, ActivityLogSerializer
from .permissions import DeliveryPartnerOnly
from .utils import api_response
from .validators import validate_delivery_status_transition


@api_view(["GET"])
def test_api(request):
    return api_response(message="Delivery API working ✅", data={})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def available_jobs(request):
    orders = Order.objects.filter(status="ready")
    
    # Price filtering
    min_price = request.query_params.get('min_price')
    max_price = request.query_params.get('max_price')
    
    if min_price:
        orders = orders.filter(total_price__gte=min_price)
    if max_price:
        orders = orders.filter(total_price__lte=max_price)
    
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginator.page_size_query_param = 'page_size'
    paginator.max_page_size = 50
    paginated_orders = paginator.paginate_queryset(orders, request)
    data = OrderSerializer(paginated_orders, many=True).data
    
    return api_response(
        message="Available jobs retrieved",
        data=data,
        meta={
            "count": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": len(paginated_orders),
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link()
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def accept_job(request, order_id):
    partner = DeliveryPartner.objects.get(user=request.user)
    
    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(id=order_id)
        except Order.DoesNotExist:
            return api_response(success=False, message="Order not found", errors={"order_id": "Order does not exist"}, status=404)
        
        if order.status != "ready":
            return api_response(success=False, message="Order already assigned", errors={"order_id": "This order is no longer available"}, status=409)
        
        Delivery.objects.create(order=order, partner=partner, status="assigned")
        order.status = "assigned"
        order.save()
    
    return api_response(message="Job accepted successfully", data={"order_id": order_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def update_partner_status(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    is_online = request.data.get("is_online")
    
    if is_online is None:
        return api_response(success=False, message="is_online field required", errors={"is_online": "This field is required"}, status=400)
    
    partner.is_online = is_online
    partner.save()
    
    ActivityLog.objects.create(
        partner=partner,
        action=f"Status changed to {'online' if is_online else 'offline'}"
    )
    
    return api_response(message="Partner status updated", data={"is_online": partner.is_online})


@api_view(["GET"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def active_deliveries(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    delivery = Delivery.objects.filter(partner=partner).exclude(status="delivered").order_by("-assigned_at").first()
    
    if not delivery:
        return api_response(message="No active deliveries", data=None)
    
    return api_response(message="Active delivery retrieved", data=DeliverySerializer(delivery).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def update_delivery_status(request, delivery_id):
    partner = DeliveryPartner.objects.get(user=request.user)
    
    try:
        delivery = Delivery.objects.get(id=delivery_id, partner=partner)
    except Delivery.DoesNotExist:
        return api_response(success=False, message="Delivery not found", errors={"delivery_id": "Delivery not found or does not belong to you"}, status=404)
    
    new_status = request.data.get("status")
    if not new_status:
        return api_response(success=False, message="Status field required", errors={"status": "This field is required"}, status=400)
    
    # Validate status transition
    is_valid, error_message = validate_delivery_status_transition(delivery.status, new_status)
    if not is_valid:
        return api_response(success=False, message=error_message, errors={"status": error_message}, status=400)
    
    # Update delivery status
    delivery.status = new_status
    delivery.order.status = new_status
    
    # Handle delivered status
    if new_status == "delivered":
        delivery.delivered_at = timezone.now()
        delivery.order.status = "delivered"
        
        # Create earnings
        Earnings.objects.create(
            partner=partner,
            delivery=delivery,
            amount=delivery.order.total_price * 0.2
        )
    
    delivery.save()
    delivery.order.save()
    
    # Log activity
    ActivityLog.objects.create(
        partner=partner,
        action=f"Delivery {delivery.id} status changed to {new_status}"
    )
    
    return api_response(message="Delivery status updated", data=DeliverySerializer(delivery).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def update_location(request, delivery_id):
    partner = DeliveryPartner.objects.get(user=request.user)
    
    try:
        delivery = Delivery.objects.get(id=delivery_id, partner=partner)
    except Delivery.DoesNotExist:
        return api_response(success=False, message="Delivery not found", errors={"delivery_id": "Delivery not found or does not belong to you"}, status=404)
    
    # Check if delivery status allows location updates
    if delivery.status not in ["picked", "onway"]:
        return api_response(success=False, message="Location updates not allowed", errors={"status": f"Cannot update location for delivery with status '{delivery.status}'"}, status=400)
    
    # Rate limiting check
    cache_key = f"location_update_{partner.id}_{delivery_id}"
    if cache.get(cache_key):
        return api_response(success=False, message="Too many requests", errors={"rate_limit": "Please wait 3 seconds between location updates"}, status=429)
    
    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")
    
    if latitude is None or longitude is None:
        return api_response(success=False, message="latitude and longitude required", errors={"location": "Both latitude and longitude are required"}, status=400)
    
    # Validate latitude and longitude ranges
    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (ValueError, TypeError):
        return api_response(success=False, message="Invalid coordinates", errors={"location": "Latitude and longitude must be valid numbers"}, status=400)
    
    if not (-90 <= latitude <= 90):
        return api_response(success=False, message="Invalid latitude", errors={"latitude": "Latitude must be between -90 and 90"}, status=400)
    
    if not (-180 <= longitude <= 180):
        return api_response(success=False, message="Invalid longitude", errors={"longitude": "Longitude must be between -180 and 180"}, status=400)
    
    LiveLocation.objects.create(
        delivery=delivery,
        latitude=latitude,
        longitude=longitude
    )
    
    # Set rate limit cache (3 seconds)
    cache.set(cache_key, True, 3)
    
    return api_response(message="Location updated", data={"latitude": latitude, "longitude": longitude}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def earnings_summary(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    now = timezone.now()
    
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    earnings = Earnings.objects.filter(partner=partner)
    
    today_total = earnings.filter(date__gte=today_start).aggregate(Sum("amount"))["amount__sum"] or 0
    week_total = earnings.filter(date__gte=week_start).aggregate(Sum("amount"))["amount__sum"] or 0
    month_total = earnings.filter(date__gte=month_start).aggregate(Sum("amount"))["amount__sum"] or 0
    all_total = earnings.aggregate(Sum("amount"))["amount__sum"] or 0
    
    recent = earnings.order_by("-date")[:10].values("date", "amount", "delivery_id")
    
    data = {
        "today_total": today_total,
        "week_total": week_total,
        "month_total": month_total,
        "all_total": all_total,
        "recent": list(recent)
    }
    
    return api_response(message="Earnings summary retrieved", data=data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def activity_logs(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    days = int(request.query_params.get("days", 7))
    
    cutoff_date = timezone.now() - timedelta(days=days)
    logs = ActivityLog.objects.filter(partner=partner, timestamp__gte=cutoff_date).order_by("-timestamp")
    
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginator.page_size_query_param = 'page_size'
    paginator.max_page_size = 50
    paginated_logs = paginator.paginate_queryset(logs, request)
    data = ActivityLogSerializer(paginated_logs, many=True).data
    
    return api_response(
        message="Activity logs retrieved",
        data=data,
        meta={
            "count": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": len(paginated_logs),
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "days": days
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def my_deliveries(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    status_filter = request.query_params.get("status", "all")
    
    deliveries = Delivery.objects.filter(partner=partner)
    
    if status_filter == "active":
        deliveries = deliveries.exclude(status="delivered")
    elif status_filter == "completed":
        deliveries = deliveries.filter(status="delivered")
    
    deliveries = deliveries.order_by("-assigned_at")
    
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginator.page_size_query_param = 'page_size'
    paginator.max_page_size = 50
    paginated_deliveries = paginator.paginate_queryset(deliveries, request)
    data = DeliverySerializer(paginated_deliveries, many=True).data
    
    return api_response(
        message="Deliveries retrieved",
        data=data,
        meta={
            "count": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": len(paginated_deliveries),
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "filter": status_filter
        }
    )



@api_view(["GET"])
@permission_classes([IsAuthenticated, DeliveryPartnerOnly])
def dashboard_summary(request):
    partner = DeliveryPartner.objects.get(user=request.user)
    now = timezone.now()
    
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    available_jobs_count = Order.objects.filter(status="ready").count()
    active_deliveries_count = Delivery.objects.filter(partner=partner).exclude(status="delivered").count()
    completed_deliveries_count = Delivery.objects.filter(partner=partner, status="delivered").count()
    
    active_delivery = Delivery.objects.filter(partner=partner).exclude(status="delivered").order_by("-assigned_at").first()
    active_delivery_data = DeliverySerializer(active_delivery).data if active_delivery else None
    
    earnings = Earnings.objects.filter(partner=partner)
    today_total = earnings.filter(date__gte=today_start).aggregate(Sum("amount"))["amount__sum"] or 0
    week_total = earnings.filter(date__gte=week_start).aggregate(Sum("amount"))["amount__sum"] or 0
    month_total = earnings.filter(date__gte=month_start).aggregate(Sum("amount"))["amount__sum"] or 0
    all_total = earnings.aggregate(Sum("amount"))["amount__sum"] or 0
    
    data = {
        "partner": {
            "id": partner.id,
            "is_online": partner.is_online,
            "rating": partner.rating if hasattr(partner, 'rating') else None
        },
        "counts": {
            "available_jobs": available_jobs_count,
            "active_deliveries": active_deliveries_count,
            "completed_deliveries": completed_deliveries_count
        },
        "active_delivery": active_delivery_data,
        "earnings": {
            "today_total": today_total,
            "week_total": week_total,
            "month_total": month_total,
            "all_total": all_total
        }
    }
    
    return api_response(message="Dashboard summary retrieved", data=data)
