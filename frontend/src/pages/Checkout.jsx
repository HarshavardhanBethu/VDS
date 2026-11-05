import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  Banknote,
  ShoppingBag,
  Plus,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../services/api.js';

const Checkout = () => {
  const {
    cartItems,
    currentShopId,
    currentShopName,
    subtotal,
    deliveryFee,
    discount,
    totalAmount,
    totalItemCount,
    clearCart,
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [newAddress, setNewAddress] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address_line: '',
    village: 'Ananthagiri',
    mandal: 'Vikarabad',
    district: 'Vikarabad',
    state: 'Telangana',
    pincode: '501101',
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      api.getAddresses()
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setAddresses(res.data);
            setSelectedAddressId(res.data[0].id);
          } else {
            setShowNewAddressForm(true);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Please add items from a village shop before proceeding to checkout.</p>
          <Link to="/shops" className="btn btn-primary mt-3">
            Browse Shops
          </Link>
        </div>
      </div>
    );
  }

  const handleNewAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAddressId && !showNewAddressForm) {
      setError('Please select or add a delivery address.');
      return;
    }

    if (showNewAddressForm) {
      if (!newAddress.full_name || !newAddress.phone || !newAddress.address_line || !newAddress.village) {
        setError('Please fill in required address fields: Full Name, Phone, Address/Landmark, and Village.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        shop_id: currentShopId,
        address_id: showNewAddressForm ? undefined : selectedAddressId,
        new_address: showNewAddressForm ? newAddress : undefined,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        customer_note: customerNote,
      };

      const res = await api.createOrder(orderPayload);

      if (res.success) {
        clearCart();
        navigate(`/orders?success=true&order_number=${res.data?.order_number || ''}`);
      } else {
        throw new Error(res.message || 'Could not place order');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container checkout-page">
      <div className="checkout-nav-top">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div className="page-header">
        <h1 className="page-title">Village Delivery Checkout</h1>
        <p className="page-subtitle">
          Confirm your delivery location and payment to complete your order from <strong>{currentShopName}</strong>
        </p>
      </div>

      {error && (
        <div className="alert-box alert-error mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-layout-grid">
        {/* Left Column: Address & Payment Details */}
        <div className="checkout-details-column">
          {/* Section 1: Delivery Address */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="card-step-badge">1</div>
              <MapPin size={22} className="header-icon" />
              <h3 className="card-header-title">Delivery Address in Village</h3>
            </div>

            <div className="checkout-card-body">
              {/* Existing Addresses */}
              {addresses.length > 0 && !showNewAddressForm && (
                <div className="saved-addresses-list">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-radio-label ${selectedAddressId === addr.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="address_select"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <div className="address-content">
                        <div className="address-recipient">
                          <strong>{addr.full_name}</strong>
                          <span className="address-phone">{addr.phone}</span>
                        </div>
                        <p className="address-text">{addr.address_line}</p>
                        <p className="address-village-line">
                          {addr.village}{addr.mandal ? `, ${addr.mandal}` : ''}{addr.district ? `, ${addr.district}` : ''} - {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="btn btn-outline btn-sm mt-2"
                  >
                    <Plus size={16} />
                    <span>Deliver to a New Address</span>
                  </button>
                </div>
              )}

              {/* Add New Address Inline */}
              {showNewAddressForm && (
                <div className="new-address-form-box">
                  <div className="form-sub-header">
                    <h4>Enter Delivery Location Details</h4>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="btn-link-text"
                      >
                        Cancel & choose saved address
                      </button>
                    )}
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={newAddress.full_name}
                        onChange={handleNewAddressChange}
                        placeholder="Recipient full name"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={newAddress.phone}
                        onChange={handleNewAddressChange}
                        placeholder="10-digit mobile number"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">House / Flat No., Street, Landmark *</label>
                    <input
                      type="text"
                      name="address_line"
                      value={newAddress.address_line}
                      onChange={handleNewAddressChange}
                      placeholder="e.g. House No. 4-12, Near Primary School / Water Tank"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Village / Gram Panchayat *</label>
                      <input
                        type="text"
                        name="village"
                        value={newAddress.village}
                        onChange={handleNewAddressChange}
                        placeholder="e.g. Ananthagiri"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mandal / Taluk</label>
                      <input
                        type="text"
                        name="mandal"
                        value={newAddress.mandal}
                        onChange={handleNewAddressChange}
                        placeholder="e.g. Vikarabad"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">District & State</label>
                      <input
                        type="text"
                        name="district"
                        value={newAddress.district}
                        onChange={handleNewAddressChange}
                        placeholder="District"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={newAddress.pincode}
                        onChange={handleNewAddressChange}
                        placeholder="501101"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="card-step-badge">2</div>
              <Banknote size={22} className="header-icon" />
              <h3 className="card-header-title">Payment Method</h3>
            </div>

            <div className="checkout-card-body">
              <div className="payment-options-grid">
                <label className={`payment-option-card ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="Cash on Delivery"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-title-row">
                      <Banknote size={20} className="payment-icon green" />
                      <strong>Cash on Delivery (COD)</strong>
                    </div>
                    <p className="payment-sub">Pay in cash or UPI directly when your delivery partner arrives</p>
                  </div>
                </label>

                <label className={`payment-option-card ${paymentMethod === 'Online Payment' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="Online Payment"
                    checked={paymentMethod === 'Online Payment'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-title-row">
                      <CreditCard size={20} className="payment-icon blue" />
                      <strong>Online Payment (UPI / Cards / NetBanking)</strong>
                    </div>
                    <p className="payment-sub">Fast & contactless automated instant payment</p>
                  </div>
                </label>
              </div>

              {/* Customer Instructions / Note */}
              <div className="form-group mt-4">
                <label className="form-label">Delivery Note / Landmark Instructions (Optional)</label>
                <textarea
                  rows="2"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Call before coming; leave package with neighbor if not home..."
                  className="form-input"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="checkout-summary-column">
          <div className="bill-card sticky-bill">
            <h3 className="bill-title">Order Review</h3>

            {/* Shop badge */}
            <div className="shop-summary-pill">
              <Store size={16} />
              <span>{currentShopName}</span>
            </div>

            {/* Items mini list */}
            <div className="checkout-mini-items">
              {cartItems.map((item) => (
                <div key={item.product_id} className="mini-item-row">
                  <div className="mini-item-name">
                    <span>{item.product_name}</span>
                    <span className="mini-item-qty">× {item.quantity}</span>
                  </div>
                  <span className="mini-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="bill-rows">
              <div className="bill-row">
                <span>Items Subtotal ({totalItemCount})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="bill-row">
                <span>Village Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="free-tag">FREE</span>
                ) : (
                  <span>₹{deliveryFee.toFixed(2)}</span>
                )}
              </div>

              {discount > 0 && (
                <div className="bill-row discount-row">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="bill-divider"></div>

              <div className="bill-row grand-total-row">
                <span>Total Amount</span>
                <span className="grand-total-val">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-100 btn-place-order"
            >
              {isSubmitting ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>PLACE ORDER (₹{totalAmount.toFixed(2)})</span>
                </>
              )}
            </button>

            <div className="checkout-trust-box">
              <div className="trust-item">
                <Truck size={16} />
                <span>Hyperlocal village delivery</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} />
                <span>100% Genuine local products</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;

