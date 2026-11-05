import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, Search, MapPin, Filter, RotateCcw } from 'lucide-react';
import * as api from '../services/api.js';
import ShopCard from '../components/ShopCard.jsx';

const Shops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category_id') || '');
  const [village, setVillage] = useState(searchParams.get('village') || '');

  useEffect(() => {
    api.getShopCategories()
      .then((res) => {
        if (res.success) setCategories(res.data || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchShops();
  }, [searchParams]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchParams.get('search') || '',
        category_id: searchParams.get('category_id') || '',
        village: searchParams.get('village') || '',
      };
      const res = await api.getShops(params);
      if (res.success) {
        setShops(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const nextParams = {};
    if (search) nextParams.search = search;
    if (category) nextParams.category_id = category;
    if (village) nextParams.village = village;
    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setVillage('');
    setSearchParams({});
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Village Shops & Merchants</h1>
          <p className="page-subtitle">
            Discover local grocery stores, dairy farms, pharmacies, and bakeries in your area
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form className="filter-toolbar" onSubmit={handleApplyFilters}>
        <div className="filter-item search-box">
          <Search size={18} className="filter-icon" />
          <input
            type="text"
            placeholder="Search shop name or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-item village-box">
          <MapPin size={18} className="filter-icon" />
          <input
            type="text"
            placeholder="Village / Mandal"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-item select-box">
          <Filter size={18} className="filter-icon" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Shop Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Apply Filters
          </button>
          {(search || category || village) && (
            <button type="button" onClick={handleReset} className="btn btn-outline" title="Reset Filters">
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Category Pills Quick Filter */}
      <div className="quick-category-row">
        <button
          type="button"
          className={`quick-pill ${!category ? 'active' : ''}`}
          onClick={() => {
            setCategory('');
            const nextParams = {};
            if (search) nextParams.search = search;
            if (village) nextParams.village = village;
            setSearchParams(nextParams);
          }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`quick-pill ${category === c.id ? 'active' : ''}`}
            onClick={() => {
              setCategory(c.id);
              const nextParams = { category_id: c.id };
              if (search) nextParams.search = search;
              if (village) nextParams.village = village;
              setSearchParams(nextParams);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-card"></div>
          ))}
        </div>
      ) : shops.length > 0 ? (
        <div className="shops-grid">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Store size={48} className="empty-icon" />
          <h3>No shops match your criteria</h3>
          <p>Try searching with another village name or clearing your filters.</p>
          <button onClick={handleReset} className="btn btn-outline mt-3">
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Shops;

