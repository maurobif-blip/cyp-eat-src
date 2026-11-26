SCREENS.week = function () {
  var db = view(), c = S.sess.centre, mon = S.week, sun = eatAddDays(mon, 6), t = todayStr(), past = sun < t;
  var ew = eatWeekCount(db, c, mon, 'endweek'), notes = eatNotes(db, mon, sun, c);
  var tot = {}; notes.forEach(function (n) { var nq = eatNoteQ(n, c); for (var k in nq) tot[k] = (tot[k] || 0) + nq[k]; });
  var out = weekBar() + '<p class="body-strong muted">' + esc(centreName(c)) + '</p>';
  /* the two steps of the week. Deliveries are saved by another person: in a past week with no note there is nothing to say */
  var pl = eatGet(db, 'plan', c, mon, ''), pldays = pl ? Object.keys(pl.data.days || {}).length : 0;
  out += list(linkRow('clip', '1. Menu of the week', pl ? 'Saved' + (pl.byName ? ' by ' + esc(pl.byName) : '') + ' · ' + plural(pldays, 'day', 'days') : 'The paper of the kitchen with the people and the food of each day: a photo, or written by hand', 'data-a="go" data-to="plan"', pl ? tag('ok', 'Done') : (past ? tag('danger', 'Not done') : tag('', 'To do')), 'steprow step') +
    row('truck', '2. Deliveries', 'Saved by the deliveries person from the photos of the notes', '', notes.length ? tag('ok', 'Done') : (past ? '' : tag('', 'To do'))) +
    stepRow('3', 'Stock in the fridge', ew ? 'Counted ' + dayName(ew.date) : 'Once a week, always on the same day: what is in the store and in the fridge', 'endweek', ew ? 'ok' : (past ? 'no' : 'todo')));
  out += notes.length ? list(notes.map(function (n) {
    return row('', 'No. ' + esc(n.data.no) + ' · ' + dayName(n.date), esc(noteItems(db, eatNoteQ(n, c))) + (n.centre === c && n.data.parts ? ' · On the same note: ' + esc(partsText(db, n.data.parts)) : (n.centre !== c ? ' · Part of the note for ' + esc(centreName(n.centre)) : ''))); }).join('') +
    row('', 'Week', esc(noteItems(db, tot)))) : '<p class="muted">No delivery for ' + esc(centreName(c)) + ' this week yet.</p>';
  /* balance: ordered this week − left at the end of the week; next to it, what the daily counts say was used */
  var last = ew ? ew.date : (sun < t ? sun : t), used = {}, usedOk = {};
  for (var d = mon; d <= last; d = eatAddDays(d, 1)) eatUsesOfDay(db, c, d).forEach(function (u) { if (!u.hasBefore) return; for (var id in u.usedU) { if (u.usedU[id] == null) { usedOk[id] = false; continue; } used[id] = (used[id] || 0) + u.usedU[id]; } });
  var rows = [], star = false;
  db.items.forEach(function (it) {
    if (!it.stock) return;
    var o = tot[it.id] || 0, l = ew ? (ew.data.nc && ew.data.nc[it.id] ? null : (ew.data.q[it.id] != null ? ew.data.q[it.id] : 0)) : undefined, u = used[it.id];
    if (!o && !l && !u) return;
    var bal = l === undefined || l === null ? null : Math.round((o - l) * 100) / 100;
    if (u != null && usedOk[it.id] === false) star = true;
    rows.push([esc(it.name) + ' (' + esc(it.unit) + ')', fmt(o), l === undefined ? '–' : (l === null ? 'n.c.' : fmt(l)), '<strong>' + (bal == null ? '–' : fmt(bal)) + '</strong>', u == null ? '–' : fmt(Math.round(u * 100) / 100) + (usedOk[it.id] === false ? '*' : '')]);
  });
  out += card(h3('Balance of the week') +
    (rows.length ? '<div class="grid4">' + table([['Item'], ['Ordered', 1], ['Left', 1], ['Balance', 1], ['Daily', 1]], rows) + '</div>' +
      small('Balance = ordered this week − left at the end of the week' + (ew ? '' : ' (after the count)') + '. Daily = used, from the daily counts' + (star ? ' (* some days not counted)' : '') + '.') : '<p class="muted">Nothing yet this week.</p>'));
  return out;
};
