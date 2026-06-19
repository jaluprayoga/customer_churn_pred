import React, { useState, useEffect } from 'react';
import { X, Server, Key, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { getApiSettings, saveApiSettings, testApiConnection } from '../utils/api';

const ApiSettingsModal = ({ onClose }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isMasked, setIsMasked] = useState(true);

  // Load current settings when modal opens
  useEffect(() => {
    const { url, key } = getApiSettings();
    setApiUrl(url);
    setApiKey(key);
  }, []);

  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (!apiUrl.trim()) {
      setTestStatus('error');
      setErrorMessage('Server URL cannot be empty.');
      return;
    }

    setTestStatus('testing');
    setErrorMessage('');

    const result = await testApiConnection(apiUrl.trim(), apiKey.trim());
    if (result.success) {
      setTestStatus('success');
    } else {
      setTestStatus('error');
      setErrorMessage(result.error);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveApiSettings(apiUrl.trim(), apiKey.trim());
    onClose();
  };

  const handleReset = () => {
    setApiUrl('http://127.0.0.1:8000');
    setApiKey('default_client_key_12345');
    setTestStatus('idle');
    setErrorMessage('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}
    onClick={onClose}
    >
      <div 
        className="glass-card" 
        style={{
          width: '90%',
          maxWidth: '500px',
          padding: '2rem',
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '50%',
            transition: 'var(--transition)'
          }}
          className="btn-secondary"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              API Connection Settings
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Configure FastAPI endpoint address and authorization API keys
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* URL Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="api-url">
              <Server size={14} style={{ color: 'var(--primary)' }} />
              <span>Backend Server URL</span>
            </label>
            <input 
              id="api-url"
              type="url" 
              value={apiUrl}
              onChange={(e) => {
                setApiUrl(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="e.g. http://127.0.0.1:8000"
              className="form-input"
              required
            />
          </div>

          {/* Key Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="api-key">
              <Key size={14} style={{ color: 'var(--accent)' }} />
              <span>Client API Key</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
              <input 
                id="api-key"
                type={isMasked ? 'password' : 'text'} 
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="Enter client api key"
                className="form-input"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setIsMasked(!isMasked)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {isMasked ? 'Show' : 'Hide'}
              </button>
            </div>
          </div>

          {/* Testing Status Badge */}
          {testStatus !== 'idle' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 500,
              background: 
                testStatus === 'testing' ? 'var(--bg-tertiary)' :
                testStatus === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
              color: 
                testStatus === 'testing' ? 'var(--text-secondary)' :
                testStatus === 'success' ? 'var(--success)' : 'var(--danger)',
              border: '1px solid',
              borderColor: 
                testStatus === 'testing' ? 'var(--border-color)' :
                testStatus === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              transition: 'var(--transition)'
            }}>
              {testStatus === 'testing' && (
                <>
                  <RefreshCw size={16} className="glow-active" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span>Verifying endpoint and key authorization...</span>
                </>
              )}
              {testStatus === 'success' && (
                <>
                  <Check size={16} />
                  <span style={{ fontWeight: 600 }}>Connection successful! Key authorized.</span>
                </>
              )}
              {testStatus === 'error' && (
                <>
                  <AlertTriangle size={16} />
                  <span style={{ fontWeight: 600 }}>Connection failed: {errorMessage}</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
            >
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Test Connection
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiSettingsModal;
