import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Deliveries from './pages/Deliveries'
import Earnings from './pages/Earnings'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import AuthRedirect from './pages/AuthRedirect'
import RequireAuth from './auth/RequireAuth'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import AppLayout from './components/AppLayout'

function ProtectedLayout() {
  const location = useLocation()

  const titleMap = {
    '/delivery/dashboard': 'Delivery Dashboard',
    '/delivery/jobs': 'Available Jobs',
    '/delivery/deliveries': 'My Deliveries',
    '/delivery/earnings': 'Earnings',
    '/delivery/activity': 'Activity Log',
    '/delivery/profile': 'Profile Settings',
  }

  const subtitleMap = {
    '/delivery/dashboard': 'View and manage your deliveries.',
    '/delivery/jobs': 'Pick a delivery near you and start earning.',
    '/delivery/deliveries': 'Track and manage all your deliveries.',
    '/delivery/earnings': 'Track your delivery earnings and performance.',
    '/delivery/activity': 'View your recent activities and delivery history.',
    '/delivery/profile': 'Update your personal and vehicle information.',
  }

  return (
    <RequireAuth>
      <AppLayout title={titleMap[location.pathname] || 'StaySync AI'} subtitle={subtitleMap[location.pathname] || ''}>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  )
}

function DeliveryRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="auth-redirect" element={<AuthRedirect />} />

      <Route element={<ProtectedLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="activity" element={<Activity />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/delivery/dashboard' : '/delivery/login'} replace />} />
      <Route path="*" element={<Navigate to="/delivery" replace />} />
    </Routes>
  )
}

export default function DeliveryApp() {
  return (
    <AuthProvider>
      <DeliveryRoutes />
    </AuthProvider>
  )
}
