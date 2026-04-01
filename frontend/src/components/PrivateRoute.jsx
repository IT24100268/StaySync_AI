import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole, hasAllowedRole, resolveRole } from '../utils/authRole';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const role = resolveRole(user);

  if (loading) return <div>Loading...</div>;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAllowedRole(role, allowedRoles)) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children;
};

export default PrivateRoute;
