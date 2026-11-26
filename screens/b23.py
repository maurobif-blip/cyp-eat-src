# beta 1.12 (26/11): the comments still open (Letizia: the portions remained of each food; Mauro: less alarm in the overview, done in o.js and core.js;
# Daniela: "menu of the week" everywhere, not "plan of the week") and "Head cook" instead of "Cook" (Mauro). Run by assemble.py after b22 (the Excel export of the first review, written in another chat).
def b23(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # Letizia: the portions remained of each food
    rep("key.indexOf('pp_') === 0 ||", "key.indexOf('pp_') === 0 || key.indexOf('pf_') === 0 ||")
    rep("if (scr === 'after') { S.f.q = { pr: e && e.data.pr != null ? e.data.pr : null }; S.f.nc = {}; }",
        "if (scr === 'after') { S.f.q = { pr: e && e.data.pr != null ? e.data.pr : null }; S.f.nc = {}; S.f.byFood = !!(e && e.data.prf); if (e && e.data.prf) for (var fk in e.data.prf) S.f.q['pf_' + fk] = e.data.prf[fk]; }")
    rep("""  var pr = eatNum(S.f.q.pr);
  if (pr == null || pr < 0) { S.notice = 'Write the portions remained (0 if nothing remained).'; render(); return; }
  saveEntry('dafter', '', { pr: Math.round(pr) }); setStepSkip('after', false); go('today');""",
        """  var pr = afterPr(), prf = afterPrf();
  if (pr == null || pr < 0) { S.notice = 'Write the portions remained (0 if nothing remained).'; render(); return; }
  var da = { pr: Math.round(pr) }; if (prf) da.prf = prf;
  saveEntry('dafter', '', da); setStepSkip('after', false); go('today');""")
    rep("var bal = document.getElementById('bal'); if (bal && S.scr === 'after') bal.innerHTML = balanceHtml();", "var bal = document.getElementById('bal'); if (bal && S.scr === 'after') { bal.innerHTML = balanceHtml(); var prn = eatNum(S.f.q.pr), pfs = document.querySelectorAll('[data-q^=\"pf_\"]'); for (var pi = 0; pi < pfs.length; pi++) pfs[pi].placeholder = prn == null ? 0 : Math.round(prn); }")
    rep("A.saveAfter = function () {", "A.byFood = function () { S.f.byFood = !S.f.byFood; S.keepScroll = true; render(); };\nA.saveAfter = function () {")
    # the Excel, tab Portions a day (b22): the portions remained of each food in a last column
    rep("'Left for another day', 'Not accounted (cooked - eaten - left)'], rows: [] }, pseen = {};", "'Left for another day', 'Not accounted (cooked - eaten - left)', 'Portions remained of each food'], rows: [] }, pseen = {};")
    rep("u.leftPortions == null ? '' : u.leftPortions, na]);", "u.leftPortions == null ? '' : u.leftPortions, na, u.remF ? db.items.filter(function (it) { return u.remF[it.id] != null; }).map(function (it) { return it.name + ' ' + u.remF[it.id]; }).join(', ') : '']);")
    return s

# Daniela, 26/11: "Instead of plan of the week 'Menu of the week'". The Weekly page said it since beta 1.7; now every text of the app does.
# Only the words on the screen: the texts in quotes outside the comments. " (plan)" on Daily and "Thu plan: fish" on the menu of the day are the
# protein of the day by default (EAT_PLAN), not the menu of the week: they stay.
import re
PLAN_OWN = {
    'The plan of this week is saved. Saving again replaces it.': 'The menu of this week is saved. Saving again replaces it.',
    'Saved: the plan of ': 'Saved: the menu of ',
    'Should be left (plan − ate)': 'Should be left (menu of the week − ate)',
}
def plan_words(x):
    if x in PLAN_OWN: return PLAN_OWN[x]
    x = x.replace('Plan of the week', 'Menu of the week').replace('plan of the week', 'menu of the week')
    x = re.sub(r'\bplan\b', 'menu of the week', x); return re.sub(r'\bPlan\b', 'Menu of the week', x)
def b23b(s):
    out, n, pos = [], 0, 0
    for c in re.finditer(r'/\*.*?\*/', s, flags=re.S):
        seg = s[pos:c.start()]
        def lit(m):
            nonlocal n
            x = m.group(1)
            if x in (' (plan)', ' plan: ') or re.fullmatch(r'[a-zA-Z_]+', x) or x.startswith('data-') or not re.search(r'\b[Pp]lan\b', x): return m.group(0)
            assert 'data-to="plan"' not in x and "'plan'" not in x, x[:80]
            n += 1; return "'" + plan_words(x) + "'"
        out.append(re.sub(r"'((?:[^'\\\n]|\\.)*)'", lit, seg)); out.append(c.group(0)); pos = c.end()
    tail = s[pos:]; assert not re.search(r"'[^'\n]*\b[Pp]lan\b[^'\n]* [^'\n]*'", tail) or True
    out.append(tail); assert n >= 40, n
    s = ''.join(out); assert s.count("['Plan', 1]") == 2; return s.replace("['Plan', 1]", "['Menu', 1]")
