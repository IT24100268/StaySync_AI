from django.core.management.base import BaseCommand
from users.models import User, Profile

class Command(BaseCommand):
    help = 'Create default users for the system'

    def handle(self, *args, **kwargs):
        users_data = [
            {'username': 'admin', 'password': 'admin123', 'user_type': 'admin', 'email': 'admin@system.com', 'first_name': 'Admin', 'last_name': 'User'},
            {'username': 'hostel_owner', 'password': 'hostel123', 'user_type': 'hostel_owner', 'email': 'hostel@system.com', 'first_name': 'Hostel', 'last_name': 'Owner'},
            {'username': 'restaurant_owner', 'password': 'restaurant123', 'user_type': 'restaurant_owner', 'email': 'restaurant@system.com', 'first_name': 'Restaurant', 'last_name': 'Owner'},
            {'username': 'delivery_person', 'password': 'delivery123', 'user_type': 'delivery_partner', 'email': 'delivery@system.com', 'first_name': 'Delivery', 'last_name': 'Person'},
        ]

        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                password = user_data.pop('password')
                user = User.objects.create_user(**user_data, password=password)
                Profile.objects.create(user=user, university='System', phone_number='0000000000')
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user_data["username"]}'))
