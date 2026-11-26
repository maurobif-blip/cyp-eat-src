SCREENS.before = function () {
  var db = view(), f = S.f, more = db.items.filter(function (it) { return f.rows.indexOf(it.id) < 0; });
  return backLink() + title('Quantities for today') + dayTitle() + skipNote('before') + '<p>Write the food taken out of the store and the cold room for the meals of today, in kg, bags or trays. A half or a quarter: tap ½ or ¼, or write 0.5 or 0.25.</p>' +
    (othersOf(db, S.sess.centre, S.date).length ? banner('', 'Write all the food taken out today, also the food cooked here for ' + othersWords(db, S.sess.centre, S.date) + '.') : '') +
    cookedCard(db) +
    card(f.rows.length ? foodRowsHtml(f, false) : '<p class="muted">No food on the menu.</p>') +
    (more.length ? card(h3('Add another food') + '<div class="wrap">' + more.map(function (it) { return btn('+ ' + esc(it.name), 'data-a="addRow" data-id="' + it.id + '"'); }).join('') + '</div>') : '') +
    btn(peopleOpen() ? 'Save and count the people' : 'Save', 'data-a="saveBefore"', 'primary block') + skipBtn('before');
};
SCREENS.after = function () {
  var db = view(), c = S.sess.centre, b = eatGet(db, 'dbefore', c, S.date, '');
  if (!b) return backLink() + title('Leftovers') + dayTitle() + skipNote('after') + '<p>First save the quantities for today.</p>' + btn('Quantities for today', 'data-a="go" data-to="before"', 'primary block') + skipBtn('after');
  var din = dinnerPlanned(db, c, S.date);
  /* beta 1.7 (Daniela, 26/11): no quantities of food here, only the portions remained. The weekly count of the cold room stays in Weekly */
  return backLink() + title('Leftovers') + dayTitle() + skipNote('after') +
    (din != null ? '<p>Count the portions remained <strong>after lunch</strong>. The dinner (sapa) eats the portions of the menu of the week; what is beyond is left for another day.</p>'
      : '<p>Count the portions remained <strong>after the last meal</strong>: the food cooked and not served.</p>') +
    card(qRow('pr', 'Portions remained', 'portions', S.f.q.pr, undefined, 1)) +
    (din != null ? '<div id="din">' + dinnerSplit(din, eatNum(S.f.q.pr)) + '</div>' : '') +
    '<div class="cyp-card" id="bal">' + balanceHtml() + '</div>' +
    btn('Save', 'data-a="saveAfter"', 'primary block') + skipBtn('after');
};
/* Minsundu: the dinner of the menu of the week, or null where there is no dinner from the plan */
function dinnerPlanned(db, c, d) {
  if (fixedMeals().indexOf('Dinner') < 0 || eatDinLeft(db, c)) return null;
  var pf = planOrFixed(db, c, d, 'Dinner'); return pf[0] == null ? null : pf[0];
}
/* Daniela, 26/11: "for Minsundu please spotlight with a nice visual the portions counted for the dinner" */
function dinnerSplit(din, pr) {
  var eat = pr == null ? null : Math.min(din, pr), left = pr == null ? null : pr - eat;
  return '<div class="dinsplit" aria-label="The portions remained after lunch">' +
    '<div class="cyp-stat"><span class="cyp-stat__label label-caps">Remained after lunch</span><span class="cyp-stat__figure figure num">' + (pr == null ? '–' : pr) + '</span><span class="cyp-stat__note">portions counted</span></div>' +
    '<div class="cyp-stat din"><span class="cyp-stat__label label-caps">Dinner (sapa)</span><span class="cyp-stat__figure figure num">' + din + '</span><span class="cyp-stat__note">portions of the menu of the week</span></div>' +
    '<div class="cyp-stat"><span class="cyp-stat__label label-caps">Left for another day</span><span class="cyp-stat__figure figure num">' + (left == null ? '–' : left) + '</span><span class="cyp-stat__note">portions</span></div></div>' +
    (pr != null && pr < din ? banner('warn', 'Only ' + plural(pr, 'portion', 'portions') + ' remained for a dinner of ' + din + ': ' + (din - pr) + ' missing.') : '');
}
/* the balance of the day while the portions are written: the day as it would be saved */
function balanceHtml() {
  var db = view(), c = S.sess.centre, b = eatGet(db, 'dbefore', c, S.date, ''); if (!b) return '';
  var pr = eatNum(S.f.q.pr), u;
  if (pr == null) u = eatDayUse(db, c, S.date);
  else {
    var fake = { type: 'dafter', centre: c, date: S.date, meal: '', key: eatKey('dafter', c, S.date, ''), data: { pr: Math.max(0, Math.round(pr)), q: {}, nc: {}, u: {} } };
    u = eatDayUse({ rev: db.rev, settings: db.settings, names: db.names, centres: db.centres, items: db.items, entries: db.entries.concat([fake]) }, c, S.date);
  }
  if (u.remained == null) return h3('Balance of the day') + small('Write the portions remained to see the food a portion and the food left.');
  var rows = [];
  db.items.forEach(function (it) {
    if (u.used[it.id] === undefined) return;
    var own = u.base && eatBaseOf(u, it.id) !== u.base ? eatBaseOf(u, it.id) : 0;
    var a = u.used[it.id] != null && u.portions ? (b.data.q[it.id] != null ? (own ? u.used[it.id] / own : (u.used[it.id] + (u.left[it.id] || 0)) / u.portions) : null) : null;
    var pt = it.id === 'chk' && u.pieces != null && u.portions ? fmt(own ? u.pieces / own : (u.pieces + (u.leftPieces || 0)) / u.portions) + ' pieces' : perTxt(it, a).replace(' a plate', '');
    if (own) pt += ' (' + own + ' portions with ' + esc(it.name.toLowerCase()) + ')';
    var lw = u.left[it.id] == null ? 'Not counted' : (it.id === 'chk' && u.leftPieces != null ? fmt(u.leftPieces) + ' pieces' : fmt(u.left[it.id]) + ' ' + esc(it.use));
    rows.push([esc(it.name), u.used[it.id] == null ? 'Not counted' : pt, lw]);
  });
  return h3('Balance of the day') + table([['Food'], ['A portion'], ['Left', 1]], rows) +
    small(u.portions ? plural(u.portions, 'portion', 'portions') + ' cooked: ' + plural(u.base, 'portion', 'portions') + ' eaten (' + ateWords(db, c, S.date, u) + ') + ' + plural(u.leftPortions, 'portion', 'portions') + ' left.' + (u.staff == null ? ' Kitchen staff: not written (Portions).' : '') : 'Count the portions served today to see the food a portion.');
}
function pb0(f, b, au, back) { if (f.nc.pcs) return null; return au === 'portion' ? back : eatNum(f.q.pcs); }

