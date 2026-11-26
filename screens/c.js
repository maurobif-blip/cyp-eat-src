/* the window: auto = opened by itself after sign in, else from More or Settings */
function installModal() {
  var auto = S.instAuto, done = isInstalled() && !S.installEvt;
  return sheet('it', 'Put CYP EAT on this ' + deviceWord(),
    (done ? '<p>CYP EAT is already on this ' + deviceWord() + '. Open it from the home screen or the list of apps.</p>' : (S.installEvt ? '' : '<p>' + installHow() + '</p>')) +
    small('Open it once with internet. After that it opens without internet, and what you save is sent when internet comes back.') +
    (auto ? (S.installEvt ? btn('Not now', 'data-a="installNo"') : '<div class="two">' + btn('Already done', 'data-a="installNo"') + btn('Not now', 'data-a="installNo"') + '</div>') : ''),
    !done && S.installEvt ? btn('Install CYP EAT', 'data-a="install" data-focus', 'primary block') : '');
}
/* after sign in, once: only where installing is possible (Chrome and Edge say so; iPhone, Android and Safari always) */
function installAsk() {
  if (S.instAsked || S.modal || !S.sess || isInstalled() || KV.get('installNo', false)) return;
  var k = installKind();
  if ((k === 'chromium' || k === 'firefox') && !S.installEvt) return;
  S.instAsked = true; S.instAuto = true; openModal(installModal);
}
function installBox() {
  if (isInstalled() || KV.get('installNo', false)) return '';
  return card(h3('Put CYP EAT on this ' + deviceWord()) + (S.installEvt ? btn('Install CYP EAT', 'data-a="install"') : '<p>' + installHow() + '</p>') + btn('Not now', 'data-a="installNo"'));
}
function installCard() { return btn('Put CYP EAT on this ' + deviceWord(), 'data-a="installOpen"', '', 'phone'); }
var SCREENS = {};
SCREENS.nolink = function () {
  var canPaste = navigator.clipboard && navigator.clipboard.readText;
  return projectLogo() + title('Open the link you received') +
    '<p>Tap the CYP EAT link in the message (WhatsApp, SMS, e-mail).</p>' +
    '<p>If CYP EAT is already on the home screen and opens this page: copy the link from the message and paste it here. This is needed only once.</p>' +
    (canPaste ? btn('Paste the link', 'data-a="linkClip"', 'primary block') : '') +
    card(field('The link', 'lk', '<input id="lk" class="cyp-input" type="url" autocomplete="off" autocapitalize="off" data-f="lk" value="' + esc(S.f.lk || '') + '">') +
      (S.msg ? banner('danger', esc(S.msg), 'alert') : '') + btn('Open', 'data-a="linkOpen"', canPaste ? '' : 'primary block'));
};
SCREENS.setup = function () {
  function pf(id, lab) { return field(lab, id, '<input id="' + id + '" class="cyp-input" inputmode="numeric" type="password" maxlength="4" autocomplete="off" data-f="' + id + '" value="' + esc(S.f[id] || '') + '">'); }
  return title('First use: the two PINs') +
    card(h3('Data entry PIN') + small('For everyone who counts. 4 numbers.') + pf('p1', 'PIN') + pf('p2', 'PIN again')) +
    card(h3('Overview PIN') + small('For who sees all the centres and changes the settings. 4 numbers.') + pf('p3', 'PIN') + pf('p4', 'PIN again')) +
    (S.msg ? banner('danger', esc(S.msg), 'alert') : '') +
    btn('Save the PINs', 'data-a="setupSave"' + (S.busy ? ' disabled' : ''), 'primary block');
};
SCREENS.signin = function () {
  return projectLogo() + title('Sign in') + installBox() +
    modeBtn('entry', 'food', 'Enter data', 'Food and people', true) + modeBtn('delivery', 'truck', 'Deliveries', 'Photo of the delivery note') + modeBtn('admin', 'chart', 'Overview', 'All centres') +
    (S.online ? '' : banner('warn', 'No internet. You can sign in only on a phone where you already signed in with internet.')) +
    '<p class="small muted center">CYP EAT ' + EAT_VERSION + '</p>';
};
/* the three accesses: the one most people use is the main button */
function modeBtn(m, icon, label, sub, pri) { return '<div class="cyp-field">' + btn(label, 'data-a="mode" data-m="' + m + '"', pri ? 'primary block' : 'block', icon) + '<span class="cyp-field__help center">' + sub + '</span></div>'; }
SCREENS.pin = function () {
  var dots = ''; for (var i = 0; i < 4; i++) dots += '<i class="' + (i < S.pin.length ? 'f' : '') + '"></i>';
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(function (k) {
    if (k === 'del') return btn('Delete', 'data-a="key" data-k="del"');
    if (k === 'ok') return btn('OK', 'data-a="key" data-k="ok"' + (S.pin.length < 4 || S.busy ? ' disabled' : ''), 'primary');
    return btn(k, 'data-a="key" data-k="' + k + '"');
  }).join('');
  return backBtn('signin', 'Back') +
    '<h1 class="heading-2 center">' + ({ entry: 'Data entry PIN', admin: 'Overview PIN', delivery: 'Deliveries PIN' }[S.pinMode]) + '</h1>' +
    '<div class="dots" aria-live="polite">' + dots + '</div>' +
    (S.msg ? banner('danger', esc(S.msg), 'alert') : '') +
    '<div class="keys three heading-2">' + keys + '</div>';
};
SCREENS.name = function () {
  var names = (view().names || []).filter(function (n) { return n.active; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  var last = KV.get('me', {}).nid;
  return title('Who are you?') + (names.length ? names.map(function (n) {
    return '<div class="cyp-field">' + btn(esc(n.name), 'data-a="pickName" data-id="' + esc(n.id) + '"', 'block') + '<span class="cyp-field__help center">' + esc(n.role) + (n.id === last ? ' · Last time' : '') + '</span></div>';
  }).join('') : '<p>No names yet. The overview adds them in Settings.</p>') +
    installCard() + btn('Sign out', 'data-a="signout"');
};
SCREENS.centre = function () {
  var me = KV.get('me', {}), lastC = me.nid === S.sess.nid ? me.centre : '';
  return backBtn('name', 'Back') + title('Which centre are you counting for?') + '<p class="body-strong muted">' + esc(S.sess.name) + '</p>' +
    canteens(view()).map(function (c) { return '<div class="cyp-field">' + btn(esc(shown(c.name)), 'data-a="pickCentre" data-id="' + c.id + '"', 'block') + (c.id === lastC ? '<span class="cyp-field__help center">Last time</span>' : '') + '</div>'; }).join('');
};
/* More: who is signed in, and the tools that are not a page. The same place in the three CYP apps. */
SCREENS.more = function () {
  var m = S.sess.mode, who;
  if (m === 'entry') {
    var wl = [myName(), S.sess.centre ? centreName(S.sess.centre) : ''].filter(Boolean);
    who = row('user', esc(myName() || 'Enter data'), S.sess.centre ? esc(centreName(S.sess.centre)) : '', '<button class="cyp-btn who" data-a="who" aria-label="' + esc(wl.join(', ')) + ': change">Change</button>');
  } else who = row('user', m === 'admin' ? 'Overview' : 'Deliveries', m === 'admin' ? 'All centres' : '', '<button class="cyp-btn who" data-a="signout">Sign out</button>');
  return '<button class="cyp-btn start bk" data-a="moreBack">' + ic('back') + 'Back</button>' + title('More') + list(who) +
    '<button class="cyp-btn cbtn" data-a="comment">' + ic('talk') + 'Comment</button>' +
    (isInstalled() ? '' : installCard()) +
    '<p class="small muted center">CYP EAT ' + EAT_VERSION + '</p>';
};

/* ---------- day bar ---------- */
/* the day is not changed with arrows: the button opens the calendar, where the day is confirmed (comment of 20/11, against wrong days) */
function dayBar() {
  var t = todayStr(), isT = S.date === t;
  return list(row('cal', dayName(S.date), '', '<button class="cyp-btn" data-a="dayAsk" aria-label="' + dayName(S.date) + ': open the calendar to change the day">Choose the day</button>',
    tag(isT ? '' : 'warn', isT ? 'Today' : 'Not today'), 'daybar'));
}
/* before counting, the person sees the calendar and confirms the day (comments of 20/11: people think more and make fewer mistakes).
   Asked at each sign in, when the date changes, after 30 minutes away, and from the day bar */
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DAYSCR = { people: 1, today: 1, menu: 1, before: 1, after: 1 };
function askDay(keep) { S.dayOk = false; S.pick = keep && S.date ? S.date : todayStr(); S.calM = S.pick.slice(0, 8) + '01'; }
function needDay() { return !!(S.sess && S.sess.mode === 'entry' && S.sess.centre && !S.dayOk && DAYSCR[S.scr]); }
function dayPickScreen() {
  var db = view(), t = todayStr(), c = S.sess.centre, pick = S.pick || t, m0 = S.calM || pick.slice(0, 8) + '01', meals = countMeals();
  var y = Number(m0.slice(0, 4)), mo = Number(m0.slice(5, 7)), n = new Date(Date.UTC(y, mo, 0)).getUTCDate(), off = (eatWeekday(m0) + 6) % 7, cells = '';
  for (var i = 0; i < off; i++) cells += '<i></i>';
  for (var d = 1; d <= n; d++) {
    var ds = m0.slice(0, 8) + (d < 10 ? '0' : '') + d, on = ds === pick, fut = ds > t, st = '';
    if (!fut) { var some = 0, done = 0; meals.forEach(function (m) { var p = eatGet(db, 'people', c, ds, m); if (p) { some++; if (p.data.done) done++; } }); st = some ? (done === meals.length ? 'done' : 'count') : ''; }
    cells += '<label' + (ds === t ? ' class="tod"' : '') + '><input type="radio" name="calday" data-a="calDay" data-d="' + ds + '" aria-label="' + dayName(ds) + (ds === t ? ', today' : '') + (st ? ', ' + (st === 'done' ? 'all meals finished' : 'counting') : '') + '"' + (on ? ' checked' : '') + (fut ? ' disabled' : '') + '><span>' + d + (st ? '<i class="sd' + (st === 'done' ? ' done' : '') + '"></i>' : '') + '</span></label>';
  }
  var cur = m0 === t.slice(0, 8) + '01', isT = pick === t;
  return title('Which day are you counting?') +
    list(row('', esc(centreName(c)), 'Centre', btn('Change the centre', 'data-a="centreAsk"'))) +
    '<p class="muted">Look at the day, then confirm.</p>' +
    card(pager(MONTHS[mo - 1] + ' ' + y, 'calMonth', -1, 1, cur) +
      '<fieldset class="cyp-choice" aria-label="Day"><div class="cal label-caps muted" aria-hidden="true">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (h) { return '<b>' + h + '</b>'; }).join('') + '</div>' +
      '<div class="cyp-choice__row cal">' + cells + '</div></fieldset>' +
      '<p class="small muted"><i class="sd"></i> counting &nbsp; <i class="sd done"></i> all meals finished</p>') +
    banner(isT ? 'ok' : 'warn', '<strong>' + dayName(pick) + '</strong> · ' + (isT ? 'today' : (pick === eatAddDays(t, -1) ? 'yesterday, not today' : 'not today'))) +
    btn('Yes, count ' + dayName(pick) + ' · ' + esc(centreName(c)), 'data-a="dayConfirm"', 'primary block', 'check') +
    (isT ? '' : btn('Back to today', 'data-a="calToday"'));
}
function mealSeg() {
  var ms = countMeals();
  if (ms.length < 2) return ''; /* one meal to count: nothing to choose */
  return choice('', ms.map(function (m) { var st = m === S.meal ? curState() : savedState(eatGet(view(), 'people', S.sess.centre, S.date, m)); return { l: m, on: m === S.meal, at: 'data-a="meal" data-m="' + m + '" aria-label="' + m + ': ' + STLAB[st].toLowerCase() + '"' }; }), { aria: 'Meal', name: 'meal' });
}
