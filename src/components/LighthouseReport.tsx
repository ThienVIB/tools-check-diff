import React from 'react';
import { LighthouseData } from '../types';
import './LighthouseReport.css';

interface LighthouseReportProps {
  devData: LighthouseData | null;
  prodData: LighthouseData | null;
}

export const LighthouseReport: React.FC<LighthouseReportProps> = ({ devData, prodData }) => {
  if (!devData && !prodData) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#0cce6b';
    if (score >= 50) return '#ffa400';
    return '#ff4e42';
  };

  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  };

  const formatMetric = (value: number): string => {
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${(value / 1000).toFixed(2)}s`;
  };

  const renderScoreCircle = (score: number, label: string) => {
    const color = getScoreColor(score);
    const className = getScoreClass(score);
    
    return (
      <div className={`score-circle ${className}`}>
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 339.292} 339.292`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-value">{score}</div>
        <div className="score-label">{label}</div>
      </div>
    );
  };

  const renderComparison = () => (
    <div className="lighthouse-comparison">
      <div className="comparison-column">
        <h3>Development</h3>
        {devData && (
          <>
            <div className="scores-grid">
              {renderScoreCircle(devData.performance, 'Performance')}
              {renderScoreCircle(devData.accessibility, 'Accessibility')}
              {renderScoreCircle(devData.bestPractices, 'Best Practices')}
              {renderScoreCircle(devData.seo, 'SEO')}
              {renderScoreCircle(devData.pwa, 'PWA')}
            </div>
            
            <div className="metrics-section">
              <h4>Core Web Vitals</h4>
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-name">First Contentful Paint</span>
                  <span className="metric-value">{formatMetric(devData.metrics.firstContentfulPaint)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Largest Contentful Paint</span>
                  <span className="metric-value">{formatMetric(devData.metrics.largestContentfulPaint)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Total Blocking Time</span>
                  <span className="metric-value">{formatMetric(devData.metrics.totalBlockingTime)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Cumulative Layout Shift</span>
                  <span className="metric-value">{devData.metrics.cumulativeLayoutShift.toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Speed Index</span>
                  <span className="metric-value">{formatMetric(devData.metrics.speedIndex)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Time to Interactive</span>
                  <span className="metric-value">{formatMetric(devData.metrics.timeToInteractive)}</span>
                </div>
              </div>
            </div>

            {devData.opportunities.length > 0 && (
              <div className="opportunities-section">
                <h4>Opportunities</h4>
                <ul className="opportunities-list">
                  {devData.opportunities.map((opp, idx) => (
                    <li key={idx} className="opportunity-item">
                      <strong>{opp.title}</strong>
                      <p>{opp.description}</p>
                      <span className="savings">Potential savings: {formatMetric(opp.savings)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="comparison-column">
        <h3>Production</h3>
        {prodData && (
          <>
            <div className="scores-grid">
              {renderScoreCircle(prodData.performance, 'Performance')}
              {renderScoreCircle(prodData.accessibility, 'Accessibility')}
              {renderScoreCircle(prodData.bestPractices, 'Best Practices')}
              {renderScoreCircle(prodData.seo, 'SEO')}
              {renderScoreCircle(prodData.pwa, 'PWA')}
            </div>

            <div className="metrics-section">
              <h4>Core Web Vitals</h4>
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-name">First Contentful Paint</span>
                  <span className="metric-value">{formatMetric(prodData.metrics.firstContentfulPaint)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Largest Contentful Paint</span>
                  <span className="metric-value">{formatMetric(prodData.metrics.largestContentfulPaint)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Total Blocking Time</span>
                  <span className="metric-value">{formatMetric(prodData.metrics.totalBlockingTime)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Cumulative Layout Shift</span>
                  <span className="metric-value">{prodData.metrics.cumulativeLayoutShift.toFixed(3)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Speed Index</span>
                  <span className="metric-value">{formatMetric(prodData.metrics.speedIndex)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-name">Time to Interactive</span>
                  <span className="metric-value">{formatMetric(prodData.metrics.timeToInteractive)}</span>
                </div>
              </div>
            </div>

            {prodData.opportunities.length > 0 && (
              <div className="opportunities-section">
                <h4>Opportunities</h4>
                <ul className="opportunities-list">
                  {prodData.opportunities.map((opp, idx) => (
                    <li key={idx} className="opportunity-item">
                      <strong>{opp.title}</strong>
                      <p>{opp.description}</p>
                      <span className="savings">Potential savings: {formatMetric(opp.savings)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="lighthouse-report">
      <div className="lighthouse-header">
        <h2>🔦 Lighthouse Analysis</h2>
        <p className="lighthouse-description">
          Google Lighthouse performance, accessibility, and SEO audit
        </p>
      </div>
      {renderComparison()}
    </div>
  );
};
