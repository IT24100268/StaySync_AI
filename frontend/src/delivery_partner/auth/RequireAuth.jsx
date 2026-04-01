import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const getRedirectByRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (value === 'student') return '/student/dashboard'
  if (value === 'hostel_owner') return '/owner/dashboard'
  if (value === 'restaurant_owner') return '/restaurant/dashboard'
  if (value === 'admin' || value === 'administrator' || value === 'superadmin' || value === 'super_admin') {
    return '/admin/dashboard'
  }
  return '/'
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const role = String(localStorage.getItem('user_type') || '').trim().toLowerCase()

  if (role && role !== 'delivery') {
    return <Navigate to={getRedirectByRole(role)} replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/delivery/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireAuth
