from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("owner", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="AIRoomGeneration",
        ),
    ]
