SCREENS.today = function () {
  var db = view(), c = S.sess.centre, d = S.date, dm = eatDayMenu(db, c, d), left = eatLeft(db, c), past = d < todayStr();
  var b = eatGet(db, 'dbefore', c, d, ''), a = eatGet(db, 'dafter', c, d, ''), sk = eatGet(db, 'dskip', c, d, '');
  var out = dayBar() + '<p class="body-strong muted">' + esc(centreName(c)) + '</p>';
  /* the work of the day in steps: 1 menu, 2 quantities, 3 count of the people, 4 leftovers (where they are counted) */
  var skd = sk ? sk.data : {}, noMenu = !dm.saved && skd.menu, noBefore = !b && skd.before, noAfter = !a && skd.after;
  var pes = countMeals().map(function (m) { return eatGet(db, 'people', c, d, m); });
  var allDone = pes.every(function (p) { return p && p.data.done; }), going = pes.some(function (p) { return p && !p.data.skip; }), anySkip = pes.some(function (p) { return p && p.data.skip; });
  var pl = 0; pes.forEach(function (p) { if (p && !p.data.skip) pl += eatPlates(p); });
  function state(done, marked) { return done ? 'ok' : (marked || past ? 'no' : 'todo'); }
  var pStep = stepRow('3', 'Count the people', allDone ? 'Finished: ' + plural(pl, 'plate', 'plates') : (going ? 'Counting: ' + plural(pl, 'plate', 'plates') : (anySkip ? 'People not counted' : 'One tap for each plate')), 'people', allDone ? 'ok' : (going ? 'todo' : state(false, anySkip)));
  /* Daniela, 26/11: nobody of the team was at the centre: the day has no data (not zero) */
  if (sk && sk.data.on && sk.data.absent) return out + banner('danger', 'Nobody of the team was at ' + esc(centreName(c)) + ' on ' + dayName(d) + (sk.byName ? ' (' + esc(sk.byName) + ')' : '') + '. This day has no data: it does not count as zero.') + btn('Undo', 'data-a="skip" data-on="0"', 'block');
  if (sk && sk.data.on) out += banner('danger', 'Food not counted on ' + dayName(d) + '. People are counted.') + btn('Undo', 'data-a="skip" data-on="0"') + list(pStep);
  else out += list(
    stepRow('1', 'What do we eat today?', noMenu ? 'Menu not written. It can still be added.' : esc(dayMenuText(db, dm)) + (dm.saved ? '' : ' (plan)') + (dm.cook ? ' · Head cook: ' + esc(dm.cook) : ''), 'menu', state(dm.saved, noMenu)) +
    stepRow('2', 'Quantities for today', b ? esc(qtyLine(db, b.data.q, b.data.u)) + (b.data.pc != null ? ' · ' + plural(b.data.pc, 'portion', 'portions') + ' cooked' : '') : (noBefore ? 'Quantities not counted. They can still be added.' : 'Food taken out of the store and the cold room for the meals of today'), 'before', state(b, noBefore)) +
    pStep +
    (left ? stepRow('4', 'Leftovers', a ? 'Saved' : (noAfter ? 'Leftovers not counted. They can still be added.' : 'After the count: what is left at the end of the day'), 'after', state(a, noAfter)) : ''));
  /* the day: plates and the amount a plate */
  var u = eatDayUse(db, c, d), rows = [];
  if (u.closed && u.base) db.items.forEach(function (it) { if (u.used[it.id] == null) return; rows.push([esc(it.name), perTxt(it, eatPerPlate(u, it.id)) + (eatBaseOf(u, it.id) !== u.base ? ' (' + plural(eatBaseOf(u, it.id), 'portion', 'portions') + ' with ' + esc(it.name.toLowerCase()) + ')' : '')]); });
  /* beta 1.6: the food left after the last meal, next to the amount a plate */
  var lrows = []; if (u.remained != null) { lrows.push(['Portions remained', u.remained + (u.remF ? ' (' + remFText(db, u) + ')' : '')]); if (u.dinner != null) lrows.push(['Dinner (sapa)', Math.min(u.dinner, u.remained) + (u.dinnerShort ? ' (' + u.dinnerShort + ' missing)' : '')]); lrows.push(['Left for another day', plural(u.leftPortions, 'portion', 'portions')]); }
  if (u.hasAfter) db.items.forEach(function (it) { if (u.left[it.id] == null) return; var lw = leftWords(db, c, d, it, u.left[it.id], it.id === 'chk' ? u.leftPieces : null); if (lw) lrows.push([esc(it.name) + ' left', lw]); });
  /* beta 1.9: the portions cooked against the portions eaten and left */
  if (u.cookedP != null) { var pp9 = planPortions(db, c, d); lrows.unshift(['Portions cooked', u.cookedP + (pp9 && pp9.tot !== u.cookedP ? ' (menu of the week ' + pp9.tot + (u.cookedWhy ? ': ' + esc(u.cookedWhy) : '') + ')' : '')]);
    if (u.remained != null && u.base != null) { var na = u.cookedP - u.base - u.leftPortions; lrows.push(['Not accounted (cooked − eaten − left)', na ? tag(na > 0 ? 'warn' : '', plural(na, 'portion', 'portions')) : tag('ok', '0')]); } }
  var lexp = u.remained != null ? null : (u.planned != null && u.base ? u.planned - u.base : null);
  out += card(h3(dayName(d)) +
    table([[''], ['', 1]], [['Plates', u.plates == null ? tag('', 'People: to do') : u.plates + (u.peopleMissing ? ' (' + plural(u.peopleMissing, 'meal', 'meals') + ' not counted)' : '')]].concat(u.cooked ? [['Cooked for ' + othersWords(db, c, d), u.cooked]] : []).concat([['Kitchen staff', u.staff == null ? tag('', 'To write in People') : u.staff]]).concat(rows).concat(lrows).concat(lexp != null && lrows.length && lexp >= 0 ? [['Should be left (plan − ate)', plural(lexp, 'portion', 'portions')]] : [])) +
    (!rows.length && !u.skipped ? small(u.hasBefore ? (u.closed ? 'Count the people to see the amount a plate.' : 'After the leftovers: the amount a plate.') : 'After the quantities for today: the amount a plate.') : ''), 'data-day');
  /* Daniela, 26/11: undo what was written today, and a day when nobody of the team was at the centre */
  var any = ['people', 'staff', 'dmenu', 'dbefore', 'dafter', 'dskip'].some(function (t) { return db.entries.some(function (e) { return !e.del && e.type === t && e.centre === c && e.date === d; }); });
  if (d === todayStr() && any) out += btn('Undo the data of today', 'data-a="undoAsk"', 'block', 'undo');
  out += btn('I was not present at the centre ' + (d === todayStr() ? 'today' : 'this day'), 'data-a="absentAsk"', 'no');
  return out;
};
