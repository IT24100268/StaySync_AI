import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listingService } from '../services/listingService';

const ListingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', rent: '', deposit: '', room_type: 'single',
    gender_allowed: 'mixed', availability_status: 'available',
    wifi: false, water: false, electricity: false, parking: false,
    attached_bathroom: false, ac: false, latitude: '', longitude: ''
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const data = await listingService.getListing(id);
      setFormData(data);
    } catch (error) {
      console.error('Failed to load listing:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = { ...formData, uploaded_images: images };
      if (id) {
        await listingService.updateListing(id, data);
      } else {
        await listingService.createListing(data);
      }
      navigate('/listings');
    } catch (err) {
      setError('Failed to save listing');
    }
  };

  return (
    <div className="listing-form">
      <h2>{id ? 'Edit Listing' : 'Create Listing'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
        <input type="number" name="rent" placeholder="Rent" value={formData.rent} onChange={handleChange} required />
        <input type="number" name="deposit" placeholder="Deposit" value={formData.deposit} onChange={handleChange} required />
        
        <select name="room_type" value={formData.room_type} onChange={handleChange}>
          <option value="single">Single</option>
          <option value="shared">Shared</option>
          <option value="hostel">Hostel</option>
          <option value="annex">Annex</option>
        </select>
        
        <select name="gender_allowed" value={formData.gender_allowed} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="mixed">Mixed</option>
        </select>
        
        <label><input type="checkbox" name="wifi" checked={formData.wifi} onChange={handleChange} /> WiFi</label>
        <label><input type="checkbox" name="water" checked={formData.water} onChange={handleChange} /> Water</label>
        <label><input type="checkbox" name="electricity" checked={formData.electricity} onChange={handleChange} /> Electricity</label>
        <label><input type="checkbox" name="parking" checked={formData.parking} onChange={handleChange} /> Parking</label>
        <label><input type="checkbox" name="attached_bathroom" checked={formData.attached_bathroom} onChange={handleChange} /> Attached Bathroom</label>
        <label><input type="checkbox" name="ac" checked={formData.ac} onChange={handleChange} /> AC</label>
        
        <input type="number" step="0.000001" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} />
        <input type="number" step="0.000001" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} />
        
        <input type="file" multiple onChange={handleImageChange} accept="image/*" />
        
        <button type="submit">{id ? 'Update' : 'Create'} Listing</button>
      </form>
    </div>
  );
};

export default ListingForm;
