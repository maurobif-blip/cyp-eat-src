

/* ===== Google side: the Google Sheet shows the counts; Drive holds the database file and a daily copy =====
   How to install: open the Google Sheet "CYP EAT database" > Extensions > Apps Script > paste this whole file > Save.
   Run "setup" once. Then Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
   Write the web app URL in WEB_APP_URL (near the end of this file) and run "link": the link for the staff appears in the sheet "link". */
var SHEET_ID = ''; /* leave empty when the script is opened from inside the Sheet */
var DB_FILE = 'cyp-eat-database.json';
var PEOPLE_HEAD = ['Date', 'Centre', 'Meal', 'Plates', 'Counted by', 'Saved', 'Key'];
var FOOD_HEAD = ['Date', 'Centre', 'Meal', 'Step', 'Details', 'By', 'Saved', 'Key'];
var STOCK_HEAD = ['Date', 'Centre', 'What', 'Details', 'By', 'Saved', 'Key'];
var PLAN_HEAD = ['Week of', 'Centre', 'Plan', 'Remark', 'By', 'Saved', 'Key'];
var NOTE_HEAD = ['Note no.', 'Date', 'Centre', 'Items', 'Remark', 'Received by', 'Copied by', 'Saved', 'Key'];
var LOG_HEAD = ['Time', 'Who', 'Action', 'Detail'];
var COM_HEAD = ['Time', 'Who', 'Centre', 'Screen', 'Comment', 'Version', 'Done', 'Id'];
var BOOK_ = null;
function props_() { return PropertiesService.getScriptProperties(); }
function book_() { if (!BOOK_) BOOK_ = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); return BOOK_; }
function sheet_(name, head) {
  var sh = book_().getSheetByName(name);
  if (!sh) { sh = book_().insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function folder_() { var it = DriveApp.getFileById(book_().getId()).getParents(); return it.hasNext() ? it.next() : DriveApp.getRootFolder(); }
function when_(iso) { return iso ? Utilities.formatDate(new Date(iso), 'Africa/Lusaka', 'yyyy-MM-dd HH:mm') : ''; }
function safe_(t) { t = String(t == null ? '' : t); return /^[=+\-@]/.test(t) ? "'" + t : t; }
/* one row for each key: a new save of the same meal replaces its row */
function upsert_(sh, head, key, values) {
  var col = head.length, last = sh.getLastRow(), row = 0;
  if (last > 1) { var hit = sh.getRange(2, col, last - 1, 1).createTextFinder(key).matchEntireCell(true).findNext(); if (hit) row = hit.getRow(); }
  if (!row) row = last + 1;
  sh.getRange(row, 1, 1, head.length).setValues([values]);
}
/* the count of the fridge as written (beta 1.8 and 1.10): whole units and pieces, bags or loose */
function altWords_(it, a) {
  var u = a.u === 'loose' ? 'loose ' + it.use : a.u, k = a.u === 'bags' && a.k ? ' of about ' + a.k + ' kg' : (a.u === 'pieces' && a.k ? ' (' + a.k + ' in a chicken)' : '');
  return (a.w ? a.w + ' ' + it.unit + ' + ' : '') + a.n + ' ' + u + k;
}
function details_(db, e) {
  var d = e.data || {}, parts = [], id, it;
  if (e.type === 'menu') {
    if (d.mm) parts.push(e.meal === 'Breakfast' ? 'Porridge' : 'Nshima');
    if (d.bread) parts.push('Bread');
    for (var i = 0; i < (d.relish || []).length; i++) { it = eatItem(db, d.relish[i]); if (it) parts.push(it.name); }
    if (d.veg) parts.push(d.veg);
    return parts.join(', ');
  }
  if (e.type === 'skip' || e.type === 'dskip') return d.on ? 'Food not counted' : 'Food counted again';
  if (e.type === 'dmenu') {
    for (var m in (d.meals || {})) {
      var x = d.meals[m], p2 = [];
      if (x.mm) p2.push(m === 'Breakfast' ? 'Porridge' : 'Nshima');
      if (x.other) p2.push(x.other);
      for (var j = 0; j < (x.relish || []).length; j++) { it = eatItem(db, x.relish[j]); if (it) p2.push(it.name); }
      if (x.veg) p2.push(x.veg);
      parts.push(m + ': ' + p2.join(', '));
    }
    if (d.cook) parts.push('Head cook: ' + d.cook);
    return parts.join(' | ');
  }
  var q = d.q || {}, nc = d.nc || {};
  for (id in q) {
    if (id === 'pcs') { parts.push('Chicken pieces ' + (nc.pcs ? 'not counted' : q[id])); continue; }
    it = eatItem(db, id); if (!it) continue;
    var unit = e.type === 'received' || e.type === 'endweek' || e.type === 'startweek' || e.type === 'note' || (d.u && d.u[id] === 'unit') ? it.unit : (d.u && d.u[id] === 'alt' && EAT_ALT[id] ? EAT_ALT[id].unit + (d.ak && d.ak[id] ? ' (1 = ' + d.ak[id] + ' kg)' : '') : it.use);
    var alt = d.alt && d.alt[id], how = alt ? ' (written: ' + altWords_(it, alt) + ')' : '';
    parts.push(it.name + ' ' + (nc[id] || q[id] == null ? 'not counted' : (d.ab && d.ab[id] ? 'about ' : '') + q[id] + ' ' + unit + how));
  }
  if (e.type === 'dbefore' && d.pc != null) parts.push('Portions cooked ' + d.pc + (d.pcw ? ' (why different from the menu of the week: ' + d.pcw + ')' : ''));
  if (e.type === 'dbefore' && d.pp) for (var ppk in d.pp) { var ppi = eatItem(db, ppk); if (ppi) parts.push(ppi.name + ' for ' + d.pp[ppk] + ' portions'); }
  if (e.type === 'note') (d.parts || []).forEach(function (pt) { var w = []; for (var k in pt.q) { var pit = eatItem(db, k); if (pit) w.push(pt.q[k] + ' ' + pit.unit + ' of ' + pit.name.toLowerCase()); } parts.push('Of which for ' + pt.name + ': ' + w.join(', ')); });
  if (e.type === 'note' && d.days) parts.push('Should last ' + d.days + (d.days === 1 ? ' day' : ' days'));
  if (e.type === 'after' && (d.kept != null || d.keptNc)) parts.push('Meals kept for later: ' + (d.keptNc ? 'not counted' : d.kept));
  return parts.join('; ');
}
var STEP_ = { menu: 'What we eat', before: 'Quantities before', after: 'Quantities after', skip: 'Food not counted', received: 'Food delivered', endweek: 'End of the week', startweek: 'Start of the week', dmenu: 'What we eat today', dbefore: 'Quantities for today', dafter: 'Leftovers', dskip: 'Food not counted' };
/* after "start clean": the rows of the tests leave the sheets people, food and stock (the header stays; deliveries, log and comments stay) */
function cleanSheets_() {
  ['people', 'food', 'stock'].forEach(function (name) {
    var sh = book_().getSheetByName(name); if (!sh) return;
    var rows = sh.getLastRow() - 1; if (rows > 0) sh.getRange(2, 1, rows, Math.max(1, sh.getLastColumn())).clearContent();
  });
}
/* after "remove the counts of a day": the rows of those entries leave their sheet (found by the key in the last column) */
function unmirror_(list) {
  for (var i = 0; i < list.length; i++) {
    var e = list[i], st = e.type === 'received' || e.type === 'endweek' || e.type === 'startweek';
    var pp = e.type === 'people' || e.type === 'staff' || (e.type === 'dafter' && e.data && e.data.pr != null);
    var name = pp ? 'people' : (st ? 'stock' : 'food'), head = pp ? PEOPLE_HEAD : (st ? STOCK_HEAD : FOOD_HEAD);
    var sh = book_().getSheetByName(name); if (!sh || e.type === 'note') continue;
    var last = sh.getLastRow(); if (last < 2) continue;
    var hit = sh.getRange(2, head.length, last - 1, 1).createTextFinder(e.key).matchEntireCell(true).findNext();
    if (hit) sh.deleteRow(hit.getRow());
  }
}
/* the plan of a week in words, one day after the other: "Mon: Lunch 120, Dinner 40, Ukubalula 1 · eggs 7 trays" */
function planText_(db, e) {
  var WDN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], out = [], days = (e.data || {}).days || {};
  for (var w = 0; w < 7; w++) {
    var d = days[String(w)]; if (!d) continue; var ppl = [], food = [], k;
    for (k in (d.p || {})) ppl.push(k + ' ' + d.p[k]);
    for (k in (d.o || {})) ppl.push(k + ' ' + d.o[k]);
    for (k in (d.q || {})) { var it = eatItem(db, k); if (it) food.push(it.name.toLowerCase() + ' ' + d.q[k] + ' ' + it.unit); }
    out.push(WDN[w] + ': ' + (d.food ? d.food + ' · ' : '') + ppl.join(', ') + (food.length ? ' · ' + food.join(', ') : '') + (d.x || []).map(function (y) { return ' · different for ' + y.who + ': ' + y.food; }).join(''));
  }
  return out.join('\n');
}
function mirror_(db, list) {
  if (!list.length) return;
  for (var i = 0; i < list.length; i++) {
    var e = list[i], c = eatCentre(db, e.centre), cn = c ? c.name : e.centre;
    if (e.type === 'note') upsert_(sheet_('deliveries', NOTE_HEAD), NOTE_HEAD, e.key, [Number(e.data.no), e.date, cn, e.data.off ? 'Removed' : safe_(details_(db, e)), safe_(e.data.remark + (e.data.photo ? (e.data.remark ? ' · ' : '') + 'photo: https://drive.google.com/file/d/' + e.data.photo + '/view' : '')), safe_(e.data.recv), safe_(e.byName), when_(e.saved), e.key]);
    else if (e.type === 'plan') upsert_(sheet_('plans', PLAN_HEAD), PLAN_HEAD, e.key, [e.date, cn, safe_(planText_(db, e)), safe_(e.data.remark + (e.data.photo ? (e.data.remark ? ' · ' : '') + 'photo: https://drive.google.com/file/d/' + e.data.photo + '/view' : '')), safe_(e.byName), when_(e.saved), e.key]);
    else if (e.type === 'people') upsert_(sheet_('people', PEOPLE_HEAD), PEOPLE_HEAD, e.key, [e.date, cn, e.meal, e.data.g ? eatPlates(e) + ' (' + e.data.n + ' ' + cn + Object.keys(e.data.g).map(function (k) { return ', ' + e.data.g[k] + ' ' + k; }).join('') + ')' : e.data.n, safe_(e.byName), when_(e.saved), e.key]);
    else if (e.type === 'dafter' && e.data.pr != null) upsert_(sheet_('people', PEOPLE_HEAD), PEOPLE_HEAD, e.key, [e.date, cn, 'Portions remained', e.data.pr, safe_(e.byName), when_(e.saved), e.key]);
    else if (e.type === 'staff') upsert_(sheet_('people', PEOPLE_HEAD), PEOPLE_HEAD, e.key, [e.date, cn, 'Kitchen staff', e.data.n, safe_(e.byName), when_(e.saved), e.key]);
    else if (e.type === 'received' || e.type === 'endweek' || e.type === 'startweek') upsert_(sheet_('stock', STOCK_HEAD), STOCK_HEAD, e.key, [e.date, cn, STEP_[e.type], safe_(details_(db, e)), safe_(e.byName), when_(e.saved), e.key]);
    else upsert_(sheet_('food', FOOD_HEAD), FOOD_HEAD, e.key, [e.date, cn, e.meal || 'Whole day', STEP_[e.type], safe_(details_(db, e)), safe_(e.byName), when_(e.saved), e.key]);
  }
}
function comments_(list) {
  if (!list.length) return;
  var sh = sheet_('comments', COM_HEAD);
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    upsert_(sh, COM_HEAD, c.id, [when_(c.at), safe_(c.byName), c.centre, safe_(c.screen), safe_(c.text), c.version, c.done ? 'Done' : '', c.id]);
  }
}
function audit_(list) {
  if (!list.length) return;
  var sh = sheet_('log', LOG_HEAD), rows = [];
  for (var i = 0; i < list.length; i++) rows.push([when_(list[i].time), safe_(list[i].who), list[i].action, safe_(list[i].detail)]);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, LOG_HEAD.length).setValues(rows);
}
function store_() {
  var P = props_();
  return {
    key: function () { return P.getProperty('key') || ''; },
    now: function () { return new Date().toISOString(); },
    load: function () { var id = P.getProperty('dbId'); return id ? JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8')) : null; },
    readerOn: readerOn_,
    setReaderKey: function (v) { if (v) props_().setProperty('geminiKey', v); else props_().deleteProperty('geminiKey'); },
    read: readNote_,
    readPlan: readPlan_,
    backupInfo: backupInfo_,
    save: function (db, info) {
      var text = JSON.stringify(db), id = P.getProperty('dbId'), f = folder_();
      if (id) DriveApp.getFileById(id).setContent(text); else P.setProperty('dbId', f.createFile(DB_FILE, text, 'application/json').getId());
      var day = new Date().toISOString().slice(0, 10);
      if (P.getProperty('backupDay') !== day) { f.createFile('cyp-eat-backup-' + day + '.json', text, 'application/json'); P.setProperty('backupDay', day); }
      if (info && info.clean) cleanSheets_();
      /* the database is already saved: a sheet that cannot be changed must not stop the answer to the phone */
      if (info && info.gone && info.gone.length) { try { unmirror_(info.gone); } catch (err) {} }
      if (info) { mirror_(db, info.entries || []); audit_(info.audit || []); comments_(info.comments || []); }
    }
  };
}
/* ===== the photo reader: a photo of a delivery note, saved on Drive and read by Gemini =====
   The key is written from the app (Overview > Settings > Photo reader) and kept in the script properties, never in the database. */
var PHOTO_DIR = 'CYP EAT delivery photos';
function photoFolder_() { var f = folder_(), it = f.getFoldersByName(PHOTO_DIR); return it.hasNext() ? it.next() : f.createFolder(PHOTO_DIR); }
function readerOn_() { return !!props_().getProperty('geminiKey'); }
function readerPrompt_(db) {
  var places = eatPlaces(db).map(function (c) { return c.name; }).join('; ');
  var items = db.items.map(function (it) { return it.id + ' = ' + it.name + ' (in ' + it.unit + ')'; }).join('; ');
  return 'You read a photo of a paper delivery note of Self Reliance, the farm and butchery of the Pope John XXIII Association in Ndola, Zambia. ' +
    'The note has a printed red number, a date, the place the food goes to, lines with a quantity and an item, and "received by". ' +
    'The photo often shows the booklet open, with two notes side by side: read every note in the photo. ' +
    'Return only this JSON: {"notes": [{"readable": true or false, "note_number": "the digits of the red number, or empty", "date": "YYYY-MM-DD, or empty", ' +
    '"place": "the place the food goes to (after M/s): one of ' + places + ', or the name as written", "items": [{"item": "item id", "quantity": number}], ' +
    '"for_others": [{"place": "the other place", "items": [{"item": "item id", "quantity": number}]}], ' +
    '"received_by": "the name, or empty", "remark": "anything else written, short"}]}. ' +
    '"for_others": only when the note says that a part of the food is for another place, for example "02 chickens for Chinika House" written or circled on a note for Minsundu: ' +
    'then "items" keeps the whole quantity of the line (26 chickens) and "for_others" has the part (2 chickens for Chinika House). Otherwise leave it empty. ' +
    'Item ids: ' + items + '. Give each quantity in the unit in brackets: mealie meal in bags (packs or bags of mealie meal are bags), eggs in trays, chickens as whole chickens, pork and fish in kg. ' +
    'Halves and quarters as 0.5 and 0.25. Dates are written day/month/year; the year is 20' + new Date().getFullYear().toString().slice(2) + ' if not written. ' +
    'If a note is empty, cut, or its number or quantities cannot be read, set its "readable" to false. If the photo shows no delivery note, return {"notes": []}.';
}
function readNote_(img, db) {
  var key = props_().getProperty('geminiKey'); if (!key) return { ok: false, error: 'no_reader' };
  var name = 'delivery-' + Utilities.formatDate(new Date(), 'Africa/Lusaka', 'yyyy-MM-dd_HHmmss') + '.jpg';
  var file = photoFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(img), 'image/jpeg', name));
  var body = { contents: [{ parts: [{ text: readerPrompt_(db) }, { inline_data: { mime_type: 'image/jpeg', data: img } }] }], generationConfig: { responseMimeType: 'application/json' } };
  /* Flash-Lite reads a photo in about 10 seconds. Flash takes one to two minutes on the free key (20/11/2026): it is used only
     if the Flash-Lite name stops existing. A note Flash-Lite cannot read is photographed again: that is faster than waiting. */
  var models = [props_().getProperty('geminiModel') || 'gemini-flash-lite-latest', 'gemini-flash-latest'], best = null, last = '';
  for (var i = 0; i < models.length && !best; i++) {
    var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, payload: JSON.stringify(body), muteHttpExceptions: true });
    var code = res.getResponseCode(); last = code + ' ' + res.getContentText().slice(0, 160);
    /* 404: the model name is gone; 500/503: the model is busy ("high demand", 24/11): try the next model */
    if (code === 404 || code === 500 || code === 503) continue;
    if (code !== 200) return { ok: false, error: code === 400 || code === 403 ? 'reader_key' : (code === 429 || code === 503 ? 'reader_busy' : 'reader'), detail: last, photo: file.getId() };
    var out = JSON.parse(res.getContentText()), parts = (((out.candidates || [])[0] || {}).content || {}).parts || [], text = '';
    for (var j = 0; j < parts.length; j++) if (parts[j].text) text += parts[j].text;
    var r; try { r = JSON.parse(text.replace(/^\s*```(?:json)?/, '').replace(/```\s*$/, '')); } catch (e) { return { ok: false, error: 'reader', detail: 'not json', photo: file.getId() }; }
    var notes = (r.notes || (r.note_number !== undefined ? [r] : [])).map(function (n) { return readOne_(n, db); });
    best = { notes: notes, model: models[i] };
  }
  if (!best) return { ok: false, error: 'reader', detail: last, photo: file.getId() };
  return { ok: true, photo: file.getId(), reads: best.notes, read: best.notes[0] || { clear: false, no: '', date: '', centre: '', q: {} }, model: best.model };
}
/* the photo of the plan of the week a kitchen writes on paper ("Weekly food quantities"), saved on Drive and read by Gemini.
   Sapa is supper: the dinner. Every number changes from week to week. */
