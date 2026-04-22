from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0003_add_image_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='restaurant_id',
            field=models.CharField(max_length=10, unique=True, null=True, blank=True),
        ),
    ]
