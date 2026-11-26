/* beta 1.11 (Mauro, 26/11: "overview è orribile ... dovrebbe essere già tutto visibile"; "deve rispondere a quello che l'overview vuole vedere: se le mense
   stanno facendo un buon lavoro, come sta andando la gestione, se il cibo sparisce, quanto"). One page, no cover and no chapters: the canteens with a verdict,
   what to check, the food of the week (delivered, plan, taken out, a portion, the fridge), the portions, the last four weeks. A canteen opens its days. */
var DAYST = { done: ['Done', 'Menu, quantities, portions and leftovers written'], part: ['Part', 'Something not written'], none: ['Nothing', 'Nothing written'], skip: ['Not counted', 'Marked as not counted'], absent: ['Nobody there', 'Nobody of the team at the centre'], today: ['Today', 'Today, not finished yet'], future: ['', 'Still to come'] };
function dayDots(a) {
  return '<span class="dgrid" role="img" aria-label="' + esc(a.days.map(function (x) { return WD[eatWeekday(x.date)] + ' ' + (DAYST[x.st][0] || 'to come'); }).join(', ')) + '">' +
    a.days.map(function (x) { return '<i class="dg dg--' + x.st + '" title="' + esc(dayName(x.date) + ': ' + DAYST[x.st][1]) + '">' + WD[eatWeekday(x.date)].slice(0, 1) + '</i>'; }).join('') + '</span>';
}
/* beta 1.12 (Mauro, 26/11: "there is always the warning, there's too much alarm"): red and yellow only for what the numbers say (food short in the
   fridge, portions not accounted, above the margin); what is not written yet is grey */
var VERDICT = { danger: ['danger', 'Food missing'], warn: ['warn', 'To check'], ok: ['ok', 'Good'], part: ['', 'Not complete'], none: ['', 'Nothing written'] };
function verdictTag(a) { var v = VERDICT[a.verdict] || VERDICT.none; return tag(v[0], v[1]); }
function shortTag(a) { return tag(a.sure ? 'danger' : 'warn', plural(a.missing.length, 'food', 'foods') + ' short'); }
function useWords(it, v) { return v == null ? '–' : (it.use === 'kg' ? Math.round(v * 1000) + ' g' : fmt(Math.round(v * 100) / 100) + ' ' + esc(it.use)); }
/* what to check: only what the numbers say, most serious first. Food short in the fridge (missing when every day has its daily count), then the portions
   cooked and not accounted for. Differences inside the margin are not listed */
