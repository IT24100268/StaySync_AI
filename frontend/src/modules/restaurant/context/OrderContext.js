import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { normalizeTrackingOrder } from "../../../services/orderTransforms";
import { connectSocket, disconnectSocket } from "../../../services/socketService";
import { fetchRestaurantOrders, updateRestaurantOrderStatus } from "../services/restaurantOrderService";

const OrderContext = createContext(null);
const ORDER_REFRESH_INTERVAL_MS = 8000;

export function OrderProvider({ children }) {
  const { role, token } = useRoleAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState([]);
  const [error, setError] = useState("");
  const knownOrderIdsRef = useRef(new Set());
  const hasBootstrappedRef = useRef(false);

  const loadOrders = useCallback(async () => {
    if (role !== "restaurant" || !token) {
      setOrders([]);
      setNewOrderAlerts([]);
      setLoading(false);
      knownOrderIdsRef.current = new Set();
      hasBootstrappedRef.current = false;
      return;
    }

    try {
      if (!hasBootstrappedRef.current) {
        setLoading(true);
      }

      const response = await fetchRestaurantOrders();
      setError("");
      const nextOrderIds = new Set(response.map((order) => order.id));

      if (hasBootstrappedRef.current) {
        const incomingOrders = response.filter((order) => !knownOrderIdsRef.current.has(order.id));

        if (incomingOrders.length) {
          setNewOrderAlerts((current) => {
            const existingIds = new Set(current.map((order) => order.id));
            const nextAlerts = incomingOrders.filter((order) => !existingIds.has(order.id));
            return [...nextAlerts, ...current];
          });
        }
      } else {
        const initialPendingOrders = response.filter((order) => order.status === "Pending");

        if (initialPendingOrders.length) {
          setNewOrderAlerts(initialPendingOrders);
        }

        hasBootstrappedRef.current = true;
      }

      knownOrderIdsRef.current = nextOrderIds;
      setOrders(response);
    } catch (loadError) {
      setError(loadError.message || "Unable to load restaurant orders.");
    } finally {
      setLoading(false);
    }
  }, [role, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (role !== "restaurant" || !token) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadOrders();
    }, ORDER_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadOrders, role, token]);

  useEffect(() => {
    if (role !== "restaurant" || !token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);

    if (!socket) {
      return undefined;
    }

    const handleNewOrder = ({ tracking }) => {
      if (!tracking) {
        return;
      }

      const nextOrder = normalizeTrackingOrder(tracking);

      knownOrderIdsRef.current.add(nextOrder.id);
      setOrders((current) => {
        if (current.some((order) => order.id === nextOrder.id)) {
          return current;
        }

        return [nextOrder, ...current];
      });

      setNewOrderAlerts((current) => {
        if (current.some((order) => order.id === nextOrder.id)) {
          return current;
        }

        return [nextOrder, ...current];
      });
    };

    socket.on("restaurant:new-order", handleNewOrder);

    return () => {
      socket.off("restaurant:new-order", handleNewOrder);
    };
  }, [role, token]);

  const setOrderStatus = useCallback(async (orderId, status, options = {}) => {
    try {
      const updatedOrder = await updateRestaurantOrderStatus(orderId, status, options);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order))
      );
      setNewOrderAlerts((current) => current.filter((order) => order.id !== orderId));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update order status." };
    }
  }, []);

  const clearNewOrderAlerts = useCallback(() => {
    setNewOrderAlerts([]);
  }, []);

  const dismissNewOrderAlert = useCallback((orderId) => {
    setNewOrderAlerts((current) => current.filter((order) => order.id !== orderId));
  }, []);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const acceptedOrders = orders.filter((order) => order.status === "Accepted").length;
    const rejectedOrders = orders.filter((order) => order.status === "Rejected").length;
    const pendingOrders = orders.filter((order) => order.status === "Pending").length;
    const preparingOrders = orders.filter((order) => order.status === "Preparing").length;
    const readyOrders = orders.filter((order) => order.status === "Ready").length;
    const totalSales = orders
      .filter((order) => order.status !== "Rejected")
      .reduce((sum, order) => sum + Number(order.total), 0);

    return {
      totalSales,
      totalOrders,
      acceptedOrders,
      rejectedOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      unreadNewOrderCount: newOrderAlerts.length,
    };
  }, [newOrderAlerts.length, orders]);

  const value = useMemo(
    () => ({
      orders,
      loading,
      newOrderAlerts,
      latestNewOrderAlert: newOrderAlerts[0] || null,
      analytics,
      error,
      setOrderStatus,
      loadOrders,
      clearNewOrderAlerts,
      dismissNewOrderAlert,
    }),
    [
      analytics,
      clearNewOrderAlerts,
      dismissNewOrderAlert,
      error,
      loadOrders,
      loading,
      newOrderAlerts,
      orders,
      setOrderStatus,
    ]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within OrderProvider");
  }
  return context;
}
