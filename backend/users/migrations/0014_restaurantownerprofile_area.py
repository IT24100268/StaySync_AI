from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_alter_user_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurantownerprofile',
            name='area',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
