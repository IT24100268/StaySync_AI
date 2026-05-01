import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { fetchAdminUsers, updateAdminUserBlockStatus } from "../services/adminUserService";

const UserManagementContext = createContext(null);

export function UserManagementProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function loadUsers() {
    if (role !== "admin" || !token) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAdminUsers();
      setUsers(response);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === "admin" && token) {
      loadUsers();
      return;
    }

    setUsers([]);
    setLoading(false);
  }, [role, token]);

  async function toggleBlockUser(userId, reason = "") {
    const existingUser = users.find((user) => user.id === userId);

    if (!existingUser) {
      return { success: false, message: "User not found." };
    }

    try {
      const updatedUser = await updateAdminUserBlockStatus(userId, !existingUser.isBlocked, reason);
      setUsers((current) =>
        current.map((user) => (user.id === userId ? updatedUser : user))
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update user status." };
    }
  }

  function getUserDetails(userId) {
    return users.find((user) => user.id === userId) || null;
  }

  const filteredUsers = users.filter((user) => {
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      user.name.toLowerCase().includes(searchValue) ||
      user.email.toLowerCase().includes(searchValue);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const summary = {
    totalUsers: users.length,
    totalStudents: users.filter((user) => user.role === "student").length,
    totalRoomOwners: users.filter((user) => user.role === "owner").length,
    totalRestaurants: users.filter((user) => user.role === "restaurant").length,
    totalDeliveryPartners: users.filter((user) => user.role === "delivery").length,
  };

  const value = useMemo(
    () => ({
      users,
      filteredUsers,
      loading,
      searchQuery,
      roleFilter,
      summary,
      setSearchQuery,
      setRoleFilter,
      toggleBlockUser,
      getUserDetails,
      loadUsers,
    }),
    [filteredUsers, loading, roleFilter, searchQuery, users]
  );

  return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
}

export function useUserManagement() {
  const context = useContext(UserManagementContext);

  if (!context) {
    throw new Error("useUserManagement must be used within UserManagementProvider");
  }

  return context;
}
