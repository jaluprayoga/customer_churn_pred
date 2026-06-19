import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Fetching data from API...', height = '300px' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: height,
      width: '100%',
      gap: '1rem',
      color: 'var(--text-secondary)'
    }}>
      <Loader2 
        size={36} 
        className="glow-active" 
        style={{
          color: 'var(--primary)',
          animation: 'spin 1.2s linear infinite'
        }}
      />
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
      
      {/* Inline styles for spinner keyframes in case global stylesheet isn't fully loaded */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;
