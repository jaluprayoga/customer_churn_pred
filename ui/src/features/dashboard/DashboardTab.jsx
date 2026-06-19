import React, { useState, useEffect } from 'react';
import { Users, UserX, UserCheck, DollarSign, Clock, RefreshCw } from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import ChurnCharts from './ChurnCharts';
import DemographicsGrid from './DemographicsGrid';
import Loading from '../../components/Loading';
import { getDashboardStats } from '../../utils/api';

const DashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await getDashboardStats();
      if (data && !data.error) {
        setStats(data);
        setError(null);
      } else {
        setError(data?.error || 'Failed to load dashboard statistics.');
      }
    } catch (err) {
      setError('An unexpected error occurred while loading statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleSettingsChange = () => {
      fetchStats();
    };

    window.addEventListener('api-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('api-settings-changed', handleSettingsChange);
    };
  }, []);

  if (loading) {
    return <Loading message="Analyzing customer database and compiling KPIs..." />;
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.1rem' }}>{error}</p>
        <button onClick={() => fetchStats()} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Retry Fetching Data
        </button>
      </div>
    );
  }

  const { summary } = stats;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title section with reload button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            System Analytics Overview
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Historical trends and demographic churn indicators compiled from the customer database
          </p>
        </div>
        <button 
          onClick={() => fetchStats(true)} 
          className="btn btn-secondary" 
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '40px' }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Reloading...' : 'Reload Data'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <MetricCard 
          title="Total Customers" 
          value={summary.total_customers.toLocaleString()} 
          icon={Users} 
          color="var(--primary)"
        />
        <MetricCard 
          title="Churn Rate" 
          value={summary.churn_rate} 
          suffix="%" 
          icon={UserX} 
          color="var(--danger)"
          change="Average 26.5%"
          isNegative={true}
        />
        <MetricCard 
          title="Retained Cohort" 
          value={summary.total_retained.toLocaleString()} 
          icon={UserCheck} 
          color="var(--success)"
        />
        <MetricCard 
          title="Avg Monthly Cost" 
          value={summary.average_monthly_charges} 
          prefix="$" 
          icon={DollarSign} 
          color="var(--accent)"
        />
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '0.5rem' }}>
        <MetricCard 
          title="Average Tenure" 
          value={summary.average_tenure} 
          suffix=" Months" 
          icon={Clock} 
          color="var(--warning)"
        />
        <MetricCard 
          title="Total Monthly Revenue" 
          value={Math.round(summary.total_monthly_charges).toLocaleString()} 
          prefix="$" 
          icon={DollarSign} 
          color="var(--success)"
        />
      </div>

      {/* Structured Churn Charts */}
      <ChurnCharts stats={stats} />

      {/* Demographic Split Profiles */}
      <DemographicsGrid demographics={stats.demographics} />
    </div>
  );
};

export default DashboardTab;
