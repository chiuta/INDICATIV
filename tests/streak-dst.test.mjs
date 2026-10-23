// INDICATIV — seria de zile (touchStreak) nu se rupe la trecerea la ora de vară: „ieri” = ziua calendaristică anterioară, nu „acum − 24 h”.
// Rulare: node tests/streak-dst.test.mjs   (Playwright din /opt/node-tools sau NODE_PW; CHROME=cale/chromium)
import {createRequire} from 'module';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.NODE_PW || '/opt/node-tools/package.json');
const {chromium} = require('playwright');
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, n, i) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (i === undefined ? '' : ' ' + JSON.stringify(i).slice(0, 300))); } };
const h = fs.readFileSync(path.join(R, 'index.html'), 'utf8'), app = JSON.parse(fs.readFileSync(path.join(R, 'app.json'), 'utf8'));
const S = app.sha256;
ok(app.sizeBytes === Buffer.byteLength(h) && crypto.createHash('sha256').update(h.split(S).join('')).digest('hex') === S, 'app.json: sizeBytes și sha256 corecte');
const b = await chromium.launch({executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function run(tz, nowIso, lastIso, streak) {
  const ctx = await b.newContext({serviceWorkers: 'block', timezoneId: tz}); await ctx.route(/^https?:/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await p.goto('file://' + path.join(R, 'index.html')); await p.waitForTimeout(1200);
  const r = await p.evaluate(([nowIso, lastIso, streak]) => {
    const RealDate = Date, fixed = new RealDate(nowIso).getTime();
    window.Date = class extends RealDate { constructor(...a) { if (a.length === 0) super(fixed); else super(...a); } static now() { return fixed; } };
    DB.stats.lastStudyDate = new RealDate(lastIso).toDateString(); DB.stats.streak = streak;
    touchStreak(); window.Date = RealDate; return DB.stats.streak;
  }, [nowIso, lastIso, streak]);
  await ctx.close(); return {r, errs};
}
// România: 29.03.2026 03:00 → 04:00 (ziua de 23 h). 30.03.2026 00:30 locală = 2026-03-29T21:30Z
let x = await run('Europe/Bucharest', '2026-03-29T21:30:00Z', '2026-03-29T09:00:00Z', 5);
ok(x.r === 6 && !x.errs.length, 'ora de vară (București): studiu 29.03 + 30.03 la 00:30 → seria continuă (6)', x);
// zi obișnuită
x = await run('Europe/Bucharest', '2026-05-11T09:00:00Z', '2026-05-10T09:00:00Z', 5);
ok(x.r === 6, 'zi obișnuită: seria continuă (6)', x);
x = await run('Europe/Bucharest', '2026-05-12T09:00:00Z', '2026-05-10T09:00:00Z', 5);
ok(x.r === 1, 'zi sărită: seria se reia de la 1', x);
await b.close(); console.log('\n' + pass + ' reușite, ' + fail + ' eșuate'); process.exit(fail ? 1 : 0);
