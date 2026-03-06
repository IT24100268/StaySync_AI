from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(email, otp_code, purpose):
    """Send OTP email to user"""
    
    if purpose == 'registration':
        subject = 'StaySync AI - Email Verification'
        message = f"""
Hello,

Your OTP for email verification is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
StaySync AI Team
        """
    else:  # password_reset
        subject = 'StaySync AI - Password Reset'
        message = f"""
Hello,

Your OTP for password reset is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
StaySync AI Team
        """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False
