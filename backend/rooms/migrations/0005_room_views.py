from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0004_room_address_room_deposit'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='views',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

