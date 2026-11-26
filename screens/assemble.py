import re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
R = os.path.dirname(HERE.rstrip('/')) + '/src/'
old = open(R + 'index.html.draft1').read().split('\n')
def L(a, b): return '\n'.join(old[a - 1:b])
def N(f): return open(HERE + f).read().rstrip('\n')
parts = [L(1, 16), N('style.css'), L(168, 238), N('icons.js'), L(263, 358), N('a.js'), L(410, 430), N('b.js'), L(433, 453), N('c.js'), L(573, 586), N('d.js'), L(623, 632), N('e.js'), L(642, 662), N('f.js'),
         L(688, 689), N('g.js'), L(700, 702), N('h.js'), L(732, 741), N('i.js'), L(776, 778), N('j.js'), L(836, 841), N('k.js'), L(867, 904), N('l.js'), L(932, 963), N('m.js'), L(970, 982), N('n.js'), N('o.js'),
         L(1110, 1448), N('places.js'), L(1461, 1514), N('comments.js'), L(1525, len(old))]
s = '\n'.join(parts)
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:90])
    s = s.replace(a, b)
# the first screens: the seal with its name in small capitals
rep("""function projectLogo() { return '<div class="signhead"><img class="wm" src="' + LOGO + '" alt="CYP EAT" width="229" height="48"><div class="plogo"><img src="' + PLOGO + '" alt="Cicetekelo Youth Project seal" width="51" height="48"><span>Cicetekelo Youth Project</span></div></div>'; }""",
    """function projectLogo() { return '<img class="wm" src="' + LOGO + '" alt="CYP EAT" width="191" height="40"><div class="plogo"><img src="' + PLOGO + '" alt="Cicetekelo Youth Project seal" width="51" height="48"><span class="label-caps">Cicetekelo Youth Project</span></div>'; }""")
rep('<link rel="stylesheet" href="ds/tokens.css">', '<link rel="stylesheet" href="tokens.css">')
# how to install: the words to tap in bold
s2 = re.sub(r'<span class="b">([^<]*)</span>', r'<strong>\1</strong>', s); assert s2.count('<strong>Share</strong>') == 1; s = s2
# the count of the people: what is on the screen after a tap
rep("""  var sb = document.querySelector('[data-a="grp"][aria-pressed="true"] .num'); if (sb) sb.textContent = curCount();""", """  var sb = document.querySelector('[data-a="grp"]:checked + span .num'); if (sb) sb.textContent = curCount();""")
rep("""  var md = document.querySelector('[data-a="meal"][aria-pressed="true"] .sd'); if (md) md.className = 'sd s-count';\n""", '')
rep("""A.less = function () { if (curCount() < 1) return; S.f.hist = []; setCount(curCount() - 1); peopleChanged(0); S.keepScroll = true; render(); };\n""", '')
# the place of a part keeps the spelling of the database; the screens show the fixed name
rep("f.parts = (f.parts || []).concat([{ to: to, name: centreName(to), q: q }])", "f.parts = (f.parts || []).concat([{ to: to, name: (eatCentre(db, to) || {}).name || to, q: q }])")
rep("+ ' for ' + p.name; }).join('; '); }", "+ ' for ' + shown(p.name); }).join('; '); }")
rep("out += ' Of these, ' + listWords(w) + (one ? ' is' : ' are') + ' for ' + p.name + '.'; });", "out += ' Of these, ' + listWords(w) + (one ? ' is' : ' are') + ' for ' + shown(p.name) + '.'; });")
# choices with four options or more are selects
rep("A.noteCentre = function (el) { S.f.centre = el.getAttribute('data-id'); S.keepScroll = true; render(); };",
    "A.noteCentre = function (el) { S.f.centre = el.getAttribute('data-id'); S.keepScroll = true; render(); };\nA.noteCentreSel = function (el) { S.f.centre = el.value; S.keepScroll = true; render(); };")
