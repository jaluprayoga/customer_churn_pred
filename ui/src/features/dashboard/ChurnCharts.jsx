import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import Card from '../../components/Card';

const ChurnCharts = ({ stats }) => {
  // Transform Contract Data
  const contractData = Object.entries(stats.churn_by_contract).map(([key, val]) => ({
    name: key,
    Retained: val.retained,
    Churned: val.churned,
    "Churn Rate (%)": val.rate
  }));

  // Transform Internet Service Data
  const internetData = Object.entries(stats.churn_by_internet_service).map(([key, val]) => ({
    name: key,
    Retained: val.retained,
    Churned: val.churned,
    "Churn Rate (%)": val.rate
  }));

  // Transform Tenure Cohort Data
  const tenureData = Object.entries(stats.churn_by_tenure_cohort).map(([key, val]) => ({
    name: key.replace(" Months", ""),
    Retained: val.retained,
    Churned: val.churned,
    "Churn Rate (%)": val.rate
  }));

  // Transform Tech Support Data
  const techSupportData = Object.entries(stats.churn_by_tech_support).map(([key, val]) => ({
    name: key,
    Retained: val.retained,
    Churned: val.churned,
    "Churn Rate (%)": val.rate
  }));

  const formatTooltip = (value, name) => {
    if (name === "Churn Rate (%)") return [`${value}%`, name];
    return [value.toLocaleString(), name];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Contract & Internet Service charts grid */}
      <div className="charts-grid">
        {/* Churn by Contract Type */}
        <Card 
          title="Churn Risk by Contract Type" 
          subtitle="Short term month-to-month contracts account for the overwhelming majority of churn incidents"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="Retained" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Churned" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Churn by Internet Service */}
        <Card 
          title="Churn Risk by Internet Service Type" 
          subtitle="Customers on high-speed Fiber Optic lines show significantly higher churn rate vs. standard DSL"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={internetData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="Retained" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tenure Cohorts and Support features */}
      <div className="charts-grid">
        {/* Churn by Tenure Cohort */}
        <Card 
          title="Churn Rate by Tenure Cohort (Retention Decay)" 
          subtitle="Line curve highlights high risk within first year of acquisition, which decays as tenure increases"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tenureData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 60]} unit="%" />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="Retained" fill="#cbd5e1" yAxisId="left" opacity={0.4} />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Churn Rate (%)" 
                  stroke="#818cf8" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Churn by Tech Support Availability */}
        <Card 
          title="Churn vs. Tech Support Availability" 
          subtitle="Customers who do not receive Tech Support churn at double the average rate"
        >
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techSupportData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="Retained" fill="#34d399" />
                <Bar dataKey="Churned" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default ChurnCharts;
