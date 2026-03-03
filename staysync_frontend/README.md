# StaySync AI - Admin Dashboard

A comprehensive React-based admin dashboard for managing the StaySync AI platform.

## Features

- **Dashboard**: Overview with key statistics
- **Rooms Approval**: Manage room listings with approval/rejection
- **Restaurants Approval**: Handle restaurant applications
- **Delivery Partners**: Approve delivery partner registrations
- **Users Management**: Monitor and manage users with role-based filtering
- **Orders Monitoring**: Track orders with status timeline
- **Reports**: Analytics and comprehensive reporting

## Tech Stack

- React 18 with TypeScript
- React Router for navigation
- Axios for API calls
- CSS3 with responsive design
- Modern ES6+ features

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd staysync_frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## API Configuration

The dashboard connects to your Django backend at:
```
http://127.0.0.1:8000/api/
```

Update the `API_BASE_URL` in `src/services/api.ts` if your backend runs on a different URL.

## API Endpoints Used

- `GET /api/adminpanel/dashboard-stats/` - Dashboard statistics
- `GET /api/rooms/` - List rooms
- `POST /api/adminpanel/approve-room/{id}/` - Approve room
- `GET /api/restaurants/` - List restaurants
- `GET /api/deliveries/` - List delivery partners
- `GET /api/users/` - List users
- `POST /api/adminpanel/block-user/{id}/` - Block/unblock user
- `GET /api/orders/` - List orders

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx
│   ├── Layout.css
│   ├── Sidebar.tsx
│   └── Sidebar.css
├── pages/
│   ├── Dashboard.tsx
│   ├── Dashboard.css
│   ├── Rooms.tsx
│   ├── Rooms.css
│   ├── Restaurants.tsx
│   ├── DeliveryPartners.tsx
│   ├── Users.tsx
│   ├── Users.css
│   ├── Orders.tsx
│   ├── Orders.css
│   ├── Reports.tsx
│   └── Reports.css
├── services/
│   └── api.ts
├── App.tsx
├── App.css
└── index.tsx
```

## Features Overview

### Dashboard
- Real-time statistics cards
- Pending approvals count
- User metrics

### Approval Pages
- Filterable tables
- One-click approve/reject actions
- Status indicators

### User Management
- Role-based filtering
- Block/unblock functionality
- User activity tracking

### Order Monitoring
- Visual status timeline
- Delivery partner assignment
- Real-time order tracking

### Reports
- Comprehensive analytics
- Growth metrics
- Performance indicators

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+