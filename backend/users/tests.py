from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, StudentProfile, OTP


# ── Unit Tests ────────────────────────────────────────────────────────────────

class UserModelTest(TestCase):
    def test_create_student_user(self):
        user = User.objects.create_user(username='student1', password='Pass1234!', user_type='student')
        self.assertEqual(user.user_type, 'student')
        self.assertFalse(user.is_blocked)

    def test_create_hostel_owner_not_approved(self):
        user = User.objects.create_user(username='owner1', password='Pass1234!', user_type='hostel_owner', is_approved=False)
        self.assertFalse(user.is_approved)

    def test_user_blocked_flag(self):
        user = User.objects.create_user(username='blocked1', password='Pass1234!', is_blocked=True)
        self.assertTrue(user.is_blocked)


class OTPModelTest(TestCase):
    def test_otp_is_valid_when_not_expired(self):
        otp = OTP.objects.create(
            email='test@test.com',
            otp_code='123456',
            purpose='registration',
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        self.assertTrue(otp.is_valid())

    def test_otp_is_invalid_when_expired(self):
        otp = OTP.objects.create(
            email='test@test.com',
            otp_code='123456',
            purpose='registration',
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertFalse(otp.is_valid())

    def test_otp_is_invalid_when_already_verified(self):
        otp = OTP.objects.create(
            email='test@test.com',
            otp_code='123456',
            purpose='registration',
            is_verified=True,
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        self.assertFalse(otp.is_valid())

    def test_generate_otp_is_6_digits(self):
        code = OTP.generate_otp()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())


# ── Integration Tests ─────────────────────────────────────────────────────────

class UserRegistrationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_student_success(self):
        payload = {
            'username': 'newstudent',
            'email': 'newstudent@test.com',
            'password': 'StrongPass123!',
            'user_type': 'student',
            'profile': {
                'university': 'University of Jaffna',
                'phone_number': '0771234567',
                'gender_preference': 'any',
            }
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)

    def test_register_duplicate_username_fails(self):
        User.objects.create_user(username='dupuser', password='Pass1234!')
        payload = {
            'username': 'dupuser',
            'email': 'dup@test.com',
            'password': 'StrongPass123!',
            'user_type': 'student',
            'profile': {'university': 'UoJ', 'phone_number': '0771234567'}
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_user_type_fails(self):
        payload = {
            'username': 'badtype',
            'email': 'bad@test.com',
            'password': 'StrongPass123!',
            'user_type': 'hacker',
            'profile': {'university': 'UoJ', 'phone_number': '0771234567'}
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='loginuser', password='Pass1234!', user_type='student', is_approved=True
        )

    def test_login_success_returns_token(self):
        response = self.client.post('/api/auth/login/', {'username': 'loginuser', 'password': 'Pass1234!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_wrong_password_returns_401(self):
        response = self.client.post('/api/auth/login/', {'username': 'loginuser', 'password': 'WrongPass!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_blocked_user_returns_403(self):
        self.user.is_blocked = True
        self.user.save()
        response = self.client.post('/api/auth/login/', {'username': 'loginuser', 'password': 'Pass1234!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 'account_blocked')

    def test_login_unapproved_user_returns_403(self):
        unapproved = User.objects.create_user(username='unapproved', password='Pass1234!', is_approved=False)
        response = self.client.post('/api/auth/login/', {'username': 'unapproved', 'password': 'Pass1234!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 'account_pending')


class ProfileAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='profileuser', password='Pass1234!', user_type='student', is_approved=True
        )
        StudentProfile.objects.create(user=self.user, university='UoJ', phone_number='0771234567')
        self.client.force_authenticate(user=self.user)

    def test_get_profile_authenticated(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'profileuser')

    def test_get_profile_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Scenario Tests ────────────────────────────────────────────────────────────

class StudentRegistrationLoginScenarioTest(TestCase):
    """Scenario: Student registers, logs in, and views profile."""

    def setUp(self):
        self.client = APIClient()

    def test_full_registration_login_profile_flow(self):
        # Step 1: Register
        reg_response = self.client.post('/api/auth/register/', {
            'username': 'scenariostudent',
            'email': 'scenario@test.com',
            'password': 'StrongPass123!',
            'user_type': 'student',
            'profile': {'university': 'UoJ', 'phone_number': '0771234567', 'gender_preference': 'any'}
        }, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)

        # Step 2: Login
        login_response = self.client.post('/api/auth/login/', {
            'username': 'scenariostudent', 'password': 'StrongPass123!'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['access']

        # Step 3: Get profile with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        profile_response = self.client.get('/api/auth/profile/')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['username'], 'scenariostudent')
