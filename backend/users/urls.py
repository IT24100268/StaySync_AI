from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, ProfileView, LoginView, PendingUsersView, ApproveUserView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('admin/pending-users/', PendingUsersView.as_view(), name='pending_users'),
    path('admin/approve-user/<int:user_id>/', ApproveUserView.as_view(), name='approve_user'),
]
