function camButton(label, pri, hand) {
  return '<label class="cyp-btn' + (pri ? ' cyp-btn--primary' : '') + ' cyp-btn--block cam" for="cam">' + ic('camera') + label + '</label>' +
    '<label class="cyp-btn cyp-btn--block" for="gal">' + ic('gallery') + 'Choose a photo from the gallery</label>' +
    btn(hand || 'Write the note by hand', 'data-a="dvHand"', '', 'pen');
}
SCREENS.deliver = function () {
  var db = view(), v = S.dv || { step: 'start' }, t = todayStr();
  var mine = eatNotes(db, t, t).filter(function (n) { return n.byName === 'Deliveries'; });
  var today = mine.length ? h2('Saved today') + list(mine.map(function (n) {
    return linkRow('truck', 'No. ' + esc(n.data.no) + ' · ' + esc(centreName(n.centre)), esc(noteItems(db, eatNoteQ(n, n.centre))) + (n.data.photo ? '' : ' · written by hand'),
      'data-a="dvOpen" data-no="' + esc(n.data.no) + '"'); }).join('')) + small('Tap a note to correct it.') : '';
  var photo = v.img ? '<img class="photo" src="' + v.img + '" alt="The photo of the delivery note">' : '';
  if (v.step === 'reading') return title('Reading the note…') + photo + '<p role="status">It takes 10 to 20 seconds. <strong class="num" id="rsec">' + (v.t0 ? Math.round((Date.now() - v.t0) / 1000) : 0) + '</strong> s</p>';
  if (v.step === 'check') {
    var r = v.reads[v.i], other = eatNote(db, r.no);
    return title('Is this correct?') + (v.reads.length > 1 ? '<p>' + tag('', 'Note ' + (v.i + 1) + ' of ' + v.reads.length + ' in the picture') + '</p>' : '') + photo +
      card(small('The picture says:') + '<p class="heading-2" id="said">' + esc(v.sentence) + '</p>' +
      (other ? banner('warn', 'Note ' + esc(r.no) + ' is already saved (' + esc(centreName(other.centre)) + '). Yes replaces it.') : '') +
      ('speechSynthesis' in window ? btn('Listen', 'data-a="say"', '', 'sound') : '')) +
      btn('Yes, it is correct', 'data-a="dvYes"', 'primary block', 'check') +
      camButton('No, take the picture again', false, 'No, correct it by hand');
  }
  if (v.step === 'saved') return banner('ok', 'Saved: delivery note' + (v.nos.length > 1 ? 's ' + esc(v.nos.join(' and ')) : ' ' + esc(v.nos[0])) + '. Thank you.') +
    (v.unclear ? banner('warn', (v.unclear === 1 ? 'One more note in the picture could not be read' : v.unclear + ' more notes could not be read') + ': take a picture of it alone.') : '') +
    camButton('Take a picture of the next delivery note', true) + today;
  if (v.step === 'error') return title(esc(v.title)) + photo + banner('danger', esc(v.msg), 'alert') +
    (v.retry ? btn('Try again', 'data-a="dvRetry"', 'primary block') : '') + camButton('Take the picture again', !v.retry) + today;
  return title('Delivery notes') + '<p>Take a picture of each delivery note, flat, with the whole note in the picture. Or write the note by hand.</p>' + camButton('Take a picture of the delivery note', true) + today;
};
/* ===== the plan of the week (beta 1.3): the paper each kitchen writes for the week, with the people of each meal, the other places it cooks for,
   and the food of each day. Every number changes from week to week. A photo read by the photo reader fills the form; the form can also be written by hand.
   The deliveries person chooses the kitchen; a kitchen phone writes the plan of its own centre. ===== */
