from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0007_merge_0005_room_views_0006_add_views_field'),
    ]

    operations = [
        # Add without unique so existing rows can all have '' temporarily
        migrations.AddField(
            model_name='room',
            name='hostel_id',
            field=models.CharField(blank=True, max_length=10, default=''),
            preserve_default=False,
        ),
    ]
