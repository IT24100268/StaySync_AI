import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setDocument(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const data = { ...formData };
      if (document) data.verification_document = document;
      
      await authService.updateProfile(data);
      setMessage('Profile updated successfully');
      loadProfile();
    } catch (error) {
      setMessage('Failed to update profile');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile">
      <h1>My Profile</h1>
      {message && <div className="message">{message}</div>}
      
      <div className="verification-status">
        <strong>Verification Status:</strong> {profile?.verification_status}
      </div>

      <form onSubmit={handleSubmit}>
        <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name || ''} onChange={handleChange} />
        <input type="text" name="phone" placeholder="Phone" value={formData.phone || ''} onChange={handleChange} />
        <input type="text" name="nic_passport" placeholder="NIC/Passport" value={formData.nic_passport || ''} onChange={handleChange} />
        <textarea name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} />
        
        <label>Verification Document:</label>
        <input type="file" onChange={handleFileChange} />
        
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default Profile;
