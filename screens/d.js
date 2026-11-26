/* the state of a count: none (not counted), count (counting), done (finished), skip (marked as not counted) */
var STLAB = { none: 'Not counted', count: 'Counting', done: 'Finished', skip: 'People not counted' }, STPILL = { none: 'danger', count: '', done: 'ok', skip: 'danger' };
function savedState(p) { return !p ? 'none' : (p.data.skip ? 'skip' : (p.data.done ? 'done' : 'count')); }
function curState() { var saved = eatGet(view(), 'people', S.sess.centre, S.date, S.meal); return S.f.skip ? 'skip' : (S.f.done ? 'done' : (saved || S.pPend || eatPlates({ data: pData() }) ? 'count' : 'none')); }
function peopleStatus() {
  var saved = eatGet(view(), 'people', S.sess.centre, S.date, S.meal), d = pData(), st = curState(), sv = S.pPend || !samePeople(saved, d) ? ' · saving…' : ' · saved';
  if (st === 'none') return tag('danger', 'Not counted');
  if (st === 'skip') return tag('danger', 'People not counted' + sv);
  return tag(STPILL[st], STLAB[st] + ': ' + plural(eatPlates({ data: d }), 'plate', 'plates') + sv) + (centreGroups().length ? '<span class="small muted">' + peopleLine(d) + '</span>' : '');
}
SCREENS.people = function () {
  var db = view(), c = S.sess.centre, n = curCount(), gs = centreGroups(), st = curState();
  var all = countMeals().map(function (m) {
    var p = eatGet(db, 'people', c, S.date, m), ms = m === S.meal ? st : savedState(p), pl = m === S.meal ? eatPlates({ data: pData() }) : (p ? eatPlates(p) : 0);
    return row('', m, ms === 'none' || ms === 'skip' ? '' : plural(pl, 'plate', 'plates'), tag(STPILL[ms], STLAB[ms]));
  }).join('') + fixedMeals().map(function (m) { var pf = planOrFixed(db, c, S.date, m); return linkRow('', m, pf[0] + (pf[1] ? ' plates in the plan of the week' : ' plates every day') + ' · not counted' + (m === 'Dinner' && eatDinLeft(db, c) ? ' · eats the leftovers of lunch' : '') + ' · change it in the plan', 'data-a="planGo"'); }).join('') +
    othersOf(db, c, S.date).map(function (x) { return linkRow('', 'For ' + esc(x.name), x.n + ' plates in the plan of the week · cooked here, not counted', 'data-a="planGo"'); }).join('') +
    (fixedMeals().length ? linkRow('clip', 'Other places cooked for here', 'Chinika, Ukubalula: write them in the plan of the week', 'data-a="planGo"') : '');
  var grp = gs.length ? choice('', [''].concat(gs).map(function (k) { return { l: esc(k || centreName(c)) + ' <b class="num">' + (k ? (S.f.g[k] || 0) : S.f.n) + '</b>', on: (S.f.grp || '') === k, at: 'data-a="grp" data-g="' + esc(k) + '"' }; }), { aria: 'Who eats', name: 'grp' }) : '';
  var pks = dayProteins(), pk = curProtein();
  var prot = pks.length > 1 ? choice('Protein of the portions you count now', pks.map(function (id) { return { l: esc(eatItem(db, id).name) + ' <b class="num" data-pfn="' + id + '">' + ((S.f.pf || {})[id] || 0) + '</b>', on: id === pk, at: 'data-a="prot" data-id="' + id + '"' }; }), { name: 'prot' }) + small('Out of one protein? Switch here and go on counting: each portion counts for the protein chosen.') : '';
  return dayBar() + mealSeg() + grp + prot +
    '<div class="tapbox"><button class="tap s-' + st + '" data-a="tap" aria-label="Add one plate' + (S.f.grp ? ' for ' + esc(S.f.grp) : '') + (pk && pks.length > 1 ? ', ' + esc(eatItem(db, pk).name.toLowerCase()) : '') + '"><span class="num big" id="cnt">' + n + '</span><span class="heading-2">' + (S.f.grp ? esc(S.f.grp) + ': +1' : (pk && pks.length > 1 ? esc(eatItem(db, pk).name) + ': +1' : 'Tap: +1')) + '</span></button></div>' +
    (countMeals().length < 2 ? '<p class="heading-3 center">' + S.meal + ' · ' + esc(centreName(c)) + '</p>' : '') +
    '<div class="pst" id="pst" aria-live="polite">' + peopleStatus() + '</div>' +
    '<div class="three">' + btn('+5', 'data-a="add" data-n="5"') + btn('+10', 'data-a="add" data-n="10"') + btn('Other', 'data-a="adding"') + '</div>' +
    (S.f.adding ? card(field('How many more plates? (counted by hand)', 'an', '<input id="an" class="cyp-input num" type="number" inputmode="numeric" min="1" data-f="an" data-focus>') + btn('Add', 'data-a="addOk"')) : '') +
    btn('Undo the last one', 'data-a="undo"') +
    (st === 'skip' ? banner('danger', 'The people were not counted for ' + S.meal.toLowerCase() + ' on ' + dayName(S.date) + '. A tap on the big button opens the count again.') : '') +
    (st === 'skip' ? '' : st === 'done' ? banner('ok', S.meal + ' is finished: ' + peopleLine(pData()) + '. A new tap opens the count again.') + (eatLeft(db, c) ? btn('Next: leftovers', 'data-a="go" data-to="after"', 'primary block') : '')
      : btn('Finish ' + S.meal.toLowerCase(), 'data-a="finish"', 'primary block', 'check')) +
    (S.f.typing ? card(field('Number of plates in all' + (S.f.grp ? ' for ' + esc(S.f.grp) : ''), 'tn', '<input id="tn" class="cyp-input num" type="number" inputmode="numeric" min="0" value="' + n + '" data-f="tn" data-focus>') + btn('OK', 'data-a="typeOk"')) : btn('Type the number in all', 'data-a="typing"')) +
    '<p class="small muted center">Every change is saved by itself. Press Finish when the meal is over.</p>' +
    staffCard(db, c) +
    h2('All meals, ' + dayName(S.date)) + list(all) +
    /* at the bottom, in red: the meal was served but nobody counted */
    (st === 'skip' ? '' : (S.f.askSkip ? banner('danger', 'The count of ' + peopleLine(pData()) + ' will be removed.', 'alert') + '<div class="two">' + btn('Keep the count', 'data-a="noCountNo"') + btn('Yes, not counted', 'data-a="noCount"', 'danger') + '</div>'
      : btn('I didn\'t count the people', 'data-a="noCount"', 'no')));
};

