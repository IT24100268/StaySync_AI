import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import ListingForm from './pages/ListingForm';
import Enquiries from './pages/Enquiries';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/listings" element={<PrivateRoute><Listings /></PrivateRoute>} />
            <Route path="/listings/create" element={<PrivateRoute><ListingForm /></PrivateRoute>} />
            <Route path="/listings/edit/:id" element={<PrivateRoute><ListingForm /></PrivateRoute>} />
            <Route path="/enquiries" element={<PrivateRoute><Enquiries /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
