import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-image">
        <div className="welcome-text">
          <h1>Welcome to</h1>
          <h2>Shree Balaji Traders</h2>
          <p>Your trusted partner for quality products</p>
        </div>
      </div>
      <div className="login-box">
        <h2 className="login-heading">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              className="login-input"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="login-input"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span 
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="login-links">
          <span className="forgot-password" onClick={handleForgotPassword}>
            Forgot password?
          </span>
           <span className="signup-link" onClick={handleSignup}>
            Create an account
          </span> 
        </div>
      </div>
    </div>
  );
}

export default Login;