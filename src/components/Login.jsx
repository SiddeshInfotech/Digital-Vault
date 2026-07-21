import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import logoImage from '../assets/vault_logo.jpg';

const systemInfo = typeof __SYSTEM_INFO__ !== 'undefined' ? __SYSTEM_INFO__ : {
  username: 'patil',
  displayName: 'Komal Patil',
  email: 'komal.patil@gmail.com',
  msEmail: 'komal.patil@outlook.com',
  hostname: 'localhost'
};

export default function Login({ onViewChange, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.handleSSOSuccess = (provider, name, ssoEmail) => {
      const users = JSON.parse(localStorage.getItem('vault_users') || '[]');
      const existingUser = users.find(u => u.email.toLowerCase() === ssoEmail.toLowerCase());
      const isNew = !existingUser || existingUser.isNewUser || existingUser.loginCount === 0;

      const activeUser = {
        fullName: name,
        email: ssoEmail,
        phone: existingUser?.phone || '9876543210',
        password: 'sso_authenticated',
        isNewUser: isNew
      };
      
      localStorage.setItem('vault_active_user', JSON.stringify(activeUser));
      
      if (!existingUser) {
        users.push({ ...activeUser, loginCount: 0 });
        localStorage.setItem('vault_users', JSON.stringify(users));
      }

      onLoginSuccess();
    };

    return () => {
      delete window.handleSSOSuccess;
    };
  }, [onLoginSuccess]);

  const validateForm = () => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        
        const users = JSON.parse(localStorage.getItem('vault_users') || '[]');
        
        if (users.length === 0) {
          users.push({
            fullName: systemInfo.displayName,
            email: systemInfo.email,
            password: 'password123',
            phone: '9876543210',
            isNewUser: false,
            loginCount: 1
          });
          localStorage.setItem('vault_users', JSON.stringify(users));
        }

        const emailUser = users.find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!emailUser) {
          setEmailError('Wrong email');
          setPasswordError('');
        } else if (emailUser.password !== password) {
          setEmailError('');
          setPasswordError('Wrong password');
        } else {
          const justRegistered = localStorage.getItem('vault_just_registered_email') === email.toLowerCase();
          const userIsNew = emailUser.isNewUser || emailUser.loginCount === 0 || justRegistered;
          const activeUser = { ...emailUser, isNewUser: userIsNew };
          localStorage.setItem('vault_active_user', JSON.stringify(activeUser));
          onLoginSuccess();
        }
      }, 800);
    }
  };

  const getPopupHtml = (provider) => {
    const initials = 'KP';
    
    if (provider === 'google') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sign in with Google</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f9fa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
            .card { background: white; width: 100%; max-width: 400px; padding: 36px 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; box-sizing: border-box; }
            .google-logo { width: 32px; height: 32px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: 700; color: #202124; margin: 0 0 8px 0; }
            .subtitle { color: #5f6368; font-size: 14px; margin-bottom: 24px; }
            .account-box { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1.5px solid #dadce0; border-radius: 12px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease; text-align: left; }
            .account-box:hover { background: #f8f9fa; border-color: #1a73e8; box-shadow: 0 2px 6px rgba(26,115,232,0.15); }
            .avatar { width: 44px; height: 44px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0; }
            .name { font-weight: 700; color: #202124; font-size: 15px; }
            .email { font-size: 13px; color: #5f6368; margin-top: 2px; }
            .custom-form { display: none; text-align: left; margin-top: 16px; }
            .input-field { width: 100%; padding: 10px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 10px; outline: none; }
            .input-field:focus { border-color: #1a73e8; }
            .btn-signin { width: 100%; padding: 11px; background: #1a73e8; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
            .use-another-btn { background: none; border: none; color: #1a73e8; font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px 0; }
            .footer-links { font-size: 12px; color: #70757a; margin-top: 28px; }
            .footer-links a { color: #70757a; text-decoration: none; margin: 0 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <svg class="google-logo" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.9 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.77 2.92C6.17 7.24 8.87 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.42-4.91 3.42-8.61z"/>
              <path fill="#FBBC05" d="M5.25 10.42c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.92C.54 8.78 0 10.84 0 13s.54 4.22 1.48 6.08l3.77-2.92c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.88c-1.11.75-2.52 1.2-4.25 1.2-3.13 0-5.83-2.2-6.75-5.38L1.48 16c1.92 3.85 5.87 6.5 10.52 6.5z"/>
            </svg>
            <h2 class="title">Sign in with Google</h2>
            <p class="subtitle">Choose your device account</p>
            
            <div class="account-box" onclick="selectDefaultAccount()">
              <div class="avatar">${initials}</div>
              <div>
                <div class="name">Komal Patil</div>
                <div class="email">komal.patil@gmail.com</div>
              </div>
            </div>

            <button class="use-another-btn" onclick="toggleCustomForm()">Use another account</button>

            <div id="customForm" class="custom-form">
              <input type="text" id="customName" class="input-field" placeholder="Full Name" value="Komal Patil" />
              <input type="email" id="customEmail" class="input-field" placeholder="Google Email Address" required />
              <button class="btn-signin" onclick="submitCustomAccount()">Sign In with Google</button>
            </div>

            <div class="footer-links">
              <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a>
            </div>
          </div>

          <script>
            function selectDefaultAccount() {
              window.opener.handleSSOSuccess('google', 'Komal Patil', 'komal.patil@gmail.com');
              window.close();
            }

            function toggleCustomForm() {
              const form = document.getElementById('customForm');
              form.style.display = form.style.display === 'block' ? 'none' : 'block';
            }

            function submitCustomAccount() {
              const email = document.getElementById('customEmail').value.trim();
              const name = document.getElementById('customName').value.trim() || 'Komal Patil';
              if (email) {
                window.opener.handleSSOSuccess('google', name, email);
                window.close();
              }
            }
          </script>
        </body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sign in to your Microsoft account</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f2f2f2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
            .card { background: white; width: 100%; max-width: 420px; padding: 40px; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); box-sizing: border-box; }
            .ms-logo { display: flex; gap: 3px; margin-bottom: 20px; }
            .ms-tile { width: 11px; height: 11px; }
            .title { font-size: 24px; font-weight: 600; color: #1b1b1b; margin: 0 0 8px 0; }
            .subtitle { font-size: 13.5px; color: #666; margin-bottom: 24px; }
            .account-box { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1.5px solid #8a8a8a; border-radius: 2px; margin-bottom: 16px; cursor: pointer; transition: background 0.2s ease; }
            .account-box:hover { background: #f3f2f1; border-color: #0078d4; }
            .avatar { width: 42px; height: 42px; background: #0078d4; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
            .name { font-weight: 600; color: #1b1b1b; font-size: 15px; }
            .email { font-size: 12.5px; color: #666; margin-top: 2px; }
            .btn-another { background: none; border: none; color: #0078d4; font-size: 13.5px; font-weight: 600; cursor: pointer; padding: 6px 0; }
            .custom-form { display: none; margin-top: 16px; }
            .input-field { width: 100%; padding: 10px 12px; border: 1px solid #8a8a8a; font-size: 14px; box-sizing: border-box; margin-bottom: 10px; outline: none; }
            .input-field:focus { border-color: #0078d4; }
            .btn-signin { width: 100%; padding: 11px; background: #0078d4; color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
            .security-badge { font-size: 11.5px; color: #666; margin-top: 32px; display: flex; align-items: center; gap: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="ms-logo">
              <div class="ms-tile" style="background:#f35325;"></div>
              <div class="ms-tile" style="background:#81bc06;"></div>
              <div class="ms-tile" style="background:#05a6f0;margin-top:14px;margin-left:-25px;"></div>
              <div class="ms-tile" style="background:#ffba08;margin-top:14px;margin-left:3px;"></div>
            </div>

            <h2 class="title">Microsoft Sign In</h2>
            <p class="subtitle">Pick an account from your Windows device</p>

            <div class="account-box" onclick="selectDefaultAccount()">
              <div class="avatar">${initials}</div>
              <div>
                <div class="name">Komal Patil</div>
                <div class="email">komal.patil@outlook.com</div>
              </div>
            </div>

            <button class="btn-another" onclick="toggleCustomForm()">Sign in with another Microsoft account</button>

            <div id="customForm" class="custom-form">
              <input type="text" id="customName" class="input-field" placeholder="Full Name" value="Komal Patil" />
              <input type="email" id="customEmail" class="input-field" placeholder="Outlook / Live / Office365 Email" required />
              <button class="btn-signin" onclick="submitCustomAccount()">Sign In with Microsoft</button>
            </div>

            <div class="security-badge">
              <span>Protected by Microsoft Entra Identity Service</span>
            </div>
          </div>

          <script>
            function selectDefaultAccount() {
              window.opener.handleSSOSuccess('microsoft', 'Komal Patil', 'komal.patil@outlook.com');
              window.close();
            }

            function toggleCustomForm() {
              const form = document.getElementById('customForm');
              form.style.display = form.style.display === 'block' ? 'none' : 'block';
            }

            function submitCustomAccount() {
              const email = document.getElementById('customEmail').value.trim();
              const name = document.getElementById('customName').value.trim() || 'Komal Patil';
              if (email) {
                window.opener.handleSSOSuccess('microsoft', name, email);
                window.close();
              }
            }
          </script>
        </body>
        </html>
      `;
    }
  };

  const handleSSO = (provider) => {
    const width = 480;
    const height = 580;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '', 
      `${provider}_sso`, 
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.document.write(getPopupHtml(provider));
      popup.document.close();
    }
  };

  return (
    <div className="auth-content">
      <div className="logo-container">
        <img src={logoImage} alt="Vault Logo" className="logo-image" />
        <h1 className="app-title">Digital <span className="blue-text">Document</span> Vault</h1>
        <p className="app-subtitle">Securely Store Your Documents</p>
      </div>

      <h2 className="screen-title">Welcome Back!</h2>
      <p className="screen-subtitle">Login to continue to your account</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={16} />
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

        <div className="form-group">
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`form-input has-right-icon ${passwordError ? 'is-invalid' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
            />
            <button
              type="button"
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && <div className="error-message">{passwordError}</div>}
        </div>

        <div className="forgot-password-link-wrapper">
          <a
            href="#"
            className="forgot-password-link"
            onClick={(e) => {
              e.preventDefault();
              onViewChange('forgot');
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Login'}
          {!isSubmitting && <ArrowRight size={16} className="btn-icon" />}
        </button>
      </form>

      <div className="sso-divider">or continue with</div>

      <div className="sso-buttons-container">
        <button 
          type="button" 
          className="btn-sso" 
          onClick={() => handleSSO('google')}
        >
          <svg className="sso-icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.9 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.77 2.92C6.17 7.24 8.87 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.42-4.91 3.42-8.61z"/>
            <path fill="#FBBC05" d="M5.25 10.42c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.92C.54 8.78 0 10.84 0 13s.54 4.22 1.48 6.08l3.77-2.92c-.24-.72-.38-1.49-.38-2.29z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.88c-1.11.75-2.52 1.2-4.25 1.2-3.13 0-5.83-2.2-6.75-5.38L1.48 16c1.92 3.85 5.87 6.5 10.52 6.5z"/>
          </svg>
          Google
        </button>
        <button 
          type="button" 
          className="btn-sso" 
          onClick={() => handleSSO('microsoft')}
        >
          <svg className="sso-icon" viewBox="0 0 23 23" width="16" height="16">
            <path fill="#f35325" d="M0 0h11v11H0z"/>
            <path fill="#81bc06" d="M12 0h11v11H12z"/>
            <path fill="#05a6f0" d="M0 12h11v11H0z"/>
            <path fill="#ffba08" d="M12 12h11v11H12z"/>
          </svg>
          Microsoft
        </button>
      </div>

      <div className="auth-footer">
        Don't have an account? 
        <a 
          href="#" 
          className="auth-footer-link"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('register');
          }}
        >
          Register
        </a>
      </div>
    </div>
  );
}
