from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryPartnerViewSet

router = DefaultRouter()
router.register(r'', DeliveryPartnerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]