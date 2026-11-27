# beta 1.13 (Mauro, 27/11): "Other" next to the proteins of the menu of the day ("today beans, and who does not want them eats vegetables"),
# and beans also in buckets in the quantities of the day. Run by assemble.py after b23.
def b24(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # the menu of the day: Other, with its name
    rep("if (S.f.meals.Breakfast) S.f.meals.Breakfast.isOther = !S.f.meals.Breakfast.mm && !!S.f.meals.Breakfast.other;",
        "if (S.f.meals.Breakfast) S.f.meals.Breakfast.isOther = !S.f.meals.Breakfast.mm && !!S.f.meals.Breakfast.other;\n    for (var om in S.f.meals) if (om !== 'Breakfast') S.f.meals[om].isOther = !!S.f.meals[om].other;")
    rep("A.addRow = function (el) {", "A.relo = function (el) { var x = S.f.meals[el.getAttribute('data-m')]; x.isOther = !x.isOther; S.keepScroll = true; render(); var oi = x.isOther && document.getElementById('oth_' + el.getAttribute('data-m')); if (oi && !oi.value) oi.focus(); };\nA.addRow = function (el) {")
    rep("    } else ms[m] = { mm: !!x.mm, relish: x.relish.slice(), veg: (x.veg || '').trim() };",
        "    } else {\n      var oth = x.isOther ? (x.other || '').trim() : '';\n      if (x.isOther && !oth) { S.notice = (sameDinner(f.meals) && m === 'Lunch' ? 'Lunch and dinner' : m) + ': write what Other is, or untick it.'; return render(); }\n      ms[m] = { mm: !!x.mm, relish: x.relish.slice(), veg: (x.veg || '').trim() }; if (oth) ms[m].other = oth;\n    }")
    rep("if (ms.Lunch && ms.Dinner) ms.Dinner = { mm: ms.Lunch.mm, relish: ms.Lunch.relish.slice(), veg: ms.Lunch.veg };",
        "if (ms.Lunch && ms.Dinner) { ms.Dinner = { mm: ms.Lunch.mm, relish: ms.Lunch.relish.slice(), veg: ms.Lunch.veg }; if (ms.Lunch.other) ms.Dinner.other = ms.Lunch.other; }")
    rep("  if (mn.veg) p.push(mn.veg.toLowerCase());\n  return p.join(', ')", "  if (meal !== 'Breakfast' && mn.other) p.push(mn.other.toLowerCase());\n  if (mn.veg) p.push(mn.veg.toLowerCase());\n  return p.join(', ')")
    # beans in buckets
    rep("function stepOf(unit) { return unit === 'kg' || unit === 'bags' || unit === 'trays' ? 0.25 : 1; }",
        "function stepOf(unit) { return unit === 'kg' || unit === 'bags' || unit === 'trays' || unit === 'buckets' ? 0.25 : 1; }\n/* the kg in one bucket at a centre: from the last quantities of the day that wrote it */\nfunction lastBucketKg(db, c, id) { var last = null; db.entries.forEach(function (e) { if (e.del || e.type !== 'dbefore' || e.centre !== c || !e.data.ak || !e.data.ak[id]) return; if (!last || e.date > last.date) last = e; }); return last ? last.data.ak[id] : null; }\nfunction unitName(it, u) { return u === 'unit' ? it.unit : (u === 'alt' && EAT_ALT[it.id] ? EAT_ALT[it.id].unit : it.use); }")
    rep("function rowUnit(it, u) { return u === 'portion' ? 'portion' : (it.unit !== it.use && u === 'unit' ? 'unit' : 'use'); }",
        "function rowUnit(it, u) { return u === 'portion' ? 'portion' : (u === 'alt' && EAT_ALT[it.id] ? 'alt' : (it.unit !== it.use && u === 'unit' ? 'unit' : 'use')); }")
    rep("var un = rowUnit(it, f.u[id]), ut = un === 'portion' ? 'portions' : (un === 'unit' ? it.unit : it.use),",
        "var un = rowUnit(it, f.u[id]), ut = un === 'portion' ? 'portions' : unitName(it, un),")
    rep("S.f.u = {}; rows.forEach(function (id) { var it = eatItem(db, id); if (!it || it.unit === it.use) return;",
        "if (scr === 'before') for (var akk in EAT_ALT) S.f['ak_' + akk] = e && e.data.ak && e.data.ak[akk] != null ? e.data.ak[akk] : lastBucketKg(db, c, akk);\n    S.f.u = {}; rows.forEach(function (id) { var it = eatItem(db, id); if (!it || (it.unit === it.use && !EAT_ALT[id])) return;")
    rep("  d.u = S.f.u || {};\n  var toPeople = peopleOpen();",
        "  d.u = S.f.u || {};\n  var ak = {}, anyAk = false, noAk = [];\n  S.f.rows.forEach(function (id) { if (d.u[id] !== 'alt' || !EAT_ALT[id] || S.f.nc[id]) return; var k = eatNum(S.f['ak_' + id]); if (k > 0) { ak[id] = k; anyAk = true; } else if (d.q[id]) noAk.push(eatItem(view(), id).name); });\n  if (noAk.length) { S.notice = 'Write about how many kg one bucket holds: ' + noAk.join(', ') + '.'; return render(); }\n  if (anyAk) d.ak = ak;\n  var toPeople = peopleOpen();")
    rep("else if (it) parts.push(it.name + ' ' + fmt(q[id]) + ' ' + (unitOf && unitOf[id] === 'unit' ? it.unit : it.use)); }",
        "else if (it) parts.push(it.name + ' ' + fmt(q[id]) + ' ' + unitName(it, unitOf && unitOf[id])); }")
    # the Excel
    rep("rowUnit(dit, (db0.data.u || {})[did]) === 'unit' ? dit.unit : dit.use, dused == null ? '' : dused,",
        "unitName(dit, rowUnit(dit, (db0.data.u || {})[did])) + ((db0.data.ak || {})[did] ? ' (1 = ' + db0.data.ak[did] + ' kg)' : ''), dused == null ? '' : dused,")
    rep("(x.relish || []).forEach(function (id) { var it = eatItem(db, id); if (it && pr.indexOf(it.name) < 0) pr.push(it.name); }); }",
        "(x.relish || []).forEach(function (id) { var it = eatItem(db, id); if (it && pr.indexOf(it.name) < 0) pr.push(it.name); }); if (x.other && pr.indexOf(x.other) < 0) pr.push(x.other); }")
    rep("Object.keys(e.data.pf).map(function (k) { var pit = eatItem(db, k); return (pit ? pit.name : k) + ' ' + e.data.pf[k]; })",
        "Object.keys(e.data.pf).map(function (k) { var pit = eatItem(db, k), pdm = k === EAT_OTHER ? eatDayMenu(db, e.centre, e.date).meals : null, pom = pdm ? pdm[e.meal] || pdm.Lunch : null; return (pit ? pit.name : (pom && pom.other ? pom.other : 'Other')) + ' ' + e.data.pf[k]; })")
    # Back from Weekly did nothing since beta 1.9: Weekly does not ask the day, so the choice of the day was never shown. Now it goes there
    rep("  if (to === 'day') { askDay(true); S.hist = []; return render(); }", "  if (to === 'day') { askDay(true); S.hist = []; if (!DAYSCR[S.scr]) return go('today', true); return render(); }")
    return s
