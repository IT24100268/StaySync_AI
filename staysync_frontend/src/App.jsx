import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Restaurants from './pages/Restaurants';
import DeliveryPartners from './pages/DeliveryPartners';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/delivery" element={<DeliveryPartners />} />
            <Route path="/users" element={<Users />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
};

export default App;