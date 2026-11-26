# beta 1.7 (comments of 26/11, Daniela and the overview). Run by assemble.py on the whole page, after the other replacements.
import re
def b17(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # vegetables are not used for now: they leave every screen, the data stays
    rep("  for (var i = 0; i < S.queue.length; i++) { try { eatApply(db, S.queue[i].mode, S.queue[i], nowIso(), null); } catch (e) {} }\n  V = db; return V;",
        "  for (var i = 0; i < S.queue.length; i++) { try { eatApply(db, S.queue[i].mode, S.queue[i], nowIso(), null); } catch (e) {} }\n  /* Daniela, 26/11: \"vegetables we don't care for now\": hidden from every screen, the data stays */\n  db.items = db.items.filter(function (it) { return HIDDEN_ITEMS.indexOf(it.id) < 0; });\n  V = db; return V;")
    rep("function view() {", "var HIDDEN_ITEMS = ['veg'];\nfunction view() {")
    # the leftovers: one number, the portions remained
    i = s.index("A.saveAfter = function () {"); j = s.index("function queueNote(")
    s = s[:i] + """A.saveAfter = function () {
  var pr = eatNum(S.f.q.pr);
  if (pr == null || pr < 0) { S.notice = 'Write the portions remained (0 if nothing remained).'; render(); return; }
  saveEntry('dafter', '', { pr: Math.round(pr) }); setStepSkip('after', false); go('today');
};
""" + s[j:]
    rep("  var bal = document.getElementById('bal'); if (bal && S.scr === 'after') bal.innerHTML = balanceHtml();",
        "  var bal = document.getElementById('bal'); if (bal && S.scr === 'after') bal.innerHTML = balanceHtml();\n  var dn = document.getElementById('din'); if (dn && S.scr === 'after') { var dv = dinnerPlanned(view(), S.sess.centre, S.date); if (dv != null) dn.innerHTML = dinnerSplit(dv, eatNum(S.f.q.pr)); }")
    rep("    if (scr === 'after') {\n      S.f.ps = {};", "    if (scr === 'after') { S.f.q = { pr: e && e.data.pr != null ? e.data.pr : null }; S.f.nc = {}; }\n    if (false) {\n      S.f.ps = {};")
    rep("    (key === 'pcs' || nc || (S.f.u && S.f.u[key] === 'portion') ? '' :", "    (key === 'pcs' || key === 'pr' || nc || (S.f.u && S.f.u[key] === 'portion') ? '' :")
    # the stock in the fridge: the same day of the week as the last count
    rep("date: e ? e.date : (scr === 'startweek' ? S.week : (sun < t ? sun : t))", "date: e ? e.date : (scr === 'startweek' ? S.week : sameDay(db, c, S.week, sun < t ? sun : t))")
    # actions
    rep("A.cleft = function (el) {", """A.switchAsk = function () { peopleFlush(); signOut(''); };
A.undoAsk = function () { openModal(undoModal); };
A.undoDo = function () { queue({ kind: 'day_undo', centre: S.sess.centre, date: S.date, byName: myName() || '' }); closeModal(); S.good = 'The data of today at ' + centreName(S.sess.centre) + ' was taken out. It can be written again.'; S.keepScroll = true; render(); };
A.absentAsk = function () { openModal(absentModal); };
A.absentDo = function () { saveEntry('dskip', '', { on: true, absent: true }); closeModal(); S.keepScroll = false; render(); };
function undoModal() {
  return sheet('undot', 'Undo the data of today?', '<p class="body-strong">' + esc(centreName(S.sess.centre)) + ', ' + dayName(S.date) + '</p><p>Portions, kitchen staff, menu, quantities and leftovers written today leave the app. The menu of the week and the stock in the fridge stay. Then the day can be written again.</p>', btn('Yes, undo', 'data-a="undoDo"', 'danger block'));
}
function absentModal() {
  return sheet('abst', 'Nobody at the centre?', '<p class="body-strong">' + esc(centreName(S.sess.centre)) + ', ' + dayName(S.date) + '</p><p>The day will have no data. It does not count as zero in the overview. It can be undone.</p>', btn('Yes, nobody was there', 'data-a="absentDo"', 'danger block'));
}
/* the count of the fridge on the same day of the week as the last count (Daniela, 26/11) */
function sameDay(db, c, mon, dflt) {
  var last = null; db.entries.forEach(function (e) { if (!e.del && e.type === 'endweek' && e.centre === c && e.date < mon && (!last || e.date > last.date)) last = e; });
  if (!last) return dflt; var d = eatAddDays(mon, (eatWeekday(last.date) + 6) % 7); return d <= todayStr() ? d : dflt;
}
A.cleft = function (el) {""")
    # Excel: the portions remained in the sheet People
    rep("  E.forEach(function (e) { if (e.type === 'staff') people.rows.push(", "  E.forEach(function (e) { if (e.type === 'dafter' && e.data.pr != null) people.rows.push([e.date, WD[eatWeekday(e.date)], centreName(e.centre), 'Portions remained', e.data.pr, '', '', e.byName || '', e.at || '']); });\n  E.forEach(function (e) { if (e.type === 'staff') people.rows.push(")
    # Daniela, 26/11: "let's change perspective: we will count portions, not people". In the words on screen only:
    # plate(s) -> portion(s), and the step and the tab of the count. Keys and names in the code stay.
    def words(m):
        lit = m.group(0)
        if lit in ("'plates'",) : return lit
        lit = re.sub(r'\bplates\b', 'portions', lit); lit = re.sub(r'\bplate\b', 'portion', lit)
        lit = re.sub(r'\bPlates\b', 'Portions', lit); lit = re.sub(r'\bPlate\b', 'Portion', lit)
        for a, b in [('Count the people', 'Count the portions'), ("I didn\\'t count the people", "I didn\\'t count the portions"), ('People not counted', 'Portions not counted'),
                     ('People: to do', 'Portions: to do'), ('To write in People', 'To write in Portions'), ('Save and count the people', 'Save and count the portions'),
                     ('Kitchen staff: not written (People)', 'Kitchen staff: not written (Portions)'), ('Count the people of today', 'Count the portions of today')]:
            lit = lit.replace(a, b)
        return lit
    k = s.index("<script"); s = s[:k] + re.sub(r"'(?:[^'\\\n]|\\.)*'", words, s[k:])
    s = s.replace("['people', 'People', 'people']", "['people', 'Portions', 'people']")
    s = s.replace("plural(d.n, 'portion', 'plates')", "plural(d.n, 'portion', 'portions')")
    s = re.sub(r"'portion', 'plates'\)", "'portion', 'portions')", s)
    return s