rep("A.countDay = function (el) { S.f.date = el.getAttribute('data-d'); S.keepScroll = true; render(); };", "A.countDaySel = function (el) { if (eatIsDate(el.value) && el.value <= todayStr()) S.f.date = el.value; S.keepScroll = true; render(); };")
rep("A.days = function (el) { var v = Number(el.getAttribute('data-v')); S.f.days = S.f.days === v ? null : v; S.keepScroll = true; render(); };", "A.daysSel = function (el) { S.f.days = Number(el.value) || null; S.keepScroll = true; render(); };")
rep("A.item = function (el) { S.item = el.getAttribute('data-id'); S.keepScroll = true; render(); };", "A.itemSel = function (el) { S.item = el.value; S.keepScroll = true; render(); };")
rep("A.itemSel = function (el) { S.item = el.value; S.keepScroll = true; render(); };", """A.itemSel = function (el) { S.item = el.value; S.keepScroll = true; render(); };
/* overview: the cover, the chapter on the screen, and the centre that is open. A chapter comes in from the side it is on; choosing a centre, a food or a week moves nothing */
A.ovStart = function () { S.ovOn = true; S.anim = 'next'; render(); window.scrollTo(0, 0); };
A.ovSec = function (el) { var ids = OVSECS.map(function (x) { return x[0]; }), to = el.getAttribute('data-s'), was = ids.indexOf(S.ovSec || 'plates'); if (ids.indexOf(to) < 0 || ids.indexOf(to) === was) return; S.anim = ids.indexOf(to) < was ? 'prev' : 'next'; S.ovSec = to; render(); window.scrollTo(0, 0); };
A.ovBack = function () { var ids = OVSECS.map(function (x) { return x[0]; }), was = ids.indexOf(S.ovSec || 'plates'); if (was > 0) { S.ovSec = ids[was - 1]; S.anim = 'prev'; } else S.ovOn = false; render(); window.scrollTo(0, 0); };
A.ovCentreSel = function (el) { S.ovC = el.value; S.keepScroll = true; render(); };
A.ovOpen = function (el) { S.ovC = el.getAttribute('data-id'); S.keepScroll = true; render(); };
A.ovAll = function () { S.ovC = ''; S.keepScroll = true; render(); };""")
rep("keepInputs();\n", "keepInputs();\n/* iPhone shows the pressed state of a button only when the page listens to touches */\ndocument.addEventListener('touchstart', function () {}, { passive: true });\n")
rep("  S.fullNext = true; /* a new sign in reads everything again: the overview also gets the comments */", "  S.fullNext = true; /* a new sign in reads everything again: the overview also gets the comments */\n  S.ovOn = false; S.ovSec = 'plates'; S.ovC = ''; S.from = ''; S.keepF = null;")
# settings: the counts of a day are removed by the overview
rep("A.setSec = function (el) { S.setSec = el.getAttribute('data-s'); S.notice = ''; render(); };", """A.setSec = function (el) { S.setSec = el.getAttribute('data-s'); S.notice = ''; S.good = ''; render(); };
A.rmCentre = function (el) { S.f.rc = el.value; S.f.rt = {}; S.good = ''; S.keepScroll = true; render(); };
A.rmDay = function (el) { if (eatIsDate(el.value) && el.value <= todayStr()) { S.f.rd = el.value; S.f.rt = {}; } S.good = ''; S.keepScroll = true; render(); };
A.rmPick = function (el) { var g = el.getAttribute('data-g'); S.f.rt = S.f.rt || {}; S.f.rt[g] = !rmOn(g); S.keepScroll = true; render(); };
A.rmAsk = function () { if (rmPicked(view()).length) openModal(rmModal); };
A.rmDo = function () {
  var picked = rmPicked(view()), types = []; if (!picked.length) return closeModal();
  picked.forEach(function (g) { types = types.concat(g.types); });
  queue({ kind: 'day_clean', centre: S.f.rc, date: S.f.rd, types: types });
  closeModal(); S.f.rt = {}; S.notice = '';
  S.good = 'Removed from ' + centreName(S.f.rc) + ', ' + dayName(S.f.rd) + ': ' + listWords(picked.map(function (g) { return g.name.toLowerCase(); })) + '.';
  S.keepScroll = true; render();
};""")
# names of places in messages
rep("if (!n || !confirm('Remove ' + n.name + '?')) return; queue({ kind: 'name_off', nid: n.id }); S.keepScroll = true; render(); };", "if (!n || !confirm('Remove ' + n.name + '?')) return; queue({ kind: 'name_off', nid: n.id }); S.f.editId = ''; S.keepScroll = true; render(); };")
rep("if (!c || !confirm('Remove ' + c.name + '?')) return; queue({ kind: 'place_off'", "if (!c || !confirm('Remove ' + shown(c.name) + '?')) return; queue({ kind: 'place_off'")
rep("if (!confirm('Remove ' + g + ' from ' + c.name + '?')) return;", "if (!confirm('Remove ' + g + ' from ' + shown(c.name) + '?')) return;")
rep("S.good = c.name + ', ' + m + ': ' + (n ? 'always '", "S.good = shown(c.name) + ', ' + m + ': ' + (n ? 'always '")
# a comment is written from More: it is about the page the person was on
rep("queue({ kind: 'comment', c: { text: t, screen: S.scr + (S.meal && S.scr === 'people' ? ' · ' + S.meal : ''),", "var scr = S.scr === 'more' ? (S.from || 'more') : S.scr;\n  queue({ kind: 'comment', c: { text: t, screen: scr + (S.meal && scr === 'people' ? ' · ' + S.meal : ''),")
rep("closeModal(); S.good = 'Comment saved. Thank you.'; S.keepScroll = true; render();", "closeModal(); if (S.scr === 'more') return backFromMore('Comment saved. Thank you.');\n  S.good = 'Comment saved. Thank you.'; S.keepScroll = true; render();")
rep("A.comment = function () { S.f.ct = ''; openModal(commentModal); };", "A.comment = function () { S.f.ct = ''; openModal(commentModal); };\nA.moreBack = function () { backFromMore(''); };")
# the export shows the names of the places as the screens do, in the fixed order
rep("if (fx != null) people.rows.push([e.date, WD[eatWeekday(e.date)], cc.name, m, fx,", "if (fx != null) people.rows.push([e.date, WD[eatWeekday(e.date)], shown(cc.name), m, fx,")
rep("(e.data.parts || []).forEach(function (pt) { noteRow(pt.name, pt.q, 'Part of the note for ' + c); });", "(e.data.parts || []).forEach(function (pt) { noteRow(shown(pt.name), pt.q, 'Part of the note for ' + c); });")
rep("eatCanteens(db).forEach(function (c) { var st = eatStock(db, c.id, todayStr()); db.items.forEach(function (it) { var s = st[it.id]; if (s) stock.rows.push([c.name,", "canteens(db).forEach(function (c) { var st = eatStock(db, c.id, todayStr()); db.items.forEach(function (it) { var s = st[it.id]; if (s) stock.rows.push([shown(c.name),")
rep("wk = eatAddDays(wk, 7), g++) eatCanteens(db).forEach(function (c) {", "wk = eatAddDays(wk, 7), g++) canteens(db).forEach(function (c) {")
rep("chk.rows.push([wk, eatAddDays(wk, 6), c.name, it.name,", "chk.rows.push([wk, eatAddDays(wk, 6), shown(c.name), it.name,")
# nothing of the old look is left
for bad in ['class="btn', 'class="card', 'class="pill', 'class="box', 'class="in"', 'class="in ', 'class="lab', 'class="nc', 'class="seg', 'class="row"', 'class="sec"', 'STEPUI', 'class="m ', 'class="b"', 'class="ctx', 'aria-pressed', 'eatCanteens(db).', 'eatPlaces(db).']:
    if bad in s: print('LEFT:', bad, s.count(bad), [l[:140] for l in s.split('\n') if bad in l][:4])
