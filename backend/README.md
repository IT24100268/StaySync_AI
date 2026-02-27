# Student Dashboard Backend

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env` and update values:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

### 4. Create MySQL Database
```sql
CREATE DATABASE student_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser
```bash
python manage.py createsuperuser
```

### 7. Run Server
For HTTP:
```bash
python manage.py runserver
```

For WebSocket support (recommended):
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 8. Install Redis (for WebSocket)
Windows: Download from https://github.com/microsoftarchive/redis/releases
Linux: `sudo apt-get install redis-server`
Mac: `brew install redis`

Start Redis:
```bash
redis-server
```

## Admin Panel
Access at: http://localhost:8000/admin

## API Endpoints
See `API_DOCS.md` for complete API documentation.
