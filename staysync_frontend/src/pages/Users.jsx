import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (roleFilter === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === roleFilter));
    }
  };

  const handleBlockUser = async (id) => {
    try {
      await usersAPI.blockUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <div className="filters">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="room_owner">Room Owner</option>
            <option value="restaurant_owner">Restaurant Owner</option>
            <option value="delivery_partner">Delivery Partner</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className="role-badge">
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`status ${user.is_blocked ? 'blocked' : 'active'}`}>
                    {user.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className={`btn ${user.is_blocked ? 'approve' : 'block'}`}
                    onClick={() => handleBlockUser(user.id)}
                  >
                    {user.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;