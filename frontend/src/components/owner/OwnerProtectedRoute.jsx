import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function OwnerProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user && user.user_type === 'hostel_owner' ? children : <Navigate to="/login" />;
}
