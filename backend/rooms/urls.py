from django.urls import path
from .views import RoomListView, RoomDetailView, FavoriteToggleView, FavoriteListView, detect_location, log_search, recommended_rooms, log_click

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('favorite/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('detect-location/', detect_location, name='detect-location'),
    path('log-search/', log_search, name='room-log-search'),
    path('log-click/', log_click, name='room-log-click'),
    path('recommended/', recommended_rooms, name='room-recommended'),
]