rep("document.addEventListener('input', function (ev) {", """/* a table row that opens a record takes Enter and Space like a button */
document.addEventListener('keydown', function (ev) {
  var el = ev.target; if ((ev.key !== 'Enter' && ev.key !== ' ') || !el.classList || !el.classList.contains('cyp-tr--link')) return;
  ev.preventDefault(); el.click();
});
document.addEventListener('input', function (ev) {""")
rep("foodDays: 0, foodDone: 0, skipped: 0 }", "foodDays: 0, foodDone: 0, skipped: 0, others: {} }")
rep("var d = eatAddDays(S.week, i); if (d > t) break;", "var d = eatAddDays(S.week, i); if (d > t) break;\n    var pd = eatPlanDay(db, c, d); if (pd && pd.o) for (var ok in pd.o) if (pd.o[ok] > 0) out.others[ok] = (out.others[ok] || 0) + pd.o[ok];")
rep("if (x.fixed != null) { x.plates += x.fixed; x.days++; }", "if (x.fixed != null) { var pn = pd && pd.p && pd.p[m] != null ? pd.p[m] : null; x.plates += pn != null ? pn : x.fixed; x.days++; if (pn != null) x.planned = (x.planned || 0) + 1; }")
rep("var NAV = { today: 'today',", "var NAV = { plan: 'week', today: 'today',")
rep("function enter(scr) {\n  if (!S.sess) return;", "function enter(scr) {\n  if (!S.sess) return;\n  if (scr === 'plan') { planInit(); return; }")
rep("if (S.sess && S.scr === 'deliver') A.photo(this); else this.value = '';", "if (S.sess && S.scr === 'plan') A.planPhoto(this); else if (S.sess && S.scr === 'deliver') A.photo(this); else this.value = '';")
rep("  if (el.hasAttribute('data-f')) S.f[el.getAttribute('data-f')] = el.value;", "  if (el.hasAttribute('data-f')) S.f[el.getAttribute('data-f')] = el.value;\n  if (el.hasAttribute('data-pl')) plSet(el.getAttribute('data-pl'), el.value);")
rep("A.go = function (el) { go(el.getAttribute('data-to')); };", """A.go = function (el) { if (el.getAttribute('data-to') === 'plan') S.plFrom = S.scr === 'people' ? 'people' : 'week'; go(el.getAttribute('data-to')); };
/* the plan of the week */
function plSet(id, v) {
  if (id === 'plr') { S.f.plr = v; return; }
  var m = /^pl(\\d)(f|p|on|ov|q|xw|xf)(.*)$/.exec(id); if (!m || !S.f.pld) return; var w = Number(m[1]), d = S.f.pld[w];
  if (m[2] === 'f') d.food = v;
  else if (m[2] === 'p') { d.p[m[3]] = v; plAuto(w); }
  else if (m[2] === 'q') { d.q[m[3]] = v; d.man[m[3]] = 1; var sh = document.getElementById('plsh' + w); if (sh) sh.innerHTML = plShares(view(), w); }
  else if (m[2] === 'xw' || m[2] === 'xf') d.x[Number(m[3])][m[2] === 'xw' ? 0 : 1] = v;
  else { d.o[Number(m[3])][m[2] === 'on' ? 0 : 1] = v; plAuto(w); }
}
A.planGo = function () { var from = S.scr; go('plan'); S.plFrom = from === 'people' ? 'people' : 'week'; render(); };
A.plCentre = function (el) { S.f.plc = el.value; plLoad(); S.keepScroll = true; render(); };
A.plWeek = function (el) { S.f.plw = el.value; plLoad(); S.keepScroll = true; render(); };
A.plDiff = function (el) { S.f.pld[Number(el.getAttribute('data-w'))].x.push(['', '']); S.keepScroll = true; render(); };
A.plOther = function (el) { S.f.pld[Number(el.getAttribute('data-w'))].o.push(['', '']); S.keepScroll = true; render(); };
A.plAddFood = function (el) {
  if (!el.value) return; var w = Number(el.id.charAt(2)), d = S.f.pld[w], it = eatItem(view(), el.value), r = plRation(plCentre(), el.value), tot = plTotal(d);
  d.q[el.value] = r != null && tot ? String(plRound(it, r * tot)) : ''; S.keepScroll = true; render();
};
A.plAgain = function () { S.f = {}; planInit(); render(); };
A.plSave = function () {
  var c = plCentre(), data = plData();
  if (!c) { S.notice = 'Choose the kitchen.'; return render(); }
  if (!data) { S.notice = 'Write at least one number of the plan.'; return render(); }
  queue({ kind: 'entry', e: { type: 'plan', centre: c, date: S.f.plw, meal: '', data: data, by: S.sess.nid || '', byName: myName() || (S.sess.mode === 'delivery' ? 'Deliveries' : 'Overview'), at: nowIso() } });
  S.pl = { step: 'saved', c: c, w: S.f.plw }; S.notice = ''; window.scrollTo(0, 0); render();
};
A.planPhoto = function (el) {
  var f = el.files && el.files[0]; if (!f) return;
  S.pl = { step: 'reading' }; render();
  shrinkPhoto(f, function (url) {
    try { el.value = ''; } catch (e) {}
    if (!url) { S.pl = { step: 'error', msg: 'This picture cannot be opened. Take the picture again.' }; return render(); }
    S.pl = { step: 'reading', img: url, t0: Date.now() }; render(); plRead(url.split(',')[1]);
  });
};
function plRead(data) {
  var img = S.pl.img;
  function fail(msg) { S.pl = { step: 'error', msg: msg, img: img }; render(); }
  if (!navigator.onLine) return fail('The picture is read on the internet. Try again when there is internet, or write the plan here.');
  clearInterval(S.dvTick); S.dvTick = setInterval(function () { var el = document.getElementById('rsec'); if (el && S.pl && S.pl.t0) el.textContent = Math.round((Date.now() - S.pl.t0) / 1000); else clearInterval(S.dvTick); }, 1000);
  post({ action: 'read', kind: 'plan', mode: S.sess.mode, cred: S.sess.cred, image: data }, 90000).then(function (res) {
    if (!res || !res.ok) {
      var e = res && res.error; S.f.plPhoto = res && res.photo || S.f.plPhoto;
      if (e === 'pin') return signOut('The PIN has changed. Sign in again.');
      return fail(e === 'no_reader' || e === 'reader_key' ? 'The photo reader is not set up. Write the plan here, or tell the office.' : (e === 'reader_busy' ? 'The photo reader is busy. Wait one minute and try again, or write the plan here.' : 'The picture could not be read. Take it again, flat, with the whole paper, or write the plan here.') + (res && res.detail ? ' (' + String(res.detail).slice(0, 80) + ')' : ''));
    }
    var r = res.plan || {};
    if (!r.clear) return fail('No plan could be read in the picture. Take it again, flat, with the whole paper, or write the plan here.');
    var mon = eatMonday(todayStr());
    if (S.sess.mode !== 'entry' && r.centre) S.f.plc = r.centre;
    if (r.week && r.week >= eatAddDays(mon, -7) && r.week <= eatAddDays(mon, 7)) S.f.plw = r.week;
    var c = plCentre(), old = c ? eatGet(view(), 'plan', c, S.f.plw, '') : null;
    plFill(r); S.f.plPhoto = res.photo || ''; S.f.plOld = !!old;
    S.pl = { step: 'form', read: true, img: img }; render();
  }).catch(function (err) { fail(String(err && err.message) === 'timeout' ? 'The photo reader took too long. Try again, or write the plan here.' : 'The picture could not be sent. Try again, or write the plan here.'); });
}""")
rep("saveFile('CYP-EAT_' + todayStr() + '.xlsx', makeXlsx([people, day].concat(food.rows.length ? [food] : []).concat([rec, end, chk, stock, com])));", """/* the plans of the week: one row for each day, meal or place, and food (beta 1.3) */
  var plans = { name: 'Plans', head: ['Week of', 'Date', 'Day', 'Centre', 'Food of the day', 'Meal or place', 'People', 'Item', 'Quantity', 'Unit', 'Taken out', 'Written by'], rows: [] };
  E.forEach(function (e) {
    if (e.type !== 'plan') return; var c = shown((eatCentre(db, e.centre) || {}).name || e.centre);
    for (var w = 0; w < 7; w++) {
      var d = (e.data.days || {})[String(w)]; if (!d) continue; var dt = eatAddDays(e.date, w), k;
      for (k in (d.p || {})) plans.rows.push([e.date, dt, WD[eatWeekday(dt)], c, d.food || '', k, d.p[k], '', '', '', '', e.byName || '']);
      for (k in (d.o || {})) plans.rows.push([e.date, dt, WD[eatWeekday(dt)], c, d.food || '', 'For ' + k, d.o[k], '', '', '', '', e.byName || '']);
      for (k in (d.q || {})) { var it = eatItem(db, k); if (!it) continue; var b = eatGet(db, 'dbefore', e.centre, dt, ''), tk = b && b.data.q[k] != null && !(b.data.nc || {})[k] ? eatConv(it, b.data.q[k], (b.data.u || {})[k]).unit : null;
        plans.rows.push([e.date, dt, WD[eatWeekday(dt)], c, d.food || '', '', '', it.name, d.q[k], it.unit, tk == null ? (b ? 'Not counted' : '') : tk, e.byName || '']); }
    }
  });
  saveFile('CYP-EAT_' + todayStr() + '.xlsx', makeXlsx([people, day].concat(food.rows.length ? [food] : []).concat([rec]).concat(plans.rows.length ? [plans] : []).concat([end, chk, stock, com])));""")
