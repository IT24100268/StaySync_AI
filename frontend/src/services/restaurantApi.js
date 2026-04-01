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
    api.get('orders/restaurant/orders/', {
      params: status ? { status } : {},
    }),
  getOrderById: (id) => api.get(`orders/${id}/`),
  acceptOrder: (id, preparationTime) =>
    api.post(`orders/restaurant/${id}/accept/`, { preparation_time: preparationTime }),
  rejectOrder: (id, reason) =>
    api.post(`orders/restaurant/${id}/reject/`, { reason }),
  markTakeawayReady: (id) =>
    api.post(`orders/restaurant/${id}/ready-for-pickup/`),
  markCollectedByPartner: (id) =>
    api.post(`orders/restaurant/${id}/collected/`),
};

export default restaurantApi;
