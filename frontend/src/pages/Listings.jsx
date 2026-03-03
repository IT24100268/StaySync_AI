import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingService } from '../services/listingService';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await listingService.getListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await listingService.deleteListing(id);
        loadListings();
      } catch (error) {
        console.error('Failed to delete listing:', error);
      }
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      await listingService.updateAvailability(id, newStatus);
      loadListings();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="listings">
      <div className="header">
        <h1>My Listings</h1>
        <Link to="/listings/create" className="btn-primary">Create New Listing</Link>
      </div>
      
      <div className="listings-grid">
        {listings.map(listing => (
          <div key={listing.id} className="listing-card">
            <h3>{listing.title}</h3>
            <p>Rent: Rs. {listing.rent}</p>
            <p>Type: {listing.room_type}</p>
            <p>Status: {listing.availability_status}</p>
            <p>Views: {listing.views_count}</p>
            <div className="actions">
              <Link to={`/listings/edit/${listing.id}`}>Edit</Link>
              <button onClick={() => toggleAvailability(listing.id, listing.availability_status)}>
                {listing.availability_status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button onClick={() => handleDelete(listing.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Listings;
