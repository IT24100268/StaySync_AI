import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import MenuManagementPage from './pages/MenuManagementPage';
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardOverviewPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
