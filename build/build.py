import shutil, hashlib
import sys, os, shutil, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen'))
import svg
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
OUT = R + 'site/'
VERSION = open(R + 'core.js').read().split("EAT_VERSION = '")[1].split("'")[0]
os.makedirs(OUT + 'icons', exist_ok=True)
# the CYP EAT wordmark of the CYP design system (Logos/cyp-eat.svg), inside the page so it shows without internet
import base64
wm = open(R + 'build/ds/cyp-eat.svg', 'rb').read()
assert hashlib.sha256(wm).hexdigest().startswith('7625ebc284fdc40d')  # the file of the design system, unchanged
html = open(R + 'src/index.html').read()
assert html.count('%%WORDMARK%%') == 1
html = html.replace('%%WORDMARK%%', 'data:image/svg+xml;base64,' + base64.b64encode(wm).decode())
# the logo of the Cicetekelo Youth Project (the same picture CYP EDU shows), inside the page so it works without internet
plogo = open(R + 'build/cyp-logo.datauri').read().strip()
assert plogo.startswith('data:image/png;base64,') and "'" not in plogo and "%%PLOGO%%" in html
html = html.replace('%%PLOGO%%', plogo)
open(OUT + 'index.html', 'w').write(html)
shutil.copy(R + 'core.js', OUT + 'core.js')
# the fonts of the design system (Ubuntu, Open Sans) and the licences of fonts and icons: each app ships its own copy
os.makedirs(OUT + 'fonts', exist_ok=True); os.makedirs(OUT + 'licenses', exist_ok=True); os.makedirs(OUT + 'ds', exist_ok=True)
for f in os.listdir(R + 'build/ds/fonts'): shutil.copy(R + 'build/ds/fonts/' + f, OUT + 'fonts/' + f)
# the stylesheet of the design system, copied as it is, and its tokens as CSS variables (made from tokens.json, nothing typed by hand)
bundle = open(R + 'build/ds/bundle.css', 'rb').read()
assert hashlib.sha256(bundle).hexdigest().startswith('21b3b7295feb9dd7')  # components/bundle.css of the design system, version of 24/11/2026 (1795508523-94be): rows open with a chevron
shutil.copy(R + 'build/ds/bundle.css', OUT + 'ds/bundle.css')
# tokens.css of the design system, unchanged: variables, type classes and the font files (it looks for them in fonts/, so it sits next to that folder)
tok = open(R + 'build/ds/tokens.css', 'rb').read()
assert hashlib.sha256(tok).hexdigest().startswith('accf64c326d9e169')
shutil.copy(R + 'build/ds/tokens.css', OUT + 'tokens.css')
if os.path.exists(OUT + 'ds/tokens.css'): os.remove(OUT + 'ds/tokens.css')
for f in os.listdir(R + 'build/ds/licenses'): shutil.copy(R + 'build/ds/licenses/' + f, OUT + 'licenses/' + f)
core = open(R + 'core.js').read().rstrip().split('\n')
assert core[-1].startswith("if (typeof module")
open(OUT + 'Code.gs', 'w').write('\n'.join(core[:-1]) + open(R + 'src/google-side.gs').read())
open(OUT + 'sw.js', 'w').write("""/* CYP EAT: keeps the app on the phone so it opens without internet. VERSION changes at every update. */
var VERSION = 'cyp-eat-%s';
var FILES = ['./', 'index.html', 'core.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png', 'tokens.css', 'ds/bundle.css', 'fonts/Ubuntu-Medium.woff2', 'fonts/Ubuntu-Bold.woff2', 'fonts/OpenSans-Regular.woff2', 'fonts/OpenSans-Bold.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; /* the database is never kept here */
  /* always ask GitHub for a newer file (no-cache: the browser checks, and downloads only what changed) */
  e.respondWith(fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); } return res; }).catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match('index.html'); }); }));
});
""" % (VERSION.replace(' ', '-') + '-' + hashlib.sha256((open(OUT + 'index.html').read() + open(OUT + 'core.js').read() + open(OUT + 'tokens.css').read() + open(OUT + 'ds/bundle.css').read()).encode()).hexdigest()[:8]))
open(OUT + 'manifest.webmanifest', 'w').write("""{
  "name": "CYP EAT",
  "short_name": "CYP EAT",
  "description": "Cicetekelo Youth Project: canteen counts, people and food",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#0B5FA5",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
""")
icon = svg.icon('i', label=False).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" ', 1)
open(R + 'build/icon.svg', 'w').write(icon)
for name, size in [('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180), ('favicon-48.png', 48)]:
    subprocess.check_call(['rsvg-convert', '-w', str(size), '-h', str(size), R + 'build/icon.svg', '-o', OUT + 'icons/' + name])
# Android maskable icon: drawn to fit the safe zone (mobile polish, GitHub PR #1)
shutil.copyfile(R + 'build/icon-maskable-512.png', OUT + 'icons/icon-maskable-512.png')
open(OUT + '.nojekyll', 'w').write('')
open(OUT + 'README.md', 'w').write('# CYP EAT\n\nCanteen counts for the Cicetekelo Youth Project (APJ23, Ndola): people per meal, food before and after, deliveries, end-of-week stock.\n\nPhone app (works offline) at https://maurobif-blip.github.io/cyp-eat/ . Shared database: Google Sheet with `Code.gs`. No data in this repository.\n')
print('built', VERSION)
