import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import AppToast from "../components/common/AppToast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (!toast.visible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setToast((current) => ({
        ...current,
        visible: false,
      }));
    }, 2400);

    return () => clearTimeout(timeoutId);
  }, [toast.visible]);

  function showToast(message, type = "success") {
    setToast({
      visible: true,
      message,
      type,
    });
  }

  const value = useMemo(
    () => ({
      showToast,
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.container}>
        {children}
        <AppToast visible={toast.visible} message={toast.message} type={toast.type} />
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
