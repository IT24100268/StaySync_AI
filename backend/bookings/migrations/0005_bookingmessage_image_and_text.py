from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_bookingmessage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bookingmessage',
            name='text',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='bookingmessage',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='booking_chat/'),
        ),
    ]

