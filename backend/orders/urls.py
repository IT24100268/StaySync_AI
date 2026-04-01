from django.urls import path
from .views import (
    OrderCreateView, OrderListView, OrderDetailView, OrderEstimateView,
    RestaurantOrdersView, AcceptOrderView, RejectOrderView, MarkTakeawayReadyView, MarkCollectedByPartnerView,
    AvailableDeliveriesView, AcceptDeliveryView, MarkDeliveryPickedView, CancelDeliveryView,
    MarkDeliveryDeliveredView, MyDeliveriesView
)

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('estimate/', OrderEstimateView.as_view(), name='order-estimate'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    
    # Restaurant endpoints
    path('restaurant/orders/', RestaurantOrdersView.as_view(), name='restaurant-orders'),
    path('restaurant/<int:order_id>/accept/', AcceptOrderView.as_view(), name='accept-order'),
    path('restaurant/<int:order_id>/reject/', RejectOrderView.as_view(), name='reject-order'),
    path('restaurant/<int:order_id>/ready-for-pickup/', MarkTakeawayReadyView.as_view(), name='mark-takeaway-ready'),
    path('restaurant/<int:order_id>/collected/', MarkCollectedByPartnerView.as_view(), name='mark-collected-by-partner'),
    
    # Delivery endpoints
    path('delivery/available/', AvailableDeliveriesView.as_view(), name='available-deliveries'),
    path('delivery/<int:order_id>/accept/', AcceptDeliveryView.as_view(), name='accept-delivery'),
    path('delivery/<int:order_id>/picked/', MarkDeliveryPickedView.as_view(), name='mark-delivery-picked'),
    path('delivery/<int:order_id>/cancel/', CancelDeliveryView.as_view(), name='cancel-delivery'),
    path('delivery/<int:order_id>/delivered/', MarkDeliveryDeliveredView.as_view(), name='mark-delivery-delivered'),
    path('delivery/my-deliveries/', MyDeliveriesView.as_view(), name='my-deliveries'),
]
