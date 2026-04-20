from django.db import migrations, models


def backfill_hostel_ids(apps, schema_editor):
    Room = apps.get_model('rooms', 'Room')
    for room in Room.objects.order_by('id'):
        if not room.hostel_id:
            room.hostel_id = f'H{room.id:04d}'
            room.save(update_fields=['hostel_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0008_room_hostel_id'),
    ]

    operations = [
        migrations.RunPython(backfill_hostel_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='room',
            name='hostel_id',
            field=models.CharField(blank=True, max_length=10, unique=True),
        ),
    ]
