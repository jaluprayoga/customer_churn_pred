import React, { useEffect } from 'react';
import { User, ShieldAlert, Cpu, Receipt, ArrowRight } from 'lucide-react';

const CustomerForm = ({ formData, setFormData, onSubmit, isSubmitting }) => {
  
  // Logical auto-adjustments for consistent service inputs
  useEffect(() => {
    if (formData.InternetService === 'No') {
      setFormData(prev => ({
        ...prev,
        OnlineSecurity: 'No internet service',
        OnlineBackup: 'No internet service',
        DeviceProtection: 'No internet service',
        TechSupport: 'No internet service',
        StreamingTV: 'No internet service',
        StreamingMovies: 'No internet service'
      }));
    } else {
      // Revert from "No internet service" to standard options if they were blocked
      setFormData(prev => {
        const updates = {};
        const internetKeys = ['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies'];
        internetKeys.forEach(key => {
          if (prev[key] === 'No internet service') {
            updates[key] = 'No';
          }
        });
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [formData.InternetService, setFormData]);

  useEffect(() => {
    if (formData.PhoneService === 'No') {
      setFormData(prev => ({
        ...prev,
        MultipleLines: 'No phone service'
      }));
    } else {
      setFormData(prev => {
        if (prev.MultipleLines === 'No phone service') {
          return { ...prev, MultipleLines: 'No' };
        }
        return prev;
      });
    }
  }, [formData.PhoneService, setFormData]);

  // Handle simple change
  const handleChange = (key, val) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: val };
      
      // Auto-calculate TotalCharges roughly as Tenure * MonthlyCharges for user convenience
      if (key === 'Tenure' || key === 'MonthlyCharges') {
        const tenure = key === 'Tenure' ? parseInt(val) : parseInt(prev.Tenure);
        const monthly = key === 'MonthlyCharges' ? parseFloat(val) : parseFloat(prev.MonthlyCharges);
        updated.TotalCharges = parseFloat((tenure * monthly).toFixed(2));
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const internetDisabled = formData.InternetService === 'No';
  const phoneDisabled = formData.PhoneService === 'No';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Demographics Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          <User size={18} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Customer Demographics</h4>
        </div>
        
        <div className="form-grid-3">
          <div className="form-group">
            <span className="form-label">Gender</span>
            <div className="radio-card-grid">
              {['Male', 'Female'].map(opt => (
                <label key={opt} className={`radio-card ${formData.Gender === opt ? 'active' : ''}`}>
                  <input type="radio" checked={formData.Gender === opt} onChange={() => handleChange('Gender', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Has Partner</span>
            <div className="radio-card-grid">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className={`radio-card ${formData.Partner === opt ? 'active' : ''}`}>
                  <input type="radio" checked={formData.Partner === opt} onChange={() => handleChange('Partner', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Has Dependents</span>
            <div className="radio-card-grid">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className={`radio-card ${formData.Dependents === opt ? 'active' : ''}`}>
                  <input type="radio" checked={formData.Dependents === opt} onChange={() => handleChange('Dependents', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core Service Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          <Cpu size={18} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Core Telephony & Internet Services</h4>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <span className="form-label">Phone Service</span>
            <select className="form-select" value={formData.PhoneService} onChange={(e) => handleChange('PhoneService', e.target.value)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Multiple Lines</span>
            <select className="form-select" value={formData.MultipleLines} disabled={phoneDisabled} onChange={(e) => handleChange('MultipleLines', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No phone service">No phone service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Internet Service Provider</span>
            <select className="form-select" value={formData.InternetService} onChange={(e) => handleChange('InternetService', e.target.value)}>
              <option value="DSL">DSL Standard</option>
              <option value="Fiber optic">Fiber Optic (High Speed)</option>
              <option value="No">No Internet Service</option>
            </select>
          </div>
        </div>

        <div 
          className="form-grid-3"
          style={{
            opacity: internetDisabled ? 0.5 : 1,
            transition: 'var(--transition)'
          }}
        >
          <div className="form-group">
            <span className="form-label">Online Security</span>
            <select className="form-select" value={formData.OnlineSecurity} disabled={internetDisabled} onChange={(e) => handleChange('OnlineSecurity', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Online Backup</span>
            <select className="form-select" value={formData.OnlineBackup} disabled={internetDisabled} onChange={(e) => handleChange('OnlineBackup', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Device Protection</span>
            <select className="form-select" value={formData.DeviceProtection} disabled={internetDisabled} onChange={(e) => handleChange('DeviceProtection', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Tech Support Care</span>
            <select className="form-select" value={formData.TechSupport} disabled={internetDisabled} onChange={(e) => handleChange('TechSupport', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Streaming TV</span>
            <select className="form-select" value={formData.StreamingTV} disabled={internetDisabled} onChange={(e) => handleChange('StreamingTV', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Streaming Movies</span>
            <select className="form-select" value={formData.StreamingMovies} disabled={internetDisabled} onChange={(e) => handleChange('StreamingMovies', e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="No internet service">No internet service</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Account & Financials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          <Receipt size={18} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Contract & Financial Specifications</h4>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <span className="form-label">Contract Plan</span>
            <select className="form-select" value={formData.Contract} onChange={(e) => handleChange('Contract', e.target.value)}>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Paperless Billing</span>
            <div className="radio-card-grid">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className={`radio-card ${formData.PaperlessBilling === opt ? 'active' : ''}`}>
                  <input type="radio" checked={formData.PaperlessBilling === opt} onChange={() => handleChange('PaperlessBilling', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Payment Method</span>
            <select className="form-select" value={formData.PaymentMethod} onChange={(e) => handleChange('PaymentMethod', e.target.value)}>
              <option value="Electronic check">Electronic Check</option>
              <option value="Mailed check">Mailed Check</option>
              <option value="Bank transfer (automatic)">Bank Transfer (Automatic)</option>
              <option value="Credit card (automatic)">Credit Card (Automatic)</option>
            </select>
          </div>
        </div>

        {/* Financial Ranges (Sliders) */}
        <div className="form-grid-3">
          <div className="range-container">
            <div className="range-header">
              <span className="form-label">Tenure</span>
              <span className="range-value">{formData.Tenure} months</span>
            </div>
            <input 
              type="range" min="1" max="72" 
              className="range-input" 
              value={formData.Tenure} 
              onChange={(e) => handleChange('Tenure', e.target.value)} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>New (1m)</span>
              <span>Loyal (72m)</span>
            </div>
          </div>

          <div className="range-container">
            <div className="range-header">
              <span className="form-label">Monthly Cost</span>
              <span className="range-value">${formData.MonthlyCharges}</span>
            </div>
            <input 
              type="range" min="18" max="120" step="0.05"
              className="range-input" 
              value={formData.MonthlyCharges} 
              onChange={(e) => handleChange('MonthlyCharges', e.target.value)} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Min ($18)</span>
              <span>Max ($120)</span>
            </div>
          </div>

          <div className="form-group" style={{ justifyContent: 'center' }}>
            <span className="form-label">Total Charges (Auto-derived)</span>
            <input 
              type="number" step="0.01" 
              className="form-input" 
              value={formData.TotalCharges} 
              onChange={(e) => handleChange('TotalCharges', parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={isSubmitting}
        style={{
          padding: '0.9rem',
          fontSize: '1.05rem',
          alignSelf: 'flex-end',
          width: '240px',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
          marginTop: '1rem'
        }}
      >
        <span>{isSubmitting ? 'Evaluating ML Model...' : 'Calculate Churn Risk'}</span>
        <ArrowRight size={18} />
      </button>

    </form>
  );
};

export default CustomerForm;
