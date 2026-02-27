import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const RestaurantMenu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const { data } = await api.get(`/restaurants/${id}/`);
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map((i) => i.id === itemId ? { ...i, quantity } : i));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { cart, restaurant, totalPrice: getTotalPrice() } });
  };

  if (!restaurant) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>{restaurant.name}</h1>
      <div style={styles.layout}>
        <div style={styles.menu}>
          <h2>Menu</h2>
          <div style={styles.grid}>
            {restaurant.menu_items?.map((item) => (
              <div key={item.id} style={styles.card}>
                {item.image && <img src={item.image} alt={item.name} style={styles.image} />}
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p style={styles.price}>${item.price}</p>
                <button onClick={() => addToCart(item)} style={styles.addButton}>Add to Cart</button>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.cart}>
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>${item.price} x {item.quantity}</p>
                  </div>
                  <div style={styles.cartActions}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyButton}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyButton}>+</button>
                    <button onClick={() => removeFromCart(item.id)} style={styles.removeButton}>Remove</button>
                  </div>
                </div>
              ))}
              <div style={styles.total}>
                <h3>Total: ${getTotalPrice()}</h3>
                <button onClick={handleCheckout} style={styles.checkoutButton}>Checkout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '2rem auto', padding: '0 1rem' },
  layout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' },
  menu: {},
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  card: { background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  image: { width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' },
  price: { fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60', margin: '0.5rem 0' },
  addButton: { width: '100%', padding: '0.5rem', background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  cart: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: '1rem', height: 'fit-content' },
  cartItem: { borderBottom: '1px solid #ddd', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cartActions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  qtyButton: { padding: '0.25rem 0.5rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  removeButton: { padding: '0.25rem 0.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  total: { marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #ddd' },
  checkoutButton: { width: '100%', padding: '0.75rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' },
};

export default RestaurantMenu;
