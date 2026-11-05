import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Layers,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import * as api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';

const ShopkeeperDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'shop'
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Product Form Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    product_name: '',
    category_id: '',
    description: '',
    brand: '',
    unit: '1 kg',
    price: '',
    mrp: '',
    stock_quantity: 20,
    image_url: '',
    is_available: true,
  });

  // Shop Form state
  const [shopForm, setShopForm] = useState({
    shop_name: '',
    category_id: '',
    description: '',
    phone: user?.phone || '',
    email: user?.email || '',
    address_line: '',
    village: 'Ananthagiri',
    mandal: 'Vikarabad',
    district: 'Vikarabad',
    state: 'Telangana',
    pincode: '501101',
    opening_time: '07:00:00',
    closing_time: '21:00:00',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [shopCatRes, prodCatRes, myShopsRes, ordersRes] = await Promise.all([
        api.getShopCategories().catch(() => ({ data: [] })),
        api.getProductCategories().catch(() => ({ data: [] })),
        api.getMyShops().catch(() => ({ data: [] })),
        api.getOrders().catch(() => ({ data: [] })),
      ]);

      if (shopCatRes.success) setShopCategories(shopCatRes.data || []);
      if (prodCatRes.success) setProductCategories(prodCatRes.data || []);

      if (myShopsRes.success && myShopsRes.data.length > 0) {
        setShops(myShopsRes.data);
        const firstShop = myShopsRes.data[0];
        setSelectedShop(firstShop);
        setShopForm(firstShop);
        loadShopProducts(firstShop.id);
      } else {
        // If real shopkeeper has no registered shop yet, open the shop setup form
        setActiveTab('shop');
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data || []);
      }
    } catch (err) {
      console.error('Error loading shopkeeper dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadShopProducts = async (shopId) => {
    try {
      const res = await api.getProductsByShop(shopId);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const showNotification = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  // Status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        showNotification('success', `Order status updated to ${newStatus}`);
        const refreshed = await api.getOrders();
        if (refreshed.success) setOrders(refreshed.data || []);
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update order status');
    }
  };

  // Product save (create or update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedShop) {
      showNotification('error', 'Please create and register your shop first.');
      return;
    }

    try {
      const payload = {
        ...productForm,
        shop_id: selectedShop.id,
      };

      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        showNotification('success', 'Product updated successfully!');
      } else {
        await api.createProduct(payload);
        showNotification('success', 'New product added to catalog!');
      }

      setIsProductModalOpen(false);
      setEditingProductId(null);
      resetProductForm();
      loadShopProducts(selectedShop.id);
    } catch (err) {
      showNotification('error', err.message || 'Failed to save product');
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      product_name: prod.product_name || '',
      category_id: prod.category_id || '',
      description: prod.description || '',
      brand: prod.brand || '',
      unit: prod.unit || '1 kg',
      price: prod.price || '',
      mrp: prod.mrp || '',
      stock_quantity: prod.stock_quantity || 0,
      image_url: prod.image_url || '',
      is_available: prod.is_available !== false,
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      showNotification('success', 'Product deleted.');
      loadShopProducts(selectedShop.id);
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete product');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      product_name: '',
      category_id: '',
      description: '',
      brand: '',
      unit: '1 kg',
      price: '',
      mrp: '',
      stock_quantity: 20,
      image_url: '',
      is_available: true,
    });
  };

  // Shop Save
  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      if (selectedShop?.id) {
        const res = await api.updateShop(selectedShop.id, shopForm);
        if (res.success) {
          showNotification('success', 'Shop details updated successfully!');
          setSelectedShop(res.data);
        }
      } else {
        const res = await api.createShop(shopForm);
        if (res.success) {
          showNotification('success', '🎉 Shop registered successfully! You can now add products.');
          setShops([res.data, ...shops]);
          setSelectedShop(res.data);
          setActiveTab('products');
        }
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to save shop details');
    }
  };

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Shopkeeper Hub</h1>
          <p className="page-subtitle">
            Welcome, <strong>{user?.full_name}</strong> – Manage your village storefront, inventory, and customer orders.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="dashboard-tabs">
          <button
            type="button"
            className={`dash-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Layers size={18} />
            <span>Products ({products.length})</span>
          </button>
          <button
            type="button"
            className={`dash-tab ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            <Store size={18} />
            <span>{selectedShop ? 'Shop Profile' : 'Register Shop'}</span>
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`alert-box ${msg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Real Shopkeeper Onboarding Banner if no shop registered */}
      {!selectedShop && !loading && (
        <div className="alert-box alert-success mb-4 flex-between">
          <div className="flex-center gap-3">
            <Sparkles size={24} />
            <div>
              <strong>Complete your Shop Registration</strong>
              <p>Fill out the shop details below to launch your shop in the village directory.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className="btn btn-primary btn-sm"
          >
            Setup Shop Now
          </button>
        </div>
      )}

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar">
            <h3>Incoming Village Orders</h3>
            <span className="count-tag">{orders.length} total</span>
          </div>

          {orders.length > 0 ? (
            <div className="table-responsive">
              <table className="vds-table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Customer</th>
                    <th>Delivery Address</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>#{o.order_number}</strong>
                        <div className="sub-time">
                          {new Date(o.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <strong>{o.customer_name}</strong>
                          <span>{o.customer_phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="address-cell">
                          <span>{o.address_line}</span>
                          <span className="village-badge">{o.delivery_village}</span>
                        </div>
                      </td>
                      <td>
                        <strong>₹{parseFloat(o.total_amount).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge-pill ${o.payment_method === 'Cash on Delivery' ? 'amber' : 'blue'}`}>
                          {o.payment_method}
                        </span>
                      </td>
                      <td>
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td>
                        <div className="status-action-select">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="status-dropdown"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing & Packing</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>No incoming orders yet</h3>
              <p>When customers in your village place an order, it will appear here instantly with live notifications.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar flex-between">
            <div>
              <h3>Product Catalog {selectedShop ? `(${selectedShop.shop_name})` : ''}</h3>
              <p className="sub-text">Add products, update selling prices, and maintain inventory</p>
            </div>
            {selectedShop && (
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  resetProductForm();
                  setIsProductModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={18} />
                <span>Add Product</span>
              </button>
            )}
          </div>

          {!selectedShop ? (
            <div className="empty-state">
              <Store size={48} className="empty-icon" />
              <h3>Shop Not Registered Yet</h3>
              <p>Please register your village shop profile first before adding products.</p>
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className="btn btn-primary mt-3"
              >
                Register Shop
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className="table-responsive">
              <table className="vds-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Selling Price</th>
                    <th>MRP</th>
                    <th>Stock</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-table-item">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                            alt={p.product_name}
                            className="table-item-thumb"
                          />
                          <div>
                            <strong>{p.product_name}</strong>
                            {p.brand && <span className="brand-sub">{p.brand}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{p.category_name || '-'}</td>
                      <td>{p.unit || '-'}</td>
                      <td><strong>₹{parseFloat(p.price).toFixed(2)}</strong></td>
                      <td>{p.mrp ? `₹${parseFloat(p.mrp).toFixed(2)}` : '-'}</td>
                      <td>
                        <span className={`stock-badge ${p.stock_quantity > 0 ? 'in-stock' : 'out-stock'}`}>
                          {p.stock_quantity} in stock
                        </span>
                      </td>
                      <td>
                        <span className={`status-dot ${p.is_available ? 'active' : 'inactive'}`}>
                          {p.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(p)}
                            className="btn-icon edit"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="btn-icon delete"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>Your catalog is empty</h3>
              <p>Start adding groceries, farm produce, or goods to sell to your village community.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null);
                  resetProductForm();
                  setIsProductModalOpen(true);
                }}
                className="btn btn-primary mt-3"
              >
                <Plus size={16} /> Add First Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHOP PROFILE */}
      {activeTab === 'shop' && (
        <div className="dashboard-content-card">
          <div className="card-header-bar">
            <h3>{selectedShop ? 'Village Shop Profile' : 'Register Your Village Shop'}</h3>
            <p className="sub-text">Enter accurate shop contact details and business hours</p>
          </div>

          <form onSubmit={handleSaveShop} className="shop-profile-form">
            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input
                  type="text"
                  value={shopForm.shop_name}
                  onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                  placeholder="e.g. Balaji Kirana & General Store"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shop Category</label>
                <select
                  value={shopForm.category_id || ''}
                  onChange={(e) => setShopForm({ ...shopForm, category_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select Category</option>
                  {shopCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Shop Description</label>
              <textarea
                rows="2"
                value={shopForm.description || ''}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                placeholder="Describe what your shop sells (e.g., daily groceries, dairy, vegetables, snacks)..."
                className="form-input"
              ></textarea>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Shop Contact Phone *</label>
                <input
                  type="tel"
                  value={shopForm.phone || ''}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shop Email (Optional)</label>
                <input
                  type="email"
                  value={shopForm.email || ''}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                  placeholder="shop@example.com"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Shop Address / Landmark</label>
              <input
                type="text"
                value={shopForm.address_line || ''}
                onChange={(e) => setShopForm({ ...shopForm, address_line: e.target.value })}
                placeholder="Near Gram Panchayat Office / Main Bazaar Road"
                className="form-input"
              />
            </div>

            <div className="form-grid-3col">
              <div className="form-group">
                <label className="form-label">Village / Gram Panchayat *</label>
                <input
                  type="text"
                  value={shopForm.village || ''}
                  onChange={(e) => setShopForm({ ...shopForm, village: e.target.value })}
                  placeholder="e.g. Ananthagiri"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mandal / Taluk</label>
                <input
                  type="text"
                  value={shopForm.mandal || ''}
                  onChange={(e) => setShopForm({ ...shopForm, mandal: e.target.value })}
                  placeholder="e.g. Vikarabad"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  value={shopForm.pincode || ''}
                  onChange={(e) => setShopForm({ ...shopForm, pincode: e.target.value })}
                  placeholder="501101"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <input
                  type="time"
                  value={shopForm.opening_time ? shopForm.opening_time.slice(0, 5) : '07:00'}
                  onChange={(e) => setShopForm({ ...shopForm, opening_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <input
                  type="time"
                  value={shopForm.closing_time ? shopForm.closing_time.slice(0, 5) : '21:00'}
                  onChange={(e) => setShopForm({ ...shopForm, closing_time: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={18} />
              <span>{selectedShop ? 'Save Shop Profile' : 'Complete Shop Registration'}</span>
            </button>
          </form>
        </div>
      )}

      {/* PRODUCT CREATE / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content product-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="btn-icon"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form-body">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  placeholder="e.g. Sona Masoori Rice"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={productForm.category_id || ''}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Category</option>
                    {productCategories.map((pc) => (
                      <option key={pc.id} value={pc.id}>
                        {pc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand / Farmer</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Farm Direct / Local"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-3col">
                <div className="form-group">
                  <label className="form-label">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="120.00"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    placeholder="140.00"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="1 kg / 500 g / 1 Litre"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available for Sale</label>
                  <select
                    value={productForm.is_available ? 'true' : 'false'}
                    onChange={(e) => setProductForm({ ...productForm, is_available: e.target.value === 'true' })}
                    className="form-input"
                  >
                    <option value="true">Yes (In Stock)</option>
                    <option value="false">No (Unavailable)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (Optional)</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProductId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperDashboard;
