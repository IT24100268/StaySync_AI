import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addToCart(foodItem) {
    setItems((current) => {
      const existingItem = current.find((item) => item.foodId === foodItem.id);

      if (existingItem) {
        return current.map((item) =>
          item.foodId === foodItem.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * foodItem.price,
              }
            : item
        );
      }

      return [
        ...current,
        {
          id: `cart-${foodItem.id}`,
          foodId: foodItem.id,
          restaurantId: foodItem.restaurantId,
          name: foodItem.name,
          price: foodItem.price,
          image: foodItem.image,
          qty: 1,
          subtotal: foodItem.price,
        },
      ];
    });
  }

  function updateQty(foodId, qty) {
    if (qty <= 0) {
      removeFromCart(foodId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.foodId === foodId ? { ...item, qty, subtotal: qty * item.price } : item
      )
    );
  }

  function removeFromCart(foodId) {
    setItems((current) => current.filter((item) => item.foodId !== foodId));
  }

  function clearCart() {
    setItems([]);
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      total,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
    }),
    [items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
