import * as Diff from 'diff';

export const generateHTMLDiff = (html1: string, html2: string) => {
  const diff = Diff.diffLines(html1, html2);
  
  const result = {
    added: [] as string[],
    removed: [] as string[],
    modified: [] as string[],
    all: diff,
  };

  diff.forEach((part) => {
    const lines = part.value.split('\n').filter(line => line.trim());
    
    if (part.added) {
      result.added.push(...lines);
    } else if (part.removed) {
      result.removed.push(...lines);
    }
  });

  return result;
};

export const generateSideBySideDiff = (html1: string, html2: string) => {
  const diff = Diff.diffLines(html1, html2);
  const result: Array<{
    prodLineNum: number | null;
    prodContent: string;
    prodType: 'normal' | 'removed' | 'empty';
    devLineNum: number | null;
    devContent: string;
    devType: 'normal' | 'added' | 'empty';
  }> = [];

  let prodLineNum = 1;
  let devLineNum = 1;

  diff.forEach((part) => {
    const lines = part.value.split('\n').filter(line => line.trim());
    
    if (!part.added && !part.removed) {
      // Unchanged lines
      lines.forEach(line => {
        result.push({
          prodLineNum: prodLineNum++,
          prodContent: line,
          prodType: 'normal',
          devLineNum: devLineNum++,
          devContent: line,
          devType: 'normal',
        });
      });
    } else if (part.removed) {
      // Removed from prod (not in dev)
      lines.forEach(line => {
        result.push({
          prodLineNum: prodLineNum++,
          prodContent: line,
          prodType: 'removed',
          devLineNum: null,
          devContent: '',
          devType: 'empty',
        });
      });
    } else if (part.added) {
      // Added in dev (not in prod)
      lines.forEach(line => {
        result.push({
          prodLineNum: null,
          prodContent: '',
          prodType: 'empty',
          devLineNum: devLineNum++,
          devContent: line,
          devType: 'added',
        });
      });
    }
  });

  return result;
};

// Character-level diff highlighting for better visual comparison
export const highlightCharDifferences = (text1: string, text2: string): { highlighted1: string; highlighted2: string } => {
  const charDiff = Diff.diffChars(text1, text2);
  let highlighted1 = '';
  let highlighted2 = '';
  
  charDiff.forEach(part => {
    const value = part.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    if (part.removed) {
      highlighted1 += `<span class="char-diff-removed">${value}</span>`;
    } else if (part.added) {
      highlighted2 += `<span class="char-diff-added">${value}</span>`;
    } else {
      highlighted1 += value;
      highlighted2 += value;
    }
  });
  
  return { highlighted1, highlighted2 };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#28a745';
  if (score >= 60) return '#ffc107';
  return '#dc3545';
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
