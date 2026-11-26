var NAV = { today: 'today', people: 'people', menu: 'today', before: 'today', after: 'today', week: 'week', startweek: 'week', endweek: 'week', deliveries: 'week', note: 'week', overview: 'overview', settings: 'settings', deliver: 'deliver', more: 'more' };
/* More remembers the page the person came from and what was written on it: a comment is about that page, and Back returns to it with nothing lost */
function go(scr) { peopleFlush(); if (scr === 'settings') S.setSec = ''; if (scr === 'more' && S.scr !== 'more') { S.from = S.scr; S.keepF = S.f; } S.scr = scr; S.f = {}; S.msg = ''; S.notice = ''; S.good = ''; enter(scr); render(); }

function backFromMore(msg) {
  var to = S.from && SCREENS[S.from] ? S.from : (S.sess.mode === 'admin' ? 'overview' : (S.sess.mode === 'delivery' ? 'deliver' : 'today'));
  S.scr = to; S.msg = ''; S.notice = ''; S.good = msg || '';
  if (to === 'people' || !S.keepF) enter(to); else S.f = S.keepF;
  S.keepF = null; render();
}