function readPlanPrompt_(db) {
  var places = eatPlaces(db).map(function (c) { return c.name; }).join('; ');
  var items = db.items.map(function (it) { return it.id + ' = ' + it.name + ' (in ' + it.unit + ')'; }).join('; ');
  return 'You read a photo of the weekly food plan of a canteen of the Pope John XXIII Association in Ndola, Zambia, often titled "Weekly food quantities", with the dates of the week and the name of the kitchen. ' +
    'For each day it gives the food of the day, the number of people for each meal and the quantities. "Sapa" is supper: the dinner. "Skills are included" means nothing for you. ' +
    'Some days give people for another place the kitchen cooks for, such as Ukubalula or Chinika: those are other places, not meals. ' +
    'Return only this JSON: {"readable": true or false, "kitchen": "the kitchen: one of ' + places + ', or the name as written", "week_start": "YYYY-MM-DD of the first day, or empty", "remark": "anything else written, short", ' +
    '"days": [{"day": "Monday" to "Sunday", "food": "the food of the day, short", "lunch": number of people or null, "dinner": number of people for sapa or supper or null, ' +
    '"other_places": [{"place": "the name", "people": number}], "items": [{"item": "item id", "quantity": number}]}]}. ' +
    'Item ids: ' + items + '. Give each quantity in the unit in brackets: eggs in trays (30 eggs a tray), mealie meal in bags (packs of mealie meal are bags), chickens as whole chickens, pork and fish in kg, mealie meal in bags. ' +
    'Give the total of the day for each item: when a total is written ("Tot", "Total"), give that number exactly; otherwise add up the lines. A balance or a remainder carried from another day is already counted in the total: never add it again. Leave out an item with no quantity. ' +
    'Pieces of pork or a number of people are not quantities. Dates are written day/month/year; the year is 20' + new Date().getFullYear().toString().slice(2) + ' if not written. ' +
    'If the photo shows no plan, or it cannot be read, set "readable" to false.';
}
function readPlan_(img, db) {
  var key = props_().getProperty('geminiKey'); if (!key) return { ok: false, error: 'no_reader' };
  var name = 'plan-' + Utilities.formatDate(new Date(), 'Africa/Lusaka', 'yyyy-MM-dd_HHmmss') + '.jpg';
  var file = photoFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(img), 'image/jpeg', name));
  var body = { contents: [{ parts: [{ text: readPlanPrompt_(db) }, { inline_data: { mime_type: 'image/jpeg', data: img } }] }], generationConfig: { responseMimeType: 'application/json' } };
  var models = [props_().getProperty('geminiModel') || 'gemini-flash-lite-latest', 'gemini-flash-latest'], last = '';
  for (var i = 0; i < models.length; i++) {
    var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, payload: JSON.stringify(body), muteHttpExceptions: true });
    var code = res.getResponseCode(); last = code + ' ' + res.getContentText().slice(0, 160);
    /* 404: the model name is gone; 500/503: the model is busy ("high demand", 24/11): try the next model */
    if (code === 404 || code === 500 || code === 503) continue;
    if (code !== 200) return { ok: false, error: code === 400 || code === 403 ? 'reader_key' : (code === 429 || code === 503 ? 'reader_busy' : 'reader'), detail: last, photo: file.getId() };
    var out = JSON.parse(res.getContentText()), parts = (((out.candidates || [])[0] || {}).content || {}).parts || [], text = '';
    for (var j = 0; j < parts.length; j++) if (parts[j].text) text += parts[j].text;
    var r; try { r = JSON.parse(text.replace(/^\s*```(?:json)?/, '').replace(/```\s*$/, '')); } catch (e) { return { ok: false, error: 'reader', detail: 'not json', photo: file.getId() }; }
    return { ok: true, photo: file.getId(), plan: eatPlanRead(db, r), model: models[i] };
  }
  return { ok: false, error: /^5\d\d /.test(last) ? 'reader_busy' : 'reader', detail: last, photo: file.getId() };
}
function placeId_(text, db) { return eatPlaceMatch(db, text); }
function readItems_(list, db) { var q = {}; (list || []).forEach(function (x) { var it = eatItem(db, String(x.item || '')); var n = eatNum(x.quantity); if (it && n) q[it.id] = (q[it.id] || 0) + n; }); return q; }
function readOne_(r, db) {
  var centre = placeId_(r.place, db), q = readItems_(r.items, db), parts = [];
  /* a part for another place: only for items on the note, and not more than the note has */
  (r.for_others || []).forEach(function (o) {
    var pq = readItems_(o.items, db), ok = {}, any = false, to = placeId_(o.place, db), name = eatText(o.place, 60);
    for (var id in pq) if (q[id]) { ok[id] = Math.min(pq[id], q[id]); any = true; }
    if (any && name && to !== centre) parts.push({ to: to, name: to ? eatCentre(db, to).name : name, q: ok });
  });
  return { clear: r.readable !== false, no: eatNoteNo(r.note_number), date: eatIsDate(r.date) ? r.date : '', centre: centre, placeText: eatText(r.place, 60), q: q, parts: parts, recv: eatText(r.received_by, 60), remark: eatText(r.remark, 200) };
}
/* Run once from the editor after this update: Google asks Mauro to allow the photo reader (internet calls and the photo folder). */
function authorize() { UrlFetchApp.fetch('https://generativelanguage.googleapis.com/', { muteHttpExceptions: true }); photoFolder_(); Logger.log('Done: the photo reader is allowed. The key is written in the app: Overview > Settings > Photo reader.'); }
/* ===== the backup of every night: a copy of the database file in the folder "CYP EAT backups", at 2:00 (Ndola time) =====
   installBackup() is run once from the editor; Google then runs nightlyBackup() by itself every night. */
