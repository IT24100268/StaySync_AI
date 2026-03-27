from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_deliveryprofile_display_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurantownerprofile',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='restaurantownerprofile',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