# beta 1.4 (comment of Mauro, 24/11): leftovers are written in portions; the app turns them into kg (or chickens) with the size of one portion
rep("function rowUnit(it, u) { return it.unit !== it.use && u === 'unit' ? 'unit' : 'use'; }", """function rowUnit(it, u) { return u === 'portion' ? 'portion' : (it.unit !== it.use && u === 'unit' ? 'unit' : 'use'); }
/* a quantity in the unit of the row: portions become the unit of the item with the size of one portion */
function convRow(it, q, u, size) { if (u !== 'portion') return eatConv(it, q, u); if (!(size > 0)) return { use: null, unit: null }; var use = Math.round(q * size * 1000) / 1000; return { use: use, unit: it.unit === it.use ? use : (it.per > 0 ? Math.round(use / it.per * 1000) / 1000 : null) }; }""")
rep("""    var un = rowUnit(it, f.u[id]), ut = un === 'unit' ? it.unit : it.use;
    out += qRow(id, (id === 'veg' && f.vegName ? f.vegName : it.name), ut, f.q[id], !!f.nc[id], stepOf(ut), after ? '' : unitTog(it, f.u[id]));
    if (id === 'chk') out += qRow('pcs', after ? 'Chicken pieces left' : 'Chicken pieces cut', 'pieces', f.q.pcs, !!f.nc.pcs, 1);""",
"""    var un = rowUnit(it, f.u[id]), ut = un === 'portion' ? 'portions' : (un === 'unit' ? it.unit : it.use), size = f.ps ? f.ps[id] : null;
    out += qRow(id, (id === 'veg' && f.vegName ? f.vegName : it.name), ut, f.q[id], !!f.nc[id], un === 'portion' ? 1 : stepOf(ut), after ? afterTog(it, f.u[id], size) : unitTog(it, f.u[id]));
    if (id === 'chk' && !(after && un === 'portion')) out += qRow('pcs', after ? 'Chicken pieces left' : 'Chicken pieces cut', 'pieces', f.q.pcs, !!f.nc.pcs, 1);""")
