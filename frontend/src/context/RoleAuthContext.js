import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteSecureItem, setSecureItem } from "../utils/storage";
import { loginWithRole, registerWithRole } from "../services/roleAuthService";
import { STORAGE_KEYS } from "../constants/auth";
import { STORAGE_KEYS as STUDENT_STORAGE_KEYS } from "../utils/constants";
import { blurActiveElement } from "../utils/webFocus";
import { OWNER_STORAGE_KEYS } from "../modules/owner/utils/constants";
import { RESTAURANT_STORAGE_KEYS } from "../modules/restaurant/utils/constants";
import { DELIVERY_STORAGE_KEYS } from "../modules/delivery/utils/constants";

const RoleAuthContext = createContext(null);

export function RoleAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  async function bootstrapAuth() {
    setLoading(false);
  }

  async function persistSession(nextToken, nextUser) {
    await setSecureItem(STORAGE_KEYS.authToken, nextToken);
    await setSecureItem(STORAGE_KEYS.authUser, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(values) {
    setAuthenticating(true);
    try {
      const response = await loginWithRole(values);
      await persistSession(response.token, response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, message: error.message || "Login failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function register(values) {
    setAuthenticating(true);
    try {
      const response = await registerWithRole(values);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, message: error.message || "Registration failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function logout() {
    blurActiveElement();
    await deleteSecureItem(STORAGE_KEYS.authToken);
    await deleteSecureItem(STORAGE_KEYS.authUser);
    await deleteSecureItem(STUDENT_STORAGE_KEYS.token);
    await deleteSecureItem(STUDENT_STORAGE_KEYS.user);
    await deleteSecureItem(OWNER_STORAGE_KEYS.token);
    await deleteSecureItem(OWNER_STORAGE_KEYS.profile);
    await deleteSecureItem(RESTAURANT_STORAGE_KEYS.token);
    await deleteSecureItem(RESTAURANT_STORAGE_KEYS.profile);
    await deleteSecureItem(DELIVERY_STORAGE_KEYS.token);
    await deleteSecureItem(DELIVERY_STORAGE_KEYS.profile);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      isAuthenticated: Boolean(token),
      loading,
      authenticating,
      login,
      register,
      logout,
    }),
    [authenticating, loading, token, user]
  );

  return <RoleAuthContext.Provider value={value}>{children}</RoleAuthContext.Provider>;
}

export function useRoleAuth() {
  const context = useContext(RoleAuthContext);

  if (!context) {
    throw new Error("useRoleAuth must be used within RoleAuthProvider");
  }

  return context;
}
