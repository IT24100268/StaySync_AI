import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../../../utils/storage";
import { ROLES, STORAGE_KEYS as AUTH_STORAGE_KEYS } from "../../../constants/auth";
import { RESTAURANT_STORAGE_KEYS } from "../utils/constants";
import { loginRestaurant, registerRestaurant } from "../services/restaurantAuthService";
import { fetchRestaurantProfile } from "../services/restaurantProfileService";

const RestaurantAuthContext = createContext(null);

export function RestaurantAuthProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const sharedRole = sharedUser?.role || null;
  const sharedUserId = sharedUser?.id || sharedUser?._id || null;

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    syncSharedRestaurantSession();
  }, [sharedRole, sharedToken, sharedUserId]);

  async function bootstrapAuth() {
    try {
      const storedToken = await getSecureItem(RESTAURANT_STORAGE_KEYS.token);
      const storedProfile = await getSecureItem(RESTAURANT_STORAGE_KEYS.profile);

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setRestaurant(JSON.parse(storedProfile));
        return;
      }

      const sharedToken = await getSecureItem(AUTH_STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(AUTH_STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.RESTAURANT) {
          const profile = await fetchRestaurantProfile();
          await setSecureItem(RESTAURANT_STORAGE_KEYS.token, sharedToken);
          await setSecureItem(RESTAURANT_STORAGE_KEYS.profile, JSON.stringify(profile));
          setToken(sharedToken);
          setRestaurant(profile);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedRestaurantSession() {
    if (sharedRole === ROLES.RESTAURANT && sharedToken) {
      if (token === sharedToken && restaurant) {
        return;
      }

      const profile = await fetchRestaurantProfile();
      await setSecureItem(RESTAURANT_STORAGE_KEYS.token, sharedToken);
      await setSecureItem(RESTAURANT_STORAGE_KEYS.profile, JSON.stringify(profile));
      setToken(sharedToken);
      setRestaurant(profile);
      return;
    }

    if (!sharedToken) {
      if (!token && !restaurant) {
        return;
      }

      await deleteSecureItem(RESTAURANT_STORAGE_KEYS.token);
      await deleteSecureItem(RESTAURANT_STORAGE_KEYS.profile);
      setToken(null);
      setRestaurant(null);
    }
  }

  async function persistSession(nextToken, nextProfile) {
    await setSecureItem(RESTAURANT_STORAGE_KEYS.token, nextToken);
    await setSecureItem(RESTAURANT_STORAGE_KEYS.profile, JSON.stringify(nextProfile));
    setToken(nextToken);
    setRestaurant(nextProfile);
  }

  async function signIn(values) {
    setAuthenticating(true);
    try {
      const response = await loginRestaurant(values);
      await persistSession(response.token, response.restaurant);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Restaurant login failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(values) {
    setAuthenticating(true);
    try {
      const response = await registerRestaurant(values);
      await persistSession(response.token, response.restaurant);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Restaurant registration failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signOut() {
    await deleteSecureItem(RESTAURANT_STORAGE_KEYS.token);
    await deleteSecureItem(RESTAURANT_STORAGE_KEYS.profile);
    setToken(null);
    setRestaurant(null);
  }

  async function updateCurrentRestaurant(nextRestaurant) {
    setRestaurant(nextRestaurant);
    await setSecureItem(RESTAURANT_STORAGE_KEYS.profile, JSON.stringify(nextRestaurant));
  }

  const value = useMemo(
    () => ({
      restaurant,
      token,
      loading,
      authenticating,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      updateCurrentRestaurant,
    }),
    [authenticating, loading, restaurant, token]
  );

  return (
    <RestaurantAuthContext.Provider value={value}>
      {children}
    </RestaurantAuthContext.Provider>
  );
}

export function useRestaurantAuth() {
  const context = useContext(RestaurantAuthContext);
  if (!context) {
    throw new Error("useRestaurantAuth must be used within RestaurantAuthProvider");
  }
  return context;
}
