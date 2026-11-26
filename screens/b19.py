# beta 1.9 (Mauro, 26/11): the portions cooked for the day, against the menu of the week. Run by assemble.py after b18.
def b19(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    rep("    if (scr === 'after') { S.f.q = { pr:", "    if (scr === 'before') { delete S.f.q.pc; S.f.q.pc = e && e.data.pc != null ? e.data.pc : null; S.f.pcw = e && e.data.pcw ? e.data.pcw : ''; }\n    if (scr === 'after') { S.f.q = { pr:")
    rep("(key === 'pcs' || key === 'pr' ||", "(key === 'pcs' || key === 'pr' || key === 'pc' ||")
    rep("function liveUpdate() {", "function liveUpdate() {\n  var pcm = document.getElementById('pcm'); if (pcm && S.scr === 'before') { var hadW = document.activeElement && document.activeElement.id === 'pcw'; pcm.innerHTML = cookedMatch(view()); if (hadW) { var w9 = document.getElementById('pcw'); if (w9) w9.focus(); } }")
    rep("""  var d = qData(); S.f.rows.forEach(function (id) { if (!(id in d.q)) d.q[id] = null; });""", """  var pc = eatNum(S.f.q.pc), pp = planPortions(view(), S.sess.centre, S.date);
  if (pc != null && pp && Math.round(pc) !== pp.tot && !(S.f.pcw || '').trim()) { S.notice = 'Write why the portions cooked are ' + (Math.round(pc) > pp.tot ? 'more' : 'fewer') + ' than the menu of the week.'; return render(); }
  var d = qData(); delete d.q.pc; S.f.rows.forEach(function (id) { if (!(id in d.q)) d.q[id] = null; });
  if (pc != null) { d.pc = Math.round(pc); if (pp && d.pc !== pp.tot) d.pcw = (S.f.pcw || '').trim(); }""")
    # Excel: the portions cooked in the sheet People
    rep("  E.forEach(function (e) { if (e.type === 'staff') people.rows.push(", "  E.forEach(function (e) { if (e.type === 'dbefore' && e.data.pc != null) people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Portions cooked', e.data.pc, '', e.data.pcw ? 'Why different from the menu of the week: ' + e.data.pcw : '', e.byName || '', e.at || '']); });\n  E.forEach(function (e) { if (e.type === 'staff') people.rows.push(")
    # overview, Plan of the week: the portions cooked of each day
    rep("    for (var o2 in (x.k.day.o || {})) pr.push(", "    if (x.k.portions && x.k.portions.cooked != null) pr.push(row('', dn + ' · Portions cooked', 'Plan ' + nf(x.k.portions.plan) + ' · cooked ' + nf(x.k.portions.cooked) + (x.k.portions.why ? ' · why: ' + esc(x.k.portions.why) : ''), x.k.portions.cooked !== x.k.portions.plan ? tag('warn', sg(x.k.portions.cooked - x.k.portions.plan)) : tag('ok', 'As planned')));\n    for (var o2 in (x.k.day.o || {})) pr.push(")
    return s
