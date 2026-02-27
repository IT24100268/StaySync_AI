# Generated manually for initial schema.
from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Restaurant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=255)),
                ('phone', models.CharField(max_length=32)),
                ('address', models.TextField()),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('is_approved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'owner',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='restaurants',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='FoodItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                (
                    'price',
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                    ),
                ),
                ('image', models.ImageField(blank=True, null=True, upload_to='food_items/')),
                ('is_available', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'restaurant',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='food_items',
                        to='restaurant.restaurant',
                    ),
                ),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                (
                    'total_amount',
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                    ),
                ),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('PENDING', 'Pending'),
                            ('ACCEPTED', 'Accepted'),
                            ('PREPARING', 'Preparing'),
                            ('READY', 'Ready'),
                            ('OUT_FOR_DELIVERY', 'Out For Delivery'),
                            ('DELIVERED', 'Delivered'),
                            ('CANCELLED', 'Cancelled'),
                        ],
                        default='PENDING',
                        max_length=32,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'restaurant',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='orders',
                        to='restaurant.restaurant',
                    ),
                ),
                (
                    'student',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='student_orders',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                (
                    'subtotal',
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                    ),
                ),
                (
                    'food_item',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='order_items',
                        to='restaurant.fooditem',
                    ),
                ),
                (
                    'order',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='items',
                        to='restaurant.order',
                    ),
                ),
            ],
        ),
    ]
