import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../../../utils/storage";
import { ROLES, STORAGE_KEYS as AUTH_STORAGE_KEYS } from "../../../constants/auth";
import { DELIVERY_STORAGE_KEYS } from "../utils/constants";
import {
  loginDeliveryPartner,
  registerDeliveryPartner,
} from "../services/deliveryAuthService";
import { fetchDeliveryPartnerProfile } from "../services/deliveryProfileService";

const DeliveryAuthContext = createContext(null);

export function DeliveryAuthProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    syncSharedDeliverySession();
  }, [sharedToken, sharedUser]);

  async function bootstrapAuth() {
    try {
      const storedToken = await getSecureItem(DELIVERY_STORAGE_KEYS.token);
      const storedProfile = await getSecureItem(DELIVERY_STORAGE_KEYS.profile);

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setPartner(JSON.parse(storedProfile));
        return;
      }

      const sharedToken = await getSecureItem(AUTH_STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(AUTH_STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.DELIVERY) {
          setToken(sharedToken);
          try {
            const profile = await fetchDeliveryPartnerProfile();
            setPartner(profile);
            await setSecureItem(DELIVERY_STORAGE_KEYS.profile, JSON.stringify(profile));
          } catch (error) {
            setPartner(parsedUser);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedDeliverySession() {
    if (sharedUser?.role === ROLES.DELIVERY && sharedToken) {
      await setSecureItem(DELIVERY_STORAGE_KEYS.token, sharedToken);
      setToken(sharedToken);
      try {
        const profile = await fetchDeliveryPartnerProfile();
        await setSecureItem(DELIVERY_STORAGE_KEYS.profile, JSON.stringify(profile));
        setPartner(profile);
      } catch (error) {
        await setSecureItem(DELIVERY_STORAGE_KEYS.profile, JSON.stringify(sharedUser));
        setPartner(sharedUser);
      }
      return;
    }

    if (!sharedToken) {
      await deleteSecureItem(DELIVERY_STORAGE_KEYS.token);
      await deleteSecureItem(DELIVERY_STORAGE_KEYS.profile);
      setToken(null);
      setPartner(null);
    }
  }

  async function persistSession(nextToken, nextProfile) {
    await setSecureItem(DELIVERY_STORAGE_KEYS.token, nextToken);
    await setSecureItem(DELIVERY_STORAGE_KEYS.profile, JSON.stringify(nextProfile));
    setToken(nextToken);
    setPartner(nextProfile);
  }

  async function signIn(values) {
    setAuthenticating(true);
    try {
      const response = await loginDeliveryPartner(values);
      await persistSession(response.token, response.partner);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Delivery partner login failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(values) {
    setAuthenticating(true);
    try {
      const response = await registerDeliveryPartner(values);
      await persistSession(response.token, response.partner);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Delivery partner registration failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signOut() {
    await deleteSecureItem(DELIVERY_STORAGE_KEYS.token);
    await deleteSecureItem(DELIVERY_STORAGE_KEYS.profile);
    setToken(null);
    setPartner(null);
  }

  async function updateCurrentPartner(nextPartner) {
    setPartner(nextPartner);
    await setSecureItem(DELIVERY_STORAGE_KEYS.profile, JSON.stringify(nextPartner));
  }

  const value = useMemo(
    () => ({
      partner,
      token,
      loading,
      authenticating,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      updateCurrentPartner,
    }),
    [authenticating, loading, partner, token]
  );

  return <DeliveryAuthContext.Provider value={value}>{children}</DeliveryAuthContext.Provider>;
}

export function useDeliveryAuth() {
  const context = useContext(DeliveryAuthContext);
  if (!context) {
    throw new Error("useDeliveryAuth must be used within DeliveryAuthProvider");
  }
  return context;
}
