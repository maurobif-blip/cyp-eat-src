function unitTog(it, u) {
  if (it.unit === it.use) return '';
  var cur = rowUnit(it, u);
  return choice('', ['unit', 'use'].map(function (x) { return { l: 'In ' + esc(x === 'unit' ? it.unit : it.use), on: x === cur, at: 'data-a="unit" data-k="' + it.id + '" data-v="' + x + '"' }; }), { aria: 'Unit for ' + it.name, name: 'u_' + it.id });
}
var BACKNAME = { menu: 'What we eat', before: 'Quantities', after: 'Leftovers', people: 'Portions', today: 'Daily', week: 'Weekly' };
function backLink() { var to = backTarget(); return BACKNAME[to] && to !== S.scr ? '<button class="cyp-btn start bk" data-a="histBack">' + ic('back') + BACKNAME[to] + '</button>' : backBtn('today', 'Daily'); }
function weekLink() { return backBtn('week', 'Weekly'); }
function dayTitle() { return '<p class="label-caps muted">' + dayName(S.date) + ' · ' + esc(centreName(S.sess.centre)) + '</p>'; }
SCREENS.menu = function () {
  var db = view(), f = S.f, relish = db.items.filter(function (it) { return it.relish; }), plan = eatItem(db, EAT_PLAN[eatWeekday(S.date)]);
  var cooks = (db.names || []).filter(function (n) { return n.active && n.role === 'Canteen'; }).map(function (n) { return n.name; }).sort();
  var cookCard = card(h3('Cook') +
    (cooks.length ? choice('', cooks.map(function (n) { return { l: esc(n), on: f.cook === n, at: 'data-a="cook" data-n="' + esc(n) + '"' }; }), { aria: 'Cook', name: 'cook', cols: cooks.length > 3 ? 2 : 0 }) : '') +
    field(cooks.length ? 'Or write the name' : 'Name of the cook', 'ck', '<input id="ck" class="cyp-input" type="text" data-f="cook" value="' + esc(f.cook || '') + '">'));
  var both = sameDinner(f.meals);
  return backLink() + title('What do we eat today?') + dayTitle() + skipNote('menu') + cookCard + centreMeals().map(function (m) {
    var x = f.meals[m];
    if (both && m === 'Dinner') return '';
    if (m === 'Breakfast') return card(h3('Breakfast') +
      choice('', [{ l: 'Porridge', on: !!x.mm, at: 'data-a="bfm" data-v="mm"' }, { l: 'Other', on: !!x.isOther, at: 'data-a="bfm" data-v="other"' }], { aria: 'Breakfast', name: 'bf' }) +
      (x.isOther ? field('What is it?', 'bfo', '<input id="bfo" class="cyp-input" type="text" data-mv="Breakfast" data-k="other" value="' + esc(x.other) + '">', 'Bread, tea…') : ''));
    return card(h3(both && m === 'Lunch' ? 'Lunch and dinner' : m) + (plan ? small(WD[eatWeekday(S.date)] + ' plan: ' + esc(plan.name.toLowerCase())) : '') +
      choice('', [{ l: 'Nshima', on: !!x.mm, at: 'data-a="mmm" data-m="' + m + '"' }], { many: true, aria: 'Nshima' }) +
      choice('Protein', relish.map(function (it) { return { l: esc(it.name), on: x.relish.indexOf(it.id) >= 0, at: 'data-a="rel" data-m="' + m + '" data-id="' + it.id + '"' }; }), { many: true, cols: 2 }));   /* no vegetables (Daniela, 26/11: "vegetables we don't care for now") */
  }).join('') + btn('Next: quantities for today', 'data-a="saveMenu"', 'primary block') + skipBtn('menu');
};
