import React from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Clock, Phone, ArrowRight, Package } from 'lucide-react';

const ShopCard = ({ shop }) => {
  return (
    <div className="shop-card">
      <div className="shop-card-header">
        <div className="shop-category-tag">
          {shop.category_name || 'General Store'}
        </div>
        <div className="shop-status-badge open">
          Open Now
        </div>
      </div>

      <div className="shop-card-body">
        <div className="shop-icon-avatar">
          <Store size={26} />
        </div>
        <h3 className="shop-title">{shop.shop_name}</h3>
        <p className="shop-desc">{shop.description || 'Quality products and fast doorstep delivery in village.'}</p>

        <div className="shop-meta-list">
          <div className="shop-meta-item">
            <MapPin size={15} />
            <span>{shop.village}{shop.mandal ? `, ${shop.mandal}` : ''}</span>
          </div>
          {shop.phone && (
            <div className="shop-meta-item">
              <Phone size={15} />
              <span>{shop.phone}</span>
            </div>
          )}
          {shop.opening_time && shop.closing_time && (
            <div className="shop-meta-item">
              <Clock size={15} />
              <span>{shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shop-card-footer">
        {shop.total_products !== undefined && (
          <span className="products-count">
            <Package size={14} /> {shop.total_products} items
          </span>
        )}
        <Link to={`/shops/${shop.id}`} className="visit-shop-btn">
          <span>Visit Shop</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default ShopCard;

