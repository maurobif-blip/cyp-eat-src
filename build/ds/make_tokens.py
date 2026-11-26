"""tokens.css from tokens.json of the CYP design system: every value comes from the file, none is written by hand here."""
import json, re, sys, hashlib
src, out = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read(); t = json.loads(raw)
def val(v): return re.sub(r'\{([a-z0-9-]+)\}', r'var(--\1)', str(v))
css = ['/* CYP design system: tokens.css, made by build/ds/make_tokens.py from tokens.json (sha256 %s). Do not edit by hand. */' % hashlib.sha256(raw).hexdigest()[:16]]
for f in t['type']['fonts']:
    css.append('@font-face{font-family:"%s";src:url(../%s) format("woff2");font-weight:%s;font-style:%s;font-display:swap}' % (f['family'], f['file'], f['weight'], f['style']))
v = []
for c in t['color']['tokens']: v.append('--%s:%s' % (c['name'], val(c['value'])))
for k, fam in t['type']['families'].items(): v.append('--font-%s:%s' % (k, fam))
for grp in ('spacing', 'radius', 'shadow', 'size'):
    for c in t[grp]['tokens']: v.append('--%s:%s' % (c['name'], val(c['value'])))
css.append(':root{' + ';'.join(v) + '}')
for g in t['type']['groups']:
    for s in g['styles']:
        r = 'font:%s%s %s/%s var(--font-%s)' % ((s['fontStyle'] + ' ') if s.get('fontStyle') else '', s['fontWeight'], s['fontSize'], s['lineHeight'], g['family'])
        if s.get('letterSpacing'): r += ';letter-spacing:' + s['letterSpacing']
        css.append('.%s{%s}' % (s['name'], r))
open(out, 'w').write('\n'.join(css) + '\n'); print('tokens.css', len(v), 'variables')
