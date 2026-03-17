from django.urls import path
from .views import RoomListView, RoomDetailView, FavoriteToggleView, FavoriteListView, detect_location

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('favorite/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('detect-location/', detect_location, name='detect-location'),
]
