# Hostel/Room Owner Dashboard

## Features
- ✅ Owner Registration & Login with JWT
- ✅ Dashboard Overview with Stats
- ✅ Listings Management (Create, Edit, Toggle Availability)
- ✅ Photo Upload for Listings
- ✅ Enquiries Management (Approve/Reject)
- ✅ Analytics with Charts
- ✅ Profile Verification with Document Upload
- ✅ Responsive Design with Navy Sidebar

## Tech Stack
- React + Vite
- React Router
- Axios with JWT Interceptor
- Tailwind CSS
- Lucide Icons

## Setup
```bash
npm install
npm run dev
```

## Routes
- `/owner/register` - Owner Registration
- `/owner/login` - Owner Login
- `/owner/dashboard` - Dashboard Overview
- `/owner/listings` - View All Listings
- `/owner/listings/new` - Create New Listing
- `/owner/listings/:id/edit` - Edit Listing
- `/owner/enquiries` - Manage Enquiries
- `/owner/analytics` - View Analytics
- `/owner/verification` - Profile Verification

## API Endpoints
All endpoints use Bearer token authentication.

### Auth
- `POST /api/owner/auth/register`
- `POST /api/owner/auth/login`
- `GET /api/owner/me`

### Listings
- `GET /api/owner/listings`
- `POST /api/owner/listings`
- `GET /api/owner/listings/:id`
- `PUT /api/owner/listings/:id`
- `PATCH /api/owner/listings/:id/availability`
- `POST /api/owner/listings/:id/photos`
- `DELETE /api/owner/listings/:id/photos/:photoId`

### Enquiries
- `GET /api/owner/enquiries`
- `PATCH /api/owner/enquiries/:id/status`

### Analytics
- `GET /api/owner/analytics/summary`
- `GET /api/owner/analytics/listings`

### Verification
- `PUT /api/owner/verification`
- `POST /api/owner/verification/upload`

## Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Folder Structure
```
src/
├── api/
│   └── ownerApi.js (Axios instance with interceptor)
├── components/owner/
│   ├── OwnerDashboardLayout.jsx (Sidebar + Layout)
│   └── OwnerProtectedRoute.jsx (Auth guard)
├── context/
│   └── OwnerAuthContext.jsx (Auth state management)
├── pages/owner/
│   ├── OwnerRegister.jsx
│   ├── OwnerLogin.jsx
│   ├── OwnerDashboard.jsx
│   ├── OwnerListings.jsx
│   ├── OwnerListingForm.jsx
│   ├── OwnerEnquiries.jsx
│   ├── OwnerAnalytics.jsx
│   └── OwnerVerification.jsx
└── App.jsx (Routes)
```
