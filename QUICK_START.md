# Admin Dashboard - Quick Start Guide

## ✅ Implementation Complete

Your StaySync AI admin dashboard is now fully implemented and ready to use!

## 🚀 Quick Start

### 1. Create Admin User
```bash
cd backend
python manage.py createsuperuser
# Enter username, email, and password
```

### 2. Start Backend
```bash
python manage.py runserver
```

### 3. Start Frontend
```bash
cd ../frontend
npm run dev
```

### 4. Access Admin Dashboard
- Login with your superuser credentials
- Navigate to: `http://localhost:5173/admin`

## 📋 Features Implemented

### ✅ Backend
- **Room Moderation**: Approve/reject/suspend room listings
- **Restaurant Moderation**: Approve/reject restaurant registrations
- **User Management**: Block/unblock users, issue warnings
- **Reports System**: Handle user complaints and reports
- **Admin Audit Logs**: Track all administrative actions
- **Analytics API**: Dashboard statistics endpoint

### ✅ Frontend
- **Admin Home** (`/admin`) - Analytics dashboard
- **Room Approvals** (`/admin/rooms`) - Review room listings
- **Restaurant Approvals** (`/admin/restaurants`) - Review restaurants
- **User Management** (`/admin/users`) - Manage users
- **Reports Queue** (`/admin/reports`) - Handle reports
- **Activity Logs** (`/admin/logs`) - View admin actions

## 🔑 Key API Endpoints

```
GET  /api/admin/analytics/summary/          - Dashboard stats
GET  /api/admin/rooms/?status=PENDING       - List rooms
PATCH /api/admin/rooms/{id}/update_status/  - Update room status
GET  /api/admin/restaurants/?status=PENDING - List restaurants
PATCH /api/admin/restaurants/{id}/update_status/ - Update restaurant
GET  /api/admin/users/                      - List users
PATCH /api/admin/users/{id}/block/          - Block user
PATCH /api/admin/users/{id}/unblock/        - Unblock user
PATCH /api/admin/users/{id}/warn/           - Warn user
POST /api/reports/                          - Create report
GET  /api/admin/reports/?status=PENDING     - List reports
PATCH /api/admin/reports/{id}/update_status/ - Update report
GET  /api/admin/logs/                       - View logs
```

## 🧪 Test Workflow

### Test Room Approval:
1. Create a room listing (as hostel owner)
2. Room will have `status='PENDING'`
3. Login as admin → Go to `/admin/rooms`
4. Review and approve/reject the room
5. Verify students only see APPROVED rooms

### Test User Management:
1. Go to `/admin/users`
2. Search for a user
3. Block user with a reason
4. Verify blocked user cannot perform actions
5. Unblock or warn user as needed

### Test Reports:
1. As any user, create a report via API:
```json
POST /api/reports/
{
  "target_type": "ROOM",
  "target_id": 1,
  "reason": "Misleading information",
  "description": "Photos don't match reality"
}
```
2. Admin reviews in `/admin/reports`
3. Update status and add admin notes

## 📊 Status Values

### Room/Restaurant Status:
- `PENDING` - Awaiting review (default)
- `APPROVED` - Approved and visible to users
- `REJECTED` - Rejected
- `NEEDS_CHANGES` - Requires modifications
- `SUSPENDED` - Temporarily suspended

### Report Status:
- `PENDING` - New report
- `INVESTIGATING` - Under review
- `RESOLVED` - Issue resolved
- `DISMISSED` - Report dismissed

## 🔒 Security

- All `/api/admin/*` endpoints require admin/staff permissions
- Only APPROVED rooms/restaurants are visible to students
- Blocked users cannot create listings or orders
- All admin actions are logged for audit trail

## 📝 Note on Delivery Partners

Delivery partner approval was excluded from this implementation as the delivery module is in a separate directory structure. To add it:
1. Move `delivery/` folder into `backend/`
2. Add to `INSTALLED_APPS` in settings.py
3. Uncomment delivery partner code in admin_panel

## 🎯 Next Steps

1. Create your admin user
2. Test the approval workflows
3. Customize status messages/emails
4. Add role-based permissions if needed
5. Configure email notifications

## 📚 Full Documentation

See `ADMIN_IMPLEMENTATION.md` for complete implementation details, API examples, and troubleshooting guide.

---

**Your admin dashboard is production-ready!** 🎉
