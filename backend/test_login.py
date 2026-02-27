import requests
import json

# Test login endpoint
url = "http://localhost:8000/api/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login with:", data)
print("URL:", url)

try:
    response = requests.post(url, json=data)
    print("\nStatus Code:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", str(e))

# Test with another user
print("\n" + "="*50)
data2 = {
    "username": "Mathusan",
    "password": "mathu123"  # You'll need to know the actual password
}
print("\nTesting login with:", data2)
try:
    response = requests.post(url, json=data2)
    print("Status Code:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", str(e))
