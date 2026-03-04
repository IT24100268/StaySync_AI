import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('access_token');

  if (loading) return <div>Loading...</div>;
  return (user || token) ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
