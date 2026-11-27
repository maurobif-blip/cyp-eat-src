const C = require('../core.js'); const assert = require('assert');
// the tests written before alpha 0.16 use the meals of that time: breakfast at Minsundu, dinner counted
function oldDb() { const d = C.eatNewDb(); d.centres.forEach(c => { delete c.fixed; c.meals = c.id === 'MIN' ? ['Breakfast', 'Lunch', 'Dinner'] : (c.id === 'NKW' ? ['Lunch', 'Dinner'] : ['Lunch']); }); return d; }
let db = oldDb(), now = '2026-11-19T08:00:00Z', n = 0;
function op(kind, x, mode) { const o = Object.assign({ id: 'o' + (++n), kind }, x); return C.eatApply(db, mode || 'entry', o, now, null); }
function ent(type, centre, date, meal, data, at) { return op('entry', { e: { type, centre, date, meal, data, by: 'n1', byName: 'Anna', at: at || now } }); }
// rights
assert.equal(op('name_add', { name: 'Anna', role: 'Volunteer', nid: 'n1' }).error, 'rights');
assert.ok(op('name_add', { name: 'Anna', role: 'Volunteer', nid: 'n1' }, 'admin').ok);
assert.equal(op('name_add', { name: 'anna', role: 'Canteen' }, 'admin').error, 'same');
// future date refused
assert.equal(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 3 }).error, 'future');
// a week: count Mon 16 (start), received, used Tue, end count Fri
assert.ok(ent('endweek', 'MIN', '2026-11-15', '', { q: { mm: 4, chk: 4, egg: 2 } }).ok);
assert.ok(ent('received', 'MIN', '2026-11-16', '', { q: { mm: 10, chk: 48, egg: 12 } }).ok);
assert.ok(ent('people', 'MIN', '2026-11-17', 'Lunch', { n: 124 }).ok);
assert.ok(ent('menu', 'MIN', '2026-11-17', 'Lunch', { mm: true, relish: ['chk'], veg: 'Rape' }).ok);
assert.deepEqual(C.eatRows(db, 'MIN', '2026-11-17', 'Lunch'), ['mm', 'chk', 'veg']);
assert.ok(ent('before', 'MIN', '2026-11-17', 'Lunch', { q: { mm: 30, chk: 23, pcs: 184, veg: 18 } }).ok);
let u = C.eatMealUse(db, 'MIN', '2026-11-17', 'Lunch');
assert.equal(u.hasAfter, false); assert.equal(C.eatPerPlate(u, 'mm'), null);
assert.ok(ent('after', 'MIN', '2026-11-17', 'Lunch', { q: { mm: 2.5, chk: 0, pcs: 6, veg: 0 }, kept: 60 }).ok);
u = C.eatMealUse(db, 'MIN', '2026-11-17', 'Lunch');
assert.equal(u.used.mm, 27.5); assert.equal(u.pieces, 178); assert.equal(u.base, 184);
assert.equal(Math.round(C.eatPerPlate(u, 'mm') * 1000), 149);
// stock on Fri 20: mm start 4 + 10 - 27.5/25 = 12.9 bags ; chk 4 + 48 - 23 = 29
let st = C.eatStock(db, 'MIN', '2026-11-20');
assert.equal(st.mm.expected, 12.9); assert.equal(st.chk.expected, 29); assert.equal(st.egg.expected, 14);
assert.equal(st.mm.startDate, '2026-11-15');
// not counted makes the stock unknown for that item only
assert.ok(ent('before', 'MIN', '2026-11-18', 'Lunch', { q: { mm: null, egg: 90 }, nc: { mm: true } }).ok);
st = C.eatStock(db, 'MIN', '2026-11-20');
assert.equal(st.mm.expected, null); assert.equal(st.egg.expected, 11);  // 14 - 90/30 (after missing: all used)
// skip: the meal does not count
assert.ok(ent('skip', 'MIN', '2026-11-18', 'Lunch', { on: true }).ok);
st = C.eatStock(db, 'MIN', '2026-11-20');
assert.equal(st.mm.expected, 12.9); assert.equal(st.egg.expected, 14);
// a later save replaces; an older one arriving late does not
assert.ok(ent('people', 'MIN', '2026-11-17', 'Lunch', { n: 130 }, '2026-11-19T09:00:00Z').ok);
assert.ok(ent('people', 'MIN', '2026-11-17', 'Lunch', { n: 99 }, '2026-11-19T07:00:00Z').older);
assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-17', 'Lunch').data.n, 130);
now = '2026-11-23T08:00:00Z';
// end of week count carries: next week starts from it
assert.ok(ent('endweek', 'MIN', '2026-11-20', '', { q: { mm: 12, chk: 27, egg: 14, fsh: 0, bea: 1, prk: 0, sau: 0 } }).ok);
st = C.eatStock(db, 'MIN', '2026-11-23');
assert.equal(st.chk.start, 27); assert.equal(st.chk.expected, 27); assert.equal(st.mm.startDate, '2026-11-20');
// beans: kg per bag not set -> unknown when used
assert.ok(ent('menu', 'MIN', '2026-11-19', 'Lunch', { mm: true, relish: ['bea'] }).ok);
assert.ok(ent('before', 'MIN', '2026-11-19', 'Lunch', { q: { mm: 25, bea: 10 } }).ok);
st = C.eatStock(db, 'MIN', '2026-11-19');
assert.equal(st.bea.expected, null);
assert.ok(op('item_per', { iid: 'bea', per: 50 }, 'admin').ok);
st = C.eatStock(db, 'MIN', '2026-11-19');
assert.ok(st.bea.expected != null);
// handle: key, pins, lock
let mem = null; const store = { key: () => 'K', now: () => now, load: () => mem && JSON.parse(JSON.stringify(mem)), save: (d) => { mem = JSON.parse(JSON.stringify(d)); } };
assert.equal(C.eatHandle({ key: 'x', action: 'hello' }, store).error, 'key');
assert.equal(C.eatHandle({ key: 'K', action: 'hello' }, store).empty, true);
assert.ok(C.eatHandle({ key: 'K', action: 'setup', entry: { salt: 'a', cred: 'E' }, admin: { salt: 'b', cred: 'A' } }, store).ok);
assert.equal(C.eatHandle({ key: 'K', action: 'setup', entry: { salt: 'a', cred: 'E' }, admin: { salt: 'b', cred: 'A' } }, store).error, 'not_empty');
const h = C.eatHandle({ key: 'K', action: 'hello' }, store); assert.equal(h.settings.entry.cred, undefined); assert.equal(h.settings.entry.salt, 'a');
for (let i = 0; i < 5; i++) assert.equal(C.eatHandle({ key: 'K', action: 'login', mode: 'entry', cred: 'bad' }, store).error, 'pin');
assert.equal(C.eatHandle({ key: 'K', action: 'login', mode: 'entry', cred: 'E' }, store).error, 'locked');
assert.ok(C.eatHandle({ key: 'K', action: 'login', mode: 'admin', cred: 'A' }, store).ok);
let r = C.eatHandle({ key: 'K', action: 'sync', mode: 'admin', cred: 'A', since: 0, ops: [{ id: 'z1', kind: 'name_add', name: 'Mary', role: 'Canteen' }] }, store);
assert.ok(r.ok && r.results[0].ok && r.names.length === 1);
r = C.eatHandle({ key: 'K', action: 'sync', mode: 'admin', cred: 'A', since: 0, ops: [{ id: 'z1', kind: 'name_add', name: 'Mary', role: 'Canteen' }] }, store);
assert.ok(r.results[0].again);
// alpha 0.2: quantities before in bags or trays, bread at breakfast, old databases get the new item
{
  let d2 = oldDb(); d2.items = d2.items.filter(i => i.id !== 'brd');
  assert.ok(C.eatUpgrade(d2)); assert.ok(d2.items.some(i => i.id === 'brd')); assert.ok(!C.eatUpgrade(d2));
  db = oldDb(); now = '2026-11-19T08:00:00Z';
  assert.ok(ent('endweek', 'MIN', '2026-11-15', '', { q: { mm: 4, egg: 2, brd: 10, bea: 3 } }).ok);
  // breakfast: bread
  assert.ok(ent('menu', 'MIN', '2026-11-17', 'Breakfast', { mm: false, bread: true }).ok);
  assert.deepEqual(C.eatRows(db, 'MIN', '2026-11-17', 'Breakfast'), ['brd']);
  assert.ok(ent('before', 'MIN', '2026-11-17', 'Breakfast', { q: { brd: 6 } }).ok);
  assert.ok(ent('after', 'MIN', '2026-11-17', 'Breakfast', { q: { brd: 1 } }).ok);
  // lunch: mealie meal 1.5 bags and 2 trays of eggs taken out; back 5 kg and 6 eggs
  assert.ok(ent('menu', 'MIN', '2026-11-17', 'Lunch', { mm: true, relish: ['egg', 'bea'] }).ok);
  assert.ok(ent('before', 'MIN', '2026-11-17', 'Lunch', { q: { mm: 1.5, egg: 2, bea: 1 }, u: { mm: 'unit', egg: 'unit', bea: 'unit', chk: 'unit' } }).ok);
  assert.deepEqual(C.eatGet(db, 'before', 'MIN', '2026-11-17', 'Lunch').data.u, { mm: 'unit', egg: 'unit', bea: 'unit' });
  assert.ok(ent('after', 'MIN', '2026-11-17', 'Lunch', { q: { mm: 5, egg: 6, bea: 0 }, u: { mm: 'use', egg: 'use', bea: 'unit' } }).ok);
  let v = C.eatMealUse(db, 'MIN', '2026-11-17', 'Lunch');
  assert.equal(v.used.mm, 32.5); assert.equal(v.usedU.mm, 1.3); assert.equal(v.used.egg, 54); assert.equal(v.usedU.egg, 1.8);
  assert.equal(v.used.bea, null); assert.equal(v.usedU.bea, 1); // beans: bag size not set, the stock still works in bags
  let s2 = C.eatStock(db, 'MIN', '2026-11-19');
  assert.equal(s2.mm.expected, 2.7); assert.equal(s2.egg.expected, 0.2); assert.equal(s2.brd.expected, 5); assert.equal(s2.bea.expected, 2);
}
// alpha 0.3: delivery notes, one per number, counted in the store
{
  db = oldDb(); now = '2026-11-19T08:00:00Z';
  assert.ok(ent('endweek', 'MIN', '2026-11-15', '', { q: { egg: 2, prk: 0, fsh: 0 } }).ok);
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28586', q: { egg: 8, xyz: 4, prk: 0 }, remark: '02 trays for Chinika House', recv: 'Renard' }).ok);
  assert.ok(ent('note', 'MIN', '2026-11-18', '', { no: '28593', q: { fsh: 75 } }).ok);
  assert.ok(ent('note', 'NKW', '2026-11-18', '', { no: '28595', q: { prk: 20 } }).ok);
  assert.equal(ent('note', 'MIN', '2026-11-18', '', { no: '', q: { fsh: 1 } }).error, 'note_no');
  let n = C.eatNote(db, '28586'); assert.deepEqual(n.data.q, { egg: 8 }); assert.equal(n.data.remark, '02 trays for Chinika House');
  // the same number saved again (other centre, other date) replaces the note
  assert.ok(ent('note', 'LUI', '2026-11-17', '', { no: '28586', q: { egg: 6 } }).ok);
  assert.equal(C.eatNotes(db, '2026-11-16', '2026-11-22').length, 3);
  assert.equal(C.eatNote(db, '28586').centre, 'LUI');
  let st = C.eatStock(db, 'MIN', '2026-11-19');
  assert.equal(st.egg.inn, 0); assert.equal(st.fsh.inn, 75); assert.equal(st.fsh.expected, 75);
  assert.equal(C.eatStock(db, 'LUI', '2026-11-19').egg.inn, 6);
  // missing numbers in the book
  assert.deepEqual(C.eatNoteGaps(db), [{ from: 28587, to: 28592 }, { from: 28594, to: 28594 }]);
  // a removed note leaves the store but keeps its number
  assert.ok(ent('note', 'MIN', '2026-11-18', '', { no: '28593', q: { fsh: 75 }, off: true }).ok);
  assert.equal(C.eatStock(db, 'MIN', '2026-11-19').fsh.inn, 0);
  assert.equal(C.eatNotes(db, '2026-11-16', '2026-11-22').length, 2);
  assert.deepEqual(C.eatNoteGaps(db), [{ from: 28587, to: 28592 }, { from: 28594, to: 28594 }]);
  // a note in the future is refused
  assert.equal(ent('note', 'MIN', '2026-11-20', '', { no: '28600', q: { egg: 1 } }).error, 'future');
}
// alpha 0.4: stock at the start of the week, how long a delivery should last
{
  db = oldDb(); now = '2026-11-19T08:00:00Z';
  // end count Fri 13, weekend breakfast, start count Mon 16 morning, delivery Mon 16, lunch Mon 16
  assert.ok(ent('endweek', 'MIN', '2026-11-13', '', { q: { mm: 4, egg: 3 } }).ok);
  assert.ok(ent('before', 'MIN', '2026-11-15', 'Breakfast', { q: { mm: 1 }, u: { mm: 'unit' } }).ok);
  let s0 = C.eatStock(db, 'MIN', '2026-11-16', true);  // Monday morning, before its count
  assert.equal(s0.mm.expected, 3); assert.equal(s0.mm.startKind, 'end');
  assert.ok(ent('startweek', 'MIN', '2026-11-16', '', { q: { mm: 2.5, egg: 3 } }).ok);
  assert.equal(C.eatStock(db, 'MIN', '2026-11-16', true).mm.expected, 3); // still the stock before the count
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28301', q: { mm: 10 }, days: 7 }).ok);
  assert.ok(ent('before', 'MIN', '2026-11-16', 'Lunch', { q: { mm: 2 }, u: { mm: 'unit' } }).ok);
  let s1 = C.eatStock(db, 'MIN', '2026-11-16');  // the delivery and the lunch of Monday come after the morning count
  assert.equal(s1.mm.start, 2.5); assert.equal(s1.mm.startKind, 'start'); assert.equal(s1.mm.inn, 10); assert.equal(s1.mm.used, 2); assert.equal(s1.mm.expected, 10.5);
  // an end count on the same day closes the day
  assert.ok(ent('endweek', 'MIN', '2026-11-18', '', { q: { mm: 10, egg: 3 } }).ok);
  assert.equal(C.eatStock(db, 'MIN', '2026-11-18').mm.expected, 10.5);
  assert.equal(C.eatStock(db, 'MIN', '2026-11-19').mm.start, 10);
  assert.equal(C.eatWeekCount(db, 'MIN', '2026-11-16', 'startweek').date, '2026-11-16');
  assert.equal(C.eatWeekCount(db, 'MIN', '2026-11-16', 'endweek').date, '2026-11-18');
  assert.equal(C.eatWeekCount(db, 'MIN', '2026-11-09', 'endweek').date, '2026-11-13');
  let nt = C.eatNote(db, '28301'); assert.equal(nt.data.days, 7); assert.equal(C.eatNoteUntil(nt), '2026-11-22');
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28302', q: { mm: 1 } }).ok);
  assert.equal(C.eatNote(db, '28302').data.days, null); assert.equal(C.eatNoteUntil(C.eatNote(db, '28302')), '');
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28303', q: { mm: 1 }, days: 0 }).ok);
  assert.equal(C.eatNote(db, '28303').data.days, null);
}
// alpha 0.5: the food of the whole day, leftovers only where counted, fractions
{
  assert.equal(C.eatNum('1/2'), 0.5); assert.equal(C.eatNum('1 1/2'), 1.5); assert.equal(C.eatNum('0,25'), 0.25); assert.equal(C.eatNum('½'), 0.5); assert.equal(C.eatNum('2¼'), 2.25);
  assert.equal(C.eatNum('abc'), null); assert.equal(C.eatNum('-1'), null); assert.equal(C.eatNum(0.75), 0.75);
  db = oldDb(); now = '2026-11-19T08:00:00Z';
  let d3 = oldDb(); delete d3.centres[0].left; assert.ok(C.eatUpgrade(d3)); assert.equal(d3.centres[0].left, true); assert.equal(d3.centres[1].left, false);
  C.eatUpgrade(db);
  // the menu of the day: plan when not saved, all meals at once when saved
  let mn = C.eatDayMenu(db, 'MIN', '2026-11-19');
  assert.equal(mn.saved, false); assert.deepEqual(Object.keys(mn.meals), ['Breakfast', 'Lunch', 'Dinner']); assert.deepEqual(mn.meals.Lunch.relish, ['fsh']);
  assert.ok(ent('dmenu', 'MIN', '2026-11-19', '', { meals: { Breakfast: { mm: false, other: 'Bread and tea' }, Lunch: { mm: true, relish: ['chk', 'zzz'], veg: 'Rape' }, Dinner: { mm: true, relish: ['egg'] } } }).ok);
  mn = C.eatDayMenu(db, 'MIN', '2026-11-19'); assert.equal(mn.meals.Breakfast.other, 'Bread and tea'); assert.deepEqual(mn.meals.Lunch.relish, ['chk']);
  assert.deepEqual(C.eatDayRows(db, 'MIN', '2026-11-19'), ['mm', 'chk', 'egg', 'veg']);
  // people of the day: breakfast 50, lunch 120, dinner 60
  assert.ok(ent('people', 'MIN', '2026-11-19', 'Breakfast', { n: 50 }).ok);
  assert.ok(ent('people', 'MIN', '2026-11-19', 'Lunch', { n: 120 }).ok);
  assert.ok(ent('people', 'MIN', '2026-11-19', 'Dinner', { n: 60 }).ok);
  // quantities for today: 1.5 bags (37.5 kg), 20 chickens, 2 trays
  assert.ok(ent('dbefore', 'MIN', '2026-11-19', '', { q: { mm: 1.5, chk: 20, egg: 2, pcs: 160 }, u: { mm: 'unit', egg: 'unit' } }).ok);
  let u = C.eatDayUse(db, 'MIN', '2026-11-19');
  assert.equal(u.plates, 230); assert.equal(u.closed, false); assert.equal(C.eatPerPlate(u, 'mm'), null);  // Minsundu counts the leftovers
  assert.ok(ent('dafter', 'MIN', '2026-11-19', '', { q: { mm: 0.25, chk: 0, egg: 0, pcs: 0 }, u: { mm: 'unit', egg: 'unit' } }).ok);
  u = C.eatDayUse(db, 'MIN', '2026-11-19');
  assert.equal(u.closed, true); assert.equal(u.usedU.mm, 1.25); assert.equal(u.used.mm, 31.25); assert.equal(u.pieces, 160);
  assert.equal(Math.round(C.eatPerPlate(u, 'mm') * 1000), 136);
  let st = C.eatStock(db, 'MIN', '2026-11-19'); assert.equal(st.mm.used, 1.25); assert.equal(st.chk.used, 20);
  // Luigi: leftovers not counted, everything taken out is used
  assert.ok(ent('people', 'LUI', '2026-11-19', 'Lunch', { n: 80 }).ok);
  assert.ok(ent('dbefore', 'LUI', '2026-11-19', '', { q: { mm: 0.5, egg: 1 }, u: { mm: 'unit', egg: 'unit' } }).ok);
  assert.ok(ent('dafter', 'LUI', '2026-11-19', '', { q: { mm: 0.25 }, u: { mm: 'unit' } }).ok);  // saved by mistake: not used
  u = C.eatDayUse(db, 'LUI', '2026-11-19');
  assert.equal(u.closed, true); assert.equal(u.usedU.mm, 0.5); assert.equal(C.eatPerPlate(u, 'egg'), 30 / 80);
  // the overview changes where leftovers are counted
  assert.ok(op('centre_left', { cid: 'LUI', on: true }, 'admin').ok); assert.equal(C.eatDayUse(db, 'LUI', '2026-11-19').usedU.mm, 0.25);
  assert.equal(op('centre_left', { cid: 'LUI', on: false }).error, 'rights');
  // food not counted for the day
  assert.ok(ent('dskip', 'LUI', '2026-11-19', '', { on: true }).ok);
  assert.equal(C.eatStock(db, 'LUI', '2026-11-19').mm.used, 0);
}
// alpha 0.6: the deliveries access, places, the photo reader
{
  db = oldDb(); now = '2026-11-19T08:00:00Z'; C.eatUpgrade(db);
  assert.ok(op('place_add', { name: 'Holy Family' }, 'admin').ok);
  assert.equal(op('place_add', { name: 'holy family' }, 'admin').error, 'same');
  assert.equal(op('place_add', { name: 'X' }).error, 'rights');
  const hf = db.centres.find(c => c.name === 'Holy Family'); assert.ok(hf.place);
  assert.deepEqual(C.eatCanteens(db).map(c => c.id), ['MIN', 'LUI', 'NKW', 'MCU']); assert.equal(C.eatPlaces(db).length, 6);
  // the deliveries access saves delivery notes only
  assert.ok(op('entry', { e: { type: 'note', centre: hf.id, date: '2026-11-19', data: { no: '28301', q: { mm: 12 }, photo: 'abcDEF123456789_-' }, byName: 'Deliveries' } }, 'delivery').ok);
  assert.equal(C.eatNote(db, '28301').data.photo, 'abcDEF123456789_-');
  assert.equal(op('entry', { e: { type: 'people', centre: 'MIN', date: '2026-11-19', meal: 'Lunch', data: { n: 3 } } }, 'delivery').error, 'rights');
  assert.equal(op('name_add', { name: 'Z' }, 'delivery').error, 'rights');
  assert.ok(op('comment', { c: { text: 'hello' } }, 'delivery').ok);
  // a place has no canteen: no people or food there
  assert.equal(ent('people', hf.id, '2026-11-19', 'Lunch', { n: 3 }).error, 'place');
  assert.ok(op('place_off', { cid: hf.id }, 'admin').ok); assert.equal(C.eatPlaces(db).length, 5);
  assert.equal(op('place_off', { cid: 'MIN' }, 'admin').error, 'id');
  // the handle: deliveries PIN, read, reader key
  let mem2 = null, key = '';
  const st2 = { key: () => 'K', now: () => now, load: () => mem2 && JSON.parse(JSON.stringify(mem2)), save: (d) => { mem2 = JSON.parse(JSON.stringify(d)); },
    readerOn: () => !!key, setReaderKey: (v) => { key = v; }, read: (img) => ({ ok: true, photo: 'p1', read: { no: '1' } }) };
  assert.ok(C.eatHandle({ key: 'K', action: 'setup', entry: { salt: 'a', cred: 'E' }, admin: { salt: 'b', cred: 'A' } }, st2).ok);
  assert.equal(C.eatHandle({ key: 'K', action: 'login', mode: 'delivery', cred: 'D' }, st2).error, 'no_pin');
  assert.ok(C.eatHandle({ key: 'K', action: 'sync', mode: 'admin', cred: 'A', since: 0, ops: [{ id: 'q1', kind: 'pin_set', which: 'delivery', salt: 'c', cred: 'D' }] }, st2).results[0].ok);
  assert.equal(C.eatHandle({ key: 'K', action: 'hello' }, st2).settings.delivery.salt, 'c');
  assert.ok(C.eatHandle({ key: 'K', action: 'login', mode: 'delivery', cred: 'D' }, st2).ok);
  assert.equal(C.eatHandle({ key: 'K', action: 'read', mode: 'delivery', cred: 'D', image: 'QUJD' }, st2).error, 'no_reader');
  assert.equal(C.eatHandle({ key: 'K', action: 'reader_key', mode: 'delivery', cred: 'D', value: 'x' }, st2).error, 'rights');
  assert.equal(C.eatHandle({ key: 'K', action: 'reader_key', mode: 'admin', cred: 'A', value: ' k1 ' }, st2).reader, true); assert.equal(key, 'k1');
  assert.equal(C.eatHandle({ key: 'K', action: 'read', mode: 'delivery', cred: 'D', image: 'QUJD' }, st2).photo, 'p1');
  assert.equal(C.eatHandle({ key: 'K', action: 'read', mode: 'entry', cred: 'E', image: 'QUJD' }, st2).error, 'rights');
  assert.equal(C.eatHandle({ key: 'K', action: 'read', mode: 'delivery', cred: 'D', image: 'not base64!' }, st2).error, 'image');
  assert.equal(C.eatHandle({ key: 'K', action: 'sync', mode: 'delivery', cred: 'D', since: 0, ops: [] }, st2).reader, true);
}
// alpha 0.7: groups that eat at a centre (Holy Family at Luigi)
{
  db = oldDb(); now = '2026-11-20T08:00:00Z'; C.eatUpgrade(db);
  assert.ok(op('centre_groups', { cid: 'LUI', groups: ['Holy Family', 'Holy Family', ' ', 'Luigi'] }, 'admin').ok);
  assert.deepEqual(db.centres.find(c => c.id === 'LUI').groups, ['Holy Family']);
  assert.equal(op('centre_groups', { cid: 'LUI', groups: [] }).error, 'rights');
  assert.ok(ent('people', 'LUI', '2026-11-20', 'Lunch', { n: 80, g: { 'Holy Family': 45 } }).ok);
  const pe = C.eatGet(db, 'people', 'LUI', '2026-11-20', 'Lunch'); assert.equal(C.eatPlates(pe), 125); assert.deepEqual(pe.data.g, { 'Holy Family': 45 });
  assert.ok(ent('dbefore', 'LUI', '2026-11-20', '', { q: { mm: 1 }, u: { mm: 'unit' } }).ok);
  const du = C.eatDayUse(db, 'LUI', '2026-11-20'); assert.equal(du.plates, 125); assert.equal(C.eatPerPlate(du, 'mm'), 25 / 125);
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 7 }).ok); assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-20', 'Lunch').data.g, undefined);
}
// alpha 0.10: a part of a note for another place (2 chickens for Chinika House)
{
  db = oldDb(); now = '2026-11-20T08:00:00Z'; C.eatUpgrade(db);
  assert.ok(op('place_add', { name: 'Chinika House' }, 'admin').ok);
  const ch = db.centres.find(c => c.name === 'Chinika House').id;
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28587', q: { chk: 26, egg: 8 }, parts: [{ to: ch, q: { chk: 2, egg: 20, prk: 5 } }, { to: 'nowhere', name: '', q: { chk: 1 } }] }).ok);
  const n = C.eatNote(db, '28587');
  assert.deepEqual(n.data.parts, [{ to: ch, name: 'Chinika House', q: { chk: 2, egg: 8 } }]);  // not more than the note has, only its items; a part with no place is dropped
  assert.deepEqual(C.eatNoteQ(n, 'MIN'), { chk: 24, egg: 0 }); assert.deepEqual(C.eatNoteQ(n, ch), { chk: 2, egg: 8 });
  assert.ok(C.eatNoteHas(n, ch)); assert.ok(!C.eatNoteHas(n, 'LUI'));
  assert.equal(C.eatStock(db, 'MIN', '2026-11-16').chk.inn, 24); assert.equal(C.eatStock(db, ch, '2026-11-16').chk.inn, 2);
  assert.equal(C.eatNotes(db, '2026-11-16', '2026-11-22', ch).length, 1); assert.equal(C.eatNotes(db, '2026-11-16', '2026-11-22', 'LUI').length, 0);
  assert.ok(ent('note', 'LUI', '2026-11-16', '', { no: '28591', q: { egg: 10 } }).ok); assert.equal(C.eatNote(db, '28591').data.parts, undefined);
  // a place written on the note that is not in the list: kept by name, still taken off the centre
  assert.ok(ent('note', 'MIN', '2026-11-17', '', { no: '28600', q: { chk: 10 }, parts: [{ to: '', name: 'Sister Anna', q: { chk: 3 } }] }).ok);
  assert.equal(C.eatStock(db, 'MIN', '2026-11-17').chk.inn, 31);
}
// alpha 0.11: the place as written by hand on a note
{
  db = oldDb(); now = '2026-11-20T08:00:00Z'; C.eatUpgrade(db);
  assert.ok(op('place_add', { name: 'Chinika House' }, 'admin').ok); assert.ok(op('centre_groups', { cid: 'LUI', groups: ['Holy Family'] }, 'admin').ok);
  const ch = db.centres.find(c => c.name === 'Chinika House').id, m = (t) => C.eatPlaceMatch(db, t);
  assert.equal(m('Misundu Canteen'), 'MIN'); assert.equal(m('MINSUNDU CANTEEN'), 'MIN'); assert.equal(m('Minsundo'), 'MIN');
  assert.equal(m('S.S. LUIGI CANTEEN'), 'LUI'); assert.equal(m('Luigi Canteen'), 'LUI'); assert.equal(m('Holy Family'), 'LUI'); assert.equal(m('Holly Family school'), 'LUI');
  assert.equal(m('MARY CHRISTINE CANTEEN'), 'MCU'); assert.equal(m('Mary Christin'), 'MCU'); assert.equal(m('Ukubalula'), 'UKU');
  assert.equal(m('Nkwazi Canteen'), 'NKW'); assert.equal(m('Nkwasi'), 'NKW');
  assert.equal(m('Chinika House'), ch); assert.equal(m('Chinika Hse'), ch); assert.equal(m('for Chinika'), ch);
  assert.equal(m('Kitwe'), ''); assert.equal(m(''), ''); assert.equal(m('Canteen'), ''); assert.equal(m('Mary'), ''); assert.equal(m('Family'), ''); assert.equal(m('Luanshya'), '');
}
// alpha 0.12: finished counts, names edited, the unit of each food
{
  db = oldDb(); now = '2026-11-20T08:00:00Z'; C.eatUpgrade(db);
  assert.equal(db.items.find(i => i.id === 'bea').unit, 'bags');
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 12, done: true }).ok); assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-20', 'Lunch').data.done, true);
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Dinner', { n: 5 }).ok); assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-20', 'Dinner').data.done, undefined);
  assert.ok(op('name_add', { name: 'Mary', role: 'Canteen', nid: 'n1' }, 'admin').ok); assert.ok(op('name_add', { name: 'Anna', nid: 'n2' }, 'admin').ok);
  assert.ok(op('name_edit', { nid: 'n1', name: 'Mary Banda', role: 'Educator' }, 'admin').ok);
  assert.deepEqual([db.names[0].name, db.names[0].role], ['Mary Banda', 'Educator']);
  assert.equal(op('name_edit', { nid: 'n1', name: 'anna' }, 'admin').error, 'same'); assert.equal(op('name_edit', { nid: 'n1', name: 'X' }).error, 'rights'); assert.equal(op('name_edit', { nid: 'n1', name: ' ' }, 'admin').error, 'fields');
  // pork in bags of 10 kg; back to kg; a unit that does not exist
  assert.ok(op('item_unit', { iid: 'prk', unit: 'bags', per: 10 }, 'admin').ok);
  const prk = db.items.find(i => i.id === 'prk'); assert.deepEqual([prk.unit, prk.use, prk.per], ['bags', 'kg', 10]);
  assert.ok(ent('people', 'LUI', '2026-11-20', 'Lunch', { n: 100 }).ok);
  assert.ok(ent('dbefore', 'LUI', '2026-11-20', '', { q: { prk: 1.5 }, u: { prk: 'unit' } }).ok);
  assert.equal(C.eatDayUse(db, 'LUI', '2026-11-20').used.prk, 15);
  assert.ok(op('item_unit', { iid: 'prk', unit: 'kg' }, 'admin').ok); assert.deepEqual([prk.unit, prk.per], ['kg', 1]);
  assert.equal(op('item_unit', { iid: 'prk', unit: 'buckets', per: 3 }, 'admin').error, 'fields'); assert.equal(op('item_unit', { iid: 'prk', unit: 'bags', per: 5 }).error, 'rights');
  assert.ok(op('item_unit', { iid: 'chk', unit: 'packs' }, 'admin').ok); assert.equal(db.items.find(i => i.id === 'chk').per, 0);
}
// alpha 0.13: the store of a week, expected next to counted
{
  db = oldDb(); now = '2026-11-22T18:00:00Z'; C.eatUpgrade(db);
  // no count before the week: the start is not known, so nothing is expected
  assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28301', q: { mm: 12, chk: 26 }, parts: [{ to: 'NKW', name: 'Nkwazi', q: { chk: 2 } }] }, undefined).ok);
  let w = C.eatWeekCheck(db, 'MIN', '2026-11-16', '2026-11-22');
  assert.equal(w.items.mm.start, null); assert.equal(w.items.mm.expected, null); assert.equal(w.items.mm.inn, 12); assert.equal(w.items.chk.inn, 24); assert.equal(w.items.mm.counted, undefined);
  assert.deepEqual([w.from, w.to, w.days, w.daysFood, w.endDate], ['2026-11-16', '2026-11-22', 7, 0, '']);
  // the count of the week before (Friday): 4 bags, 3 chickens; food is cooked on Saturday before the week starts
  assert.ok(ent('endweek', 'MIN', '2026-11-13', '', { q: { mm: 4, chk: 3, egg: 0 } }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-14', '', { q: { mm: 25 }, u: { mm: 'use' } }).ok); assert.ok(ent('dafter', 'MIN', '2026-11-14', '', { q: { mm: 0 }, u: { mm: 'use' } }).ok);
  // this week: 2 bags and 10 chickens on Tuesday, 1.5 bags and 8 chickens on Wednesday, Thursday not counted
  assert.ok(ent('dbefore', 'MIN', '2026-11-17', '', { q: { mm: 2, chk: 10 }, u: { mm: 'unit' } }).ok); assert.ok(ent('dafter', 'MIN', '2026-11-17', '', { q: { mm: 0, chk: 0 }, u: { mm: 'unit' } }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-18', '', { q: { mm: 50, chk: 8 }, u: { mm: 'use' } }).ok); assert.ok(ent('dafter', 'MIN', '2026-11-18', '', { q: { mm: 12.5, chk: 0 }, u: { mm: 'use' } }).ok);
  assert.ok(ent('dskip', 'MIN', '2026-11-19', '', { on: true }).ok);
  w = C.eatWeekCheck(db, 'MIN', '2026-11-16', '2026-11-22');
  // mealie meal: start 4 − 1 (Saturday) = 3; + 12 − 3.5 = 11.5 expected. Chicken: 3 + 24 − 18 = 9
  assert.deepEqual([w.items.mm.start, w.items.mm.inn, w.items.mm.used, w.items.mm.expected], [3, 12, 3.5, 11.5]);
  assert.deepEqual([w.items.chk.start, w.items.chk.inn, w.items.chk.used, w.items.chk.expected, w.items.chk.diff], [3, 24, 18, 9, null]);
  assert.deepEqual([w.startDate, w.startCounted, w.daysFood, w.daysSkipped, w.days], ['2026-11-13', false, 2, 1, 7]);
  // the count at the end of the week (Saturday): 10 bags (1.5 missing), 9 chickens (as expected), eggs not counted
  assert.ok(ent('endweek', 'MIN', '2026-11-21', '', { q: { mm: 10, chk: 9, egg: null }, nc: { egg: true } }).ok);
  w = C.eatWeekCheck(db, 'MIN', '2026-11-16', '2026-11-22');
  assert.deepEqual([w.to, w.endDate, w.days], ['2026-11-21', '2026-11-21', 6]);
  assert.deepEqual([w.items.mm.counted, w.items.mm.diff, w.items.chk.counted, w.items.chk.diff, w.items.egg.counted, w.items.egg.diff], [10, -1.5, 9, 0, null, null]);
  // the other place got its part of the note: Nkwazi 2 chickens in, no count before, so no expected
  w = C.eatWeekCheck(db, 'NKW', '2026-11-16', '2026-11-22'); assert.equal(w.items.chk.inn, 2); assert.equal(w.items.chk.expected, null);
  // the week after starts from the count of Saturday
  now = '2026-11-25T08:00:00Z'; w = C.eatWeekCheck(db, 'MIN', '2026-11-23', '2026-11-25');
  assert.deepEqual([w.items.mm.start, w.items.mm.expected, w.items.egg.start, w.to, w.days], [10, 10, null, '2026-11-25', 3]);
  // a week that has not started
  w = C.eatWeekCheck(db, 'MIN', '2026-11-30', '2026-11-25'); assert.equal(w.days, 0);
}
// alpha 0.16: no breakfast; dinner only at Minsundu, always 60 plates, not counted
{
  db = C.eatNewDb(); now = '2026-11-20T08:00:00Z'; C.eatUpgrade(db);
  assert.deepEqual(db.centres.map(c => c.meals.join('+')), ['Lunch+Dinner', 'Lunch', 'Lunch', 'Lunch', '']); assert.deepEqual(C.EAT_MEALS_ON, ['Lunch', 'Dinner']);
  assert.equal(C.eatFixed(db, 'MIN', 'Dinner'), 60); assert.equal(C.eatFixed(db, 'MIN', 'Lunch'), null); assert.equal(C.eatFixed(db, 'LUI', 'Dinner'), null);
  assert.deepEqual(Object.keys(C.eatDayMenu(db, 'MIN', '2026-11-20').meals), ['Lunch', 'Dinner']);
  // the day: 60 plates of dinner before any count; with lunch 100, 160; an old dinner count is not used
  let du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.plates, du.peopleMissing], [60, 1]);
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 100 }).ok); assert.ok(ent('people', 'MIN', '2026-11-20', 'Dinner', { n: 6 }).ok);
  du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.plates, du.base, du.peopleMissing, du.onLeft], [160, 160, 0, undefined]); // beta 1.6: the sapa eats the food taken out like lunch
  assert.ok(ent('dbefore', 'MIN', '2026-11-20', '', { q: { mm: 32 }, u: { mm: 'use' } }).ok); assert.ok(ent('dafter', 'MIN', '2026-11-20', '', { q: { mm: 0 }, u: { mm: 'use' } }).ok);
  assert.equal(C.eatPerPlate(C.eatDayUse(db, 'MIN', '2026-11-20'), 'mm'), 0.2); // 32 kg for 160 plates
  // the overview changes the number, or makes the meal counted again
  assert.equal(op('centre_fixed', { cid: 'MIN', meal: 'Dinner', n: 70 }).error, 'rights');
  assert.ok(op('centre_fixed', { cid: 'MIN', meal: 'Dinner', n: 70 }, 'admin').ok); assert.equal(C.eatDayUse(db, 'MIN', '2026-11-20').plates, 170);
  assert.equal(op('centre_fixed', { cid: 'MIN', meal: 'Supper', n: 7 }, 'admin').error, 'meal'); assert.equal(op('centre_fixed', { cid: 'MIN', meal: 'Dinner', n: -3 }, 'admin').error, 'fields');
  assert.ok(op('centre_fixed', { cid: 'MIN', meal: 'Dinner', n: '' }, 'admin').ok); assert.equal(C.eatFixed(db, 'MIN', 'Dinner'), null); assert.equal(C.eatDayUse(db, 'MIN', '2026-11-20').plates, 106);
  // a fixed number for a meal the centre does not have counts for nothing
  assert.ok(op('centre_fixed', { cid: 'LUI', meal: 'Dinner', n: 30 }, 'admin').ok); assert.equal(C.eatFixed(db, 'LUI', 'Dinner'), null); assert.equal(C.eatDayUse(db, 'LUI', '2026-11-20').plates, null);
  assert.ok(op('centre_meals', { cid: 'LUI', meals: ['Lunch', 'Dinner'] }, 'admin').ok); assert.equal(C.eatFixed(db, 'LUI', 'Dinner'), 30);
}
// alpha 0.19: "I didn't count the people" is a count without a number
{
  db = C.eatNewDb(); now = '2026-11-20T10:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('people', 'LUI', '2026-11-20', 'Lunch', { n: 40, g: { 'Holy Family': 5 }, done: true, skip: true }).ok);
  let pe = C.eatGet(db, 'people', 'LUI', '2026-11-20', 'Lunch'); assert.deepEqual(pe.data, { n: 0, g: { 'Holy Family': 0 }, skip: true });
  let du = C.eatDayUse(db, 'LUI', '2026-11-20'); assert.deepEqual([du.plates, du.peopleMissing, du.peopleSkipped], [null, 1, 1]);
  // counting after all takes the mark away
  assert.ok(ent('people', 'LUI', '2026-11-20', 'Lunch', { n: 12, g: { 'Holy Family': 3 } }).ok);
  du = C.eatDayUse(db, 'LUI', '2026-11-20'); assert.deepEqual([du.plates, du.peopleMissing, du.peopleSkipped], [15, 0, undefined]);
  // Minsundu: the fixed dinner still counts when lunch is marked not counted
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 0, skip: true }).ok);
  du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.plates, du.peopleMissing, du.peopleSkipped], [60, 1, 1]);
}
// alpha 0.20: one step of the day marked as not done; the others, and that step later, can still be filled in
{
  db = C.eatNewDb(); now = '2026-11-20T12:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('dskip', 'MIN', '2026-11-20', '', { on: false, menu: true, before: true, other: 1 }).ok);
  assert.deepEqual(C.eatGet(db, 'dskip', 'MIN', '2026-11-20', '').data, { on: false, menu: true, before: true });
  let du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.skipped, du.hasBefore], [true, false]);
  assert.equal(C.eatWeekCheck(db, 'MIN', '2026-11-16', '2026-11-20').daysSkipped, 1);
  // someone adds the quantities later: the day counts, the mark is not used
  assert.ok(ent('dbefore', 'MIN', '2026-11-20', '', { q: { mm: 25 }, u: { mm: 'use' } }).ok);
  du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.skipped, du.hasBefore, du.closed, du.afterSkipped], [false, true, false, undefined]);
  // leftovers marked as not counted: the day stays open (what was used is not known)
  assert.ok(ent('dskip', 'MIN', '2026-11-20', '', { on: false, after: true }).ok);
  du = C.eatDayUse(db, 'MIN', '2026-11-20'); assert.deepEqual([du.skipped, du.closed, du.afterSkipped], [false, false, true]);
  let w = C.eatWeekCheck(db, 'MIN', '2026-11-16', '2026-11-20'); assert.deepEqual([w.daysFood, w.daysSkipped], [1, 0]);
  // the old whole-day mark still works
  assert.ok(ent('dskip', 'MIN', '2026-11-19', '', { on: true }).ok); assert.equal(C.eatDayUse(db, 'MIN', '2026-11-19').skipped, true);
}
// alpha 0.21: start clean before the real use. The tests go, the delivery notes stay
{
  db = C.eatNewDb(); now = '2026-11-20T12:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('people', 'MIN', '2026-11-20', 'Lunch', { n: 17 }).ok); assert.ok(ent('people', 'LUI', '2026-11-19', 'Lunch', { n: 11 }).ok);
  assert.ok(ent('dmenu', 'MIN', '2026-11-20', '', { meals: { Lunch: { mm: true, relish: ['bea'], veg: '' } }, cook: '' }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-20', '', { q: { mm: 3 }, u: { mm: 'use' } }).ok); assert.ok(ent('dskip', 'LUI', '2026-11-04', '', { on: false, before: true }).ok);
  assert.ok(ent('endweek', 'NKW', '2026-11-20', '', { q: { mm: 2 } }).ok);
  assert.ok(ent('note', 'NKW', '2026-11-16', '', { no: '28588', q: { chk: 18 } }, undefined, 'delivery').ok); assert.ok(ent('note', 'MIN', '2026-11-16', '', { no: '28587', q: { chk: 26 }, parts: [{ to: 'NKW', name: 'Nkwazi', q: { chk: 2 } }] }, undefined, 'delivery').ok);
  assert.ok(op('comment', { c: { text: 'kept', screen: 'people', byName: 'Anna' } }).ok);
  const names0 = db.names.length, live = () => db.entries.filter(e => !e.del);
  assert.equal(live().length, 8);
  // only the overview, and only with the word that confirms it
  assert.equal(op('start_clean', { confirm: 'START' }).error, 'rights'); assert.equal(op('start_clean', { confirm: 'START' }, 'delivery').error, 'rights');
  assert.equal(op('start_clean', {}, 'admin').error, 'fields'); assert.equal(live().length, 8);
  // an entry saved after the moment of the reset is not touched (a phone that already started the real work)
  const until = now; now = '2026-11-23T06:00:00Z'; assert.ok(ent('people', 'MIN', '2026-11-23', 'Lunch', { n: 80 }).ok);
  const rev0 = db.rev; let r = op('start_clean', { confirm: 'START', until: until }, 'admin'); assert.deepEqual([r.ok, r.removed, r.kept], [true, 6, 2]);
  assert.deepEqual(live().map(e => e.key).sort(), ['note|28587', 'note|28588', 'people|MIN|2026-11-23|Lunch']);
  // the removed entries are still in the file, marked, with a new revision: the phones get them and drop them
  assert.equal(db.entries.filter(e => e.del && e.rev > rev0).length, 6); assert.equal(db.comments.length, 1); assert.equal(db.names.length, names0);
  assert.equal(C.eatDayUse(db, 'MIN', '2026-11-20').hasBefore, false); assert.equal(C.eatWeekCheck(db, 'NKW', '2026-11-16', '2026-11-22').items.chk.inn, 20);
  // doing it again removes nothing more
  r = op('start_clean', { confirm: 'START', until: until }, 'admin'); assert.deepEqual([r.removed, r.kept], [0, 2]);
}
// beta 1.0: the counts of one day at one centre are taken out by the overview (a day counted to try the app)
{
  db = C.eatNewDb(); now = '2026-11-24T08:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('people', 'MIN', '2026-11-24', 'Lunch', { n: 17, done: true }).ok); assert.ok(ent('people', 'MIN', '2026-11-23', 'Lunch', { n: 90 }).ok); assert.ok(ent('people', 'LUI', '2026-11-24', 'Lunch', { n: 11 }).ok);
  assert.ok(ent('dmenu', 'MIN', '2026-11-24', '', { meals: { Lunch: { mm: true, relish: ['bea'], veg: '' } }, cook: '' }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-24', '', { q: { mm: 3 }, u: { mm: 'use' } }).ok); assert.ok(ent('dskip', 'MIN', '2026-11-24', '', { on: false, after: true }).ok);
  assert.ok(ent('endweek', 'MIN', '2026-11-24', '', { q: { mm: 2 } }).ok);
  assert.ok(op('entry', { e: { type: 'note', centre: 'MIN', date: '2026-11-24', meal: '', data: { no: '28601', q: { chk: 26 } }, by: '', byName: 'Deliveries', at: now } }, 'delivery').ok);
  const live = () => db.entries.filter(e => !e.del).map(e => e.key).sort(), all0 = live();
  assert.equal(all0.length, 8);
  // only the overview; a centre, a day and at least one kind of count; never the delivery notes, never a place
  assert.equal(op('day_clean', { centre: 'MIN', date: '2026-11-24', types: ['people'] }).error, 'rights'); assert.equal(op('day_clean', { centre: 'MIN', date: '2026-11-24', types: ['people'] }, 'delivery').error, 'rights');
  assert.equal(op('day_clean', { centre: 'MIN', date: '2026-11-24', types: [] }, 'admin').error, 'fields'); assert.equal(op('day_clean', { centre: 'XXX', date: '2026-11-24', types: ['people'] }, 'admin').error, 'fields');
  assert.equal(op('day_clean', { centre: 'MIN', date: '24/11/2026', types: ['people'] }, 'admin').error, 'fields'); assert.equal(op('day_clean', { centre: 'MIN', date: '2026-11-24', types: ['people', 'note'] }, 'admin').error, 'fields');
  assert.deepEqual(live(), all0);
  // only the plates of that day at that centre
  const info = { entries: [], audit: [], comments: [] };
  let r = C.eatApply(db, 'admin', { id: 'dc1', kind: 'day_clean', centre: 'MIN', date: '2026-11-24', types: ['people'] }, now, info);
  assert.deepEqual([r.ok, r.removed], [true, 1]); assert.deepEqual(info.gone.map(e => e.key), ['people|MIN|2026-11-24|Lunch']); assert.equal(info.audit[0].action, 'Day removed'); assert.equal(info.audit[0].detail, 'Minsundu 2026-11-24: people 1');
  assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-24', 'Lunch'), null); assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-23', 'Lunch').data.n, 90); assert.equal(C.eatGet(db, 'people', 'LUI', '2026-11-24', 'Lunch').data.n, 11);
  assert.equal(live().length, 7);
  // the removed entry travels to the phones with a new rev, marked as removed
  const gone = db.entries.filter(e => e.key === 'people|MIN|2026-11-24|Lunch')[0]; assert.ok(gone.del && gone.rev === db.rev);
  // the rest of the day: menu, quantities, marks and the stock count; the note of that day stays
  r = op('day_clean', { centre: 'MIN', date: '2026-11-24', types: ['dmenu', 'menu', 'dbefore', 'before', 'dafter', 'after', 'dskip', 'skip', 'endweek', 'startweek'] }, 'admin'); assert.deepEqual([r.ok, r.removed], [true, 4]);
  assert.deepEqual(live(), ['note|28601', 'people|LUI|2026-11-24|Lunch', 'people|MIN|2026-11-23|Lunch']);
  assert.equal(C.eatDayUse(db, 'MIN', '2026-11-24').hasBefore, false);
  // again: nothing more to remove, no line in the log; the day can be counted again
  const info2 = { entries: [], audit: [], comments: [] };
  r = C.eatApply(db, 'admin', { id: 'dc2', kind: 'day_clean', centre: 'MIN', date: '2026-11-24', types: ['people'] }, now, info2); assert.deepEqual([r.ok, r.removed, info2.audit.length], [true, 0, 0]);
  assert.ok(ent('people', 'MIN', '2026-11-24', 'Lunch', { n: 120 }).ok); assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-24', 'Lunch').data.n, 120);
}
// beta 1.3: the plan of the week. Everything changes every week: the people of each meal, the other places, the food
{
  db = C.eatNewDb(); now = '2026-11-24T08:00:00Z'; n = 0;
  const plan = { days: { '0': { p: { Lunch: 120, Dinner: 40 }, o: {}, q: { egg: 7 }, food: 'Eggs' }, '1': { p: { Lunch: 120, Dinner: 40 }, o: { Ukubalula: 1 }, q: { chk: 23 }, food: 'Chicken' },
    '3': { p: { Lunch: 100, Dinner: 60 }, o: { Ukubalula: 10, '  ': 4 }, q: {}, food: 'Fish' }, '6': { p: { Lunch: '', Dinner: 'x' }, o: {}, q: {} } }, photo: 'bad photo id', remark: 'week of the trip' };
  assert.equal(ent('plan', 'MIN', '2026-11-24', '', plan).error, 'fields'); // not a Monday
  assert.equal(ent('plan', 'MIN', '2026-12-07', '', plan).error, 'future'); // more than a week ahead
  assert.ok(ent('plan', 'MIN', '2026-11-30', '', plan).ok); // next week: allowed
  assert.ok(ent('plan', 'MIN', '2026-11-23', '', plan).ok);
  const pd = C.eatGet(db, 'plan', 'MIN', '2026-11-23', '').data;
  assert.deepEqual(Object.keys(pd.days), ['0', '1', '3']); assert.deepEqual(pd.days['3'].o, { Ukubalula: 10 }); assert.equal(pd.photo, ''); assert.equal(pd.remark, 'week of the trip');
  assert.deepEqual(C.eatPlanDay(db, 'MIN', '2026-11-26'), pd.days['3']); assert.equal(C.eatPlanDay(db, 'MIN', '2026-11-25'), null); assert.equal(C.eatPlanDay(db, 'LUI', '2026-11-23'), null);
  // the plan is written by the kitchen (Enter data, Mauro 24/11); the deliveries person saves only notes
  const dv = (e) => C.eatApply(db, 'delivery', { id: 'd' + (++n), kind: 'entry', e: Object.assign({ by: '', byName: 'Deliveries', at: now }, e) }, now, null);
  assert.equal(dv({ type: 'plan', centre: 'LUI', date: '2026-11-23', meal: '', data: { days: { '0': { p: { Lunch: 80 } } } } }).error, 'rights');
  assert.equal(dv({ type: 'people', centre: 'LUI', date: '2026-11-23', meal: 'Lunch', data: { n: 3 } }).error, 'rights');
  // the dinner nobody counts takes the number of the plan (40, not the fixed 60); Ukubalula goes into the base of the food a plate, not into the plates
  assert.ok(ent('people', 'MIN', '2026-11-24', 'Lunch', { n: 95 }).ok);
  let du = C.eatDayUse(db, 'MIN', '2026-11-24'); assert.deepEqual([du.plates, du.cooked, du.base, du.planned, du.staff], [135, 1, 136, 161, null]); // 95 + 40 sapa served; base + 1 Ukubalula; plan 120 + 40 + 1
  // beta 1.6: the sapa eats the food taken out (Mauro 24/11 17:14); the overview can still say a dinner eats the leftovers of lunch
  assert.equal(C.eatDinLeft(db, 'MIN'), false); assert.equal(C.eatDinLeft(db, 'LUI'), false);
  assert.equal(op('centre_dinleft', { cid: 'MIN', on: true }).error, 'rights'); assert.ok(op('centre_dinleft', { cid: 'MIN', on: true }, 'admin').ok);
  assert.deepEqual([C.eatDayUse(db, 'MIN', '2026-11-24').base, C.eatDinLeft(db, 'MIN')], [96, true]); assert.ok(op('centre_dinleft', { cid: 'MIN', on: false }, 'admin').ok);
  // beta 1.6: the kitchen staff who ate go into the base; one number a day, written by who counts
  assert.ok(ent('staff', 'MIN', '2026-11-24', 'Lunch', { n: 7.4 }).ok); assert.deepEqual(C.eatGet(db, 'staff', 'MIN', '2026-11-24', '').data, { n: 7 });
  du = C.eatDayUse(db, 'MIN', '2026-11-24'); assert.deepEqual([du.plates, du.staff, du.base], [135, 7, 143]);
  assert.equal(ent('staff', 'UKU', '2026-11-24', '', { n: 3 }).error, 'place');
  assert.ok(ent('staff', 'MIN', '2026-11-24', '', { n: 0 }).ok);
  du = C.eatDayUse(db, 'MIN', '2026-11-25'); assert.deepEqual([du.plates, du.cooked], [60, 0]); // no plan that day: the fixed number
  // the plan against what happened: lunch 120 planned, 95 counted; chicken 23 planned, 25 taken out
  assert.ok(ent('dbefore', 'MIN', '2026-11-24', '', { q: { chk: 25, mm: 37.5 }, u: { mm: 'use' } }).ok);
  const pc = C.eatPlanCheck(db, 'MIN', '2026-11-24');
  assert.deepEqual(pc.people, [{ meal: 'Lunch', plan: 120, counted: 95, fixed: false }, { meal: 'Dinner', plan: 40, counted: null, fixed: true }]);
  assert.deepEqual(pc.food, [{ id: 'chk', plan: 23, out: 25, before: true, diff: 2 }, { id: 'mm', plan: null, out: 1.5, before: true, diff: null }]);
  assert.deepEqual(C.eatPlanCheck(db, 'MIN', '2026-11-25'), { day: null, people: [], food: [] });
  // beta 1.4: leftovers in portions. A chicken is 10 portions; mealie meal from the plan of the day, or from the settings
  assert.equal(C.eatPortionSize(db, 'MIN', '2026-11-24', 'chk'), 0.1);
  assert.equal(C.eatPortionSize(db, 'MIN', '2026-11-25', 'mm'), null);
  assert.ok(ent('plan', 'MIN', '2026-11-23', '', { days: { '1': { p: { Lunch: 120, Dinner: 40 }, o: { Ukubalula: 10 }, q: { mm: 1.5, chk: 23 } } } }).ok);
  assert.equal(C.eatPortionSize(db, 'MIN', '2026-11-24', 'mm'), 0.221);   // 37.5 kg for 170 people
  assert.equal(op('item_portion', { iid: 'mm', v: 0.25 }).error, 'rights'); assert.ok(op('item_portion', { iid: 'mm', v: 0.25 }, 'admin').ok);
  assert.equal(C.eatPortionSize(db, 'MIN', '2026-11-24', 'mm'), 0.25); assert.ok(op('item_portion', { iid: 'mm', v: '' }, 'admin').ok); assert.equal(C.eatPortionSize(db, 'MIN', '2026-11-24', 'mm'), 0.221);
  assert.ok(ent('dafter', 'MIN', '2026-11-24', '', { q: { mm: 4.42, chk: 0.5 }, u: { mm: 'use' }, pz: { mm: 20, chk: 5 }, ps: { mm: 0.221, chk: 0.1 } }).ok);
  assert.deepEqual(C.eatGet(db, 'dafter', 'MIN', '2026-11-24', '').data.pz, { mm: 20, chk: 5 });
  // what the photo reader returns for the paper of 23-29 November becomes the data of a plan
  const rd = C.eatPlanRead(db, { readable: true, kitchen: 'MINSUNDU', week_start: '2026-11-23', days: [
    { day: 'Monday', food: 'Eggs', lunch: 120, dinner: 40, other_places: [], items: [{ item: 'egg', quantity: 7 }] },
    { day: 'Tue', food: 'Chicken', lunch: 120, dinner: 40, other_places: [{ place: 'Ukubalula', people: 1 }], items: [{ item: 'chk', quantity: 23 }, { item: 'zzz', quantity: 3 }] },
    { day: 'Funday', lunch: 3 }, { day: 'Thursday', food: 'Fish', lunch: 100, dinner: 60, other_places: [{ place: 'Ukubalula', people: 10 }], items: [] }] });
  assert.deepEqual([rd.clear, rd.centre, rd.week, Object.keys(rd.days)], [true, 'MIN', '2026-11-23', ['0', '1', '3']]);
  assert.deepEqual(rd.days['1'], { p: { Lunch: 120, Dinner: 40 }, o: { Ukubalula: 1 }, q: { chk: 23 }, food: 'Chicken' });
  // beta 1.4: a place of the app keeps its name; something different for some people is kept, at most 4
  assert.deepEqual(C.eatPlanRead(db, { days: [{ day: 'Monday', lunch: 5, other_places: [{ place: 'UKUBALULA', people: 3 }, { place: 'Chinika', people: 2 }] }] }).days['0'].o, { Ukubalula: 3, Chinika: 2 });
  assert.ok(ent('plan', 'NKW', '2026-11-23', '', { days: { '0': { p: { Lunch: 50 }, x: [{ who: 'Children', food: 'Fish' }, { who: '', food: '' }, 1, 2, 3, { who: 'a' }, { who: 'b' }, { who: 'c' }] } } }).ok);
  assert.deepEqual(C.eatGet(db, 'plan', 'NKW', '2026-11-23', '').data.days['0'].x, [{ who: 'Children', food: 'Fish' }, { who: 'a', food: '' }, { who: 'b', food: '' }, { who: 'c', food: '' }]);
  assert.equal(C.eatPlanRead(db, { readable: false, days: [] }).clear, false);
}
// beta 1.3: Mary Christine and Ukubalula become two places, on an old database too; counts and notes stay with the canteen
{
  const old = C.eatNewDb(); old.centres = old.centres.filter(c => c.id !== 'UKU'); old.centres.find(c => c.id === 'MCU').name = 'Mary Christine / Ukubalula';
  old.entries.push({ id: 'x', key: 'note|1', type: 'note', centre: 'MCU', date: '2026-11-10', meal: '', data: { no: '1', q: { mm: 20 } } });
  const st = { key: () => 'k', load: () => old, save: (d) => { saved = d; }, now: () => '2026-11-24T08:00:00Z' }; let saved = null;
  const h = C.eatHandle({ key: 'k', action: 'hello' }, st);
  const mc = h.centres.find(c => c.id === 'MCU'), uk = h.centres.find(c => c.id === 'UKU');
  assert.deepEqual([mc.name, mc.place || false, uk.name, uk.place, uk.meals], ['Mary Christine', false, 'Ukubalula', true, []]);
  assert.equal(old.entries[0].centre, 'MCU'); assert.equal(C.eatPlaceMatch(old, 'Mary Christine Canteen'), 'MCU'); assert.equal(C.eatPlaceMatch(old, 'ukubalula'), 'UKU');
  // run again: nothing changes
  const n0 = old.centres.length; C.eatHandle({ key: 'k', action: 'hello' }, st); assert.equal(old.centres.length, n0);
}
// beta 1.6 (Mauro 24/11 17:14): Minsundu, Tuesday 24/11. 73 at lunch, 40 sapa and 10 Ukubalula from the plan, 7 of the kitchen = 130 ate.
// The amount a plate is the food used for the 130; the leftovers are what is left after the last meal, not served
{
  db = C.eatNewDb(); now = '2026-11-24T16:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('plan', 'MIN', '2026-11-23', '', { days: { '1': { p: { Lunch: 120, Dinner: 40 }, o: { Ukubalula: 10 }, q: { chk: 17, mm: 1.5 }, food: 'Chicken' } } }).ok);
  assert.ok(ent('people', 'MIN', '2026-11-24', 'Lunch', { n: 73, done: true }).ok); assert.ok(ent('staff', 'MIN', '2026-11-24', '', { n: 7 }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-24', '', { q: { mm: 1.5, chk: 17, pcs: 170 }, u: { mm: 'unit' } }).ok);
  assert.ok(ent('dafter', 'MIN', '2026-11-24', '', { q: { mm: 0.25, chk: 3, pcs: 29 }, u: { mm: 'unit' } }).ok);
  const du = C.eatDayUse(db, 'MIN', '2026-11-24');
  assert.deepEqual([du.plates, du.cooked, du.staff, du.base, du.planned], [113, 10, 7, 130, 170]);
  assert.deepEqual([du.used.mm, du.left.mm, du.leftU.mm, du.pieces, du.leftPieces], [31.25, 6.25, 0.25, 141, 29]);
  assert.equal(Math.round(C.eatPerPlate(du, 'mm') * 1000), 240);
  // the leftovers in portions of the plan: 1.5 bags for 170 people = 0.221 kg a portion; 6.25 kg = 28 portions; 29 pieces = 29 portions
  assert.equal(Math.round(du.left.mm / C.eatPortionSize(db, 'MIN', '2026-11-24', 'mm')), 28);
}
// beta 1.7 (Daniela 26/11): the leftovers are the portions remained; at Minsundu they feed the dinner of the plan first
{
  db = C.eatNewDb(); now = '2026-11-24T16:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('plan', 'MIN', '2026-11-23', '', { days: { '1': { p: { Lunch: 120, Dinner: 40 }, o: { Ukubalula: 10 }, q: { chk: 17, mm: 1.5 }, food: 'Chicken' } } }).ok);
  assert.ok(ent('people', 'MIN', '2026-11-24', 'Lunch', { n: 73, done: true }).ok); assert.ok(ent('staff', 'MIN', '2026-11-24', '', { n: 7 }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-24', '', { q: { mm: 1.5, chk: 17, pcs: 170 }, u: { mm: 'unit' } }).ok);
  assert.ok(ent('dafter', 'MIN', '2026-11-24', '', { pr: 70.4, q: { mm: 3 } }).ok);
  assert.deepEqual(C.eatGet(db, 'dafter', 'MIN', '2026-11-24', '').data, { pr: 70, q: {}, nc: {}, u: {} });
  let du = C.eatDayUse(db, 'MIN', '2026-11-24');
  assert.deepEqual([du.remained, du.dinner, du.dinnerShort, du.leftPortions, du.base, du.portions], [70, 40, 0, 30, 130, 160]);
  assert.deepEqual([du.left.mm, du.used.mm, du.leftU.mm, du.leftPieces, du.pieces], [7.031, 30.469, 0.281, 31.9, 138.1]);
  assert.equal(Math.round(C.eatPerPlate(du, 'mm') * 1000), 234); // 37.5 kg for 160 portions
  // fewer portions remained than the dinner of the plan: the dinner eats them all, nothing is left
  assert.ok(ent('dafter', 'MIN', '2026-11-24', '', { pr: 28 }).ok); du = C.eatDayUse(db, 'MIN', '2026-11-24');
  assert.deepEqual([du.dinnerShort, du.leftPortions, du.base, du.plates, du.left.mm, du.used.mm], [12, 0, 118, 101, 0, 37.5]);
  // Nkwazi has no dinner: the portions remained are all left
  db.centres.find(c => c.id === 'NKW').left = true; assert.ok(ent('people', 'NKW', '2026-11-24', 'Lunch', { n: 14, done: true }).ok);
  assert.ok(ent('dbefore', 'NKW', '2026-11-24', '', { q: { mm: 0.25, fsh: 0.75 }, u: { mm: 'unit' } }).ok);
  assert.ok(ent('dafter', 'NKW', '2026-11-24', '', { pr: 6 }).ok); du = C.eatDayUse(db, 'NKW', '2026-11-24');
  assert.deepEqual([du.leftPortions, du.base, du.portions], [6, 14, 20]);
  // undo of the day by who counts: only today, only that centre, not the plan
  assert.equal(op('day_undo', { centre: 'MIN', date: '2026-11-23' }).error, 'fields');
  const r = op('day_undo', { centre: 'MIN', date: '2026-11-24', byName: 'Daniela' }); assert.ok(r.ok && r.removed === 4, JSON.stringify(r));
  assert.equal(C.eatGet(db, 'people', 'MIN', '2026-11-24', 'Lunch'), null); assert.ok(C.eatGet(db, 'people', 'NKW', '2026-11-24', 'Lunch'));
  assert.ok(C.eatGet(db, 'plan', 'MIN', '2026-11-23', ''));
  assert.equal(op('day_undo', { centre: 'NKW', date: '2026-11-24' }, 'delivery').error, 'rights');
}
// beta 1.8 (Mauro 26/11): the count of the fridge without a scale: about, chicken in pieces, kg foods in bags of about so many kg
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('endweek', 'NKW', '2026-11-26', '', { q: { chk: 2.4, prk: 12, egg: 3, mm: 1 }, nc: { fsh: true }, ab: { prk: true, chk: true, fsh: true, zzz: true }, alt: { chk: { n: 24, u: 'pieces' }, prk: { n: 3, u: 'bags', k: 4 }, egg: { n: 2, u: 'boxes' }, fsh: { n: 1, u: 'bags', k: 5 }, mm: { n: 1, u: 'bags' } } }).ok);
  const d = C.eatWeekCount(db, 'NKW', '2026-11-23', 'endweek').data;
  assert.deepEqual(d.ab, { prk: true, chk: true }); assert.deepEqual(d.alt, { chk: { n: 24, u: 'pieces' }, prk: { n: 3, u: 'bags', k: 4 } });
  assert.deepEqual([d.q.chk, d.q.prk, d.q.egg], [2.4, 12, 3]);
  const w = C.eatWeekCheck(db, 'NKW', '2026-11-23'); assert.deepEqual([w.items.prk.counted, w.items.prk.about, w.items.egg.about, w.items.fsh.counted], [12, true, false, null]);
  // a count without these stays as it was
  assert.ok(ent('endweek', 'LUI', '2026-11-26', '', { q: { chk: 2 }, nc: {} }).ok); assert.deepEqual(C.eatWeekCount(db, 'LUI', '2026-11-23', 'endweek').data, { q: { chk: 2 }, nc: {} });
}
// beta 1.9 (Mauro 26/11): the portions cooked, against the menu of the week, with the reason when they are different
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('plan', 'MIN', '2026-11-23', '', { days: { '3': { p: { Lunch: 100, Dinner: 60 }, o: { Ukubalula: 10 }, q: { fsh: 30 }, food: 'Fish' } } }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-26', '', { q: { mm: 1.5, fsh: null }, nc: { fsh: true }, u: { mm: 'unit' }, pc: 182.4, pcw: '  12 more: the skills came back  ' }).ok);
  const b = C.eatGet(db, 'dbefore', 'MIN', '2026-11-26', '').data; assert.deepEqual([b.pc, b.pcw, b.nc], [182, '12 more: the skills came back', { fsh: true }]);
  const k = C.eatPlanCheck(db, 'MIN', '2026-11-26'); assert.deepEqual(k.portions, { plan: 170, cooked: 182, why: '12 more: the skills came back' });
  const du = C.eatDayUse(db, 'MIN', '2026-11-26'); assert.deepEqual([du.cookedP, du.cookedWhy], [182, '12 more: the skills came back']);
  assert.ok(ent('dbefore', 'MIN', '2026-11-26', '', { q: { mm: 1.5 }, nc: {}, u: { mm: 'unit' } }).ok); assert.equal(C.eatGet(db, 'dbefore', 'MIN', '2026-11-26', '').data.pc, undefined);
}
// beta 1.10 (Daniela 26/11): pork for most, chicken for who does not eat pork: each food shared by its own portions
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db); db.centres.find(c => c.id === 'NKW').left = true;
  assert.ok(ent('people', 'NKW', '2026-11-26', 'Lunch', { n: 90, done: true }).ok);
  assert.ok(ent('dbefore', 'NKW', '2026-11-26', '', { q: { prk: 9, chk: 1, pcs: 10 }, nc: {}, u: {}, pp: { chk: 10.2, prk: 0, zzz: 4, mm: 'x' } }).ok);
  assert.deepEqual(C.eatGet(db, 'dbefore', 'NKW', '2026-11-26', '').data.pp, { chk: 10 });
  assert.ok(ent('dafter', 'NKW', '2026-11-26', '', { pr: 0 }).ok);
  let du = C.eatDayUse(db, 'NKW', '2026-11-26');
  assert.deepEqual([du.base, du.used.prk, du.used.chk], [90, 9, 1]);
  assert.equal(Math.round(C.eatPerPlate(du, 'prk') * 1000), 100); // 9 kg for 90 portions
  assert.equal(C.eatPerPlate(du, 'chk'), 0.1); // 1 chicken for its 10 portions, not for 90
  assert.equal(C.eatBaseOf(du, 'pcs'), 10);
  // without the portions of each food everything is shared by all the portions, as before
  assert.ok(ent('dbefore', 'NKW', '2026-11-26', '', { q: { prk: 9, chk: 1 }, nc: {}, u: {} }).ok); du = C.eatDayUse(db, 'NKW', '2026-11-26');
  assert.equal(du.pp, null); assert.equal(Math.round(C.eatPerPlate(du, 'chk') * 10000), 111);
}
// beta 1.10 (Mauro 26/11): whole chickens and pieces together, pieces in a chicken; loose eggs
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db);
  assert.ok(ent('endweek', 'NKW', '2026-11-26', '', { q: { chk: 24, egg: 2.5 }, nc: {}, alt: { chk: { n: 32, u: 'pieces', w: 20, k: 8 }, egg: { n: 15, u: 'loose', w: 2, k: 99 }, prk: { n: 2, u: 'pieces', w: -3 } } }).ok);
  assert.deepEqual(C.eatWeekCount(db, 'NKW', '2026-11-23', 'endweek').data.alt, { chk: { n: 32, u: 'pieces', w: 20, k: 8 }, egg: { n: 15, u: 'loose', w: 2 }, prk: { n: 2, u: 'pieces' } });
}
// beta 1.11 (Letizia 26/11): the protein chosen while counting; the account of a week for the overview
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db); db.centres.find(c => c.id === 'NKW').left = true;
  assert.ok(ent('people', 'NKW', '2026-11-26', 'Lunch', { n: 60, done: true, pf: { fsh: 40, egg: 20, mm: 5, zzz: 1 } }).ok);
  assert.deepEqual(C.eatGet(db, 'people', 'NKW', '2026-11-26', 'Lunch').data.pf, { fsh: 40, egg: 20 });
  assert.ok(ent('dbefore', 'NKW', '2026-11-26', '', { q: { fsh: 4, egg: 1 }, nc: {}, u: {} }).ok);
  assert.ok(ent('dafter', 'NKW', '2026-11-26', '', { pr: 0 }).ok);
  const du = C.eatDayUse(db, 'NKW', '2026-11-26');
  assert.equal(C.eatBaseOf(du, 'fsh'), 40); assert.equal(C.eatBaseOf(du, 'egg'), 20); assert.equal(C.eatPerPlate(du, 'fsh'), 0.1);
  assert.ok(ent('dmenu', 'NKW', '2026-11-26', '', { meals: { Lunch: { mm: true, relish: ['fsh', 'egg'] } } }).ok);
  const a = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-26');
  assert.deepEqual(a.days.map(x => x.st), ['none', 'none', 'none', 'done', 'future', 'future', 'future']);
  assert.deepEqual([a.past, a.done, a.none, a.eaten, a.verdict], [4, 1, 3, 60, 'part']);   // beta 1.12: days not written are a gap, in grey, not a warning
  assert.equal(Math.round(a.food.fsh.per * 1000), 100);
  // a fridge count short of the expected: food missing, in portions too
  assert.ok(ent('endweek', 'NKW', '2026-11-22', '', { q: { fsh: 10, egg: 2 }, nc: {} }).ok);
  assert.ok(ent('endweek', 'NKW', '2026-11-26', '', { q: { fsh: 4 }, nc: { egg: true } }).ok);
  const b = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-26');
  assert.deepEqual(b.missing, [{ id: 'fsh', n: 2, unit: 'kg', about: false, portions: 20 }]); assert.equal(b.fridge, '2026-11-26');
  // beta 1.12 (Mauro, 26/11: "there is always the warning"): food short with days without a daily count is to check, not missing
  assert.equal(b.sure, false); assert.equal(b.verdict, 'warn'); assert.equal(b.food.fsh.big, true);
}
// beta 1.12: the verdict of the overview. Nothing written: none. Every day counted and the fridge short above the margin: food missing.
// A small difference (no scale) is not a finding. Portions not accounted count above 5% of the portions cooked.
{
  db = C.eatNewDb(); now = '2026-11-25T10:00:00Z'; C.eatUpgrade(db); db.centres.find(c => c.id === 'NKW').left = true;
  assert.equal(C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-25').verdict, 'none');
  assert.ok(ent('endweek', 'NKW', '2026-11-22', '', { q: { fsh: 20 }, nc: {} }).ok);
  ['2026-11-23', '2026-11-24', '2026-11-25'].forEach(d => {
    now = d + 'T10:00:00Z';
    assert.ok(ent('dmenu', 'NKW', d, '', { meals: { Lunch: { mm: true, relish: ['fsh'] } } }).ok);
    assert.ok(ent('people', 'NKW', d, 'Lunch', { n: 50, done: true }).ok);
    assert.ok(ent('staff', 'NKW', d, '', { n: 0 }).ok);
    assert.ok(ent('dbefore', 'NKW', d, '', { q: { fsh: 5 }, nc: {}, u: {}, pc: 51 }).ok);
    assert.ok(ent('dafter', 'NKW', d, '', { pr: 0 }).ok);
  });
  // 20 kg at the start, 15 cooked: 5 expected. 4.5 counted: 0.5 short of 20 is inside the margin; 1 portion a day not accounted of 51 too
  assert.ok(ent('endweek', 'NKW', '2026-11-25', '', { q: { fsh: 4.5 }, nc: {} }).ok);
  let v = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-25');
  assert.deepEqual([v.done, v.past, v.sure, v.missing.length, v.small, v.unacc, v.unaccBig, v.verdict], [3, 3, true, 0, 1, 3, false, 'ok']);
  // 2 counted: 3 kg short of 20, every day counted: food missing
  assert.ok(ent('endweek', 'NKW', '2026-11-25', '', { q: { fsh: 2 }, nc: {} }).ok);
  v = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-25');
  assert.deepEqual([v.missing.length, v.missing[0].n, v.small, v.verdict], [1, 3, 0, 'danger']);
  // counted "about": the margin is 20%, 3 of 20 is inside
  assert.ok(ent('endweek', 'NKW', '2026-11-25', '', { q: { fsh: 2 }, nc: {}, ab: { fsh: true } }).ok);
  v = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-25'); assert.deepEqual([v.missing.length, v.small, v.verdict], [0, 1, 'ok']);
  // 10 portions of 51 cooked and not accounted on one day: to check
  now = '2026-11-25T11:00:00Z'; assert.ok(ent('dbefore', 'NKW', '2026-11-25', '', { q: { fsh: 5 }, nc: {}, u: {}, pc: 60 }).ok);
  v = C.eatAccount(db, 'NKW', '2026-11-23', '2026-11-25'); assert.deepEqual([v.unacc, v.unaccBig, v.days[2].unaccBig, v.days[0].unaccBig, v.verdict], [12, true, true, false, 'warn']);
}
// beta 1.12 (Letizia, 26/11: "the option to encode each meal quantity in portions: ex: 10 nshima, 6 fish, 30 pork"): the portions remained of each food
{
  db = C.eatNewDb(); now = '2026-11-26T10:00:00Z'; C.eatUpgrade(db); db.centres.find(c => c.id === 'NKW').left = true;
  assert.ok(ent('people', 'NKW', '2026-11-26', 'Lunch', { n: 90, done: true }).ok);
  assert.ok(ent('dbefore', 'NKW', '2026-11-26', '', { q: { mm: 20, fsh: 12 }, nc: {}, u: { mm: 'use' } }).ok);
  assert.ok(ent('dafter', 'NKW', '2026-11-26', '', { pr: 10, prf: { mm: 10, fsh: 30, zzz: 4, egg: -1 } }).ok);
  assert.deepEqual(C.eatGet(db, 'dafter', 'NKW', '2026-11-26', '').data.prf, { mm: 10, fsh: 30 });
  let u = C.eatDayUse(db, 'NKW', '2026-11-26');
  // nshima: 10 of 100 portions left, 2 of 20 kg; fish: 30 of 120 portions left, 3 of 12 kg; a portion of fish = 9 kg / 90
  assert.deepEqual([u.remained, u.leftPortions, u.base, u.left.mm, u.used.mm, u.left.fsh, u.used.fsh], [10, 10, 90, 2, 18, 3, 9]);
  assert.deepEqual(u.remF, { mm: 10, fsh: 30 }); assert.equal(C.eatPerPlate(u, 'fsh'), 0.1); assert.equal(C.eatPerPlate(u, 'mm'), 0.2);
  // without the detail: every food left in the same share
  assert.ok(ent('dafter', 'NKW', '2026-11-26', '', { pr: 10 }).ok);
  u = C.eatDayUse(db, 'NKW', '2026-11-26'); assert.deepEqual([u.left.mm, u.left.fsh, u.remF], [2, 1.2, undefined]);
  // Minsundu: the dinner of the menu eats the portions remained of each food first
  db.centres.find(c => c.id === 'MIN').left = true;
  assert.ok(ent('people', 'MIN', '2026-11-26', 'Lunch', { n: 100, done: true }).ok);
  assert.ok(ent('dbefore', 'MIN', '2026-11-26', '', { q: { mm: 34, prk: 17 }, nc: {}, u: { mm: 'use' } }).ok);
  const dinner = C.eatFixed(db, 'MIN', 'Dinner');
  assert.ok(ent('dafter', 'MIN', '2026-11-26', '', { pr: dinner + 10, prf: { mm: dinner + 10, prk: dinner - 20 } }).ok);
  u = C.eatDayUse(db, 'MIN', '2026-11-26');
  assert.deepEqual([u.leftPortions, u.leftF.mm, u.leftF.prk, u.left.prk, C.eatBaseOf(u, 'prk'), C.eatBaseOf(u, 'mm')], [10, 10, 0, 0, 100 + dinner - 20, 100 + dinner]);
}
console.log('core tests: all passed');
// beta 1.13 (Mauro, 27/11): "Other" next to the proteins of the menu of the day; beans also in buckets
{
  db = C.eatNewDb(); now = '2026-11-27T08:00:00Z'; C.eatUpgrade(db); db.centres.find(c => c.id === 'NKW').left = true;
  assert.ok(ent('dmenu', 'NKW', '2026-11-27', '', { meals: { Lunch: { mm: true, relish: ['bea'], other: '  Vegetables ' } } }).ok);
  assert.deepEqual(C.eatGet(db, 'dmenu', 'NKW', '2026-11-27', '').data.meals.Lunch, { mm: true, relish: ['bea'], veg: '', other: 'Vegetables' });
  assert.equal(C.eatDayMenu(db, 'NKW', '2026-11-27').meals.Lunch.other, 'Vegetables');
  assert.deepEqual(C.eatDayRows(db, 'NKW', '2026-11-27'), ['mm', 'bea']);   // Other has no quantity row
  // 80 portions with beans, 20 with vegetables: the beans are shared on 80 portions
  assert.ok(ent('people', 'NKW', '2026-11-27', 'Lunch', { n: 100, done: true, pf: { bea: 80, oth: 20, zzz: 5 } }).ok);
  assert.deepEqual(C.eatGet(db, 'people', 'NKW', '2026-11-27', 'Lunch').data.pf, { bea: 80, oth: 20 });
  // beans in buckets: 2 buckets of 7.5 kg = 15 kg; the bags of beans have no weight yet, so no bags
  assert.deepEqual(C.eatConv(db.items.find(i => i.id === 'bea'), 2, 'alt', 7.5), { use: 15, unit: null });
  assert.deepEqual(C.eatConv(db.items.find(i => i.id === 'bea'), 2, 'alt', 0), { use: null, unit: null });
  assert.ok(ent('dbefore', 'NKW', '2026-11-27', '', { q: { mm: 10, bea: 2 }, nc: {}, u: { mm: 'use', bea: 'alt' }, ak: { bea: 7.5, mm: 3 } }).ok);
  const bd = C.eatGet(db, 'dbefore', 'NKW', '2026-11-27', '').data; assert.deepEqual([bd.u, bd.ak], [{ mm: 'use', bea: 'alt' }, { bea: 7.5 }]);
  assert.ok(ent('dafter', 'NKW', '2026-11-27', '', { pr: 0 }).ok);
  const u = C.eatDayUse(db, 'NKW', '2026-11-27');
  assert.deepEqual([u.used.bea, C.eatBaseOf(u, 'bea'), C.eatPerPlate(u, 'bea'), C.eatBaseOf(u, 'mm')], [15, 80, 0.1875, 100]);
  // "alt" is refused for a food without a third unit
  assert.ok(ent('dbefore', 'NKW', '2026-11-27', '', { q: { mm: 10 }, nc: {}, u: { mm: 'alt' } }).ok);
  assert.deepEqual(C.eatGet(db, 'dbefore', 'NKW', '2026-11-27', '').data.u, {});
}
console.log('core tests 1.13: all passed');
