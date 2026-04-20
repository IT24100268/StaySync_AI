from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import User
from .models import AdminNotification


@receiver(post_save, sender=User)
def notify_new_user_registration(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.is_staff or instance.is_superuser:
        return

    type_map = {
        'hostel_owner': ('new_owner', 'New Hostel Owner Registered',
                         f'{instance.username} ({instance.email}) registered as a hostel owner and is awaiting approval.'),
        'restaurant_owner': ('new_restaurant_owner', 'New Restaurant Owner Registered',
                             f'{instance.username} ({instance.email}) registered as a restaurant owner.'),
        'delivery': ('new_delivery_partner', 'New Delivery Partner Registered',
                     f'{instance.username} ({instance.email}) registered as a delivery partner.'),
        'student': ('new_student', 'New Student Registered',
                    f'{instance.username} ({instance.email}) joined as a student.'),
    }

    entry = type_map.get(instance.user_type)
    if entry:
        notif_type, title, body = entry
        AdminNotification.objects.create(
            title=title,
            body=body,
            notification_type=notif_type,
            target_id=instance.id,
        )


def _notify_pending(sender_model, instance, created, notif_type, title_fn, body_fn):
    if created and getattr(instance, 'status', None) == 'PENDING':
        AdminNotification.objects.create(
            title=title_fn(instance),
            body=body_fn(instance),
            notification_type=notif_type,
            target_id=instance.id,
        )


def connect_pending_signals():
    from rooms.models import Room
    from restaurants.models import Restaurant
    from delivery.models import DeliveryPartner
    from .models import Report

    @receiver(post_save, sender=Room)
    def notify_pending_room(sender, instance, created, **kwargs):
        _notify_pending(
            sender, instance, created,
            'pending_room',
            lambda r: f'New Room Pending Approval',
            lambda r: f'Room "{r.title}" was submitted and needs review.',
        )

    @receiver(post_save, sender=Restaurant)
    def notify_pending_restaurant(sender, instance, created, **kwargs):
        _notify_pending(
            sender, instance, created,
            'pending_restaurant',
            lambda r: f'New Restaurant Pending Approval',
            lambda r: f'Restaurant "{r.name}" was submitted and needs review.',
        )

    @receiver(post_save, sender=DeliveryPartner)
    def notify_pending_partner(sender, instance, created, **kwargs):
        _notify_pending(
            sender, instance, created,
            'pending_partner',
            lambda p: f'New Delivery Partner Pending Approval',
            lambda p: f'Delivery partner "{p.user.username}" applied and needs review.',
        )

    @receiver(post_save, sender=Report)
    def notify_new_report(sender, instance, created, **kwargs):
        if created:
            AdminNotification.objects.create(
                title='New Report Submitted',
                body=f'Report #{instance.id} on {instance.target_type} #{instance.target_id}: {instance.reason}',
                notification_type='new_report',
                target_id=instance.id,
            )


connect_pending_signals()