rep("""function unitTog(it, u) {""", """/* leftovers: in portions when the size of a portion is known, else in kg, bags or trays */
function afterTog(it, u, size) {
  var cur = rowUnit(it, u), opts = (size > 0 ? ['portion'] : []).concat(it.unit === it.use ? ['use'] : ['unit', 'use']);
  return (size > 0 && cur === 'portion' ? '<p class="small muted">1 portion = ' + fmt(size) + ' ' + esc(it.use) + (it.id === 'chk' ? ' (a chicken is cut in 10)' : '') + '</p>' : '') +
    (size > 0 ? '' : '<p class="small muted">To write it in portions: its quantity in the plan of the week, or the size of a portion in Overview, Settings, Food and units.</p>') +
    (opts.length > 1 ? choice('', opts.map(function (x) { return { l: x === 'portion' ? 'In portions' : 'In ' + esc(x === 'unit' ? it.unit : it.use), on: x === cur, at: 'data-a="unit" data-k="' + it.id + '" data-v="' + x + '"' }; }), { name: 'au_' + it.id }) : '');
}
function unitTog(it, u) {""")
rep("""    S.f.u = {}; rows.forEach(function (id) { var it = eatItem(db, id); if (!it || it.unit === it.use) return; S.f.u[id] = scr === 'after' ? (bu[id] || 'use') : (e ? ((su && su[id]) || 'use') : 'unit'); });""",
"""    S.f.u = {}; rows.forEach(function (id) { var it = eatItem(db, id); if (!it || it.unit === it.use) return; S.f.u[id] = scr === 'after' ? (bu[id] || 'use') : (e ? ((su && su[id]) || 'use') : 'unit'); });
    /* leftovers in portions: the size of one portion of each food; saved ones show again in portions */
    if (scr === 'after') {
      S.f.ps = {}; rows.forEach(function (id) {
        var size = e && e.data.ps && e.data.ps[id] > 0 ? e.data.ps[id] : eatPortionSize(db, c, d, id); if (!(size > 0)) return;
        S.f.ps[id] = size;
        if (e && e.data.pz && e.data.pz[id] != null) { S.f.u[id] = 'portion'; S.f.q[id] = e.data.pz[id]; }
        else if (!e || e.data.q[id] == null) S.f.u[id] = 'portion';
      });
    }""")