/* beta 1.9 (Mauro, 26/11): the portions cooked today, when the quantities are not known (fish without a scale) and as a check against the
   menu of the week: all its meals (dinner too) and the places cooked for here (Ukubalula). More or fewer than the plan: the cook writes why */
function planPortions(db, c, d) {
  var pd = eatPlanDay(db, c, d); if (!pd) return null;
  var tot = 0, w = [], k; for (k in (pd.p || {})) if (pd.p[k]) { tot += pd.p[k]; w.push(pd.p[k] + ' ' + (k === 'Dinner' ? 'dinner (sapa)' : k.toLowerCase())); }
  for (k in (pd.o || {})) if (pd.o[k]) { tot += pd.o[k]; w.push(pd.o[k] + ' for ' + shown(k)); }
  return tot ? { tot: tot, words: w.join(' + ') } : null;
}
/* beta 1.10 (Daniela, 26/11: "today we eat pork, but there are pieces of chicken for who does not eat pork"): the portions that had each food.
   Only with two foods or more on the day; a food left empty was eaten by all the portions */
function ppCard(db) {
  var ids = S.f.rows.filter(function (id) { var it = eatItem(db, id); return it && it.relish; });
  if (ids.length < 2) return '';
  return card(h3('Not everyone ate the same food?') + '<p class="small muted">If some had one food and some another (pork, and chicken for who does not eat pork), write how many portions had each food. Leave it empty for a food that every portion had.</p>' +
    ids.map(function (id) { return qRow('pp_' + id, 'Portions with ' + eatItem(db, id).name.toLowerCase(), 'portions', S.f.q['pp_' + id], undefined, 1); }).join(''));
}
function cookedCard(db) {
  return card(h3('Portions cooked today') + '<p class="small muted">All the portions cooked for today: every meal and every place the kitchen cooks for.</p>' +
    qRow('pc', 'Portions cooked', 'portions', S.f.q.pc, undefined, 1) + '<div id="pcm">' + cookedMatch(db) + '</div>');
}
function cookedMatch(db) {
  var pp = planPortions(db, S.sess.centre, S.date), n = eatNum(S.f.q.pc);
  if (!pp) return small('No menu of the week for today: nothing to compare with.');
  var line = 'Menu of the week: ' + plural(pp.tot, 'portion', 'portions') + ' (' + esc(pp.words) + ').';
  if (n == null) return small(line);
  var d = Math.round(n) - pp.tot;
  if (!d) return small(line) + '<p>' + tag('ok', 'Matches the menu of the week') + '</p>';
  return small(line) + '<p>' + tag('warn', Math.abs(d) + (d > 0 ? ' more' : ' fewer') + ' than the menu of the week') + '</p>' +
    field(d > 0 ? 'Why more portions than the menu of the week?' : 'Why fewer portions than the menu of the week?', 'pcw', '<input id="pcw" class="cyp-input" type="text" maxlength="300" data-f="pcw" value="' + esc(S.f.pcw || '') + '">');
}
