SCREENS.deliveries = function () {
  var db = view(), mon = S.week, notes = eatNotes(db, mon, eatAddDays(mon, 6)), gaps = eatNoteGaps(db);
  var out = (S.sess.mode === 'admin' ? backBtn('overview', 'Overview') : weekLink()) + title('Delivery notes') + '<p class="muted">Copy the delivery notes of Self Reliance, one by one, once a week.</p>' + weekBar() +
    btn('Add a delivery note', 'data-a="noteNew"', 'primary block');
  if (gaps.length) out += banner('danger', 'Numbers not saved: ' + gapsText(gaps) + '. Check the book.');
  var any = false;
  places(db).forEach(function (c) {
    var ns = notes.filter(function (n) { return eatNoteHas(n, c.id); }); if (!ns.length) return; any = true;
    var tot = {}; ns.forEach(function (n) { var nq = eatNoteQ(n, c.id); for (var k in nq) tot[k] = (tot[k] || 0) + nq[k]; });
    out += h2(esc(shown(c.name))) + list(ns.map(function (n) {
      return linkRow('truck', 'No. ' + esc(n.data.no) + ' · ' + dayName(n.date), esc(noteItems(db, eatNoteQ(n, c.id))) + (n.centre === c.id ? (n.data.parts ? ' · and ' + esc(partsText(db, n.data.parts)) : '') + ' · ' + esc(lastLine(n)) + (n.data.remark ? ' · ' + esc(n.data.remark) : '') : ' · part of the note for ' + esc(centreName(n.centre))),
        'data-a="noteOpen" data-no="' + esc(n.data.no) + '"'); }).join('') +
      row('', 'Week', esc(noteItems(db, tot))));
  });
  if (!any) out += '<p class="muted">No delivery notes saved for this week.</p>';
  return out;
};
SCREENS.note = function () {
  var db = view(), f = S.f, t = todayStr(), dl = S.sess.mode === 'delivery', pl = places(db), stock = db.items.filter(function (it) { return it.stock; });
  var others = pl.filter(function (c) { return c.id !== f.centre; });
  return backBtn(dl ? 'deliver' : 'deliveries', 'Delivery notes') +
    title(f.orig ? 'Delivery note ' + esc(f.orig) : 'New delivery note') +
    (f.photo ? '<a class="cyp-btn" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' + esc(f.photo) + '/view">' + ic('camera') + 'See the photo of the note</a>' : '') +
    card(field('Note number (the red number)', 'nno', '<input id="nno" class="cyp-input num" type="text" inputmode="numeric" autocomplete="off" data-f="no" value="' + esc(f.no) + '"' + (f.orig ? '' : ' data-focus') + '>') +
      field('Date on the note', 'ndt', '<input id="ndt" class="cyp-input" type="date" max="' + t + '" data-f="date" value="' + esc(f.date) + '">')) +
    card(pl.length > 3 ? selectField(dl ? 'Who is the note for?' : 'Centre', 'ncen', (f.centre ? [] : [['', 'Choose']]).concat(pl.map(function (c) { return [c.id, shown(c.name)]; })), f.centre, 'noteCentreSel')
      : choice(dl ? 'Who is the note for?' : 'Centre', pl.map(function (c) { return { l: esc(shown(c.name)), on: c.id === f.centre, at: 'data-a="noteCentre" data-id="' + c.id + '"' }; }), { name: 'ncen' })) +
    card(h3('What is on the note') + stock.map(function (it) { return qRow(it.id, it.name, it.unit, f.q[it.id], undefined, stepOf(it.unit)); }).join('')) +
    card(h3('A part for another place') + small('When the note says, for example, "02 chickens for Chinika House". The quantities above stay the whole note.') +
      ((f.parts || []).length ? list(f.parts.map(function (pt, i) { return row('', esc(partsText(db, [pt])), '', '<button class="cyp-btn" data-a="partOff" data-i="' + i + '">Remove</button>'); }).join('')) : '') +
      field('Place', 'pto', '<select id="pto" class="cyp-input">' + others.map(function (c) { return '<option value="' + c.id + '">' + esc(shown(c.name)) + '</option>'; }).join('') + '</select>') +
      field('Food of the part', 'pit', '<select id="pit" class="cyp-input">' + stock.map(function (it) { return '<option value="' + it.id + '">' + esc(it.name) + ' (' + esc(it.unit) + ')</option>'; }).join('') + '</select>') +
      field('Quantity of the part', 'pqt', '<input id="pqt" class="cyp-input num" type="text" inputmode="decimal">') +
      btn('Add the part', 'data-a="partAdd"')) +
    (dl ? '' : card(selectField('How long should it last?', 'ndays', [['', 'Not written']].concat([1, 2, 3, 4, 5, 6, 7, 14].map(function (v) { return [v, v === 14 ? '2 weeks' : plural(v, 'day', 'days')]; })), f.days || '', 'daysSel',
      f.days ? 'From ' + dayName(f.date) + ' to ' + dayName(eatAddDays(f.date, f.days - 1)) : 'Days of food, from the date on the note.'))) +
    card(field('Remark on the note', 'nrm', '<input id="nrm" class="cyp-input" type="text" data-f="remark" value="' + esc(f.remark) + '">', 'For two weeks, for Chinika House…') +
      field('Received by', 'nrc', '<input id="nrc" class="cyp-input" type="text" data-f="recv" value="' + esc(f.recv) + '">')) +
    btn('Save the note', 'data-a="noteSave"', 'primary block') +
    (f.orig ? btn(f.offAsk ? 'Press again to remove note ' + esc(f.orig) : 'Remove this note', 'data-a="noteOff"', 'danger') : '');
};
function endPill(it, s) {
  var f = S.f, n = f.nc[it.id] ? null : eatNum(f.q[it.id]), d = n == null || s.expected == null ? null : Math.round((n - s.expected) * 100) / 100;
  return f.nc[it.id] ? tag('', 'Not counted') : (d == null ? '' : (d === 0 ? tag('ok', 'As expected') : (d < 0 ? tag('danger', d + ' ' + esc(it.unit) + ' missing') : tag('warn', '+' + d + ' ' + esc(it.unit) + ' more'))));
}
function countScreen() {
  var db = view(), f = S.f, start = f.kind === 'startweek', mon = eatMonday(f.date), t = todayStr();
  var rows = db.items.filter(function (it) { return it.stock; }).map(function (it) {
    /* the person only counts: what should be there, and the difference, are for the overview (comment of 20/11).
       beta 1.8 and 1.10 (Mauro, 26/11): no scale in the canteens, and they count as they see it: whole chickens and cut pieces
       (8 or 10 in a chicken), kg and bags of about so many kg, trays and loose eggs. All of it adds up; a food can be marked "about" */
    var nc = !!f.nc[it.id], alt = countAlt(it), tog = '';
    if (alt && !nc) {
      tog += qRow('x_' + it.id, alt.label, alt.unit, f.q['x_' + it.id], undefined, alt.step);
      if (alt.ask) tog += field(alt.ask, 'bk_' + it.id, '<input id="bk_' + it.id + '" class="cyp-input num" type="text" inputmode="decimal" autocomplete="off" placeholder="' + (alt.def || 0) + '" data-f="bk_' + it.id + '" value="' + esc(f['bk_' + it.id] == null ? '' : String(f['bk_' + it.id])) + '">', alt.hint);
      tog += '<p class="small muted" id="cv_' + it.id + '">' + countConvLine(it) + '</p>';
    }
    if (!nc) tog += choice('', [{ l: 'About: not weighed, not counted one by one', on: !!f.ab[it.id], at: 'data-a="about" data-k="' + it.id + '"' }], { many: true, aria: it.name + ': about' });
    return qRow(it.id, it.name, it.unit, f.q[it.id], nc, stepOf(it.unit), tog);
  }).join('');
  /* the days of a week a count can be on: Monday to Sunday, not after today */
  var days = [0, 1, 2, 3, 4, 5, 6].map(function (i) { var d = eatAddDays(mon, i); return [d, dayName(d), d > t]; });
  return weekLink() + title(start ? 'Start of the week' : 'Stock in the fridge') + '<p>' + (start ? 'What is in the store and in the cold room at the start of the week, before any food is taken out' : 'What is in the store and in the fridge, once a week') + ' · ' + esc(centreName(S.sess.centre)) + '</p>' +
    (start ? '' : banner('', 'Choose one day of the week for this count and always count on that same day, every week, after the last meal. Then the weeks can be compared.')) +
    card(selectField('Day of the count', 'cday', days, f.date, 'countDaySel', dayName(f.date) + (start ? ', morning' : ', evening'))) +
    card(rows) +
    btn(start ? 'Save the start of the week' : 'Save and carry to next week', 'data-a="saveCount"', 'primary block');
}

