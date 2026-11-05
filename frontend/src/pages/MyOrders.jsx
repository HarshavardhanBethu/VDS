import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Store,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle,
  Eye,
  ArrowRight,
  ShoppingBag,
  Clock,
} from 'lucide-react';
import * as api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';

const MyOrders = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuccessRedirect = searchParams.get('success') === 'true';
  const orderNumber = searchParams.get('order_number');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    try {
      const res = await api.getOrderById(orderId);
      if (res.success) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="page-container orders-page">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">Track deliveries and review previous village purchases</p>
      </div>

      {/* Success banner after placing order */}
      {isSuccessRedirect && (
        <div className="alert-box alert-success mb-4">
          <CheckCircle size={24} className="text-success" />
          <div className="success-banner-content">
            <h4>Order Placed Successfully!</h4>
            <p>
              Your order {orderNumber ? <strong>#{orderNumber}</strong> : ''} has been sent to the shopkeeper. Your delivery partner will deliver it soon.
            </p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card"></div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-history-card">
              <div className="order-card-header">
                <div className="order-header-left">
                  <span className="order-no-pill">#{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="order-date-time">
                  <Calendar size={14} />
                  <span>{new Date(order.placed_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-shop-row">
                  <div className="order-shop-icon">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="order-shop-name">{order.shop_name}</h3>
                    <span className="order-village-tag">
                      <MapPin size={13} /> {order.shop_village}
                    </span>
                  </div>
                </div>

                <div className="order-summary-metrics">
                  <div className="order-metric">
                    <span className="metric-label">Total Amount</span>
                    <span className="metric-value price">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="order-metric">
                    <span className="metric-label">Payment</span>
                    <span className="metric-value">
                      {order.payment_method === 'Cash on Delivery' ? (
                        <span className="pay-tag cod"><Banknote size={13} /> COD</span>
                      ) : (
                        <span className="pay-tag online"><CreditCard size={13} /> Online</span>
                      )}
                    </span>
                  </div>

                  <div className="order-metric">
                    <span className="metric-label">Items</span>
                    <span className="metric-value">{order.total_items || 1} items</span>
                  </div>
                </div>
              </div>

              <div className="order-card-footer">
                <button
                  type="button"
                  onClick={() => openOrderDetail(order.id)}
                  className="btn btn-outline btn-sm"
                >
                  <Eye size={16} />
                  <span>View Details & Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={52} className="empty-icon" />
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet. Discover delicious local produce and groceries.</p>
          <Link to="/shops" className="btn btn-primary mt-3">
            Explore Village Shops
          </Link>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderDetail}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-detail-header">
              <div>
                <span className="order-tag">Order #{selectedOrder.order_number}</span>
                <h3 className="modal-order-title">{selectedOrder.shop_name}</h3>
              </div>
              <OrderStatusBadge status={selectedOrder.status} />
            </div>

            {/* Delivery address info */}
            <div className="order-modal-section">
              <h4 className="section-label">Delivery Address</h4>
              <div className="address-box-display">
                <strong>{selectedOrder.recipient_name} ({selectedOrder.recipient_phone})</strong>
                <p>{selectedOrder.delivery_address}</p>
                <p>{selectedOrder.delivery_village}{selectedOrder.delivery_mandal ? `, ${selectedOrder.delivery_mandal}` : ''} - {selectedOrder.delivery_pincode}</p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="order-modal-section">
              <h4 className="section-label">Ordered Items</h4>
              <div className="order-items-table">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="order-item-detail-row">
                    <div className="item-title-col">
                      <span className="item-name">{item.product_name}</span>
                      {item.unit && <span className="item-unit">({item.unit})</span>}
                    </div>
                    <div className="item-qty-col">
                      <span>₹{parseFloat(item.unit_price).toFixed(2)} × {item.quantity}</span>
                    </div>
                    <div className="item-total-col">
                      <strong>₹{parseFloat(item.total_price).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill breakdown */}
            <div className="order-modal-section bill-breakdown">
              <div className="bill-row">
                <span>Subtotal</span>
                <span>₹{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>{parseFloat(selectedOrder.delivery_fee) === 0 ? 'FREE' : `₹${parseFloat(selectedOrder.delivery_fee).toFixed(2)}`}</span>
              </div>
              <div className="bill-row grand-total">
                <span>Total Paid / Payable</span>
                <strong>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</strong>
              </div>
              <div className="bill-row payment-info">
                <span>Payment Method</span>
                <span>{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
              </div>
            </div>

            <div className="order-modal-actions">
              <button type="button" onClick={closeOrderDetail} className="btn btn-primary w-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;

