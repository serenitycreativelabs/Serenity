// Naikkan versi aplikasi di semua tempat sekaligus.
// Pemakaian: node scripts/bump-version.mjs [patch|minor|major|x.y.z] "Catatan perubahan"
import fs from 'fs';
const arg = process.argv[2] || 'patch';
const note = process.argv[3] || 'Pembaruan';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [M, m, p] = pkg.version.split('.').map(Number);
const next = /^\d+\.\d+\.\d+$/.test(arg) ? arg : arg === 'major' ? `${M + 1}.0.0` : arg === 'minor' ? `${M}.${m + 1}.0` : `${M}.${m}.${p + 1}`;
const d = new Date(); const build = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
pkg.version = next; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
const rep = (f, re, v) => fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(re, v));
rep('public/js/config.js', /version: '[^']+'/, `version: '${next}'`);
rep('public/js/config.js', /build: '[^']+'/, `build: '${build}'`);
const prevRev = Number((fs.readFileSync('public/js/config.js', 'utf8').match(/revision: 'R(\d+)'/) || [])[1] || 0);
const rev = `R${prevRev + 1}`;
rep('public/js/config.js', /revision: '[^']+'/, `revision: '${rev}'`);
rep('public/sw.js', /const VERSION = '[^']+'/, `const VERSION = '${next}'`);
const cl = fs.readFileSync('CHANGELOG.md', 'utf8');
fs.writeFileSync('CHANGELOG.md', cl.replace('# Catatan Perubahan\n', `# Catatan Perubahan\n\n## v${next} — ${build}\n- ${note}\n`));
console.log(`Versi dinaikkan ke v${next} (build ${build}, ${rev})`);
