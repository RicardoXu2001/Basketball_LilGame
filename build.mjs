// Assembles the single-file deliverable: index.html
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const parts = [
  'src/match.js',
  'src/court.js',
  'src/coach.js',
];

const app = parts
  .map((p) => `\n/* ===================== ${p} ===================== */\n` + read(p))
  .join('\n');

const three = read('three.min.js');
const css = read('src/app.css');
const tpl = read('src/tpl.html');

// Guard: placeholders must not appear inside the library.
const html = tpl
  .replace('/*__CSS__*/', () => css)
  .replace('/*__THREE__*/', () => three)
  .replace('/*__APP__*/', () => app);

fs.writeFileSync(path.join(root, 'index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`index.html written: ${kb} KB  (app ${(Buffer.byteLength(app) / 1024).toFixed(1)} KB, three ${(three.length / 1024).toFixed(0)} KB)`);