rep("""A.saveAfter = function () {
  var d = qData(); S.f.rows.forEach(function (id) { if (!(id in d.q) || d.q[id] == null) d.q[id] = S.f.nc[id] ? null : (eatNum(S.f.q[id]) || 0); });
  if (S.f.rows.indexOf('chk') >= 0 && !S.f.nc.pcs && d.q.pcs == null) d.q.pcs = 0;
  d.u = S.f.u || {};""", """A.saveAfter = function () {
  var d = qData(); S.f.rows.forEach(function (id) { if (!(id in d.q) || d.q[id] == null) d.q[id] = S.f.nc[id] ? null : (eatNum(S.f.q[id]) || 0); });
  if (S.f.rows.indexOf('chk') >= 0 && !S.f.nc.pcs && d.q.pcs == null) d.q.pcs = 0;
  d.u = {}; for (var uk in (S.f.u || {})) d.u[uk] = S.f.u[uk];
  /* portions: kept as written, and turned into the unit of the item; chicken portions are the pieces left */
  var pz = {}, ps = {}, anyP = false;
  S.f.rows.forEach(function (id) {
    if (S.f.u[id] !== 'portion' || S.f.nc[id] || d.q[id] == null) return; var it = eatItem(view(), id), size = S.f.ps[id];
    pz[id] = d.q[id]; ps[id] = size; d.q[id] = convRow(it, d.q[id], 'portion', size).use; d.u[id] = 'use'; anyP = true;
    if (id === 'chk') d.q.pcs = pz[id];
  });
  if (anyP) { d.pz = pz; d.ps = ps; }""")
