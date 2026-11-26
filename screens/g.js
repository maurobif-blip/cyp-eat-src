/* one quantity, as a Stepper of the design system: the number can be typed (also 0.5 or 1/2, so the box takes text), minus and plus correct it. id, label, unit, value, not counted */
function qRow(key, label, unit, val, nc, step, tog) {
  var dis = nc ? ' disabled' : '';
  return '<div class="cyp-field qrow"><label for="q_' + key + '">' + esc(label) + ' (' + esc(unit) + ')</label>' +
    '<div class="cyp-stepper"><button class="cyp-btn" data-a="step" data-k="' + key + '" data-s="-' + step + '" aria-label="Less"' + dis + '>' + ic('minus') + '</button>' +
    '<input id="q_' + key + '" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (nc || val == null ? '' : esc(String(val))) + '" data-q="' + key + '"' + dis + '>' +
    '<button class="cyp-btn cyp-btn--primary" data-a="step" data-k="' + key + '" data-s="' + step + '" aria-label="More"' + dis + '>' + ic('plus') + '</button></div>' +
    (key === 'pcs' || nc ? '' : '<div class="four">' + [[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾']].map(function (x) { return btn(x[0] ? '+' + x[1] : '.0', 'data-a="frac" data-k="' + key + '" data-v="' + x[0] + '" aria-label="' + (x[0] ? 'And ' + x[1] : 'Whole number') + '"'); }).join('') + '</div>') +
    (nc === undefined ? '' : choice('', [{ l: 'Not counted', on: !!nc, at: 'data-a="nc" data-k="' + key + '"' }], { many: true, aria: label + ': not counted' })) + (tog || '') + '</div>';
}
