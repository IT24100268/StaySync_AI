import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Deliveries from './pages/Deliveries'
import Earnings from './pages/Earnings'
import Activity from './pages/Activity'
import RequireAuth from './auth/RequireAuth'
import { useAuth } from './auth/AuthProvider'
import AppLayout from './components/AppLayout'

function ProtectedLayout() {
  const location = useLocation()

  const titleMap = {
    '/dashboard': 'Delivery Dashboard',
    '/jobs': 'Available Jobs',
    '/deliveries': 'My Deliveries',
    '/earnings': 'Earnings',
    '/activity': 'Activity Log',
  }

  const subtitleMap = {
    '/dashboard': 'View and manage your deliveries.',
    '/jobs': 'Pick a delivery near you and start earning.',
    '/deliveries': 'Track and manage all your deliveries.',
    '/earnings': 'Track your delivery earnings and performance.',
    '/activity': 'View your recent activities and delivery history.',
  }

  return (
    <RequireAuth>
      <AppLayout title={titleMap[location.pathname] || 'StaySync AI'} subtitle={subtitleMap[location.pathname] || ''}>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  )
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/activity" element={<Activity />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
