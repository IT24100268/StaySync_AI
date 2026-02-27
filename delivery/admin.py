from django.contrib import admin
from .models import DeliveryPartner, Order, Delivery, LiveLocation, Earnings, ActivityLog

admin.site.register(DeliveryPartner)
admin.site.register(Order)
admin.site.register(Delivery)
admin.site.register(LiveLocation)
admin.site.register(Earnings)
admin.site.register(ActivityLog)