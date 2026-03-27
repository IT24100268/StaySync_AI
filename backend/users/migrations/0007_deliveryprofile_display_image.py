from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_merge_20260322_0001'),
    ]

    operations = [
        migrations.AddField(
            model_name='deliveryprofile',
            name='display_image',
            field=models.ImageField(blank=True, null=True, upload_to='owner_profiles/'),
        ),
    ]
