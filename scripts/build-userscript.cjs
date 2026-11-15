#!/usr/bin/env node
// Generates custom-script.js (Enhancer for YouTube custom script) from
// content.js, which is the single source of truth. Only the header comment
// differs. Run with --check to fail if custom-script.js is out of date.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HEADER =
  '/**\n' +
  ' * Enhancer for YouTube™ — Custom script.\n' +
  ' * GENERATED from content.js by `npm run build:userscript` — do not edit.\n' +
  ' * Paste into Custom script and enable auto-execute.\n' +
  ' *\n' +
  ' * Scales times without flicker: hides native clock, shows our labels.\n' +
  ' */';

function render() {
  const source = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
  const end = source.indexOf('*/');
  if (!source.startsWith('/**') || end < 0) throw new Error('content.js must start with a /** */ header');
  return HEADER + source.slice(end + 2);
}

module.exports = { render };

if (require.main === module) {
  const target = path.join(ROOT, 'custom-script.js');
  const expected = render();
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (actual !== expected) {
      console.error('custom-script.js is out of date; run `npm run build:userscript`.');
      process.exit(1);
    }
    console.log('custom-script.js is up to date.');
  } else {
    fs.writeFileSync(target, expected);
    console.log('Wrote custom-script.js from content.js.');
  }
}
