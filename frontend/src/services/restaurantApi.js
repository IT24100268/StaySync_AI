import api from './api';

export const restaurantApi = {
  getProfile: () => api.get('restaurant/profile/'),
  updateProfile: (payload) => api.put('restaurant/profile/', payload),
  getDashboardOverview: () => api.get('restaurant/dashboard/overview/'),
  getFoodItems: () => api.get('restaurant/foods/'),
  createFoodItem: (payload) => api.post('restaurant/foods/', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateFoodItem: (id, payload) => api.put(`restaurant/foods/${id}/`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFoodItem: (id) => api.delete(`restaurant/foods/${id}/`),
  toggleFoodAvailability: (id) => api.patch(`restaurant/foods/${id}/toggle-availability/`),
  getOrders: (status = '') =>
    api.get('restaurant/orders/', {
      params: status ? { status } : {},
    }),
  getOrderById: (id) => api.get(`restaurant/orders/${id}/`),
  updateOrderStatus: (id, status) => api.patch(`restaurant/orders/${id}/status/`, { status }),
};

export default restaurantApi;
