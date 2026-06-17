// fix-themes.js — ES Module version
// Generates complete theme CSS files with ALL variables used by ClinicSite.jsx
// Run: node fix-themes.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themesDir = path.join(__dirname, 'src', 'themes');

if (!fs.existsSync(themesDir)) {
  console.error(`❌ Themes directory not found: ${themesDir}`);
  process.exit(1);
}

const themeFiles = fs.readdirSync(themesDir).filter(f => f.endsWith('.css') && f.startsWith('theme-'));

if (themeFiles.length === 0) {
  console.error(`❌ No theme files found in ${themesDir}`);
  process.exit(1);
}

console.log(`🔧 Found ${themeFiles.length} theme files to fix...\n`);

// Theme color mappings (20 themes)
const themeColors = {
  'theme-001-ocean':   { primary: '#1565c0', primaryLight: '#1e88e5', accent: '#0288d1', bg: '#f0f5fa', text: '#0b2545', muted: '#5a7a96', border: '#d0e0f0' },
  'theme-002-forest':  { primary: '#2e7d32', primaryLight: '#43a047', accent: '#388e3c', bg: '#f0f7f0', text: '#1b3d1b', muted: '#5a7a5a', border: '#d0e8d0' },
  'theme-003-sunset':  { primary: '#e64a19', primaryLight: '#f4511e', accent: '#ff5722', bg: '#fdf2ed', text: '#4a1a0a', muted: '#966a5a', border: '#f0d8d0' },
  'theme-004-lavender':{ primary: '#7b1fa2', primaryLight: '#9c27b0', accent: '#ab47bc', bg: '#f5f0f7', text: '#2d0a3d', muted: '#7a5a96', border: '#e0d0e8' },
  'theme-005-gold':    { primary: '#f57f17', primaryLight: '#fb8c00', accent: '#ffa726', bg: '#fdf8f0', text: '#4a2d0a', muted: '#967a5a', border: '#f0e0d0' },
  'theme-006-midnight':{ primary: '#1a237e', primaryLight: '#283593', accent: '#3949ab', bg: '#f0f0f5', text: '#0a0a2d', muted: '#5a5a7a', border: '#d0d0e0' },
  'theme-007-rose':    { primary: '#c2185b', primaryLight: '#d81b60', accent: '#e91e63', bg: '#fdf0f5', text: '#4a0a1f', muted: '#965a7a', border: '#f0d0e0' },
  'theme-008-teal':    { primary: '#00695c', primaryLight: '#00897b', accent: '#009688', bg: '#f0f7f5', text: '#0a3d35', muted: '#5a7a75', border: '#d0e8e0' },
  'theme-009-charcoal':{ primary: '#37474f', primaryLight: '#455a64', accent: '#546e7a', bg: '#f0f2f3', text: '#1a1f23', muted: '#5a6a75', border: '#d0d5d8' },
  'theme-010-sage':    { primary: '#558b2f', primaryLight: '#689f38', accent: '#7cb342', bg: '#f4f7f0', text: '#1f3d0a', muted: '#6a7a5a', border: '#d8e0d0' },
  'theme-011-crimson': { primary: '#b71c1c', primaryLight: '#c62828', accent: '#d32f2f', bg: '#fdf0f0', text: '#3d0a0a', muted: '#7a5a5a', border: '#f0d0d0' },
  'theme-012-arctic':  { primary: '#0277bd', primaryLight: '#0288d1', accent: '#039be5', bg: '#f0f5f7', text: '#0a2d4a', muted: '#5a7a96', border: '#d0e0f0' },
  'theme-013-amber':   { primary: '#ff6f00', primaryLight: '#ff8f00', accent: '#ffa000', bg: '#fdf7f0', text: '#4a2d0a', muted: '#967a5a', border: '#f0e0d0' },
  'theme-014-plum':    { primary: '#6a1b9a', primaryLight: '#7b1fa2', accent: '#8e24aa', bg: '#f5f0f7', text: '#2d0a3d', muted: '#7a5a96', border: '#e0d0e8' },
  'theme-015-olive':   { primary: '#827717', primaryLight: '#9e9d24', accent: '#afb42b', bg: '#f7f7f0', text: '#3d3d0a', muted: '#7a7a5a', border: '#e0e0d0' },
  'theme-016-slate':   { primary: '#455a64', primaryLight: '#546e7a', accent: '#607d8b', bg: '#f0f2f3', text: '#1a2328', muted: '#5a6a75', border: '#d0d5d8' },
  'theme-017-copper':  { primary: '#bf360c', primaryLight: '#d84315', accent: '#e64a19', bg: '#fdf2ed', text: '#4a1a0a', muted: '#966a5a', border: '#f0d8d0' },
  'theme-018-indigo':  { primary: '#283593', primaryLight: '#303f9f', accent: '#3f51b5', bg: '#f0f0f7', text: '#0a0a3d', muted: '#5a5a7a', border: '#d0d0e8' },
  'theme-019-mint':    { primary: '#00796b', primaryLight: '#00897b', accent: '#009688', bg: '#f0f7f5', text: '#0a3d35', muted: '#5a7a75', border: '#d0e8e0' },
  'theme-020-graphite':{ primary: '#212121', primaryLight: '#424242', accent: '#616161', bg: '#f2f2f2', text: '#0a0a0a', muted: '#5a5a5a', border: '#d0d0d0' },
};

function buildThemeCSS(themeId, colors) {
  // Derive additional colors from primary
  const primaryRgb = hexToRgb(colors.primary);
  const primaryBg = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)`;
  const primaryBgLight = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.04)`;

  return `/* ${themeId}.css — Complete theme palette for ClinicSite.jsx */
/* Auto-generated — do not edit manually */

:root {
  /* Core Colors */
  --color-primary: ${colors.primary};
  --color-primary-light: ${colors.primaryLight};
  --color-accent: ${colors.accent};
  --color-bg: ${colors.bg};
  --color-surface: #ffffff;
  --color-text: ${colors.text};
  --color-muted: ${colors.muted};
  --color-border: ${colors.border};

  /* Status Colors */
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-whatsapp: #25d366;

  /* Derived Colors */
  --color-text-muted: #94a3b8;
  --color-primary-bg: ${primaryBg};
  --color-primary-bg-light: ${primaryBgLight};

  /* Typography */
  --font-heading: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Layout */
  --max-width: 1100px;
  --section-padding: 80px;
}
`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 21, g: 101, b: 192 };
}

let fixedCount = 0;
let skippedCount = 0;

themeFiles.forEach(file => {
  const themeId = file.replace('.css', '');
  const colors = themeColors[themeId];

  if (!colors) {
    console.log(`⚠️  SKIP: No color mapping for ${file}`);
    skippedCount++;
    return;
  }

  const filePath = path.join(themesDir, file);
  const newContent = buildThemeCSS(themeId, colors);

  fs.writeFileSync(filePath, newContent);
  console.log(`✅ FIXED: ${file} (${colors.primary})`);
  fixedCount++;
});

console.log(`\n═══════════════════════════════════════`);
console.log(`🎉 DONE! Fixed ${fixedCount} theme files`);
console.log(`⚠️  Skipped: ${skippedCount}`);
console.log(`═══════════════════════════════════════`);
console.log(`\nThese themes now include ALL variables that ClinicSite.jsx expects:`);
console.log(`  --color-primary, --color-primary-light, --color-accent`);
console.log(`  --color-bg, --color-surface, --color-text, --color-muted, --color-border`);
console.log(`  --color-success, --color-danger, --color-whatsapp`);
console.log(`  --color-text-muted, --color-primary-bg, --color-primary-bg-light`);
