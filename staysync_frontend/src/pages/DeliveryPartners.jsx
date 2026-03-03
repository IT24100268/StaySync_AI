import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import './DeliveryPartners.css';

const DeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await deliveryAPI.getDeliveryPartners();
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await deliveryAPI.approveDeliveryPartner(id);
      fetchPartners();
    } catch (error) {
      console.error('Error approving delivery partner:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="delivery-partners-page">
      <h1>Delivery Partners Approval</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.id}</td>
                <td>{partner.name}</td>
                <td>{partner.phone}</td>
                <td>{partner.vehicle_type}</td>
                <td>
                  <span className={`status ${partner.status}`}>
                    {partner.status}
                  </span>
                </td>
                <td>{new Date(partner.created_at).toLocaleDateString()}</td>
                <td>
                  {partner.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        className="btn approve"
                        onClick={() => handleApprove(partner.id)}
                      >
                        Approve
                      </button>
                      <button className="btn reject">
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeliveryPartners;