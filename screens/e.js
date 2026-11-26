/* on the page of a step: the note that it was marked, or at the bottom, with a red border, the button to mark it */
function skipNote(step) { var e = stepSkipped(step); return e ? banner('danger', SKIPTXT[step][1] + (e.byName ? ' (' + esc(e.byName) + ')' : '') + '. Write it here to add it.') : ''; }
function skipBtn(step) { return stepSkipped(step) ? '' : btn(SKIPTXT[step][0], 'data-a="stepSkip" data-s="' + step + '"', 'no'); }
var STEPIC = { menu: 'food', before: 'scale', people: 'people', after: 'box', endweek: 'week' };
/* the state of a step: Done, To do, or Not done (a step marked as not done, or a step of a past day or week left empty) */
var STEPTAG = { ok: ['ok', 'Done'], todo: ['', 'To do'], no: ['danger', 'Not done'] };
function stepRow(n, name, sub, to, state) {
  var tg = STEPTAG[state];
  return linkRow(STEPIC[to], n + '. ' + name, sub, 'data-a="go" data-to="' + to + '"', tag(tg[0], tg[1]), 'steprow step');
}
