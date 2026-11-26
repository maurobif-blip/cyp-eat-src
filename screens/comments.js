function commentsCard(db) {
  var open = openComments(db), done = (db.comments || []).length - open.length;
  var all = (S.showDone ? (db.comments || []).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }) : open);
  return (open.length ? '<p class="body-strong">' + plural(open.length, 'comment', 'comments') + ' to do</p>' + btn('Copy the ' + plural(open.length, 'comment', 'comments') + ' to do', 'data-a="copyComments"') : '') +
    (all.length ? list(all.map(function (c) {
      return '<div class="cyp-row"><div class="rowform">' + small(esc(commentLine(c))) + '<p' + (c.done ? ' class="muted"' : '') + '>' + esc(c.text) + '</p></div><button class="cyp-btn" data-a="cdone" data-id="' + esc(c.id) + '">' + (c.done ? 'Open again' : 'Done') + '</button></div>';
    }).join('')) : '<p class="muted">' + (done ? 'Nothing to do.' : 'None yet.') + '</p>') +
    (done ? btn(S.showDone ? 'Hide the done comments' : 'Show the ' + done + ' done', 'data-a="showDone"') : '');
}
