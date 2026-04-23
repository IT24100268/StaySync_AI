from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from restaurants.models import Restaurant, Menu
from .models import Order, OrderItem


def make_restaurant(owner):
    return Restaurant.objects.create(
        owner=owner, name='Order Restaurant', email='order@test.com',
        phone='0771234567', address='123 Main St', status='APPROVED', is_approved=True
    )


def make_menu(restaurant):
    return Menu.objects.create(
        restaurant=restaurant, name='Rice & Curry', price=250, is_available=True
    )


# ── Unit Tests ────────────────────────────────────────────────────────────────

class OrderModelTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='orderowner', password='Pass1234!', user_type='restaurant_owner')
        self.student = User.objects.create_user(username='orderstudent', password='Pass1234!', user_type='student')
        self.restaurant = make_restaurant(self.owner)

    def test_order_default_status_is_pending(self):
        order = Order.objects.create(
            student=self.student, restaurant=self.restaurant,
            delivery_address='123 Test St', total_price=500
        )
        self.assertEqual(order.status, 'pending')

    def test_order_str(self):
        order = Order.objects.create(
            student=self.student, restaurant=self.restaurant,
            delivery_address='123 Test St', total_price=500
        )
        self.assertIn(str(order.id), str(order))


class OrderItemModelTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='itemowner', password='Pass1234!', user_type='restaurant_owner')
        self.student = User.objects.create_user(username='itemstudent', password='Pass1234!', user_type='student')
        self.restaurant = make_restaurant(self.owner)
        self.menu = make_menu(self.restaurant)
        self.order = Order.objects.create(
            student=self.student, restaurant=self.restaurant,
            delivery_address='123 Test St', total_price=500
        )

    def test_order_item_created(self):
        item = OrderItem.objects.create(order=self.order, menu_item=self.menu, quantity=2, price=500)
        self.assertEqual(item.quantity, 2)

    def test_order_item_str(self):
        item = OrderItem.objects.create(order=self.order, menu_item=self.menu, quantity=1, price=250)
        self.assertIn('Rice & Curry', str(item))


# ── Integration Tests ─────────────────────────────────────────────────────────

class OrderCreateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='apiowner', password='Pass1234!', user_type='restaurant_owner', is_approved=True
        )
        self.student = User.objects.create_user(
            username='apistudent', password='Pass1234!', user_type='student', is_approved=True
        )
        self.restaurant = make_restaurant(self.owner)
        self.menu = make_menu(self.restaurant)
        self.client.force_authenticate(user=self.student)

    def test_create_order_success(self):
        payload = {
            'restaurant_id': self.restaurant.id,
            'items': [{'menu_item_id': self.menu.id, 'quantity': 2, 'price': '250.00'}],
            'delivery_address': '456 Test St',
            'order_type': 'takeaway'
        }
        response = self.client.post('/api/orders/create/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_order_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/orders/create/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrderListAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='listowner', password='Pass1234!', user_type='restaurant_owner', is_approved=True
        )
        self.student = User.objects.create_user(
            username='liststudent', password='Pass1234!', user_type='student', is_approved=True
        )
        self.restaurant = make_restaurant(self.owner)
        Order.objects.create(student=self.student, restaurant=self.restaurant, delivery_address='123 St', total_price=500)
        self.client.force_authenticate(user=self.student)

    def test_student_sees_own_orders(self):
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
