import React from 'react';
import Card from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, change, isNegative, color = 'var(--primary)', prefix = '', suffix = '' }) => {
  return (
    <Card className="fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <div style={{
          background: `rgba(${color.includes('var') ? '99, 102, 241, 0.1' : '129, 140, 248, 0.1'})`,
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)',
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-1px'
        }}>
          {prefix}{value}{suffix}
        </span>
        
        {change !== undefined && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isNegative ? 'var(--danger)' : 'var(--success)',
            background: isNegative ? 'var(--danger-light)' : 'var(--success-light)',
            padding: '0.15rem 0.4rem',
            borderRadius: 'var(--radius-sm)',
            gap: '0.1rem'
          }}>
            {isNegative ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>
    </Card>
  );
};

export default MetricCard;
