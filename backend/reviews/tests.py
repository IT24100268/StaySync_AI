from django.test import TestCase
from django.db import IntegrityError
from users.models import User
from rooms.models import Room
from restaurants.models import Restaurant
from .models import RoomReview, RestaurantReview


def make_room():
    return Room.objects.create(
        title='Review Room', description='desc', price=5000,
        distance_from_university=1.0, owner_contact='0771234567',
        status='APPROVED', gender_allowed='both', room_type='single', deposit=0,
    )


def make_restaurant(owner):
    return Restaurant.objects.create(
        owner=owner, name='Test Restaurant', email='r@test.com',
        phone='0771234567', address='123 Main St', status='APPROVED', is_approved=True
    )


# ── Unit Tests ────────────────────────────────────────────────────────────────

class RoomReviewModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reviewer', password='Pass1234!')
        self.room = make_room()

    def test_room_review_created(self):
        review = RoomReview.objects.create(user=self.user, room=self.room, rating=4, comment='Good room')
        self.assertEqual(review.rating, 4)

    def test_duplicate_room_review_raises_error(self):
        RoomReview.objects.create(user=self.user, room=self.room, rating=4, comment='Good')
        with self.assertRaises(IntegrityError):
            RoomReview.objects.create(user=self.user, room=self.room, rating=3, comment='Again')

    def test_review_str(self):
        review = RoomReview.objects.create(user=self.user, room=self.room, rating=5, comment='Excellent')
        self.assertIn('reviewer', str(review))


class RestaurantReviewModelTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='restowner', password='Pass1234!', user_type='restaurant_owner')
        self.user = User.objects.create_user(username='restreviewer', password='Pass1234!')
        self.restaurant = make_restaurant(self.owner)

    def test_restaurant_review_created(self):
        review = RestaurantReview.objects.create(user=self.user, restaurant=self.restaurant, rating=5, comment='Amazing')
        self.assertEqual(review.rating, 5)

    def test_duplicate_restaurant_review_raises_error(self):
        RestaurantReview.objects.create(user=self.user, restaurant=self.restaurant, rating=5, comment='Great')
        with self.assertRaises(IntegrityError):
            RestaurantReview.objects.create(user=self.user, restaurant=self.restaurant, rating=3, comment='Again')
