import React from 'react';
import { Store, Heart, MapPin, Phone, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="logo-icon-box">
                <Store className="brand-icon" />
              </div>
              <span className="brand-name">VDS</span>
            </div>
            <p className="footer-desc">
              Hyperlocal e-commerce and fast delivery network built specifically for rural communities and villages. Connecting villagers to trusted local shops.
            </p>
            <div className="footer-badges">
              <span className="badge-pill"><Shield size={14} /> 100% Secure</span>
              <span className="badge-pill"><MapPin size={14} /> Hyperlocal Direct</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shops">Village Shops</Link></li>
              <li><Link to="/products">Browse Products</Link></li>
              <li><Link to="/orders">Order Tracking</Link></li>
            </ul>
          </div>

          {/* User Roles */}
          <div className="footer-col">
            <h4 className="footer-title">Join Village Network</h4>
            <ul className="footer-links">
              <li><Link to="/signup?role=customer">Customer Signup</Link></li>
              <li><Link to="/signup?role=shopkeeper">Register Your Shop</Link></li>
              <li><Link to="/signup?role=delivery_partner">Join as Delivery Partner</Link></li>
              <li><Link to="/login">Account Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-title">Village Helpline</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={16} />
                <span>Ananthagiri Mandal, Vikarabad, TS 501101</span>
              </li>
              <li>
                <Phone size={16} />
                <span>+91 90000 00001 / +91 98765 43210</span>
              </li>
              <li>
                <Mail size={16} />
                <span>support@vds.village</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} VDS – Village Delivery System. Empowering rural commerce.</p>
          <p className="made-with">
            Built with care for rural empowerment <Heart size={14} className="heart-icon" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

