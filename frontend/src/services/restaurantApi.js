import api from './api';

export const restaurantApi = {
  getProfile: () => api.get('restaurant/profile/'),
  updateProfile: (payload) => api.put('restaurant/profile/', payload),
  getDashboardOverview: () => api.get('restaurant/dashboard/overview/'),
  getFoodItems: () => api.get('restaurant/foods/'),
  // Do not manually set multipart/form-data for FormData payloads.
  // Browser/axios will inject the correct boundary automatically.
  createFoodItem: (payload) => api.post('restaurant/foods/', payload),
  updateFoodItem: (id, payload) => api.put(`restaurant/foods/${id}/`, payload),
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
