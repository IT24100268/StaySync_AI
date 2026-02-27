import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, totalPrice } = location.state || {};
  const [address, setAddress] = useState('');

  const handleOrder = async () => {
    if (!address) {
      alert('Please enter delivery address');
      return;
    }

    try {
      const orderData = {
        restaurant_id: restaurant.id,
        delivery_address: address,
        payment_method: 'cod',
        total_price: totalPrice,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      const { data } = await api.post('/orders/create/', orderData);
      alert('Order placed successfully!');
      navigate(`/tracking/${data.id}`);
    } catch (error) {
      alert('Error placing order');
      console.error(error);
    }
  };

  if (!cart) {
    return <div>No items in cart</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Checkout</h1>
        <h2>Order Summary</h2>
        <div style={styles.items}>
          {cart.map((item) => (
            <div key={item.id} style={styles.item}>
              <span>{item.name} x {item.quantity}</span>
              <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={styles.total}>
          <h3>Total: ${totalPrice}</h3>
        </div>
        <div style={styles.form}>
          <h3>Delivery Details</h3>
          <textarea
            placeholder="Enter your delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={styles.textarea}
            required
          />
          <p><strong>Payment Method:</strong> Cash on Delivery</p>
          <button onClick={handleOrder} style={styles.button}>Place Order</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  items: { margin: '1rem 0' },
  item: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #ddd' },
  total: { marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #ddd' },
  form: { marginTop: '2rem' },
  textarea: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', marginTop: '0.5rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' },
};

export default Checkout;
