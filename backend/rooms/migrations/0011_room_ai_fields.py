from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0010_room_extra_fields'),
    ]

    operations = [
        # Update gender_allowed choices and default
        migrations.AlterField(
            model_name='room',
            name='gender_allowed',
            field=models.CharField(
                choices=[('girls', 'Girls'), ('boys', 'Boys'), ('both', 'Both')],
                default='both',
                max_length=10,
            ),
        ),
        # Fix estimated_rating max_digits 2 -> 3, default 3.0 -> 3.5
        migrations.AlterField(
            model_name='room',
            name='estimated_rating',
            field=models.DecimalField(decimal_places=1, default=3.5, max_digits=3),
        ),
        # Update area: max_length 50 -> 100, add fixed choices
        migrations.AlterField(
            model_name='room',
            name='area',
            field=models.CharField(
                blank=True,
                max_length=100,
                choices=[
                    ('Annasathiram', 'Annasathiram'),
                    ('Arasadi', 'Arasadi'),
                    ('Ariyalai', 'Ariyalai'),
                    ('Chunnakam', 'Chunnakam'),
                    ('Jaffna Town', 'Jaffna Town'),
                    ('Kaithady', 'Kaithady'),
                    ('Kaladdy', 'Kaladdy'),
                    ('Kantharmadam', 'Kantharmadam'),
                    ('Kokuvil', 'Kokuvil'),
                    ('Kokuvil East', 'Kokuvil East'),
                    ('Kondavil', 'Kondavil'),
                    ('Manipay', 'Manipay'),
                    ('Nachimar Koviladi', 'Nachimar Koviladi'),
                    ('Nallur', 'Nallur'),
                    ('Navatkuli', 'Navatkuli'),
                    ('Tellippalai', 'Tellippalai'),
                    ('Thirunelvely', 'Thirunelvely'),
                    ('Uduvil', 'Uduvil'),
                    ('Vannarpannai', 'Vannarpannai'),
                ],
            ),
        ),
        # Make latitude and longitude nullable
        migrations.AlterField(
            model_name='room',
            name='latitude',
            field=models.DecimalField(decimal_places=6, max_digits=9, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='room',
            name='longitude',
            field=models.DecimalField(decimal_places=6, max_digits=9, null=True, blank=True),
        ),
        # New amenity boolean columns
        migrations.AddField(
            model_name='room',
            name='attached_bathroom',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='ac_available',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='fan_available',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='furnished',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='study_table',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='cupboard',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='balcony',
            field=models.BooleanField(default=False),
        ),
    ]
