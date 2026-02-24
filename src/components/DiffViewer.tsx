import React, { useState, useMemo, useRef, useEffect } from 'react';
import { generateHTMLDiff, generateSideBySideDiff } from '../utils/helpers';
import { FilterType } from '../types';
import './DiffViewer.css';

interface DiffViewerProps {
  devHTML: string;
  prodHTML: string;
}

type ViewMode = 'unified' | 'split';

const DiffViewer: React.FC<DiffViewerProps> = ({ devHTML, prodHTML }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  
  // Refs for synchronized scrolling
  const prodPaneRef = useRef<HTMLDivElement>(null);
  const devPaneRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const diffResult = useMemo(() => {
    return generateHTMLDiff(prodHTML, devHTML);
  }, [devHTML, prodHTML]);

  const sideBySideDiff = useMemo(() => {
    return generateSideBySideDiff(prodHTML, devHTML);
  }, [devHTML, prodHTML]);

  const filteredDiff = useMemo(() => {
    let lines: Array<{ type: string; content: string; index: number }> = [];

    if (filter === 'all' || filter === 'added') {
      diffResult.added.forEach((line, idx) => {
        lines.push({ type: 'added', content: line, index: idx });
      });
    }

    if (filter === 'all' || filter === 'removed') {
      diffResult.removed.forEach((line, idx) => {
        lines.push({ type: 'removed', content: line, index: idx });
      });
    }

    if (searchTerm) {
      lines = lines.filter(line =>
        line.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return lines;
  }, [diffResult, filter, searchTerm]);

  const stats = {
    added: diffResult.added.length,
    removed: diffResult.removed.length,
    total: diffResult.all.length,
  };

  // Synchronized scrolling effect
  useEffect(() => {
    const prodPane = prodPaneRef.current;
    const devPane = devPaneRef.current;

    if (!prodPane || !devPane || viewMode !== 'split') return;

    const handleScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      return () => {
        if (isScrollingRef.current) return;
        
        isScrollingRef.current = true;
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
        
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 10);
      };
    };

    const prodScrollHandler = handleScroll(prodPane, devPane);
    const devScrollHandler = handleScroll(devPane, prodPane);

    prodPane.addEventListener('scroll', prodScrollHandler);
    devPane.addEventListener('scroll', devScrollHandler);

    return () => {
      prodPane.removeEventListener('scroll', prodScrollHandler);
      devPane.removeEventListener('scroll', devScrollHandler);
    };
  }, [viewMode]);

  return (
    <div className="diff-viewer">
      <h2>📝 HTML Diff Viewer</h2>

      <div className="diff-controls">
        <div className="diff-stats">
          <span className="stat added">+{stats.added} Added</span>
          <span className="stat removed">-{stats.removed} Removed</span>
          <span className="stat total">{stats.total} Changes</span>
        </div>

        <div className="view-mode-toggle">
          <button
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
            title="Side by side comparison"
          >
            ⚡ Split View
          </button>
          <button
            className={viewMode === 'unified' ? 'active' : ''}
            onClick={() => setViewMode('unified')}
            title="Unified diff view"
          >
            📋 Unified
          </button>
        </div>

        <div className="filter-controls">
          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'added' ? 'active' : ''}
              onClick={() => setFilter('added')}
            >
              Added
            </button>
            <button
              className={filter === 'removed' ? 'active' : ''}
              onClick={() => setFilter('removed')}
            >
              Removed
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search in diff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="diff-content split-view">
          <div className="split-container">
            <div className="split-pane prod-pane" ref={prodPaneRef}>
              <div className="pane-header">🔵 Production</div>
              <div className="pane-content">
                {sideBySideDiff.map((item, idx) => (
                  <div key={idx} className={`diff-line ${item.prodType}`}>
                    <span className="line-number">{item.prodLineNum || ''}</span>
                    <code className="line-content">{item.prodContent}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="split-pane dev-pane" ref={devPaneRef}>
              <div className="pane-header">🟢 Development</div>
              <div className="pane-content">
                {sideBySideDiff.map((item, idx) => (
                  <div key={idx} className={`diff-line ${item.devType}`}>
                    <span className="line-number">{item.devLineNum || ''}</span>
                    <code className="line-content">{item.devContent}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="diff-content unified-view">
          {filteredDiff.length === 0 ? (
            <div className="no-diff">
              {searchTerm
                ? 'No matching lines found'
                : filter === 'all'
                ? 'No differences found'
                : `No ${filter} lines found`}
            </div>
          ) : (
            <div className="diff-lines">
              {filteredDiff.map((line, idx) => (
                <div key={idx} className={`diff-line ${line.type}`}>
                  <span className="line-number">{idx + 1}</span>
                  <span className="line-indicator">
                    {line.type === 'added' ? '+' : '-'}
                  </span>
                  <code className="line-content">{line.content}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="diff-legend">
        <div className="legend-item">
          <span className="indicator added">+</span>
          <span>Added in Dev (not in Prod)</span>
        </div>
        <div className="legend-item">
          <span className="indicator removed">-</span>
          <span>Removed from Dev (exists in Prod)</span>
        </div>
        <div className="legend-item">
          <span className="indicator modified">~</span>
          <span>Modified between versions</span>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
