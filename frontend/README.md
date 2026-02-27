# Student Dashboard Frontend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update values:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

Update the Google Maps API key in `index.html` and `.env`

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at: http://localhost:5173

### 4. Build for Production
```bash
npm run build
```

## Features

### Authentication
- Student registration with profile
- Login with JWT tokens
- Auto token refresh

### Room Management
- Search rooms with filters (price, distance, gender, facilities)
- View room details with images
- Favorite rooms
- Request bookings

### Food Ordering
- Browse nearby restaurants
- View restaurant menus
- Add items to cart
- Place orders (COD)
- Track order history

### Live Tracking
- Real-time rider location on Google Maps
- WebSocket updates
- Order status timeline
- ETA display

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Navbar.jsx
│   └── PrivateRoute.jsx
├── context/          # React Context
│   └── AuthContext.jsx
├── pages/            # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Profile.jsx
│   ├── Rooms.jsx
│   ├── RoomDetail.jsx
│   ├── Favorites.jsx
│   ├── Bookings.jsx
│   ├── Restaurants.jsx
│   ├── RestaurantMenu.jsx
│   ├── Checkout.jsx
│   ├── Orders.jsx
│   └── Tracking.jsx
├── services/         # API services
│   └── api.js
├── App.jsx           # Main app component
└── main.jsx          # Entry point
```

## Technologies Used

- React 18
- Vite
- React Router v6
- Axios
- Socket.io-client
- Google Maps JavaScript API
- Context API for state management
