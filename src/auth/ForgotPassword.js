import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email entry, 2: password reset
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/verify-email', { email });
      setStep(2); // Move to password reset step if email is valid
    } catch (err) {
      alert('Email not found. Please try again.');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/reset-password', { email, newPassword });
      alert('Password updated successfully!');
      navigate('/login');
    } catch (err) {
      alert('Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Forgot Password</h2>
        
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Verify Email</button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
            />
            <button type="submit">Reset Password</button>
          </form>
        )}
        
        <p className="link-text" onClick={() => navigate('/login')}>
          Back to Login
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;