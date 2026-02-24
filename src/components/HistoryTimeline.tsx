import React, { useState, useMemo } from 'react';
import { HistoryManager } from '../utils/historyManager';
import { ComparisonHistory } from '../types';
import './HistoryTimeline.css';

export const HistoryTimeline: React.FC = () => {
  const [history, setHistory] = useState<ComparisonHistory[]>(HistoryManager.getAll());
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [selectedItem, setSelectedItem] = useState<ComparisonHistory | null>(null);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    
    return history.filter(item => {
      if (filter === 'errors') {
        return item.alerts.some(a => a.type === 'error');
      } else if (filter === 'warnings') {
        return item.alerts.some(a => a.type === 'warning');
      }
      return true;
    });
  }, [history, filter]);

  const statistics = HistoryManager.getStatistics();

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      HistoryManager.clear();
      setHistory([]);
      setSelectedItem(null);
    }
  };

  const handleDelete = (id: string) => {
    if (HistoryManager.delete(id)) {
      setHistory(HistoryManager.getAll());
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleExportJSON = () => {
    HistoryManager.downloadJSON();
  };

  const handleExportCSV = () => {
    HistoryManager.downloadCSV();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getAlertSummary = (item: ComparisonHistory) => {
    const errors = item.alerts.filter(a => a.type === 'error').length;
    const warnings = item.alerts.filter(a => a.type === 'warning').length;
    return { errors, warnings };
  };

  return (
    <div className="history-timeline">
      <div className="history-header">
        <h2>📈 Comparison History & Timeline</h2>
        <div className="history-actions">
          <button onClick={handleExportJSON} className="btn-export">
            Export JSON
          </button>
          <button onClick={handleExportCSV} className="btn-export">
            Export CSV
          </button>
          <button onClick={handleClear} className="btn-clear">
            Clear All
          </button>
        </div>
      </div>

      {statistics && (
        <div className="history-statistics">
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-info">
              <span className="stat-value">{statistics.totalComparisons}</span>
              <span className="stat-label">Total Comparisons</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">❌</span>
            <div className="stat-info">
              <span className="stat-value">{statistics.totalErrors}</span>
              <span className="stat-label">Total Errors</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⚠️</span>
            <div className="stat-info">
              <span className="stat-value">{statistics.totalWarnings}</span>
              <span className="stat-label">Total Warnings</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📉</span>
            <div className="stat-info">
              <span className="stat-value">{statistics.averageAlertsPerComparison}</span>
              <span className="stat-label">Avg Alerts</span>
            </div>
          </div>
        </div>
      )}

      <div className="history-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({history.length})
        </button>
        <button
          className={filter === 'errors' ? 'active' : ''}
          onClick={() => setFilter('errors')}
        >
          Errors ({history.filter(h => h.alerts.some(a => a.type === 'error')).length})
        </button>
        <button
          className={filter === 'warnings' ? 'active' : ''}
          onClick={() => setFilter('warnings')}
        >
          Warnings ({history.filter(h => h.alerts.some(a => a.type === 'warning')).length})
        </button>
      </div>

      <div className="history-content">
        <div className="timeline">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>No comparison history yet</p>
            </div>
          ) : (
            filteredHistory.reverse().map((item) => {
              const { errors, warnings } = getAlertSummary(item);
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  className={`timeline-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-card">
                    <div className="timeline-header">
                      <span className="timeline-date">{formatDate(item.timestamp)}</span>
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="timeline-urls">
                      <div className="url-item">
                        <span className="url-label">Dev:</span>
                        <span className="url-value">{item.devUrl}</span>
                      </div>
                      <div className="url-item">
                        <span className="url-label">Prod:</span>
                        <span className="url-value">{item.prodUrl}</span>
                      </div>
                    </div>
                    <div className="timeline-alerts">
                      {errors > 0 && (
                        <span className="alert-badge error">❌ {errors} Error{errors > 1 ? 's' : ''}</span>
                      )}
                      {warnings > 0 && (
                        <span className="alert-badge warning">⚠️ {warnings} Warning{warnings > 1 ? 's' : ''}</span>
                      )}
                      {errors === 0 && warnings === 0 && (
                        <span className="alert-badge success">✅ No Issues</span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="timeline-details">
                        <h4>Comparison Results</h4>
                        
                        {item.alerts.length > 0 && (
                          <div className="details-alerts">
                            <h5>Alerts:</h5>
                            <ul>
                              {item.alerts.map((alert, idx) => (
                                <li key={idx} className={`alert-item ${alert.type}`}>
                                  <strong>[{alert.category}]</strong> {alert.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.results.dom && (
                          <div className="details-section">
                            <h5>DOM Changes:</h5>
                            <ul>
                              <li>Scripts: {item.results.dom.scriptsDiff > 0 ? '+' : ''}{item.results.dom.scriptsDiff}</li>
                              <li>Images: {item.results.dom.imagesDiff > 0 ? '+' : ''}{item.results.dom.imagesDiff}</li>
                              <li>Elements: {item.results.dom.totalElementsDiff > 0 ? '+' : ''}{item.results.dom.totalElementsDiff}</li>
                            </ul>
                          </div>
                        )}

                        {item.visualDiff && (
                          <div className="details-section">
                            <h5>Visual Changes:</h5>
                            <p>Pixel difference: {item.visualDiff.percentageDiff.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
