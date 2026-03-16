import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const PATTERNS = [
  'TODO', 'FIXME', 'TBD', 'NOT_IMPLEMENTED', 'HACK', 'TEMP', 'PLACEHOLDER', 'SIMPLIFIED', 'MOCK', 'STUB',
  'bypassAuth', 'devMode'
];

const SUSPICIOUS = [
  "return 'test-user'",
  "return success",
  "jwt.sign(payload, 'secret')",
  "redirectUri.startsWith()",
  "nonceCheck = true"
];

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'tests', 'static', 'public', '.astro', 'node_modules'];

function scanDir(dir: string, results: any[] = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    const stats = statSync(path);
    
    if (stats.isDirectory()) {
      if (EXCLUDE_DIRS.includes(file)) continue;
      scanDir(path, results);
    } else if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.svelte') || file.endsWith('.js'))) {
      const content = readFileSync(path, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        
        // Filter out UI placeholders
        if (lowerLine.includes('placeholder=') && (file.endsWith('.svelte') || file.endsWith('.tsx'))) return;
        if (lowerLine.includes('.placeholder') && file.endsWith('.ts')) return; // i18n keys

        for (const pattern of [...PATTERNS, ...SUSPICIOUS]) {
          if (lowerLine.includes(pattern.toLowerCase())) {
            results.push({
              file: relative(process.cwd(), path),
              line: index + 1,
              pattern,
              snippet: line.trim()
            });
            break;
          }
        }
      });
    }
  }
  return results;
}

console.log('SECTION 1 — Detected Placeholder / Mock Implementations');
const findings = scanDir(join(process.cwd(), 'apps'));
findings.forEach(f => {
  console.log(`[${f.pattern}] ${f.file}:${f.line}`);
  console.log(`  Code: ${f.snippet}`);
});

console.log(`\nTotal findings: ${findings.length}`);
