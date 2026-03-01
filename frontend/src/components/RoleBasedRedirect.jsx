import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.user_type) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'hostel_owner':
          navigate('/hostel-owner/dashboard');
          break;
        case 'restaurant_owner':
          navigate('/restaurant-owner/dashboard');
          break;
        case 'delivery':
          navigate('/delivery/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, loading, navigate]);

  return <div>Redirecting...</div>;
};

export default RoleBasedRedirect;
