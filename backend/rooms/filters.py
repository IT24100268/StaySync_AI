import django_filters
from .models import Room

class RoomFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    max_distance = django_filters.NumberFilter(field_name='distance_from_university', lookup_expr='lte')
    gender_allowed = django_filters.CharFilter(field_name='gender_allowed')
    
    class Meta:
        model = Room
        fields = ['gender_allowed', 'min_price', 'max_price', 'max_distance']
