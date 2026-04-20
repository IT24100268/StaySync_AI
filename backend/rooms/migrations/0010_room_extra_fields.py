from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0009_backfill_hostel_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='room_type',
            field=models.CharField(
                choices=[('single', 'Single'), ('shared', 'Shared')],
                default='single',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='room',
            name='max_capacity',
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='room',
            name='estimated_rating',
            field=models.DecimalField(decimal_places=1, default=3.0, max_digits=2),
        ),
        migrations.AddField(
            model_name='room',
            name='area',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
