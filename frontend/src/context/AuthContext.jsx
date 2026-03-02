import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

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
        setUser(data);
      } catch (error) {
        localStorage.clear();
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const loginData = response.data.data || response.data;
    localStorage.setItem('access_token', loginData.access);
    localStorage.setItem('refresh_token', loginData.refresh);
    localStorage.setItem('user_type', loginData.user_type);
    await checkAuth();
    return loginData;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register/', userData);
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
