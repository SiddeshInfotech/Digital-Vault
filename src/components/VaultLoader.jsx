import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';

export default function VaultLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('vault_active_user') || '{}');
    setActiveUser(user);

    const duration = 3000;
    const intervalTime = 30;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 100);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isNewUser = activeUser?.isNewUser === true;
  const welcomeMessage = isNewUser
    ? `Welcome, ${activeUser?.fullName || 'Komal Patil'}!`
    : `Welcome back, ${activeUser?.fullName || 'Komal Patil'}!`;

  return (
    <div className="mobile-frame-container animate-scale-up" style={{ textAlign: 'center' }}>
      <div className="auth-loader-container">
        <div className="loader-ring-wrapper">
          <svg className="loader-ring-svg" viewBox="0 0 120 120">
            <circle
              className="loader-ring-bg"
              cx="60"
              cy="60"
              r="52"
            />
            <circle
              className="loader-ring-fill"
              cx="60"
              cy="60"
              r="52"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <div className="loader-center-icon">
            <Shield size={36} />
          </div>
        </div>

        <h2 className="loader-welcome-title">{welcomeMessage}</h2>
        <p className="loader-subtitle">Initializing Zero-Knowledge Encryption...</p>

        <div className="loader-status-card">
          <ShieldCheck size={18} style={{ color: '#10b981' }} />
          <span>AES-256 Bit Encryption Active</span>
        </div>

        <div className="loader-progress-box">
          <div className="loader-progress-bar-bg">
            <div 
              className="loader-progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="loader-progress-footer">
            <span>Authenticating Vault</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
