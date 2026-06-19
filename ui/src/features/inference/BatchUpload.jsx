import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import Card from '../../components/Card';
import { predictChurn } from '../../utils/api';
import { SAMPLE_CSV_CONTENT } from '../../constants/mockData';

const BatchUpload = ({ onLoadSingle }) => {
  const [dataRows, setDataRows] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Parse CSV string into objects
  const parseCSV = (text) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV file is empty or missing headers.");
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      const expectedHeaders = [
        'Gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
        'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
        'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
        'PaperlessBilling', 'PaymentMethod', 'Tenure', 'MonthlyCharges', 'TotalCharges'
      ];

      // Validate headers (case insensitive)
      const lowercaseHeaders = headers.map(h => h.toLowerCase());
      const missing = expectedHeaders.filter(eh => !lowercaseHeaders.includes(eh.toLowerCase()));
      
      if (missing.length > 0) {
        throw new Error(`Missing expected columns: ${missing.join(', ')}`);
      }

      const rows = lines.slice(1).map((line, idx) => {
        const values = [];
        let currentVal = '';
        let insideQuote = false;

        // Simple CSV cell splitter that handles quotes correctly
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim());

        // Construct object mapping standard headers to cell values
        const rowObj = {};
        expectedHeaders.forEach(eh => {
          const matchIdx = headers.findIndex(h => h.toLowerCase() === eh.toLowerCase());
          let cellVal = values[matchIdx] !== undefined ? values[matchIdx] : '';
          
          // Cast numerics
          if (eh === 'Tenure') {
            rowObj[eh] = parseInt(cellVal) || 0;
          } else if (eh === 'MonthlyCharges' || eh === 'TotalCharges') {
            rowObj[eh] = parseFloat(cellVal) || 0.0;
          } else {
            rowObj[eh] = cellVal;
          }
        });

        return {
          id: idx + 1,
          ...rowObj
        };
      });

      setDataRows(rows);
      setResults([]);
      setError(null);
    } catch (err) {
      setError(err.message);
      setDataRows([]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      parseCSV(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    parseCSV(SAMPLE_CSV_CONTENT);
  };

  const handleRunBatchInference = async () => {
    if (dataRows.length === 0) return;
    setProcessing(true);
    setError(null);

    const batchResults = [];
    try {
      // Process sequential promises to prevent API rate limits or spam
      for (const row of dataRows) {
        const { id, ...payload } = row;
        try {
          const res = await predictChurn(payload);
          batchResults.push({
            id,
            success: true,
            prediction: res.prediction,
            probability: res.probability !== undefined ? res.probability : (res.prediction === 'Likely to churn' ? 0.78 : 0.12),
            data: row
          });
        } catch (rowErr) {
          batchResults.push({
            id,
            success: false,
            error: rowErr.message,
            data: row
          });
        }
      }
      setResults(batchResults);
    } catch (err) {
      setError("Critical failure during batch processing execution.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'telco_churn_inference_template.csv');
    a.click();
  };

  // Summarize batch outcomes
  const processedCount = results.length;
  const successfulCount = results.filter(r => r.success).length;
  const churnedCount = results.filter(r => r.success && r.prediction === 'Likely to churn').length;
  const batchChurnRate = processedCount > 0 ? ((churnedCount / successfulCount) * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Upload and Template Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        <Card title="Upload Customer Dataset" subtitle="Process bulk customers simultaneously by loading a CSV formatted spreadsheet">
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            background: 'var(--bg-tertiary)',
            transition: 'var(--transition)'
          }}
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => parseCSV(event.target.result);
              reader.readAsText(file);
            }
          }}
          >
            <Upload size={36} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Drag and drop your CSV file here, or click to browse
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Must contain headers and match model feature fields
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".csv" 
              onChange={handleFileUpload} 
            />
          </div>
        </Card>

        <Card title="Quick Templates & Sandbox" subtitle="Download our pre-structured schema CSV files or load sandbox mock rows immediately">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'center' }}>
            <button 
              onClick={handleLoadSample} 
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem' }}
            >
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Load Sandbox CSV Rows</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fills the buffer table with 6 dummy customer segments</span>
              </div>
            </button>

            <button 
              onClick={downloadSampleTemplate} 
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem' }}
            >
              <Download size={18} style={{ color: 'var(--accent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Download Template Schema</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get an empty spreadsheet containing appropriate headers</span>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--danger)',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          Error: {error}
        </div>
      )}

      {/* CSV Rows Table */}
      {dataRows.length > 0 && (
        <Card 
          title={`Customer Buffer Table (${dataRows.length} Rows)`} 
          subtitle="Review uploaded data. Click run to execute parallel model predictions."
          actions={
            <button 
              onClick={handleRunBatchInference} 
              disabled={processing}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              <span>{processing ? 'Processing Inferences...' : 'Execute Batch Inference'}</span>
            </button>
          }
        >
          {/* Summary KPIs for processed batches */}
          {processedCount > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              background: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Processed Rows</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
                  {successfulCount} / {processedCount}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted Churners</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>
                  {churnedCount}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch Churn Rate</span>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {batchChurnRate}%
                </p>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              textAlign: 'left'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-secondary)',
                borderBottom: '2px solid var(--border-color)',
                zIndex: 10
              }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Row</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contract</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tenure</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Monthly Cost</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Internet ISP</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tech Support</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Outcome</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row) => {
                  const res = results.find(r => r.id === row.id);
                  let riskTag = null;

                  if (res) {
                    if (res.success) {
                      const isHigh = res.prediction === 'Likely to churn';
                      const color = isHigh ? 'var(--danger)' : 'var(--success)';
                      const bg = isHigh ? 'var(--danger-light)' : 'var(--success-light)';
                      
                      riskTag = (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color,
                          background: bg,
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {isHigh ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          <span>{res.prediction}</span>
                        </span>
                      );
                    } else {
                      riskTag = <span style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>Err: {res.error}</span>;
                    }
                  }

                  return (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: res && res.success && res.prediction === 'Likely to churn' ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                        transition: 'var(--transition)'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.id}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.Contract}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.Tenure}m</td>
                      <td style={{ padding: '0.75rem 1rem' }}>${row.MonthlyCharges}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.InternetService}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{row.TechSupport}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        {res && res.success ? `${Math.round(res.probability * 100)}%` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{riskTag || <span style={{ color: 'var(--text-muted)' }}>Pending</span>}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => onLoadSingle(row)}
                          className="btn btn-secondary"
                          title="Load into Form for full SHAP explanation"
                          style={{
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            width: '28px',
                            height: '28px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg-secondary)'
                          }}
                        >
                          <Eye size={14} style={{ color: 'var(--primary)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
};

export default BatchUpload;
