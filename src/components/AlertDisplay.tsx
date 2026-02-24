import React, { useState } from 'react';
import { AlertRule } from '../utils/alertSystem';
import './AlertDisplay.css';

interface AlertDisplayProps {
  alerts: AlertRule[];
}

export const AlertDisplay: React.FC<AlertDisplayProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-display success">
        <div className="success-message">
          <span className="success-icon">✅</span>
          <h3>No Issues Found!</h3>
          <p>All comparisons passed the configured thresholds.</p>
        </div>
      </div>
    );
  }

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  const alertsByCategory = filteredAlerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = [];
    }
    acc[alert.category].push(alert);
    return acc;
  }, {} as { [key: string]: AlertRule[] });

  const getTypeCount = (type: 'error' | 'warning' | 'info') => {
    return alerts.filter(alert => alert.type === type).length;
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Performance': '⚡',
      'SEO': '🔍',
      'DOM': '🏗️',
      'Links': '🔗',
      'Visual': '👁️',
      'Security': '🔒'
    };
    return icons[category] || '📊';
  };

  return (
    <div className="alert-display">
      <div className="alert-header">
        <h2>🚨 Alerts & Threshold Violations</h2>
        <div className="alert-summary">
          <span className="summary-item error">
            {getTypeCount('error')} Error{getTypeCount('error') !== 1 ? 's' : ''}
          </span>
          <span className="summary-item warning">
            {getTypeCount('warning')} Warning{getTypeCount('warning') !== 1 ? 's' : ''}
          </span>
          <span className="summary-item info">
            {getTypeCount('info')} Info
          </span>
        </div>
      </div>

      <div className="alert-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button
          className={filter === 'error' ? 'active error' : ''}
          onClick={() => setFilter('error')}
        >
          Errors ({getTypeCount('error')})
        </button>
        <button
          className={filter === 'warning' ? 'active warning' : ''}
          onClick={() => setFilter('warning')}
        >
          Warnings ({getTypeCount('warning')})
        </button>
        <button
          className={filter === 'info' ? 'active info' : ''}
          onClick={() => setFilter('info')}
        >
          Info ({getTypeCount('info')})
        </button>
      </div>

      <div className="alert-list">
        {Object.entries(alertsByCategory).map(([category, categoryAlerts]) => {
          const isExpanded = expandedCategories.has(category);
          const errorCount = categoryAlerts.filter(a => a.type === 'error').length;
          const warningCount = categoryAlerts.filter(a => a.type === 'warning').length;

          return (
            <div key={category} className={`alert-category ${isExpanded ? 'expanded' : ''}`}>
              <div 
                className="category-header" 
                onClick={() => toggleCategory(category)}
              >
                <div className="category-info">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-count">({categoryAlerts.length})</span>
                </div>
                <div className="category-badges">
                  {errorCount > 0 && (
                    <span className="badge error">{errorCount} Error{errorCount > 1 ? 's' : ''}</span>
                  )}
                  {warningCount > 0 && (
                    <span className="badge warning">{warningCount} Warning{warningCount > 1 ? 's' : ''}</span>
                  )}
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="category-alerts">
                  {categoryAlerts.map((alert, index) => (
                    <div key={index} className={`alert-item ${alert.type}`}>
                      <div className="alert-main">
                        <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                        <div className="alert-content">
                          <p className="alert-message">{alert.message}</p>
                          {alert.threshold !== undefined && (
                            <div className="alert-metrics">
                              <span className="metric">
                                Threshold: <strong>{alert.threshold}</strong>
                              </span>
                              {alert.actualValue !== undefined && (
                                <span className="metric">
                                  Actual: <strong>{alert.actualValue.toFixed(2)}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
