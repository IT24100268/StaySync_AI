from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_owner(apps, schema_editor):
    Room = apps.get_model('rooms', 'Room')
    User = apps.get_model('users', 'User')
    HostelOwnerProfile = apps.get_model('users', 'HostelOwnerProfile')

    for room in Room.objects.filter(owner__isnull=True):
        contact = (room.owner_contact or '').strip()
        if not contact:
            continue
        # Try matching by email first, then by phone number on hostel profile
        user = User.objects.filter(email=contact).first()
        if not user:
            profile = HostelOwnerProfile.objects.filter(phone_number=contact).first()
            if profile:
                user = profile.user
        if user:
            room.owner = user
            room.save(update_fields=['owner'])


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0011_room_ai_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='owner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='owned_rooms',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(backfill_owner, migrations.RunPython.noop),
    ]
