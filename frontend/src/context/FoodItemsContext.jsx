import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { restaurantApi } from '../services/restaurantApi';

const FoodItemsContext = createContext(null);

export function FoodItemsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!user) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await restaurantApi.getFoodItems();
        setItems(response.data);
      } catch {
        setError('Unable to load menu items.');
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user, fetchItems]);

  const createItem = async (payload) => {
    await restaurantApi.createFoodItem(payload);
    await fetchItems({ silent: true });
  };

  const updateItem = async (id, payload) => {
    await restaurantApi.updateFoodItem(id, payload);
    await fetchItems({ silent: true });
  };

  const deleteItem = async (id) => {
    await restaurantApi.deleteFoodItem(id);
    await fetchItems({ silent: true });
  };

  const toggleAvailability = async (id) => {
    await restaurantApi.toggleFoodAvailability(id);
    await fetchItems({ silent: true });
  };

  const value = useMemo(
    () => ({
      items,
      loading,
      refreshing,
      error,
      refresh: fetchItems,
      createItem,
      updateItem,
      deleteItem,
      toggleAvailability,
    }),
    [items, loading, refreshing, error, fetchItems]
  );

  return <FoodItemsContext.Provider value={value}>{children}</FoodItemsContext.Provider>;
}

export function useFoodItems() {
  const context = useContext(FoodItemsContext);
  if (!context) {
    throw new Error('useFoodItems must be used within FoodItemsProvider');
  }
  return context;
}
