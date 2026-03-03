# Room Owner Dashboard - Full Stack Application

A complete hostel/room owner management system built with React.js, Django REST Framework, and Microsoft SQL Server.

## Features

### Authentication
- Owner registration with profile details
- JWT-based authentication
- Secure login/logout

### Owner Profile & Verification
- Complete profile management
- Document upload for verification
- Verification status tracking (Pending/Approved/Rejected)

### Listing Management (CRUD)
- Create, read, update, delete listings
- Multiple image uploads
- Facility management (WiFi, water, electricity, parking, etc.)
- Location pin (latitude/longitude)
- Availability status management

### Enquiry Management
- View all enquiries per listing
- Accept/reject booking requests
- Track enquiry status

### Analytics Dashboard
- Total listings count
- Total views across all listings
- Total enquiries count
- Pending enquiries count
- Monthly statistics

## Tech Stack

**Frontend:**
- React.js 18
- React Router v6
- Axios for API calls
- CSS3

**Backend:**
- Django 4.2
- Django REST Framework
- Simple JWT for authentication
- CORS headers

**Database:**
- Microsoft SQL Server (SSMS)
- mssql-django adapter

## Project Structure

```
RoomOwnDash/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── owners/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── listings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── enquiries/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── analytics/
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── database_schema.sql
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── PrivateRoute.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── Listings.js
    │   │   ├── ListingForm.js
    │   │   ├── Enquiries.js
    │   │   └── Profile.js
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── listingService.js
    │   │   ├── enquiryService.js
    │   │   └── analyticsService.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Setup Instructions

### Database Setup

1. Open SQL Server Management Studio (SSMS)
2. Run the `backend/database_schema.sql` script to create the database and tables
3. Update database credentials in `backend/config/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'RoomOwnerDB',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        },
    }
}
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create superuser (optional):
```bash
python manage.py createsuperuser
```

6. Run development server:
```bash
python manage.py runserver
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new owner
- `POST /api/auth/login/` - Login owner
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get owner profile
- `PATCH /api/auth/profile/` - Update owner profile

### Listings
- `GET /api/listings/` - Get all owner's listings
- `POST /api/listings/` - Create new listing
- `GET /api/listings/{id}/` - Get listing details
- `PATCH /api/listings/{id}/` - Update listing
- `DELETE /api/listings/{id}/` - Delete listing
- `PATCH /api/listings/{id}/update_availability/` - Update availability status

### Enquiries
- `GET /api/enquiries/` - Get all enquiries
- `GET /api/enquiries/{id}/` - Get enquiry details
- `PATCH /api/enquiries/{id}/accept/` - Accept enquiry
- `PATCH /api/enquiries/{id}/reject/` - Reject enquiry

### Analytics
- `GET /api/analytics/dashboard/` - Get dashboard statistics
- `GET /api/analytics/listing/{id}/` - Get listing-specific stats
- `GET /api/analytics/monthly/` - Get monthly enquiry statistics

## API Request Examples

### Register Owner
```javascript
POST /api/auth/register/
{
  "username": "john_owner",
  "email": "john@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "phone": "+94771234567",
  "nic_passport": "123456789V",
  "address": "123 Main St, Colombo"
}
```

### Create Listing
```javascript
POST /api/listings/
Content-Type: multipart/form-data

{
  "title": "Luxury Single Room",
  "rent": 15000,
  "deposit": 30000,
  "room_type": "single",
  "gender_allowed": "mixed",
  "wifi": true,
  "water": true,
  "electricity": true,
  "parking": true,
  "attached_bathroom": true,
  "ac": false,
  "latitude": 6.9271,
  "longitude": 79.8612,
  "uploaded_images": [file1, file2, file3]
}
```

### Update Availability
```javascript
PATCH /api/listings/1/update_availability/
{
  "availability_status": "unavailable"
}
```

## Models

### OwnerProfile
- user (OneToOne with User)
- full_name
- phone
- nic_passport
- address
- verification_document
- verification_status (pending/approved/rejected)

### Listing
- owner (ForeignKey to OwnerProfile)
- title
- rent
- deposit
- room_type (single/shared/hostel/annex)
- gender_allowed (male/female/mixed)
- availability_status (available/unavailable)
- Facilities: wifi, water, electricity, parking, attached_bathroom, ac
- latitude, longitude
- views_count

### ListingPhoto
- listing (ForeignKey to Listing)
- image
- uploaded_at

### Enquiry
- listing (ForeignKey to Listing)
- user_name
- email
- phone
- message
- status (pending/accepted/rejected)
- created_at

## Security Features

- JWT token-based authentication
- Token refresh mechanism
- Protected API endpoints
- CORS configuration
- Password hashing
- SQL injection prevention (Django ORM)

## Production Deployment

1. Update `SECRET_KEY` in settings.py
2. Set `DEBUG = False`
3. Configure `ALLOWED_HOSTS`
4. Set up static files serving
5. Configure production database
6. Use environment variables for sensitive data
7. Set up HTTPS
8. Configure CORS for production domain

## License

MIT License
