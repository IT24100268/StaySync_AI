from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from listings.models import Listing
from enquiries.models import Enquiry
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    owner_profile = request.user.owner_profile
    listings = Listing.objects.filter(owner=owner_profile)
    
    total_listings = listings.count()
    total_views = listings.aggregate(Sum('views_count'))['views_count__sum'] or 0
    total_enquiries = Enquiry.objects.filter(listing__owner=owner_profile).count()
    pending_enquiries = Enquiry.objects.filter(
        listing__owner=owner_profile, 
        status='pending'
    ).count()
    
    return Response({
        'total_listings': total_listings,
        'total_views': total_views,
        'total_enquiries': total_enquiries,
        'pending_enquiries': pending_enquiries,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listing_stats(request, listing_id):
    try:
        listing = Listing.objects.get(
            id=listing_id, 
            owner=request.user.owner_profile
        )
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found'}, status=404)
    
    enquiries_count = listing.enquiries.count()
    
    return Response({
        'listing_id': listing.id,
        'title': listing.title,
        'views_count': listing.views_count,
        'enquiries_count': enquiries_count,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_stats(request):
    owner_profile = request.user.owner_profile
    six_months_ago = datetime.now() - timedelta(days=180)
    
    enquiries_by_month = Enquiry.objects.filter(
        listing__owner=owner_profile,
        created_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    return Response({
        'enquiries_by_month': list(enquiries_by_month)
    })
