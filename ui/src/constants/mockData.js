import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

// 1. High-fidelity Mock Dashboard Stats
export const MOCK_DASHBOARD_STATS = {
  summary: {
    total_customers: 7043,
    churn_rate: 26.54,
    total_churned: 1869,
    total_retained: 5174,
    total_monthly_charges: 456116.6,
    average_monthly_charges: 64.76,
    average_tenure: 32.37
  },
  churn_by_contract: {
    "Month-to-month": { churned: 1655, retained: 2220, rate: 42.71 },
    "One year": { churned: 166, retained: 1307, rate: 11.27 },
    "Two year": { churned: 48, retained: 1647, rate: 2.83 }
  },
  churn_by_internet_service: {
    "Fiber optic": { churned: 1297, retained: 1799, rate: 41.89 },
    "DSL": { churned: 459, retained: 1962, rate: 18.96 },
    "No": { churned: 113, retained: 1413, rate: 7.40 }
  },
  churn_by_payment_method: {
    "Electronic check": { churned: 1071, retained: 1294, rate: 45.29 },
    "Mailed check": { churned: 308, retained: 1304, rate: 19.11 },
    "Bank transfer (automatic)": { churned: 258, retained: 1286, rate: 16.71 },
    "Credit card (automatic)": { churned: 232, retained: 1290, rate: 15.24 }
  },
  churn_by_tenure_cohort: {
    "0-12 Months": { churned: 1037, retained: 1149, rate: 47.44 },
    "13-24 Months": { churned: 294, retained: 730, rate: 28.71 },
    "25-48 Months": { churned: 335, retained: 1259, rate: 21.02 },
    "49-72 Months": { churned: 203, retained: 2036, rate: 9.07 }
  },
  churn_by_tech_support: {
    "No": { churned: 1446, retained: 2027, rate: 41.64 },
    "Yes": { churned: 310, retained: 1734, rate: 15.17 },
    "No internet service": { churned: 113, retained: 1413, rate: 7.40 }
  },
  demographics: {
    gender: {
      "Male": { churned: 930, retained: 2625, rate: 26.16 },
      "Female": { churned: 939, retained: 2549, rate: 26.92 }
    },
    senior_citizen: {
      "No": { churned: 1393, retained: 4508, rate: 23.60 },
      "Yes": { churned: 476, retained: 666, rate: 41.68 }
    },
    partner: {
      "No": { churned: 1200, retained: 2441, rate: 32.96 },
      "Yes": { churned: 669, retained: 2733, rate: 19.66 }
    },
    dependents: {
      "No": { churned: 1543, retained: 3390, rate: 31.28 },
      "Yes": { churned: 326, retained: 1784, rate: 15.45 }
    }
  },
  charges_distribution: {
    churned: { average: 74.44, min: 18.85, max: 118.35, quantiles: [18.85, 56.15, 79.65, 94.20, 118.35] },
    retained: { average: 61.27, min: 18.25, max: 118.75, quantiles: [18.25, 25.10, 64.42, 88.40, 118.75] }
  }
};

// 2. Preset customer profiles for quick forms loading
export const PRESETS = [
  {
    id: 'high-risk',
    name: 'High-Risk Profile',
    icon: ShieldAlert,
    color: 'var(--danger)',
    description: 'New month-to-month customer on high cost Fiber Optic with no protection services.',
    data: {
      Gender: 'Female',
      Partner: 'No',
      Dependents: 'No',
      PhoneService: 'Yes',
      MultipleLines: 'Yes',
      InternetService: 'Fiber optic',
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'Yes',
      StreamingMovies: 'Yes',
      Contract: 'Month-to-month',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Electronic check',
      Tenure: 3,
      MonthlyCharges: 98.65,
      TotalCharges: 295.95
    }
  },
  {
    id: 'loyal-vip',
    name: 'Loyal VIP Profile',
    icon: ShieldCheck,
    color: 'var(--success)',
    description: 'Long-term customer with double-year contract, bundled discounts, and automatic billing.',
    data: {
      Gender: 'Male',
      Partner: 'Yes',
      Dependents: 'Yes',
      PhoneService: 'Yes',
      MultipleLines: 'Yes',
      InternetService: 'DSL',
      OnlineSecurity: 'Yes',
      OnlineBackup: 'Yes',
      DeviceProtection: 'Yes',
      TechSupport: 'Yes',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'Two year',
      PaperlessBilling: 'No',
      PaymentMethod: 'Credit card (automatic)',
      Tenure: 72,
      MonthlyCharges: 64.85,
      TotalCharges: 4669.20
    }
  },
  {
    id: 'average',
    name: 'Standard Customer',
    icon: Shield,
    color: 'var(--primary)',
    description: 'Mid-term customer on one-year plan with basic internet service.',
    data: {
      Gender: 'Male',
      Partner: 'No',
      Dependents: 'No',
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: 'DSL',
      OnlineSecurity: 'No',
      OnlineBackup: 'Yes',
      DeviceProtection: 'No',
      TechSupport: 'No',
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: 'One year',
      PaperlessBilling: 'Yes',
      PaymentMethod: 'Mailed check',
      Tenure: 24,
      MonthlyCharges: 49.95,
      TotalCharges: 1198.80
    }
  }
];

// 3. Sample CSV content for bulk batch execution tests
export const SAMPLE_CSV_CONTENT = `Gender,Partner,Dependents,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,Tenure,MonthlyCharges,TotalCharges
Female,No,No,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,2,70.7,151.65
Male,No,No,Yes,No,DSL,Yes,No,Yes,No,No,No,Month-to-month,Yes,Mailed check,8,56.95,455.7
Female,Yes,No,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,28,104.8,3019.1
Male,No,No,Yes,No,DSL,Yes,Yes,No,Yes,No,No,One year,No,Mailed check,49,59.9,2871.3
Male,Yes,No,Yes,Yes,Fiber optic,Yes,No,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),72,115.5,8312.4
Female,No,No,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Month-to-month,Yes,Bank transfer (automatic),10,20.05,200.5`;
