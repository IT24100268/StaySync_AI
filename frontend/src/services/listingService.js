import api from './api';

export const listingService = {
  getListings: async () => {
    const response = await api.get('/listings/');
    return response.data;
  },

  getListing: async (id) => {
    const response = await api.get(`/listings/${id}/`);
    return response.data;
  },

  createListing: async (listingData) => {
    const formData = new FormData();
    
    Object.keys(listingData).forEach(key => {
      if (key === 'uploaded_images' && listingData[key]) {
        listingData[key].forEach(file => {
          formData.append('uploaded_images', file);
        });
      } else {
        formData.append(key, listingData[key]);
      }
    });
    
    const response = await api.post('/listings/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateListing: async (id, listingData) => {
    const formData = new FormData();
    
    Object.keys(listingData).forEach(key => {
      if (key === 'uploaded_images' && listingData[key]) {
        listingData[key].forEach(file => {
          formData.append('uploaded_images', file);
        });
      } else {
        formData.append(key, listingData[key]);
      }
    });
    
    const response = await api.patch(`/listings/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteListing: async (id) => {
    const response = await api.delete(`/listings/${id}/`);
    return response.data;
  },

  updateAvailability: async (id, status) => {
    const response = await api.patch(`/listings/${id}/update_availability/`, {
      availability_status: status
    });
    return response.data;
  }
};