function accChecks(db, cs, accs) {
  var out = [];
  cs.forEach(function (c, i) {
    var a = accs[i], nm = esc(shown(c.name));
    a.missing.forEach(function (m) { var it = eatItem(db, m.id); out.push([a.sure ? 0 : 1, c, nm + ': ' + esc(qtyUnit(m.n, m.unit)) + (m.unit.toLowerCase().indexOf(it.name.toLowerCase().slice(0, 4)) === 0 ? '' : ' of ' + esc(it.name.toLowerCase())) + (a.sure ? ' missing' : ' short') + ' in the fridge count of ' + dayName(a.fridge) + (m.portions ? ', about ' + plural(m.portions, 'portion', 'portions') : '') + (m.about ? ' (counted "about")' : '') + '.' + (a.sure ? '' : ' Daily food counted on ' + a.storeDaysFood + ' of ' + plural(a.storeDays, 'day', 'days') + ': food cooked on the other days is part of it.')]); });
    if (a.unaccBig && a.unacc > 0) out.push([1, c, nm + ': ' + plural(a.unacc, 'portion', 'portions') + ' cooked and not accounted for (not eaten, not left) on ' + plural(a.unaccDays, 'day', 'days') + '.']);
    if (a.unaccBig && a.unacc < 0) out.push([1, c, nm + ': ' + plural(-a.unacc, 'portion', 'portions') + ' more eaten and left than cooked: the portions cooked or counted are not right.']);
  });
  return out.sort(function (x, y) { return x[0] - y[0]; });
}
/* what is not written yet, one line for each canteen, in grey: it is not a finding */
function accGaps(a) {
  var out = [], bad = a.days.filter(function (x) { return (x.st === 'none' || x.st === 'part') && x.date < todayStr(); });
  if (bad.length) out.push(plural(bad.length, 'day', 'days') + ' not complete (' + bad.map(function (x) { return WD[eatWeekday(x.date)]; }).join(', ') + ')');
  if (!a.plan) out.push('menu of the week');
  if (!a.fridge) out.push(a.ended ? 'fridge count' : 'fridge count (not yet this week)');
  if (a.staffMiss) out.push('kitchen staff who ate on ' + plural(a.staffMiss, 'day', 'days'));
  return out;
}
SCREENS.overview = function () {
  var db = view(), cs = canteens(db), wide = WIDE.matches, t = todayStr(), mon = S.week;
  var accs = cs.map(function (c) { return eatAccount(db, c.id, mon, t); });
  var sel = cs.some(function (c) { return c.id === S.ovC; }) ? S.ovC : '';
  var tot = { eaten: 0, plan: 0, past: 0, done: 0, miss: 0, missP: 0, notes: 0, unacc: 0 };
  accs.forEach(function (a) { tot.eaten += a.eaten; tot.plan += a.planP; tot.past += a.past; tot.done += a.done; tot.miss += a.missing.length; tot.unacc += a.unacc; a.missing.forEach(function (m) { tot.missP += m.portions || 0; }); tot.notes += a.notes; if (a.fridge) tot.fridges = (tot.fridges || 0) + 1; });
  var notes = eatNotes(db, mon, eatAddDays(mon, 6)), gaps = eatNoteGaps(db);
  var out = title('Overview') + weekBar();
  /* the four numbers of the week */
  out += '<div class="cyp-tiles ovtiles">' +
    stat('Portions eaten', tot.eaten, tot.plan ? 'menu of the week: ' + nf(tot.plan) + ' on the same days' : 'counted this week') +
    stat('Days complete', tot.done, 'of ' + plural(tot.past, 'day', 'days') + ' so far, all canteens') +
    stat('Short in the fridge', tot.miss, tot.miss ? plural(tot.miss, 'food', 'foods').replace(/^\d+ /, '') + ' above the margin' + (tot.missP ? ', about ' + nf(tot.missP) + ' portions' : '') : (tot.fridges ? 'in ' + plural(tot.fridges, 'fridge count', 'fridge counts') + ' of ' + cs.length + ' canteens' : 'no fridge counted yet this week')) +
    stat('Delivery notes', notes.length, gaps.length ? 'numbers not saved: ' + esc(gapsText(gaps)) : 'this week') + '</div>';
  /* the canteens: a verdict, the days, the portions, the fridge */
  var rows = [], go = [], cards = '';
  cs.forEach(function (c, i) {
    var a = accs[i], nm = '<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>';
    var por = a.eatenDays ? nf(a.eaten) + (a.planP ? ' of ' + nf(a.planP) : '') : '–', una = a.cookedDays ? (a.unacc ? (a.unaccBig ? tag('warn', sg(a.unacc)) : sg(a.unacc)) : '0') : '–';
    var fr = a.fridge ? (a.missing.length ? shortTag(a) : tag('ok', WD[eatWeekday(a.fridge)])) : (a.ended ? 'Not counted' : 'Not yet');
    rows.push([nm, verdictTag(a), dayDots(a), a.done + ' of ' + a.past, por, una, a.plan ? 'Yes' : 'No', fr]); go.push(openAt(c));
    cards += '<a href="#" class="cyp-card cyp-card--stack ovc ' + placeClass(c.id) + '" ' + openAt(c) + '><span class="ovc__head">' + nm + verdictTag(a) + goIc() + '</span>' + dayDots(a) +
      '<dl class="cyp-kv"><div><dt>Days complete</dt><dd>' + a.done + ' of ' + a.past + '</dd></div><div><dt>Portions eaten</dt><dd>' + por + '</dd></div><div><dt>Not accounted</dt><dd>' + una + '</dd></div><div><dt>Fridge</dt><dd>' + fr + '</dd></div></dl></a>';
  });
  out += h2('Canteens this week') + (wide ? card(table([['Canteen'], ['Verdict'], ['Days (Mon to Sun)'], ['Complete', 1], ['Portions eaten', 1], ['Not accounted', 1], ['Menu of the week'], ['Fridge']], rows, null, { go: go })) : cards) +
    small('<i class="dg dg--done"></i> complete · <i class="dg dg--part"></i> part written · <i class="dg dg--none"></i> nothing written · <i class="dg dg--absent"></i> nobody there or not counted. Portions eaten: counted + dinner and other places of the menu of the week + kitchen staff, against the menu of the week on the same days. Not accounted: cooked − eaten − left. In colour only above the margin: food short in the fridge over 10% of what passed through the store (20% when counted "about"), portions not accounted over 5% of the portions cooked.');
  /* what to check: the findings; then, in grey, what is not written yet */
  var ck = accChecks(db, cs, accs);
  var byC = cs.map(function (c) { return ck.filter(function (x) { return x[1].id === c.id; }); });
  out += h2('To check') + (ck.length ? list(cs.map(function (c, i) {
    var xs = byC[i]; if (!xs.length) return '';
    var tg = xs[0][0] === 0 ? tag('danger', 'Food missing') : tag('warn', 'Check');
    return row('', '<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>', '<ul class="ovck">' + xs.map(function (x) { return '<li class="ovck--' + x[0] + '">' + x[2].replace(esc(shown(c.name)) + ': ', '').replace(esc(shown(c.name)) + ', ', '') + '</li>'; }).join('') + '</ul>', '', tg);
  }).join('')) : '<p class="muted" data-nock>Nothing to check in what is written so far.</p>');
  var gapRows = cs.map(function (c, i) { var g = accGaps(accs[i]); return g.length ? row('', '<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>', esc(g.join(' · '))) : ''; }).join('');
  if (gapRows) out += h2('Not written yet') + '<div data-gaps>' + list(gapRows) + '</div>' + small('Not a finding: without these the canteen cannot be judged. Food taken out on a day not written is not explained.');
  /* the food of the week, canteen by canteen: what came in, what the menu asked, what was taken out, a portion, the fridge */
  var frows = [], fgo = [], fphone = '';
  cs.forEach(function (c, i) {
    var a = accs[i], lines = '';
    db.items.forEach(function (it) {
      var f = a.food[it.id]; if (!f || (!f.inn && !f.plan && !f.out && f.counted == null)) return;
      var fr = f.counted === undefined ? (f.expected != null ? 'expected ' + fmt(f.expected) : '–') : (f.counted === null ? 'not counted' : (f.expected == null ? 'counted ' + fmt(f.counted) : fmt(f.expected) + ' → ' + fmt(f.counted) + (f.about ? ' (about)' : '')));
      var df = f.diff == null ? '' : (f.diff < 0 ? (f.big ? tag(a.sure ? 'danger' : 'warn', fmt(f.diff)) : fmt(f.diff)) : (f.diff > 0 ? '+' + fmt(f.diff) : tag('ok', '0')));
      frows.push([lines ? '' : '<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>', esc(it.name) + ' (' + esc(it.unit) + ')', f.inn ? fmt(f.inn) : '–', f.planDays ? fmt(f.plan) : '–', f.outDays ? fmt(f.out) : '–', useWords(it, f.per), fr, df]); fgo.push(openAt(c));
      lines += row('', esc(it.name) + ' (' + esc(it.unit) + ')', 'Delivered ' + (f.inn ? fmt(f.inn) : '0') + ' · menu ' + (f.planDays ? fmt(f.plan) : '–') + ' · taken out ' + (f.outDays ? fmt(f.out) : '–') + ' · a portion ' + useWords(it, f.per) + ' · fridge ' + fr, '', df);
    });
    if (lines) fphone += h3('<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>') + list(lines);
  });
  out += h2('Food this week') + small('Delivered: the delivery notes. Menu: the menu of the week, on the days written so far. Taken out: the daily counts. Fridge: start + delivered − cooked = expected, then the count. A minus is food that is not there; it is in colour above the margin.') +
    (frows.length ? (wide ? card(table([['Canteen'], ['Food'], ['Delivered', 1], ['Menu', 1], ['Taken out', 1], ['A portion', 1], ['Fridge'], ['Difference', 1]], frows, null, { go: fgo, dense: true })) : card(fphone)) : '<p class="muted">No food delivered or counted this week.</p>');
  /* a portion, canteen against canteen: the same food should give about the same portion */
  var prow3 = [];
  db.items.forEach(function (it) {
    var v = accs.map(function (a) { var f = a.food[it.id]; return f && f.per != null ? f.per : null; }), got = v.filter(function (x) { return x != null; });
    if (!got.length) return; var avg = got.reduce(function (s, x) { return s + x; }, 0) / got.length;
    prow3.push([esc(it.name)].concat(v.map(function (x) { return x == null ? '–' : (got.length > 1 && x > avg * 1.25 ? tag('warn', useWords(it, x)) : useWords(it, x)); })));
  });
  if (prow3.length) out += h2('A portion, canteen by canteen') + small('The food taken out for one portion this week. In yellow: a quarter or more above the other canteens.') + card(table([['Food']].concat(cs.map(function (c) { return [esc(shown(c.name)), 1]; })), prow3, null, { dense: true }));
  /* the last four weeks */
  var wk = [-21, -14, -7, 0].map(function (o) { return eatAddDays(mon, o); }), trows = [];
  cs.forEach(function (c) {
    trows.push(['<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span>'].concat(wk.map(function (w) {
      if (w > t) return '–'; var a = eatAccount(db, c.id, w, t);
      if (!a.done && !a.part && !a.eaten && !a.fridge) return '<span class="muted">Nothing written' + (a.notes ? ' · ' + plural(a.notes, 'note', 'notes') : '') + '</span>';
      return a.done + '/' + a.past + ' days · ' + nf(a.eaten) + ' portions' + (a.missing.length ? ' · ' + shortTag(a) : (a.fridge ? ' · fridge ok' : ' · no fridge count'));
    })));
  });
  out += h2('Last four weeks') + card(table([['Canteen']].concat(wk.map(function (w) { return ['Week of ' + dmy(w).slice(0, 5)]; })), trows, null, { dense: true }));
  /* one canteen open: its days, the menu of the week against what happened, the fridge */
  if (sel) {
    var si = cs.map(function (c) { return c.id; }).indexOf(sel), a = accs[si], c = cs[si];
    var drows = a.days.map(function (x) { return [dayName(x.date), DAYST[x.st][0] ? (x.st === 'done' ? tag('ok', 'Done') : (x.st === 'none' || x.st === 'part' ? tag('', DAYST[x.st][0]) : DAYST[x.st][0])) : '', x.eaten == null ? '–' : nf(x.eaten), x.plan == null ? '–' : nf(x.plan), x.cooked == null ? '–' : nf(x.cooked) + (x.why ? ' (' + esc(x.why) + ')' : ''), x.left == null ? '–' : nf(x.left), x.unacc == null ? '–' : (x.unacc ? (x.unaccBig ? tag('warn', sg(x.unacc)) : sg(x.unacc)) : '0')]; });
    out += '<div id="ovsel">' + h2('<span class="' + placeClass(c.id) + ' ovname"><i class="cyp-swatch"></i>' + esc(shown(c.name)) + '</span> day by day') +
      card(table([['Day'], ['Written'], ['Eaten', 1], ['Menu of the week', 1], ['Cooked', 1], ['Left', 1], ['Not accounted', 1]], drows, null, { dense: true })) +
      planCard(db, cs, sel, wide) + checkCard(db, sel, wide) + btn('Close ' + esc(shown(c.name)), 'data-a="ovAll"', '', 'x') + '</div>';
  }
  return out + '<div class="two">' + btn('Open the delivery notes', 'data-a="go" data-to="deliveries"', '', 'truck') + btn('Export all data in Excel', 'data-a="export"', '', 'down') + '</div>' +
    '<p class="small muted center">CYP EAT ' + EAT_VERSION + (S.lastSync ? ' · updated ' + new Date(S.lastSync).toTimeString().slice(0, 5) : '') + '</p>';
};
