# Admin Dashboard Implementation Guide

## Overview
This implementation adds a comprehensive admin dashboard to StaySync AI with full moderation capabilities for rooms, restaurants, delivery partners, users, and reports.

## Backend Changes

### 1. Models Updated

#### Room Model (`backend/rooms/models.py`)
```python
# Added fields:
status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
review_note = models.TextField(null=True, blank=True)
reviewed_at = models.DateTimeField(null=True, blank=True)
reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

#### Restaurant Model (`backend/restaurants/models.py`)
```python
# Added fields:
status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
review_note = models.TextField(null=True, blank=True)
reviewed_at = models.DateTimeField(null=True, blank=True)
reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

#### DeliveryPartner Model (`delivery/models.py`)
```python
# Added fields:
status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
review_note = models.TextField(null=True, blank=True)
reviewed_at = models.DateTimeField(null=True, blank=True)
reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

#### User Model (`backend/users/models.py`)
```python
# Added fields:
is_blocked = models.BooleanField(default=False)
block_reason = models.TextField(null=True, blank=True)
warnings_count = models.IntegerField(default=0)
```

### 2. New Models (`backend/admin_panel/models.py`)

#### Report Model
- Handles user reports and complaints
- Fields: reporter, target_type, target_id, reason, description, status, admin_note

#### AdminLog Model
- Tracks all admin actions
- Fields: admin, action, target_type, target_id, details, created_at

### 3. API Endpoints

#### Analytics
- `GET /api/admin/analytics/summary/` - Dashboard statistics

#### Room Management
- `GET /api/admin/rooms/?status=PENDING` - List rooms by status
- `PATCH /api/admin/rooms/{id}/update_status/` - Update room status
  ```json
  {
    "status": "APPROVED",
    "review_note": "Looks good"
  }
  ```

#### Restaurant Management
- `GET /api/admin/restaurants/?status=PENDING`
- `PATCH /api/admin/restaurants/{id}/update_status/`

#### Partner Management
- `GET /api/admin/partners/?status=PENDING`
- `PATCH /api/admin/partners/{id}/update_status/`

#### User Management
- `GET /api/admin/users/`
- `PATCH /api/admin/users/{id}/block/` - Block user
  ```json
  {
    "block_reason": "Violation of terms"
  }
  ```
- `PATCH /api/admin/users/{id}/unblock/` - Unblock user
- `PATCH /api/admin/users/{id}/warn/` - Warn user
  ```json
  {
    "warning_note": "First warning"
  }
  ```

#### Reports
- `POST /api/reports/` - Create report (any authenticated user)
  ```json
  {
    "target_type": "ROOM",
    "target_id": 1,
    "reason": "Misleading information",
    "description": "The room photos don't match reality"
  }
  ```
- `GET /api/admin/reports/?status=PENDING` - List reports
- `PATCH /api/admin/reports/{id}/update_status/` - Update report
  ```json
  {
    "status": "RESOLVED",
    "admin_note": "Issue resolved with owner"
  }
  ```

#### Admin Logs
- `GET /api/admin/logs/` - View all admin actions

## Frontend Changes

### New Pages (`frontend/src/pages/admin/`)
1. **AdminHome.jsx** - Dashboard with analytics cards
2. **RoomApprovals.jsx** - Review and approve rooms
3. **RestaurantApprovals.jsx** - Review and approve restaurants
4. **PartnerApprovals.jsx** - Review and approve delivery partners
5. **UsersManagement.jsx** - Block/unblock/warn users
6. **ReportsQueue.jsx** - Handle user reports
7. **AdminLogs.jsx** - View admin activity logs

### New Component
- **AdminLayout.jsx** - Admin dashboard layout with sidebar navigation

### Routes Added
```
/admin - Admin home
/admin/rooms - Room approvals
/admin/restaurants - Restaurant approvals
/admin/partners - Partner approvals
/admin/users - User management
/admin/reports - Reports queue
/admin/logs - Activity logs
```

## Installation & Setup

### 1. Run Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Admin User
```bash
python manage.py createsuperuser
```

### 3. Start Backend
```bash
python manage.py runserver
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing Instructions

