import api from './api';

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard/');
    return response.data;
  },

  getListingStats: async (listingId) => {
    const response = await api.get(`/analytics/listing/${listingId}/`);
    return response.data;
  },

  getMonthlyStats: async () => {
    const response = await api.get('/analytics/monthly/');
    return response.data;
  }
};
