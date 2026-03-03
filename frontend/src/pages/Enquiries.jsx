import React, { useState, useEffect } from 'react';
import { enquiryService } from '../services/enquiryService';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      const data = await enquiryService.getEnquiries();
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await enquiryService.acceptEnquiry(id);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to accept enquiry:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await enquiryService.rejectEnquiry(id);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to reject enquiry:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="enquiries">
      <h1>Enquiries</h1>
      <div className="enquiries-list">
        {enquiries.map(enquiry => (
          <div key={enquiry.id} className="enquiry-card">
            <h3>{enquiry.listing_title}</h3>
            <p><strong>From:</strong> {enquiry.user_name}</p>
            <p><strong>Email:</strong> {enquiry.email}</p>
            <p><strong>Phone:</strong> {enquiry.phone}</p>
            <p><strong>Message:</strong> {enquiry.message}</p>
            <p><strong>Status:</strong> {enquiry.status}</p>
            <p><strong>Date:</strong> {new Date(enquiry.created_at).toLocaleDateString()}</p>
            
            {enquiry.status === 'pending' && (
              <div className="actions">
                <button onClick={() => handleAccept(enquiry.id)}>Accept</button>
                <button onClick={() => handleReject(enquiry.id)}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Enquiries;
