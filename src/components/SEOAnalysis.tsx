import React from 'react';
import { SEOData } from '../types';
import './SEOAnalysis.css';

interface SEOAnalysisProps {
  devData: SEOData;
  prodData: SEOData;
}

const SEOAnalysis: React.FC<SEOAnalysisProps> = ({ devData, prodData }) => {
  const renderMetaComparison = (label: string, devValue: string, prodValue: string, maxLength?: number) => {
    const isSame = devValue === prodValue;
    const devLength = devValue.length;
    const prodLength = prodValue.length;
    
    let devStatus = 'normal';
    let prodStatus = 'normal';
    
    if (maxLength) {
      if (devLength === 0) devStatus = 'error';
      else if (devLength < maxLength * 0.5 || devLength > maxLength) devStatus = 'warning';
      else devStatus = 'good';
      
      if (prodLength === 0) prodStatus = 'error';
      else if (prodLength < maxLength * 0.5 || prodLength > maxLength) prodStatus = 'warning';
      else prodStatus = 'good';
    }
    
    return (
      <div className="meta-row">
        <div className="meta-label">{label}</div>
        <div className="meta-values">
          <div className={`meta-value dev ${!isSame ? 'different' : ''} ${devStatus}`}>
            <div className="value-text">{devValue || '(none)'}</div>
            {maxLength && devValue && (
              <div className="value-info">
                {devLength} chars {devStatus === 'good' && '✅'} {devStatus === 'warning' && '⚠️'} {devStatus === 'error' && '❌'}
              </div>
            )}
          </div>
          <div className={`meta-value prod ${!isSame ? 'different' : ''} ${prodStatus}`}>
            <div className="value-text">{prodValue || '(none)'}</div>
            {maxLength && prodValue && (
              <div className="value-info">
                {prodLength} chars {prodStatus === 'good' && '✅'} {prodStatus === 'warning' && '⚠️'} {prodStatus === 'error' && '❌'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="seo-analysis">
      <h2>🎯 SEO Analysis</h2>

      <div className="legend">
        <span className="legend-item dev">🟢 Dev</span>
        <span className="legend-item prod">🔵 Prod</span>
      </div>

      <div className="seo-section">
        <h3>Meta Tags</h3>
        {renderMetaComparison('Title', devData.title, prodData.title, 60)}
        {renderMetaComparison('Description', devData.description, prodData.description, 160)}
        {renderMetaComparison('Keywords', devData.keywords, prodData.keywords)}
        
        <div className="meta-stats">
          <div className="stat dev">
            <span>Title: {devData.title.length} chars</span>
            <span>Description: {devData.description.length} chars</span>
          </div>
          <div className="stat prod">
            <span>Title: {prodData.title.length} chars</span>
            <span>Description: {prodData.description.length} chars</span>
          </div>
        </div>
      </div>

      <div className="seo-section">
        <h3>Open Graph Tags</h3>
        {renderMetaComparison('OG Title', devData.ogTitle, prodData.ogTitle)}
        {renderMetaComparison('OG Description', devData.ogDescription, prodData.ogDescription)}
        {renderMetaComparison('OG Image', devData.ogImage, prodData.ogImage)}
        {renderMetaComparison('OG URL', devData.ogUrl, prodData.ogUrl)}
      </div>

      <div className="seo-section">
        <h3>H1 Tags Analysis</h3>
        <div className="h1-analysis">
          <div className="h1-col dev">
            <div className="h1-count">
              Count: <strong>{devData.h1Count}</strong>
              {devData.h1Count === 1 && <span className="badge good">✅ Best Practice</span>}
              {devData.h1Count > 1 && <span className="badge warning">⚠️ Multiple H1</span>}
              {devData.h1Count === 0 && <span className="badge error">❌ No H1</span>}
            </div>
            {devData.h1Texts.map((text, idx) => (
              <div key={idx} className="h1-text">{text}</div>
            ))}
          </div>
          <div className="h1-col prod">
            <div className="h1-count">
              Count: <strong>{prodData.h1Count}</strong>
              {prodData.h1Count === 1 && <span className="badge good">✅ Best Practice</span>}
              {prodData.h1Count > 1 && <span className="badge warning">⚠️ Multiple H1</span>}
              {prodData.h1Count === 0 && <span className="badge error">❌ No H1</span>}
            </div>
            {prodData.h1Texts.map((text, idx) => (
              <div key={idx} className="h1-text">{text}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="seo-section">
        <h3>Structured Data (JSON-LD)</h3>
        <div className="structured-data">
          <div className="sd-col dev">
            <h4>🟢 Dev ({devData.structuredData.length} items)</h4>
            {devData.structuredData.map((data, idx) => (
              <pre key={idx} className="json-preview">
                {JSON.stringify(data, null, 2)}
              </pre>
            ))}
            {devData.structuredData.length === 0 && <p className="no-data">No structured data found</p>}
          </div>
          <div className="sd-col prod">
            <h4>🔵 Prod ({prodData.structuredData.length} items)</h4>
            {prodData.structuredData.map((data, idx) => (
              <pre key={idx} className="json-preview">
                {JSON.stringify(data, null, 2)}
              </pre>
            ))}
            {prodData.structuredData.length === 0 && <p className="no-data">No structured data found</p>}
          </div>
        </div>
      </div>

      <div className="seo-section">
        <h3>SEO Recommendations</h3>
        <div className="recommendations">
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

export default SEOAnalysis;
