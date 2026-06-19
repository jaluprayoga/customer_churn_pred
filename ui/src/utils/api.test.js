import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkApiHealth, getDashboardStats, predictChurn, getApiSettings, saveApiSettings, testApiConnection } from './api';

describe('ChurnSphere API Utilities', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('API Settings Management', () => {
    it('should load default settings if none are saved', () => {
      const settings = getApiSettings();
      expect(settings.url).toBe('http://127.0.0.1:8000');
      expect(settings.key).toBe('default_client_key_12345');
    });

    it('should save settings and dispatch event', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      saveApiSettings('http://test-url.com', 'test-key-999');

      const settings = getApiSettings();
      expect(settings.url).toBe('http://test-url.com');
      expect(settings.key).toBe('test-key-999');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchSpy.mock.calls[0][0].type).toBe('api-settings-changed');
    });

    it('should test connection successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const res = await testApiConnection('http://test-url.com', 'key');
      expect(res).toEqual({ success: true });
    });

    it('should fail connection test on invalid credentials', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const res = await testApiConnection('http://test-url.com', 'key');
      expect(res).toEqual({ success: false, error: 'Invalid API Key' });
    });
  });

  describe('checkApiHealth', () => {
    it('should return "connected" when API credentials check endpoint succeeds', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const status = await checkApiHealth();
      expect(status).toBe('connected');
      expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/dashboard/stats', expect.any(Object));
    });

    it('should return "auth_error" when API key is invalid', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const status = await checkApiHealth();
      expect(status).toBe('auth_error');
    });

    it('should return "disconnected" when API returns bad status or throws error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Failure'));

      const status = await checkApiHealth();
      expect(status).toBe('disconnected');
    });
  });

  describe('getDashboardStats', () => {
    it('should return actual API data when dashboard stats request succeeds', async () => {
      const mockApiData = { summary: { total_customers: 100, churn_rate: 15.5 } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiData
      });

      const stats = await getDashboardStats();
      expect(stats).toEqual(mockApiData);
    });

    it('should fall back to local mock stats when request fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Timeout'));

      const stats = await getDashboardStats();
      expect(stats).toBeDefined();
      expect(stats.summary.total_customers).toBe(7043); // Matches MOCK_DASHBOARD_STATS
      expect(stats.churn_by_contract).toBeDefined();
    });
  });

  describe('predictChurn', () => {
    const testCustomer = {
      Gender: 'Female',
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
      Tenure: 2,
      MonthlyCharges: 70.00,
      TotalCharges: 140.00
    };

    it('should return API response if model execution succeeds', async () => {
      const mockResponse = { prediction: 'Likely to churn', shap_values: { Tenure: 0.1 } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await predictChurn(testCustomer);
      expect(result).toEqual(mockResponse);
    });

    it('should execute rule-based mock model if server connection fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Server Offline'));

      const result = await predictChurn(testCustomer);
      expect(result).toBeDefined();
      expect(result.prediction).toBe('Likely to churn');
      expect(result.probability).toBeGreaterThanOrEqual(0.35); // Matches high risk
      expect(result.shap_values).toBeDefined();
      expect(result.shap_values['Contract_Month-to-month']).toBeDefined();
    });

    it('should predict low risk for loyal contract profiles on mock fallback', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Server Offline'));

      const loyalCustomer = {
        ...testCustomer,
        Contract: 'Two year',
        Tenure: 72,
        InternetService: 'No',
        TechSupport: 'Yes',
        PaymentMethod: 'Credit card (automatic)',
        MonthlyCharges: 20.00,
        TotalCharges: 1440.00
      };

      const result = await predictChurn(loyalCustomer);
      expect(result.prediction).toBe('Not likely to churn');
      expect(result.probability).toBeLessThan(0.35);
    });
  });
});
