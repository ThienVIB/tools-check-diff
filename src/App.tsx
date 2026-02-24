import React, { useState } from 'react';
import URLInputForm from './components/URLInputForm';
import DOMCompare from './components/DOMCompare';
import SEOAnalysis from './components/SEOAnalysis';
import PerformanceMetrics from './components/PerformanceMetrics';
import DiffViewer from './components/DiffViewer';
import { ResourceTracker } from './components/ResourceTracker';
import { AlertDisplay } from './components/AlertDisplay';
import { HistoryTimeline } from './components/HistoryTimeline';
import { analyzeHTML } from './utils/analyzer';
import { analyzeResourcesFromHTML } from './utils/resourceTracker';
import { AlertSystem, DEFAULT_THRESHOLDS } from './utils/alertSystem';
import { HistoryManager } from './utils/historyManager';
import { URLData } from './types';
import './App.css';

type TabType = 'dom' | 'seo' | 'performance' | 'diff' | 'resources' | 'alerts' | 'lighthouse' | 'history';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devData, setDevData] = useState<URLData | null>(null);
  const [prodData, setProdData] = useState<URLData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dom');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [historyUpdated, setHistoryUpdated] = useState(0);

  // Load configuration from localStorage
  const getConfig = () => {
    try {
      const saved = localStorage.getItem('comparison-config');
      return saved ? JSON.parse(saved) : { thresholds: DEFAULT_THRESHOLDS };
    } catch {
      return { thresholds: DEFAULT_THRESHOLDS };
    }
  };

  const fetchHTML = async (url: string): Promise<string> => {
    try {
      // Thử fetch trực tiếp trước (cho URL nội bộ công ty)
      const directResponse = await fetch(url, {
        mode: 'cors',
        credentials: 'include', // Gửi kèm cookies nếu cần auth
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      if (directResponse.ok) {
        return await directResponse.text();
      }
      
      throw new Error('Direct fetch failed');
    } catch (directError) {
      // Nếu direct fetch thất bại (CORS block), dùng local proxy
      console.log('Direct fetch failed, trying local proxy...', directError);
      
      try {
        const proxyResponse = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        
        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch ${url} via proxy`);
        }
        
        return await proxyResponse.text();
      } catch (proxyError) {
        // Nếu local proxy cũng thất bại, thử CORS proxy public (cho external URLs)
        console.log('Local proxy failed, trying public CORS proxy...', proxyError);
        
        const corsProxyUrl = 'https://api.allorigins.win/raw?url=';
        const corsResponse = await fetch(corsProxyUrl + encodeURIComponent(url));
        
        if (!corsResponse.ok) {
          throw new Error(`Không thể fetch ${url}. Kiểm tra: 1) URL có đúng không, 2) Bạn có kết nối mạng nội bộ không (nếu là URL dev)`);
        }
        
        return await corsResponse.text();
      }
    }
  };

  const handleSubmit = async (devUrl: string, prodUrl: string) => {
    setLoading(true);
    setError('');
    setDevData(null);
    setProdData(null);
    setAlerts([]);

    try {
      // Fetch both URLs
      const [devHTML, prodHTML] = await Promise.all([
        fetchHTML(devUrl),
        fetchHTML(prodUrl),
      ]);

      // Analyze both HTMLs
      const devAnalysis = analyzeHTML(devHTML, devUrl);
      const prodAnalysis = analyzeHTML(prodHTML, prodUrl);

      // Analyze resources from HTML (now async)
      const [devResources, prodResources] = await Promise.all([
        analyzeResourcesFromHTML(devHTML, devUrl),
        analyzeResourcesFromHTML(prodHTML, prodUrl)
      ]);

      const devURLData: URLData = {
        url: devUrl,
        html: devHTML,
        ...devAnalysis,
        resources: devResources
      };

      const prodURLData: URLData = {
        url: prodUrl,
        html: prodHTML,
        ...prodAnalysis,
        resources: prodResources
      };

      setDevData(devURLData);
      setProdData(prodURLData);

      // Run alert system
      const config = getConfig();
      const alertSystem = new AlertSystem(config.thresholds);
      
      // Check thresholds
      alertSystem.checkHTMLSize(devHTML.length, prodHTML.length);
      alertSystem.checkScriptCount(devAnalysis.dom.scripts, prodAnalysis.dom.scripts);
      alertSystem.checkImageCount(devAnalysis.dom.images, prodAnalysis.dom.images);
      alertSystem.checkPerformanceScore(devAnalysis.performance.score, prodAnalysis.performance.score);
      alertSystem.checkMetaTags(devAnalysis.seo, prodAnalysis.seo);

      const generatedAlerts = alertSystem.getAlerts();
      setAlerts(generatedAlerts);

      // Save to history
      HistoryManager.save({
        devUrl,
        prodUrl,
        results: {
          dom: {
            totalElementsDiff: prodAnalysis.dom.totalElements - devAnalysis.dom.totalElements,
            scriptsDiff: prodAnalysis.dom.scripts - devAnalysis.dom.scripts,
            imagesDiff: prodAnalysis.dom.images - devAnalysis.dom.images,
            stylesDiff: prodAnalysis.dom.styles - devAnalysis.dom.styles
          },
          seo: {
            titleMatch: devAnalysis.seo.title === prodAnalysis.seo.title,
            descriptionMatch: devAnalysis.seo.description === prodAnalysis.seo.description
          },
          performance: {
            scoreDiff: prodAnalysis.performance.score - devAnalysis.performance.score
          }
        },
        alerts: generatedAlerts
      });

      setHistoryUpdated(prev => prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔍 URL Comparison Tool</h1>
        <p className="app-subtitle">Professional Dev vs Production Comparison Suite</p>
      </header>

      <URLInputForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div className="error-banner">
          ❌ Error: {error}
          <br />
          <small>
            Note: Some websites may block CORS requests. Try using URLs that allow cross-origin access.
          </small>
        </div>
      )}

      {devData && prodData && (
        <div className="results-container">
          {/* Alert Summary Card */}
          {alerts.length > 0 && (
            <div className="alert-summary-card">
              <span className="summary-icon">🚨</span>
              <span className="summary-text">
                {alerts.filter(a => a.type === 'error').length} Errors, {' '}
                {alerts.filter(a => a.type === 'warning').length} Warnings detected
              </span>
              <button onClick={() => setActiveTab('alerts')} className="view-alerts-btn">
                View Details →
              </button>
            </div>
          )}

          <div className="tabs">
            <button
              className={activeTab === 'dom' ? 'active' : ''}
              onClick={() => setActiveTab('dom')}
            >
              📊 DOM
            </button>
            <button
              className={activeTab === 'seo' ? 'active' : ''}
              onClick={() => setActiveTab('seo')}
            >
              🎯 SEO
            </button>
            <button
              className={activeTab === 'performance' ? 'active' : ''}
              onClick={() => setActiveTab('performance')}
            >
              ⚡ Performance
            </button>
            <button
              className={activeTab === 'resources' ? 'active' : ''}
              onClick={() => setActiveTab('resources')}
            >
              🗂️ Resources
            </button>
            <button
              className={activeTab === 'diff' ? 'active' : ''}
              onClick={() => setActiveTab('diff')}
            >
              📝 Diff
            </button>
            {alerts.length > 0 && (
              <button
                className={`${activeTab === 'alerts' ? 'active' : ''} alert-tab`}
                onClick={() => setActiveTab('alerts')}
              >
                🚨 Alerts ({alerts.length})
              </button>
            )}
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              📈 History
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'dom' && (
              <DOMCompare devData={devData.dom} prodData={prodData.dom} />
            )}
            {activeTab === 'seo' && (
              <SEOAnalysis devData={devData.seo} prodData={prodData.seo} />
            )}
            {activeTab === 'performance' && (
              <PerformanceMetrics
                devData={devData.performance}
                prodData={prodData.performance}
              />
            )}
            {activeTab === 'resources' && (
              <ResourceTracker 
                devResources={devData.resources || null} 
                prodResources={prodData.resources || null} 
              />
            )}
            {activeTab === 'diff' && (
              <DiffViewer devHTML={devData.html} prodHTML={prodData.html} />
            )}
            {activeTab === 'alerts' && (
              <AlertDisplay alerts={alerts} />
            )}
            {activeTab === 'history' && (
              <HistoryTimeline key={historyUpdated} />
            )}
          </div>
        </div>
      )}

      {!devData && !prodData && !loading && (
        <div className="welcome-section">
          <h2>Welcome to URL Comparison Tool</h2>
          <p>Compare development and production environments with comprehensive analysis:</p>
          <ul className="feature-list">
            <li>📊 DOM Structure Comparison</li>
            <li>🎯 SEO Analysis with Recommendations</li>
            <li>⚡ Performance Metrics & Scoring</li>
            <li>🗂️ Static Resource Tracking</li>
            <li>📝 Side-by-side HTML Diff</li>
            <li>🚨 Automated Alerts & Thresholds</li>
            <li>📈 Comparison History & Timeline</li>
            <li>💾 Export Results (JSON, CSV)</li>
          </ul>
          <div className="cli-info">
            <h3>CLI Available!</h3>
            <code>npm run compare -- --dev https://dev.example.com --prod https://example.com</code>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
