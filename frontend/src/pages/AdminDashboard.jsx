import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Store,
  Package,
  ShoppingBag,
  IndianRupee,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Tag,
  Search,
  UserCheck,
} from 'lucide-react';
import * as api from '../services/api.js';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'shops' | 'categories' | 'orders'
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [newShopCategoryName, setNewShopCategoryName] = useState('');
  const [newProductCategoryName, setNewProductCategoryName] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, shopsRes, prodsRes, ordersRes, shopCatRes, prodCatRes] = await Promise.all([
        api.getAllUsers().catch(() => ({ data: [] })),
        api.getShops().catch(() => ({ data: [] })),
        api.getProducts().catch(() => ({ data: [] })),
        api.getOrders().catch(() => ({ data: [] })),
        api.getShopCategories().catch(() => ({ data: [] })),
        api.getProductCategories().catch(() => ({ data: [] })),
      ]);

      if (usersRes.success) setUsers(usersRes.data || []);
      if (shopsRes.success) setShops(shopsRes.data || []);
      if (prodsRes.success) setProducts(prodsRes.data || []);
      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (shopCatRes.success) setShopCategories(shopCatRes.data || []);
      if (prodCatRes.success) setProductCategories(prodCatRes.data || []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        showNotification('success', `User role changed to ${newRole}`);
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove user "${userName}"?`)) return;
    try {
      const res = await api.deleteUser(userId);
      if (res.success) {
        showNotification('success', `User "${userName}" removed`);
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete user');
    }
  };

  const handleDeleteShop = async (shopId, shopName) => {
    if (!window.confirm(`Are you sure you want to delete shop "${shopName}"?`)) return;
    try {
      const res = await api.deleteShop(shopId);
      if (res.success) {
        showNotification('success', `Shop "${shopName}" deleted.`);
        setShops(shops.filter((s) => s.id !== shopId));
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete shop');
    }
  };

  const handleAddShopCategory = async (e) => {
    e.preventDefault();
    if (!newShopCategoryName.trim()) return;
    try {
      const res = await api.createShopCategory({ name: newShopCategoryName.trim() });
      if (res.success) {
        showNotification('success', 'Shop category created!');
        setShopCategories([...shopCategories, res.data]);
        setNewShopCategoryName('');
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to create shop category');
    }
  };

  const handleAddProductCategory = async (e) => {
    e.preventDefault();
    if (!newProductCategoryName.trim()) return;
    try {
      const res = await api.createProductCategory({ name: newProductCategoryName.trim() });
      if (res.success) {
        showNotification('success', 'Product category created!');
        setProductCategories([...productCategories, res.data]);
        setNewProductCategoryName('');
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to create product category');
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    const matchesSearch =
      !userSearch ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Platform Administration</h1>
          <p className="page-subtitle">Manage real users, village shops, inventory categories, and track orders</p>
        </div>

        {/* Tab switcher */}
        <div className="dashboard-tabs">
          <button
            type="button"
            className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Shield size={18} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users ({users.length})</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'shops' ? 'active' : ''}`}
            onClick={() => setActiveTab('shops')}
          >
            <Store size={18} />
            <span>Shops ({shops.length})</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={18} />
            <span>Categories</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            <span>All Orders ({orders.length})</span>
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`alert-box ${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="metrics-grid-5">
            <div className="metric-box green">
              <div className="metric-icon-box"><IndianRupee size={24} /></div>
              <div className="metric-details">
                <span className="metric-title">Gross Volume</span>
                <h3 className="metric-num">₹{totalRevenue.toFixed(2)}</h3>
              </div>
            </div>

            <div className="metric-box blue">
              <div className="metric-icon-box"><ShoppingBag size={24} /></div>
              <div className="metric-details">
                <span className="metric-title">Total Orders</span>
                <h3 className="metric-num">{orders.length}</h3>
              </div>
            </div>

            <div className="metric-box amber">
              <div className="metric-icon-box"><Store size={24} /></div>
              <div className="metric-details">
                <span className="metric-title">Village Shops</span>
                <h3 className="metric-num">{shops.length}</h3>
              </div>
            </div>

            <div className="metric-box purple">
              <div className="metric-icon-box"><Package size={24} /></div>
              <div className="metric-details">
                <span className="metric-title">Products Listed</span>
                <h3 className="metric-num">{products.length}</h3>
              </div>
            </div>

            <div className="metric-box teal">
              <div className="metric-icon-box"><Users size={24} /></div>
              <div className="metric-details">
                <span className="metric-title">Registered Users</span>
                <h3 className="metric-num">{users.length}</h3>
              </div>
            </div>
          </div>

          {/* Quick lists */}
          <div className="dashboard-2col-grid mt-4">
            <div className="dashboard-content-card">
              <div className="card-header-bar">
                <h3>Recent Platform Orders</h3>
              </div>
              <div className="mini-orders-list">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="mini-order-row">
                    <div>
                      <strong>#{o.order_number}</strong>
                      <span className="sub-text"> from {o.shop_name}</span>
                    </div>
                    <div className="flex-center gap-2">
                      <span className="bold-price">₹{parseFloat(o.total_amount).toFixed(2)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-content-card">
              <div className="card-header-bar">
                <h3>Registered Village Shops</h3>
              </div>
              <div className="mini-shops-list">
                {shops.slice(0, 5).map((s) => (
                  <div key={s.id} className="mini-shop-row">
                    <div>
                      <strong>{s.shop_name}</strong>
                      <span className="sub-text"> ({s.village})</span>
                    </div>
                    <span className="badge-pill green">{s.category_name || 'General'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar flex-between">
            <div>
              <h3>All Registered Users ({users.length})</h3>
              <p className="sub-text">Manage user permissions and roles</p>
            </div>
          </div>

          {/* Search & Role Filter toolbar */}
          <div className="filter-toolbar mb-4">
            <div className="filter-item search-box flex-grow">
              <Search size={18} className="filter-icon" />
              <input
                type="text"
                placeholder="Search user by name, phone, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-item select-box">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="shopkeeper">Shopkeepers</option>
                <option value="delivery_partner">Delivery Partners</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="vds-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                  <th>Joined Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.phone}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge-tag ${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="status-dropdown"
                      >
                        <option value="customer">Customer</option>
                        <option value="shopkeeper">Shopkeeper</option>
                        <option value="delivery_partner">Delivery Partner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        className="btn-icon delete"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SHOPS */}
      {activeTab === 'shops' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar">
            <h3>Registered Village Shops ({shops.length})</h3>
          </div>
          <div className="table-responsive">
            <table className="vds-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Village</th>
                  <th>Phone</th>
                  <th>Hours</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.shop_name}</strong></td>
                    <td><span className="badge-pill green">{s.category_name || 'General'}</span></td>
                    <td>{s.owner_name || '-'}</td>
                    <td><MapPin size={13} /> {s.village}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.opening_time ? `${s.opening_time.slice(0, 5)} - ${s.closing_time.slice(0, 5)}` : '-'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteShop(s.id, s.shop_name)}
                        className="btn-icon delete"
                        title="Delete Shop"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="dashboard-2col-grid">
          {/* Shop Categories */}
          <div className="dashboard-content-card">
            <div className="card-header-bar">
              <h3>Shop Categories ({shopCategories.length})</h3>
            </div>
            <form onSubmit={handleAddShopCategory} className="add-category-row">
              <input
                type="text"
                value={newShopCategoryName}
                onChange={(e) => setNewShopCategoryName(e.target.value)}
                placeholder="New Shop Category (e.g. Electrical & Hardware)"
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Add
              </button>
            </form>
            <div className="category-tag-cloud">
              {shopCategories.map((sc) => (
                <div key={sc.id} className="category-chip-item">
                  <span>{sc.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div className="dashboard-content-card">
            <div className="card-header-bar">
              <h3>Product Categories ({productCategories.length})</h3>
            </div>
            <form onSubmit={handleAddProductCategory} className="add-category-row">
              <input
                type="text"
                value={newProductCategoryName}
                onChange={(e) => setNewProductCategoryName(e.target.value)}
                placeholder="New Product Category (e.g. Spices & Masalas)"
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Add
              </button>
            </form>
            <div className="category-tag-cloud">
              {productCategories.map((pc) => (
                <div key={pc.id} className="category-chip-item">
                  <span>{pc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALL ORDERS */}
      {activeTab === 'orders' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar">
            <h3>All Platform Orders ({orders.length})</h3>
          </div>
          <div className="table-responsive">
            <table className="vds-table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Shop</th>
                  <th>Customer</th>
                  <th>Village Destination</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.order_number}</strong></td>
                    <td>{o.shop_name}</td>
                    <td>{o.customer_name} ({o.customer_phone})</td>
                    <td>{o.delivery_village}</td>
                    <td><strong>₹{parseFloat(o.total_amount).toFixed(2)}</strong></td>
                    <td>{o.payment_method}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
