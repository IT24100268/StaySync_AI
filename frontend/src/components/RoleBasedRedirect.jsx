import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePathForRole, resolveRole } from '../utils/authRole';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const role = resolveRole(user);
      navigate(getHomePathForRole(role), { replace: true });
    }
  }, [user, loading, navigate]);

  return <div>Redirecting...</div>;
};

export default RoleBasedRedirect;