var PLWD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function plCentre() { return S.sess.mode === 'delivery' || S.sess.mode === 'admin' ? (S.f.plc || '') : S.sess.centre; }
/* the form from a plan (saved or read): flat fields, one for each box */
function plFill(data) {
  var f = S.f; f.pld = {};
  for (var w = 0; w < 7; w++) {
    var d = (data && data.days || {})[String(w)] || {}, o = [];
    for (var k in (d.o || {})) o.push([k, String(d.o[k])]);
    var q = {}; for (var id in (d.q || {})) q[id] = String(d.q[id]);
    var p = {}; for (var m in (d.p || {})) p[m] = String(d.p[m]);
    /* base: for each food, the quantity and the people it was planned for; the quantities follow the people (comment of Mauro, 24/11: half automatic) */
    var tot = plTotal({ p: p, o: o }), base = {}; for (id in q) if (tot && Number(q[id]) > 0) base[id] = [Number(q[id]), tot];
    var x = (d.x || []).map(function (y) { return [y.who || '', y.food || '']; });
    f.pld[w] = { food: d.food || '', p: p, o: o.length ? o : [['', '']], q: q, base: base, man: {}, x: x };
  }
  f.plr = data && data.remark || '';
}
/* the people of a day in the form: every meal and every other place */
function plTotal(d) { var t = 0, m; for (m in d.p) t += Number(d.p[m]) || 0; (d.o || []).forEach(function (x) { t += Number(x[1]) || 0; }); return t; }
/* a quantity for so many people, rounded the way the store counts it: whole chickens, quarter bags and trays, half kg */
function plRound(it, v) { var st = /chicken|sausage|loa/.test(it.unit) ? 1 : (it.unit === 'kg' ? 0.5 : 0.25); return Math.round(v / st) * st; }
/* how much of a food this kitchen plans for one person: the plans already saved, newest first */
function plRation(c, id) {
  var es = view().entries.filter(function (e) { return e.type === 'plan' && e.centre === c && !e.del; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  for (var i = 0; i < es.length; i++) for (var w = 0; w < 7; w++) {
    var d = (es[i].data.days || {})[String(w)]; if (!d || !d.q || !(d.q[id] > 0)) continue;
    var t = 0, k; for (k in (d.p || {})) t += d.p[k] || 0; for (k in (d.o || {})) t += d.o[k] || 0; if (t) return d.q[id] / t;
  }
  return null;
}
/* the people of a day changed: every quantity not written by hand follows them */
function plAuto(w) {
  var d = S.f.pld[w], tot = plTotal(d), db = view(), c = plCentre();
  for (var id in d.q) {
    if (d.man[id]) continue; var it = eatItem(db, id), b = d.base[id], r = b ? b[0] / b[1] : plRation(c, id); if (!it || r == null || !tot) continue;
    d.q[id] = String(plRound(it, r * tot)); var el = document.getElementById('pl' + w + 'q' + id); if (el) el.value = d.q[id];
  }
  var sh = document.getElementById('plsh' + w); if (sh) sh.innerHTML = plShares(db, w);
}
/* the part of each food for the other places, from their people: "For Ukubalula (10 of 170): 0.5 trays of eggs" */
function plShares(db, w) {
  var d = S.f.pld[w], tot = plTotal(d), out = [];
  if (!tot) return '';
  d.o.forEach(function (x) {
    var n = Number(x[1]) || 0; if (!x[0] || !n) return;
    var parts = []; for (var id in d.q) { var it = eatItem(db, id), q = Number(d.q[id]); if (it && q > 0) parts.push(fmt(Math.round(q * n / tot * 100) / 100) + ' ' + esc(it.unit) + ' of ' + esc(it.name.toLowerCase())); }
    if (parts.length) out.push('For ' + esc(x[0]) + ' (' + n + ' of ' + tot + ' people): ' + parts.join(', '));
  });
  return out.join('<br>');
}
/* the plan of the week, or, when there is none yet, the last plan of this kitchen: the food is mostly the same every week, so only what is different is changed */
function plLoad() {
  var db = view(), c = plCentre(), e = c && S.f.plw ? eatGet(db, 'plan', c, S.f.plw, '') : null, prev = null;
  if (c && !e) db.entries.forEach(function (x) { if (x.type === 'plan' && x.centre === c && !x.del && x.date < S.f.plw && (!prev || x.date > prev.date)) prev = x; });
  plFill(e ? e.data : (prev ? { days: prev.data.days } : null)); S.f.plPhoto = e && e.data.photo || ''; S.f.plOld = !!e; S.f.plCopied = !e && prev ? prev.date : '';
}
function planInit() {
  var t = todayStr(), w = eatMonday(S.sess.mode === 'entry' && S.date ? S.date : t), next = eatAddDays(eatMonday(t), 7);
  S.f.plw = w > next ? next : w; S.pl = { step: 'form' }; plLoad();
}
function plNum(x) { var v = eatNum(x); return v == null || v < 0 ? null : v; }
/* the plan in the form, as the data of the entry; null when nothing is written */
function plData() {
  var f = S.f, days = {}, any = false;
  for (var w = 0; w < 7; w++) {
    var d = f.pld[w], p = {}, o = {}, q = {}, has = false;
    for (var m in d.p) { var v = plNum(d.p[m]); if (v != null) { p[m] = Math.round(v); has = true; } }
    d.o.forEach(function (x) { var nm = eatText(x[0], 40), v2 = plNum(x[1]), pid = nm ? eatPlaceMatch(view(), nm) : ''; if (pid && eatCentre(view(), pid).place) nm = shown(eatCentre(view(), pid).name); if (nm && v2 != null) { o[nm] = Math.round(v2); has = true; } });
    for (var id in d.q) { var v3 = plNum(d.q[id]); if (v3 != null) { q[id] = v3; has = true; } }
    if (eatText(d.food, 60)) has = true;
    var x = (d.x || []).map(function (y) { return { who: eatText(y[0], 40), food: eatText(y[1], 60) }; }).filter(function (y) { return y.who || y.food; });
    if (has || x.length) { days[String(w)] = { p: p, o: o, q: q, food: eatText(d.food, 60), x: x }; any = true; }
  }
  return any ? { days: days, photo: f.plPhoto || '', remark: eatText(f.plr, 200) } : null;
}
function plInput(id, val, label, wide, ph) { return '<input id="' + id + '" class="cyp-input' + (wide ? '' : ' num') + '" type="text"' + (wide ? '' : ' inputmode="decimal"') + (ph ? ' placeholder="' + ph + '"' : '') + ' aria-label="' + esc(label) + '" value="' + esc(val || '') + '" data-pl="' + id + '">'; }
function plDay(db, c, w) {
  var d = S.f.pld[w], date = eatAddDays(S.f.plw, w), cen = eatCentre(db, c), meals = cen ? cen.meals : ['Lunch'];
  var ppl = meals.map(function (m) { return field(m === 'Dinner' ? 'Dinner (sapa): people' : m + ': people', 'pl' + w + 'p' + m, plInput('pl' + w + 'p' + m, d.p[m], PLWD[w] + ', ' + m + ': people')); }).join('');
  var oth = d.o.map(function (x, i) {
    return '<div class="cyp-field"><label for="pl' + w + 'on' + i + '">Another place cooked for here: name and people</label><div class="inl">' + plInput('pl' + w + 'on' + i, x[0], PLWD[w] + ', another place: name', true, 'Place').replace('<input ', '<input list="plplaces" ') + plInput('pl' + w + 'ov' + i, x[1], PLWD[w] + ', ' + (x[0] || 'another place') + ': people', false, 'People') + '</div></div>';
  }).join('') + btn('+ Another place', 'data-a="plOther" data-w="' + w + '"');
  var shown2 = db.items.filter(function (it) { return d.q[it.id] != null; }), more = db.items.filter(function (it) { return d.q[it.id] == null; });
  var food = shown2.map(function (it) { return field(esc(it.name) + ' (' + esc(it.unit) + ')', 'pl' + w + 'q' + it.id, plInput('pl' + w + 'q' + it.id, d.q[it.id], PLWD[w] + ', ' + it.name + ' in ' + it.unit)); }).join('') +
    (more.length ? selectField('Add a food', 'pl' + w + 'add', [['', 'Choose']].concat(more.map(function (it) { return [it.id, it.name + ' (' + it.unit + ')']; })), '', 'plAddFood') : '');
  var diff = d.x.map(function (y, i) {
    return '<div class="cyp-field"><label for="pl' + w + 'xw' + i + '">Something different: who, and what they eat</label><div class="inl">' + plInput('pl' + w + 'xw' + i, y[0], PLWD[w] + ', something different: who', true, 'Who') + plInput('pl' + w + 'xf' + i, y[1], PLWD[w] + ', something different: what they eat', true, 'What') + '</div></div>';
  }).join('') + btn('+ Something different for some people', 'data-a="plDiff" data-w="' + w + '"');
  return card(h3(dayName(date)) + field('Food of the day, the same for everybody', 'pl' + w + 'f', plInput('pl' + w + 'f', d.food, PLWD[w] + ': food of the day', true)) + ppl + oth + food +
    '<p class="small muted" id="plsh' + w + '">' + plShares(db, w) + '</p>' + diff, 'data-plday="' + w + '"');
}
SCREENS.plan = function () {
  var db = view(), v = S.pl || { step: 'form' }, c = plCentre(), t = todayStr(), mon = eatMonday(t), next = eatAddDays(mon, 7);
  var photo = v.img ? '<img class="photo" src="' + v.img + '" alt="The photo of the plan">' : '';
  if (v.step === 'reading') return title('Reading the plan…') + photo + '<p role="status">It takes 10 to 30 seconds. <strong class="num" id="rsec">' + (v.t0 ? Math.round((Date.now() - v.t0) / 1000) : 0) + '</strong> s</p>';
  if (v.step === 'saved') return banner('ok', 'Saved: the plan of ' + esc(centreName(v.c)) + ', week of ' + dmy(v.w) + '. Thank you.') + btn('Write or correct a plan', 'data-a="plAgain"', 'primary block', 'pen');
  var dl = S.sess.mode !== 'entry';
  var head = (!dl && S.plFrom ? backBtn(S.plFrom, S.plFrom === 'people' ? 'People' : 'Weekly') : '') + title('Plan of the week') + '<p>The paper the kitchen writes for the week: the people for each meal, the other places it cooks for, and the food of each day. Take a picture of it, or write it here.</p>' +
    (v.step === 'error' ? banner('danger', esc(v.msg), 'alert') : '') +
    '<label class="cyp-btn cyp-btn--primary cyp-btn--block cam" for="cam">' + ic('camera') + 'Take a picture of the plan</label><label class="cyp-btn cyp-btn--block" for="gal">' + ic('gallery') + 'Choose a photo from the gallery</label>' + photo +
    (v.read ? banner('warn', 'Read from the photo. Check every number with the paper, then save.') : '');
  var pick = (dl ? selectField('Kitchen', 'plc', [['', 'Choose the kitchen']].concat(canteens(db).map(function (x) { return [x.id, shown(x.name)]; })), c, 'plCentre') : '<p class="body-strong">' + esc(centreName(c)) + '</p>') +
    choice('Week', [{ l: 'This week, ' + dmy(mon), on: S.f.plw === mon, at: 'data-a="plWeek" value="' + mon + '"' }, { l: 'Next week, ' + dmy(next), on: S.f.plw === next, at: 'data-a="plWeek" value="' + next + '"' }].concat(S.f.plw !== mon && S.f.plw !== next ? [{ l: 'Week of ' + dmy(S.f.plw), on: true, at: 'data-a="plWeek" value="' + S.f.plw + '"' }] : []), { name: 'plw' });
  if (!c) return head + pick;
  return head + pick + (S.f.plOld ? banner('', 'The plan of this week is saved. Saving again replaces it.') : '') +
    (S.f.plCopied && !v.read ? banner('', 'Filled in from the plan of the week of ' + dmy(S.f.plCopied) + '. Change only what is different: the quantities follow the people.') : '') +
    [0, 1, 2, 3, 4, 5, 6].map(function (w) { return plDay(db, c, w); }).join('') +
    '<datalist id="plplaces">' + places(db).filter(function (x) { return x.id !== c; }).map(function (x) { return '<option value="' + esc(shown(x.name)) + '">'; }).join('') + '</datalist>' +
    field('Remark', 'plr', plInput('plr', S.f.plr, 'Remark', true)) +
    btn('Save the plan', 'data-a="plSave"', 'primary block', 'check');
};
