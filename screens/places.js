function placesCard(db) {
  var pl = places(db).filter(function (c) { return c.place; });
  return small('The four centres, and other places without a canteen.') +
    (pl.length ? list(pl.map(function (c) { return row('truck', esc(shown(c.name)), '', '<button class="cyp-btn cyp-btn--danger" data-a="placeOff" data-id="' + c.id + '" aria-label="Remove ' + esc(shown(c.name)) + '">Remove</button>'); }).join('')) : '') +
    card(field('Add a place', 'np', '<input id="np" class="cyp-input" type="text" data-f="np" value="' + esc(S.f.np || '') + '">') + btn('Add', 'data-a="placeAdd"', 'primary'));
}
function readerCard() {
  return card('<p>' + (S.reader ? tag('ok', 'On') + ' The photos of the delivery notes are read by Gemini.' : tag('warn', 'Not set') + ' Without it, the deliveries person cannot save the photos.') + '</p>' +
    small('Create a key on aistudio.google.com (Get API key), then paste it here. The key goes only to the Google script.') +
    field(S.reader ? 'New key' : 'Key', 'rk', '<input id="rk" class="cyp-input" type="password" autocomplete="off" data-f="rk" value="' + esc(S.f.rk || '') + '">') +
    btn('Save the key', 'data-a="readerKey"', 'primary'));
}
