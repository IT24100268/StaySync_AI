from decimal import Decimal
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from delivery.models import ActivityLog, Delivery, DeliveryPartner, Earnings, LiveLocation, Order


class Command(BaseCommand):
    help = "Seed mock delivery data for dashboard testing."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="Thamil", help="Delivery partner username")
        parser.add_argument("--password", default="Thamil@123", help="Password used if user needs to be created")
        parser.add_argument("--count", type=int, default=10, help="Base number of records per dataset")
        parser.add_argument("--reset", action="store_true", help="Delete existing data for this partner before seeding")

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        count = max(10, int(options["count"]))
        reset = options["reset"]

        user, user_created = User.objects.get_or_create(username=username, defaults={"email": f"{username}@staysync.local"})
        if user_created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user '{username}'"))

        partner, _ = DeliveryPartner.objects.get_or_create(user=user, defaults={"is_online": True, "rating": 4.8})
        partner.is_online = True
        partner.rating = 4.8
        partner.save(update_fields=["is_online", "rating"])

        if reset:
            self._reset_partner_data(partner)
            self.stdout.write(self.style.WARNING("Existing partner-related data removed."))

        restaurants = [
            "SpiceHub Restaurant",
            "FreshBite Cafe",
            "Minton Bakery",
            "Veggie Delight",
            "Lakeside House",
            "City Corner Meals",
            "Kottu Palace",
            "Green Spoon",
            "QuickBowl Kitchen",
            "Campus Dine",
        ]
        students = [
            "Tim",
            "Nimal",
            "Seliwy",
            "Aisha",
            "Kavindu",
            "Maria",
            "Rohan",
            "Nethmi",
            "Ibrahim",
            "Sasha",
        ]
        drops = [
            "Greenview Hostel",
            "Maple Residence",
            "Lakeside House",
            "Roswel PG",
            "Villa St Block C",
            "City Hostel Wing B",
            "Hillview Lane",
            "Oak Residency",
            "Campus Dorm South",
            "Sunset Inn",
        ]

        now = timezone.now()

        # 1) Ready orders (Available Jobs) - at least 10
        ready_orders = []
        for i in range(count):
            idx = i % 10
            ready_orders.append(
                Order(
                    restaurant_name=restaurants[idx],
                    student_name=students[idx],
                    pickup_address=f"{restaurants[idx]} Pickup Point, University Rd #{i + 1}",
                    drop_address=drops[idx],
                    total_price=Decimal("180.00") + Decimal(i * 12),
                    status="ready",
                )
            )
        Order.objects.bulk_create(ready_orders)

        # 2) Active deliveries (assigned/picked/onway) - at least 10
        active_statuses = ["assigned", "picked", "onway"]
        active_deliveries = []
        for i in range(count):
            idx = i % 10
            status = active_statuses[i % len(active_statuses)]
            order = Order.objects.create(
                restaurant_name=restaurants[idx],
                student_name=students[(idx + 3) % 10],
                pickup_address=f"{restaurants[idx]} Kitchen, Block {(i % 4) + 1}",
                drop_address=drops[(idx + 2) % 10],
                total_price=Decimal("150.00") + Decimal(i * 10),
                status=status,
            )
            active_deliveries.append(Delivery.objects.create(order=order, partner=partner, status=status))

        # 3) Completed deliveries + earnings - at least 10
        completed_deliveries = []
        for i in range(count):
            idx = i % 10
            order = Order.objects.create(
                restaurant_name=restaurants[(idx + 1) % 10],
                student_name=students[(idx + 5) % 10],
                pickup_address=f"{restaurants[(idx + 1) % 10]} Outlet, Road {(i % 5) + 1}",
                drop_address=drops[(idx + 4) % 10],
                total_price=Decimal("200.00") + Decimal(i * 15),
                status="delivered",
            )
            delivery = Delivery.objects.create(
                order=order,
                partner=partner,
                status="delivered",
                delivered_at=now - timedelta(hours=i + 1),
            )
            completed_deliveries.append(delivery)

            earning = Earnings.objects.create(
                partner=partner,
                delivery=delivery,
                amount=(order.total_price * Decimal("0.20")),
            )
            Earnings.objects.filter(pk=earning.pk).update(date=now - timedelta(hours=i + 1))

        # 4) Live locations for active + completed deliveries
        all_for_location = active_deliveries + completed_deliveries
        for i, delivery in enumerate(all_for_location):
            base_lat = 6.9271 + (i * 0.001)
            base_lng = 79.8612 + (i * 0.001)
            LiveLocation.objects.create(delivery=delivery, latitude=base_lat, longitude=base_lng)
            LiveLocation.objects.create(delivery=delivery, latitude=base_lat + 0.0015, longitude=base_lng + 0.0012)

        # 5) Activity logs - at least 10
        logs = []
        log_count = count * 3
        for i in range(log_count):
            logs.append(
                ActivityLog(
                    partner=partner,
                    action=f"Mock activity #{i + 1}: updated delivery workflow for test scenario",
                )
            )
        ActivityLog.objects.bulk_create(logs)

        # Backdate selected records for realistic timeline.
        self._backdate_records(partner, now)

        summary = {
            "orders_ready": Order.objects.filter(status="ready").count(),
            "my_deliveries_active": Delivery.objects.filter(partner=partner).exclude(status="delivered").count(),
            "my_deliveries_completed": Delivery.objects.filter(partner=partner, status="delivered").count(),
            "earnings_rows": Earnings.objects.filter(partner=partner).count(),
            "activity_rows": ActivityLog.objects.filter(partner=partner).count(),
            "location_rows": LiveLocation.objects.filter(delivery__partner=partner).count(),
        }

        self.stdout.write(self.style.SUCCESS("Mock data seeded successfully."))
        for key, value in summary.items():
            self.stdout.write(f" - {key}: {value}")

    def _reset_partner_data(self, partner):
        Delivery.objects.filter(partner=partner).delete()
        Earnings.objects.filter(partner=partner).delete()
        ActivityLog.objects.filter(partner=partner).delete()
        LiveLocation.objects.filter(delivery__partner=partner).delete()

    def _backdate_records(self, partner, now):
        deliveries = Delivery.objects.filter(partner=partner).order_by("-id")[:120]
        for i, delivery in enumerate(deliveries):
            assigned_time = now - timedelta(minutes=(i + 1) * 18)
            Delivery.objects.filter(pk=delivery.pk).update(assigned_at=assigned_time)
            Order.objects.filter(pk=delivery.order_id).update(created_at=assigned_time - timedelta(minutes=8))

        logs = ActivityLog.objects.filter(partner=partner).order_by("-id")[:200]
        for i, log in enumerate(logs):
            ActivityLog.objects.filter(pk=log.pk).update(timestamp=now - timedelta(minutes=(i + 1) * 7))
