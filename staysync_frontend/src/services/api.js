import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardAPI = {
  getStats: () => api.get('/adminpanel/dashboard-stats/'),
};

export const roomsAPI = {
  getRooms: () => api.get('/rooms/'),
  approveRoom: (id) => api.post(`/adminpanel/approve-room/${id}/`),
};

export const restaurantsAPI = {
  getRestaurants: () => api.get('/restaurants/'),
  approveRestaurant: (id) => api.post(`/adminpanel/approve-restaurant/${id}/`),
};

export const deliveryAPI = {
  getDeliveryPartners: () => api.get('/deliveries/'),
  approveDeliveryPartner: (id) => api.post(`/adminpanel/approve-delivery/${id}/`),
};

export const usersAPI = {
  getUsers: () => api.get('/users/'),
  blockUser: (id) => api.post(`/adminpanel/block-user/${id}/`),
};

export const ordersAPI = {
  getOrders: () => api.get('/orders/'),
};

export default api;