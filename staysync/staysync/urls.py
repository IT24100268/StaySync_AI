from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home(request):
    return HttpResponse("StaySync Backend Running")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    path('api/users/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/restaurants/', include('restaurants.urls')),
    path('api/deliveries/', include('deliveries.urls')),
    path('api/adminpanel/', include('adminpanel.urls')),
]