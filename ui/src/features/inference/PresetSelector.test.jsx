import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetSelector from './PresetSelector';
import { PRESETS } from '../../constants/mockData';

describe('PresetSelector Component', () => {
  it('renders all preset profile buttons', () => {
    render(<PresetSelector onSelect={() => {}} />);
    
    expect(screen.getByText('High-Risk Profile')).toBeDefined();
    expect(screen.getByText('Loyal VIP Profile')).toBeDefined();
    expect(screen.getByText('Standard Customer')).toBeDefined();
  });

  it('triggers onSelect callback with correct profile data on click', () => {
    const handleSelect = vi.fn();
    render(<PresetSelector onSelect={handleSelect} />);

    // Click on High Risk button
    const highRiskBtn = screen.getByText('High-Risk Profile').closest('button');
    fireEvent.click(highRiskBtn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    
    // Check that it passes the correct preset data payload
    const expectedData = PRESETS.find(p => p.id === 'high-risk').data;
    expect(handleSelect).toHaveBeenCalledWith(expectedData);
  });
});
