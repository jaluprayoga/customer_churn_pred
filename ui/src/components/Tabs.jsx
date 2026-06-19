import React from 'react';

const Tabs = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-tertiary)',
      padding: '0.4rem',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-color)',
      alignSelf: 'center',
      marginBottom: '1rem',
      gap: '0.25rem'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: isActive ? 'var(--bg-secondary)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isActive ? 'var(--shadow-md)' : 'none',
              border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: isActive ? 700 : 500
            }}
          >
            {Icon && <Icon size={16} />}
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
