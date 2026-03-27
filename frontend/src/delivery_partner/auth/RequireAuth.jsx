import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/delivery/login" replace state={{ from: location }} />
  }

  return children
}

export default RequireAuth
