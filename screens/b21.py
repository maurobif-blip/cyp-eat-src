# beta 1.11 (26/11): the overview on one page; the comments of 26/11 13:15-13:28 (Mauro, Letizia). Run by assemble.py after b20.
def b21(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # one page: no cover, no chapters in the bar
    rep("(S.scr === 'overview' && S.ovOn ? chapterNav() : '')", "''")
    rep("&& !(S.scr === 'overview' && S.ovOn) &&", "&&")
    rep("A.ovOpen = function (el) { S.ovC = el.getAttribute('data-id'); S.keepScroll = true; render(); };",
        "A.ovOpen = function (el) { S.ovC = el.getAttribute('data-id'); S.keepScroll = true; render(); var o = document.getElementById('ovsel'); if (o && o.scrollIntoView) o.scrollIntoView({ block: 'start' }); };")
    # Letizia: +1/4 adds a quarter to the number, without stopping at the next whole number; .0 takes the decimals off
    rep("  var nv = Math.floor(cur) + v; S.f.q[k] = nv;", "  var nv = v ? Math.round((cur + v) * 1000) / 1000 : Math.floor(cur); S.f.q[k] = nv;")
    # Letizia: the protein switch while counting the portions
    rep("function pData() { var d = { n: S.f.skip ? 0 : S.f.n }, gs = centreGroups();", "function pData() { var d = { n: S.f.skip ? 0 : S.f.n }, gs = centreGroups(); if (!S.f.skip && S.f.pf && dayProteins().length > 1) { var pf = {}, a1 = false; dayProteins().forEach(function (id) { pf[id] = S.f.pf[id] || 0; if (pf[id]) a1 = true; }); if (a1) d.pf = pf; }")
    rep("var a = e.data.g || {}, b = d.g || {}; for (var k in b) if ((a[k] || 0) !== b[k]) return false; return true; }", "var a = e.data.g || {}, b = d.g || {}; for (var k in b) if ((a[k] || 0) !== b[k]) return false; if (JSON.stringify(e.data.pf || {}) !== JSON.stringify(d.pf || {})) return false; return true; }")
    rep("  if (inc) S.f.hist.push({ g: S.f.grp || '', k: inc });", "  if (inc) { S.f.hist.push({ g: S.f.grp || '', k: inc, p: curProtein() }); protAdd(inc); }")
    rep("S.f.grp = h.g; setCount(Math.max(0, curCount() - h.k)); peopleChanged(0);", "S.f.grp = h.g; setCount(Math.max(0, curCount() - h.k)); if (h.p) protAdd(-h.k, h.p); peopleChanged(0);")
    rep("    S.f = { n: src.n || 0, g: JSON.parse(JSON.stringify(src.g || {})), grp: keepGrp, hist: [], done: !!src.done, skip: !!src.skip };",
        "    S.f = { n: src.n || 0, g: JSON.parse(JSON.stringify(src.g || {})), grp: keepGrp, hist: [], done: !!src.done, skip: !!src.skip, pf: JSON.parse(JSON.stringify(src.pf || {})), pk: S.f && S.f.pk ? S.f.pk : '' };")
    rep("A.grp = function (el) { S.f.grp = el.getAttribute('data-g'); S.keepScroll = true; render(); };", "A.grp = function (el) { S.f.grp = el.getAttribute('data-g'); S.keepScroll = true; render(); };\nA.prot = function (el) { S.f.pk = el.getAttribute('data-id'); S.keepScroll = true; render(); };")
    return s
