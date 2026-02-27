from django.urls import path
from .views import TrackingDetailView

urlpatterns = [
    path('<int:order_id>/', TrackingDetailView.as_view(), name='tracking-detail'),
]