/* the kitchen staff who ate today (beta 1.6, Mauro 24/11: always ask how many eat at the kitchen); they count in the food a plate */
function staffCard(db, c) {
  var n = staffOf(db, c, S.date), v = S.f.staffN != null ? S.f.staffN : (n == null ? '' : String(n));
  return card(h3('Kitchen staff who ate today') + '<p class="small muted">Ask every day how many of the kitchen eat here. They count in the food a plate.</p>' +
    '<div class="inl"><input id="stn" class="cyp-input num" type="number" inputmode="numeric" min="0" max="200" aria-label="Kitchen staff who ate today" data-f="staffN" value="' + esc(v) + '">' + btn('Save', 'data-a="saveStaff"') + '</div>' +
    (n == null ? small('Not written yet.') : small('Saved: ' + plural(n, 'person', 'people') + '.')));
}
/* beta 1.11 (Letizia, 26/11: "they have not enough of one protein and they complete with another, ex: fish and eggs"): with two proteins or more
   in the menu of the day, the person chooses the protein and counts; each change of the count goes to the protein chosen (pf) */
function dayProteins() {
  var dm = eatDayMenu(view(), S.sess.centre, S.date), x = dm.saved ? dm.meals[S.meal] || dm.meals.Lunch : null;
  return x && x.relish ? x.relish.filter(function (id) { var it = eatItem(view(), id); return it && it.relish; }) : [];
}
function curProtein() { var pks = dayProteins(); return pks.length ? (pks.indexOf(S.f.pk) >= 0 ? S.f.pk : pks[0]) : ''; }
function protAdd(k, id) { var pk = id || curProtein(); if (dayProteins().length < 2 || !pk) return; S.f.pf = S.f.pf || {}; S.f.pf[pk] = Math.max(0, (S.f.pf[pk] || 0) + k); var b = document.querySelector('[data-pfn="' + pk + '"]'); if (b) b.textContent = S.f.pf[pk]; }
