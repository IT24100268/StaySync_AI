import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
} from "../services/menuService";

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadMenu = useCallback(async () => {
    if (role !== "restaurant" || !token) {
      setMenuItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetchMenuItems();
      setMenuItems(response);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load menu items.");
    } finally {
      setLoading(false);
    }
  }, [role, token]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  async function addFoodItem(payload) {
    setSubmitting(true);
    try {
      const created = await createMenuItem(payload);
      setMenuItems((current) => [created, ...current]);
      return { success: true, item: created };
    } catch (error) {
      return { success: false, message: error.message || "Unable to add food item." };
    } finally {
      setSubmitting(false);
    }
  }

  async function editFoodItem(payload) {
    setSubmitting(true);
    try {
      const updated = await updateMenuItem(payload);
      setMenuItems((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
      return { success: true, item: updated };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update food item." };
    } finally {
      setSubmitting(false);
    }
  }

  async function removeFoodItem(foodId) {
    setSubmitting(true);
    try {
      await deleteMenuItem(foodId);
      setMenuItems((current) => current.filter((item) => item.id !== foodId));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Unable to delete food item." };
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(foodId) {
    const item = menuItems.find((entry) => entry.id === foodId);
    if (!item) {
      return { success: false, message: "Food item not found." };
    }

    return editFoodItem({
      ...item,
      availability: item.availability === "in_stock" ? "out_of_stock" : "in_stock",
    });
  }

  const analytics = useMemo(() => {
    const totalMenuItems = menuItems.length;
    const availableItems = menuItems.filter((item) => item.availability === "in_stock").length;
    const outOfStockItems = totalMenuItems - availableItems;
    return { totalMenuItems, availableItems, outOfStockItems };
  }, [menuItems]);

  const value = useMemo(
    () => ({
      menuItems,
      analytics,
      loading,
      submitting,
      error,
      loadMenu,
      addFoodItem,
      editFoodItem,
      removeFoodItem,
      toggleAvailability,
    }),
    [analytics, error, loadMenu, loading, menuItems, submitting]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within MenuProvider");
  }
  return context;
}
