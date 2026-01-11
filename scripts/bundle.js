#!/usr/bin/env node
/**
 * Bundle PageTree Parser into a standalone IIFE for browser/extension use
 *
 * Usage: npm run build
 * Output: dist/cf-pagetree-parser.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// Files to bundle in dependency order
const FILES = [
  'utils.js',
  'styles.js',
  'parsers/layout.js',
  'parsers/text.js',
  'parsers/button.js',
  'parsers/media.js',
  'parsers/form.js',
  'parsers/list.js',
  'parsers/interactive.js',
  'parsers/popup.js',
  'parsers/placeholders.js',
  'index.js',
];

const HEADER = `/**
 * cf-pagetree-parser - Standalone Browser Bundle
 * Parse FunnelWind HTML to ClickFunnels PageTree JSON
 *
 * AUTO-GENERATED - Do not edit directly!
 * Run: npm run build
 */

(function(global) {
'use strict';

/**
 * Sanitize HTML - simplified version (no DOMPurify dependency)
 * For trusted FunnelWind source content only
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html;
}

`;

const FOOTER = `
// Expose API
global.CFPageTreeParser = {
  parsePageTree,
  createParseElement,
  exportPageTreeJSON,
  downloadPageTree,
  copyPageTreeToClipboard,
  // Utils
  generateId,
  generateFractionalIndex,
  parseValueWithUnit,
  normalizeColor,
  parseInlineStyle,
  // Styles
  parseShadow,
  shadowToParams,
  parseBorder,
  borderToParams,
  parseBackground,
  backgroundToParams,
};

})(typeof window !== 'undefined' ? window : global);
`;

/**
 * Strip import/export statements and clean up the code
 */
function stripImportsExports(code, filename) {
  let result = code;

  // Remove import statements (single and multi-line)
  result = result.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"].*?['"];?\s*$/gm, '');
  result = result.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  result = result.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

  // Remove export statements but keep the code
  result = result.replace(/^export\s+(async\s+)?(function|const|let|var|class)\s+/gm, '$1$2 ');
  result = result.replace(/^export\s+\{[^}]*\}\s*from\s+['"].*?['"];?\s*$/gm, '');
  result = result.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
  result = result.replace(/^export\s+default\s+/gm, '');

  // Remove the original sanitizeHtml function (we provide our own without DOMPurify)
  result = result.replace(/\/\*\*\s*\n\s*\*\s*Sanitize HTML to prevent XSS[\s\S]*?^function sanitizeHtml\(html\) \{[\s\S]*?^\}/m, '');

  // Remove window.PageTreeParser assignment (we expose our own API)
  result = result.replace(/\/\/ Expose global API.*?}\s*\n/s, '');
  result = result.replace(/if \(typeof window !== "undefined"\) \{[\s\S]*?window\.PageTreeParser[\s\S]*?\}\s*\n/m, '');

  // Add file header comment
  const basename = path.basename(filename);
  result = `\n// --- ${basename} ---\n${result}`;

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

// Main bundler
function bundle() {
  console.log('Bundling cf-pagetree-parser...\n');

  // Ensure dist directory exists
  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
  }

  let output = HEADER;

  for (const file of FILES) {
    const filepath = path.join(SRC, file);

    if (!fs.existsSync(filepath)) {
      console.error(`  ✗ File not found: ${file}`);
      process.exit(1);
    }

    console.log(`  ✓ ${file}`);
    const code = fs.readFileSync(filepath, 'utf8');
    output += stripImportsExports(code, file);
  }

  output += FOOTER;

  // Write output
  const outputPath = path.join(DIST, 'cf-pagetree-parser.js');
  fs.writeFileSync(outputPath, output);

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`\n✓ Written to: dist/cf-pagetree-parser.js`);
  console.log(`  Size: ${sizeKB} KB`);
}

bundle();
