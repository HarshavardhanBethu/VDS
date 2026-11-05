import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  UserPlus,
  AlertCircle,
  Store,
  Truck,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const roles = [
  { id: 'customer', label: 'Customer', desc: 'Browse & order village products', icon: ShoppingBag },
  { id: 'shopkeeper', label: 'Shopkeeper', desc: 'Manage shop, products & orders', icon: Store },
  { id: 'delivery_partner', label: 'Delivery Partner', desc: 'Deliver orders in your village', icon: Truck },
  { id: 'admin', label: 'Administrator', desc: 'Platform operations & control', icon: Shield },
];

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: searchParams.get('role') || 'customer',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && roles.some((r) => r.id === roleParam)) {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (roleId) => {
    setFormData({ ...formData, role: roleId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await signup(formData);
      const role = res.user?.role;

      if (role === 'shopkeeper') navigate('/shopkeeper');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'delivery_partner') navigate('/delivery');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <div className="auth-icon-box">
            <UserPlus size={28} />
          </div>
          <h2 className="auth-title">Create VDS Account</h2>
          <p className="auth-subtitle">Join the hyperlocal village delivery platform</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selector Grid */}
          <div className="form-group">
            <label className="form-label">I want to join as a:</label>
            <div className="role-selection-grid">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = formData.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(r.id)}
                  >
                    <Icon size={20} className="role-card-icon" />
                    <div className="role-card-text">
                      <span className="role-card-title">{r.label}</span>
                      <span className="role-card-desc">{r.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={18} className="field-icon" />
              <input
                type="text"
                name="full_name"
                placeholder="e.g. Ramesh Kumar"
                value={formData.full_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="field-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="field-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer-text">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;

