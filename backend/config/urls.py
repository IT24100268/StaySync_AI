from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/restaurants/', include('restaurants.urls')),
    path('api/restaurant/', include('restaurant.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/tracking/', include('tracking.urls')),
    path('api/admin/', include('admin_panel.urls')),
    path('api/reports/', include('admin_panel.urls')),
    path('api/owner/', include('owner.urls')),
    path('api/delivery/', include('delivery.urls')),
    path('api/reviews/', include('reviews.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
