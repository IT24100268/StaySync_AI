# MULTI-ROLE REGISTRATION SETUP INSTRUCTIONS

## BACKEND SETUP

### 1. Create and Apply Migrations

```bash
cd backend
python manage.py makemigrations users
python manage.py migrate
```

### 2. Create Superuser (for admin approval)

```bash
python manage.py createsuperuser
```

### 3. Run Server

```bash
python manage.py runserver
```

## FRONTEND SETUP

### 1. Install Dependencies (if needed)

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

## TESTING THE SYSTEM

### 1. Register as Student
- Go to http://localhost:5173/register
- Select "Student" role
- Fill in the form
- Should be auto-approved and can login immediately

### 2. Register as Hostel Owner / Restaurant Owner / Delivery
- Select the respective role
- Fill in the form
- Will see "Registration submitted. Wait for admin approval"
- Cannot login until approved

### 3. Admin Approval
- Login to Django admin: http://localhost:8000/admin
- Go to Users section
- Find pending users (is_approved = False)
- Check the user and select "Approve selected users" action
- OR use the API endpoint:
  ```
  PATCH http://localhost:8000/api/auth/admin/approve-user/<user_id>/
  ```

### 4. Login After Approval
- User can now login
- Will be redirected based on user_type:
  - student → /student/dashboard
  - hostel_owner → /hostel-owner/dashboard
  - restaurant_owner → /restaurant-owner/dashboard
  - delivery → /delivery/dashboard

## API ENDPOINTS

### Public Endpoints
- POST /api/auth/register/ - Register new user
- POST /api/auth/login/ - Login (checks approval)
- POST /api/auth/token/refresh/ - Refresh token

### Protected Endpoints
- GET /api/auth/profile/ - Get current user profile

### Admin Only Endpoints
- GET /api/auth/admin/pending-users/ - List pending users
- PATCH /api/auth/admin/approve-user/<id>/ - Approve user

## REGISTRATION PAYLOAD EXAMPLES

### Student Registration
```json
{
  "email": "student@example.com",
  "username": "student1",
  "password": "securepass123",
  "user_type": "student",
  "profile": {
    "university": "MIT",
    "gender_preference": "any",
    "budget": "500",
    "phone_number": "+1234567890"
  }
}
```

### Hostel Owner Registration
```json
{
  "email": "owner@hostel.com",
  "username": "hostelowner1",
  "password": "securepass123",
  "user_type": "hostel_owner",
  "profile": {
    "hostel_name": "Sunrise Hostel",
    "address": "123 Main St, City",
    "phone_number": "+1234567890",
    "business_reg_no": "BRN123456"
  }
}
```

### Restaurant Owner Registration
```json
{
  "email": "owner@restaurant.com",
  "username": "restaurantowner1",
  "password": "securepass123",
  "user_type": "restaurant_owner",
  "profile": {
    "restaurant_name": "Tasty Bites",
    "address": "456 Food St, City",
    "phone_number": "+1234567890"
  }
}
```

### Delivery Partner Registration
```json
{
  "email": "delivery@example.com",
  "username": "delivery1",
  "password": "securepass123",
  "user_type": "delivery",
  "profile": {
    "vehicle_type": "Bike",
    "license_no": "DL123456",
    "phone_number": "+1234567890"
  }
}
```

## NOTES

- Students are auto-approved (is_approved = True by default)
- All other roles require admin approval (is_approved = False by default)
- Login returns 403 if user is not approved
- Frontend shows appropriate messages based on approval status
- Admin can approve users via Django admin or API endpoint
