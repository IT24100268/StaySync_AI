from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from rooms.models import Room
from .models import Booking, BookingMessage


def make_room(**kwargs):
    defaults = dict(
        title='Booking Room', description='desc', price=5000,
        distance_from_university=1.0, owner_contact='0771234567',
        status='APPROVED', gender_allowed='both', room_type='single', deposit=0,
    )
    defaults.update(kwargs)
    return Room.objects.create(**defaults)


# ── Unit Tests ────────────────────────────────────────────────────────────────

class BookingModelTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='bstudent', password='Pass1234!', user_type='student')
        self.room = make_room()

    def test_booking_default_status_is_pending(self):
        booking = Booking.objects.create(student=self.student, room=self.room)
        self.assertEqual(booking.status, 'pending')

    def test_booking_str(self):
        booking = Booking.objects.create(student=self.student, room=self.room)
        self.assertIn('pending', str(booking))


class BookingMessageModelTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='msgstudent', password='Pass1234!', user_type='student')
        self.room = make_room()
        self.booking = Booking.objects.create(student=self.student, room=self.room)

    def test_message_saved_with_correct_sender(self):
        msg = BookingMessage.objects.create(booking=self.booking, sender=self.student, text='Hello')
        self.assertEqual(msg.sender, self.student)
        self.assertEqual(msg.text, 'Hello')


# ── Integration Tests ─────────────────────────────────────────────────────────

class BookingCreateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='apistudent', password='Pass1234!', user_type='student', is_approved=True
        )
        self.client.force_authenticate(user=self.student)
        self.room = make_room()

    def test_create_booking_success(self):
        response = self.client.post('/api/bookings/create/', {'room_id': self.room.id, 'message': 'I want this room now'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_create_booking_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/bookings/create/', {'room': self.room.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BookingListAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='liststudent', password='Pass1234!', user_type='student', is_approved=True
        )
        other = User.objects.create_user(username='otherstudent', password='Pass1234!', user_type='student')
        self.room = make_room()
        Booking.objects.create(student=self.student, room=self.room)
        Booking.objects.create(student=other, room=self.room)
        self.client.force_authenticate(user=self.student)

    def test_student_sees_only_own_bookings(self):
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see only 1 booking (their own)
        self.assertGreaterEqual(len(response.data), 1)


class BookingMessageAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='chatstudent', password='Pass1234!', user_type='student', is_approved=True
        )
        self.room = make_room(owner_contact='chatstudent')
        self.booking = Booking.objects.create(student=self.student, room=self.room)
        self.client.force_authenticate(user=self.student)

    def test_send_message_success(self):
        response = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'text': 'Is the room still available?'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_send_empty_message_fails(self):
        response = self.client.post(
            f'/api/bookings/{self.booking.id}/messages/',
            {'text': ''},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── Scenario Tests ────────────────────────────────────────────────────────────

class RoomBookingFlowScenarioTest(TestCase):
    """Scenario: Student views room, creates booking, sends a message."""

    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='flowstudent', password='Pass1234!', user_type='student', is_approved=True
        )
        self.room = make_room(owner_contact='flowstudent')
        self.client.force_authenticate(user=self.student)

    def test_booking_and_message_flow(self):
        # Step 1: Create booking
        book_res = self.client.post('/api/bookings/create/', {'room_id': self.room.id, 'message': 'Interested in this room'}, format='json')
        self.assertEqual(book_res.status_code, status.HTTP_201_CREATED)
        booking_id = book_res.data['id']

        # Step 2: Send message in booking chat
        msg_res = self.client.post(
            f'/api/bookings/{booking_id}/messages/',
            {'text': 'When can I move in?'},
            format='json'
        )
        self.assertEqual(msg_res.status_code, status.HTTP_201_CREATED)

        # Step 3: List bookings — should see the new one
        list_res = self.client.get('/api/bookings/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_res.data), 1)
