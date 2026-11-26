function weekBar() {
  var mon = S.week, sun = eatAddDays(mon, 6), cur = eatMonday(todayStr()) === mon;
  return pager('Week of ' + dmy(mon), 'wk', -7, 7, cur) + '<p class="small muted center">' + dayName(mon) + ' – ' + dayName(sun) + ' · ' + (cur ? 'This week' : 'Another week') + '</p>';
}
