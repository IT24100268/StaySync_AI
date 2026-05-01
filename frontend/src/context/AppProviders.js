import React from "react";
import { AuthProvider } from "./AuthContext";
import { BookingPaymentProvider } from "./BookingPaymentContext";
import { RoomProvider } from "./RoomContext";
import { CartProvider } from "./CartContext";
import { ToastProvider } from "./ToastContext";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <BookingPaymentProvider>
          <RoomProvider>
            <CartProvider>{children}</CartProvider>
          </RoomProvider>
        </BookingPaymentProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
