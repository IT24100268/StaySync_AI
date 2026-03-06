from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP

User = get_user_model()


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose', 'registration')  # registration or password_reset

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email already exists for registration
        if purpose == 'registration' and User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email exists for password reset
        if purpose == 'password_reset' and not User.objects.filter(email=email).exists():
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)

        # Generate OTP
        otp_code = OTP.generate_otp()

        # Delete old OTPs for this email and purpose
        OTP.objects.filter(email=email, purpose=purpose, is_verified=False).delete()

        # Create new OTP
        otp = OTP.objects.create(email=email, otp_code=otp_code, purpose=purpose)

        # Send email
        try:
            subject = 'StaySync AI - Email Verification' if purpose == 'registration' else 'StaySync AI - Password Reset'
            message = f"""
Hello,

Your OTP for {purpose.replace('_', ' ')} is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
StaySync AI Team
            """
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        purpose = request.data.get('purpose', 'registration')

        if not email or not otp_code:
            return Response({'error': 'Email and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp = OTP.objects.filter(
                email=email,
                otp_code=otp_code,
                purpose=purpose,
                is_verified=False
            ).latest('created_at')

            if not otp.is_valid():
                return Response({'error': 'OTP expired or invalid'}, status=status.HTTP_400_BAD_REQUEST)

            otp.is_verified = True
            otp.save()

            return Response({'message': 'OTP verified successfully'}, status=status.HTTP_200_OK)
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        new_password = request.data.get('new_password')

        if not email or not otp_code or not new_password:
            return Response({'error': 'Email, OTP code, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify OTP
            otp = OTP.objects.filter(
                email=email,
                otp_code=otp_code,
                purpose='password_reset',
                is_verified=True
            ).latest('created_at')

            if not otp.is_valid():
                return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

            # Update password
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()

            # Mark OTP as used
            otp.delete()

            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid or unverified OTP'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
