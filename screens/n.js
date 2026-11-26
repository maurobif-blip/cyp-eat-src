/* one number with its name and its base (StatTile) */
function stat(label, n, note) { return '<div class="cyp-stat"><span class="cyp-stat__label label-caps">' + label + '</span><span class="cyp-stat__figure figure num" data-count="' + n + '">' + nf(n) + '</span><span class="cyp-stat__note">' + note + '</span></div>'; }
/* one row of a ProgressTable: the place in its fixed colour, a bar, three values */
function progRow(c, pc, a, b, d, cls) { return '<div class="cyp-progress__row ' + placeClass(c.id) + (cls || '') + '"><span class="cyp-progress__label"><i class="cyp-swatch"></i><span class="label-caps">' + esc(shown(c.name)) + '</span></span><span class="cyp-bar"><i style="width:' + Math.max(0, Math.min(100, Math.round(pc))) + '%"></i></span><span>' + a + '</span><span>' + b + '</span><span>' + d + '</span></div>'; }
function progTable(icon, name, sub, heads, rows, total) {
  return '<div class="cyp-progress cyp-c-blue"><div class="cyp-progress__head"><span class="cyp-disc">' + ic(icon) + '</span><div><span class="heading-2">' + name + '</span><small>' + sub + '</small></div></div>' +
    '<div class="cyp-progress__row cyp-progress__row--head"><span></span><span></span><span>' + heads[0] + '</span><span>' + heads[1] + '</span><span>' + heads[2] + '</span></div>' + rows +
    '<div class="cyp-progress__row cyp-progress__row--total"><span>' + total[0] + '</span><span></span><span>' + total[1] + '</span><span>' + total[2] + '</span><span>' + total[3] + '</span></div></div>';
}
/* Overview as an interactive report (InteractiveReport of the design system): a cover, then one chapter on the screen at a time (Plates, Food, Store),
   the number first, charts that draw themselves once, and a centre that opens from its row with Open. */
var OVSECS = [['plates', 'Plates'], ['food', 'Food'], ['store', 'Store']];
/* the plan of the week against what happened (beta 1.3): for each day, the people planned and counted at lunch, and the food planned and taken out
   of the store. Food taken out above the plan, or plates cooked for more people than came, should come back as leftovers: if not, the food went somewhere. */
