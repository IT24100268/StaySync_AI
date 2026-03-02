import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FoodItemsProvider } from './context/FoodItemsContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import Register from './pages/Register';
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
import DeliveryDashboard from './pages/DeliveryDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';

const ProtectedLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
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
          
          <Route path="/student/dashboard" element={<PrivateRoute><ProtectedLayout><Dashboard /></ProtectedLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProtectedLayout><Profile /></ProtectedLayout></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute><ProtectedLayout><Rooms /></ProtectedLayout></PrivateRoute>} />
          <Route path="/rooms/:id" element={<PrivateRoute><ProtectedLayout><RoomDetail /></ProtectedLayout></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><ProtectedLayout><Favorites /></ProtectedLayout></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><ProtectedLayout><Bookings /></ProtectedLayout></PrivateRoute>} />
          <Route path="/restaurants" element={<PrivateRoute><ProtectedLayout><Restaurants /></ProtectedLayout></PrivateRoute>} />
          <Route path="/restaurants/:id" element={<PrivateRoute><ProtectedLayout><RestaurantMenu /></ProtectedLayout></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><ProtectedLayout><Checkout /></ProtectedLayout></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><ProtectedLayout><Orders /></ProtectedLayout></PrivateRoute>} />
          <Route path="/tracking/:orderId" element={<PrivateRoute><ProtectedLayout><Tracking /></ProtectedLayout></PrivateRoute>} />
          
          {/* Delivery Dashboard Routes */}
          <Route path="/delivery/dashboard" element={<PrivateRoute><DeliveryDashboard /></PrivateRoute>} />
          
          {/* Restaurant Dashboard Routes */}
          <Route path="/restaurant" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="dashboard" element={<RestaurantDashboard />} />
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