rep("    if (un !== it.unit || (pack && per !== it.per)) { queue({ kind: 'item_unit', iid: it.id, unit: un, per: per }); n++; }", """    if (un !== it.unit || (pack && per !== it.per)) { queue({ kind: 'item_unit', iid: it.id, unit: un, per: per }); n++; }
    var po = S.f['po_' + it.id]; if (po != null && (eatNum(po) || 0) !== (it.portion || 0)) { queue({ kind: 'item_portion', iid: it.id, v: String(po).trim() === '' ? '' : eatNum(po) }); n++; } delete S.f['po_' + it.id];""")
rep("    (key === 'pcs' || nc ? '' : '<div class=\"four\">'", "    (key === 'pcs' || nc || (S.f.u && S.f.u[key] === 'portion') ? '' : '<div class=\"four\">'")
rep("A.cleft = function (el) {", "A.saveStaff = function () { var v = eatNum(S.f.staffN); if (v == null || v < 0 || v > 200) { S.msg = 'Write a number from 0 to 200.'; render(); return; } queue({ kind: 'entry', e: { type: 'staff', centre: S.sess.centre, date: S.date, meal: '', data: { n: Math.round(v) }, by: S.sess.nid || '', byName: myName() || 'Overview', at: nowIso() } }); S.f.staffN = null; S.keepScroll = true; render(); };\nA.cdinleft = function (el) { var c = eatCentre(view(), el.getAttribute('data-id')); queue({ kind: 'centre_dinleft', cid: c.id, on: !eatDinLeft(view(), c.id) }); S.keepScroll = true; render(); };\nA.cleft = function (el) {")
# beta 1.6: the kitchen staff who ate, in the sheet People of the Excel
rep("  E.forEach(function (e) {\n    var c = centreName(e.centre);", "  E.forEach(function (e) { if (e.type === 'staff') people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Kitchen staff', e.data.n, '', '', e.byName || '', e.at || '']); });\n  E.forEach(function (e) {\n    var c = centreName(e.centre);")
sys.path.insert(0, HERE); from b17 import b17; s = b17(s); from b18 import b18, b18b; s = b18(s); s = b18b(s); from b19 import b19; s = b19(s)
from b20 import b20; s = b20(s)
from b21 import b21; s = b21(s)
from b22 import b22; s = b22(s)
open(R + 'index.html', 'w').write(s); print('lines', s.count('\n') + 1)
