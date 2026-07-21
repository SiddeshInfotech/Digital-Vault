import React, { useState } from 'react';
import { User, Mail, Phone, Laptop, Key, Calendar, LogOut, X, CheckCircle2, Edit3, Save, Check } from 'lucide-react';

export default function UserProfileModal({ user, onClose, onLogout, onUpdateUser }) {
  if (!user) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || 'Komal Patil');
  const [email, setEmail] = useState(user.email || 'komal.patil@gmail.com');
  const [phone, setPhone] = useState(user.phone || '9876543210');
  const [device, setDevice] = useState(user.device || "Komal's Laptop (Windows x64)");
  
  const [phoneError, setPhoneError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
      if (val.length === 10) setPhoneError('');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }

    const updatedUser = {
      ...user,
      fullName,
      email,
      phone,
      device
    };

    localStorage.setItem('vault_active_user', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('vault_users') || '[]');
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === user.email.toLowerCase()) {
        return { ...u, fullName, email, phone, device };
      }
      return u;
    });
    localStorage.setItem('vault_users', JSON.stringify(updatedUsers));

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setIsEditing(false);
    setSaveSuccessMsg('Profile information updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-modal-title">
            <User size={20} className="header-icon" />
            <span>User Profile Information</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="profile-save-success-banner animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="profile-hero">
          <div className="profile-avatar-large">
            {fullName ? fullName.charAt(0).toUpperCase() : 'K'}
          </div>
          <div className="profile-hero-info">
            <h3 className="profile-hero-name">{fullName}</h3>
            <span className="profile-hero-badge">
              <CheckCircle2 size={13} /> Verified Vault Member
            </span>
          </div>

          <button 
            className={`btn-edit-profile-toggle ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Cancel Editing' : 'Edit Profile Information'}
          >
            {isEditing ? <X size={16} /> : <Edit3 size={16} />}
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="profile-details-grid">
            <div className="detail-item">
              <div className="detail-icon"><User size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Full Name</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="profile-edit-input" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                ) : (
                  <span className="detail-value">{fullName}</span>
                )}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon"><Mail size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Email Address</span>
                {isEditing ? (
                  <input 
                    type="email" 
                    className="profile-edit-input" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                ) : (
                  <span className="detail-value">{email}</span>
                )}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon"><Phone size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Mobile Phone</span>
                {isEditing ? (
                  <>
                    <input 
                      type="tel" 
                      className={`profile-edit-input ${phoneError ? 'is-invalid' : ''}`} 
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      required
                    />
                    {phoneError && <span className="input-error-sub">{phoneError}</span>}
                  </>
                ) : (
                  <span className="detail-value">{phone}</span>
                )}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon"><Laptop size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Active Device</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="profile-edit-input" 
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    required
                  />
                ) : (
                  <span className="detail-value">{device}</span>
                )}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon"><Key size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Security Protocol</span>
                <span className="detail-value">AES-256 Zero-Knowledge</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon"><Calendar size={16} /></div>
              <div className="detail-content">
                <span className="detail-label">Session Status</span>
                <span className="detail-value">Active & Synchronized</span>
              </div>
            </div>
          </div>

          <div className="profile-modal-footer">
            {isEditing ? (
              <button type="submit" className="btn-save-profile">
                <Save size={16} /> Save Changes
              </button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Close
                </button>
                <button type="button" onClick={onLogout} className="btn-logout-danger">
                  <LogOut size={16} />
                  Logout Account
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
