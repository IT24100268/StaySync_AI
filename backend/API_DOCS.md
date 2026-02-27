# API Documentation

## Base URL
`http://localhost:8000/api`

---

## Authentication

### Register
**POST** `/auth/register/`

Request:
```json
{
  "email": "student@example.com",
  "username": "student123",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "university": "MIT",
    "gender_preference": "any",
    "budget": 500.00,
    "phone_number": "+1234567890"
  }
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "student@example.com",
    "username": "student123",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "university": "MIT",
      "gender_preference": "any",
      "budget": "500.00",
      "phone_number": "+1234567890"
    }
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Login
**POST** `/auth/login/`

Request:
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Get Profile
**GET** `/auth/profile/`

Headers: `Authorization: Bearer <access_token>`

Response:
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "university": "MIT",
    "gender_preference": "any",
    "budget": "500.00",
    "phone_number": "+1234567890"
  }
}
```

---

## Rooms

### List Rooms (with filters)
**GET** `/rooms/?min_price=200&max_price=600&gender_allowed=any&max_distance=5`

Headers: `Authorization: Bearer <access_token>`

Response:
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/rooms/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Cozy Single Room Near Campus",
      "description": "Fully furnished room with WiFi",
      "price": "450.00",
      "latitude": "42.360082",
      "longitude": "-71.058880",
      "facilities": ["WiFi", "AC", "Laundry"],
      "gender_allowed": "any",
      "distance_from_university": "2.50",
      "owner_contact": "+1234567890",
      "rules": "No smoking, No pets",
      "images": [
        {"id": 1, "image": "/media/rooms/room1.jpg"}
      ],
      "is_favorited": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Room Details
**GET** `/rooms/1/`

### Toggle Favorite
**POST** `/rooms/favorite/`

Request:
```json
{
  "room_id": 1
}
```

Response:
```json
{
  "message": "Added to favorites"
}
```

### Get Favorites
**GET** `/rooms/favorites/`

---

## Bookings

### Create Booking
**POST** `/bookings/create/`

Request:
```json
{
  "room_id": 1,
  "message": "I would like to book this room for the semester"
}
```

Response:
```json
{
  "id": 1,
  "room": {...},
  "status": "pending",
  "message": "I would like to book this room for the semester",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get My Bookings
**GET** `/bookings/`

---

## Restaurants

### List Restaurants
**GET** `/restaurants/`

Response:
```json
[
  {
    "id": 1,
    "name": "Pizza Palace",
    "latitude": "42.360082",
    "longitude": "-71.058880",
    "image": "/media/restaurants/pizza.jpg",
    "menu_items": [
      {
        "id": 1,
        "name": "Margherita Pizza",
        "price": "12.99",
        "description": "Classic tomato and mozzarella",
        "image": "/media/menu/margherita.jpg",
        "is_available": true
      }
    ]
  }
]
```

### Get Restaurant Menu
**GET** `/restaurants/1/menu/`

---

## Orders

### Create Order
**POST** `/orders/create/`

Request:
```json
{
  "restaurant_id": 1,
  "delivery_address": "123 Main St, Apt 4B",
  "payment_method": "cod",
  "total_price": "25.98",
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2,
      "price": "12.99"
    }
  ]
}
```

Response:
```json
{
  "id": 1,
  "restaurant": {...},
  "items": [...],
  "total_price": "25.98",
  "payment_method": "cod",
  "status": "ordered",
  "delivery_address": "123 Main St, Apt 4B",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get Order History
**GET** `/orders/`

### Get Order Details
**GET** `/orders/1/`

---

## Tracking

### Get Tracking Info
**GET** `/tracking/1/`

Response:
```json
{
  "id": 1,
  "order": 1,
  "rider_name": "Mike Delivery",
  "rider_phone": "+1234567890",
  "current_latitude": "42.360082",
  "current_longitude": "-71.058880",
  "eta_minutes": 15,
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### WebSocket Connection
**WS** `ws://localhost:8000/ws/tracking/1/`

Real-time updates:
```json
{
  "rider_name": "Mike Delivery",
  "rider_phone": "+1234567890",
  "current_latitude": "42.360082",
  "current_longitude": "-71.058880",
  "eta_minutes": 15
}
```
