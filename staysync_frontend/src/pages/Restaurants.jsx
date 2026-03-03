import React, { useState, useEffect } from 'react';
import { restaurantsAPI } from '../services/api';
import './Restaurants.css';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantsAPI.getRestaurants();
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await restaurantsAPI.approveRestaurant(id);
      fetchRestaurants();
    } catch (error) {
      console.error('Error approving restaurant:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="restaurants-page">
      <h1>Restaurants Approval</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Cuisine Type</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <td>{restaurant.id}</td>
                <td>{restaurant.name}</td>
                <td>{restaurant.location}</td>
                <td>{restaurant.cuisine_type}</td>
                <td>{restaurant.owner}</td>
                <td>
                  <span className={`status ${restaurant.status}`}>
                    {restaurant.status}
                  </span>
                </td>
                <td>{new Date(restaurant.created_at).toLocaleDateString()}</td>
                <td>
                  {restaurant.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        className="btn approve"
                        onClick={() => handleApprove(restaurant.id)}
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

export default Restaurants;