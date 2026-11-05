import React from 'react';
import { Plus, Minus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

const ProductCard = ({ product, shop }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();

  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const isInCart = !!cartItem;
  const isOutOfStock = product.stock_quantity <= 0 || !product.is_available;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, shop || { id: product.shop_id, shop_name: product.shop_name });
  };

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock-card' : ''}`}>
      <div className="product-image-container">
        <img
          src={
            product.image_url ||
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'
          }
          alt={product.product_name}
          className="product-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
          }}
        />

        {discountPercent && discountPercent > 0 && (
          <span className="discount-badge">{discountPercent}% OFF</span>
        )}

        {isOutOfStock && (
          <div className="stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      <div className="product-details">
        {product.category_name && (
          <span className="product-category-name">{product.category_name}</span>
        )}

        <h4 className="product-title" title={product.product_name}>
          {product.product_name}
        </h4>

        {product.description && (
          <p className="product-brief">{product.description}</p>
        )}

        <div className="product-unit-info">
          {product.unit && <span className="unit-tag">{product.unit}</span>}
          {product.brand && <span className="brand-tag">by {product.brand}</span>}
          {product.shop_name && !shop && (
            <span className="shop-source-tag">from {product.shop_name}</span>
          )}
        </div>

        <div className="product-price-action-row">
          <div className="price-stack">
            <span className="current-price">₹{parseFloat(product.price).toFixed(2)}</span>
            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
              <span className="original-mrp">₹{parseFloat(product.mrp).toFixed(2)}</span>
            )}
          </div>

          <div className="action-control">
            {isInCart ? (
              <div className="qty-stepper-small">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, -1)}
                  className="qty-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-val">{cartItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, 1)}
                  className="qty-btn"
                  disabled={cartItem.quantity >= product.stock_quantity}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="add-to-cart-btn"
              >
                <Plus size={16} />
                <span>ADD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

