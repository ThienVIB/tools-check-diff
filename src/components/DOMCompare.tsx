import React, { useState } from 'react';
import { DOMData, TagDetail, HeadingDetail } from '../types';
import './DOMCompare.css';

interface DOMCompareProps {
  devData: DOMData;
  prodData: DOMData;
}

const DOMCompare: React.FC<DOMCompareProps> = ({ devData, prodData }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (rowId: string) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };
  const renderComparison = (
    label: string, 
    devValue: number, 
    prodValue: number, 
    rowId: string,
    devDetails?: TagDetail[],
    prodDetails?: TagDetail[],
    goodThreshold?: { min?: number; max?: number },
    headingLevel?: number
  ) => {
    const diff = devValue - prodValue;
    const diffPercent = prodValue > 0 ? ((diff / prodValue) * 100).toFixed(1) : '∞';
    const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
    const isExpanded = expandedRow === rowId;
    const hasDetails = (devDetails && prodDetails) || headingLevel;
    
    // Determine if values are in good range
    let devStatus = 'normal';
    let prodStatus = 'normal';
    
    if (goodThreshold) {
      const { min = 0, max = Infinity } = goodThreshold;
      devStatus = devValue >= min && devValue <= max ? 'good' : 'warning';
      prodStatus = prodValue >= min && prodValue <= max ? 'good' : 'warning';
    }
    
    return (
      <div className="comparison-row-wrapper">
        <div 
          className={`comparison-row ${hasDetails ? 'expandable' : ''} ${isExpanded ? 'expanded' : ''}`}
          onClick={() => hasDetails && toggleRow(rowId)}
        >
          <div className="label">
            {hasDetails && (
              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
            )}
            {label}
          </div>
          <div className="values">
            <div className={`value dev ${devStatus}`}>
              {devValue}
              {devStatus === 'warning' && ' ⚠️'}
              {devStatus === 'good' && ' ✅'}
            </div>
            <div className={`diff ${diffClass}`}>
              <div className="diff-value">{diff > 0 ? '+' : ''}{diff}</div>
              {prodValue > 0 && Math.abs(diff) > 0 && (
                <div className="diff-percent">({diff > 0 ? '+' : ''}{diffPercent}%)</div>
              )}
            </div>
            <div className={`value prod ${prodStatus}`}>
              {prodValue}
              {prodStatus === 'warning' && ' ⚠️'}
              {prodStatus === 'good' && ' ✅'}
            </div>
          </div>
        </div>
        
        {isExpanded && hasDetails && (
          <div className="details-panel">
            {headingLevel 
              ? renderHeadingDetails(devData.detailedHeadings, prodData.detailedHeadings, headingLevel)
              : devDetails && prodDetails && renderTagDetails(label, devDetails, prodDetails)
            }
          </div>
        )}
      </div>
    );
  };

  const renderTagDetails = (label: string, devDetails: TagDetail[], prodDetails: TagDetail[]) => {
    // Find differences
    const devOnly: TagDetail[] = [];
    const prodOnly: TagDetail[] = [];
    const common: Array<{ dev: TagDetail; prod: TagDetail }> = [];

    const devMap = new Map(devDetails.map((d, i) => [JSON.stringify(d), { detail: d, index: i }]));
    const prodMap = new Map(prodDetails.map((d, i) => [JSON.stringify(d), { detail: d, index: i }]));

    // Find items only in dev
    devDetails.forEach(dev => {
      const key = JSON.stringify(dev);
      if (!prodMap.has(key)) {
        devOnly.push(dev);
      }
    });

    // Find items only in prod
    prodDetails.forEach(prod => {
      const key = JSON.stringify(prod);
      if (!devMap.has(key)) {
        prodOnly.push(prod);
      }
    });

    // Find common items
    const maxLength = Math.max(devDetails.length, prodDetails.length);
    for (let i = 0; i < maxLength; i++) {
      if (devDetails[i] && prodDetails[i]) {
        common.push({ dev: devDetails[i], prod: prodDetails[i] });
      }
    }

    return (
      <div className="details-content">
        <div className="details-grid">
          <div className="details-column dev-column">
            <h4>🟢 Dev ({devDetails.length})</h4>
            {devDetails.slice(0, 10).map((detail, idx) => (
              <div key={idx} className="detail-item">
                {renderTagDetail(label, detail, idx)}
              </div>
            ))}
            {devDetails.length > 10 && (
              <div className="detail-more">... and {devDetails.length - 10} more</div>
            )}
          </div>
          
          <div className="details-column prod-column">
            <h4>🔵 Prod ({prodDetails.length})</h4>
            {prodDetails.slice(0, 10).map((detail, idx) => (
              <div key={idx} className="detail-item">
                {renderTagDetail(label, detail, idx)}
              </div>
            ))}
            {prodDetails.length > 10 && (
              <div className="detail-more">... and {prodDetails.length - 10} more</div>
            )}
          </div>
        </div>

        {(devOnly.length > 0 || prodOnly.length > 0) && (
          <div className="differences-summary">
            {devOnly.length > 0 && (
              <div className="diff-group added">
                <strong>➕ Added in Dev: {devOnly.length}</strong>
              </div>
            )}
            {prodOnly.length > 0 && (
              <div className="diff-group removed">
                <strong>➖ Removed from Dev: {prodOnly.length}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTagDetail = (type: string, detail: TagDetail, index: number) => {
    if (type === 'Scripts') {
      return (
        <div className="tag-info">
          <div className="tag-index">#{index + 1}</div>
          {detail.src && <div className="tag-src">📄 {detail.src}</div>}
          {detail.content && <div className="tag-content">📝 {detail.content}...</div>}
          <div className="tag-attrs">
            {detail.attributes?.async === 'true' && <span className="badge">async</span>}
            {detail.attributes?.defer === 'true' && <span className="badge">defer</span>}
            <span className="badge-type">{detail.attributes?.type}</span>
          </div>
        </div>
      );
    } else if (type === 'Styles') {
      return (
        <div className="tag-info">
          <div className="tag-index">#{index + 1}</div>
          {detail.href && <div className="tag-src">🎨 {detail.href}</div>}
          {detail.content && <div className="tag-content">📝 {detail.content}...</div>}
          <div className="tag-attrs">
            <span className="badge">{detail.attributes?.media}</span>
          </div>
        </div>
      );
    } else if (type === 'Images') {
      return (
        <div className="tag-info">
          <div className="tag-index">#{index + 1}</div>
          <div className="tag-src">🖼️ {detail.src}</div>
          <div className="tag-alt">Alt: {detail.alt}</div>
          <div className="tag-attrs">
            <span className="badge">{detail.attributes?.width} × {detail.attributes?.height}</span>
            {detail.attributes?.loading === 'lazy' && <span className="badge good">lazy</span>}
          </div>
        </div>
      );
    } else if (type === 'Links') {
      return (
        <div className="tag-info">
          <div className="tag-index">#{index + 1}</div>
          <div className="tag-src">🔗 {detail.href}</div>
          <div className="tag-text">{detail.text}</div>
          <div className="tag-attrs">
            {detail.attributes?.target && <span className="badge">{detail.attributes.target}</span>}
            {detail.attributes?.rel && <span className="badge">{detail.attributes.rel}</span>}
          </div>
        </div>
      );
    } else if (type === 'Meta Tags') {
      return (
        <div className="tag-info">
          <div className="tag-index">#{index + 1}</div>
          {detail.attributes?.name && (
            <div className="tag-name">🏷️ {detail.attributes.name}</div>
          )}
          {detail.attributes?.content && (
            <div className="tag-content">{detail.attributes.content}</div>
          )}
          {detail.attributes?.charset && (
            <div className="tag-charset">Charset: {detail.attributes.charset}</div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderHeadingDetail = (heading: HeadingDetail, index: number) => {
    const levelEmojis = {
      1: '1️⃣',
      2: '2️⃣',
      3: '3️⃣',
      4: '4️⃣',
      5: '5️⃣',
      6: '6️⃣',
    };

    return (
      <div className="tag-info heading-info">
        <div className="tag-index">#{index + 1}</div>
        <div className="heading-level">
          {levelEmojis[heading.level]} H{heading.level}
        </div>
        <div className="heading-text">{heading.text || '(empty)'}</div>
        <div className="tag-attrs">
          {heading.id && <span className="badge">id: {heading.id}</span>}
          {heading.className && <span className="badge">class: {heading.className}</span>}
        </div>
      </div>
    );
  };

  const renderHeadingDetails = (devHeadings: HeadingDetail[], prodHeadings: HeadingDetail[], level?: number) => {
    const filterByLevel = (headings: HeadingDetail[]) => 
      level ? headings.filter(h => h.level === level) : headings;

    const devFiltered = filterByLevel(devHeadings);
    const prodFiltered = filterByLevel(prodHeadings);

    return (
      <div className="details-content">
        <div className="details-grid">
          <div className="details-column dev-column">
            <h4>🟢 Dev ({devFiltered.length})</h4>
            {devFiltered.map((heading, idx) => (
              <div key={idx} className="detail-item">
                {renderHeadingDetail(heading, idx)}
              </div>
            ))}
            {devFiltered.length === 0 && (
              <div className="detail-empty">No H{level} tags found</div>
            )}
          </div>
          
          <div className="details-column prod-column">
            <h4>🔵 Prod ({prodFiltered.length})</h4>
            {prodFiltered.map((heading, idx) => (
              <div key={idx} className="detail-item">
                {renderHeadingDetail(heading, idx)}
              </div>
            ))}
            {prodFiltered.length === 0 && (
              <div className="detail-empty">No H{level} tags found</div>
            )}
          </div>
        </div>

        {devFiltered.length !== prodFiltered.length && (
          <div className="differences-summary">
            {devFiltered.length > prodFiltered.length && (
              <div className="diff-group added">
                <strong>➕ {devFiltered.length - prodFiltered.length} more H{level} in Dev</strong>
              </div>
            )}
            {devFiltered.length < prodFiltered.length && (
              <div className="diff-group removed">
                <strong>➖ {prodFiltered.length - devFiltered.length} fewer H{level} in Dev</strong>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dom-compare">
      <h2>📊 DOM Structure Comparison</h2>
      
      <div className="legend">
        <span className="legend-item dev">🟢 Dev</span>
        <span className="legend-item prod">🔵 Prod</span>
      </div>

      <div className="comparison-section">
        <h3>Element Counts</h3>
        {renderComparison('Total Elements', devData.totalElements, prodData.totalElements, 'total')}
        {renderComparison('Scripts', devData.scripts, prodData.scripts, 'scripts', devData.detailedScripts, prodData.detailedScripts, { max: 20 })}
        {renderComparison('Styles', devData.styles, prodData.styles, 'styles', devData.detailedStyles, prodData.detailedStyles, { max: 5 })}
        {renderComparison('Images', devData.images, prodData.images, 'images', devData.detailedImages, prodData.detailedImages, { max: 50 })}
        {renderComparison('Links', devData.links, prodData.links, 'links', devData.detailedLinks, prodData.detailedLinks)}
        {renderComparison('Forms', devData.forms, prodData.forms, 'forms')}
        {renderComparison('Meta Tags', devData.detailedMetas.length, prodData.detailedMetas.length, 'metas', devData.detailedMetas, prodData.detailedMetas)}
      </div>

      <div className="comparison-section">
        <h3>Heading Structure (H1-H6)</h3>
        {renderComparison('H1', devData.headings.h1, prodData.headings.h1, 'h1', undefined, undefined, { min: 1, max: 1 }, 1)}
        {renderComparison('H2', devData.headings.h2, prodData.headings.h2, 'h2', undefined, undefined, undefined, 2)}
        {renderComparison('H3', devData.headings.h3, prodData.headings.h3, 'h3', undefined, undefined, undefined, 3)}
        {renderComparison('H4', devData.headings.h4, prodData.headings.h4, 'h4', undefined, undefined, undefined, 4)}
        {renderComparison('H5', devData.headings.h5, prodData.headings.h5, 'h5', undefined, undefined, undefined, 5)}
        {renderComparison('H6', devData.headings.h6, prodData.headings.h6, 'h6', undefined, undefined, undefined, 6)}
      </div>

      {(devData.h1Texts.length > 0 || prodData.h1Texts.length > 0) && (
        <div className="comparison-section">
          <h3>H1 Content</h3>
          <div className="h1-content">
            <div className="h1-column dev">
              <h4>🟢 Dev</h4>
              {devData.h1Texts.map((text, idx) => (
                <div key={idx} className="h1-text">{text || '(empty)'}</div>
              ))}
            </div>
            <div className="h1-column prod">
              <h4>🔵 Prod</h4>
              {prodData.h1Texts.map((text, idx) => (
                <div key={idx} className="h1-text">{text || '(empty)'}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DOMCompare;
