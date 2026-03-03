from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register_owner, login_owner, OwnerProfileView

urlpatterns = [
    path('register/', register_owner, name='register'),
    path('login/', login_owner, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', OwnerProfileView.as_view(), name='profile'),
]
