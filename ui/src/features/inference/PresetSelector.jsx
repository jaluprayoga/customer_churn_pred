import React from 'react';
import { PRESETS } from '../../constants/mockData';
const PresetSelector = ({ onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
        Quick Populate Profiles
      </span>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.data)}
              className="btn btn-secondary fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '1rem',
                gap: '0.35rem',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${preset.color}`,
                background: 'var(--bg-secondary)',
                transition: 'var(--transition)',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: preset.color }}>
                <Icon size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{preset.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetSelector;
