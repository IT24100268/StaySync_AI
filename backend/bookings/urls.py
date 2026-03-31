from django.urls import path
from .views import BookingCreateView, BookingListView, BookingMessageListCreateView

urlpatterns = [
    path('', BookingListView.as_view(), name='booking-list'),
    path('create/', BookingCreateView.as_view(), name='booking-create'),
    path('<int:booking_id>/messages/', BookingMessageListCreateView.as_view(), name='booking-messages'),
]
