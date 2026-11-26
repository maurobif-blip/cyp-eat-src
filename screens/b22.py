# beta 1.11 (first review of the Excel export, 26/11): People only Lunch or Dinner, time only in "Saved at"; the day numbers in their own tab;
# the menu in columns (Lunch, Dinner, Nshima, Protein 1, Protein 2), "Head cook", chicken pieces in a column, portions counted during the day.
# Run by assemble.py after b21.
def b22(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    rep("""  var people = { name: 'People', head: ['Date', 'Day', 'Centre', 'Meal', 'Portions', 'Of which', 'Finished', 'Counted by', 'Saved at'], rows: [] };
  var day = { name: 'Food a day', head: ['Date', 'Day', 'Centre', 'Menu', 'Cook', 'Item', 'Taken out', 'Left at the end of the day', 'Unit written', 'Used', 'Unit', 'Portions of the day', 'Amount a portion', 'Food not counted'], rows: [] };""",
        """  var people = { name: 'People', head: ['Date', 'Day', 'Centre', 'Meal', 'Portions', 'Of which', 'Protein', 'Finished', 'Counted by', 'Saved at'], rows: [] };
  var day = { name: 'Menu', head: ['Date', 'Day', 'Centre', 'Lunch', 'Dinner', 'Nshima', 'Protein 1', 'Protein 2', 'Head cook', 'Item', 'Taken out', 'Chicken pieces', 'Left at the end of the day', 'Unit written', 'Used', 'Unit', 'Portions counted during the day', 'Amount a portion', 'Chicken pieces a portion', 'Food not counted'], rows: [] };
  var pday = { name: 'Portions a day', head: ['Date', 'Day', 'Centre', 'Portions counted', 'Dinner (menu of the week)', 'Other places (menu of the week)', 'Kitchen staff', 'Portions eaten', 'Portions cooked', 'Menu of the week', 'Why different', 'Portions remained', 'Left for another day', 'Not accounted (cooked - eaten - left)'], rows: [] }, pseen = {};
  /* the portions counted during the day: the meals that are counted, not the dinner of the plan */
  function counted(c, d) { var cc = eatCentre(db, c), n = null; (cc ? cc.meals : []).forEach(function (m) { if (eatFixed(db, c, m) != null) return; var p = eatGet(db, 'people', c, d, m); if (p && !p.data.skip) n = (n || 0) + eatPlates(p); }); return n; }
  /* the menu of a day in columns: Lunch, Dinner, Nshima, Protein 1, Protein 2 (N/A when there is none) */
  function menuCols(c, dmn) {
    var cc = eatCentre(db, c), ms = cc ? cc.meals : [], mm = false, pr = [];
    for (var m in dmn.meals) { var x = dmn.meals[m]; if (x.mm) mm = true; (x.relish || []).forEach(function (id) { var it = eatItem(db, id); if (it && pr.indexOf(it.name) < 0) pr.push(it.name); }); }
    return [ms.indexOf('Lunch') >= 0 ? 'Lunch' : 'N/A', ms.indexOf('Dinner') >= 0 ? 'Dinner' : 'N/A', mm ? 'Nshima' : 'N/A', pr[0] || 'N/A', pr.length > 1 ? pr.slice(1).join(', ') : 'N/A'];
  }
  function timeOf(iso) { return localTime(iso).slice(11); }""")
    # People: the dinner of the menu of the week is a Dinner row; the numbers of the day go to their own tab
    rep("if (fx != null) people.rows.push([e.date, WD[eatWeekday(e.date)], shown(cc.name), m, fx, '', 'Fixed number, not counted', '', '']); }); });",
        "if (fx != null) { var pf = planOrFixed(db, e.centre, e.date, m); people.rows.push([e.date, WD[eatWeekday(e.date)], shown(cc.name), m, pf[0], '', '', pf[1] ? 'From the menu of the week, not counted' : 'Fixed number, not counted', '', '']); } }); });")
    rep("""  E.forEach(function (e) { if (e.type === 'dafter' && e.data.pr != null) people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Portions remained', e.data.pr, '', '', e.byName || '', e.at || '']); });
""", "")
    rep("""  E.forEach(function (e) { if (e.type === 'dbefore' && e.data.pc != null) people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Portions cooked', e.data.pc, '', e.data.pcw ? 'Why different from the menu of the week: ' + e.data.pcw : '', e.byName || '', e.at || '']); });
""", "")
    rep("""  E.forEach(function (e) { if (e.type === 'staff') people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Kitchen staff', e.data.n, '', '', e.byName || '', e.at || '']); });""",
        """  E.forEach(function (e) {
    if (['people', 'staff', 'dbefore', 'dafter'].indexOf(e.type) < 0 || pseen[e.centre + e.date]) return; pseen[e.centre + e.date] = 1;
    var u = eatDayUse(db, e.centre, e.date), pp = planPortions(db, e.centre, e.date), na = u.cookedP != null && u.remained != null && u.base != null ? u.cookedP - u.base - u.leftPortions : '';
    pday.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), counted(e.centre, e.date) == null ? '' : counted(e.centre, e.date), u.dinner == null ? '' : u.dinner, u.cooked || '', u.staff == null ? '' : u.staff, u.base == null ? '' : u.base,
      u.cookedP == null ? '' : u.cookedP, pp ? pp.tot : '', u.cookedWhy || '', u.remained == null ? '' : u.remained, u.leftPortions == null ? '' : u.leftPortions, na]);
  });""")
    rep("""people.rows.push([e.date, WD[eatWeekday(e.date)], c, e.meal, e.data.skip ? '' : eatPlates(e), e.data.g ? e.data.n + ' ' + c + Object.keys(e.data.g).map(function (k) { return ', ' + e.data.g[k] + ' ' + k; }).join('') : '', e.data.skip ? 'Portions not counted' : (e.data.done ? 'Yes' : 'Counting'), e.byName, localTime(e.saved)]);""",
        """people.rows.push([e.date, WD[eatWeekday(e.date)], c, e.meal, e.data.skip ? '' : eatPlates(e), e.data.g ? e.data.n + ' ' + c + Object.keys(e.data.g).map(function (k) { return ', ' + e.data.g[k] + ' ' + k; }).join('') : '', e.data.pf ? Object.keys(e.data.pf).map(function (k) { var pit = eatItem(db, k); return (pit ? pit.name : k) + ' ' + e.data.pf[k]; }).join(', ') : '', e.data.skip ? 'Portions not counted' : (e.data.done ? 'Yes' : 'Counting'), e.byName, timeOf(e.saved)]);""")
    # Menu: the menu in columns, head cook, chicken pieces on the chicken row, the portions counted during the day
    rep("""      if (du.skipped) { day.rows.push([e.date, WD[eatWeekday(e.date)], c, dmt, dmn.cook, '', '', '', '', '', '', du.plates, '', 'Yes']); return; }
      if (!db0) return;
      for (var did in db0.data.q) {
        var dit = did === 'pcs' ? { name: 'Chicken pieces', use: 'pieces' } : eatItem(db, did); if (!dit) continue;
        var dper = did === 'pcs' ? (du.pieces != null && du.closed && du.base ? du.pieces / eatBaseOf(du, 'pcs') : null) : eatPerPlate(du, did), dused = did === 'pcs' ? du.pieces : du.used[did];
        day.rows.push([e.date, WD[eatWeekday(e.date)], c, dmt, dmn.cook, dit.name, db0.data.q[did] == null ? 'Not counted' : db0.data.q[did], !eatLeft(db, e.centre) ? 'Not counted at this centre' : (da ? (da.data.q[did] == null ? (da.data.nc && da.data.nc[did] ? 'Not counted' : '') : da.data.q[did]) : 'Not yet'), did === 'pcs' ? 'pieces' : (rowUnit(dit, (db0.data.u || {})[did]) === 'unit' ? dit.unit : dit.use), dused == null ? '' : dused, dit.use, du.plates, dper == null ? '' : (dit.use === 'kg' ? Math.round(dper * 1000) + ' g' : Math.round(dper * 100) / 100), '']);
      }""",
        """      var mc = menuCols(e.centre, dmn), cnt = counted(e.centre, e.date);
      if (du.skipped) { day.rows.push([e.date, WD[eatWeekday(e.date)], c].concat(mc).concat([dmn.cook, '', '', '', '', '', '', '', cnt == null ? '' : cnt, '', '', 'Yes'])); return; }
      if (!db0) return;
      for (var did in db0.data.q) {
        if (did === 'pcs') continue; var dit = eatItem(db, did); if (!dit) continue;
        var dper = eatPerPlate(du, did), dused = du.used[did], chk = did === 'chk', pcs = db0.data.q.pcs, ppc = chk && du.pieces != null && du.closed && du.base ? du.pieces / eatBaseOf(du, 'pcs') : null;
        var lft = !eatLeft(db, e.centre) ? 'Not counted at this centre' : (!da ? 'Not yet' : (da.data.pr != null ? (du.left[did] != null ? du.left[did] : '') : (da.data.q[did] == null ? (da.data.nc && da.data.nc[did] ? 'Not counted' : '') : da.data.q[did])));
        day.rows.push([e.date, WD[eatWeekday(e.date)], c].concat(mc).concat([dmn.cook, dit.name, db0.data.q[did] == null ? 'Not counted' : db0.data.q[did], chk ? (pcs == null ? ((db0.data.nc || {}).pcs ? 'Not counted' : '') : pcs) : '', lft, rowUnit(dit, (db0.data.u || {})[did]) === 'unit' ? dit.unit : dit.use, dused == null ? '' : dused, dit.use, cnt == null ? '' : cnt, dper == null ? '' : (dit.use === 'kg' ? Math.round(dper * 1000) + ' g' : Math.round(dper * 100) / 100), ppc == null ? '' : Math.round(ppc * 100) / 100, '']));
      }""")
    rep("makeXlsx([people, day].concat(", "makeXlsx([people, pday, day].concat(")
    return s
