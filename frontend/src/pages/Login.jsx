import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, LogIn, AlertCircle, Store, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Please enter your phone number and password');
      return;
    }

    try {
      const res = await login(phone, password);
      const role = res.user?.role;

      if (redirectPath && redirectPath !== '/' && redirectPath !== '/login') {
        navigate(redirectPath);
      } else {
        // Direct to appropriate role dashboard or home
        if (role === 'shopkeeper') navigate('/shopkeeper');
        else if (role === 'admin') navigate('/admin');
        else if (role === 'delivery_partner') navigate('/delivery');
        else navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your phone number and password.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-box">
            <LogIn size={28} />
          </div>
          <h2 className="auth-title">Sign In to VDS</h2>
          <p className="auth-subtitle">Access your Customer, Shopkeeper, Delivery, or Admin account</p>
        </div>

        {error && (
          <div className="alert-box alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Phone Number or Email Address</label>
            <div className="input-icon-wrapper">
              <Phone size={18} className="field-icon" />
              <input
                type="text"
                placeholder="Enter 10-digit mobile number or email"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-text">
          <span>New to Village Delivery System? </span>
          <Link to="/signup" className="auth-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
