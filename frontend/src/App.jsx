import { Navigate, Route, Routes } from 'react-router-dom';
import RestaurantLayout from './components/layout/RestaurantLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import MenuItemsPage from './pages/MenuItemsPage';
import OrdersPage from './pages/OrdersPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/restaurant"
        element={
          <ProtectedRoute>
            <RestaurantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/restaurant/dashboard" replace />} />
        <Route path="dashboard" element={<RestaurantDashboard />} />
        <Route path="menu" element={<MenuItemsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route
          path="reservations"
          element={<PlaceholderPage title="Reservations" description="Table reservation management UI can be extended here." />}
        />
        <Route
          path="earnings"
          element={<PlaceholderPage title="Earnings" description="Payouts, settlement reports, and trends can be managed here." />}
        />
        <Route
          path="reviews"
          element={<PlaceholderPage title="Reviews" description="Moderate and respond to customer feedback from this module." />}
        />
        <Route
          path="settings"
          element={<PlaceholderPage title="Settings" description="Restaurant profile, notification, and account settings live here." />}
        />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/restaurant/dashboard" replace />} />
      <Route path="/menu" element={<Navigate to="/restaurant/menu" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
