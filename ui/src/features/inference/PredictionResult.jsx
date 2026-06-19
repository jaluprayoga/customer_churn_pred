import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, HelpCircle, PhoneCall, Award, CreditCard } from 'lucide-react';

const PredictionResult = ({ result, inputData }) => {
  if (!result) return null;

  const isChurn = result.prediction === 'Likely to churn';
  
  // Use exact probability if returned, otherwise estimate based on prediction
  const probability = result.probability !== undefined 
    ? result.probability 
    : (isChurn ? 0.78 : 0.14);
    
  const pct = Math.round(probability * 100);

  // Determine severity style
  let themeColor = 'var(--success)';
  let themeLight = 'var(--success-light)';
  let themeGlow = 'var(--success-glow)';
  let RiskIcon = ShieldCheck;
  let riskLevel = 'Low Churn Risk';

  if (pct >= 35 && pct < 70) {
    themeColor = 'var(--warning)';
    themeLight = 'var(--warning-light)';
    themeGlow = 'rgba(245, 158, 11, 0.2)';
    RiskIcon = ShieldAlert;
    riskLevel = 'Elevated Churn Risk';
  } else if (pct >= 70) {
    themeColor = 'var(--danger)';
    themeLight = 'var(--danger-light)';
    themeGlow = 'var(--danger-glow)';
    RiskIcon = ShieldAlert;
    riskLevel = 'Critical Churn Risk';
  }

  // Generate customized business actions based on input characteristics
  const generateRecommendations = () => {
    const recs = [];
    
    if (isChurn) {
      if (inputData.Contract === 'Month-to-month') {
        recs.push({
          icon: Award,
          color: 'var(--primary)',
          title: 'Upgrade Contract Plan',
          desc: 'Offer a 15% discount on Monthly Charges for upgrading to a stable 1-Year or 2-Year Contract.'
        });
      }
      
      if (inputData.InternetService === 'Fiber optic' && inputData.TechSupport === 'No') {
        recs.push({
          icon: Sparkles,
          color: 'var(--accent)',
          title: 'Premium Tech Support Bundle',
          desc: 'Provide a complimentary 3-month trial of Tech Support to resolve fiber setup issues.'
        });
      }

      if (inputData.PaymentMethod === 'Electronic check') {
        recs.push({
          icon: CreditCard,
          color: 'var(--warning)',
          title: 'Auto-Pay Incentive',
          desc: 'Propose a one-time $10 bill credit if customer registers for Automatic Credit Card / Bank Transfer.'
        });
      }

      if (parseFloat(inputData.MonthlyCharges) > 85) {
        recs.push({
          icon: PhoneCall,
          color: 'var(--danger)',
          title: 'Customer Success Outreach',
          desc: 'Trigger high-priority account representative call to assess service value and offer loyalty discounts.'
        });
      }
    } else {
      // Retention / Loyal recommendations
      recs.push({
        icon: ShieldCheck,
        color: 'var(--success)',
        title: 'Maintain Loyalty Program',
        desc: 'Customer is stable. Enlist in standard newsletter updates and pre-approve for upcoming hardware updates.'
      });
      
      if (inputData.Contract !== 'Two year' && parseInt(inputData.Tenure) > 36) {
        recs.push({
          icon: Award,
          color: 'var(--primary)',
          title: 'Lock-in Loyalty Contract',
          desc: 'Customer is highly loyal. Propose multi-year lock-in with bundled device discounts.'
        });
      }
    }

    // Fallback if list is empty
    if (recs.length === 0) {
      recs.push({
        icon: HelpCircle,
        color: 'var(--text-muted)',
        title: 'Observe Activity',
        desc: 'Perform periodic health checks and monitor data usage thresholds.'
      });
    }

    return recs;
  };

  const recommendations = generateRecommendations();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Risk Assessment Box */}
      <div style={{
        background: themeLight,
        border: `1px solid ${themeColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: `0 0 15px ${themeGlow}`,
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: themeColor,
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RiskIcon size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: themeColor }}>
              {riskLevel}
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {result.prediction}
            </h3>
          </div>
        </div>

        {/* Circular Percentage Meter */}
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '80px', height: '80px' }}>
            <circle 
              cx="40" cy="40" r="34" 
              stroke="var(--bg-tertiary)" 
              strokeWidth="6" 
              fill="transparent" 
            />
            <circle 
              cx="40" cy="40" r="34" 
              stroke={themeColor} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - probability)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--text-primary)'
          }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* Actionable Retention Playbook */}
      <div>
        <h4 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1rem',
          fontWeight: 700,
          marginBottom: '1rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>Recommended Retention Interventions</span>
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div 
                key={idx} 
                className="fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{
                  background: `rgba(99, 102, 241, 0.1)`,
                  color: rec.color,
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem'
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rec.title}
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {rec.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default PredictionResult;
