from django.urls import path
from .views import recommend_rooms_view, meal_plan_view

urlpatterns = [
    path('recommend-rooms/', recommend_rooms_view, name='ai-recommend-rooms'),
    path('meal-plan/',        meal_plan_view,        name='ai-meal-plan'),
]