function planWeek(db, c) {
  var t = todayStr(), out = { has: !!eatGet(db, 'plan', c, S.week, ''), days: [], over: 0, fewer: 0 };
  for (var i = 0; i < 7; i++) {
    var d = eatAddDays(S.week, i); if (d > t) { break; }
    var k = eatPlanCheck(db, c, d); if (!k.day) continue;
    k.food.forEach(function (x) { if (x.diff != null && x.diff > 0) out.over++; });
    k.people.forEach(function (x) { if (!x.fixed && x.plan != null && x.counted != null && x.counted < x.plan) out.fewer += x.plan - x.counted; });
    out.days.push({ date: d, k: k });
  }
  return out;
}
function sg(n) { return n > 0 ? '+' + fmt(n) : fmt(n); }
function planCard(db, cs, sel, wide) {
  if (!sel) return card(h3('Plan of the week') + small('The plan of each kitchen against what happened: food taken out of the store and people counted at lunch.') + list(cs.map(function (c) {
    var w = planWeek(db, c.id);
    return linkRow('clip', esc(shown(c.name)), !w.has ? 'No plan saved for this week' : (w.days.length ? plural(w.over, 'food', 'foods') + ' taken out above the plan · ' + (w.fewer ? w.fewer + ' fewer people at lunch than planned' : 'lunch as planned or more') : 'Plan saved, no day of it yet'), openAt(c), w.has ? (w.over ? tag('warn', 'Check') : tag('ok', 'Plan saved')) : tag('', 'No plan'));
  }).join('')), 'data-plan');
  var w = planWeek(db, sel), ppl = [], food = [];
  if (!w.has) return card(h3('Plan of the week') + '<p class="muted">No plan saved for this week. The kitchen or the deliveries person writes it: a photo of the paper, or by hand.</p>', 'data-plan');
  var pr = [], fr = [];
  w.days.forEach(function (x) {
    var dn = dayName(x.date);
    x.k.people.forEach(function (p) { pr.push(row('', dn + ' · ' + p.meal, 'Plan ' + (p.plan == null ? '–' : nf(p.plan)) + ' · counted: ' + (p.fixed ? 'not counted' : (p.counted == null ? 'no count' : nf(p.counted))), !p.fixed && p.plan != null && p.counted != null && p.counted !== p.plan ? tag(p.counted < p.plan ? 'warn' : '', sg(p.counted - p.plan)) : '')); });
    for (var o2 in (x.k.day.o || {})) pr.push(row('', dn + ' · For ' + esc(o2), 'Plan ' + nf(x.k.day.o[o2]) + ' · not counted'));
    x.k.food.forEach(function (f) { var it = eatItem(db, f.id); if (f.plan == null && f.out == null) return; fr.push(row('', dn + ' · ' + esc(it.name), 'Plan ' + (f.plan == null ? 'nothing' : fmt(f.plan) + ' ' + esc(it.unit)) + ' · taken out: ' + (!f.before ? 'no count' : (f.out == null ? 'not counted' : fmt(f.out) + ' ' + esc(it.unit))), f.diff ? tag(f.diff > 0 ? 'warn' : '', sg(f.diff)) : '')); });
    x.k.people.forEach(function (p) { ppl.push([dayName(x.date), p.meal, p.plan == null ? '–' : nf(p.plan), p.fixed ? 'not counted' : (p.counted == null ? 'no count' : nf(p.counted)), p.fixed || p.plan == null || p.counted == null ? '–' : sg(p.counted - p.plan)]); });
    for (var o in (x.k.day.o || {})) ppl.push([dayName(x.date), 'For ' + esc(o), nf(x.k.day.o[o]), 'not counted', '–']);
    x.k.food.forEach(function (f) { var it = eatItem(db, f.id); food.push([dayName(x.date), esc(it.name) + ' (' + esc(it.unit) + ')', f.plan == null ? 'not in the plan' : fmt(f.plan), !f.before ? 'no count' : (f.out == null ? 'not counted' : fmt(f.out)), f.diff == null ? '–' : (f.diff > 0 ? tag('warn', sg(f.diff)) : sg(f.diff))]); });
  });
  return card(h3('Plan of the week') + small('Lunch is counted; dinner and the other places take the number of the plan.') +
    (ppl.length ? (wide ? table([['Day'], ['Meal'], ['Plan', 1], ['Counted', 1], ['Difference', 1]], ppl, null, { dense: true }) : list(pr.join(''))) : '<p class="muted">No day of the plan yet.</p>') +
    h3('Food: plan and taken out') + small('Taken out: the quantities written in the morning. Above the plan, the food should come back in the leftovers.') +
    (food.length ? (wide ? table([['Day'], ['Food'], ['Plan', 1], ['Taken out', 1], ['Difference', 1]], food, null, { dense: true }) : list(fr.join(''))) : '<p class="muted">No food in the plan or in the counts yet.</p>'), 'data-plan');
}
/* what opens one centre: the whole row, band or table row, with chevron-right (design system of 24/11, no Open button) */
function openAt(c) { return 'data-a="ovOpen" data-id="' + c.id + '"'; }
/* the chapters, in a row under the bar: number and name on a computer, the number alone on a phone (the page title carries the name) */
function chapterNav() {
  var sec = S.ovSec || 'plates';
  return '<nav class="cyp-nav cyp-nav--chapters" aria-label="Chapters">' + OVSECS.map(function (x, i) { return '<a href="#" class="label-caps" data-a="ovSec" data-s="' + x[0] + '"' + (x[0] === sec ? ' aria-current="page"' : '') + ' aria-label="' + (i + 1) + ' ' + x[1] + '">' + (i + 1) + '<span class="cyp-nav__name">&nbsp;' + x[1] + '</span></a>'; }).join('') + '</nav>';
}
/* one place or section with its bar, for the width of a phone (ProgressRow) */
/* at: the row leads to more detail, so the whole row is the tap target, with chevron-right after the percentage */
function prowWrap(cls, at, inner) { return at ? '<a href="#" class="cyp-prow cyp-prow--link ' + cls + '" ' + at + '>' + inner + '</a>' : '<div class="cyp-prow ' + cls + '">' + inner + '</div>'; }
function prow(cls, icon, name, pct, big, left, right, at) {
  return prowWrap(cls, at, '<div class="cyp-prow__head"><span class="cyp-disc cyp-disc--sm">' + ic(icon) + '</span><span class="cyp-prow__name">' + name + '</span><span class="cyp-prow__pct">' + big + '</span>' + (at ? goIc() : '') + '</div><span class="cyp-bar"><i style="width:' + Math.max(0, Math.min(100, Math.round(pct))) + '%"></i></span><div class="cyp-prow__figs"><span>' + left + '</span><span>' + right + '</span></div>');
}
/* a row with no target: the value in the place of the percentage, no bar (a bar always means progress to a target) */
function prowCount(cls, icon, name, value, under, at) {
  return prowWrap('cyp-prow--count ' + cls, at, '<div class="cyp-prow__head"><span class="cyp-disc cyp-disc--sm">' + ic(icon) + '</span><span class="cyp-prow__name">' + name + '</span><span class="cyp-prow__pct">' + value + '</span>' + (at ? goIc() : '') + '</div><div class="cyp-prow__figs"><span>' + under + '</span></div>');
}
/* the place that is open, in its colour, with one percentage (ResultBand) */
function placeBand(c, pct, words) {
  return card('<div class="cyp-result ' + placeClass(c.id) + '"><div class="cyp-result__text band"><span class="cyp-disc">' + ic('pin') + '</span><span class="heading-2">' + esc(shown(c.name)) + '</span></div><div class="cyp-result__block"><div><span class="figure">' + pct + '%</span><small>' + words + '</small></div></div></div>', 'data-band');
}
SCREENS.overview = function () {
  var db = view(), cs = canteens(db), stats = {}, wide = WIDE.matches, sec = S.ovSec || 'plates';
  /* the cover: the title, the week, one button to start */
  if (!S.ovOn) return '<div class="cyp-ground cover"><h1 class="cover-title cyp-cover__title">Overview</h1><p class="heading-2 period">Week of ' + dmy(S.week) + '</p>' + btn('Start', 'data-a="ovStart"', '', 'next') + '</div>' +
    '<p class="small muted center">CYP EAT ' + EAT_VERSION + '</p>';
  var sel = cs.some(function (c) { return c.id === S.ovC; }) ? S.ovC : '', selC = sel ? eatCentre(db, sel) : null, who = selC ? shown(selC.name) : 'all centres';
  function dim(c) { return sel && c.id !== sel ? ' cyp-dim' : ''; }
  cs.forEach(function (c) { stats[c.id] = weekStats(db, c.id); });
  var tot = 0, fd = 0, fdays = 0, per = {}, skipped = [];
  cs.forEach(function (c) { var s = stats[c.id], p = 0; c.meals.forEach(function (m) { p += s.meals[m].plates; }); per[c.id] = p; tot += p; fd += s.foodDone; fdays += s.foodDays; if (s.skipped) skipped.push(shown(c.name) + ' ' + s.skipped); });
  var notes = eatNotes(db, S.week, eatAddDays(S.week, 6)), gaps = eatNoteGaps(db), mine = sel ? notes.filter(function (n) { return eatNoteHas(n, sel); }) : notes;
  function pc(a, b) { return b ? Math.round(a / b * 100) : 0; }
  /* the main numbers first: the one of the chapter on a phone, the three on a computer */
  var tile = {
    plates: stat('Plates', sel ? per[sel] : tot, 'this week, ' + esc(who)),
    food: stat('Food counted', sel ? stats[sel].foodDone : fd, 'of ' + plural(sel ? stats[sel].foodDays : fdays, 'day', 'days') + ', ' + esc(who)),
    store: stat('Delivery notes', mine.length, 'this week, ' + esc(who))
  };
  var tiles = '<div class="cyp-tiles">' + (wide ? tile.plates + tile.food + tile.store : tile[sec]) + '</div>', body = '';
  if (sec === 'plates') {
    if (selC) body += placeBand(selC, pc(per[sel], tot), 'of the plates');
    /* the share of each centre in the plates of the week (DonutChart), in the fixed order and colours of the places */
    var off = 0, ring = '', leg = '', aria = [];
    cs.forEach(function (c) {
      var sh = tot ? Math.round(per[c.id] / tot * 1000) / 10 : 0;
      if (sh) ring += '<circle class="' + placeClass(c.id) + dim(c) + '" cx="120" cy="120" r="98" pathLength="100" stroke-dasharray="' + sh + ' ' + Math.round((100 - sh) * 10) / 10 + '" stroke-dashoffset="' + (off ? -off : 0) + '"/>';
      off = Math.round((off + sh) * 10) / 10;
      leg += '<li class="' + placeClass(c.id) + dim(c) + '"><i class="cyp-swatch"></i><span class="label-caps">' + esc(shown(c.name)) + '</span><b>' + nf(per[c.id]) + (tot ? ' · ' + Math.round(sh) + '%' : '') + '</b></li>'; aria.push(shown(c.name) + ' ' + Math.round(sh) + '%');
    });
    body += card('<div class="cyp-donut">' + (tot ? '<svg viewBox="0 0 240 240" role="img" aria-label="Plates by centre: ' + esc(aria.join(', ')) + '">' + ring + '</svg>' : '') + '<div><h3 class="heading-2">Plates by centre</h3><ul class="cyp-legend">' + leg + '</ul></div></div>', 'data-donut');
    /* the plates of each meal: one row for each centre with Open; the meals of the centre that is open; a table on a computer */
    var prow2 = [], go2 = [], rows = '';
    function mealTxt(x) { return (x.fixed != null ? (x.days ? Math.round(x.plates / x.days) : x.fixed) + ' a day · ' + (x.planned ? 'from the plan' : 'fixed') + ', not counted' : (x.days ? Math.round(x.plates / x.days) + ' a day · ' + x.plates + ' in ' + plural(x.days, 'day', 'days') : 'No count')) + (x.skip ? ' · not counted on ' + plural(x.skip, 'day', 'days') : ''); }
    cs.forEach(function (c) {
      var s = stats[c.id];
      c.meals.forEach(function (m) { var x = s.meals[m]; go2.push(openAt(c)); prow2.push([esc(shown(c.name)), m, x.days ? Math.round(x.plates / x.days) : (x.fixed != null ? x.fixed : '–'), x.fixed != null || x.days ? nf(x.plates) : '–', x.fixed != null ? (x.planned ? 'from the plan' : 'fixed') + ', not counted' : x.days + (x.skip ? ' (' + x.skip + ' not counted)' : '')]); });
      /* the plates cooked here for other places, from the plans of the week (nobody counts them here) */
      var ck = Object.keys(s.others).map(function (k) { return { name: k, n: s.others[k] }; }), ckTxt = ck.map(function (x) { return 'For ' + esc(x.name) + ': ' + x.n + ' this week · in the plan, not counted'; });
      ck.forEach(function (x) { go2.push(openAt(c)); prow2.push([esc(shown(c.name)), 'For ' + esc(x.name), '–', nf(x.n), 'in the plan, not counted']); });
      if (!sel) rows += linkRow('', esc(shown(c.name)), c.meals.map(function (m) { return m + ': ' + mealTxt(s.meals[m]); }).concat(ckTxt).join(' · '), openAt(c));
      else if (c.id === sel) rows = c.meals.map(function (m) { return row('', m, mealTxt(s.meals[m])); }).join('') + ck.map(function (x, j) { return row('', 'For ' + esc(x.name), ckTxt[j].split(': ')[1]); }).join('');
    });
    body += h2(sel ? 'Meals' : 'Centres') + list(rows) + (wide && !sel ? card(table([['Centre'], ['Meal'], ['A day', 1], ['Week', 1], ['Days counted', 1]], prow2, null, { go: go2, dense: true })) : '');
  }
  if (sec === 'food') {
    if (selC) body += placeBand(selC, pc(stats[sel].foodDone, stats[sel].foodDays), 'of the days');
    /* the days with a daily food count, against the days of the week so far: ProgressRow on a phone, ProgressTable on a computer */
    var note = skipped.length ? small('Days marked as not counted: ' + esc(skipped.join(', ')) + '.') : '';
    body += wide ? card(progTable('food', 'Food counted', 'days with a daily count, this week', ['Progress', 'Counted', 'Days'],
        cs.map(function (c) { var s = stats[c.id]; return progRow(c, pc(s.foodDone, s.foodDays), pc(s.foodDone, s.foodDays) + '%', s.foodDone, s.foodDays, dim(c)); }).join(''),
        ['Total', pc(fd, fdays) + '%', fd, fdays]) + note, 'data-prog')
      : card(h3('Food counted') + small('Days with a daily count, this week') +
        cs.map(function (c) { var s = stats[c.id]; return prow(placeClass(c.id) + dim(c), 'pin', esc(shown(c.name)), pc(s.foodDone, s.foodDays), pc(s.foodDone, s.foodDays) + '%', plural(s.foodDone, 'day', 'days') + ' counted', 'of ' + s.foodDays, c.id === sel ? '' : openAt(c)); }).join('') + note, 'data-prog');
    /* the food a plate of one item, centre by centre: the bar compares the centres */
    var it = eatItem(db, S.item) || db.items[0];
    var vals = cs.map(function (c) { var s = stats[c.id]; return s.base[it.id] ? s.use[it.id] / s.base[it.id] : null; });
    var sumU = 0, sumB = 0;
    cs.forEach(function (c) { var s = stats[c.id]; if (s.base[it.id]) { sumU += s.use[it.id]; sumB += s.base[it.id]; } });
    var per1 = function (v) { return v == null ? '–' : (it.use === 'kg' ? Math.round(v * 1000) : fmt(v)); }, u1 = it.use === 'kg' ? 'g' : esc(it.use);
    var pick = selectField('Food a plate', 'ovit', db.items.map(function (x) { return [x.id, x.name]; }), it.id, 'itemSel');
    body += wide ? card(pick + small(esc(it.name) + ': ' + u1 + ' a plate, this week. No target set.') + table([['Centre'], ['A plate (' + u1 + ')', 1], ['Plates', 1]],
        cs.map(function (c, i) { var s = stats[c.id]; return [esc(shown(c.name)), per1(vals[i]), s.base[it.id] ? nf(s.base[it.id]) : '–']; }),
        ['All centres', per1(sumB ? sumU / sumB : null), sumB ? nf(sumB) : '–'], { go: cs.map(function (c) { return c.id === sel ? '' : openAt(c); }) }), 'data-food')
      : card(pick + small(esc(it.name) + ': ' + u1 + ' a plate, this week') +
        cs.map(function (c, i) { var s = stats[c.id]; return prowCount(placeClass(c.id) + dim(c), 'pin', esc(shown(c.name)), vals[i] == null ? '–' : per1(vals[i]) + ' ' + u1, (s.base[it.id] ? 'a plate over ' + nf(s.base[it.id]) + ' plates' : 'no count') + ', no target set', c.id === sel ? '' : openAt(c)); }).join('') +
        small('All centres: ' + (sumB ? per1(sumU / sumB) + ' ' + u1 + ' a plate, ' + nf(sumB) + ' plates' : 'no count')), 'data-food');
    body += planCard(db, cs, sel, wide);
  }
  if (sec === 'store') {
    body += h2('Delivery notes') + list(places(db).filter(function (c) { return !sel || c.id === sel; }).map(function (c) {
      var t2 = {}, n = 0; notes.forEach(function (x) { if (!eatNoteHas(x, c.id)) return; n++; var xq = eatNoteQ(x, c.id); for (var k in xq) t2[k] = (t2[k] || 0) + xq[k]; });
      return row('truck', esc(shown(c.name)), n ? plural(n, 'note', 'notes') + ' · ' + esc(noteItems(db, t2)) : 'Nothing');
    }).join('')) + (gaps.length ? banner('danger', 'Numbers not saved: ' + gapsText(gaps)) : '') + btn('Open the delivery notes', 'data-a="go" data-to="deliveries"') +
      h2('In the store: expected and counted') + '<div class="cyp-note"><p>The store and the cold room together. Start of the week + delivered − cooked (from the daily counts) = expected. Next to it, the count at the end of the week. A difference is food that is not explained.</p></div>' +
      (sel ? checkCard(db, sel, wide) : list(cs.map(function (c) { var k = checkSummary(db, c.id); return linkRow('box', esc(shown(c.name)), k[1], openAt(c), k[0]); }).join('')));
  }
  var i = OVSECS.map(function (x) { return x[0]; }).indexOf(sec), next = OVSECS[i + 1];
  return title(OVSECS[i][1]) + weekBar() +
    selectField('Centre', 'ovc', [['', 'All centres']].concat(cs.map(function (c) { return [c.id, shown(c.name)]; })), sel, 'ovCentreSel') +
    '<div class="ovsec' + (S.anim ? ' cyp-enter-' + S.anim + ' cyp-enter' : '') + '" data-sec="' + sec + '">' + tiles + body + (sel ? btn('All centres', 'data-a="ovAll"', '', 'back') : '') + '</div>' +
    '<div class="two">' + btn('Back', 'data-a="ovBack"', '', 'back') + (next ? '<button class="cyp-btn cyp-btn--primary" data-a="ovSec" data-s="' + next[0] + '">Next: ' + next[1] + ic('next') + '</button>' : '') + '</div>' +
    btn('Export all data in Excel', 'data-a="export"', '', 'down') + '<p class="small muted center">CYP EAT ' + EAT_VERSION + (S.lastSync ? ' · updated ' + new Date(S.lastSync).toTimeString().slice(0, 5) : '') + '</p>';
};
/* the store of one centre in one line: what is missing, or that the count is as expected, or not done yet */
function checkSummary(db, c) {
  var w = eatWeekCheck(db, c, S.week, todayStr()), miss = 0, same = 0, any = 0;
  db.items.forEach(function (it) { var x = w.items[it.id]; if (!x || (!x.start && !x.inn && !x.used && !x.counted)) return; any++; if (x.diff != null && x.diff < 0) miss++; if (x.diff === 0) same++; });
  return [miss ? tag('danger', plural(miss, 'item', 'items') + ' missing') : (!w.endDate ? tag('', 'End: not counted yet') : (any && same === any ? tag('ok', 'As expected') : tag('', 'Counted'))),
    'Daily food counted on ' + w.daysFood + ' of ' + plural(w.days, 'day', 'days')];
}
/* the store of one centre in the week shown: start + delivered − cooked = expected, next to the count at the end of the week */
function checkCard(db, c, wide) {
  var w = eatWeekCheck(db, c, S.week, todayStr()), rows = '', trs = [], miss = 0, sure = w.daysFood >= w.days;
  db.items.forEach(function (it) {
    var x = w.items[it.id]; if (!x || (!x.start && !x.inn && !x.used && !x.counted)) return;
    var pill = '', why = '';
    if (x.expected != null && x.expected < 0 && x.counted == null) pill = tag('warn', 'More cooked than came in');
    else if (x.counted === undefined) pill = x.expected == null ? '' : tag('', 'Expected now: ' + esc(qtyUnit(x.expected, it.unit)));
    else if (x.counted === null) pill = tag('', 'Not counted');
    else if (x.diff == null) pill = tag('', 'Counted: ' + esc(qtyUnit(x.counted, it.unit)));
    else if (x.diff === 0) pill = tag('ok', 'As expected');
    /* beta 1.12: in colour only above the margin; "missing" only when every day has its daily count */
    else if (x.diff < 0 && !eatShortBig(x)) pill = tag('', esc(qtyUnit(-x.diff, it.unit)) + ' less');
    else if (x.diff < 0) { pill = tag(sure ? 'danger' : 'warn', esc(qtyUnit(-x.diff, it.unit)) + (sure ? ' missing' : ' short')); miss++; }
    else pill = tag('', esc(qtyUnit(x.diff, it.unit)) + ' more');
    if (x.expected == null) why = x.start == null ? 'there is no count before this week' : (it.unit !== it.use && !it.per ? 'set how much is in one ' + unitOne(it.unit) + ' (Settings, Food and units)' : 'a daily count is not complete');
    var sum = 'Start ' + (x.start == null ? '?' : fmt(x.start)) + ' + delivered ' + fmt(x.inn) + ' − cooked ' + fmt(x.used) + ' = expected <strong>' + (x.expected == null ? '?' : fmt(x.expected)) + '</strong>' + (x.counted === undefined ? '' : (x.counted === null ? ' · not counted at the end' : ' · counted <strong>' + fmt(x.counted) + '</strong>'));
    rows += row('', esc(it.name) + ' (' + esc(it.unit) + ')', sum + (why ? ' · Expected not known: ' + why + '.' : ''), '', pill);
    trs.push([esc(it.name), esc(it.unit), x.start == null ? '?' : fmt(x.start), fmt(x.inn), fmt(x.used), x.expected == null ? '?' : fmt(x.expected), x.counted === undefined ? 'Not yet' : (x.counted === null ? 'Not counted' : fmt(x.counted)), (x.diff == null ? '' : fmt(x.diff) + ' ') + pill + (why ? '<br>Expected not known: ' + why + '.' : '')]);
  });
  var head = small((w.startCounted ? 'Start: counted ' + dayName(w.startDate) : (w.startDate ? 'Start: the stock on Monday morning, from the count of ' + dayName(w.startDate) : 'Start: no count before this week')) + '. ' +
    (w.endDate ? 'End: counted ' + dayName(w.endDate) : 'End: not counted yet') + '. Daily food counted on ' + w.daysFood + ' of ' + plural(w.days, 'day', 'days') + (w.daysSkipped ? ' (' + w.daysSkipped + ' marked not counted)' : '') + '.');
  var warn = miss && w.daysFood < w.days ? '<div class="cyp-note cyp-note--warn"><b>Check the days without a daily count first</b><p>Food cooked on a day without a daily count is not in "cooked", so it shows as short. Check those days first.</p></div>' : '';
  return '<div class="cyp-card cyp-card--stack" data-check="' + c + '">' + h3(esc(centreName(c))) + head +
    (rows ? (wide ? table([['Item'], ['Unit'], ['Start', 1], ['Delivered', 1], ['Cooked', 1], ['Expected', 1], ['Counted', 1], ['Difference', 1]], trs, null, { dense: true }) : list(rows)) : '<p class="muted">Nothing yet.</p>') + warn + '</div>';
}
/* settings: the counts of one day at one centre are taken out (a day counted to try the app, or counted on the wrong day).
   What is saved on that day is shown first; the overview ticks what goes and confirms in a window. The delivery notes are never touched. */
