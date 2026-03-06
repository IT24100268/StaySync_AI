from django.urls import path
from .views import (
    OrderCreateView, OrderListView, OrderDetailView,
    RestaurantOrdersView, AcceptOrderView, RejectOrderView,
    AvailableDeliveriesView, AcceptDeliveryView, MyDeliveriesView
)

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    
    # Restaurant endpoints
    path('restaurant/orders/', RestaurantOrdersView.as_view(), name='restaurant-orders'),
    path('restaurant/<int:order_id>/accept/', AcceptOrderView.as_view(), name='accept-order'),
    path('restaurant/<int:order_id>/reject/', RejectOrderView.as_view(), name='reject-order'),
    
    # Delivery endpoints
    path('delivery/available/', AvailableDeliveriesView.as_view(), name='available-deliveries'),
    path('delivery/<int:order_id>/accept/', AcceptDeliveryView.as_view(), name='accept-delivery'),
    path('delivery/my-deliveries/', MyDeliveriesView.as_view(), name='my-deliveries'),
]
