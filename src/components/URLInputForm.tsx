import React, { useState } from 'react';
import { isValidURL } from '../utils/helpers';
import './URLInputForm.css';

interface URLInputFormProps {
  onSubmit: (devUrl: string, prodUrl: string) => void;
  loading: boolean;
}

const URLInputForm: React.FC<URLInputFormProps> = ({ onSubmit, loading }) => {
  const [devUrl, setDevUrl] = useState('');
  const [prodUrl, setProdUrl] = useState('');
  const [errors, setErrors] = useState({ dev: '', prod: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { dev: '', prod: '' };
    
    if (!devUrl.trim()) {
      newErrors.dev = 'Dev URL is required';
    } else if (!isValidURL(devUrl)) {
      newErrors.dev = 'Invalid URL format';
    }
    
    if (!prodUrl.trim()) {
      newErrors.prod = 'Production URL is required';
    } else if (!isValidURL(prodUrl)) {
      newErrors.prod = 'Invalid URL format';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.dev && !newErrors.prod) {
      onSubmit(devUrl, prodUrl);
    }
  };

  return (
    <div className="url-input-form">
      <h1>🔍 URL Comparison Tool</h1>
      <p className="subtitle">Compare DOM Structure, SEO, and Performance between Dev and Production</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="dev-url">
            <span className="label-icon dev">🟢</span> Development URL
          </label>
          <input
            id="dev-url"
            type="text"
            value={devUrl}
            onChange={(e) => setDevUrl(e.target.value)}
            placeholder="https://dev.example.com"
            className={errors.dev ? 'error' : ''}
            disabled={loading}
          />
          {errors.dev && <span className="error-message">{errors.dev}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="prod-url">
            <span className="label-icon prod">🔵</span> Production URL
          </label>
          <input
            id="prod-url"
            type="text"
            value={prodUrl}
            onChange={(e) => setProdUrl(e.target.value)}
            placeholder="https://example.com"
            className={errors.prod ? 'error' : ''}
            disabled={loading}
          />
          {errors.prod && <span className="error-message">{errors.prod}</span>}
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Analyzing...' : '🚀 Compare URLs'}
        </button>
      </form>
    </div>
  );
};

export default URLInputForm;
