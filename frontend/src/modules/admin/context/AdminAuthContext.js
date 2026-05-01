import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, ROLES } from "../../../constants/auth";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../../../utils/storage";
import { ADMIN_STORAGE_KEYS } from "../utils/constants";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    syncSharedAdminSession();
  }, [sharedToken, sharedUser]);

  async function bootstrapAuth() {
    try {
      const storedToken = await getSecureItem(ADMIN_STORAGE_KEYS.token);
      const storedProfile = await getSecureItem(ADMIN_STORAGE_KEYS.profile);

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedProfile));
        return;
      }

      const sharedToken = await getSecureItem(STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.ADMIN) {
          setToken(sharedToken);
          setAdmin(parsedUser);
          await setSecureItem(ADMIN_STORAGE_KEYS.token, sharedToken);
          await setSecureItem(ADMIN_STORAGE_KEYS.profile, JSON.stringify(parsedUser));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedAdminSession() {
    if (sharedUser?.role === ROLES.ADMIN && sharedToken) {
      setToken(sharedToken);
      setAdmin(sharedUser);
      await setSecureItem(ADMIN_STORAGE_KEYS.token, sharedToken);
      await setSecureItem(ADMIN_STORAGE_KEYS.profile, JSON.stringify(sharedUser));
      return;
    }

    if (!sharedToken) {
      await deleteSecureItem(ADMIN_STORAGE_KEYS.token);
      await deleteSecureItem(ADMIN_STORAGE_KEYS.profile);
      setToken(null);
      setAdmin(null);
    }
  }

  async function clearAdminSession() {
    await deleteSecureItem(ADMIN_STORAGE_KEYS.token);
    await deleteSecureItem(ADMIN_STORAGE_KEYS.profile);
    setToken(null);
    setAdmin(null);
  }

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token),
      clearAdminSession,
    }),
    [admin, loading, token]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return context;
}
