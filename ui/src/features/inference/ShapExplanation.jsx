import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ResponsiveContainer 
} from 'recharts';
import { HelpCircle, Info } from 'lucide-react';
import Card from '../../components/Card';

const ShapExplanation = ({ shapValues }) => {
  const [showAll, setShowAll] = useState(false);

  if (!shapValues || Object.keys(shapValues).length === 0) {
    return (
      <Card title="Model Decision Drivers (SHAP)">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '240px',
          color: 'var(--text-muted)',
          gap: '0.5rem'
        }}>
          <Info size={28} />
          <span style={{ fontSize: '0.85rem' }}>No explanation coordinates returned from API.</span>
        </div>
      </Card>
    );
  }

  // Transform SHAP values object into sorted array
  const formattedData = Object.entries(shapValues)
    // Map nice readable labels
    .map(([key, val]) => {
      let displayName = key
        .replace('InternetService_', 'Internet: ')
        .replace('Contract_', 'Contract: ')
        .replace('PaymentMethod_', 'Payment: ')
        .replace('OnlineSecurity_', 'Security: ')
        .replace('TechSupport_', 'Support: ')
        .replace('OnlineBackup_', 'Backup: ')
        .replace('DeviceProtection_', 'Protection: ')
        .replace('MultipleLines_', 'Lines: ')
        .replace('PaperlessBilling_', 'Paperless Billing: ');
      
      return {
        feature: displayName,
        rawFeature: key,
        value: parseFloat(val),
        abs: Math.abs(val)
      };
    })
    // Filter out zero importance ones to save space
    .filter(item => item.value !== 0)
    // Sort by absolute impact
    .sort((a, b) => b.abs - a.abs);

  // Show top 7 by default, or all if requested
  const visibleData = showAll ? formattedData : formattedData.slice(0, 7);

  // Custom tooltips
  const formatShapTooltip = (value) => {
    const direction = value > 0 ? 'Increases Churn Risk' : 'Reduces Churn Risk';
    return [`${value > 0 ? '+' : ''}${value.toFixed(4)} (${direction})`, 'Impact Score'];
  };

  return (
    <Card 
      title="Model Decision Drivers (SHAP)" 
      subtitle="Feature attribution analysis showing individual feature impacts on customer churn risk probability"
      actions={
        formattedData.length > 7 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
          >
            {showAll ? 'Show Top Drivers' : `Show All (${formattedData.length})`}
          </button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* SHAP explanation card */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start',
          background: 'var(--bg-tertiary)',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          lineHeight: '1.4'
        }}>
          <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>How to read this chart:</strong> Red bars (positive values) push the model prediction toward <strong>Likely to Churn</strong>, while green bars (negative values) pull it toward <strong>Not Likely to Churn</strong>. The length of the bar correlates with the strength of the indicator.
          </div>
        </div>

        {/* Diverging Bar Chart */}
        <div style={{ width: '100%', height: visibleData.length * 38 + 50, minHeight: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleData} // Keeps highest absolute importance at the top (index 0)
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`} />
              <YAxis 
                dataKey="feature" 
                type="category" 
                tick={{ fontSize: 11, fontWeight: 500 }}
                width={140}
              />
              <Tooltip formatter={formatShapTooltip} />
              <ReferenceLine x={0} stroke="var(--text-muted)" strokeWidth={1} />
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {visibleData.map((entry, index) => {
                  const color = entry.value > 0 ? 'var(--danger)' : 'var(--success)';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </Card>
  );
};

export default ShapExplanation;
