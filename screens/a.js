/* ===================== screens ===================== */
/* The screens are made of the pieces of the CYP design system (ds/bundle.css): Button, StatusTag, SyncBanner, Field, Choice, ListRow, Card. */
function btn(label, at, kind, icon) { return '<button class="cyp-btn' + (kind ? ' cyp-btn--' + kind.split(' ').join(' cyp-btn--') : '') + '"' + (at ? ' ' + at : '') + '>' + (icon ? ic(icon) : '') + label + '</button>'; }
function backBtn(to, label) { return '<button class="cyp-btn start bk" data-a="go" data-to="' + to + '">' + ic('back') + label + '</button>'; }
/* a state in one or two words: ok with a check, warn with a triangle, danger with a cross, or plain */
var TAGIC = { ok: 'check', warn: 'alert', danger: 'x' };
function tag(tone, text) { return '<span class="cyp-tag' + (tone ? ' cyp-tag--' + tone : '') + '">' + (tone ? ic(TAGIC[tone]) : '') + text + '</span>'; }
var BANIC = { ok: 'okc', warn: 'alert', danger: 'alert' };
function banner(tone, html, role, end) { return '<div class="cyp-banner' + (tone ? ' cyp-banner--' + tone : '') + '" role="' + (role || 'status') + '">' + ic(BANIC[tone] || 'info') + '<span>' + html + '</span>' + (end || '') + '</div>'; }
function title(t) { return '<h1 class="heading-2">' + t + '</h1>'; }
function h2(t) { return '<h2 class="heading-3">' + t + '</h2>'; }
function h3(t) { return '<h3 class="heading-3">' + t + '</h3>'; }
function card(inner, at) { return '<div class="cyp-card cyp-card--stack"' + (at ? ' ' + at : '') + '>' + inner + '</div>'; }
function field(label, id, input, help) { return '<div class="cyp-field"><label for="' + id + '">' + label + '</label>' + input + (help ? '<span class="cyp-field__help">' + help + '</span>' : '') + '</div>'; }
function small(t) { return '<p class="small muted">' + t + '</p>'; }
/* one record of a list: disc, title, one line of detail, then a tag under the text and one labelled button at the end */
function row(icon, head, detail, end, under, cls) {
  return '<div class="cyp-row' + (cls ? ' ' + cls : '') + '">' + (icon ? '<span class="cyp-disc cyp-disc--sm cyp-c-blue">' + ic(icon) + '</span>' : '') +
    '<div class="cyp-row__text"><b>' + head + '</b>' + (detail ? '<span>' + detail + '</span>' : '') + (under ? '<div class="cyp-row__tags">' + under + '</div>' : '') + '</div>' + (end || '') + '</div>';
}
/* a row that opens a record: the whole row is the tap target, from edge to edge, and ends with chevron-right (ListRow). No Open button */
function goIc() { return '<svg class="cyp-icon cyp-go" viewBox="0 0 24 24" aria-hidden="true">' + IC.next + '</svg>'; }
function linkRow(icon, head, detail, at, under, cls) {
  return '<a href="#" class="cyp-row cyp-row--link' + (cls ? ' ' + cls : '') + '" ' + at + '>' + (icon ? '<span class="cyp-disc cyp-disc--sm cyp-c-blue">' + ic(icon) + '</span>' : '') +
    '<span class="cyp-row__text"><b>' + head + '</b>' + (detail ? '<span>' + detail + '</span>' : '') + (under ? '<span class="cyp-row__tags">' + under + '</span>' : '') + '</span>' + goIc() + '</a>';
}
/* the places this kitchen also cooks for on a day, from the plan of the week: "Chinika and Ukubalula" */
function othersOf(db, c, d) { var day = eatPlanDay(db, c, d), o = day && day.o ? day.o : {}, out = []; for (var k in o) if (o[k] > 0) out.push({ name: k, n: o[k] }); return out; }
function othersWords(db, c, d) { return listWords(othersOf(db, c, d).map(function (x) { return esc(x.name); })); }
/* the plates of a meal nobody counts: the number of the plan of the week, or the fixed number */
/* the kitchen staff who ate on a day (beta 1.6): a number or null */
function staffOf(db, c, d) { var e = eatGet(db, 'staff', c, d, ''); return e ? e.data.n : null; }
/* who ate the food taken out on a day, in words: counted, from the plan, cooked for other places, kitchen staff */
function ateWords(db, c, d, u) {
  var fx = 0, parts = [], cm = eatCentre(db, c), ms = cm ? cm.meals : [];
  ms.forEach(function (m) { if (eatFixed(db, c, m) != null) { var pf = planOrFixed(db, c, d, m); if (pf[0]) { fx += pf[0]; parts.push(pf[0] + ' ' + (m === 'Dinner' ? 'dinner (sapa)' : m.toLowerCase()) + (pf[1] ? ' in the plan' : '')); } } });
  if (u.plates - fx > 0) parts.unshift((u.plates - fx) + ' counted');
  if (u.cooked) parts.push(u.cooked + ' for ' + othersWords(db, c, d));
  if (u.staff) parts.push(u.staff + ' kitchen staff');
  return parts.join(' + ');
}
/* the leftovers of one food in words: in the unit of use, and in portions of the plan of the day; chicken in pieces */
function leftWords(db, c, d, it, use, pieces) {
  if (it.id === 'chk' && pieces != null) return fmt(pieces) + ' pieces';
  if (use == null) return '';
  var ps = eatPortionSize(db, c, d, it.id), pz = ps ? Math.round(use / ps) : null;
  return fmt(use) + ' ' + esc(it.use) + (pz != null && it.id !== 'chk' ? ' = ' + plural(pz, 'portion', 'portions') : '');
}
function planOrFixed(db, c, d, m) { var day = eatPlanDay(db, c, d); return day && day.p && day.p[m] != null ? [day.p[m], true] : [eatFixed(db, c, m), false]; }
function list(rows) { return '<div class="cyp-rows">' + rows + '</div>'; }
/* one answer out of two or three, all on the screen (Choice). many: several answers can be on. No span inside a label: the stylesheet draws every span as an option */
var CHN = 0;
function choice(legend, opts, o) {
  o = o || {}; var nm = o.name || ('ch' + (CHN++));
  return '<fieldset class="cyp-choice' + (o.cols === 2 ? ' cyp-choice--two' : '') + '"' + (legend ? '' : ' aria-label="' + esc(o.aria || '') + '"') + '>' + (legend ? '<legend>' + legend + '</legend>' : '') +
    '<div class="cyp-choice__row">' + opts.map(function (x) {
      return '<label><input type="' + (o.many ? 'checkbox' : 'radio') + '" name="' + nm + '" ' + x.at + (x.on ? ' checked' : '') + (x.dis ? ' disabled' : '') + '><span>' + x.l + '</span></label>';
    }).join('') + '</div></fieldset>';
}
/* four options or more: a select inside a Field */
function selectField(label, id, opts, cur, act, help) {
  return field(label, id, '<select id="' + id + '" class="cyp-input" data-a-change="' + act + '">' + opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(cur == null ? '' : cur) ? ' selected' : '') + (x[2] ? ' disabled' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>', help);
}
/* one step back or forward in time (Pager): Before, the period written in full, After */
function pager(now, act, before, after, last) {
  return '<div class="cyp-pager"><button class="cyp-btn" data-a="' + act + '" data-d="' + before + '">' + ic('back') + 'Before</button><span class="cyp-pager__now">' + now + '</span><button class="cyp-btn" data-a="' + act + '" data-d="' + after + '"' + (last ? ' disabled' : '') + '>After' + ic('next') + '</button></div>';
}
function dmy(s) { return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4); }
/* the window over a screen for one task (Sheet): title and Close at the top, the fields, one primary button at the bottom. Close never saves */
function sheet(id, name, body, foot) {
  return '<div class="cyp-sheet-layer" role="dialog" aria-modal="true" aria-labelledby="' + id + '"><div class="cyp-sheet"><div class="cyp-sheet__head"><h2 id="' + id + '" class="heading-2">' + name + '</h2>' + btn('Close', 'data-a="modalClose"', '', 'x') + '</div>' +
    '<div class="cyp-sheet__body">' + body + '</div>' + (foot ? '<div class="cyp-sheet__foot">' + foot + '</div>' : '') + '</div></div>';
}
/* a list of figures (DataTable). A wide table scrolls inside its own box, the page never does */
/* o.go: for each row the attributes that open its record (the whole row opens, with chevron-right in a last narrow column); o.dense: smaller cells, for a wide table on a computer */
function table(head, rows, foot, o) {
  o = o || {}; var go = o.go;
  function tr(r, tg, at, last) { return '<tr' + (at ? ' class="cyp-tr--link" tabindex="0" ' + at : '') + '>' + r.map(function (x, i) { var n = head[i] && head[i][1]; return '<' + tg + (n ? ' class="num"' : '') + '>' + x + '</' + tg + '>'; }).join('') + (go ? last : '') + '</tr>'; }
  var named = head.some(function (h) { return h[0]; });
  return '<div class="cyp-scroll"><table class="cyp-table' + (o.dense ? ' cyp-table--dense' : '') + '">' + (named ? '<thead>' + tr(head.map(function (h) { return h[0]; }), 'th', '', '<th class="cyp-table__go"></th>') + '</thead>' : '') + '<tbody>' + rows.map(function (r, i) { return tr(r, 'td', go && go[i], go && go[i] ? '<td class="cyp-table__go">' + goIc() + '</td>' : '<td></td>'); }).join('') + '</tbody>' + (foot ? '<tfoot>' + tr(foot, 'td', '', '<td></td>') + '</tfoot>' : '') + '</table></div>';
}
/* the numbers of the tiles count up when a screen or a subject is new */
function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function countUp(root) {
  if (calm() || !window.requestAnimationFrame) return;
  [].forEach.call(root.querySelectorAll('[data-count]'), function (el) {
    var to = Number(el.getAttribute('data-count')), t0 = 0; if (!to) return;
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3); el.textContent = nf(to * e); if (k < 1 && el.isConnected) requestAnimationFrame(step); else el.textContent = nf(to); }
    el.textContent = '0'; requestAnimationFrame(step);
  });
}
function nf(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* The names of the places as the design system writes them. The database keeps its own spelling (Nkwazi): the screens and the exports show these. */
var PLACE_NAME = { 'Nkwazi': 'Nkwazi Centre', 'Luigi Centre': 'Luigi', 'Minsundu Centre': 'Minsundu' };
function shown(name) { return PLACE_NAME[name] || name; }
/* The fixed order and colours of the places (ColourKey): Luigi, Minsundu, Nkwazi Centre, then the others.
   Mary Christine and Ukubalula are two places since beta 1.3 (Mauro, 24/11): Ukubalula has no canteen, its meals are cooked at Minsundu. The plates of Holy Family are counted at Luigi and stay in its colour. */
var PLACE_ORDER = ['LUI', 'MIN', 'NKW', 'MCU', 'UKU'], PLACE_CLASS = { LUI: 'cyp-c-luigi', MIN: 'cyp-c-minsundu', NKW: 'cyp-c-nkwazi', MCU: 'cyp-c-mary-christine', UKU: 'cyp-c-ukubalula' };
function placeSort(a) { return a.map(function (c, i) { var k = PLACE_ORDER.indexOf(c.id); return [k < 0 ? 100 + i : k, c]; }).sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }); }
function canteens(db) { return placeSort(eatCanteens(db)); }
function places(db) { return placeSort(eatPlaces(db)); }
function placeClass(id) { return PLACE_CLASS[id] || 'cyp-c-other'; }

