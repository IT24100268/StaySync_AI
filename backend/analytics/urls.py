from django.urls import path
from .views import dashboard_stats, listing_stats, monthly_stats

urlpatterns = [
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('listing/<int:listing_id>/', listing_stats, name='listing_stats'),
    path('monthly/', monthly_stats, name='monthly_stats'),
]
