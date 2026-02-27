from django.urls import path
from . import views

urlpatterns = [
    path("test/", views.test_api),

    path("jobs/available/", views.available_jobs),
    path("jobs/<int:order_id>/accept/", views.accept_job),
    
    path("partner/status/", views.update_partner_status),
    path("dashboard/summary/", views.dashboard_summary),
    path("my/deliveries/", views.my_deliveries),
    path("my/deliveries/active/", views.active_deliveries),
    path("delivery/<int:delivery_id>/status/", views.update_delivery_status),
    path("delivery/<int:delivery_id>/location/", views.update_location),
    path("earnings/summary/", views.earnings_summary),
    path("activity/", views.activity_logs),
]