from rest_framework import serializers


class RoomRecommendRequest(serializers.Serializer):
    area         = serializers.CharField()
    gender       = serializers.ChoiceField(choices=['Girls', 'Boys'])
    total_budget = serializers.IntegerField(min_value=5000)
    room_type    = serializers.ChoiceField(choices=['Single', 'Shared'])
    facilities   = serializers.ListField(child=serializers.CharField(), default=list)
    top_n        = serializers.IntegerField(default=5, min_value=1, max_value=20)


class MealPlanRequest(serializers.Serializer):
    hostel_id     = serializers.CharField()
    total_budget  = serializers.IntegerField(min_value=5000)
    veg_only      = serializers.BooleanField(default=False)
    allow_partial = serializers.BooleanField(default=False)
