import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VaultLoader from './components/VaultLoader';
import Dashboard from './components/Dashboard';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('login');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLoginSuccess = () => {
    setIsLoading(true);
  };

  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  const handleLoaderComplete = () => {
    setIsLoading(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_active_user');
    setCurrentView('login');
  };

  return (
    <div className="app-container">
      {/* 3-Second Opening Splash Screen (Instagram / Snapchat Style) */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Top Right Single Theme Toggle Button */}
      <button 
        className="circle-theme-toggle-btn" 
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {isLoading ? (
        <VaultLoader onComplete={handleLoaderComplete} />
      ) : (
        <>
          {currentView === 'login' && (
            <div className="mobile-frame-container animate-fade-in">
              <Login 
                onViewChange={setCurrentView} 
                onLoginSuccess={handleLoginSuccess} 
              />
            </div>
          )}

          {currentView === 'register' && (
            <div className="mobile-frame-container animate-fade-in">
              <Register 
                onViewChange={setCurrentView} 
                onRegisterSuccess={handleRegisterSuccess}
              />
            </div>
          )}

          {currentView === 'forgot' && (
            <ForgotPassword onViewChange={setCurrentView} />
          )}

          {currentView === 'dashboard' && (
            <Dashboard 
              onLogout={handleLogout} 
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )}
        </>
      )}
    </div>
  );
}
