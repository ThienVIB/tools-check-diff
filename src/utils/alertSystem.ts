/**
 * Alert System
 * Validates thresholds and generates alerts
 */

import { ComparisonThreshold } from '../types';

export interface AlertRule {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  threshold?: number;
  actualValue?: number;
}

export class AlertSystem {
  private thresholds: ComparisonThreshold;
  private alerts: AlertRule[] = [];

  constructor(thresholds: ComparisonThreshold = {}) {
    this.thresholds = thresholds;
  }

  /**
   * Check HTML size difference
   */
  checkHTMLSize(devSize: number, prodSize: number): void {
    if (!this.thresholds.htmlSizeDiff) return;

    const diffPercent = Math.abs(((prodSize - devSize) / devSize) * 100);

    if (diffPercent > this.thresholds.htmlSizeDiff) {
      this.alerts.push({
        type: 'warning',
        category: 'Performance',
        message: `HTML size increased by ${diffPercent.toFixed(1)}% (${this.formatBytes(devSize)} → ${this.formatBytes(prodSize)})`,
        threshold: this.thresholds.htmlSizeDiff,
        actualValue: diffPercent
      });
    }
  }

  /**
   * Check script count difference
   */
  checkScriptCount(devCount: number, prodCount: number): void {
    if (!this.thresholds.scriptCountDiff) return;

    const diff = prodCount - devCount;

    if (Math.abs(diff) > this.thresholds.scriptCountDiff) {
      this.alerts.push({
        type: diff > 0 ? 'warning' : 'info',
        category: 'DOM',
        message: `Script count ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} (${devCount} → ${prodCount})`,
        threshold: this.thresholds.scriptCountDiff,
        actualValue: Math.abs(diff)
      });
    }
  }

  /**
   * Check image count difference
   */
  checkImageCount(devCount: number, prodCount: number): void {
    if (!this.thresholds.imageCountDiff) return;

    const diff = prodCount - devCount;

    if (Math.abs(diff) > this.thresholds.imageCountDiff) {
      this.alerts.push({
        type: diff > 0 ? 'warning' : 'info',
        category: 'DOM',
        message: `Image count ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} (${devCount} → ${prodCount})`,
        threshold: this.thresholds.imageCountDiff,
        actualValue: Math.abs(diff)
      });
    }
  }

  /**
   * Check performance score difference
   */
  checkPerformanceScore(devScore: number, prodScore: number): void {
    if (!this.thresholds.performanceScoreDiff) return;

    const diff = devScore - prodScore; // Negative diff means prod is better

    if (diff > this.thresholds.performanceScoreDiff) {
      this.alerts.push({
        type: 'error',
        category: 'Performance',
        message: `Performance score decreased by ${diff} points (${devScore} → ${prodScore})`,
        threshold: this.thresholds.performanceScoreDiff,
        actualValue: diff
      });
    }
  }

  /**
   * Check SEO score difference
   */
  checkSEOScore(devScore: number, prodScore: number): void {
    if (!this.thresholds.seoScoreDiff) return;

    const diff = devScore - prodScore;

    if (diff > this.thresholds.seoScoreDiff) {
      this.alerts.push({
        type: 'error',
        category: 'SEO',
        message: `SEO score decreased by ${diff} points (${devScore} → ${prodScore})`,
        threshold: this.thresholds.seoScoreDiff,
        actualValue: diff
      });
    }
  }

  /**
   * Check broken links
   */
  checkBrokenLinks(brokenCount: number): void {
    if (this.thresholds.brokenLinksMax === undefined) return;

    if (brokenCount > this.thresholds.brokenLinksMax) {
      this.alerts.push({
        type: 'error',
        category: 'Links',
        message: `Found ${brokenCount} broken link(s) (max allowed: ${this.thresholds.brokenLinksMax})`,
        threshold: this.thresholds.brokenLinksMax,
        actualValue: brokenCount
      });
    }
  }

