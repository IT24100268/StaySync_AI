from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("rooms", "0005_room_views"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIRoomGeneration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_image", models.ImageField(upload_to="ai_room_generation/source/")),
                ("generated_image", models.ImageField(upload_to="ai_room_generation/generated/")),
                ("selected_options", models.JSONField(blank=True, default=list)),
                ("detected_layout", models.JSONField(blank=True, default=dict)),
                ("prompt", models.TextField(blank=True)),
                ("analysis_model", models.CharField(default="gpt-4.1-mini", max_length=64)),
                ("generation_model", models.CharField(default="gpt-image-1", max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_room_generations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "room",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_room_generations",
                        to="rooms.room",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
