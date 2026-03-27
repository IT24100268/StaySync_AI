from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_hostelownerprofile_latitude_and_longitude'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='display_image',
            field=models.ImageField(blank=True, null=True, upload_to='student_profiles/'),
        ),
    ]
