import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const tests = readdirSync('tests').filter(file => file.endsWith('.test.js')).map(file => `tests/${file}`);
const result = spawnSync(process.execPath, ['--test', ...tests], {stdio:'inherit'});
if (result.status !== 0) process.exit(result.status || 1);
for (const dir of ['dist','api','server']) {
  for (const file of readdirSync(dir).filter(file => file.endsWith('.js'))) {
    const check = spawnSync(process.execPath, ['--check', `${dir}/${file}`], {stdio:'inherit'});
    if (check.status !== 0) process.exit(check.status || 1);
  }
}
const pages = ['','pricing/','trust/','privacy/','terms/','refunds/','cookies/','accessibility/'];
for (const page of pages) {
  const path = `dist/${page}index.html`, html = readFileSync(path,'utf8');
  for (const [,attribute] of html.matchAll(/(?:src|href|poster)="([^"#]+)"/g)) {
    if (/^(?:https?:|tel:|mailto:|data:)/.test(attribute)) continue;
    const relative = attribute.split(/[?#]/)[0];
    const target = resolve(attribute.startsWith('/') ? 'dist' : dirname(path), attribute.startsWith('/') ? relative.slice(1) : relative);
    if (!existsSync(target)) throw new Error(`Missing local asset/link in ${path}: ${attribute}`);
  }
}
console.log('Build verified: eight static pages, local assets, JavaScript and all tests.');
