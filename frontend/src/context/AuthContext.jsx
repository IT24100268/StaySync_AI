import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, restaurantApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRestaurantProfile = async () => {
    const response = await restaurantApi.getProfile();
    setRestaurant(response.data);
    return response.data;
  };

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await loadRestaurantProfile();
        setUser({ id: profile.owner, email: profile.email, name: profile.name });
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login({ username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    const profile = await loadRestaurantProfile();
    setUser({ id: profile.owner, email: profile.email, name: profile.name });
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    const profile = response.data.restaurant ?? (await loadRestaurantProfile());
    setRestaurant(profile);
    setUser({ id: profile.owner, email: profile.email, name: profile.name });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setRestaurant(null);
  };

  const value = useMemo(
    () => ({
      user,
      restaurant,
      loading,
      login,
      register,
      logout,
      refreshRestaurant: loadRestaurantProfile,
      setRestaurant,
    }),
    [user, restaurant, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
