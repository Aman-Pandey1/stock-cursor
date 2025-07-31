import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
   localStorage.setItem('token', res.data.token);
localStorage.setItem('isLoggedIn', 'true'); // ADD THIS LINE
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

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-heading">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            className="login-input"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="login-input"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="forgot-password" onClick={handleForgotPassword}>
          Forgot password?
        </div>
      </div>
    </div>
  );
}

export default Login;
