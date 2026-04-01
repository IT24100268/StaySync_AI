import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { normalizeRole } from '../utils/authRole';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const { data } = await api.get('/auth/profile/');
        const effectiveRole =
          (data?.is_staff || data?.is_superuser)
            ? 'administrator'
            : normalizeRole(data?.user_type);
        const normalizedUser = effectiveRole
          ? { ...data, user_type: effectiveRole }
          : data;

        setUser(normalizedUser);
        if (effectiveRole) {
          localStorage.setItem('user_type', effectiveRole);
        }
      } catch (error) {
        // Don't clear tokens on error, user might be delivery partner
        console.error('Auth check failed:', error);
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const loginData = response.data;
    const effectiveRole =
      (loginData?.is_staff || loginData?.is_superuser || loginData?.user?.is_staff || loginData?.user?.is_superuser)
        ? 'administrator'
        : normalizeRole(loginData?.effective_role || loginData?.user_type || loginData?.user?.user_type);

    const normalizedUser = loginData?.user
      ? { ...loginData.user, user_type: effectiveRole || loginData.user.user_type }
      : null;
    const normalizedLoginData = {
      ...loginData,
      user_type: effectiveRole || loginData?.user_type,
      user: normalizedUser,
    };

    localStorage.setItem('access_token', loginData.access);
    localStorage.setItem('refresh_token', loginData.refresh);
    if (effectiveRole) {
      localStorage.setItem('user_type', effectiveRole);
    }
    setUser(normalizedUser);
    return normalizedLoginData;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register/', userData);
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
