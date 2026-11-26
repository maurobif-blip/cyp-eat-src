"""Look at the screens the way a phone shows them: 360 px wide, as Android and as iPhone, and the overview on a computer.
Run after `EAT_KEEP=1 python3 test/ui_test.py` (the test database stays filled). Checks: nothing wider than the screen,
buttons at least 48 px high, no text under 12 px, the movements run and end. Saves pictures in /tmp/look_*.png."""
import base64, time
from playwright.sync_api import sync_playwright
B = 'http://localhost:8765'
code = base64.urlsafe_b64encode((B + '/db|testkey').encode()).decode().rstrip('=')
UA = {'android': 'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
      'iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'}
OFF = int((1795075200 - time.time()) * 1000)
CLOCK = "(() => { const D = Date, off = " + str(OFF) + "; class FD extends D { constructor(...a) { if (a.length === 0) super(D.now() + off); else super(...a); } static now() { return D.now() + off; } } window.Date = FD; })()"
CHECK = """(() => { const out = { wide: document.documentElement.scrollWidth > innerWidth, low: [], tiny: [] };
  document.querySelectorAll('button, a.cyp-btn, label.cyp-btn, .cyp-choice span, .cyp-tabbar a, select, input:not([type=radio]):not([type=checkbox]):not([type=file])').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.height < 47.5 && !e.closest('.tap')) out.low.push((e.textContent || e.id || e.tagName).trim().slice(0, 24) + ' ' + Math.round(r.height)); });
  document.querySelectorAll('main *, nav *, header *').forEach(e => { if (!e.children.length && e.textContent.trim() && e.getBoundingClientRect().width) { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 12) out.tiny.push(e.textContent.trim().slice(0, 20) + ' ' + f); } });
  return out; })()"""
bad = []
def look(p, name, tag):
    p.wait_for_timeout(900); r = p.evaluate(CHECK)
    if r['wide'] or r['low'] or r['tiny']: bad.append((tag, name, r))
    p.screenshot(path='/tmp/look_%s_%s.png' % (tag, name), full_page=True)
def pin(p, d, start=True):
    for x in d: p.locator('.keys button[data-k="%s"]' % x).click()
    p.locator('.keys button[data-k="ok"]').click(); p.wait_for_timeout(700)
    if start and p.locator('[data-a="ovStart"]').count(): p.locator('[data-a="ovStart"]').click(); p.wait_for_timeout(200)
