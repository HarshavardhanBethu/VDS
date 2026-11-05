import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ShoppingBag, RotateCcw } from 'lucide-react';
import * as api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category_id') || '');

  useEffect(() => {
    api.getProductCategories()
      .then((res) => {
        if (res.success) setCategories(res.data || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchParams.get('search') || '',
        category_id: searchParams.get('category_id') || '',
        is_available: 'true',
      };
      const res = await api.getProducts(params);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const nextParams = {};
    if (search) nextParams.search = search;
    if (category) nextParams.category_id = category;
    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setSearchParams({});
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Village Marketplace Catalog</h1>
          <p className="page-subtitle">
            Browse fresh groceries, farm dairy, household staples, and medicines across all local shops
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <form className="filter-toolbar" onSubmit={handleApply}>
        <div className="filter-item search-box flex-grow">
          <Search size={18} className="filter-icon" />
          <input
            type="text"
            placeholder="Search products by name, brand, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            <option value="">All Product Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Filter Products
          </button>
          {(search || category) && (
            <button type="button" onClick={handleReset} className="btn btn-outline" title="Reset">
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Category Chips Row */}
      <div className="quick-category-row">
        <button
          type="button"
          className={`quick-pill ${!category ? 'active' : ''}`}
          onClick={() => {
            setCategory('');
            const nextParams = {};
            if (search) nextParams.search = search;
            setSearchParams(nextParams);
          }}
        >
          All Items
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
              setSearchParams(nextParams);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="skeleton-card"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-icon" />
          <h3>No products match your search</h3>
          <p>Try searching for a different keyword or category.</p>
          <button onClick={handleReset} className="btn btn-outline mt-3">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;

