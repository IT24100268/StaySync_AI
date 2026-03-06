# Email OTP Authentication Setup

## Backend Setup Complete ✅

### New API Endpoints:
1. **POST /api/auth/send-otp/** - Send OTP to email
   - Body: `{ "email": "user@example.com", "purpose": "registration" }` or `"password_reset"`
   
2. **POST /api/auth/verify-otp/** - Verify OTP code
   - Body: `{ "email": "user@example.com", "otp_code": "123456", "purpose": "registration" }`
   
3. **POST /api/auth/reset-password/** - Reset password with verified OTP
   - Body: `{ "email": "user@example.com", "otp_code": "123456", "new_password": "newpass123" }`

## Email Configuration

### Option 1: Gmail (Recommended for Testing)
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password: https://myaccount.google.com/apppasswords
4. Create `.env` file in backend folder:
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-digit-app-password
DEFAULT_FROM_EMAIL=StaySync AI <your-email@gmail.com>
```

### Option 2: Console Backend (For Development)
In `settings.py`, change:
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```
OTP will print in console instead of sending email.

## Frontend Integration Needed

### 1. Update Register.jsx
- Add step for email verification
- Send OTP before registration
- Verify OTP before proceeding
- Only register after OTP verification

### 2. Create ForgotPassword.jsx
- Email input
- Send OTP button
- OTP verification input
- New password input
- Submit to reset password

### 3. Update Login.jsx
- Add "Forgot Password?" link

## Testing Flow

### Registration with OTP:
1. User enters email → Click "Send OTP"
2. Backend sends 6-digit OTP to email
3. User enters OTP → Click "Verify"
4. After verification → Show registration form
5. Complete registration

### Forgot Password:
1. User enters email → Click "Send OTP"
2. Backend sends OTP to email
3. User enters OTP → Click "Verify"
4. User enters new password → Click "Reset"
5. Password updated → Redirect to login

## OTP Features:
- ✅ 6-digit random code
- ✅ 10-minute expiration
- ✅ One-time use
- ✅ Separate OTPs for registration and password reset
- ✅ Email validation
- ✅ Old OTP cleanup

## Next Steps:
1. Configure email settings in `.env`
2. Update frontend Register component
3. Create ForgotPassword component
4. Test the complete flow