/* the count of the fridge as the cook sees it: next to the store unit, chicken also in cut pieces, kg foods also in bags,
   foods kept in bags or trays also loose (kg of mealie meal, eggs). k: pieces in a chicken (10 if not written) or kg in a bag (must be written) */
var PIECES_IN_CHICKEN = 10;
function countAlt(it) {
  if (it.id === 'chk') return { u: 'pieces', label: 'And cut pieces', unit: 'pieces', step: 1, ask: '1 chicken = how many pieces?', def: PIECES_IN_CHICKEN, hint: 'Small chickens are cut in 8. The app keeps it for next week.' };
  if (it.unit === 'kg') return { u: 'bags', label: 'And bags', unit: 'bags', step: 1, ask: '1 bag of ' + esc(it.name.toLowerCase()) + ' = about how many kg?', hint: 'Ask the cook, or lift one bag. The app keeps it for next week.' };
  if (it.unit !== it.use && it.per > 0) return { u: 'loose', label: 'And loose ' + it.use, unit: it.use, step: stepOf(it.use), per: it.per };
  return null;
}
/* what was written in the count of the fridge, in words */
function altWords(it, a) {
  var u = a.u === 'loose' ? 'loose ' + it.use : a.u, k = a.u === 'bags' && a.k ? ' of about ' + a.k + ' kg' : (a.u === 'pieces' && a.k ? ' (' + a.k + ' in a chicken)' : '');
  return (a.w ? fmt(a.w) + ' ' + it.unit + ' + ' : '') + fmt(a.n) + ' ' + u + k;
}
/* the whole count in the unit of the store; null when it cannot be worked out yet */
function countTotal(it, w, n, k) {
  var a = countAlt(it); if (!a || n == null || n === 0) return w;
  var x = a.u === 'pieces' ? n / (k > 0 ? k : PIECES_IN_CHICKEN) : (a.u === 'bags' ? (k > 0 ? n * k : null) : n / a.per);
  return x == null ? null : Math.round(((w || 0) + x) * 1000) / 1000;
}
function countConvLine(it) {
  var a = countAlt(it), w = eatNum(S.f.q[it.id]), n = eatNum(S.f.q['x_' + it.id]), k = eatNum(S.f['bk_' + it.id]);
  if (a.u === 'bags' && n && !(k > 0)) return 'Write about how many kg one bag holds.';
  if (!n) return a.u === 'pieces' ? (k > 0 ? k : PIECES_IN_CHICKEN) + ' pieces = 1 chicken.' : (a.u === 'loose' ? a.per + ' ' + esc(it.use) + ' = 1 ' + esc(it.unit.replace(/s$/, '')) + '.' : '');
  var v = countTotal(it, w, n, k); return v == null ? '' : 'All together: about ' + fmt(v) + ' ' + esc(it.unit);
}
/* the kg of one bag, or the pieces of one chicken, at a centre: from its last count that wrote it */
function lastBagKg(db, c, id) {
  var last = null; db.entries.forEach(function (e) { if (e.del || (e.type !== 'endweek' && e.type !== 'startweek') || e.centre !== c || !e.data.alt || !e.data.alt[id] || !e.data.alt[id].k) return; if (!last || e.date > last.date) last = e; });
  return last ? last.data.alt[id].k : null;
}