  /**
   * Check Lighthouse performance score
   */
  checkLighthousePerformance(score: number): void {
    if (!this.thresholds.lighthousePerformanceMin) return;

    if (score < this.thresholds.lighthousePerformanceMin) {
      this.alerts.push({
        type: 'error',
        category: 'Performance',
        message: `Lighthouse performance score (${score}) is below minimum (${this.thresholds.lighthousePerformanceMin})`,
        threshold: this.thresholds.lighthousePerformanceMin,
        actualValue: score
      });
    }
  }

  /**
   * Check visual regression difference
   */
  checkVisualRegression(percentageDiff: number, threshold: number = 5): void {
    if (percentageDiff > threshold) {
      this.alerts.push({
        type: 'warning',
        category: 'Visual',
        message: `Visual difference detected: ${percentageDiff.toFixed(2)}% of pixels changed (threshold: ${threshold}%)`,
        threshold,
        actualValue: percentageDiff
      });
    }
  }

  /**
   * Check missing meta tags
   */
  checkMetaTags(devMetas: any, prodMetas: any): void {
    const criticalMetas = ['description', 'og:title', 'og:description'];

    criticalMetas.forEach(metaName => {
      const devValue = devMetas[metaName];
      const prodValue = prodMetas[metaName];

      if (devValue && !prodValue) {
        this.alerts.push({
          type: 'error',
          category: 'SEO',
          message: `Critical meta tag "${metaName}" missing in production`
        });
      } else if (devValue !== prodValue && prodValue) {
        this.alerts.push({
          type: 'info',
          category: 'SEO',
          message: `Meta tag "${metaName}" differs between dev and production`
        });
      }
    });
  }

  /**
   * Check security headers (from resource responses)
   */
  checkSecurityHeaders(resources: any[]): void {
    const mainDocument = resources.find(r => r.type === 'document');
    
    if (mainDocument) {
      const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options'
      ];

      securityHeaders.forEach(header => {
        // This would require actual header data from resources
        // For now, this is a placeholder for the concept
      });
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(): AlertRule[] {
    return this.alerts;
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: 'error' | 'warning' | 'info'): AlertRule[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: string): AlertRule[] {
    return this.alerts.filter(alert => alert.category === category);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.alerts.some(alert => alert.type === 'error');
  }

  /**
   * Clear all alerts
   */
  clear(): void {
    this.alerts = [];
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Export alerts as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.alerts, null, 2);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      total: this.alerts.length,
      errors: this.getAlertsByType('error').length,
      warnings: this.getAlertsByType('warning').length,
      info: this.getAlertsByType('info').length,
      categories: this.getCategoryBreakdown()
    };
  }

  /**
   * Get breakdown by category
   */
  private getCategoryBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    
    this.alerts.forEach(alert => {
      breakdown[alert.category] = (breakdown[alert.category] || 0) + 1;
    });

    return breakdown;
  }
}

/**
 * Default thresholds for production environments
 */
export const DEFAULT_THRESHOLDS: ComparisonThreshold = {
  htmlSizeDiff: 20, // 20% HTML size increase
  scriptCountDiff: 5, // Max 5 additional scripts
  imageCountDiff: 10, // Max 10 additional images
  performanceScoreDiff: 10, // Max 10 point decrease
  seoScoreDiff: 5, // Max 5 point decrease
  brokenLinksMax: 0, // No broken links allowed
  lighthousePerformanceMin: 80 // Minimum 80/100 performance score
};

/**
 * Strict thresholds for critical production deployments
 */
export const STRICT_THRESHOLDS: ComparisonThreshold = {
  htmlSizeDiff: 10,
  scriptCountDiff: 2,
  imageCountDiff: 5,
  performanceScoreDiff: 5,
  seoScoreDiff: 2,
  brokenLinksMax: 0,
  lighthousePerformanceMin: 90
};