def nav(p, to): p.locator('nav [data-to="%s"]' % to).click(); p.wait_for_timeout(200)
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    import os
    for tag in (() if os.environ.get('ONLY_PC') else ('android', 'iphone')):
        ctx = br.new_context(viewport={'width': 360, 'height': 740}, user_agent=UA[tag], is_mobile=True, has_touch=True, device_scale_factor=2); ctx.add_init_script(CLOCK)
        p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(B + '/?db=' + code); p.wait_for_timeout(900); look(p, '01_signin', tag)
        p.locator('[data-a="mode"][data-m="entry"]').click(); p.wait_for_timeout(200); look(p, '02_pin', tag); pin(p, '1234'); p.wait_for_timeout(1500)
        if p.locator('#modal [data-a="installNo"]').count(): look(p, '03a_install', tag); p.locator('#modal [data-a="installNo"]').last.click(); p.wait_for_timeout(200)
        look(p, '03_name', tag)
        p.locator('[data-a="pickName"]').first.click(); p.wait_for_timeout(200); look(p, '04_centre', tag)
        p.locator('[data-a="pickCentre"][data-id="MIN"]').click(); p.wait_for_timeout(200); look(p, '05_day', tag)
        # a new screen moves in: its pieces carry an animation, and a moment later they are in place
        p.locator('[data-a="dayConfirm"]').click(); p.wait_for_timeout(60)
        moving = p.evaluate("[document.querySelector('main').classList.contains('cyp-enter'), document.getAnimations().length]")
        assert moving[0] and moving[1] > 3, moving
        look(p, '06_daily', tag); assert p.evaluate("document.getAnimations().filter(a => a.playState === 'running').length") == 0
        # a sync redraws the same screen: nothing moves
        p.evaluate("bgRender()"); p.wait_for_timeout(50); assert p.evaluate("[document.querySelector('main').classList.contains('cyp-enter'), document.getAnimations().length]") == [False, 0]
        nav(p, 'people'); look(p, '07_people', tag)
        # the movements must not touch the words of the buttons (the count of the tiles once replaced +5 with 5)
        assert p.locator('[data-a="add"]').all_inner_texts() == ['+5', '+10'], p.locator('[data-a="add"]').all_inner_texts()
        p.locator('.tap').tap(); p.wait_for_timeout(30); assert p.evaluate("document.querySelector('.tap').classList.contains('hit')"); p.wait_for_timeout(400); p.locator('[data-a="undo"]').click()
        nav(p, 'today'); p.locator('.step[data-to="menu"]').click(); look(p, '08_menu', tag)
        p.locator('main .bk').click(); p.wait_for_timeout(200); p.locator('.step[data-to="before"]').click(); look(p, '09_quantities', tag)
        nav(p, 'week'); look(p, '10_week', tag); p.locator('.step[data-to="endweek"]').click(); look(p, '11_endweek', tag)
        nav(p, 'today'); p.locator('.step[data-to="after"]').click(); look(p, '12_leftovers', tag); nav(p, 'today')
        p.locator('[data-a="comment"]').click(); look(p, '13_comment', tag); p.locator('[data-a="modalClose"]').click()
        p.locator('[data-a="switchAsk"]').click(); p.wait_for_timeout(200)
        p.locator('[data-a="mode"][data-m="delivery"]').click(); pin(p, '5555'); look(p, '14_deliver', tag); p.locator('[data-a="dvHand"]').click(); look(p, '15_note', tag)
        p.locator('[data-a="switchAsk"]').click(); p.wait_for_timeout(200)
        p.locator('[data-a="mode"][data-m="admin"]').click(); pin(p, '9876', start=False); look(p, '16_overview', tag)
        # beta 1.11: one page; a canteen opens its days under the rest
        p.locator('a.ovc[data-id="MIN"]').click(); look(p, '17_overview_centre', tag); p.locator('[data-a="ovAll"]').click(); p.wait_for_timeout(300)
        nav(p, 'settings'); look(p, '20_settings', tag); p.locator('[data-a="setSec"][data-s="centres"]').click(); look(p, '21_centres', tag)
        # beta 1.0: the counts of a day removed by the overview, and its window
        p.locator('[data-a="setSec"][data-s=""]').click(); p.wait_for_timeout(100); p.locator('[data-a="setSec"][data-s="remove"]').click(); p.wait_for_timeout(100); p.select_option('#rc', 'MIN'); look(p, '22_remove_day', tag)
        p.locator('[data-a="rmAsk"]').click(); look(p, '23_remove_day_window', tag); p.locator('[data-a="modalClose"]').click(); p.wait_for_timeout(200)
        assert not errs, errs; ctx.close()
    # the overview on a computer: the pages in the second row of the bar, the three numbers in a row, a table for the plates
    ctx = br.new_context(viewport={'width': 1280, 'height': 800}); ctx.add_init_script(CLOCK); p = ctx.new_page()
    p.goto(B + '/?db=' + code); p.wait_for_timeout(900); p.locator('[data-a="mode"][data-m="admin"]').click(); pin(p, '9876'); p.wait_for_timeout(900)
    assert p.locator('.cyp-nav:not(.cyp-nav--chapters) a').count() == 2 and p.locator('.cyp-nav--chapters').count() == 0 and p.locator('.cyp-tabbar').count() == 0 and p.locator('.cyp-stat').count() == 4 and p.locator('.cyp-table').count() >= 3 and p.evaluate("document.querySelector('main').offsetWidth") == 1200
    p.screenshot(path='/tmp/look_computer_overview.png', full_page=True)
    p.locator('tr[data-a="ovOpen"][data-id="MIN"]').first.click(); p.wait_for_timeout(600); assert p.locator('[data-check="MIN"] .cyp-table').count() == 1
    p.screenshot(path='/tmp/look_computer_store.png', full_page=True); br.close()
for b in bad: print('CHECK', b)
print('look: done,', len(bad), 'screens to check')
