import React, { useState, useEffect } from 'react';
import { Sun, Moon, Database, Activity, Wifi, WifiOff, Settings, AlertTriangle } from 'lucide-react';
import { checkApiHealth } from '../utils/api';
import ApiSettingsModal from './ApiSettingsModal';

const Header = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [apiStatus, setApiStatus] = useState('checking');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await checkApiHealth();
        setApiStatus(status);
      } catch {
        setApiStatus('disconnected');
      }
    };
    
    checkConnection();
    
    const handleSettingsChange = () => {
      setApiStatus('checking');
      checkConnection();
    };
    
    window.addEventListener('api-settings-changed', handleSettingsChange);
    const interval = setInterval(checkConnection, 10000); // check health every 10s
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('api-settings-changed', handleSettingsChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Connection badge config helper
  const getConnectionBadgeStyle = () => {
    switch (apiStatus) {
      case 'connected':
        return {
          bg: 'var(--success-light)',
          color: 'var(--success)',
          border: 'rgba(16, 185, 129, 0.2)',
          icon: <Wifi size={14} />,
          text: 'API Serviced'
        };
      case 'auth_error':
        return {
          bg: 'var(--warning-light)',
          color: 'var(--warning)',
          border: 'rgba(245, 158, 11, 0.2)',
          icon: <AlertTriangle size={14} className="glow-active" />,
          text: 'API Auth Error'
        };
      case 'checking':
        return {
          bg: 'var(--warning-light)',
          color: 'var(--warning)',
          border: 'rgba(245, 158, 11, 0.2)',
          icon: <Activity size={14} className="glow-active" />,
          text: 'Connecting API...'
        };
      case 'disconnected':
      default:
        return {
          bg: 'var(--danger-light)',
          color: 'var(--danger)',
          border: 'rgba(239, 68, 68, 0.2)',
          icon: <WifiOff size={14} />,
          text: 'Using Local Demo Data'
        };
    }
  };

  const badgeConfig = getConnectionBadgeStyle();

  return (
    <>
      <header className="glass-card" style={{
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        padding: '1.25rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: 'none',
        borderInline: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        background: 'var(--glass-bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Database size={24} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)'
            }}>
              ChurnSphere
            </h1>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}>
              Telco Customer Churn Analytics & Inference
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* API Connection Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-xl)',
            background: badgeConfig.bg,
            color: badgeConfig.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid',
            borderColor: badgeConfig.border,
            transition: 'var(--transition)'
          }}>
            {badgeConfig.icon}
            <span>{badgeConfig.text}</span>
          </div>

          {/* API Settings Button */}
          <button 
            onClick={() => setShowSettings(true)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)'
            }}
            title="API Connection Settings"
          >
            <Settings size={18} />
          </button>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Render Settings Modal */}
      {showSettings && (
        <ApiSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default Header;
