import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import logoImage from '../assets/vault_logo.jpg';
import { authAPI } from '../api';

export default function Register({ onViewChange, onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone) {
      newErrors.phone = 'Mobile Phone is required';
    } else if (phone.length !== 10) {
      newErrors.phone = 'Mobile Phone must be exactly 10 digits';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const completeRegistration = (registeredUser) => {
    // Save user to users database/storage list WITHOUT logging them in automatically!
    const existingUsers = JSON.parse(localStorage.getItem('vault_users') || '[]');
    const updatedUsers = [...existingUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase()), registeredUser];
    
    localStorage.setItem('vault_users', JSON.stringify(updatedUsers));
    localStorage.setItem('vault_just_registered_email', email.toLowerCase());

    // Do NOT set vault_active_user here so user is NOT logged in automatically!
    localStorage.removeItem('vault_active_user');

    setSuccessMessage('Registration successful! Redirecting to login window...');
    
    setTimeout(() => {
      onViewChange('login');
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      const newUser = {
        fullName,
        email: email.toLowerCase(),
        phone,
        password,
        isNewUser: true,
        loginCount: 0
      };

      try {
        const res = await authAPI.register({ fullName, email, phone, password });
        setIsSubmitting(false);
        if (res && res.email) {
          completeRegistration(res);
          return;
        }
      } catch (err) {
        console.warn("Backend register attempt:", err.message);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        completeRegistration(newUser);
      }, 400);
    }
  };

  return (
    <div className="auth-content">
      <div className="logo-container">
        <img src={logoImage} alt="Vault Logo" className="logo-image" />
        <h1 className="app-title">Digital <span className="blue-text">Document</span> Vault</h1>
        <p className="app-subtitle">Securely Store Your Documents</p>
      </div>

      <h2 className="screen-title">Create Account</h2>
      <p className="screen-subtitle">Sign up to get started with your secure vault</p>

      {successMessage && (
        <div style={{
          backgroundColor: '#d1fae5',
          color: '#065f46',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group form-group-compact">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <span className="input-icon-left"><User size={15} /></span>
            <input
              type="text"
              placeholder="Enter your full name"
              className={`form-input form-input-compact ${errors.fullName ? 'is-invalid' : ''}`}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
            />
          </div>
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
        </div>

        <div className="form-group form-group-compact">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon-left"><Mail size={15} /></span>
            <input
              type="email"
              placeholder="Enter your email"
              className={`form-input form-input-compact ${errors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
            />
          </div>
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group form-group-compact">
          <label className="form-label">Mobile Phone (10 Digits)</label>
          <div className="input-wrapper">
            <span className="input-icon-left"><Phone size={15} /></span>
            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              className={`form-input form-input-compact ${errors.phone ? 'is-invalid' : ''}`}
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
            />
          </div>
          {errors.phone && <div className="error-message">{errors.phone}</div>}
        </div>

        <div className="form-group form-group-compact">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <span className="input-icon-left"><Lock size={15} /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className={`form-input form-input-compact has-right-icon ${errors.password ? 'is-invalid' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <div className="form-group form-group-compact">
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <span className="input-icon-left"><Lock size={15} /></span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className={`form-input form-input-compact has-right-icon ${errors.confirmPassword ? 'is-invalid' : ''}`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '12px' }}>
          {isSubmitting ? 'Creating Account...' : 'Register'}
          {!isSubmitting && <UserPlus size={16} />}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: '12px' }}>
        Already have an account? 
        <a 
          href="#" 
          className="auth-footer-link"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('login');
          }}
        >
          Login
        </a>
      </div>
    </div>
  );
}
