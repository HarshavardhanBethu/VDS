
const API_BASE_URL = 'https://vds-ekip.onrender.com/api';

/**
 * Generic request helper with automatic Authorization header
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('vdsToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Failed to parse server response',
  }));

  if (!response.ok) {
    throw new Error(
      data.message || 'Request failed with status ' + response.status
    );
  }

  return data;
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export const signup = async (userData) => {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const login = async (credentials) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const getProfile = async () => {
  return request('/auth/me');
};

export const getAllUsers = async (role = '') => {
  return request(`/auth/users${role ? `?role=${role}` : ''}`);
};

export const updateUserRole = async (userId, role) => {
  return request(`/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
};

export const deleteUser = async (userId) => {
  return request(`/auth/users/${userId}`, {
    method: 'DELETE',
  });
};

// ==========================================
// CATEGORY APIs
// ==========================================

export const getShopCategories = async () => {
  return request('/categories/shops');
};

export const createShopCategory = async (categoryData) => {
  return request('/categories/shops', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

export const getProductCategories = async () => {
  return request('/categories/products');
};

export const createProductCategory = async (categoryData) => {
  return request('/categories/products', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

// ==========================================
// SHOPS APIs
// ==========================================

export const getShops = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== ''
    )
  ).toString();

  return request(`/shops${queryString ? `?${queryString}` : ''}`);
};

export const getShopById = async (id) => {
  return request(`/shops/${id}`);
};

export const getMyShops = async () => {
  return request('/shops/owner/me');
};

export const createShop = async (shopData) => {
  return request('/shops', {
    method: 'POST',
    body: JSON.stringify(shopData),
  });
};

export const updateShop = async (id, shopData) => {
  return request(`/shops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(shopData),
  });
};

export const deleteShop = async (id) => {
  return request(`/shops/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// PRODUCTS APIs
// ==========================================

export const getProducts = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== ''
    )
  ).toString();

  return request(`/products${queryString ? `?${queryString}` : ''}`);
};

export const getProductById = async (id) => {
  return request(`/products/${id}`);
};

export const getProductsByShop = async (shopId) => {
  return request(`/products/shop/${shopId}`);
};

export const createProduct = async (productData) => {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const updateProduct = async (id, productData) => {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

export const deleteProduct = async (id) => {
  return request(`/products/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// ADDRESSES APIs
// ==========================================

export const getAddresses = async () => {
  return request('/orders/addresses/my');
};

export const addAddress = async (addressData) => {
  return request('/orders/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
};

// ==========================================
// ORDERS APIs
// ==========================================

export const createOrder = async (orderData) => {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getOrders = async (params = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== ''
    )
  ).toString();

  return request(`/orders${queryString ? `?${queryString}` : ''}`);
};

export const getOrderById = async (id) => {
  return request(`/orders/${id}`);
};

export const getCustomerOrders = async (customerId) => {
  return request(`/orders/customer/${customerId}`);
};

export const updateOrderStatus = async (id, statusData) => {
  return request(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
};
