import React, { useState } from 'react';
import { User, FileSpreadsheet, Sparkles } from 'lucide-react';
import Card from '../../components/Card';
import CustomerForm from './CustomerForm';
import PresetSelector from './PresetSelector';
import PredictionResult from './PredictionResult';
import ShapExplanation from './ShapExplanation';
import BatchUpload from './BatchUpload';
import { predictChurn } from '../../utils/api';

const DEFAULT_FORM_DATA = {
  Gender: 'Male',
  Partner: 'No',
  Dependents: 'No',
  PhoneService: 'Yes',
  MultipleLines: 'No',
  InternetService: 'DSL',
  OnlineSecurity: 'No',
  OnlineBackup: 'No',
  DeviceProtection: 'No',
  TechSupport: 'No',
  StreamingTV: 'No',
  StreamingMovies: 'No',
  Contract: 'Month-to-month',
  PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check',
  Tenure: 12,
  MonthlyCharges: 50.00,
  TotalCharges: 600.00
};

const InferenceTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('single'); // 'single' or 'batch'
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  // Apply quick populate presets
  const handleSelectPreset = (presetData) => {
    setFormData(presetData);
    setPredictionResult(null); // Clear previous results to prompt recalculation
    setError(null);
  };

  // Run single prediction model
  const handleSingleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await predictChurn(formData);
      if (response && !response.error) {
        setPredictionResult(response);
      } else {
        setError(response?.error || 'Failed to generate model prediction.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during prediction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback from batch table to load single row
  const handleLoadSingleFromBatch = (row) => {
    // Strip ID
    const { id, ...cleanRow } = row;
    setFormData(cleanRow);
    setActiveSubTab('single');
    setPredictionResult(null);
    setError(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Tab Nav Headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            Machine Learning Inference
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Query the predictive XGBoost model for individual risk scoring and batch profiles
          </p>
        </div>

        {/* Local Sub-tabs selector */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '0.2rem'
        }}>
          <button
            onClick={() => setActiveSubTab('single')}
            className="btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: activeSubTab === 'single' ? 'var(--bg-secondary)' : 'transparent',
              color: activeSubTab === 'single' ? 'var(--primary)' : 'var(--text-secondary)',
              border: activeSubTab === 'single' ? '1px solid var(--border-color)' : '1px solid transparent',
              boxShadow: activeSubTab === 'single' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            <User size={14} />
            <span>Single Client Form</span>
          </button>
          <button
            onClick={() => setActiveSubTab('batch')}
            className="btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: activeSubTab === 'batch' ? 'var(--bg-secondary)' : 'transparent',
              color: activeSubTab === 'batch' ? 'var(--primary)' : 'var(--text-secondary)',
              border: activeSubTab === 'batch' ? '1px solid var(--border-color)' : '1px solid transparent',
              boxShadow: activeSubTab === 'batch' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            <FileSpreadsheet size={14} />
            <span>Batch CSV Process</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'single' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Preset Buttons row */}
          <PresetSelector onSelect={handleSelectPreset} />
          {/* Form & Results split grid */}
          <div 
            className="inference-split-grid"
            style={{
              gridTemplateColumns: predictionResult ? undefined : '1fr'
            }}
          >
            
            {/* Input Form Column */}
            <Card title="Input Customer Characteristics" subtitle="Fill the customer features profile to calculate model outputs">
              <CustomerForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSingleSubmit} 
                isSubmitting={isSubmitting} 
              />
            </Card>

            {/* Prediction and Explanations Column */}
            {(predictionResult || error) && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {error && (
                  <div style={{
                    background: 'var(--danger-light)',
                    color: 'var(--danger)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--danger)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    Calculation Failure: {error}
                  </div>
                )}

                {predictionResult && (
                  <>
                    <Card title="Model Decision Output" subtitle="Calculated churn status probability risk and custom retention rules">
                      <PredictionResult result={predictionResult} inputData={formData} />
                    </Card>

                    <ShapExplanation shapValues={predictionResult.shap_values} />
                  </>
                )}

              </div>
            )}

          </div>

        </div>
      ) : (
        // Batch Upload Tab
        <BatchUpload onLoadSingle={handleLoadSingleFromBatch} />
      )}

    </div>
  );
};

export default InferenceTab;
