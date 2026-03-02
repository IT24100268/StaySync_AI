from django.urls import path
from .views import ApproveRoom, BlockUser, AdminDashboardStats

urlpatterns = [
    path("approve-room/<int:pk>/", ApproveRoom.as_view()),
    path("block-user/<int:pk>/", BlockUser.as_view()),
    path("dashboard-stats/", AdminDashboardStats.as_view()),
]