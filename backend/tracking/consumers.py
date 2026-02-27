import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Tracking

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'tracking_{self.order_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        tracking_data = await self.get_tracking_data()
        await self.send(text_data=json.dumps(tracking_data))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def tracking_update(self, event):
        await self.send(text_data=json.dumps(event['data']))
    
    @database_sync_to_async
    def get_tracking_data(self):
        try:
            tracking = Tracking.objects.get(order_id=self.order_id)
            return {
                'rider_name': tracking.rider_name,
                'rider_phone': tracking.rider_phone,
                'current_latitude': str(tracking.current_latitude),
                'current_longitude': str(tracking.current_longitude),
                'eta_minutes': tracking.eta_minutes,
            }
        except Tracking.DoesNotExist:
            return {'error': 'Tracking not found'}
