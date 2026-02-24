/**
 * History Manager
 * Manages comparison history with localStorage and export capabilities
 */

import { ComparisonHistory } from '../types';

const HISTORY_KEY = 'url-comparison-history';
const MAX_HISTORY_ITEMS = 100;

export class HistoryManager {
  /**
   * Save a comparison result to history
   */
  static save(entry: Omit<ComparisonHistory, 'id' | 'timestamp'>): ComparisonHistory {
    const history = this.getAll();
    
    const newEntry: ComparisonHistory = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    history.push(newEntry);

    // Keep only the last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(-MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

    return newEntry;
  }

  /**
   * Get all history items
   */
  static getAll(): ComparisonHistory[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  /**
   * Get history item by ID
   */
  static getById(id: string): ComparisonHistory | null {
    const history = this.getAll();
    return history.find(item => item.id === id) || null;
  }

  /**
   * Get recent history (last N items)
   */
  static getRecent(limit: number = 10): ComparisonHistory[] {
    const history = this.getAll();
    return history.slice(-limit).reverse();
  }

  /**
   * Clear all history
   */
  static clear(): void {
    localStorage.removeItem(HISTORY_KEY);
  }

  /**
   * Delete a specific history item
   */
  static delete(id: string): boolean {
    const history = this.getAll();
    const filtered = history.filter(item => item.id !== id);
    
    if (filtered.length === history.length) {
      return false; // Item not found
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Export history as JSON
   */
  static exportJSON(): string {
    const history = this.getAll();
    return JSON.stringify(history, null, 2);
  }

  /**
   * Export history as CSV
   */
  static exportCSV(): string {
    const history = this.getAll();
    
    const headers = [
      'ID',
      'Timestamp',
      'Date',
      'Dev URL',
      'Prod URL',
      'DOM Elements Diff',
      'Scripts Diff',
      'Images Diff',
      'Performance Score Diff',
      'Alert Count',
      'Error Count',
      'Warning Count'
    ];

    const rows = history.map(item => {
      const date = new Date(item.timestamp).toLocaleString();
      const errorCount = item.alerts.filter(a => a.type === 'error').length;
      const warningCount = item.alerts.filter(a => a.type === 'warning').length;

      return [
        item.id,
        item.timestamp,
        date,
        item.devUrl,
        item.prodUrl,
        item.results.dom?.totalElementsDiff || 0,
        item.results.dom?.scriptsDiff || 0,
        item.results.dom?.imagesDiff || 0,
        item.results.performance?.scoreDiff || 0,
        item.alerts.length,
        errorCount,
        warningCount
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Download history as file
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download history as JSON file
   */
  static downloadJSON(): void {
    const json = this.exportJSON();
    const filename = `comparison-history-${Date.now()}.json`;
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Download history as CSV file
   */
  static downloadCSV(): void {
    const csv = this.exportCSV();
    const filename = `comparison-history-${Date.now()}.csv`;
    this.downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Import history from JSON
   */
  static import(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData) as ComparisonHistory[];
      
      // Validate structure
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array');
      }

      const existing = this.getAll();
      const merged = [...existing, ...imported];
      
      // Remove duplicates by ID
      const unique = merged.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      // Keep only last MAX_HISTORY_ITEMS
      const trimmed = unique.slice(-MAX_HISTORY_ITEMS);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      return true;
    } catch (error) {
      console.error('Error importing history:', error);
      return false;
    }
  }

  /**
   * Get statistics from history
   */
  static getStatistics() {
    const history = this.getAll();

    if (history.length === 0) {
      return null;
    }

    const totalComparisons = history.length;
    const totalAlerts = history.reduce((sum, item) => sum + item.alerts.length, 0);
    const totalErrors = history.reduce(
      (sum, item) => sum + item.alerts.filter(a => a.type === 'error').length,
      0
    );
    const totalWarnings = history.reduce(
      (sum, item) => sum + item.alerts.filter(a => a.type === 'warning').length,
      0
    );

    // Most compared URLs
    const urlCounts: { [key: string]: number } = {};
    history.forEach(item => {
      const key = `${item.devUrl}|${item.prodUrl}`;
      urlCounts[key] = (urlCounts[key] || 0) + 1;
    });

    const mostCompared = Object.entries(urlCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([urls, count]) => {
        const [devUrl, prodUrl] = urls.split('|');
        return { devUrl, prodUrl, count };
      });

    // Alert categories
    const alertCategories: { [key: string]: number } = {};
    history.forEach(item => {
      item.alerts.forEach(alert => {
        alertCategories[alert.category] = (alertCategories[alert.category] || 0) + 1;
      });
    });

    return {
      totalComparisons,
      totalAlerts,
      totalErrors,
      totalWarnings,
      averageAlertsPerComparison: (totalAlerts / totalComparisons).toFixed(2),
      mostCompared,
      alertCategories,
      dateRange: {
        first: new Date(history[0].timestamp),
        last: new Date(history[history.length - 1].timestamp)
      }
    };
  }
}