### 1. Test Admin Access
1. Login with superuser credentials
2. Navigate to `/admin`
3. Verify dashboard shows analytics cards

### 2. Test Room Approval Workflow
1. Create a room listing (as hostel owner)
2. Room should have status='PENDING' by default
3. Login as admin
4. Go to `/admin/rooms`
5. Click review button on pending room
6. Add review note and approve/reject
7. Verify room status updates
8. Check `/admin/logs` for audit entry
9. As student, verify only APPROVED rooms are visible

### 3. Test Restaurant Approval
1. Register as restaurant owner
2. Restaurant status should be 'PENDING'
3. Admin approves via `/admin/restaurants`
4. Verify restaurant appears in public listings

### 4. Test User Management
1. Go to `/admin/users`
2. Search for a user
3. Block user with reason
4. Verify blocked user cannot login
5. Unblock user
6. Issue warning to user
7. Check warnings_count increments

### 5. Test Reports System
1. As student, create report:
   ```javascript
   POST /api/reports/
   {
     "target_type": "ROOM",
     "target_id": 1,
     "reason": "Misleading info",
     "description": "Photos don't match"
   }
   ```
2. Admin views report in `/admin/reports`
3. Update status to 'INVESTIGATING'
4. Add admin note
5. Mark as 'RESOLVED'
6. Verify audit log created

### 6. Test Admin Logs
1. Perform various admin actions
2. Go to `/admin/logs`
3. Verify all actions are logged with:
   - Timestamp
   - Admin username
   - Action description
   - Target details

## Example API Responses

### Analytics Summary
```json
{
  "total_users": 150,
  "blocked_users": 3,
  "pending_rooms": 12,
  "approved_rooms": 45,
  "pending_restaurants": 5,
  "pending_partners": 8,
  "pending_reports": 7,
  "total_orders_today": 23,
  "disputes_pending": 2
}
```

### Room List
```json
{
  "results": [
    {
      "id": 1,
      "title": "Cozy Room Near Campus",
      "description": "...",
      "price": "15000.00",
      "status": "PENDING",
      "review_note": null,
      "reviewed_at": null,
      "reviewed_by": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Admin Log Entry
```json
{
  "id": 1,
  "admin": 1,
  "admin_username": "admin",
  "action": "Room status changed from PENDING to APPROVED",
  "target_type": "ROOM",
  "target_id": 1,
  "details": "{\"old_status\": \"PENDING\", \"new_status\": \"APPROVED\", \"review_note\": \"Verified\"}",
  "created_at": "2024-01-15T14:20:00Z"
}
```

## Security Notes

1. All `/api/admin/*` endpoints require `IsAdminUser` permission
2. Only staff or superuser can access admin endpoints
3. Blocked users cannot create listings or orders
4. All admin actions are logged for audit trail
5. Review notes are stored for transparency

## Status Values

### Room/Restaurant/Partner Status
- `PENDING` - Awaiting review
- `APPROVED` - Approved and visible
- `REJECTED` - Rejected
- `NEEDS_CHANGES` - Requires modifications
- `SUSPENDED` - Temporarily suspended

### Report Status
- `PENDING` - New report
- `INVESTIGATING` - Under review
- `RESOLVED` - Issue resolved
- `DISMISSED` - Report dismissed

## Troubleshooting

### Issue: Admin endpoints return 403
- Ensure user is staff or superuser
- Check `user.is_staff` or `user.is_superuser` is True

### Issue: Rooms not filtering by status
- Run migrations
- Check Room model has `status` field
- Verify default value is 'PENDING'

### Issue: Frontend routes not working
- Clear browser cache
- Restart Vite dev server
- Check AdminLayout is imported in App.jsx

## Future Enhancements

1. Email notifications for status changes
2. Bulk approval actions
3. Advanced filtering and search
4. Export reports to CSV
5. Dashboard charts and graphs
6. Role-based admin permissions
7. Scheduled reports
8. Automated moderation rules
