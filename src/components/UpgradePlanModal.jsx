import React, { useState } from 'react';
import { Crown, X, Check, ShieldCheck } from 'lucide-react';

export default function UpgradePlanModal({ onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [isSuccess, setIsSuccess] = useState(false);

  const plans = [
    {
      name: 'Free Vault',
      storage: '20 GB',
      price: '$0',
      period: 'Forever Free',
      features: ['20 GB Encrypted Storage', 'AES-256 Bit Security', 'Standard Document Sharing', 'Single Device Support'],
      popular: false
    },
    {
      name: 'Pro Vault',
      storage: '1 TB (1,000 GB)',
      price: '$9.99',
      period: 'per month',
      features: ['1 TB Unlimited Cloud Storage', 'Zero-Knowledge Security', 'Priority Document Sharing', 'Multi-Device Synchronization', '24/7 Dedicated Support'],
      popular: true
    },
    {
      name: 'Enterprise Vault',
      storage: 'Unlimited Storage',
      price: '$29.99',
      period: 'per month',
      features: ['Unlimited Encrypted Storage', 'Custom Domain Branding', 'Admin Audit Logs & Access Control', 'Dedicated Key Management', 'Custom SLA Guarantee'],
      popular: false
    }
  ];

  const handleConfirm = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="upgrade-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-box">
            <Crown className="crown-icon" size={24} />
            <span>Upgrade Storage Plan</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="upgrade-success-view animate-scale-up">
            <div className="success-badge-icon">
              <Check size={36} />
            </div>
            <h2 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '6px' }}>Plan Upgraded Successfully!</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Your vault storage has been expanded to <strong>{plans.find(p => p.name.startsWith(selectedPlan))?.storage}</strong>.
            </p>
          </div>
        ) : (
          <>
            <p className="modal-subtitle-text">
              Expand your digital document vault capacity with end-to-end zero-knowledge encryption.
            </p>

            <div className="plans-grid">
              {plans.map((plan, idx) => (
                <div 
                  key={idx}
                  className={`plan-card ${selectedPlan === plan.name.split(' ')[0] ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => setSelectedPlan(plan.name.split(' ')[0])}
                >
                  {plan.popular && <span className="plan-badge popular-tag">MOST POPULAR</span>}
                  <h4 className="plan-name">{plan.name}</h4>
                  <div className="plan-price">{plan.price} <span className="price-period">/{plan.period}</span></div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>{plan.storage}</p>
                  
                  <ul className="plan-features">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx}>
                        <Check size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="modal-actions-row">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-confirm-upgrade" onClick={handleConfirm}>
                <ShieldCheck size={16} /> Confirm Upgrade
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
