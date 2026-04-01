import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FoodItemsProvider } from './context/FoodItemsContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import OwnerProtectedRoute from './components/owner/OwnerProtectedRoute';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import OwnerDashboardLayout from './components/owner/OwnerDashboardLayout';
import RestaurantLayout from './components/layout/RestaurantLayout';
import AdminLayout from './components/admin/AdminLayout';
import PublicHome from './pages/publicHomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Favorites from './pages/Favorites';
import Bookings from './pages/Bookings';
import Restaurants from './pages/Restaurants';
import RestaurantMenu from './pages/RestaurantMenu';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Tracking from './pages/Tracking';
import DeliveryApp from './delivery_partner/App';
import RestaurantDashboard from './pages/RestaurantDashboard';
import MenuManagementPage from './pages/MenuManagementPage';
import OrdersPage from './pages/OrdersPage';
import PlaceholderPage from './pages/PlaceholderPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerListings from './pages/owner/OwnerListings';
import OwnerListingForm from './pages/owner/OwnerListingForm';
import OwnerAnalytics from './pages/owner/OwnerAnalytics';
import OwnerVerification from './pages/owner/OwnerVerification';
import OwnerProfile from './pages/owner/OwnerProfile';
import OwnerBookings from './pages/owner/OwnerBookings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHome from './pages/admin/AdminHome';
import AdminHome2 from './pages/admin/AdminHome2';
import RoomApprovals from './pages/admin/RoomApprovals';
import RestaurantApprovals from './pages/admin/RestaurantApprovals';
import PartnerApprovals from './pages/admin/PartnerApprovals';
import UsersManagement from './pages/admin/UsersManagement';
import ReportsQueue from './pages/admin/ReportsQueue';
import AdminLogs from './pages/admin/AdminLogs';
import AdminProfile from './pages/admin/AdminProfile';
import AdminOrdersMonitor from './pages/admin/AdminOrdersMonitor';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import RestaurantProfile from './pages/RestaurantProfile';
import RestaurantReviews from './pages/RestaurantReviews';
import OwnerReviews from './pages/owner/OwnerReviews';
import StudentReviews from './pages/StudentReviews';
import EarningsPage from './pages/EarningsPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedLayout = ({ children }) => (
  <div className="student-shell">
    <Navbar />
    <main className="student-shell__content">{children}</main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <FoodItemsProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Owner Routes - No separate login/register */}
            <Route path="/owner" element={<OwnerProtectedRoute><OwnerDashboardLayout /></OwnerProtectedRoute>}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="listings" element={<OwnerListings />} />
              <Route path="listings/new" element={<OwnerListingForm />} />
              <Route path="listings/:id/edit" element={<OwnerListingForm />} />
              <Route path="enquiries" element={<Navigate to="/owner/bookings" replace />} />
              <Route path="analytics" element={<OwnerAnalytics />} />
              <Route path="verification" element={<OwnerVerification />} />
              <Route path="reviews" element={<OwnerReviews />} />
              <Route path="profile" element={<OwnerProfile />} />
              <Route path="bookings" element={<OwnerBookings />} />
            </Route>
            
            <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Dashboard /></ProtectedLayout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Profile /></ProtectedLayout></PrivateRoute>} />
            <Route path="/rooms" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Rooms /></ProtectedLayout></PrivateRoute>} />
            <Route path="/rooms/:id" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><RoomDetail /></ProtectedLayout></PrivateRoute>} />
            <Route path="/favorites" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Favorites /></ProtectedLayout></PrivateRoute>} />
            <Route path="/bookings" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Bookings /></ProtectedLayout></PrivateRoute>} />
            <Route path="/restaurants" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Restaurants /></ProtectedLayout></PrivateRoute>} />
            <Route path="/restaurants/:id" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><RestaurantMenu /></ProtectedLayout></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Checkout /></ProtectedLayout></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Orders /></ProtectedLayout></PrivateRoute>} />
            <Route path="/reviews" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><StudentReviews /></ProtectedLayout></PrivateRoute>} />
            <Route path="/tracking/:orderId" element={<PrivateRoute allowedRoles={['student']}><ProtectedLayout><Tracking /></ProtectedLayout></PrivateRoute>} />
            
            <Route path="/delivery/*" element={<DeliveryApp />} />
            
            <Route path="/restaurant" element={<PrivateRoute allowedRoles={['restaurant_owner']}><RestaurantLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/restaurant/dashboard" replace />} />
              <Route path="dashboard" element={<RestaurantDashboard />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="reservations" element={<PlaceholderPage title="Reservations" />} />
              <Route path="earnings" element={<EarningsPage />} />
              <Route path="reviews" element={<RestaurantReviews />} />
              <Route path="profile" element={<RestaurantProfile />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'administrator', 'superadmin', 'super_admin']}><AdminLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminHome2 />} />
              <Route path="rooms" element={<RoomApprovals />} />
              <Route path="restaurants" element={<RestaurantApprovals />} />
              <Route path="partners" element={<PartnerApprovals />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="reports" element={<ReportsQueue />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="orders" element={<AdminOrdersMonitor />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        </FoodItemsProvider>
        </ToastProvider>
    </AuthProvider>
  );
}

export default App;
