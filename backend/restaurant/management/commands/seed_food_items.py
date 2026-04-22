import csv
import os
from django.core.management.base import BaseCommand
from restaurant.models import FoodItem, Restaurant
from restaurants.models import Restaurant as PublicRestaurant


class Command(BaseCommand):
    help = 'Seed food items from food_items_300.csv'

    def handle(self, *args, **kwargs):
        csv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'food_items_300.csv')
        csv_path = os.path.abspath(csv_path)

        if not os.path.exists(csv_path):
            self.stderr.write(f'CSV not found at: {csv_path}')
            return

        # Build restaurant_id -> Restaurant map
        restaurant_map = {r.restaurant_id: r for r in Restaurant.objects.exclude(restaurant_id=None)}

        # Also build from public restaurants table if not in legacy table
        public_map = {r.restaurant_id: r.owner for r in PublicRestaurant.objects.exclude(restaurant_id=None)}

        created = 0
        skipped = 0
        missing = set()

        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                restaurant_id = row['restaurant_id'].strip()
                food_id = row['food_id'].strip()
                name = row['food_item'].strip()
                meal_type = row['meal_type'].strip().lower()
                veg_nonveg = 'veg' if row['veg_nonveg'].strip().lower() == 'veg' else 'nonveg'
                price = row['price_lkr'].strip()

                # Skip if food_id already exists
                if FoodItem.objects.filter(food_id=food_id).exists():
                    skipped += 1
                    continue

                restaurant = restaurant_map.get(restaurant_id)

                # If not in legacy table, find via public table owner
                if not restaurant and restaurant_id in public_map:
                    owner = public_map[restaurant_id]
                    restaurant = Restaurant.objects.filter(owner=owner).first()

                if not restaurant:
                    missing.add(restaurant_id)
                    skipped += 1
                    continue

                FoodItem.objects.create(
                    restaurant=restaurant,
                    food_id=food_id,
                    name=name,
                    meal_type=meal_type,
                    veg_nonveg=veg_nonveg,
                    price=price,
                    is_available=True,
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Created: {created} food items'))
        if skipped:
            self.stdout.write(f'Skipped: {skipped} (already exist or missing restaurant)')
        if missing:
            self.stdout.write(self.style.WARNING(f'Missing restaurant IDs: {sorted(missing)}'))
