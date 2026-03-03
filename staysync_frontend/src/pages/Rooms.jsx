import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../services/api';
import './Rooms.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, statusFilter]);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    if (statusFilter === 'all') {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter(room => room.status === statusFilter));
    }
  };

  const handleApprove = async (id) => {
    try {
      await roomsAPI.approveRoom(id);
      fetchRooms();
    } catch (error) {
      console.error('Error approving room:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="rooms-page">
      <div className="page-header">
        <h1>Rooms Approval</h1>
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Price</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room.id}>
                <td>{room.id}</td>
                <td>{room.name}</td>
                <td>{room.location}</td>
                <td>${room.price}</td>
                <td>{room.owner}</td>
                <td>
                  <span className={`status ${room.status}`}>
                    {room.status}
                  </span>
                </td>
                <td>{new Date(room.created_at).toLocaleDateString()}</td>
                <td>
                  {room.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        className="btn approve"
                        onClick={() => handleApprove(room.id)}
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

export default Rooms;