var RMG = [
  ['people', 'Plates and kitchen staff', ['people', 'staff'], 'people'],
  ['menu', 'Menu', ['dmenu', 'menu'], 'food'],
  ['before', 'Quantities', ['dbefore', 'before'], 'scale'],
  ['after', 'Leftovers', ['dafter', 'after'], 'box'],
  ['skip', 'Steps marked as not done', ['dskip', 'skip'], 'food'],
  ['stock', 'Stock count', ['endweek', 'startweek', 'received'], 'week']
];
function rmOn(id) { var v = (S.f.rt || {})[id]; return v == null ? id !== 'stock' : !!v; }
function rmFound(db, c, d) {
  return RMG.map(function (g) { return { id: g[0], name: g[1], types: g[2], icon: g[3], es: db.entries.filter(function (e) { return !e.del && e.centre === c && e.date === d && g[2].indexOf(e.type) >= 0; }) }; }).filter(function (g) { return g.es.length; });
}
function rmLine(g) {
  var by = []; g.es.forEach(function (e) { if (e.byName && by.indexOf(e.byName) < 0) by.push(e.byName); });
  var w = g.id === 'people' ? g.es.map(function (e) { return e.meal + ': ' + (e.data.skip ? 'not counted' : plural(eatPlates(e), 'plate', 'plates')); }).join(', ') : '';
  return esc(w + (w && by.length ? ' · ' : '') + (by.length ? 'Saved by ' + listWords(by) : ''));
}
function rmPicked(db) { return rmFound(db, S.f.rc, S.f.rd).filter(function (g) { return rmOn(g.id); }); }
function removeDayCard(db) {
  var f = S.f, cs = canteens(db), t = todayStr();
  if (!f.rc || !eatCentre(db, f.rc)) f.rc = cs.length ? cs[0].id : ''; if (!f.rd) f.rd = t; f.rt = f.rt || {};
  var found = rmFound(db, f.rc, f.rd), picked = found.filter(function (g) { return rmOn(g.id); });
  return '<div class="cyp-note"><p>For a day counted to try the app, or counted on the wrong day. The delivery notes are not touched.</p></div>' +
    card(selectField('Centre', 'rc', cs.map(function (c) { return [c.id, shown(c.name)]; }), f.rc, 'rmCentre') +
      field('Day', 'rd', '<input id="rd" class="cyp-input" type="date" max="' + t + '" value="' + esc(f.rd) + '" data-a-change="rmDay">')) +
    h2('Saved on ' + dayName(f.rd) + ', ' + esc(centreName(f.rc))) +
    (found.length ? list(found.map(function (g) { return row(g.icon, g.name, rmLine(g)); }).join('')) +
      choice('What to remove', found.map(function (g) { return { l: g.name, on: rmOn(g.id), at: 'data-a="rmPick" data-g="' + g.id + '"' }; }), { many: true, name: 'rmg', cols: 2 }) +
      btn('Remove', 'data-a="rmAsk"' + (picked.length ? '' : ' disabled'), 'danger block')
      : '<p class="muted">Nothing is saved for this centre on this day.</p>');
}
function rmModal() {
  var db = view(), picked = rmPicked(db);
  return sheet('rmt', 'Remove these counts?', '<p class="body-strong">' + esc(centreName(S.f.rc)) + ', ' + dayName(S.f.rd) + '</p>' +
    list(picked.map(function (g) { return row(g.icon, g.name, rmLine(g)); }).join('')) +
    '<div class="cyp-note cyp-note--warn"><p>They leave the app, the overview and the Excel on every phone. This cannot be undone in the app.</p></div>',
    btn('Yes, remove', 'data-a="rmDo"', 'danger block'));
}
/* settings: a menu of sections; each section opens on its own (comment of 20/11: too much on one page) */
var SETSECS = [
  ['users', 'Users', 'Names of the people who count, and their role'],
  ['centres', 'Centres and meals', 'Lunch and dinner of each centre, fixed plates, leftovers, groups'],
  ['food', 'Food and units', 'Kg in a bag, eggs in a tray'],
  ['places', 'Places that receive deliveries', 'Where the delivery notes go'],
  ['pins', 'PINs and link', 'The three PINs, the link for the people who count'],
  ['reader', 'Photo reader', 'Gemini key for the photos of the delivery notes'],
  ['backup', 'Backup', 'A copy of the database every night at 2:00'],
  ['remove', 'Remove the counts of a day', 'A day counted to try the app, or counted on the wrong day'],
  ['comments', 'Comments on the app', ''],
  ['install', 'The app on this computer', 'Put CYP EAT on this phone or computer']
];
function roleChoice(act, cur, name) { return choice('', EAT_ROLES.map(function (r) { return { l: r, on: cur === r, at: 'data-a="' + act + '" data-r="' + r + '"' }; }), { aria: 'Role', name: name }); }
SCREENS.settings = function () {
  var db = view(), names = (db.names || []).filter(function (n) { return n.active; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  var open = (db.comments || []).filter(function (c) { return !c.done; }).length, sec = S.setSec || '';
  if (!sec) return title('Settings') + list(SETSECS.map(function (x) {
    var sub = x[0] === 'comments' ? (open ? plural(open, 'comment', 'comments') + ' to do' : 'Nothing to do') : (x[0] === 'reader' ? (S.reader ? 'On' : 'Not set') + ' · ' + x[2] : x[2]);
    return linkRow('gear', x[1], sub, 'data-a="setSec" data-s="' + x[0] + '"');
  }).join('')) + '<p class="small muted center">CYP EAT ' + EAT_VERSION + '</p>';
  var parts = {
    users: function () {
      return (names.length ? list(names.map(function (n) {
        if (S.f.editId === n.id) return '<div class="cyp-row"><div class="rowform">' + field('Name', 'en', '<input id="en" class="cyp-input" type="text" data-f="en" value="' + esc(S.f.en || '') + '" data-focus>') + roleChoice('nameEditRole', S.f.er, 'er') +
          '<div class="two">' + btn('Cancel', 'data-a="nameEditCancel"') + btn('Save the name', 'data-a="nameEditSave"', 'primary') + '</div>' +
          btn('Remove', 'data-a="nameOff" data-id="' + esc(n.id) + '" aria-label="Remove ' + esc(n.name) + '"', 'danger') + '</div></div>';
        return row('user', esc(n.name), esc(n.role), '<button class="cyp-btn" data-a="nameEdit" data-id="' + esc(n.id) + '" aria-label="Edit ' + esc(n.name) + '">Edit</button>');
      }).join('')) : '<p class="muted">No names yet.</p>') +
        card(h3('Add a name') + field('Name', 'nn', '<input id="nn" class="cyp-input" type="text" data-f="nn" value="' + esc(S.f.nn || '') + '">') + roleChoice('role', S.f.role || 'Volunteer', 'role') + btn('Add the name', 'data-a="nameAdd"', S.f.editId ? '' : 'primary'));
    },
    centres: function () {
      return canteens(db).map(function (c) {
        return card(h3(esc(shown(c.name))) +
          choice('', EAT_MEALS_ON.map(function (m) { return { l: m, on: c.meals.indexOf(m) >= 0, at: 'data-a="cmeal" data-id="' + c.id + '" data-m="' + m + '"' }; }), { many: true, aria: 'Meals at ' + shown(c.name) }) +
          c.meals.filter(function (m) { return EAT_MEALS_ON.indexOf(m) >= 0; }).map(function (m) {
            var k = 'fx_' + c.id + '_' + m, fx = c.fixed && c.fixed[m] ? c.fixed[m] : '', val = S.f[k] != null ? S.f[k] : fx;
            return '<div class="cyp-field"><label for="' + k + '">' + m + ': ' + (fx ? 'always ' + fx + ' plates, not counted' : 'counted by tapping') + '</label><div class="inl"><input id="' + k + '" class="cyp-input num" type="text" inputmode="numeric" aria-label="' + m + ' at ' + esc(shown(c.name)) + ': fixed number of plates, empty when counted" data-f="' + k + '" value="' + esc(String(val)) + '">' + btn('Save', 'data-a="fixSave" data-id="' + c.id + '" data-m="' + m + '"') + '</div></div>';
          }).join('') +
          small('A number: the meal always has that many plates and nobody counts it. Empty: counted by tapping.') +
          choice('', [{ l: 'Leftovers at the end of the day: ' + (c.left ? 'counted' : 'not counted'), on: !!c.left, at: 'data-a="cleft" data-id="' + c.id + '"' }], { many: true, aria: 'Leftovers' }) +
          (c.meals.indexOf('Dinner') >= 0 ? choice('', [{ l: 'Dinner is cooked with the leftovers of lunch', on: eatDinLeft(db, c.id), at: 'data-a="cdinleft" data-id="' + c.id + '"' }], { many: true, aria: 'Dinner at ' + shown(c.name) }) +
            small('Then the leftovers are written after lunch, and the dinner plates are not in the food a plate.') : '') +
          ((c.groups || []).length ? small('Also eat here (counted apart):') + list(c.groups.map(function (g) { return row('', esc(g), '', '<button class="cyp-btn cyp-btn--danger" data-a="grpOff" data-id="' + c.id + '" data-g="' + esc(g) + '" aria-label="Remove ' + esc(g) + '">Remove</button>'); }).join('')) : small('Also eat here (counted apart): nobody')) +
          '<div class="cyp-field"><label for="grp_' + c.id + '">A group that eats at ' + esc(shown(c.name)) + '</label><div class="inl"><input id="grp_' + c.id + '" class="cyp-input" type="text" data-f="grp_' + c.id + '" value="' + esc(S.f['grp_' + c.id] || '') + '">' + btn('Add', 'data-a="grpAdd" data-id="' + c.id + '"') + '</div></div>');
      }).join('');
    },
    food: function () {
      return card(h3('How each food is counted in the store') + small('In its own unit (kg, chicken, egg), or by the bag, tray, can, pack or piece. For those, write how much is in one. Leftovers are written in portions: empty = the size of a portion comes from the plan of the week (a chicken: 10 portions).') + db.items.map(function (it) {
        var un = S.f['un_' + it.id] || it.unit, pack = un !== it.use, per = S.f['pe_' + it.id] != null ? S.f['pe_' + it.id] : (it.unit === un && it.per ? it.per : '');
        return '<div class="qrow rowform">' + field(esc(it.name) + ': counted in', 'un_' + it.id, '<select id="un_' + it.id + '" class="cyp-input" data-a-change="unitSel" data-id="' + it.id + '">' + [it.use].concat(EAT_PACKS.filter(function (u) { return u !== it.use && (u !== 'pieces' || it.use === 'kg'); })).map(function (u) { return '<option value="' + u + '"' + (u === un ? ' selected' : '') + '>' + esc(unitOne(u)) + '</option>'; }).join('') + '</select>') +
          (pack ? field('1 ' + esc(unitOne(un)) + ' = (' + esc(it.use) + ')', 'pe_' + it.id, '<input id="pe_' + it.id + '" class="cyp-input num" type="text" inputmode="decimal" value="' + esc(String(per)) + '" data-f="pe_' + it.id + '">') : '') +
          field('1 portion = (' + esc(it.use) + ')', 'po_' + it.id, '<input id="po_' + it.id + '" class="cyp-input num" type="text" inputmode="decimal" placeholder="' + (it.id === 'chk' ? '0.1' : 'from the plan') + '" value="' + esc(String(S.f['po_' + it.id] != null ? S.f['po_' + it.id] : (it.portion > 0 ? it.portion : ''))) + '" data-f="po_' + it.id + '">') + '</div>';
      }).join('') + btn('Save the units', 'data-a="saveUnits"', 'primary block'));
    },
    places: function () { return placesCard(db); },
    pins: function () {
      return card(h3('PINs') + btn('Change the data entry PIN', 'data-a="pinChange" data-w="entry"') + btn('Change the overview PIN', 'data-a="pinChange" data-w="admin"') + btn(db.settings && db.settings.delivery ? 'Change the deliveries PIN' : 'Set the deliveries PIN', 'data-a="pinChange" data-w="delivery"') + small('Deliveries: the person who brings the food takes a photo of each delivery note.')) +
        card(h3('Link for the people who count') + btn('Copy the link', 'data-a="copyLink"') + small('Send the link and, in another message, the data entry PIN.'));
    },
    reader: function () { return readerCard(); },
    backup: function () {
      var b = S.backup || {};
      return card('<p>' + (b.on ? tag('ok', 'On') : tag('warn', 'Not started')) + ' A copy of the database is saved every night at about 2:00, Ndola time, in the Drive folder "CYP EAT backups".</p>' +
        '<p class="body-strong">' + (b.last ? 'Last backup: ' + esc(localTime(b.last)) : 'No backup yet.') + '</p>' +
        small('The photos of the delivery notes are already files on Drive. A copy is also saved at the first change of each day.'));
    },
    remove: function () { return removeDayCard(db); },
    comments: function () { return commentsCard(db); },
    install: function () { return installCard(); }
  };
  var head = SETSECS.filter(function (x) { return x[0] === sec; })[0];
  return '<button class="cyp-btn start bk" data-a="setSec" data-s="">' + ic('back') + 'Settings</button>' + title(head ? head[1] : 'Settings') + (parts[sec] ? parts[sec]() : '');
};

/* ---------- comment and PIN windows: sheets ---------- */
function commentModal() {
  return sheet('cmt', 'Comment', field('Your comment', 'ct', '<textarea id="ct" class="cyp-input" data-f="ct" data-focus>' + esc(S.f.ct || '') + '</textarea>') +
    (S.sess && S.sess.mode === 'admin' ? field('Your name', 'cn', '<input id="cn" class="cyp-input" data-f="cn" value="' + esc(S.f.cn || KV.get('cname', '')) + '">') : ''),
    btn('Save the comment', 'data-a="commentSave"', 'primary block'));
}
function pinModal() {
  return sheet('pt', { entry: 'New data entry PIN', admin: 'New overview PIN', delivery: 'Deliveries PIN' }[S.f.which],
    field('New PIN (4 numbers)', 'np1', '<input id="np1" class="cyp-input" type="password" inputmode="numeric" maxlength="4" autocomplete="off" data-f="np1" value="' + esc(S.f.np1 || '') + '" data-focus>') +
    field('New PIN again', 'np2', '<input id="np2" class="cyp-input" type="password" inputmode="numeric" maxlength="4" autocomplete="off" data-f="np2" value="' + esc(S.f.np2 || '') + '">') +
    (S.msg ? banner('danger', esc(S.msg), 'alert') : ''),
    btn('Save', 'data-a="pinSave"', 'primary block'));
}
