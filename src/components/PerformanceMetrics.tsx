import React from 'react';
import { PerformanceData } from '../types';
import { formatBytes, getScoreColor } from '../utils/helpers';
import './PerformanceMetrics.css';

interface PerformanceMetricsProps {
  devData: PerformanceData;
  prodData: PerformanceData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ devData, prodData }) => {
  const renderScoreCircle = (score: number, label: string) => {
    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="score-circle">
        <svg width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dy="7"
            fontSize="24"
            fontWeight="bold"
            fill={color}
          >
            {score}
          </text>
        </svg>
        <div className="score-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="performance-metrics">
      <h2>⚡ Performance Metrics</h2>

      <div className="legend">
        <span className="legend-item dev">🟢 Dev</span>
        <span className="legend-item prod">🔵 Prod</span>
      </div>

      <div className="scores-container">
        <div className="score-wrapper dev">
          {renderScoreCircle(devData.score, 'Dev Score')}
        </div>
        <div className="score-wrapper prod">
          {renderScoreCircle(prodData.score, 'Prod Score')}
        </div>
      </div>

      <div className="metrics-section">
        <h3>HTML Size</h3>
        <div className="metric-row">
          <div className="metric-value dev">
            <span className="value">{formatBytes(devData.htmlSize)}</span>
          </div>
          <div className="metric-label">HTML Size</div>
          <div className="metric-value prod">
            <span className="value">{formatBytes(prodData.htmlSize)}</span>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>Resource Counts</h3>
        <div className="resource-grid">
          <div className="resource-col dev">
            <h4>🟢 Dev</h4>
            <div className="resource-item">
              <span>Scripts:</span>
              <strong>{devData.resourceCounts.scripts}</strong>
            </div>
            <div className="resource-item">
              <span>Styles:</span>
              <strong>{devData.resourceCounts.styles}</strong>
            </div>
            <div className="resource-item">
              <span>Images:</span>
              <strong>{devData.resourceCounts.images}</strong>
            </div>
            <div className="resource-item total">
              <span>Total:</span>
              <strong>{devData.resourceCounts.total}</strong>
            </div>
          </div>
          <div className="resource-col prod">
            <h4>🔵 Prod</h4>
            <div className="resource-item">
              <span>Scripts:</span>
              <strong>{prodData.resourceCounts.scripts}</strong>
            </div>
            <div className="resource-item">
              <span>Styles:</span>
              <strong>{prodData.resourceCounts.styles}</strong>
            </div>
            <div className="resource-item">
              <span>Images:</span>
              <strong>{prodData.resourceCounts.images}</strong>
            </div>
            <div className="resource-item total">
              <span>Total:</span>
              <strong>{prodData.resourceCounts.total}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>Optimization Recommendations</h3>
        <div className="recommendations-grid">
          <div className="rec-col dev">
            <h4>🟢 Dev</h4>
            {devData.recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation">{rec}</div>
            ))}
          </div>
          <div className="rec-col prod">
            <h4>🔵 Prod</h4>
            {prodData.recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation">{rec}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
