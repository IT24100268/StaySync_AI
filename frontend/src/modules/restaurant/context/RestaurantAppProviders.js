import React from "react";
import { RestaurantAuthProvider } from "./RestaurantAuthContext";
import { MenuProvider } from "./MenuContext";
import { OrderProvider } from "./OrderContext";

export default function RestaurantAppProviders({ children }) {
  return (
    <RestaurantAuthProvider>
      <MenuProvider>
        <OrderProvider>{children}</OrderProvider>
      </MenuProvider>
    </RestaurantAuthProvider>
  );
}
