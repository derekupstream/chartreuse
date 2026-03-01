import fs from 'fs';
import path from 'path';

export type ScannedFunction = {
  name: string;
  filePath: string;
};

function walkDir(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

export function scanCalculatorFunctions(): ScannedFunction[] {
  const calcDir = path.join(process.cwd(), 'lib', 'calculator', 'calculations');
  const files = walkDir(calcDir);
  const results: ScannedFunction[] = [];

  const exportFnRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = exportFnRegex.exec(source)) !== null) {
      results.push({
        name: match[1],
        filePath: filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/')
      });
    }
    exportFnRegex.lastIndex = 0;
  }

  return results;
}

/**
 * Extracts the source of a named exported function from a file.
 * Returns the full function text including its signature and body.
 */
export function extractFunctionSource(relativeFilePath: string, functionName: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), relativeFilePath);
    const source = fs.readFileSync(fullPath, 'utf8');
    const lines = source.split('\n');

    // Find the line where the export function starts
    const startRegex = new RegExp(`^export\\s+(?:async\\s+)?function\\s+${functionName}\\b`);
    let startLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (startRegex.test(lines[i].trim())) {
        startLine = i;
        break;
      }
    }
    if (startLine === -1) return null;

    // Walk forward counting braces to find the end of the function
    let depth = 0;
    let foundFirstBrace = false;
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') {
          depth++;
          foundFirstBrace = true;
        } else if (ch === '}') {
          depth--;
        }
      }
      if (foundFirstBrace && depth === 0) {
        return lines.slice(startLine, i + 1).join('\n');
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract all constant/factor references from a file.
 * Looks for identifiers imported from constants/* or patterns matching known key formats.
 */
export function extractConstantRefs(relativeFilePath: string): string[] {
  try {
    const fullPath = path.join(process.cwd(), relativeFilePath);
    const source = fs.readFileSync(fullPath, 'utf8');

    const refs = new Set<string>();

    // Imports from lib/calculator/constants/
    const importRegex = /from\s+['"](?:lib\/calculator\/constants|\.\.\/constants|\.\/constants)[^'"]*['"]/g;
    const importMatches = source.match(importRegex) ?? [];
    for (const m of importMatches) {
      const fileMatch = m.match(/constants\/([^'"]+)['"]/);
      if (fileMatch) refs.add(fileMatch[1].replace(/\//g, '/'));
    }

    // Specific named constant identifiers (e.g. EPA_WARM_*, UTILITY_RATE_*)
    const constRefRegex = /\b([A-Z][A-Z0-9_]{4,})\b/g;
    let match: RegExpExecArray | null;
    while ((match = constRefRegex.exec(source)) !== null) {
      refs.add(match[1]);
    }

    return Array.from(refs);
  } catch {
    return [];
  }
}
