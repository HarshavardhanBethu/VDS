import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Package,
  ShoppingBag,
  ArrowLeft,
  Search,
  CheckCircle,
} from 'lucide-react';
import * as api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('');

  const { cartItems, currentShopId, totalItemCount, subtotal } = useCart();

  useEffect(() => {
    const loadShopData = async () => {
      setLoading(true);
      try {
        const [shopRes, prodRes] = await Promise.all([
          api.getShopById(id),
          api.getProductsByShop(id),
        ]);

        if (shopRes.success) setShop(shopRes.data);
        if (prodRes.success) setProducts(prodRes.data || []);
      } catch (err) {
        console.error('Error loading shop details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-loading-spinner">
          <div className="spinner"></div>
          <p>Loading shop details & catalog...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Store size={48} className="empty-icon" />
          <h2>Shop Not Found</h2>
          <p>The shop you are looking for does not exist or has been removed.</p>
          <Link to="/shops" className="btn btn-primary mt-3">
            Back to All Shops
          </Link>
        </div>
      </div>
    );
  }

  // Extract unique categories for filter
  const productCategories = Array.from(
    new Set(products.map((p) => p.category_name).filter(Boolean))
  );

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedProductCategory || p.category_name === selectedProductCategory;

    return matchesSearch && matchesCategory;
  });

  const isCartFromThisShop = currentShopId === shop.id && cartItems.length > 0;

  return (
    <div className="shop-details-page">
      {/* Back Link */}
      <div className="shop-nav-top">
        <Link to="/shops" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Shops</span>
        </Link>
      </div>

      {/* Shop Header Banner */}
      <div className="shop-header-banner">
        <div className="shop-header-content">
          <div className="shop-header-badge">
            <span className="category-pill">{shop.category_name || 'Village Store'}</span>
            <span className="status-pill open">Open for Delivery</span>
          </div>

          <h1 className="shop-header-title">{shop.shop_name}</h1>
          <p className="shop-header-desc">{shop.description}</p>

          <div className="shop-header-meta">
            <div className="meta-badge">
              <MapPin size={16} />
              <span>{shop.address_line ? `${shop.address_line}, ` : ''}{shop.village}{shop.mandal ? `, ${shop.mandal}` : ''}</span>
            </div>

            {shop.phone && (
              <div className="meta-badge">
                <Phone size={16} />
                <span>{shop.phone}</span>
              </div>
            )}

            {shop.opening_time && shop.closing_time && (
              <div className="meta-badge">
                <Clock size={16} />
                <span>{shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Catalog Section */}
      <div className="shop-catalog-section">
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={`Search in ${shop.shop_name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="catalog-search-input"
            />
          </div>

          {productCategories.length > 0 && (
            <div className="catalog-category-pills">
              <button
                type="button"
                className={`category-chip ${!selectedProductCategory ? 'active' : ''}`}
                onClick={() => setSelectedProductCategory('')}
              >
                All Items ({products.length})
              </button>
              {productCategories.map((catName) => (
                <button
                  key={catName}
                  type="button"
                  className={`category-chip ${selectedProductCategory === catName ? 'active' : ''}`}
                  onClick={() => setSelectedProductCategory(catName)}
                >
                  {catName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Package size={44} className="empty-icon" />
            <h3>No products found</h3>
            <p>No products match your search query in this shop.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar for this Shop */}
      {isCartFromThisShop && (
        <div className="floating-cart-bar">
          <div className="floating-cart-inner">
            <div className="cart-summary-text">
              <span className="cart-items-count">
                <ShoppingBag size={18} /> {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="cart-subtotal-val">₹{subtotal.toFixed(2)}</span>
            </div>
            <Link to="/cart" className="btn btn-cart-checkout">
              <span>View Cart & Checkout</span>
              <ArrowLeft size={16} className="rotate-180" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDetails;

