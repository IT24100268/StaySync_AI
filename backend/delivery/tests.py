from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from delivery.models import DeliveryPartner, Order, Delivery, ActivityLog


def make_delivery_user(username):
    user = User.objects.create_user(
        username=username, password='Pass1234!', user_type='delivery', is_approved=True
    )
    partner = DeliveryPartner.objects.create(user=user, status='APPROVED')
    return user, partner


def make_order(**kwargs):
    defaults = dict(
        restaurant_name='Test Restaurant',
        student_name='Test Student',
        pickup_address='123 Pickup St',
        drop_address='456 Drop St',
        total_price=500,
        status='ready',
    )
    defaults.update(kwargs)
    return Order.objects.create(**defaults)


# ── Unit Tests ────────────────────────────────────────────────────────────────

class DeliveryPartnerModelTest(TestCase):
    def test_partner_default_status_is_pending(self):
        user = User.objects.create_user(username='newpartner', password='Pass1234!')
        partner = DeliveryPartner.objects.create(user=user)
        self.assertEqual(partner.status, 'PENDING')

    def test_partner_default_is_offline(self):
        user = User.objects.create_user(username='offlinepartner', password='Pass1234!')
        partner = DeliveryPartner.objects.create(user=user)
        self.assertFalse(partner.is_online)

    def test_partner_str(self):
        user = User.objects.create_user(username='strpartner', password='Pass1234!')
        partner = DeliveryPartner.objects.create(user=user)
        self.assertIn('strpartner', str(partner))


class DeliveryOrderModelTest(TestCase):
    def test_order_default_status_is_ready(self):
        order = make_order()
        self.assertEqual(order.status, 'ready')

    def test_order_str(self):
        order = make_order()
        self.assertIn(str(order.id), str(order))


class DeliveryModelTest(TestCase):
    def setUp(self):
        self.user, self.partner = make_delivery_user('deliverymodel')
        self.order = make_order()

    def test_delivery_created_with_assigned_status(self):
        delivery = Delivery.objects.create(order=self.order, partner=self.partner, status='assigned')
        self.assertEqual(delivery.status, 'assigned')

    def test_delivery_str(self):
        delivery = Delivery.objects.create(order=self.order, partner=self.partner)
        self.assertIn(str(delivery.id), str(delivery))


# ── Integration Tests ─────────────────────────────────────────────────────────

class AvailableJobsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.partner = make_delivery_user('jobspartner')
        self.client.force_authenticate(user=self.user)
        make_order(status='ready')
        make_order(status='assigned')

    def test_available_jobs_returns_only_ready_orders(self):
        response = self.client.get('/api/delivery/jobs/available/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only 'ready' orders should appear
        for item in response.data['data']:
            self.assertEqual(item['status'], 'ready')

    def test_available_jobs_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/delivery/jobs/available/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AcceptJobAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.partner = make_delivery_user('acceptpartner')
        self.client.force_authenticate(user=self.user)
        self.order = make_order()

    def test_accept_job_success(self):
        response = self.client.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'assigned')

    def test_accept_nonexistent_job_returns_404(self):
        response = self.client.post('/api/delivery/jobs/99999/accept/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UpdatePartnerStatusAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.partner = make_delivery_user('statuspartner')
        self.client.force_authenticate(user=self.user)

    def test_go_online(self):
        response = self.client.patch('/api/delivery/partner/status/', {'is_online': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.partner.refresh_from_db()
        self.assertTrue(self.partner.is_online)

    def test_go_offline(self):
        self.partner.is_online = True
        self.partner.save()
        response = self.client.patch('/api/delivery/partner/status/', {'is_online': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.partner.refresh_from_db()
        self.assertFalse(self.partner.is_online)

    def test_missing_is_online_field_returns_400(self):
        response = self.client.patch('/api/delivery/partner/status/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UpdateDeliveryStatusAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.partner = make_delivery_user('statusupdater')
        self.client.force_authenticate(user=self.user)
        self.order = make_order(status='assigned')
        self.delivery = Delivery.objects.create(order=self.order, partner=self.partner, status='assigned')

    def test_update_status_to_picked(self):
        response = self.client.patch(
            f'/api/delivery/delivery/{self.delivery.id}/status/',
            {'status': 'picked'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.delivery.refresh_from_db()
        self.assertEqual(self.delivery.status, 'picked')

    def test_invalid_status_transition_returns_400(self):
        # Cannot jump from assigned directly to delivered
        response = self.client.patch(
            f'/api/delivery/delivery/{self.delivery.id}/status/',
            {'status': 'delivered'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── Scenario Tests ────────────────────────────────────────────────────────────

class ExclusiveJobAcceptanceScenarioTest(TestCase):
    """
    Scenario: Two delivery partners try to accept the same job.
    Only the first one should succeed — the second must get a 409 conflict.
    """

    def setUp(self):
        self.client1 = APIClient()
        self.client2 = APIClient()
        self.user1, self.partner1 = make_delivery_user('partner_one')
        self.user2, self.partner2 = make_delivery_user('partner_two')
        self.order = make_order()

    def test_only_first_partner_can_accept_job(self):
        # Partner 1 accepts the job
        self.client1.force_authenticate(user=self.user1)
        res1 = self.client1.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Partner 2 tries to accept the same job — must be rejected
        self.client2.force_authenticate(user=self.user2)
        res2 = self.client2.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)

        # Confirm the order is assigned to partner 1 only
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'assigned')
        delivery = Delivery.objects.get(order=self.order)
        self.assertEqual(delivery.partner, self.partner1)

    def test_partner_cannot_accept_already_assigned_order(self):
        # Manually assign the order
        self.order.status = 'assigned'
        self.order.save()

        self.client1.force_authenticate(user=self.user1)
        response = self.client1.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class DeliveryFullFlowScenarioTest(TestCase):
    """
    Scenario: Partner accepts job → picks up → delivers.
    """

    def setUp(self):
        self.client = APIClient()
        self.user, self.partner = make_delivery_user('flowpartner')
        self.client.force_authenticate(user=self.user)
        self.order = make_order()

    def test_full_delivery_flow(self):
        # Step 1: Accept job
        res = self.client.post(f'/api/delivery/jobs/{self.order.id}/accept/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        delivery = Delivery.objects.get(order=self.order, partner=self.partner)

        # Step 2: Mark as picked
        res = self.client.patch(
            f'/api/delivery/delivery/{delivery.id}/status/',
            {'status': 'picked'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Step 3: Mark as on the way
        res = self.client.patch(
            f'/api/delivery/delivery/{delivery.id}/status/',
            {'status': 'onway'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Step 4: Mark as delivered
        res = self.client.patch(
            f'/api/delivery/delivery/{delivery.id}/status/',
            {'status': 'delivered'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        delivery.refresh_from_db()
        self.assertEqual(delivery.status, 'delivered')
        self.assertIsNotNone(delivery.delivered_at)
