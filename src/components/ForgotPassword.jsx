import React, { useState } from 'react';
import { Mail, Shield, Send, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword({ onViewChange }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validateForm = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSent(true);
      }, 1200);
    }
  };

  return (
    <div className="split-card-container">
      <div className="split-card-left">
        <div className="brand-header">
          <Shield className="brand-icon" />
          <span className="brand-name">Digital Document Vault</span>
        </div>

        <div className="split-left-visuals">
          <div className="visual-graphic-wrapper">
            <div className="visual-bg-circle"></div>
            <svg 
              className="visual-lock-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <h3 className="visual-title">Forgot Password?</h3>
          <p className="visual-desc">
            Don't worry! It happens. Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="slider-dots">
          <span className="slider-dot"></span>
          <span className="slider-dot active"></span>
          <span className="slider-dot"></span>
        </div>
      </div>

      <div className="split-card-right">
        {isSent ? (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', marginBottom: '16px' }}>
              <CheckCircle size={64} style={{ margin: '0 auto' }} />
            </div>
            <h2 className="split-right-title">Reset Link Sent!</h2>
            <p className="split-right-desc">
              We have sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <button
              onClick={() => onViewChange('login')}
              className="btn-primary"
            >
              <ArrowLeft size={18} />
              Back to Login
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="split-right-title">Forgot Password</h2>
            <p className="split-right-desc">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon-left">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`form-input ${emailError ? 'is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                  />
                </div>
                {emailError && <div className="error-message">{emailError}</div>}
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting} 
                style={{ marginTop: '24px' }}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                {!isSubmitting && <Send size={16} />}
              </button>
            </form>

            <button
              onClick={() => onViewChange('login')}
              className="back-to-login-btn"
            >
              <ArrowLeft size={16} className="back-icon" />
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
