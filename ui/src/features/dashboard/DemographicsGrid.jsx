import React from 'react';
import Card from '../../components/Card';

const DemographicsGrid = ({ demographics }) => {
  const renderDemographicStat = (label, data) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {Object.entries(data).map(([key, val]) => {
          const total = val.churned + val.retained;
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-primary)' }}>{key}</span>
                <span style={{ color: 'var(--danger)' }}>{val.rate}% Churn Rate</span>
              </div>
              
              {/* Progress bar container */}
              <div style={{
                height: '8px',
                width: '100%',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${val.rate}%`,
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--danger) 100%)',
                  borderRadius: '4px',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Total: {total.toLocaleString()}</span>
                <span>Retained: {val.retained.toLocaleString()} | Churned: {val.churned.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card 
      title="Demographic Risk Profiles" 
      subtitle="Insights into customer characteristics and their relationship to churn probability"
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem'
      }}>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Gender Breakdown
          </h4>
          {renderDemographicStat('Gender', demographics.gender)}
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Senior Citizen Status
          </h4>
          {renderDemographicStat('Senior Citizen', demographics.senior_citizen)}
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Has Partner
          </h4>
          {renderDemographicStat('Partner', demographics.partner)}
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Has Dependents
          </h4>
          {renderDemographicStat('Dependents', demographics.dependents)}
        </div>
      </div>
    </Card>
  );
};

export default DemographicsGrid;
