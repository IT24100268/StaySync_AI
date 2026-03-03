import api from './api';

export const enquiryService = {
  getEnquiries: async () => {
    const response = await api.get('/enquiries/');
    return response.data;
  },

  getEnquiry: async (id) => {
    const response = await api.get(`/enquiries/${id}/`);
    return response.data;
  },

  acceptEnquiry: async (id) => {
    const response = await api.patch(`/enquiries/${id}/accept/`);
    return response.data;
  },

  rejectEnquiry: async (id) => {
    const response = await api.patch(`/enquiries/${id}/reject/`);
    return response.data;
  }
};
