import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import io from 'socket.io-client';

const Tracking = () => {
  const { orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchOrderAndTracking();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [orderId]);

  useEffect(() => {
    if (tracking && window.google) {
      initMap();
    }
  }, [tracking]);

  const fetchOrderAndTracking = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        api.get(`/orders/${orderId}/`),
        api.get(`/tracking/${orderId}/`)
      ]);
      setOrder(orderRes.data);
      setTracking(trackingRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const connectWebSocket = () => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${WS_URL}/ws/tracking/${orderId}/`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTracking((prev) => ({ ...prev, ...data }));
      updateMarker(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const initMap = () => {
    if (!mapRef.current && tracking) {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: parseFloat(tracking.current_latitude), lng: parseFloat(tracking.current_longitude) },
        zoom: 15,
      });

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(tracking.current_latitude), lng: parseFloat(tracking.current_longitude) },
        map: map,
        title: 'Rider Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });

      mapRef.current = map;
      markerRef.current = marker;
    }
  };

  const updateMarker = (data) => {
    if (markerRef.current && data.current_latitude && data.current_longitude) {
      const newPos = { lat: parseFloat(data.current_latitude), lng: parseFloat(data.current_longitude) };
      markerRef.current.setPosition(newPos);
      mapRef.current.panTo(newPos);
    }
  };

  if (!tracking || !order) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>Track Your Order</h1>
      <div style={styles.layout}>
        <div style={styles.info}>
          <div style={styles.card}>
            <h2>Order #{order.id}</h2>
            <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
            <p><strong>Total:</strong> ${order.total_price}</p>
            <p><strong>Status:</strong> {order.status.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div style={styles.card}>
            <h3>Rider Information</h3>
            <p><strong>Name:</strong> {tracking.rider_name}</p>
            <p><strong>Phone:</strong> {tracking.rider_phone}</p>
            <p><strong>ETA:</strong> {tracking.eta_minutes} minutes</p>
          </div>
          <div style={styles.timeline}>
            <h3>Order Timeline</h3>
            <div style={styles.timelineItem}>
              <div style={{ ...styles.dot, background: '#27ae60' }}></div>
              <span>Order Placed</span>
            </div>
            <div style={styles.timelineItem}>
              <div style={{ ...styles.dot, background: order.status === 'preparing' || order.status === 'on_the_way' || order.status === 'delivered' ? '#27ae60' : '#ddd' }}></div>
              <span>Preparing</span>
            </div>
            <div style={styles.timelineItem}>
              <div style={{ ...styles.dot, background: order.status === 'on_the_way' || order.status === 'delivered' ? '#27ae60' : '#ddd' }}></div>
              <span>On The Way</span>
            </div>
            <div style={styles.timelineItem}>
              <div style={{ ...styles.dot, background: order.status === 'delivered' ? '#27ae60' : '#ddd' }}></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>
        <div id="map" style={styles.map}></div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '2rem auto', padding: '0 1rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' },
  info: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  map: { height: '600px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  timeline: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  timelineItem: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' },
  dot: { width: '20px', height: '20px', borderRadius: '50%' },
};

export default Tracking;
