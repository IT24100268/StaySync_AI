import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
        const newAccess = refreshResponse.data.access;
        localStorage.setItem('access_token', newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (payload) => api.post('/auth/register/', payload),
};

export const restaurantApi = {
  getProfile: () => api.get('/restaurant/profile/'),
  updateProfile: (payload) => api.put('/restaurant/profile/', payload),
  getDashboardOverview: () => api.get('/restaurant/dashboard/overview/'),
  getFoodItems: () => api.get('/restaurant/foods/'),
  createFoodItem: (payload) => api.post('/restaurant/foods/', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateFoodItem: (id, payload) => api.put(`/restaurant/foods/${id}/`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFoodItem: (id) => api.delete(`/restaurant/foods/${id}/`),
  toggleFoodAvailability: (id) => api.patch(`/restaurant/foods/${id}/toggle-availability/`),
  getOrders: (status = '') =>
    api.get('/restaurant/orders/', {
      params: status ? { status } : {},
    }),
  getOrderById: (id) => api.get(`/restaurant/orders/${id}/`),
  updateOrderStatus: (id, status) => api.patch(`/restaurant/orders/${id}/status/`, { status }),
};

export default api;
