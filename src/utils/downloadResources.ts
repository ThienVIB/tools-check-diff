import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ResourceItem {
  url: string;
  type: string;
  size?: number;
  cached?: boolean;
}

export interface ResourcesByType {
  [key: string]: ResourceItem[];
}

/**
 * Download a single resource file
 */
async function downloadResource(url: string): Promise<{ data: Blob; filename: string } | null> {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.warn(`Failed to download ${url}: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    
    // Extract filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').filter(Boolean).join('/');
    
    return { data: blob, filename };
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

/**
 * Download all resources and package them into a zip file
 */
export async function downloadAllResources(
  resources: ResourcesByType,
  environment: 'dev' | 'prod',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = environment === 'dev' ? 'dev' : 'prod';
  const envFolder = zip.folder(folderName);

  if (!envFolder) {
    throw new Error('Failed to create zip folder');
  }

  // Collect all resources
  const allResources: ResourceItem[] = [];
  Object.values(resources).forEach(items => {
    allResources.push(...items);
  });

  const total = allResources.length;
  let downloaded = 0;
  let successful = 0;

  console.log(`Starting download of ${total} resources for ${environment}...`);

  // Download resources with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < allResources.length; i += concurrency) {
    const batch = allResources.slice(i, i + concurrency);
    
    // eslint-disable-next-line no-loop-func
    await Promise.all(
      batch.map(async (resource) => {
        const result = await downloadResource(resource.url);
        downloaded++;
        
        if (result) {
          // Add to zip with proper folder structure
          const cleanPath = result.filename.startsWith('/') 
            ? result.filename.substring(1) 
            : result.filename;
          
          envFolder.file(cleanPath, result.data);
          successful++;
          console.log(`✓ Downloaded (${downloaded}/${total}): ${cleanPath}`);
        } else {
          console.log(`✗ Failed (${downloaded}/${total}): ${resource.url}`);
        }

        if (onProgress) {
          onProgress(downloaded, total);
        }
      })
    );
  }

  console.log(`Download complete: ${successful}/${total} successful`);

  // Generate zip file
  console.log('Creating zip archive...');
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Save zip file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `${environment}-resources-${timestamp}.zip`;
  
  saveAs(zipBlob, filename);
  console.log(`✓ Saved as ${filename}`);
}

/**
 * Download resources of a specific category
 */
export async function downloadCategoryResources(
  resources: ResourceItem[],
  category: string,
  environment: 'dev' | 'prod',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = environment === 'dev' ? 'dev' : 'prod';
  const categoryFolder = zip.folder(`${folderName}/${category}`);

  if (!categoryFolder) {
    throw new Error('Failed to create zip folder');
  }

  const total = resources.length;
  let downloaded = 0;
  let successful = 0;

  console.log(`Starting download of ${total} ${category} resources for ${environment}...`);

  // Download with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < resources.length; i += concurrency) {
    const batch = resources.slice(i, i + concurrency);
    
    // eslint-disable-next-line no-loop-func
    await Promise.all(
      batch.map(async (resource) => {
        const result = await downloadResource(resource.url);
        downloaded++;
        
        if (result) {
          const cleanPath = result.filename.startsWith('/') 
            ? result.filename.substring(1) 
            : result.filename;
          
          categoryFolder.file(cleanPath, result.data);
          successful++;
          console.log(`✓ Downloaded (${downloaded}/${total}): ${cleanPath}`);
        } else {
          console.log(`✗ Failed (${downloaded}/${total}): ${resource.url}`);
        }

        if (onProgress) {
          onProgress(downloaded, total);
        }
      })
    );
  }

  console.log(`Download complete: ${successful}/${total} successful`);

  // Generate and save zip
  console.log('Creating zip archive...');
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `${environment}-${category}-${timestamp}.zip`;
  
  saveAs(zipBlob, filename);
  console.log(`✓ Saved as ${filename}`);
}

/**
 * Export resources as JSON for comparison
 */
export function exportResourcesAsJson(
  devResources: ResourcesByType,
  prodResources: ResourcesByType
): void {
  const exportData = {
    timestamp: new Date().toISOString(),
    dev: devResources,
    prod: prodResources
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `resources-comparison-${timestamp}.json`;
  
  saveAs(blob, filename);
  console.log(`✓ Exported resources as ${filename}`);
}

/**
 * Download a single file
 */
export async function downloadSingleFile(
  resource: ResourceItem,
  environment: 'dev' | 'prod'
): Promise<void> {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(resource.url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const blob = await response.blob();
    
    // Extract filename
    const urlObj = new URL(resource.url);
    const filename = urlObj.pathname.split('/').pop() || 'download';
    
    saveAs(blob, filename);
    console.log(`✓ Downloaded ${filename}`);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Download a folder with all its contents
 */
export async function downloadFolder(
  resources: ResourceItem[],
  folderPath: string,
  environment: 'dev' | 'prod',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = environment === 'dev' ? 'dev' : 'prod';
  const baseFolder = zip.folder(folderName);

  if (!baseFolder) {
    throw new Error('Failed to create zip folder');
  }

  const total = resources.length;
  let downloaded = 0;
  let successful = 0;

  console.log(`Downloading folder ${folderPath} with ${total} files...`);

  // Download with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < resources.length; i += concurrency) {
    const batch = resources.slice(i, i + concurrency);
    
    // eslint-disable-next-line no-loop-func
    await Promise.all(
      batch.map(async (resource) => {
        const result = await downloadResource(resource.url);
        downloaded++;
        
        if (result) {
          const cleanPath = result.filename.startsWith('/') 
            ? result.filename.substring(1) 
            : result.filename;
          
          baseFolder.file(cleanPath, result.data);
          successful++;
        }

        if (onProgress) {
          onProgress(downloaded, total);
        }
      })
    );
  }

  console.log(`Download complete: ${successful}/${total} successful`);

  // Generate and save zip
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const cleanFolderName = folderPath.replace(/\//g, '-').replace(/^-+|-+$/g, '');
  const filename = `${environment}-${cleanFolderName}-${timestamp}.zip`;
  
  saveAs(zipBlob, filename);
  console.log(`✓ Saved folder as ${filename}`);
}

