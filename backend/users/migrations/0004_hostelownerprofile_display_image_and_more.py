from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_is_approved_alter_user_user_type_studentprofile_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='hostelownerprofile',
            name='display_image',
            field=models.ImageField(blank=True, null=True, upload_to='owner_profiles/'),
        ),
        migrations.AddField(
            model_name='restaurantownerprofile',
            name='display_image',
            field=models.ImageField(blank=True, null=True, upload_to='owner_profiles/'),
        ),
    ]
