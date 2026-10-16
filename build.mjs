// The site is static: one index.html plus the files it loads. "Building" is copying them into dist/.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const p of ['index.html', 'fonts', 'audio', 'skills', 'me.png']) {
  if (existsSync(p)) cpSync(p, `dist/${p}`, { recursive: true });
}
console.log('dist ready');
