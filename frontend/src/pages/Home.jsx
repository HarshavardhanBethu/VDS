import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Search,
  Truck,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Users,
  CheckCircle,
} from 'lucide-react';
import * as api from '../services/api.js';
import ShopCard from '../components/ShopCard.jsx';
import ProductCard from '../components/ProductCard.jsx';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [catRes, shopRes, prodRes] = await Promise.all([
          api.getShopCategories().catch(() => ({ data: [] })),
          api.getShops().catch(() => ({ data: [] })),
          api.getProducts().catch(() => ({ data: [] })),
        ]);

        if (catRes.success) setCategories(catRes.data || []);
        if (shopRes.success) setFeaturedShops((shopRes.data || []).slice(0, 6));
        if (prodRes.success) setFeaturedProducts((prodRes.data || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || villageFilter) {
      navigate(`/shops?search=${encodeURIComponent(searchQuery)}&village=${encodeURIComponent(villageFilter)}`);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Hyperlocal Village Delivery Platform</span>
          </div>

          <h1 className="hero-title">
            Everything Your Village Needs, Delivered to Your Doorstep
          </h1>

          <p className="hero-subtitle">
            Order fresh groceries, farm dairy, medicines, and daily essentials from trusted local shops in your village. Fast, transparent, and built for rural communities.
          </p>

          {/* Search & Village Filter Bar */}
          <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
            <div className="search-input-group">
              <MapPin className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Village / Mandal (e.g. Ananthagiri)"
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="village-input"
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-input-group flex-grow">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search shops or products (rice, dal, milk, veggies)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="main-search-input"
              />
            </div>

            <button type="submit" className="btn btn-hero-search">
              <Search size={18} />
              <span>Find in Village</span>
            </button>
          </form>

          {/* Quick Village Stats */}
          <div className="hero-stats-row">
            <div className="hero-stat">
              <strong>15+</strong>
              <span>Local Village Shops</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <strong>100%</strong>
              <span>Fresh Farm Direct</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <strong>&lt; 45 Mins</strong>
              <span>Village Doorstep Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Explorer */}
      <section className="section categories-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Discover daily essentials and specialized stores</p>
          </div>
          <Link to="/shops" className="view-all-link">
            <span>View All Shops</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="categories-grid">
          {categories.slice(0, 8).map((cat) => (
            <Link
              to={`/shops?category_id=${cat.id}`}
              key={cat.id}
              className="category-pill-card"
            >
              <div className="category-icon-box">
                <Store size={22} />
              </div>
              <span className="category-pill-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Village Shops */}
      <section className="section bg-tint">
        <div className="section-header">
          <div>
            <h2 className="section-title">Popular Village Shops</h2>
            <p className="section-subtitle">Trusted neighborhood stores serving your panchayat</p>
          </div>
          <Link to="/shops" className="view-all-link">
            <span>Explore All Shops</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-card"></div>
            ))}
          </div>
        ) : featuredShops.length > 0 ? (
          <div className="shops-grid">
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Store size={48} className="empty-icon" />
            <h3>No shops found</h3>
            <p>Shops in your village will appear here soon.</p>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Daily Essentials & Fresh Picks</h2>
            <p className="section-subtitle">Handpicked items ready for immediate village delivery</p>
          </div>
          <Link to="/products" className="view-all-link">
            <span>Browse All Items</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-card"></div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <h3>No products available</h3>
            <p>Check back later for fresh stock.</p>
          </div>
        )}
      </section>

      {/* Key Feature Highlights */}
      <section className="section features-highlight-section bg-gradient-tint">
        <div className="features-inner">
          <div className="feature-header-center">
            <h2 className="section-title">Why Villagers Choose VDS</h2>
            <p className="section-subtitle">Hyperlocal technology crafted specifically for rural convenience</p>
          </div>

          <div className="features-cards-grid">
            <div className="feature-box">
              <div className="feature-icon-wrapper green">
                <Store size={28} />
              </div>
              <h3 className="feature-title">Local Shops First</h3>
              <p className="feature-desc">
                Support your own village shopkeepers and local merchants without middlemen eating profits.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper amber">
                <Truck size={28} />
              </div>
              <h3 className="feature-title">Fast Village Delivery</h3>
              <p className="feature-desc">
                Local delivery partners deliver items straight to your home or farm within minutes.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper blue">
                <ShieldCheck size={28} />
              </div>
              <h3 className="feature-title">Cash or Online Payment</h3>
              <p className="feature-desc">
                Pay with Cash on Delivery (COD) once items reach your hands, or pay securely online.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper purple">
                <Users size={28} />
              </div>
              <h3 className="feature-title">Village Focused</h3>
              <p className="feature-desc">
                Designed for simple rural landmarks, village mandals, and multilingual friendly simplicity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

