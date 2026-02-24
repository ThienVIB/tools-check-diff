export interface URLData {
  url: string;
  html: string;
  dom: DOMData;
  seo: SEOData;
  performance: PerformanceData;
  resources?: ResourceData;
  links?: LinkAnalysisData;
  lighthouse?: LighthouseData;
  screenshot?: string; // Base64 encoded screenshot
}

export interface TagDetail {
  src?: string;
  href?: string;
  alt?: string;
  content?: string;
  text?: string;
  attributes?: { [key: string]: string };
}

export interface HeadingDetail {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  className?: string;
}

export interface DOMData {
  totalElements: number;
  scripts: number;
  styles: number;
  images: number;
  links: number;
  forms: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  h1Texts: string[];
  detailedScripts: TagDetail[];
  detailedStyles: TagDetail[];
  detailedImages: TagDetail[];
  detailedLinks: TagDetail[];
  detailedMetas: TagDetail[];
  detailedHeadings: HeadingDetail[];
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  h1Count: number;
  h1Texts: string[];
  structuredData: any[];
  recommendations: string[];
}

export interface PerformanceData {
  htmlSize: number;
  resourceCounts: {
    scripts: number;
    styles: number;
    images: number;
    total: number;
  };
  score: number;
  recommendations: string[];
}

export interface DiffResult {
  added: string[];
  removed: string[];
  modified: string[];
}

export type FilterType = 'all' | 'added' | 'removed' | 'modified';

// New interfaces for enhanced features

export interface StaticResource {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'media' | 'document' | 'other';
  size?: number;
  status?: number;
  cached?: boolean;
  fromServiceWorker?: boolean;
  mimeType?: string;
  initiator?: string;
  content?: string; // Actual file content for deep comparison
  path?: string; // Folder path extracted from URL
  fileName?: string; // File name extracted from URL
}

export interface ResourceData {
  all: StaticResource[];
  scripts: StaticResource[];
  stylesheets: StaticResource[];
  images: StaticResource[];
  fonts: StaticResource[];
  media: StaticResource[];
  other: StaticResource[];
  totalSize: number;
  totalRequests: number;
  folderStructure?: FolderNode; // Tree structure of all resources
}

export interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: FolderNode[];
  resource?: StaticResource; // Only for file nodes
}

export interface LinkInfo {
  url: string;
  text: string;
  isExternal: boolean;
  isInternal: boolean;
  status?: number;
  statusText?: string;
  isBroken: boolean;
  redirectsTo?: string;
  target?: string;
  rel?: string;
}

export interface LinkAnalysisData {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  links: LinkInfo[];
  recommendations: string[];
}

export interface LighthouseData {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
  };
  opportunities: Array<{
    title: string;
    description: string;
    savings: number;
  }>;
}

export interface ComparisonThreshold {
  htmlSizeDiff?: number; // percentage
  scriptCountDiff?: number;
  imageCountDiff?: number;
  performanceScoreDiff?: number;
  seoScoreDiff?: number;
  brokenLinksMax?: number;
  lighthousePerformanceMin?: number;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: ComparisonThreshold;
  notifyOn: Array<'error' | 'warning' | 'info'>;
  webhookUrl?: string;
}

export interface ComparisonConfig {
  devUrl: string;
  prodUrl: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
  };
  alerts?: AlertConfig;
  features?: {
    lighthouse?: boolean;
    linkAnalysis?: boolean;
    visualRegression?: boolean;
    resourceTracking?: boolean;
  };
  auth?: {
    username?: string;
    password?: string;
    headers?: { [key: string]: string };
  };
}

export interface ComparisonHistory {
  id: string;
  timestamp: number;
  devUrl: string;
  prodUrl: string;
  results: {
    dom: any;
    seo: any;
    performance: any;
    lighthouse?: any;
    links?: any;
    resources?: any;
  };
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    category: string;
  }>;
  visualDiff?: {
    pixelDiff: number;
    percentageDiff: number;
    diffImageBase64?: string;
  };
}

export interface VisualRegressionResult {
  pixelDiff: number;
  percentageDiff: number;
  totalPixels: number;
  diffImageBase64?: string;
  passed: boolean;
  threshold: number;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface MultiPageResult {
  url: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  comparison?: {
    dom: any;
    seo: any;
    performance: any;
  };
}
