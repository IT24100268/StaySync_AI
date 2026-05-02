import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../../../utils/storage";
import { ROLES, STORAGE_KEYS as AUTH_STORAGE_KEYS } from "../../../constants/auth";
import { OWNER_STORAGE_KEYS } from "../utils/constants";
import { loginOwner, registerOwner } from "../services/ownerAuthService";
import {
  hydrateOwnerProfile,
  saveOwnerProfile,
} from "../services/ownerProfileStorage";

const OwnerAuthContext = createContext(null);

export function OwnerAuthProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [owner, setOwner] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    syncSharedOwnerSession();
  }, [sharedToken, sharedUser]);

  async function bootstrapAuth() {
    try {
      const storedToken = await getSecureItem(OWNER_STORAGE_KEYS.token);
      const storedOwner = await getSecureItem(OWNER_STORAGE_KEYS.profile);

      if (storedToken && storedOwner) {
        const hydratedOwner = await hydrateOwnerProfile(JSON.parse(storedOwner));
        setToken(storedToken);
        setOwner(hydratedOwner);
        return;
      }

      const sharedToken = await getSecureItem(AUTH_STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(AUTH_STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.OWNER) {
          const hydratedOwner = await hydrateOwnerProfile(parsedUser);
          setToken(sharedToken);
          setOwner(hydratedOwner);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedOwnerSession() {
    if (sharedUser?.role === ROLES.OWNER && sharedToken) {
      const hydratedOwner = await hydrateOwnerProfile(sharedUser);
      await setSecureItem(OWNER_STORAGE_KEYS.token, sharedToken);
      await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(hydratedOwner));
      setToken(sharedToken);
      setOwner(hydratedOwner);
      return;
    }

    if (!sharedToken) {
      await deleteSecureItem(OWNER_STORAGE_KEYS.token);
      await deleteSecureItem(OWNER_STORAGE_KEYS.profile);
      setToken(null);
      setOwner(null);
    }
  }

  async function persistSession(nextToken, nextOwner) {
    const hydratedOwner = await hydrateOwnerProfile(nextOwner);
    await setSecureItem(OWNER_STORAGE_KEYS.token, nextToken);
    await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(hydratedOwner));
    setToken(nextToken);
    setOwner(hydratedOwner);
  }

  async function signIn(values) {
    setAuthenticating(true);
    try {
      const response = await loginOwner(values);
      await persistSession(response.token, response.owner);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Owner login failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(values) {
    setAuthenticating(true);
    try {
      const response = await registerOwner(values);
      await persistSession(response.token, response.owner);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Owner registration failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signOut() {
    await deleteSecureItem(OWNER_STORAGE_KEYS.token);
    await deleteSecureItem(OWNER_STORAGE_KEYS.profile);
    setToken(null);
    setOwner(null);
  }

  async function updateCurrentOwner(nextOwner) {
    const savedOwner = await saveOwnerProfile(nextOwner);
    setOwner(savedOwner);
    await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(savedOwner));
  }

  const value = useMemo(
    () => ({
      owner,
      token,
      loading,
      authenticating,
      isAuthenticated: Boolean(token),
      signIn,
      signUp,
      signOut,
      updateCurrentOwner,
    }),
    [authenticating, loading, owner, token]
  );

  return <OwnerAuthContext.Provider value={value}>{children}</OwnerAuthContext.Provider>;
}

export function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);

  if (!context) {
    throw new Error("useOwnerAuth must be used within OwnerAuthProvider");
  }

  return context;
}
