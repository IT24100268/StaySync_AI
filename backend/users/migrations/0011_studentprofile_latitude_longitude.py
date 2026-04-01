from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_studentprofile_display_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]

