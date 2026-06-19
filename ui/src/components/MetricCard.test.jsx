import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCard from './MetricCard';
import { DollarSign } from 'lucide-react';

describe('MetricCard Component', () => {
  it('renders title and values correctly', () => {
    render(
      <MetricCard 
        title="Avg Monthly Cost" 
        value={64.76} 
        prefix="$" 
        suffix="/mo" 
      />
    );

    expect(screen.getByText('Avg Monthly Cost')).toBeDefined();
    expect(screen.getByText('$64.76/mo')).toBeDefined();
  });

  it('renders change and trend badges with correct formatting', () => {
    const { rerender } = render(
      <MetricCard 
        title="Churn Rate" 
        value={26.54} 
        change="2.4% increase" 
        isNegative={true} 
      />
    );

    const badge = screen.getByText('2.4% increase');
    expect(badge).toBeDefined();
    
    // Check that positive change renders correct labels
    rerender(
      <MetricCard 
        title="Churn Rate" 
        value={26.54} 
        change="1.5% decrease" 
        isNegative={false} 
      />
    );
    expect(screen.getByText('1.5% decrease')).toBeDefined();
  });
});
