import React, { useEffect, useState } from 'react';
import logoImage from '../assets/vault_logo.jpg';
import { ShieldCheck } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 2.7s for animation, then start 300ms fade-out transition -> total 3s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2700);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <div className="splash-background-glow"></div>
      
      <div className="splash-center-content">
        <div className="splash-logo-wrapper">
          <div className="splash-ring-pulse"></div>
          <div className="splash-ring-pulse delay-1"></div>
          <img src={logoImage} alt="Vault App Logo" className="splash-logo-img" />
        </div>

        <div className="splash-title-block">
          <h1 className="splash-app-name">DIGITAL <span className="blue-glow">VAULT</span></h1>
          <p className="splash-tagline">SECURE • ORGANIZE • ACCESS</p>
        </div>
      </div>

      <div className="splash-footer">
        <span className="splash-from-text">from</span>
        <div className="splash-brand-badge">
          <ShieldCheck size={16} className="splash-shield-icon" />
          <span className="splash-company-name">DIGITAL DOCUMENT VAULT</span>
        </div>
      </div>
    </div>
  );
}
