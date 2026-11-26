# beta 1.10 (Daniela, 26/11): the portions that had each food. Run by assemble.py after b19.
def b20(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    rep("(key === 'pcs' || key === 'pr' || key === 'pc' ||", "(key === 'pcs' || key === 'pr' || key === 'pc' || key.indexOf('pp_') === 0 ||")
    rep("  var d = qData(); delete d.q.pc;", "  var d = qData(); delete d.q.pc; var pp10 = {}, any10 = false; for (var k10 in d.q) if (k10.indexOf('pp_') === 0) { if (d.q[k10] != null && d.q[k10] > 0 && S.f.rows.indexOf(k10.slice(3)) >= 0) { pp10[k10.slice(3)] = Math.round(d.q[k10]); any10 = true; } delete d.q[k10]; } if (any10) d.pp = pp10;")
    rep("S.f.pcw = e && e.data.pcw ? e.data.pcw : ''; }", "S.f.pcw = e && e.data.pcw ? e.data.pcw : ''; Object.keys(S.f.q).forEach(function (k) { if (k.indexOf('pp_') === 0) delete S.f.q[k]; }); if (e && e.data.pp) for (var k10 in e.data.pp) S.f.q['pp_' + k10] = e.data.pp[k10]; }")
    rep("out.base[id] = (out.base[id] || 0) + u.base; }", "out.base[id] = (out.base[id] || 0) + eatBaseOf(u, id); }")
    rep("du.pieces != null && du.closed && du.base ? du.pieces / du.base : null", "du.pieces != null && du.closed && du.base ? du.pieces / eatBaseOf(du, 'pcs') : null")
    # beta 1.10 (Mauro, 26/11): the count of the fridge with whole units and pieces, bags or loose together
    rep("""    db.items.forEach(function (it) { var a = e && e.data.alt ? e.data.alt[it.id] : null; if (a) { S.f.cu[it.id] = a.u; S.f.q[it.id] = a.n; if (a.k) S.f['bk_' + it.id] = a.k; } else if (it.unit === 'kg') { var lk = lastBagKg(db, c, it.id); if (lk) S.f['bk_' + it.id] = lk; } });""",
        """    db.items.forEach(function (it) { var a = e && e.data.alt ? e.data.alt[it.id] : null; if (a) { S.f.q[it.id] = a.w || 0; S.f.q['x_' + it.id] = a.n; if (a.k) S.f['bk_' + it.id] = a.k; } if (!S.f['bk_' + it.id] && countAlt(it) && countAlt(it).ask) { var lk = lastBagKg(db, c, it.id); if (lk) S.f['bk_' + it.id] = lk; } });""")
    rep("""  var db = view(), f = S.f, miss = db.items.filter(function (it) { return it.stock && !f.nc[it.id] && eatNum(f.q[it.id]) == null; }).map(function (it) { return it.name; });""",
        """  var db = view(), f = S.f, miss = db.items.filter(function (it) { return it.stock && !f.nc[it.id] && eatNum(f.q[it.id]) == null && !eatNum(f.q['x_' + it.id]); }).map(function (it) { return it.name; });""")
    rep("""    var cu = countUnit(it); if (cu === 'unit') return;
    var n = eatNum(f.q[it.id]), k = cu === 'bags' ? eatNum(f['bk_' + it.id]) : null;
    if (cu === 'bags' && !(k > 0)) { bad.push(it.name); return; }
    alt[it.id] = cu === 'bags' ? { n: n, u: 'bags', k: k } : { n: n, u: 'pieces' }; anyAlt = true; d.q[it.id] = countStore(it, cu, n, k);""",
        """    var ca = countAlt(it), w = eatNum(f.q[it.id]), n = eatNum(f.q['x_' + it.id]), k = eatNum(f['bk_' + it.id]);
    if (!ca || !n) { d.q[it.id] = w == null ? 0 : w; return; }
    if (ca.u === 'bags' && !(k > 0)) { bad.push(it.name); return; }
    alt[it.id] = { n: n, u: ca.u }; if (w) alt[it.id].w = w; if (ca.u !== 'loose') alt[it.id].k = k > 0 ? k : PIECES_IN_CHICKEN; anyAlt = true; d.q[it.id] = countTotal(it, w, n, k);""")
    rep("""  if (bad.length) { S.notice = 'Write about how many kg one bag holds: ' + bad.join(', ') + '.'; return render(); }""",
        """  if (bad.length) { S.notice = 'Write about how many kg one bag holds: ' + bad.join(', ') + '.'; return render(); }
  for (var kx in d.q) if (kx.indexOf('x_') === 0) delete d.q[kx];""")
    rep("key.indexOf('pp_') === 0 ||", "key.indexOf('pp_') === 0 || key === 'x_chk' ||")
    rep("eatItem(db, k).unit + (e.data.ab && e.data.ab[k] ? ' (about)' : '') + (e.data.alt && e.data.alt[k] ? ' (written: ' + e.data.alt[k].n + ' ' + e.data.alt[k].u + (e.data.alt[k].k ? ' of about ' + e.data.alt[k].k + ' kg' : '') + ')' : ''), e.byName]); } }",
        "eatItem(db, k).unit + (e.data.ab && e.data.ab[k] ? ' (about)' : '') + (e.data.alt && e.data.alt[k] ? ' (written: ' + altWords(eatItem(db, k), e.data.alt[k]) + ')' : ''), e.byName]); } }")
    return s
