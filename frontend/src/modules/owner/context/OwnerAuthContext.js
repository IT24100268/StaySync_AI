import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../../../utils/storage";
import { ROLES, STORAGE_KEYS as AUTH_STORAGE_KEYS } from "../../../constants/auth";
import { OWNER_STORAGE_KEYS } from "../utils/constants";
import { loginOwner, registerOwner } from "../services/ownerAuthService";

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
        setToken(storedToken);
        setOwner(JSON.parse(storedOwner));
        return;
      }

      const sharedToken = await getSecureItem(AUTH_STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(AUTH_STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.OWNER) {
          setToken(sharedToken);
          setOwner(parsedUser);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedOwnerSession() {
    if (sharedUser?.role === ROLES.OWNER && sharedToken) {
      await setSecureItem(OWNER_STORAGE_KEYS.token, sharedToken);
      await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(sharedUser));
      setToken(sharedToken);
      setOwner(sharedUser);
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
    await setSecureItem(OWNER_STORAGE_KEYS.token, nextToken);
    await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(nextOwner));
    setToken(nextToken);
    setOwner(nextOwner);
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
    setOwner(nextOwner);
    await setSecureItem(OWNER_STORAGE_KEYS.profile, JSON.stringify(nextOwner));
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
