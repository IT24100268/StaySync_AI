from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_restaurantownerprofile_latitude_and_longitude'),
    ]

    operations = [
        migrations.AddField(
            model_name='hostelownerprofile',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='hostelownerprofile',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
