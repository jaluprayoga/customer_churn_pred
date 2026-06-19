import React, { useState } from 'react';
import { LayoutDashboard, Cpu } from 'lucide-react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import DashboardTab from './features/dashboard/DashboardTab';
import InferenceTab from './features/inference/InferenceTab';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'inference'

  const tabs = [
    {
      id: 'dashboard',
      name: 'Analytics Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'inference',
      name: 'Churn Prediction',
      icon: Cpu
    }
  ];

  return (
    <>
      <Header />
      
      <main className="app-container">
        
        {/* Responsive, modular tabs navigation */}
        <Tabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          tabs={tabs} 
        />

        {/* Tab content wrapper with fade transitions */}
        <div style={{ marginTop: '0.5rem' }}>
          {activeTab === 'dashboard' ? (
            <DashboardTab />
          ) : (
            <InferenceTab />
          )}
        </div>
        
      </main>

      {/* Premium Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontWeight: 500 }}>
          ChurnSphere ML Platform © {new Date().getFullYear()} • Powered by XGBoost Serving & FastAPI
        </p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
          Production Grade Customer Churn Prediction Engine
        </p>
      </footer>
    </>
  );
}

export default App;
