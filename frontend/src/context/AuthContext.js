import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginStudent, registerStudent } from "../services/authService";
import { useRoleAuth } from "./RoleAuthContext";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../utils/storage";
import { STORAGE_KEYS } from "../utils/constants";
import {
  ROLES,
  STORAGE_KEYS as AUTH_STORAGE_KEYS,
} from "../constants/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: sharedUser, token: sharedToken } = useRoleAuth();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    syncSharedStudentSession();
  }, [sharedToken, sharedUser]);

  async function bootstrapAuth() {
    try {
      const storedToken = await getSecureItem(STORAGE_KEYS.token);
      const storedUser = await getSecureItem(STORAGE_KEYS.user);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        return;
      }

      const sharedToken = await getSecureItem(AUTH_STORAGE_KEYS.authToken);
      const sharedUser = await getSecureItem(AUTH_STORAGE_KEYS.authUser);

      if (sharedToken && sharedUser) {
        const parsedUser = JSON.parse(sharedUser);
        if (parsedUser.role === ROLES.STUDENT) {
          setToken(sharedToken);
          setUser(parsedUser);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncSharedStudentSession() {
    if (sharedUser?.role === ROLES.STUDENT && sharedToken) {
      await setSecureItem(STORAGE_KEYS.token, sharedToken);
      await setSecureItem(STORAGE_KEYS.user, JSON.stringify(sharedUser));
      setToken(sharedToken);
      setUser(sharedUser);
      return;
    }

    if (!sharedToken) {
      await deleteSecureItem(STORAGE_KEYS.token);
      await deleteSecureItem(STORAGE_KEYS.user);
      setToken(null);
      setUser(null);
    }
  }

  async function persistSession(nextToken, nextUser) {
    await setSecureItem(STORAGE_KEYS.token, nextToken);
    await setSecureItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function signIn(values) {
    setAuthenticating(true);
    try {
      const response = await loginStudent(values);
      await persistSession(response.token, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Login failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signUp(values) {
    setAuthenticating(true);
    try {
      const response = await registerStudent(values);
      await persistSession(response.token, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Registration failed." };
    } finally {
      setAuthenticating(false);
    }
  }

  async function signOut() {
    await deleteSecureItem(STORAGE_KEYS.token);
    await deleteSecureItem(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }

  async function updateCurrentUser(nextUser) {
    setUser(nextUser);
    await setSecureItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authenticating,
      isAuthenticated: Boolean(token),
      setUser,
      updateCurrentUser,
      signIn,
      signUp,
      signOut,
    }),
    [authenticating, loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
