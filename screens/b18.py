# beta 1.8 (Mauro, 26/11): the count of the fridge without a scale. Run by assemble.py after b17.
def b18(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # the form: the unit of each row, the "about" marks, the kg of a bag (as saved, else from the last count of the centre)
    i = s.index("S.f = { kind: scr, date:"); j = s.index("};", i) + 2
    s = s[:j] + """
    S.f.cu = {}; S.f.ab = e && e.data.ab ? JSON.parse(JSON.stringify(e.data.ab)) : {};
    db.items.forEach(function (it) { var a = e && e.data.alt ? e.data.alt[it.id] : null; if (a) { S.f.cu[it.id] = a.u; S.f.q[it.id] = a.n; if (a.k) S.f['bk_' + it.id] = a.k; } else if (it.unit === 'kg') { var lk = lastBagKg(db, c, it.id); if (lk) S.f['bk_' + it.id] = lk; } });""" + s[j:]
    rep("(key === 'pcs' || key === 'pr' || nc || (S.f.u && S.f.u[key] === 'portion') ? '' :", "(key === 'pcs' || key === 'pr' || nc || (S.f.u && S.f.u[key] === 'portion') || (S.f.cu && S.f.cu[key] === 'pieces') ? '' :")
    rep("  if (el.hasAttribute('data-f')) S.f[el.getAttribute('data-f')] = el.value;", "  if (el.hasAttribute('data-f')) { S.f[el.getAttribute('data-f')] = el.value; if (el.getAttribute('data-f').indexOf('bk_') === 0) liveUpdate(); }")
    rep("function liveUpdate() {", "function liveUpdate() {\n  if (S.scr === 'endweek' || S.scr === 'startweek') view().items.forEach(function (it) { var cv = document.getElementById('cv_' + it.id); if (cv) cv.innerHTML = countConvLine(it); });")
    rep("A.cleft = function (el) {", """A.cunit = function (el) { S.f.cu[el.getAttribute('data-k')] = el.getAttribute('data-v'); S.keepScroll = true; render(); };
A.about = function (el) { var k = el.getAttribute('data-k'); S.f.ab[k] = !S.f.ab[k]; S.keepScroll = true; render(); };
A.cleft = function (el) {""")
    i = s.index("A.saveCount = function () {"); j = s.index("A.countDaySel = function", i)
    s = s[:i] + """A.saveCount = function () {
  var db = view(), f = S.f, miss = db.items.filter(function (it) { return it.stock && !f.nc[it.id] && eatNum(f.q[it.id]) == null; }).map(function (it) { return it.name; });
  if (miss.length) { S.notice = 'Write a number or tap Not counted: ' + miss.join(', ') + '.'; return render(); }
  var d = qData(), alt = {}, ab = {}, anyAlt = false, anyAb = false, bad = [];
  db.items.forEach(function (it) {
    if (!it.stock || f.nc[it.id]) return;
    if (f.ab[it.id]) { ab[it.id] = true; anyAb = true; }
    var cu = countUnit(it); if (cu === 'unit') return;
    var n = eatNum(f.q[it.id]), k = cu === 'bags' ? eatNum(f['bk_' + it.id]) : null;
    if (cu === 'bags' && !(k > 0)) { bad.push(it.name); return; }
    alt[it.id] = cu === 'bags' ? { n: n, u: 'bags', k: k } : { n: n, u: 'pieces' }; anyAlt = true; d.q[it.id] = countStore(it, cu, n, k);
  });
  if (bad.length) { S.notice = 'Write about how many kg one bag holds: ' + bad.join(', ') + '.'; return render(); }
  if (anyAb) d.ab = ab; if (anyAlt) d.alt = alt;
  saveEntry(f.kind, '', d, f.date); S.notice = ''; go('week');
  S.good = (f.kind === 'startweek' ? 'Start of the week' : 'Stock in the fridge') + ' saved, ' + dayName(f.date) + '.'; render();
};
""" + s[j:]
    # overview and Excel: a count marked "about" says so
    rep("' · counted <strong>' + fmt(x.counted) + '</strong>'));", "' · counted <strong>' + (x.about ? 'about ' : '') + fmt(x.counted) + '</strong>'));")
    rep("(x.counted === null ? 'Not counted' : fmt(x.counted)), (x.diff == null", "(x.counted === null ? 'Not counted' : (x.about ? 'about ' : '') + fmt(x.counted)), (x.diff == null")
    rep("eatItem(db, k).unit, e.byName]); } }", "eatItem(db, k).unit + (e.data.ab && e.data.ab[k] ? ' (about)' : '') + (e.data.alt && e.data.alt[k] ? ' (written: ' + e.data.alt[k].n + ' ' + e.data.alt[k].u + (e.data.alt[k].k ? ' of about ' + e.data.alt[k].k + ' kg' : '') + ')' : ''), e.byName]); } }")
    return s

def b18b(s):
    def rep(a, b, n=1):
        nonlocal s
        assert s.count(a) == n, (s.count(a), a[:90]); s = s.replace(a, b)
    # ---- delivery notes (butchery, 26/11: "often: impossible to read the photo, or very slow"): the form opens at once with the photo;
    # the photo is read behind it and only fills what is still empty; a failed reading is a line on the form, not a stop
    i = s.index("A.photo = function (el) {"); j = s.index("A.dvRetry = function", i)
    s = s[:i] + """A.photo = function (el) {
  var f = el.files && el.files[0]; if (!f) return;
  S.dv = { step: 'reading' }; render();
  shrinkPhoto(f, function (url) {
    try { el.value = ''; } catch (e) {}
    if (!url) return dvError('Not read', 'This picture cannot be opened. Take the picture again.', false);
    var rd = S.rd = { img: url, data: url.split(',')[1], state: navigator.onLine ? 'reading' : 'offline', t0: Date.now(), id: uid(), i: 0, saved: [] };
    S.dv = { step: 'start' }; S.dvBack = null; S.notePre = null; S.noteNo = ''; go('note'); S.f.rdId = rd.id; render(); rdRead(rd);
  });
};
function rdRead(rd) {
  if (rd.state === 'offline') return;
  clearInterval(S.rdTick); S.rdTick = setInterval(function () { var el = document.getElementById('rdsec'); if (el && S.rd === rd && rd.state === 'reading') el.textContent = Math.round((Date.now() - rd.t0) / 1000); else if (rd.state !== 'reading') clearInterval(S.rdTick); }, 1000);
  post({ action: 'read', mode: S.sess.mode, cred: S.sess.cred, image: rd.data }, 90000).then(function (res) {
    if (res && res.error === 'pin') return signOut('The deliveries PIN has changed. Sign in again.');
    if (res && res.photo) rd.photo = res.photo;
    var all = res && res.ok ? (res.reads || [res.read || {}]) : [];
    rd.reads = all.filter(function (r) { var hq = false; for (var k in (r.q || {})) hq = true; return r.no || r.centre || hq; });
    rd.state = rd.reads.length ? 'read' : 'failed';
    rd.why = res && !res.ok ? ({ no_reader: 'the photo reader is not set up', reader_busy: 'the photo reader is busy', reader_key: 'the key of the photo reader is wrong' }[res.error] || 'the photo reader gave an error') : (rd.reads.length ? '' : 'the photo is not clear');
    rdApply(rd);
  }).catch(function (e) { rd.state = 'failed'; rd.why = e && e.message === 'timeout' ? 'it took more than 90 seconds' : 'no internet'; rdApply(rd); });
}
function rdApply(rd) {
  /* the note was saved before the reading came back: the photo is added to it */
  if (rd.savedNo && rd.photo) { var n = eatNote(view(), rd.savedNo); if (n && !n.data.photo) { var d = JSON.parse(JSON.stringify(n.data)); d.photo = rd.photo; queueNote(n.centre, n.date, d); } rd.savedNo = ''; }
  var f = S.f;
  if (S.scr === 'note' && f && f.rdId === rd.id) { if (rd.photo) f.photo = rd.photo; if (rd.reads && rd.reads[rd.i]) rdFill(f, rd.reads[rd.i]);
    /* the form is redrawn at once, also while someone types in it: what was typed is in S.f, and the box keeps the focus */
    var ae = document.activeElement, aid = ae && ae.id && (ae.tagName === 'INPUT' || ae.tagName === 'SELECT') ? ae.id : ''; S.keepScroll = true; if (!S.modal) render(); if (aid) { var ne = document.getElementById(aid); if (ne) { try { ne.focus({ preventScroll: true }); } catch (x) {} } } }
}
/* what the photo says goes only where the form is still empty: what the person wrote stays */
function rdFill(f, r) {
  if (!f.no && r.no) f.no = String(r.no);
  if (r.date && r.date <= todayStr() && (!f.date || f.date === todayStr())) f.date = r.date;
  if (!f.centre && r.centre) f.centre = r.centre;
  var anyq = false; for (var k in (f.q || {})) if (eatNum(f.q[k]) != null) anyq = true;
  if (!anyq && r.q) f.q = JSON.parse(JSON.stringify(r.q));
  if (!(f.parts || []).length && r.parts) f.parts = JSON.parse(JSON.stringify(r.parts));
  if (!f.remark && r.remark) f.remark = r.remark;
  if (!f.recv && r.recv) f.recv = r.recv;
}
function rdBox(f) {
  var rd = S.rd; if (!rd || f.rdId !== rd.id) return '';
  var img = '<img class="photo rdimg" src="' + rd.img + '" alt="The photo of the delivery note">';
  if (rd.state === 'reading') return img + '<p role="status" class="small">Reading the photo… <strong class="num" id="rdsec">' + Math.round((Date.now() - rd.t0) / 1000) + '</strong> s. You can write the note meanwhile.</p>';
  if (rd.state === 'offline') return img + banner('warn', 'No internet: write the note by hand. The photo is not sent.');
  if (rd.state === 'failed') return img + banner('warn', 'The photo could not be read (' + esc(rd.why) + '). Write the note here' + (rd.photo ? ': the photo is kept with it.' : '.'));
  return img + banner('warn', 'Filled in from the photo: check every number with the paper.' + (rd.reads.length > rd.i + 1 ? ' The photo has ' + rd.reads.length + ' notes: the next one opens after you save this one.' : ''));
}
""" + s[j:]
    rep("""    title(f.orig ? 'Delivery note ' + esc(f.orig) : 'New delivery note') +
    (f.photo ?""", """    title(f.orig ? 'Delivery note ' + esc(f.orig) : 'New delivery note') + rdBox(f) +
    (f.photo && !(S.rd && f.rdId === S.rd.id) ?""")
    rep("""  if (dl) {
    /* back to the photos: the next note of the same picture, or the thank you */""", """  var rd = f.rdId && S.rd && S.rd.id === f.rdId ? S.rd : null;
  if (rd) {
    rd.saved.push(no); if (!f.photo) rd.savedNo = no; rd.i++;
    if (rd.reads && rd.i < rd.reads.length) { S.noteNo = ''; S.notePre = null; go('note'); S.f.rdId = rd.id; if (rd.photo) S.f.photo = rd.photo; rdFill(S.f, rd.reads[rd.i]); S.good = 'Note ' + no + ' saved. Now the next note of the photo.'; return render(); }
    if (dl) { S.dv = { step: 'saved', nos: rd.saved, unclear: 0 }; return go('deliver'); }
  }
  if (dl) {
    /* back to the photos: the next note of the same picture, or the thank you */""")
    # ---- a way back on every screen (Daniela, 26/11: "a back option at every stage of the app"), and the back key of the phone
    rep("function go(scr) { peopleFlush();", "function go(scr, back) { if (!back && S.sess && S.scr && S.scr !== scr) { S.hist = (S.hist || []).concat([S.scr]).slice(-20); try { history.pushState({ eat: 1 }, ''); } catch (e) {} }\n  peopleFlush();")
    rep("  if (!S.modal) { var af = app.querySelector('[data-focus]');", "  if (S.sess && !app.querySelector('main .bk, main [data-a=\"ovBack\"]') && !(S.scr === 'overview' && S.ovOn) && backTarget()) app.querySelector('main').insertAdjacentHTML('afterbegin', '<button class=\"cyp-btn start bk\" data-a=\"histBack\">' + ic('back') + 'Back</button>');\n  if (!S.modal) { var af = app.querySelector('[data-focus]');")
    rep("A.cleft = function (el) {", """/* back: the screen before; on the first screen of the day, the choice of the day; then the centre, the name, the first page */
function backTarget() {
  var gate = needDay();
  if (gate) return 'centre';
  if (S.scr === 'name') return 'signin';
  /* the pages of the bar are the top: their back is the choice of the day (Enter data), not the page seen before */
  if (navItems().some(function (x) { return x[0] === S.scr; })) return S.sess.mode === 'entry' ? 'day' : '';
  var h = (S.hist || []).filter(function (x) { return x !== S.scr && SCREENS[x] && ['pin', 'signin', 'name', 'centre'].indexOf(x) < 0; });
  if (h.length) return h[h.length - 1];
  if (S.sess.mode === 'entry' && DAYSCR[S.scr]) return 'day';
  return '';
}
A.histBack = function () {
  var to = backTarget(); if (!to) return;
  if (to === 'signin') return signOut('');
  if (to === 'day') { askDay(true); S.hist = []; return render(); }
  if (to === 'centre') { S.hist = []; return go('centre', true); }
  while (S.hist && S.hist.length && S.hist[S.hist.length - 1] !== to) S.hist.pop();
  if (S.hist) S.hist.pop();
  go(to, true);
};
window.addEventListener('popstate', function () { if (S.sess && !S.modal && backTarget()) A.histBack(); });
A.cleft = function (el) {""")
    # the history starts again at each sign in, centre and day: back from the first screen of the day is the choice of the day
    rep("function signOut(msg) { S.sess = null;", "function signOut(msg) { S.hist = []; S.sess = null;")
    rep("A.pickCentre = function (el) { S.sess.centre = el.getAttribute('data-id');", "A.pickCentre = function (el) { S.hist = []; S.sess.centre = el.getAttribute('data-id');")
    rep("A.dayConfirm = function () {", "A.dayConfirm = function () { S.hist = [];")
    return s
