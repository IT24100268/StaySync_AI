from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from .models import Room, Favorite


def make_room(**kwargs):
    defaults = dict(
        title='Test Room', description='Nice room', price=5000,
        distance_from_university=1.0, owner_contact='0771234567',
        status='APPROVED', gender_allowed='both', room_type='single',
        deposit=0,
    )
    defaults.update(kwargs)
    return Room.objects.create(**defaults)


# ── Unit Tests ────────────────────────────────────────────────────────────────

class RoomModelTest(TestCase):
    def test_hostel_id_auto_generated(self):
        room = make_room()
        self.assertTrue(room.hostel_id.startswith('H'))
        self.assertEqual(len(room.hostel_id), 5)  # H + 4 digits

    def test_hostel_id_not_overwritten_on_resave(self):
        room = make_room()
        original_id = room.hostel_id
        room.title = 'Updated Title'
        room.save()
        room.refresh_from_db()
        self.assertEqual(room.hostel_id, original_id)

    def test_room_default_status_is_approved(self):
        room = make_room()
        self.assertEqual(room.status, 'APPROVED')


class FavoriteModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='favuser', password='Pass1234!')
        self.room = make_room()

    def test_favorite_created_successfully(self):
        fav = Favorite.objects.create(user=self.user, room=self.room)
        self.assertEqual(fav.user, self.user)

    def test_duplicate_favorite_raises_error(self):
        Favorite.objects.create(user=self.user, room=self.room)
        with self.assertRaises(Exception):
            Favorite.objects.create(user=self.user, room=self.room)


# ── Integration Tests ─────────────────────────────────────────────────────────

class RoomListAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='roomuser', password='Pass1234!', user_type='student', is_approved=True
        )
        self.client.force_authenticate(user=self.user)
        make_room(title='Room A')
        make_room(title='Room B', status='PENDING')

    def test_room_list_returns_only_approved(self):
        response = self.client.get('/api/rooms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [r['title'] for r in response.data]
        self.assertIn('Room A', titles)
        self.assertNotIn('Room B', titles)

    def test_room_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/rooms/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoomDetailAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='detailuser', password='Pass1234!', user_type='student', is_approved=True
        )
        self.client.force_authenticate(user=self.user)
        self.room = make_room(title='Detail Room')

    def test_room_detail_returns_correct_room(self):
        response = self.client.get(f'/api/rooms/{self.room.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Detail Room')

    def test_room_detail_not_found_returns_404(self):
        response = self.client.get('/api/rooms/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FavoriteToggleAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='favtoggle', password='Pass1234!', user_type='student', is_approved=True
        )
        self.client.force_authenticate(user=self.user)
        self.room = make_room()

    def test_add_favorite(self):
        response = self.client.post('/api/rooms/favorite/', {'room_id': self.room.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_remove_favorite_on_second_toggle(self):
        self.client.post('/api/rooms/favorite/', {'room_id': self.room.id}, format='json')
        response = self.client.post('/api/rooms/favorite/', {'room_id': self.room.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Removed', response.data['message'])

    def test_favorite_nonexistent_room_returns_404(self):
        response = self.client.post('/api/rooms/favorite/', {'room_id': 99999}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
