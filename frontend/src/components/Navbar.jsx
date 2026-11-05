import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  Home,
  User,
  LogOut,
  Package,
  Layers,
  Truck,
  ShieldCheck,
  Menu,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout, isShopkeeper, isAdmin, isDelivery } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="logo-icon-box">
            <Store className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-name">VDS</span>
            <span className="brand-tagline">Village Delivery</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/shops" className={`nav-link ${isActive('/shops') ? 'active' : ''}`}>
            <Store size={18} />
            <span>Shops</span>
          </Link>
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
            <Layers size={18} />
            <span>Products</span>
          </Link>

          {/* Role specific links */}
          {isAuthenticated && (
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
              <Package size={18} />
              <span>My Orders</span>
            </Link>
          )}

          {isShopkeeper && (
            <Link
              to="/shopkeeper"
              className={`nav-link role-link ${isActive('/shopkeeper') ? 'active' : ''}`}
            >
              <Store size={18} />
              <span>Shopkeeper Hub</span>
            </Link>
          )}

          {isDelivery && (
            <Link
              to="/delivery"
              className={`nav-link role-link ${isActive('/delivery') ? 'active' : ''}`}
            >
              <Truck size={18} />
              <span>Deliveries</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link role-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <ShieldCheck size={18} />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Cart Button */}
          <Link to="/cart" className="cart-btn" aria-label="Shopping Cart">
            <ShoppingBag size={22} />
            {totalItemCount > 0 && <span className="cart-badge">{totalItemCount}</span>}
          </Link>

          {/* User Auth */}
          {isAuthenticated ? (
            <div className="user-dropdown">
              <div className="user-pill">
                <div className="avatar-circle">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-info-text">
                  <span className="user-name-label">{user.full_name.split(' ')[0]}</span>
                  <span className="user-role-badge">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-icon-btn"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-action-btns">
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Signup
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <Link
            to="/"
            className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link
            to="/shops"
            className={`mobile-nav-link ${isActive('/shops') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Store size={20} />
            <span>Village Shops</span>
          </Link>
          <Link
            to="/products"
            className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Layers size={20} />
            <span>All Products</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/orders"
                className={`mobile-nav-link ${isActive('/orders') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package size={20} />
                <span>My Orders</span>
              </Link>

              {isShopkeeper && (
                <Link
                  to="/shopkeeper"
                  className="mobile-nav-link role-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Store size={20} />
                  <span>Shopkeeper Dashboard</span>
                </Link>
              )}

              {isDelivery && (
                <Link
                  to="/delivery"
                  className="mobile-nav-link role-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Truck size={20} />
                  <span>Delivery Partner Orders</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="mobile-nav-link role-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck size={20} />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <div className="mobile-user-row">
                <span>Signed in as <strong>{user.full_name}</strong> ({user.role})</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="mobile-auth-btns">
              <Link
                to="/login"
                className="btn btn-outline w-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary w-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