/* the pages go at the bottom on a phone and in a second row of the bar on a computer */
var WIDE = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: false }; /* screen-computer of the design system */
function hasNav() { return !!(S.sess && NAV[S.scr]); }
/* The app bar: wordmark, where the person is, and the state of the data with its word. Nothing else: Comment, Change and Sign out are under More.
   Without internet the banner stays under the bar. The first screens have no bar. */
function whereText() { var m = S.sess.mode; return m === 'admin' ? 'Overview' : (m === 'delivery' ? 'Deliveries' : (S.sess.centre ? centreName(S.sess.centre) + ', ' + (S.meal || countMeals()[0] || 'Lunch').toLowerCase() : 'Enter data')); }
function topBar() {
  if (!S.sess) return '';
  var st = !S.online ? ['wifioff', 'Offline'] : (S.queue.length ? ['sync', 'Sending'] : ['okc', 'Saved']);
  return '<header class="hdr"><div class="cyp-appbar cyp-appbar--fixed"><span class="cyp-appbar__plate"><img src="' + LOGO + '" alt="CYP EAT" width="133" height="28"></span><span class="cyp-appbar__where">' + esc(whereText()) + '</span>' +
    /* Comment: the only button of the bar, before the sync state, one tap from any page (AppBar, 24/11). More > Comment does the same */
    '<button class="cyp-appbar__action" data-a="comment" aria-label="Comment">' + ic('msg') + '</button>' +
    /* beta 1.7 (comment of 26/11 from the overview): back to the page with the three accesses, top right; the More page is gone */
    '<button class="cyp-appbar__action" data-a="switchAsk" aria-label="Change access: back to the first page">' + ic('logout') + '</button>' +
    (S.cfg ? '<span class="cyp-appbar__sync" role="status">' + ic(st[0]) + '<span class="synct">' + st[1] + '</span></span>' : '') + '</div>' + (WIDE.matches && hasNav() ? navBar(true) : '') + (S.scr === 'overview' && S.ovOn ? chapterNav() : '') +
    (S.cfg && !S.online ? banner('warn', 'No internet. Saved on this ' + deviceWord() + '. It will send by itself.' + (S.queue.length ? ' ' + S.queue.length + ' to send.' : '')) : '') + '</header>';
}
function centreName(id) { var c = eatCentre(view(), id); return c ? shown(c.name) : id; }
function centreMeals() { var c = eatCentre(view(), S.sess.centre); return c ? c.meals : ['Lunch']; }
/* the meals someone counts: without the meals that always have the same number of plates (dinner at Minsundu) */
function countMeals() { var ms = centreMeals().filter(function (m) { return eatFixed(view(), S.sess.centre, m) == null; }); return ms.length ? ms : centreMeals().slice(0, 1); }
function fixedMeals() { return centreMeals().filter(function (m) { return countMeals().indexOf(m) < 0; }); }
/* the main pages, then More: the tools that are not a page (Comment, Change, Sign out) */
function navItems() {
  var m = S.sess.mode;
  return (m === 'admin' ? [['overview', 'Overview', 'chart'], ['settings', 'Settings', 'gear']] : (m === 'delivery' ? [['deliver', 'Deliveries', 'truck']] : [['people', 'People', 'people'], ['today', 'Daily', 'food'], ['week', 'Weekly', 'week']]));
}
function navOn() { var s = S.scr, m = S.sess.mode; if (m === 'admin') return s === 'settings' ? s : 'overview'; if (m === 'delivery') return 'deliver'; return NAV[s]; }
function navBar(wide) {
  var on = navOn(), links = navItems().map(function (x) { return '<a href="#" class="navi' + (wide ? ' label-caps' : '') + '" data-a="go" data-to="' + x[0] + '"' + (x[0] === on ? ' aria-current="page"' : '') + '>' + (wide ? '' : ic(x[2])) + x[1] + '</a>'; }).join('');
  return wide ? '<nav class="cyp-nav" aria-label="Main">' + links + '</nav>' : '<nav class="cyp-tabbar cyp-tabbar--fixed" aria-label="Main">' + links + '</nav>';
}
/* what went wrong or is missing (danger), and what was saved (ok) */
function noticeHtml() {
  return (S.notice ? banner('danger', esc(S.notice), 'alert', btn('Close', 'data-a="hideNotice"')) : '') + (S.good ? banner('ok', esc(S.good)) : '');
}
function render() {
  var app = document.getElementById('app'), h = '';
  var scr = S.scr;
  var gate = needDay(); if (gate) scr = 'daypick';
  var fn = gate ? dayPickScreen : (SCREENS[scr] || SCREENS.signin);
  CHN = 0;
  var body = fn();
  /* a new screen comes in with a short movement; the same screen redrawn (a sync, a tap) does not move */
  var fresh = S.shown !== scr;
  var tabs = hasNav() && !WIDE.matches;
  /* forms and lists are narrow on a computer, the overview is wide; the first screens are centred and end with the thin chitenge strip */
  h = topBar() + '<main class="cyp-content' + (S.sess && S.sess.mode === 'admin' && scr === 'overview' ? ' cyp-content--wide' : '') + (S.sess ? '' : ' cyp-signin') + (fresh ? ' cyp-enter' : '') + '">' + noticeHtml() + body + '</main>';
  if (tabs) h += navBar(false);
  if (!S.sess) h += '<div class="cyp-chitenge"></div>';
  var y = window.scrollY, same = S.shown === scr;
  app.className = tabs ? 'cyp-has-tabbar' : '';
  app.innerHTML = h;
  /* a place too long for the bar is cut short there (AppBar): the first line of the page carries it in full */
  var w = app.querySelector('.cyp-appbar__where');
  if (w && w.textContent && w.scrollWidth > w.clientWidth + 1) app.querySelector('main').insertAdjacentHTML('afterbegin', '<p class="heading-3 place">' + w.innerHTML + '</p>');
  /* a new screen starts at the top; the same screen stays where the person is */
  if (S.keepScroll || same) window.scrollTo(0, y); else window.scrollTo(0, 0);
  /* numbers count once, when their page or chapter comes in */
  if (fresh || S.anim) countUp(app); S.anim = '';

