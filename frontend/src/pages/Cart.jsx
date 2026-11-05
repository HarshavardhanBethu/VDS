import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Cart = () => {
  const {
    cartItems,
    currentShopName,
    currentShopId,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    totalAmount,
    totalItemCount,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-cart-card">
          <div className="empty-cart-icon">
            <ShoppingBag size={56} />
          </div>
          <h2>Your Village Cart is Empty</h2>
          <p>
            Explore trusted neighborhood shops in your village and add fresh farm dairy, daily groceries, or medicines.
          </p>
          <div className="empty-cart-actions">
            <Link to="/shops" className="btn btn-primary btn-lg">
              <Store size={18} />
              <span>Browse Village Shops</span>
            </Link>
            <Link to="/products" className="btn btn-outline btn-lg">
              <span>View All Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container cart-page">
      <div className="cart-header-row">
        <div>
          <h1 className="page-title">Your Village Cart ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</h1>
          <p className="page-subtitle">
            Ordering directly from <strong>{currentShopName || 'Village Shop'}</strong>
          </p>
        </div>
        <button onClick={clearCart} className="btn-clear-cart" title="Clear all items">
          <Trash2 size={16} />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="cart-layout-grid">
        {/* Left: Cart Items List */}
        <div className="cart-items-section">
          <div className="shop-identity-bar">
            <div className="shop-badge-left">
              <Store size={18} />
              <span>Items from <strong>{currentShopName}</strong></span>
            </div>
            {currentShopId && (
              <Link to={`/shops/${currentShopId}`} className="add-more-link">
                + Add more items
              </Link>
            )}
          </div>

          <div className="cart-items-card">
            {cartItems.map((item) => (
              <div key={item.product_id} className="cart-item-row">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                  alt={item.product_name}
                  className="cart-item-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                  }}
                />

                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.product_name}</h4>
                  {item.unit && <span className="cart-item-unit">{item.unit}</span>}
                  <div className="cart-item-price-unit">
                    <span className="price-bold">₹{item.price.toFixed(2)}</span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="mrp-strikethrough">₹{item.mrp.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-stepper">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="qty-step-btn"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-number">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="qty-step-btn"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="item-line-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="item-delete-btn"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-delivery-guarantee">
            <Truck size={20} className="guarantee-icon" />
            <div>
              <strong>Superfast Hyperlocal Village Delivery</strong>
              <p>Items packed fresh and delivered to your doorstep within 45 minutes.</p>
            </div>
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="cart-summary-section">
          <div className="bill-card">
            <h3 className="bill-title">Order Summary</h3>

            <div className="bill-rows">
              <div className="bill-row">
                <span>Subtotal ({totalItemCount} items)</span>
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

              {deliveryFee > 0 && (
                <div className="free-delivery-hint">
                  Add items worth ₹{(500 - subtotal).toFixed(2)} more for <strong>FREE Delivery</strong>!
                </div>
              )}

              <div className="bill-divider"></div>

              <div className="bill-row grand-total-row">
                <span>To Pay</span>
                <span className="grand-total-val">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              className="btn btn-primary btn-lg w-100 btn-checkout-action"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <div className="secure-badge-row">
              <ShieldCheck size={16} />
              <span>Safe & Secure Village Fulfillment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

