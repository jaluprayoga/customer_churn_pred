import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomerForm from './CustomerForm';

describe('CustomerForm Component', () => {
  const defaultFormData = {
    Gender: 'Male',
    Partner: 'No',
    Dependents: 'No',
    PhoneService: 'Yes',
    MultipleLines: 'No',
    InternetService: 'Fiber optic',
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
    MonthlyCharges: 70.00,
    TotalCharges: 840.00
  };

  it('renders form segments and fields successfully', () => {
    render(
      <CustomerForm 
        formData={defaultFormData} 
        setFormData={() => {}} 
        onSubmit={() => {}} 
        isSubmitting={false} 
      />
    );

    // Verify sections render
    expect(screen.getByText('Customer Demographics')).toBeDefined();
    expect(screen.getByText('Core Telephony & Internet Services')).toBeDefined();
    expect(screen.getByText('Contract & Financial Specifications')).toBeDefined();

    // Verify inputs render
    expect(screen.getByText('Gender')).toBeDefined();
    expect(screen.getByText('Phone Service')).toBeDefined();
    expect(screen.getByText('Contract Plan')).toBeDefined();
  });

  it('triggers setFormData update when InternetService is No to clear internet features', () => {
    const setFormDataMock = vi.fn();
    const dataWithNoInternet = {
      ...defaultFormData,
      InternetService: 'No',
      // Start with standard options to check if they get set to 'No internet service'
      OnlineSecurity: 'No', 
      OnlineBackup: 'No'
    };

    render(
      <CustomerForm 
        formData={dataWithNoInternet} 
        setFormData={setFormDataMock} 
        onSubmit={() => {}} 
        isSubmitting={false} 
      />
    );

    expect(setFormDataMock).toHaveBeenCalled();
    
    // Process state updaters sequentially to simulate batching
    let updatedState = dataWithNoInternet;
    setFormDataMock.mock.calls.forEach(call => {
      const updaterFn = call[0];
      updatedState = updaterFn(updatedState);
    });

    expect(updatedState.OnlineSecurity).toBe('No internet service');
    expect(updatedState.OnlineBackup).toBe('No internet service');
    expect(updatedState.TechSupport).toBe('No internet service');
  });

  it('triggers setFormData update when PhoneService is No to disable multiple lines', () => {
    const setFormDataMock = vi.fn();
    const dataWithNoPhone = {
      ...defaultFormData,
      PhoneService: 'No',
      MultipleLines: 'Yes' // Inconsistent value
    };

    render(
      <CustomerForm 
        formData={dataWithNoPhone} 
        setFormData={setFormDataMock} 
        onSubmit={() => {}} 
        isSubmitting={false} 
      />
    );

    expect(setFormDataMock).toHaveBeenCalled();
    
    // Process state updaters sequentially to simulate batching
    let updatedState = dataWithNoPhone;
    setFormDataMock.mock.calls.forEach(call => {
      const updaterFn = call[0];
      updatedState = updaterFn(updatedState);
    });

    expect(updatedState.MultipleLines).toBe('No phone service');
  });
});
