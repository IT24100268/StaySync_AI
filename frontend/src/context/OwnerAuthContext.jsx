import { createContext, useState, useContext, useEffect } from 'react';
import ownerApi from '../api/ownerApi';

const OwnerAuthContext = createContext();

export const OwnerAuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('owner_token');
    if (token) {
      try {
        const { data } = await ownerApi.get('/auth/profile/');
        setOwner(data);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('owner_token');
      }
    }
    setLoading(false);
  };

  const register = async (userData) => {
    const { data } = await ownerApi.post('/owner/auth/register', userData);
    if (data.token) {
      localStorage.setItem('owner_token', data.token);
      setOwner(data.owner);
    }
    return data;
  };

  const login = async (credentials) => {
    const { data } = await ownerApi.post('/owner/auth/login', credentials);
    localStorage.setItem('owner_token', data.token);
    setOwner(data.owner);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('owner_token');
    setOwner(null);
  };

  return (
    <OwnerAuthContext.Provider value={{ owner, loading, register, login, logout }}>
      {children}
    </OwnerAuthContext.Provider>
  );
};

export const useOwnerAuth = () => useContext(OwnerAuthContext);
