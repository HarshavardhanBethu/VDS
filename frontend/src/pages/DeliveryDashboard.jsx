import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Store,
  CheckCircle,
  Clock,
  Bike,
  AlertCircle,
  Package,
} from 'lucide-react';
import * as api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        showNotification('success', `Order status updated to "${newStatus}"!`);
        fetchDeliveryOrders();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update order status');
    }
  };

  // Active vs completed orders
  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Delivery Partner Portal</h1>
          <p className="page-subtitle">
            Welcome, <strong>{user?.full_name}</strong> – Pick up packages from village shops and deliver to customers.
          </p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert-box ${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Active Orders Section */}
      <div className="dashboard-content-card mb-4">
        <div className="card-header-bar">
          <h3>Active Deliveries ({activeOrders.length})</h3>
        </div>

        {activeOrders.length > 0 ? (
          <div className="delivery-cards-grid">
            {activeOrders.map((order) => (
              <div key={order.id} className="delivery-card">
                <div className="delivery-card-top">
                  <span className="order-badge">#{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Pickup Point */}
                <div className="delivery-point pickup">
                  <div className="point-icon pickup"><Store size={18} /></div>
                  <div className="point-text">
                    <span className="point-label">Pick up from:</span>
                    <strong>{order.shop_name}</strong>
                    <span className="sub">{order.shop_village}</span>
                  </div>
                </div>

                {/* Dropoff Point */}
                <div className="delivery-point dropoff">
                  <div className="point-icon dropoff"><MapPin size={18} /></div>
                  <div className="point-text">
                    <span className="point-label">Deliver to:</span>
                    <strong>{order.customer_name} ({order.customer_phone})</strong>
                    <span className="sub">{order.address_line}, {order.delivery_village}</span>
                  </div>
                </div>

                {/* Collect cash if COD */}
                <div className="delivery-payment-row">
                  <span>Payment:</span>
                  <strong>
                    {order.payment_method === 'Cash on Delivery'
                      ? `Collect ₹${parseFloat(order.total_amount).toFixed(2)} (Cash)`
                      : `Paid Online (₹${parseFloat(order.total_amount).toFixed(2)})`}
                  </strong>
                </div>

                {/* Action buttons */}
                <div className="delivery-actions-row">
                  {order.status !== 'out_for_delivery' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                      className="btn btn-warning flex-1"
                    >
                      <Bike size={16} />
                      <span>Start Delivery</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    className="btn btn-success flex-1"
                  >
                    <CheckCircle size={16} />
                    <span>Mark Delivered</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Truck size={48} className="empty-icon" />
            <h3>No pending deliveries</h3>
            <p>All assigned deliveries in your village have been completed!</p>
          </div>
        )}
      </div>

      {/* Completed Deliveries */}
      <div className="dashboard-content-card">
        <div className="card-header-bar">
          <h3>Completed Deliveries ({completedOrders.length})</h3>
        </div>
        <div className="table-responsive">
          <table className="vds-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Shop</th>
                <th>Customer</th>
                <th>Village</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.order_number}</strong></td>
                  <td>{o.shop_name}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.delivery_village}</td>
                  <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;

