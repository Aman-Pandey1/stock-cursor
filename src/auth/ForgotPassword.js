import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: email entry, 2: password reset
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/verify-email', { email });
      setStep(2); // Move to password reset step if email is valid
    } catch (err) {
      alert('Email not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, newPassword });
      alert('Password updated successfully!');
      navigate('/login');
    } catch (err) {
      alert('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="auth-image">
        <div className="welcome-text">
          <h1>Welcome to</h1>
          <h2>Shree Balaji Traders</h2>
          <p>Reset your password securely</p>
        </div>
      </div>
      <div className="auth-box">
        <h2 className="auth-heading">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </h2>
        
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Verify Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <div className="input-group password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
                autoComplete="new-password"
              />
              <span 
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div className="auth-links">
          <span 
            className="login-link" 
            onClick={() => navigate('/login')}
          >
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;