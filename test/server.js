/* test server: serves the site and a fake shared database with the real rules */
const http = require('http'), fs = require('fs'), path = require('path');
const C = require('../site/core.js');
const SITE = path.join(__dirname, '../site'), PORT = Number(process.argv[2] || 8765);
let readerDelay = 0;
let mem = null, down = false, nowOverride = null, readerKey = '', readerMode = 'ok';
const store = { key: () => 'testkey', now: () => nowOverride || new Date().toISOString(), load: () => mem && JSON.parse(JSON.stringify(mem)), save: (d) => { mem = JSON.parse(JSON.stringify(d)); },
  /* a fake photo reader: answers as if the photo were note 28301, 12 bags of mealie meal for Holy Family */
  backupInfo: () => ({ on: true, last: '2026-11-19T00:01:00Z' }),
  readerOn: () => !!readerKey, setReaderKey: (v) => { readerKey = v; },
  /* a fake reader of the plan of the week: the paper of Minsundu, 23-29 November */
  readPlan: (img, db) => ({ ok: true, photo: 'photo_plan_minsundu_1', plan: C.eatPlanRead(db, { readable: true, kitchen: 'Minsundu', week_start: '2026-11-16', days: [
    { day: 'Monday', food: 'Eggs', lunch: 120, dinner: 40, items: [{ item: 'egg', quantity: 7 }] },
    { day: 'Tuesday', food: 'Chicken', lunch: 120, dinner: 40, other_places: [{ place: 'Ukubalula', people: 1 }], items: [{ item: 'chk', quantity: 23 }] },
    { day: 'Thursday', food: 'Fish', lunch: 100, dinner: 60, other_places: [{ place: 'Ukubalula', people: 10 }] }] }) }),
  read: (img, db) => {
    if (readerMode === 'two') return { ok: true, photo: 'photo_two_notes_12345', reads: [
      { clear: true, no: '28302', date: '', centre: 'LUI', q: { egg: 10 }, recv: 'Renard', remark: '' },
      { clear: true, no: '28303', date: '', centre: 'MCU', q: { prk: 15 }, recv: 'Kabaso', remark: '' },
      { clear: false, no: '', date: '', centre: '', q: {} }] };
    if (readerMode === 'part') { const ch = db.centres.find(c => c.name === 'Chinika House'); return { ok: true, photo: 'photo_part_chinika_1', reads: [
      { clear: true, no: '28599', date: '', centre: 'NKW', q: { chk: 26 }, parts: [{ to: ch ? ch.id : '', name: 'Chinika House', q: { chk: 2 } }], recv: 'Renard', remark: '' }] }; }
    if (readerMode === 'unclear') return { ok: true, photo: 'photo_unclear_123', read: { clear: false, no: '', date: '', centre: '', q: {} } };
    const hf = db.centres.find(c => c.name === 'Holy Family');
    return { ok: true, photo: 'photo_28301_abcdef', read: { clear: true, no: '28301', date: '', centre: hf ? hf.id : '', placeText: 'Holy Family', q: { mm: 12 }, recv: 'Joseph', remark: '' } };
  } };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.css': 'text/css', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  if (req.url.startsWith('/db')) {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }); return res.end(); }
    let body = ''; req.on('data', (c) => body += c); req.on('end', () => {
      if (down) { req.socket.destroy(); return; }
      const rq = JSON.parse(body), out = C.eatHandle(rq, store), wait = rq.action === 'read' && rq.kind !== 'plan' ? readerDelay : 0;
      setTimeout(() => { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(out)); }, wait);
    }); return;
  }
  if (req.url === '/__reset') { mem = null; readerKey = ''; readerMode = 'ok'; res.end('ok'); return; }
  if (req.url.startsWith('/__reader')) { const u = new URL(req.url, 'http://x'); readerMode = u.searchParams.get('mode') || 'ok'; readerDelay = Number(u.searchParams.get('delay')) || 0; res.end('ok'); return; }
  if (req.url.indexOf('/__now?') === 0) { nowOverride = decodeURIComponent(req.url.slice(7)) || null; res.end('ok'); return; }
  if (req.url === '/__down') { down = true; res.end('ok'); return; }
  if (req.url === '/__up') { down = false; res.end('ok'); return; }
  if (req.url === '/__load' && req.method === 'POST') { let b = ''; req.on('data', (c) => b += c); req.on('end', () => { mem = JSON.parse(b); res.end('ok'); }); return; }
  if (req.url === '/__dump') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(mem)); return; }
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('test server on', PORT));