var BACKUP_DIR = 'CYP EAT backups';
function backupFolder_() { var f = folder_(), it = f.getFoldersByName(BACKUP_DIR); return it.hasNext() ? it.next() : f.createFolder(BACKUP_DIR); }
function nightlyBackup() {
  var id = props_().getProperty('dbId'); if (!id) return;
  var text = DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8'), db = JSON.parse(text);
  var name = 'cyp-eat-backup-' + Utilities.formatDate(new Date(), 'Africa/Lusaka', 'yyyy-MM-dd_HHmm') + '.json';
  backupFolder_().createFile(name, text, 'application/json');
  props_().setProperty('backupLast', new Date().toISOString());
  Logger.log('Backup saved: ' + name + ' (' + db.entries.length + ' entries, ' + Math.round(text.length / 1024) + ' KB)');
}
function installBackup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'nightlyBackup') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(2).nearMinute(0).inTimezone('Africa/Lusaka').create();
  props_().setProperty('backupOn', '1');
  nightlyBackup();
  Logger.log('Done: a backup is saved every night at about 2:00 (Ndola time), in the folder "' + BACKUP_DIR + '". One was saved now.');
}
function backupInfo_() { return { on: props_().getProperty('backupOn') === '1', last: props_().getProperty('backupLast') || '' }; }
function reply_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var lock = null;
  try {
    var req = JSON.parse(e.postData.contents);
    /* one phone at a time, so two saves never overwrite each other */
    /* reading a photo takes several seconds and writes nothing in the database: it does not wait for the others */
    if (req.action !== 'hello' && req.action !== 'read') { lock = LockService.getScriptLock(); lock.waitLock(25000); }
    return reply_(eatHandle(req, store_()));
  } catch (err) { return reply_({ ok: false, error: 'server', detail: String(err) }); }
  finally { if (lock) { try { lock.releaseLock(); } catch (x) {} } }
}
function doGet(e) { return ContentService.createTextOutput('CYP EAT shared database'); }
/* Run once from the editor: prepares the sheets and the key. */
function setup() {
  sheet_('people', PEOPLE_HEAD); sheet_('food', FOOD_HEAD); sheet_('stock', STOCK_HEAD); sheet_('deliveries', NOTE_HEAD); sheet_('log', LOG_HEAD); sheet_('comments', COM_HEAD);
  if (!props_().getProperty('key')) props_().setProperty('key', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  Logger.log('Ready. Now: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone. Then write the web app URL in WEB_APP_URL and run the function "link".');
}
/* Run after the deployment: writes the link for the staff in the sheet "link". */
var WEB_APP_URL = '';
var APP_URL = 'https://maurobif-blip.github.io/cyp-eat/';
function link() {
  if (!WEB_APP_URL) { Logger.log('Write the web app URL (it ends with /exec) in WEB_APP_URL, then run "link" again.'); return; }
  var code = Utilities.base64EncodeWebSafe(WEB_APP_URL + '|' + props_().getProperty('key')).replace(/=+$/, '');
  var sh = sheet_('link', ['CYP EAT: link for the people who count. Keep it inside the team. They also need the data entry PIN.']);
  sh.getRange(2, 1).setValue(APP_URL + '?db=' + code);
  sh.setColumnWidth(1, 900);
  Logger.log('Done. The link is in the sheet "link", cell A2.');
}
