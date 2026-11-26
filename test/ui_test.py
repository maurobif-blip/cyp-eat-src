import base64, json, sys, time, urllib.request
from playwright.sync_api import sync_playwright
B = 'http://localhost:8765'
code = base64.urlsafe_b64encode((B + '/db|testkey').encode()).decode().rstrip('=')
urllib.request.urlopen(B + '/__reset').read()
errors = []
def shot(p, name): p.screenshot(path='/tmp/eat_%s.png' % name, full_page=True)
def tapt(p, text, exact=True): p.get_by_role('button', name=text, exact=exact).first.click(); p.wait_for_timeout(120)
def pin(p, digits, start=True):
    # the keypad takes 4 digits; OK checks them
    for d in digits[:4]: p.locator('.keys button[data-k="%s"]' % d).click()
    p.wait_for_timeout(250); assert p.locator('.dots .f').count() == 4 and 'PIN' in p.inner_text('h1'), 'the PIN must wait for OK'
    p.locator('.keys button[data-k="ok"]').click(); p.wait_for_timeout(600)
    # the overview opens on its cover: Start goes to the first chapter
    if start and p.locator('[data-a="ovStart"]').count(): p.locator('[data-a="ovStart"]').click(); p.wait_for_timeout(150)
def sec(p, name): p.locator('[data-a="setSec"][data-s="%s"]' % name).click(); p.wait_for_timeout(150)
def settings(p, name): p.locator('nav [data-to="settings"]').click(); p.wait_for_timeout(150); sec(p, name)
def body(p):
    # the words as they are written: the labels in capitals (label-caps of the design system) are read in their own case
    return p.evaluate("(() => { const st = document.createElement('style'); st.textContent = '*{text-transform:none!important}'; document.head.appendChild(st); const t = document.body.innerText; st.remove(); return t; })()")
def count(p):
    # after the centre and the day the first screen is Daily: from there, the count of the people
    t = body(p); assert 'What do we eat today?' in t and 'Quantities for today' in t and 'Tap: +1' not in t, t[:400]
    p.locator('.step[data-to="people"]').click(); p.wait_for_timeout(150)
def today(p, centre=None):
    # the app opened again or left for 30 minutes: first the centre
    if centre:
        t = body(p); assert 'Which centre are you counting for?' in t and 'Which day' not in t, t[:300]
        p.locator('[data-a="pickCentre"][data-id="%s"]' % centre).click(); p.wait_for_timeout(150)
    # before counting: the calendar, and the day confirmed
    t = body(p); assert 'Which day are you counting?' in t and 'November 2026' in t and 'Thu 19 Nov · today' in t and 'Tap: +1' not in t, t[:400]
    p.locator('[data-a="dayConfirm"]').click(); p.wait_for_timeout(150)
def signout(p): p.locator('[data-a="switchAsk"]').click(); p.wait_for_timeout(200)   # beta 1.7: top right, back to the three accesses
def pick(p, sel, value): p.select_option(sel, value); p.wait_for_timeout(120)
# a small JPEG for the photo of a delivery note
JPG = '/tmp/eat_note.jpg'
import subprocess
subprocess.run(['python3', '-c', "from PIL import Image; Image.new('RGB', (800, 600), (240, 240, 230)).save('%s', quality=80)" % JPG], check=True)
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True, permissions=['clipboard-read', 'clipboard-write'], reduced_motion='reduce')  # the movements are tried on their own at the end
    # the app's clock is Thursday 19 November 2026, 10:00 in Ndola, whatever day the test runs
    OFF = int(time.mktime(time.strptime('2026-11-19 08:00:00', '%Y-%m-%d %H:%M:%S')) * 1000 - time.timezone * 1000 * 0) - int(time.time() * 1000)
    OFF = int((1795075200 - time.time()) * 1000)  # 2026-11-19T08:00:00Z minus now
    ctx.add_init_script("(() => { const D = Date, off = " + str(OFF) + "; class FD extends D { constructor(...a) { if (a.length === 0) super(D.now() + off); else super(...a); } static now() { return D.now() + off; } } window.Date = FD; })()")
    p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(str(e))); p.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    p.goto(B + '/?db=' + code); p.wait_for_timeout(800)
    p.wait_for_timeout(700); assert 'First use: the two PINs' in body(p), body(p)[:300]
    p.fill('#p1', '1234'); p.fill('#p2', '1234'); p.fill('#p3', '9876'); p.fill('#p4', '9875'); tapt(p, 'Save the PINs')
    assert 'not the same' in body(p)
    p.fill('#p4', '9876'); tapt(p, 'Save the PINs'); p.wait_for_timeout(600)
    assert 'PINs saved' in body(p), body(p)[:300]
    assert '?db=' in p.url  # the address keeps the link, so the home screen icon keeps it
    mf = p.evaluate("decodeURIComponent(document.querySelector('link[rel=manifest]').href)"); assert mf.startswith('data:') and '"start_url":"' + B + '/?db=' in mf, mf[:200]
    t = body(p); assert 'Enter data' in t and 'Deliveries' in t and 'Overview' in t, t[:400]
    # the logo of the project: next to CYP EAT in the top bar, and large on the sign in screen
    lg = p.evaluate("[...document.querySelectorAll('main.cyp-signin > img.wm, main.cyp-signin .plogo img')].map(i => [i.complete && i.naturalWidth > 0, Math.round(i.getBoundingClientRect().width), i.alt])")
    assert lg == [[True, 191, 'CYP EAT'], [True, 51, 'Cicetekelo Youth Project seal']], lg
    # the first screens: no app bar, the thin chitenge strip at the bottom edge, the fonts of the design system
    assert p.locator('.cyp-appbar').count() == 0 and p.evaluate("(() => { const r = document.querySelector('.cyp-chitenge').getBoundingClientRect(); return r.height === 24 && Math.round(r.bottom) >= window.innerHeight; })()")
    assert p.evaluate("document.fonts.ready.then(() => [document.fonts.check('700 20px Ubuntu'), document.fonts.check('500 16px Ubuntu'), document.fonts.check('400 16px \"Open Sans\"'), document.fonts.check('700 16px \"Open Sans\"')])") == [True] * 4
    assert p.evaluate("getComputedStyle(document.querySelector('h1')).fontFamily").startswith('Ubuntu') and p.evaluate("getComputedStyle(document.body).fontFamily").startswith('"Open Sans"')
    assert p.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    shot(p, '02_signin')
    # deliveries before its PIN is set
    p.locator('[data-a="mode"][data-m="delivery"]').click(); pin(p, '5555'); assert 'has not set the deliveries PIN' in body(p), body(p)[:300]
    tapt(p, 'Back')
    # ---- overview: names, deliveries PIN, a place, the photo reader
    p.locator('[data-a="mode"][data-m="admin"]').click(); p.wait_for_timeout(100)
    pin(p, '1111'); assert 'Wrong PIN. Try again.' in body(p) and p.locator('.dots .f').count() == 0 and p.locator('.keys button[data-k="ok"]').is_disabled(); shot(p, '02b_wrong_pin')
    pin(p, '9876', start=False); t = body(p); assert 'Overview' in t and 'Week of 16/11/2026' in t and 'Canteens this week' in t and p.locator('.cyp-ground').count() == 0 and p.locator('.cyp-nav--chapters').count() == 0, t[:300]
    shot(p, '02c_overview_empty')
    p.locator('nav [data-to="settings"]').click(); p.wait_for_timeout(150)
    t = body(p); assert 'Users' in t and 'Centres and meals' in t and 'Photo reader' in t and 'Add a name' not in t, t[:600]
    shot(p, '03a_settings_menu')
    sec(p, 'users')
    p.fill('#nn', 'Anna Test'); tapt(p, 'Add the name'); p.fill('#nn', 'Mery Tset'); tapt(p, 'Add the name'); p.wait_for_timeout(800)
    assert 'Anna Test' in body(p) and 'Mery Tset' in body(p)
    # a name is corrected with Edit
    tapt(p, 'Edit Mery Tset'); assert p.input_value('#en') == 'Mery Tset'; shot(p, '03b_name_edit')
    p.fill('#en', 'Anna Test'); tapt(p, 'Save the name'); assert 'already in the list' in body(p)
    p.fill('#en', 'Mary Test'); p.locator('[data-a="nameEditRole"][data-r="Canteen"]').click(); tapt(p, 'Save the name'); p.wait_for_timeout(800)
    t = body(p); assert 'Mary Test' in t and 'Mery Tset' not in t and 'Name saved' in t, t[:600]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); nm = [n for n in db['names'] if n['name'] == 'Mary Test'][0]; assert nm['role'] == 'Canteen' and len(db['names']) == 2, db['names']
    tapt(p, 'Settings'); sec(p, 'pins')
    tapt(p, 'Set the deliveries PIN'); p.fill('#np1', '5555'); p.fill('#np2', '5555'); tapt(p, 'Save'); p.wait_for_timeout(800)
    assert 'Deliveries PIN saved' in body(p), body(p)[:400]
    tapt(p, 'Settings'); sec(p, 'places')
    p.fill('#np', 'Holy Family'); p.locator('[data-a="placeAdd"]').click(); p.wait_for_timeout(800)
    p.fill('#np', 'Chinika House'); p.locator('[data-a="placeAdd"]').click(); p.wait_for_timeout(800)
    assert 'Holy Family' in body(p)
    tapt(p, 'Settings'); sec(p, 'centres')
    p.fill('[data-f="grp_LUI"]', 'Holy Family'); p.locator('[data-a="grpAdd"][data-id="LUI"]').click(); p.wait_for_timeout(800)
    assert 'Holy Family' in body(p) and p.locator('[data-a="grpOff"][data-g="Holy Family"]').count() == 1, body(p)[-2500:]
    tapt(p, 'Settings'); sec(p, 'reader')
    assert 'Not set' in body(p)
    p.fill('#rk', 'test-key'); tapt(p, 'Save the key'); p.wait_for_timeout(600)
    t = body(p); assert 'The photo reader is on' in t and 'On' in t, t[-1500:]
    shot(p, '03_settings')
    # the overview copies a delivery note by hand: Holy Family is a place
    tapt(p, 'Overview', exact=False) if False else p.locator('nav [data-to="overview"]').click(); p.wait_for_timeout(200)
    tapt(p, 'Open the delivery notes'); p.wait_for_timeout(100)
    t = body(p); assert 'Delivery notes' in t and 'No delivery notes saved for this week' in t, t[:400]
    tapt(p, 'Add a delivery note'); assert 'Holy Family' in body(p)
    tapt(p, 'Save the note'); assert 'Write the note number' in body(p)
    p.fill('#nno', '28587'); p.fill('#q_chk', '48'); p.fill('#q_mm', '10'); p.fill('#nrm', '02 chickens for Chinika House'); p.fill('#nrc', 'Renard')
    tapt(p, 'Save the note'); assert 'How long should this delivery last' in body(p)
    pick(p, '#ndays', '3'); shot(p, '08a_note'); tapt(p, 'Save the note'); p.wait_for_timeout(300)
    t = body(p); assert 'for 3 days' in t and 'Note 28587 saved.' in t and 'No. 28587' in t and 'Chicken 48 chickens' in t, t[:600]
    tapt(p, 'Add a delivery note'); p.fill('#nno', '28590'); pick(p, '#ncen', 'NKW'); p.fill('#q_egg', '15'); tapt(p, 'Save the note'); tapt(p, 'Save the note'); p.wait_for_timeout(300)
    t = body(p); assert 'Numbers not saved: 28588–28589' in t and 'how long: not written' in t, t[:600]
    tapt(p, 'Add a delivery note'); p.fill('#nno', '28590'); pick(p, '#ncen', 'NKW'); p.fill('#q_egg', '16'); tapt(p, 'Save the note'); tapt(p, 'Save the note')
    assert 'already saved' in body(p); tapt(p, 'Save the note'); p.wait_for_timeout(300)
    assert 'Eggs 16 trays' in body(p) and 'Eggs 15 trays' not in body(p)
    p.locator('[data-a="noteOpen"][data-no="28590"]').click(); p.fill('#nno', '28588'); tapt(p, 'Save the note'); tapt(p, 'Save the note'); p.wait_for_timeout(300)
    t = body(p); assert 'No. 28588' in t and 'No. 28590' not in t and 'Numbers not saved: 28589' in t, t[:600]
    shot(p, '08b_deliveries')
    p.locator('nav [data-to="overview"]').click(); p.wait_for_timeout(300)
    signout(p)
    # ---- deliveries: a photo of the note, read and checked
    p.locator('[data-a="mode"][data-m="delivery"]').click(); pin(p, '5555'); p.wait_for_timeout(300)
    t = body(p); assert 'Take a picture of the delivery note' in t and p.inner_text('.cyp-appbar__where') == 'Deliveries', t[:400]
    # the bar holds only the wordmark, the place and the state: Sign out and Comment are under More
    assert p.locator('.hdr button').count() == 2 and p.locator('.hdr button.cyp-appbar__action').count() == 2 and p.locator('nav a').all_inner_texts() == ['Deliveries']   # beta 1.7: Comment and Change access, no More
    shot(p, '20_deliver_start')
    # the page is redrawn while the camera is open (a sync): the first photo must not be lost
    # beta 1.8 (butchery, 26/11: reading slow or failing): the form opens at once with the photo; the reading only fills what is empty
    urllib.request.urlopen(B + '/__reader?mode=ok&delay=2500').read()
    h = p.query_selector('#cam'); p.evaluate('bgRender()'); h.set_input_files(JPG); p.wait_for_timeout(700)
    t = body(p); assert 'New delivery note' in t and 'Reading the photo' in t and 'You can write the note meanwhile' in t and p.locator('main img.photo.rdimg').count() == 1, t[:600]
    p.fill('#nrc', 'Joseph M'); p.locator('main h1').click(); p.wait_for_timeout(3000)
    t = body(p); assert 'Filled in from the photo: check every number with the paper.' in t and p.input_value('#nno') == '28301' and p.input_value('#q_mm') == '12' and p.input_value('#nrc') == 'Joseph M', t[:700]
    assert p.evaluate("document.querySelector('#ncen').selectedOptions[0].textContent") == 'Holy Family'
    shot(p, '21_deliver_check')
    tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    t = body(p); assert 'Saved: delivery note 28301' in t and 'Saved today' in t, t[:600]
    # a photo of the booklet open: two notes read, the second opens after the first is saved
    urllib.request.urlopen(B + '/__reader?mode=two').read()
    p.set_input_files('#gal', JPG); p.wait_for_timeout(1500)
    t = body(p); assert 'The photo has 2 notes' in t and p.input_value('#nno') == '28302' and p.input_value('#q_egg') == '10', t[:600]
    tapt(p, 'Save the note'); p.wait_for_timeout(300)
    t = body(p); assert 'Now the next note of the photo' in t and p.input_value('#nno') == '28303' and p.input_value('#q_prk') == '15', t[:600]
    tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    t = body(p); assert 'Saved: delivery notes 28302 and 28303' in t, t[:600]
    shot(p, '23_deliver_two')
    # a note with a part for another place: 26 chickens for Nkwazi, 2 of them for Chinika House
    urllib.request.urlopen(B + '/__reader?mode=part').read()
    p.set_input_files('#cam', JPG); p.wait_for_timeout(1500)
    t = body(p); assert 'Chinika House' in t and p.input_value('#q_chk') == '26', t[:900]
    shot(p, '24_deliver_part')
    tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    # the reading fails: the form stays, the photo is kept with the note
    urllib.request.urlopen(B + '/__reader?mode=unclear').read()
    p.set_input_files('#cam', JPG); p.wait_for_timeout(1500)
    t = body(p); assert 'The photo could not be read (the photo is not clear). Write the note here: the photo is kept with it.' in t and p.input_value('#nno') == '', t[:600]
    shot(p, '22_deliver_unclear')
    p.fill('#nno', '28305'); p.fill('#q_egg', '6'); pick(p, '#ncen', 'MIN'); tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    # the note saved before the reading comes back: the photo is added to it
    urllib.request.urlopen(B + '/__reader?mode=ok&delay=3000').read()
    p.set_input_files('#cam', JPG); p.wait_for_timeout(500); assert 'Reading the photo' in body(p)
    p.fill('#nno', '28306'); p.fill('#q_chk', '8'); pick(p, '#ncen', 'LUI'); tapt(p, 'Save the note'); p.wait_for_timeout(4500)
    urllib.request.urlopen(B + '/__reader?mode=ok').read()
    # the note written by hand, when there is no picture
    tapt(p, 'Write the note by hand'); p.wait_for_timeout(100)
    t = body(p); assert 'New delivery note' in t and 'Who is the note for?' in t and 'How long should it last?' not in t and 'Reading the photo' not in t, t[:500]
    p.fill('#nno', '28304'); p.fill('#q_mm', '5'); tapt(p, 'Save the note'); assert 'Choose who the note is for.' in body(p)
    pick(p, '#ncen', 'LUI'); shot(p, '25_deliver_by_hand'); tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    t = body(p); assert 'Saved: delivery note 28304' in t and 'written by hand' in t and 'Tap a note to correct it.' in t and p.locator('a.cyp-row--link[data-a="dvOpen"] .cyp-go').count() >= 1, t[:700]
    # a note saved today is opened and corrected
    p.locator('[data-a="dvOpen"][data-no="28304"]').click(); p.wait_for_timeout(100)
    assert 'Delivery note 28304' in body(p) and p.input_value('#q_mm') == '5'
    tapt(p, 'Delivery notes', exact=False); assert 'Saved today' in body(p)
    p.locator('[data-a="dvOpen"][data-no="28304"]').click(); p.fill('#q_mm', '6'); tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    def note(no): return [e for e in db['entries'] if e['type'] == 'note' and e['data']['no'] == no and not e.get('del')][0]
    h = note('28304'); assert h['centre'] == 'LUI' and h['data']['q'] == {'mm': 6} and h['byName'] == 'Deliveries' and h['mode'] == 'delivery' and not h['data'].get('photo'), h
    assert p.locator('nav [data-to="plan"]').count() == 0  # the plan of the week is written by the kitchen (Mauro, 24/11)
    h = note('28301'); assert h['data']['recv'] == 'Joseph M' and h['data']['photo'] == 'photo_28301_abcdef' and h['data']['q'] == {'mm': 12} and h['byName'] == 'Deliveries' and h['mode'] == 'delivery', h
    assert note('28303')['centre'] == 'MCU' and note('28302')['data']['photo'] == 'photo_two_notes_12345'
    n2 = note('28599'); assert n2['centre'] == 'NKW' and n2['data']['q'] == {'chk': 26} and n2['data']['parts'][0]['q'] == {'chk': 2} and n2['data']['parts'][0]['name'] == 'Chinika House', n2
    assert note('28305')['data']['photo'] == 'photo_unclear_123' and note('28305')['data']['q'] == {'egg': 6}
    n6 = note('28306'); assert n6['data']['photo'] == 'photo_28301_abcdef' and n6['data']['q'] == {'chk': 8} and n6['centre'] == 'LUI', n6   # the photo came after the save
    signout(p)
    # ---- data entry: people
    p.locator('[data-a="mode"][data-m="entry"]').click(); pin(p, '1234')
    assert 'Who are you?' in body(p), body(p)[:300]
    assert 'Last time' not in body(p); tapt(p, 'Anna Test')
    t = body(p); assert 'Which centre are you counting for?' in t and 'Holy Family' not in t and 'Last time' not in t, t[:500]  # a place is not a canteen
    tapt(p, 'Minsundu', exact=False)
    assert p.locator('nav').count() == 1 and p.locator('.cal .tod [data-d="2026-11-19"]:checked').count() == 1 and p.locator('.cal [data-d="2026-11-20"]').is_disabled()
    assert p.inner_text('.cyp-appbar__where') == 'Minsundu, lunch' and p.locator('.hdr button').count() == 2 and p.locator('.hdr button.cyp-appbar__action').count() == 2 and p.locator('nav a').all_inner_texts() == ['Portions', 'Daily', 'Weekly']
    # the app bar: the wordmark on its plate, the state of the data with its word; nothing wider than the phone
    assert p.evaluate("(() => { const i = document.querySelector('.cyp-appbar__plate img'); return [i.alt, Math.round(i.getBoundingClientRect().height), i.naturalWidth > 0]; })()") == ['CYP EAT', 28, True] and p.inner_text('.cyp-appbar__sync') in ('Saved', 'Sending')
    assert p.evaluate("document.documentElement.scrollWidth <= window.innerWidth") and p.evaluate("getComputedStyle(document.querySelector('.cyp-appbar')).backgroundColor") == 'rgb(10, 42, 92)'
    assert 'Change the centre' in body(p) and 'Yes, count Thu 19 Nov · Minsundu' in body(p)
    tapt(p, 'Change the centre'); assert 'Which centre are you counting for?' in body(p); p.locator('[data-a="pickCentre"][data-id="MIN"]').click(); p.wait_for_timeout(150)
    shot(p, '04a_daypick'); today(p)
    # beta 1.3: the plan of the week, written by the kitchen (Enter data): read from the photo of the paper, then corrected by hand
    p.locator('nav [data-to="week"]').click(); p.wait_for_timeout(200)
    t = body(p); assert '1. Menu of the week' in t and 'To do' in t, t[:600]
    p.locator('a.steprow[data-to="plan"]').click(); p.wait_for_timeout(200)
    t = body(p); assert 'Plan of the week' in t and 'Take a picture of the plan' in t and p.locator('#plc').count() == 0 and p.locator('[data-plday]').count() == 7 and p.inner_text('main .bk') == 'Weekly', t[:600]
    p.set_input_files('#cam', JPG); p.wait_for_timeout(1500)
    t = body(p); assert 'Read from the photo' in t and p.locator('[data-plday]').count() == 7, t[:800]
    assert [p.input_value(x) for x in ['#pl0pLunch', '#pl0pDinner', '#pl0qegg', '#pl1on0', '#pl1ov0', '#pl3pDinner', '#pl0f']] == ['120', '40', '7', 'Ukubalula', '1', '60', 'Eggs']
    assert p.locator('#plplaces option[value="Ukubalula"]').count() == 1 and p.locator('#plplaces option[value="Chinika House"]').count() == 1
    p.fill('#pl2pLunch', '100'); p.fill('#pl2pDinner', '40'); pick(p, '#pl2add', 'egg'); p.wait_for_timeout(200); p.fill('#pl2qegg', '6')
    shot(p, '26_plan_form')
    tapt(p, 'Save the plan'); p.wait_for_timeout(1200)
    t = body(p); assert 'Saved: the plan of Minsundu, week of 16/11/2026' in t, t[:500]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    pl = [e for e in db['entries'] if e['type'] == 'plan' and not e.get('del')]
    assert len(pl) == 1 and pl[0]['centre'] == 'MIN' and pl[0]['date'] == '2026-11-16' and pl[0]['byName'] == 'Anna Test' and pl[0]['data']['photo'] == 'photo_plan_minsundu_1', pl
    assert pl[0]['data']['days']['2'] == {'p': {'Lunch': 100, 'Dinner': 40}, 'o': {}, 'q': {'egg': 6}, 'food': ''} and pl[0]['data']['days']['1']['o'] == {'Ukubalula': 1}, pl[0]['data']['days']
    # opened again: the saved plan is in the form
    tapt(p, 'Write or correct a plan'); p.wait_for_timeout(200)
    assert 'The plan of this week is saved' in body(p) and p.input_value('#pl2qegg') == '6'
    # beta 1.4 (comments of Mauro, 24/11): next week starts from this plan; the quantities follow the people; shares of the other places; something different
    p.locator('[data-a="plWeek"][value="2026-11-23"]').click(); p.wait_for_timeout(300)
    t = body(p); assert 'Filled in from the plan of the week of 16/11/2026' in t and p.input_value('#pl0qegg') == '7' and p.input_value('#pl0f') == 'Eggs', t[:900]
    assert 'For Ukubalula (1 of 161 people): 0.14 chickens of chicken' in p.inner_text('#plsh1'), p.inner_text('#plsh1')
    p.fill('#pl0pLunch', '60'); p.wait_for_timeout(200); assert p.input_value('#pl0qegg') == '4.5'   # 7 trays for 160 people -> 100 people
    p.fill('#pl1qchk', '20'); p.fill('#pl1pLunch', '60'); p.wait_for_timeout(200); assert p.input_value('#pl1qchk') == '20'   # written by hand: it stays
    p.locator('[data-a="plDiff"][data-w="0"]').click(); p.wait_for_timeout(200); p.fill('#pl0xw0', 'Children'); p.fill('#pl0xf0', 'Fish from Sunday')
    shot(p, '26b_plan_next_week')
    tapt(p, 'Save the plan'); p.wait_for_timeout(1000); assert 'Saved: the plan of Minsundu, week of 23/11/2026' in body(p)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    p2 = [e for e in db['entries'] if e['type'] == 'plan' and e['date'] == '2026-11-23' and not e.get('del')][0]['data']['days']
    assert p2['0']['q'] == {'egg': 4.5} and p2['0']['p'] == {'Lunch': 60, 'Dinner': 40} and p2['0']['x'] == [{'who': 'Children', 'food': 'Fish from Sunday'}] and p2['1']['q'] == {'chk': 20}, p2
    p.locator('nav [data-to="week"]').click(); p.wait_for_timeout(200); assert '1. Menu of the week' in body(p) and 'Done' in body(p)
    p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(200)
    # the day as four steps; nothing on this page cancels the whole day
    rows = p.locator('.steprow').all_inner_texts()
    assert rows[2].replace('\n', ' ').startswith('3. Count the portions One tap for each portion') and [x[:2] for x in rows] == ['1.', '2.', '3.', '4.'] and p.locator('a.steprow.step .cyp-go').count() == 4 and p.locator('.steprow button').count() == 0, rows
    assert "I didn't count the food" not in body(p) and p.locator('main .cyp-btn--danger, main .cyp-btn--no').count() == 1 and 'I was not present at the centre today' in body(p)   # beta 1.7 (Daniela, 26/11)
    shot(p, '04b_daily_first'); count(p)
    t = body(p); assert 'Which day' not in t and 'Not counted' in t and 'Choose the day' in t and p.locator('.tap.s-none').count() == 1, t[:400]
    t = body(p); assert 'Tap: +1' in t and '+10' in t and 'Other' in t and 'Daily' in t and 'Weekly' in t, t[:600]; shot(p, '04_people')
    assert p.locator('[data-a="meal"]').count() == 0 and 'Lunch · Minsundu' in body(p) and 'Breakfast' not in body(p)  # one meal to count: nothing to choose
    t = body(p); assert 'Dinner' in t and '60 portions in the plan of the week · not counted · change it in the plan' in t and 'For Ukubalula' in t and '10 portions in the plan of the week · cooked here, not counted' in t, t[:900]
    # comment of Mauro (24/11): the dinners planned and the other places change from the people page, in the plan of the week
    p.locator('[data-a="planGo"]', has_text='Other places cooked for here').click(); p.wait_for_timeout(200)
    t = body(p); assert 'Plan of the week' in t and p.inner_text('main .bk') == 'People' and p.input_value('#pl3pDinner') == '60' and p.locator('#plplaces option[value="Chinika House"]').count() == 1, t[:600]
    p.locator('main .bk').click(); p.wait_for_timeout(200); assert 'All meals' in body(p)
    for i in range(5): p.locator('.tap').click()
    tapt(p, 'Undo the last one'); assert p.inner_text('#cnt') == '4'
    assert 'Counting: 4 portions · saving' in body(p) and p.locator('.tap.s-count').count() == 1, body(p)[:500]
    p.reload(); p.wait_for_timeout(900); today(p, 'MIN'); assert 'Counting: 4 portions' in body(p); count(p)
    assert p.inner_text('#cnt') == '4', p.inner_text('#cnt')
    tapt(p, '+10'); tapt(p, '+5'); assert p.inner_text('#cnt') == '19'
    tapt(p, 'Undo the last one'); assert p.inner_text('#cnt') == '14'
    tapt(p, 'Other'); p.fill('#an', '110'); tapt(p, 'Add'); assert p.inner_text('#cnt') == '124'
    p.wait_for_timeout(2200)
    t = body(p); assert 'Counting: 124 portions · saved' in t, t[:600]
    shot(p, '05_people')
    # Finish: the meal turns green; a new tap opens the count again
    tapt(p, 'Finish lunch'); p.wait_for_timeout(900)
    # at Minsundu the leftovers come after the count
    t = body(p); assert 'Leftovers' in t and 'Lunch is finished: 124 portions. Now the leftovers.' in t and 'First save the quantities for today.' in t and 'Tap: +1' not in t, t[:500]
    shot(p, '05a_after_finish'); p.locator('nav [data-to="people"]').click(); p.wait_for_timeout(150)
    t = body(p); assert 'Finished: 124 portions · saved' in t and 'Lunch is finished' in t and 'Next: leftovers' in t and p.locator('.tap.s-done').count() == 1 and 'Finish lunch' not in t, t[:700]
    shot(p, '05b_people_finished')
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    pe = [e for e in db['entries'] if e['type'] == 'people' and e['meal'] == 'Lunch' and not e.get('del')][0]; assert pe['data'] == {'n': 124, 'done': True}, pe
    p.locator('.tap').click(); assert p.inner_text('#cnt') == '125' and p.locator('.tap.s-count').count() == 1
    tapt(p, 'Undo the last one'); p.wait_for_timeout(2200); assert 'Counting: 124 portions · saved' in body(p)
    tapt(p, 'Finish lunch'); p.wait_for_timeout(900); assert 'Now the leftovers.' in body(p); p.locator('nav [data-to="people"]').click(); p.wait_for_timeout(150); assert 'Finished: 124 portions' in body(p)
    # the day is chosen in a calendar, not after today
    p.locator('[data-a="dayAsk"]').click(); p.wait_for_timeout(150)
    assert 'Which day are you counting?' in body(p) and p.locator('.cal label:has([data-d="2026-11-19"]) .sd.done').count() == 1  # lunch is finished: dinner is not counted
    p.locator('.cyp-pager [data-a="calMonth"][data-d="-1"]').click(); p.wait_for_timeout(120); assert 'October 2026' in body(p) and p.locator('.cal [data-d="2026-10-31"]').count() == 1; p.locator('.cyp-pager [data-a="calMonth"][data-d="1"]').click(); p.wait_for_timeout(120); assert 'November 2026' in body(p) and p.locator('.cyp-pager [data-d="1"]').is_disabled()
    p.locator('.cal [data-d="2026-11-17"]').click(); p.wait_for_timeout(100)
    t = body(p); assert 'Tue 17 Nov · not today' in t and 'Yes, count Tue 17 Nov' in t and 'Back to today' in t, t[:500]
    shot(p, '05c_calendar_day')
    p.locator('[data-a="dayConfirm"]').click(); p.wait_for_timeout(150)
    assert p.locator('.daybar .cyp-tag--warn').count() == 1
    t = body(p); assert 'Tue 17 Nov' in t and 'Not today' in t and 'Not counted' in t and p.inner_text('#cnt') == '0', t[:400]
    # the day is changed only from the calendar: no arrows in the day bar
    assert p.locator('[data-a="day"]').count() == 0 and 'Back to today' not in body(p) and p.locator('.daybar button').count() == 1
    # "I didn't count the people": at the bottom, in red; the meal is marked, without a number
    assert p.locator('main > *').last.inner_text() == "I didn't count the portions" and p.locator('main > .cyp-btn--no[data-a="noCount"]').count() == 1
    tapt(p, "I didn't count the portions"); p.wait_for_timeout(900)
    t = body(p); assert 'Portions not counted · saved' in t and 'The people were not counted for lunch on Tue 17 Nov' in t and "I didn't count the portions" not in t and 'Finish lunch' not in t and p.locator('.tap.s-skip').count() == 1, t[:700]
    shot(p, '05d_people_not_counted')
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); sk = [e for e in db['entries'] if e['type'] == 'people' and e['date'] == '2026-11-17' and not e.get('del')][0]; assert sk['data'] == {'n': 0, 'skip': True}, sk
    # a tap opens the count again; with plates counted the app asks before removing them
    p.locator('.tap').click(); p.wait_for_timeout(200); assert p.inner_text('#cnt') == '1' and 'were not counted' not in body(p) and p.locator('.tap.s-count').count() == 1
    tapt(p, "I didn't count the portions"); assert 'The count of 1 portion will be removed.' in body(p); tapt(p, 'Keep the count'); assert p.inner_text('#cnt') == '1' and 'will be removed' not in body(p)
    tapt(p, "I didn't count the portions"); tapt(p, 'Yes, not counted'); p.wait_for_timeout(900); assert 'Portions not counted · saved' in body(p) and p.inner_text('#cnt') == '0'
    # each step has its own "not done" button at the bottom, in red; the other steps stay open and the step can be added later
    p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(150)
    assert p.locator('.steprow .cyp-tag').all_inner_texts()[2] == 'Not done' and 'Portions not counted' in body(p)
    p.locator('.step[data-to="menu"]').click(); p.wait_for_timeout(150)
    assert p.locator('main > *').last.inner_text() == "I didn't write the menu" and p.locator('main > .cyp-btn--no[data-a="stepSkip"][data-s="menu"]').count() == 1
    tapt(p, "I didn't write the menu"); p.wait_for_timeout(300)
    t = body(p); assert 'Menu not written on Tue 17 Nov. It can still be added later.' in t and 'Menu not written. It can still be added.' in t and 'Quantities for today' in t, t[:600]
    p.locator('.step[data-to="before"]').click(); p.wait_for_timeout(150); assert p.locator('main > *').last.inner_text() == "I didn't count the quantities"
    tapt(p, "I didn't count the quantities"); p.wait_for_timeout(900)
    # a step of a past day left empty is Not done too: the leftovers of Tuesday
    assert p.locator('.steprow .cyp-tag').all_inner_texts() == ['Not done'] * 4 and p.locator('.steprow .cyp-tag--danger').count() == 4
    shot(p, '05e_steps_not_done')
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); sk = [e for e in db['entries'] if e['type'] == 'dskip' and e['date'] == '2026-11-17' and not e.get('del')][0]; assert sk['data'] == {'on': False, 'menu': True, 'before': True}, sk
    # leftovers too; then another person adds the menu: its mark goes, the quantities stay marked
    p.locator('.step[data-to="after"]').click(); p.wait_for_timeout(150); assert p.locator('main > *').last.inner_text() == "I didn't count the leftovers"
    p.locator('main .bk').click(); p.wait_for_timeout(150)
    p.locator('.step[data-to="menu"]').click(); p.wait_for_timeout(150)
    assert 'Menu not written (Anna Test). Write it here to add it.' in body(p) and p.locator('[data-a="stepSkip"]').count() == 0
    tapt(p, 'Next: quantities for today'); p.wait_for_timeout(900)
    assert 'Quantities not counted (Anna Test). Write it here to add it.' in body(p) and p.locator('[data-a="stepSkip"]').count() == 0
    # beta 1.11 (Mauro, 26/11): back goes to the page before: from the quantities to the menu of the day, then to Daily
    assert p.inner_text('main .bk') == 'What we eat', p.inner_text('main .bk')
    p.locator('main .bk').click(); p.wait_for_timeout(150); assert 'What do we eat today?' in body(p)
    p.locator('main .bk').click(); p.wait_for_timeout(150)
    assert p.locator('.steprow .cyp-tag').all_inner_texts()[:3] == ['Done', 'Not done', 'Not done'] and p.locator('.steprow .cyp-tag--ok').count() == 1, p.locator('.steprow').all_inner_texts()
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); sk = [e for e in db['entries'] if e['type'] == 'dskip' and e['date'] == '2026-11-17' and not e.get('del')][0]; assert sk['data'] == {'on': False, 'before': True}, sk
    p.locator('nav [data-to="people"]').click(); p.wait_for_timeout(150)
    p.locator('[data-a="dayAsk"]').click(); p.wait_for_timeout(100); assert 'Tue 17 Nov · not today' in body(p)
    tapt(p, 'Back to today'); today(p); assert 'Today' in body(p)
    assert p.inner_text('#cnt') == '124'
    # 30 minutes away: the day is asked again, and what was on the screen stays
    p.evaluate("S.hiddenAt = Date.now() - 31 * 60000; document.dispatchEvent(new Event('visibilitychange'))"); p.wait_for_timeout(200)
    today(p, 'MIN'); assert p.inner_text('#cnt') == '124'
    # ---- daily: the food of the whole day
    p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(100)
    t = body(p); assert 'Quantities for today' in t and 'Leftovers' in t and 'Portions' in t and '184' in t and 'cold room' in t, t[:800]; shot(p, '06_day')  # 124 at lunch + 60 at dinner, fixed
    p.locator('[data-to="menu"]').click(); p.wait_for_timeout(100)
    t = body(p); assert 'Breakfast' not in t and 'Lunch and dinner' in t and 'Porridge' not in t and 'Thu plan: fish' in t, t[:600]
    assert p.locator('#veg_Lunch').count() == 0 and p.locator('[data-a="rel"][data-m="Dinner"]').count() == 0 and p.locator('[data-a="rel"][data-m="Lunch"]').count() > 0  # dinner is the same as lunch; no vegetables (26/11)
    assert 'Cook' in body(p); p.locator('[data-a="cook"]').first.click(); assert p.locator('[data-a="cook"]:checked + span').inner_text() == 'Mary Test'
    p.locator('[data-a="rel"][data-m="Lunch"][data-id="chk"]').click()
    tapt(p, 'Next: quantities for today')
    t = body(p); assert 'Quantities for today' in t and 'In bags' in t and 'Add another food' in t and '½' in t, t[:800]
    p.locator('[data-a="unit"][data-k="mm"][data-v="use"]').click(); p.wait_for_timeout(100)
    p.fill('#q_mm', '30'); p.fill('#q_chk', '23'); tapt(p, 'Save')
    assert 'Write a number or tap Not counted' in body(p), body(p)[:500]
    p.fill('#q_pcs', '184')
    p.fill('#q_fsh', '1'); p.locator('[data-a="frac"][data-k="fsh"][data-v="0.5"]').click(); assert p.input_value('#q_fsh') == '1.5'
    p.fill('#q_fsh', '1/2')
    p.locator('[data-a="addRow"][data-id="brd"]').click(); p.wait_for_timeout(100); p.fill('#q_brd', '6')
    # beta 1.9 (Mauro, 26/11): the portions cooked, against the menu of the week (Thursday: 100 lunch + 60 dinner + 10 Ukubalula)
    t = body(p); assert 'Portions cooked today' in t and 'Menu of the week: 170 portions (100 lunch + 60 dinner (sapa) + 10 for Ukubalula).' in t, t[:1500]
    p.fill('#q_pc', '170'); p.wait_for_timeout(100); assert 'Matches the menu of the week' in p.inner_text('#pcm')
    p.fill('#q_pc', '175'); p.wait_for_timeout(100); assert '5 more than the menu of the week' in p.inner_text('#pcm').replace('\n', ' ') and p.locator('#pcw').count() == 1
    tapt(p, 'Save'); assert 'Write why the portions cooked are more than the menu of the week.' in body(p)
    p.fill('#pcw', 'Five teachers ate'); assert p.input_value('#q_pc') == '175'
    # beta 1.11 (Letizia, 26/11): no division of the portions here; the protein is chosen while counting
    assert 'Not everyone ate the same food?' not in body(p)
    shot(p, '06b_before'); tapt(p, 'Save'); p.wait_for_timeout(500)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); bf = [e for e in db['entries'] if e['type'] == 'dbefore' and e['centre'] == 'MIN' and e['date'] == '2026-11-19' and not e.get('del')][0]['data']
    assert bf['pc'] == 175 and bf['pcw'] == 'Five teachers ate' and 'pc' not in bf['q'], bf
    assert 'pp' not in bf, bf
    t = body(p); assert 'Mealie meal 30 kg' in t and 'Fish 0.5 kg' in t and 'Bread 6 loaves' in t and 'Cook: Mary Test' in t, t[:800]
    p.locator('[data-to="after"]').click(); p.wait_for_timeout(100)
    assert 'Leftovers' in body(p)
    # beta 1.7 (Daniela, 26/11): only the portions remained; at Minsundu they feed the dinner of the menu of the week first
    t = body(p); assert 'Portions remained (portions)' in t and 'after lunch' in t and p.locator('#q_mm').count() == 0 and p.locator('.dinsplit .cyp-stat').count() == 3, t[:1200]
    assert 'Write the portions remained' in p.inner_text('#bal')
    p.fill('#q_pr', '50'); p.wait_for_timeout(150); t = p.inner_text('#din'); assert 'Only 50 portions remained for a dinner of 60: 10 missing.' in t, t
    p.fill('#q_pr', '69'); p.locator('[data-a="step"][data-k="pr"][data-s="1"]').click(); assert p.input_value('#q_pr') == '70'
    t = p.inner_text('#din').replace('\n', ' '); assert 'REMAINED AFTER LUNCH 70' in t and 'DINNER (SAPA) 60' in t and 'LEFT FOR ANOTHER DAY 10' in t, t
    b = p.inner_text('#bal'); assert 'A PORTION' in b and '147 g' in b and '204 portions cooked: 194 portions eaten (124 counted + 60 dinner (sapa) in the plan + 10 for Ukubalula) + 10 portions left. Kitchen staff: not written (Portions).' in b and '9 pieces' in b and '1.47 kg' in b, b   # 30 kg for 204 portions
    shot(p, '07_after'); tapt(p, 'Save'); p.wait_for_timeout(500)
    t = body(p); assert '147 g a portion' in t and 'Kitchen staff' in t and 'To write in Portions' in t and 'Portions remained' in t and 'Left for another day' in t and '10 portions' in t, t[:900]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    af = [e for e in db['entries'] if e['type'] == 'dafter' and e['centre'] == 'MIN' and e['date'] == '2026-11-19' and not e.get('del')][0]['data']
    assert af == {'pr': 70, 'q': {}, 'nc': {}, 'u': {}}, af
    p.locator('[data-to="after"]').click(); p.wait_for_timeout(150); assert p.input_value('#q_pr') == '70'; p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(100)
    # beta 1.6: the kitchen staff who ate, written in People; they go into the plates of the food a plate
    p.locator('nav [data-to="people"]').click(); p.wait_for_timeout(150); t = body(p); assert 'Kitchen staff who ate today' in t and 'Not written yet.' in t, t[:1500]
    # beta 1.11 (Letizia): two proteins on the menu (fish, chicken): the protein of the portions counted now
    t = body(p); assert 'Protein of the portions you count now' in t and p.locator('[data-a="prot"]').count() == 2, t[:1500]
    p.locator('[data-a="prot"][data-id="chk"]').click(); p.wait_for_timeout(120); assert 'Chicken: +1' in p.inner_text('.tap')
    p.locator('[data-a="tap"]').click(); p.locator('[data-a="add"][data-n="5"]').click(); p.wait_for_timeout(3000)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); pl = [e for e in db['entries'] if e['type'] == 'people' and e['centre'] == 'MIN' and e['date'] == '2026-11-19' and e['meal'] == 'Lunch' and not e.get('del')][0]['data']
    assert pl['n'] == 130 and pl['pf'] == {'fsh': 0, 'chk': 6}, pl
    assert p.inner_text('[data-pfn="chk"]') == '6'
    tapt(p, 'Undo the last one'); tapt(p, 'Undo the last one'); p.wait_for_timeout(3000)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); pl = [e for e in db['entries'] if e['type'] == 'people' and e['centre'] == 'MIN' and e['date'] == '2026-11-19' and e['meal'] == 'Lunch' and not e.get('del')][0]['data']
    assert pl['n'] == 124 and 'pf' not in pl, pl
    p.fill('#stn', '6'); p.locator('[data-a="saveStaff"]').click(); p.wait_for_timeout(600); assert 'Saved: 6 people.' in body(p)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); stf = [e for e in db['entries'] if e['type'] == 'staff' and not e.get('del')]; assert len(stf) == 1 and stf[0]['data'] == {'n': 6} and stf[0]['date'] == '2026-11-19', stf
    shot(p, '05c_staff'); p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(150); t = body(p); assert '143 g a portion' in t, t[:900]   # 30 kg for 210 portions
    # ---- weekly: deliveries, the stock at the end of the week, the balance
    p.locator('nav [data-to="week"]').click(); p.wait_for_timeout(100)
    t = body(p); assert '1. Menu of the week' in t and '2. Deliveries' in t and 'No. 28587' in t and '3. Stock in the fridge' in t and 'Balance of the week' in t, t[:1200]
    assert 'Stock at the start of the week' not in t and 'Copy the delivery notes' not in t and 'No. 28301' not in t, t[:1200]
    shot(p, '07b_week')
    p.locator('main [data-to="endweek"]').click(); p.wait_for_timeout(100)
    t = body(p); assert 'expected' not in t and 'missing' not in t and p.locator('#d_chk').count() == 0, t   # the person only counts
    assert 'What is in the store and in the fridge, once a week' in t
    p.fill('#q_chk', '24'); assert 'missing' not in body(p)
    # comment window: the page under it does not move, a new sync does not clear what is typed
    # beta 1.7: no More page; the comment opens from the bubble at the top right and the page stays
    y0 = p.evaluate('window.scrollY'); assert p.locator('nav a').all_inner_texts() == ['Portions', 'Daily', 'Weekly']
    p.locator('[data-a="comment"]').click(); p.wait_for_timeout(100)
    # the comment opens in a sheet that fills the screen, with the text box at the top and ready: nothing to scroll to
    r = p.evaluate("(() => { const b = document.querySelector('.cyp-sheet').getBoundingClientRect(), t = document.getElementById('ct').getBoundingClientRect(), k = document.querySelector('[data-a=commentSave]').getBoundingClientRect(); return [Math.round(b.top), t.top > 0 && t.bottom < innerHeight / 2, Math.round(b.height) === innerHeight && k.bottom <= innerHeight, document.activeElement.id]; })()")
    assert r == [0, True, True, 'ct'], r
    shot(p, '08_comment_top')
    assert p.evaluate('window.scrollY') == y0
    p.locator('#ct').type('Half typed'); p.evaluate('sync()'); p.wait_for_timeout(900)
    assert p.input_value('#ct') == 'Half typed' and p.evaluate('document.activeElement.id') == 'ct'
    assert p.locator('.cyp-sheet__head button').inner_text() == 'Close'; tapt(p, 'Close'); assert p.evaluate('window.scrollY') == y0, p.evaluate('window.scrollY')
    assert 'Stock in the fridge' in body(p) and 'always count on that same day' in body(p) and p.input_value('#q_chk') == '24'
    tapt(p, 'Save and carry to next week'); assert 'Write a number or tap Not counted' in body(p)
    for it in ['mm', 'egg', 'fsh', 'bea', 'sau', 'brd']: p.locator('[data-a="nc"][data-k="%s"]' % it).click()
    # beta 1.8 and 1.10 (Mauro, 26/11): no scale, and they count as they see it: whole chickens and cut pieces (8 in a small chicken), pork in bags, the mark "about"
    assert p.locator('#q_x_mm').count() == 0 and p.locator('[data-a="about"][data-k="fsh"]').count() == 0   # nothing more for a food not counted
    t = body(p); assert 'And cut pieces (pieces)' in t and '1 chicken = how many pieces?' in t and 'And bags (bags)' in t and p.inner_text('#cv_chk') == '10 pieces = 1 chicken.', t[:3000]
    p.fill('#q_chk', '20'); p.fill('#q_x_chk', '30'); p.wait_for_timeout(100); assert p.inner_text('#cv_chk') == 'All together: about 23 chickens', p.inner_text('#cv_chk')
    p.fill('#bk_chk', '8'); p.fill('#q_x_chk', '32'); p.wait_for_timeout(100); assert p.inner_text('#cv_chk') == 'All together: about 24 chickens', p.inner_text('#cv_chk')
    p.fill('#q_prk', '0'); p.fill('#q_x_prk', '3'); p.locator('[data-a="about"][data-k="prk"]').click(); p.wait_for_timeout(120)
    assert p.inner_text('#cv_prk') == 'Write about how many kg one bag holds.' and p.input_value('#q_x_prk') == '3' and p.input_value('#q_x_chk') == '32'
    tapt(p, 'Save and carry to next week'); assert 'Write about how many kg one bag holds: Pork.' in body(p)
    p.fill('#bk_prk', '4'); p.wait_for_timeout(100); assert p.inner_text('#cv_prk') == 'All together: about 12 kg'
    shot(p, '09b_fridge'); tapt(p, 'Save and carry to next week'); p.wait_for_timeout(500)
    t = body(p); assert 'Stock in the fridge saved' in t, t[:1500]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); ew = [e for e in db['entries'] if e['type'] == 'endweek' and e['centre'] == 'MIN' and not e.get('del')][0]['data']
    assert ew['q']['chk'] == 24 and ew['q']['prk'] == 12 and ew['alt'] == {'chk': {'n': 32, 'u': 'pieces', 'w': 20, 'k': 8}, 'prk': {'n': 3, 'u': 'bags', 'k': 4}} and ew['ab'] == {'prk': True} and not any(k.startswith('x_') for k in ew['q']), ew
    p.locator('.step[data-to="endweek"]').click(); p.wait_for_timeout(150); assert p.input_value('#q_chk') == '20' and p.input_value('#q_x_chk') == '32' and p.input_value('#bk_chk') == '8' and p.input_value('#bk_prk') == '4' and p.locator('[data-a="about"][data-k="prk"]').is_checked(); p.locator('main .bk').click(); p.wait_for_timeout(150)
    # balance: chickens ordered 48, left 24 -> 24; daily counts 23
    g = p.inner_text('.grid4'); assert 'Chicken' in g and '48' in g and '24' in g and '21.91' in g, g   # daily: 23 out, 10 of 210 portions left
    shot(p, '08c_week_done')
    # the button that cancelled the food of the whole day is gone
    p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(100)
    assert "I didn't count the food" not in body(p) and 'Quantities for today' in body(p)
    # offline: counting goes on, the date still moves
    urllib.request.urlopen(B + '/__down').read(); ctx.set_offline(True)
    p.locator('nav [data-to="people"]').click(); p.wait_for_timeout(100); p.locator('.tap').click(); tapt(p, 'Undo the last one'); p.wait_for_timeout(2500)
    assert 'No internet. Saved on this' in body(p) and p.inner_text('.cyp-appbar__sync') == 'Offline', body(p)[:300]
    shot(p, '09_offline')
    ctx.set_offline(False); urllib.request.urlopen(B + '/__up').read()
    p.evaluate("window.dispatchEvent(new Event('online'))"); p.wait_for_timeout(1500)
    assert 'to send' not in body(p), body(p)[:300]
    # the app left open overnight: the next day starts on the new date
    p.evaluate("S.today = S.date = eatAddDays(todayStr(), -1); newDay()"); p.wait_for_timeout(100)
    today(p); assert p.evaluate('S.date === todayStr()') and 'Which day' not in body(p)
    # comment
    p.locator('[data-a="comment"]').click(); p.fill('#ct', 'Test comment from Anna'); tapt(p, 'Save the comment'); p.wait_for_timeout(800)
    # after the comment the person is back on the page the comment is about
    assert 'Comment saved. Thank you.' in body(p) and p.locator('.tap').count() == 1 and p.locator('nav a[aria-current]').inner_text() == 'Portions'
    # the speech bubble at the top right (Mauro, 24/11): a comment in one tap, saved with the page it is on, and the page stays
    assert p.locator('.cyp-appbar .cyp-appbar__action').count() == 2 and p.locator('.cyp-appbar [data-a="comment"]').bounding_box()['width'] >= 48 and p.locator('.cyp-appbar [data-a="switchAsk"]').bounding_box()['width'] >= 48
    p.locator('.cyp-appbar [data-a="comment"]').click(); p.wait_for_timeout(150); assert p.locator('#ct').count() == 1
    p.fill('#ct', 'Comment from the bubble'); tapt(p, 'Save the comment'); p.wait_for_timeout(800)
    assert 'Comment saved. Thank you.' in body(p) and p.locator('.tap').count() == 1
    cm = [c for c in json.loads(urllib.request.urlopen(B + '/__dump').read())['comments'] if c['text'] == 'Comment from the bubble']; assert len(cm) == 1 and cm[0]['screen'].startswith('people'), cm
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    types = sorted(set(e['type'] for e in db['entries'] if not e.get('del')))
    assert types == ['dafter', 'dbefore', 'dmenu', 'dskip', 'endweek', 'note', 'people', 'plan', 'staff'], types
    assert not any(e['type'] == 'people' and e['meal'] != 'Lunch' for e in db['entries'] if not e.get('del'))
    assert db['comments'][0]['byName'] == 'Anna Test' and db['comments'][0]['screen'] == 'people · Lunch', db['comments'][0]
    # ---- overview
    signout(p)
    p.locator('[data-a="mode"][data-m="admin"]').click(); pin(p, '9876'); p.wait_for_timeout(800)
    # beta 1.11 (Mauro, 26/11): one page for accountability, no cover and no chapters: four numbers, the canteens with a verdict and their days, what to check, the food, the last weeks
    t = body(p); assert 'Canteens this week' in t and 'To check' in t and 'Food this week' in t and 'Last four weeks' in t and p.locator('[data-a="ovStart"]').count() == 0 and p.locator('.cyp-nav--chapters').count() == 0, t[:900]
    assert p.locator('.cyp-stat').count() == 4 and p.locator('a.ovc').count() == 4 and p.locator('a.ovc.cyp-c-minsundu .dg').count() == 7, p.locator('a.ovc').count()
    mn = p.text_content('a.ovc.cyp-c-minsundu'); assert 'Minsundu' in mn and 'To check' in mn and '1 of 4' in mn and 'Not accounted-35' in mn, mn
    assert p.locator('a.ovc.cyp-c-minsundu .dg--done').count() == 1 and p.locator('a.ovc.cyp-c-minsundu .dg--future').count() == 3, p.evaluate("[...document.querySelectorAll('a.ovc.cyp-c-minsundu .dg')].map(x => x.className).join(' ')")
    assert 'days not complete' in t and 'fridge' in t and 'Holy Family' not in p.text_content('a.ovc.cyp-c-luigi'), t[:2000]
    assert p.locator('.cyp-appbar__plate img').count() == 1 and p.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    shot(p, '10a_overview')
    # a canteen opens its days, the menu of the week and the fridge
    p.locator('a.ovc[data-id="MIN"]').click(); p.wait_for_timeout(300)
    t = body(p); assert 'day by day' in t and p.locator('#ovsel').count() == 1 and p.locator('[data-check="MIN"]').count() == 1 and 'Plan of the week' in t, t[-2500:]
    ck = p.inner_text('[data-check="MIN"]'); assert 'Start: no count before this week' in ck and 'End: counted Thu 19 Nov' in ck and 'Expected not known: there is no count before this week.' in ck, ck
    p.evaluate("queue({ kind: 'entry', e: { type: 'endweek', centre: 'MIN', date: '2026-11-15', meal: '', data: { q: { mm: 4, chk: 4 } }, by: '', byName: 'Overview', at: nowIso() } }); render()"); p.wait_for_timeout(900)
    ck = p.inner_text('[data-check="MIN"]'); print('CHECK MIN:', ck.replace('\n', ' | '))
    assert 'from the count of Sun 15 Nov' in ck and 'Start 4 + delivered 48 − cooked 21.91 = expected 30.09 · counted 24' in ck and '6.09 chickens missing' in ck and 'Daily food counted on 1 of 4 days' in ck and 'shows as missing' in ck, ck
    t = body(p); assert '6.09 chickens missing in the fridge count of Thu 19 Nov' in t and 'Food missing' in p.text_content('a.ovc.cyp-c-minsundu') and p.locator('.cyp-stat__figure').nth(2).inner_text() == '1', t[:3000]
    tapt(p, 'Close Minsundu', exact=False); p.wait_for_timeout(200); assert p.locator('#ovsel').count() == 0
    shot(p, '10_overview')
    with p.expect_download() as dl: tapt(p, 'Export all data in Excel')
    dl.value.save_as('/tmp/eat_export.xlsx')
    tapt(p, 'Open the delivery notes'); p.wait_for_timeout(100)
    t = body(p); assert 'Chicken 24 chickens · and 2 chickens for Chinika House' in t and 'Chicken 2 chickens · part of the note for Nkwazi Centre' in t, t[:2500]
    shot(p, '10b_notes_parts')
    p.locator('[data-a="noteOpen"][data-no="28301"]').first.click(); p.wait_for_timeout(100)
    assert 'See the photo of the note' in body(p)
    # a part added by hand: not more than the note has
    p.select_option('#pto', label='Chinika House'); p.select_option('#pit', 'mm'); p.fill('#pqt', '20'); tapt(p, 'Add the part')
    assert 'the part cannot be more' in body(p)
    p.select_option('#pto', label='Chinika House'); p.select_option('#pit', 'mm'); p.fill('#pqt', '2'); tapt(p, 'Add the part')
    assert '2 bags of mealie meal for Chinika House' in body(p)
    tapt(p, 'Save the note'); tapt(p, 'Save the note'); p.wait_for_timeout(1200)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    n3 = [e for e in db['entries'] if e['type'] == 'note' and e['data']['no'] == '28301' and not e.get('del')][0]
    assert n3['data']['parts'][0]['q'] == {'mm': 2} and n3['data']['photo'] == 'photo_28301_abcdef', n3
    # units: beans are counted in bags; pork can be in bags or pieces
    settings(p, 'food'); t = body(p); assert 'Chicken' in t and 'Pork' in t and 'Fish' in t and 'Beans' in t, t[:600]
    assert p.input_value('#un_bea') == 'bags' and p.input_value('#un_prk') == 'kg' and p.locator('#pe_prk').count() == 0
    assert p.locator('#un_bea option').all_inner_texts() == ['kg', 'bag', 'tray', 'can', 'pack', 'piece'] and p.locator('#un_brd option').first.inner_text() == 'loaf'
    # no fixed row under the bar: when the page is scrolled the bar stays at the top and the pages at the bottom
    p.evaluate('window.scrollTo(0, 500)'); p.wait_for_timeout(150)
    r = p.evaluate("(() => { const h = document.querySelector('.hdr').getBoundingClientRect(), n = document.querySelector('.cyp-tabbar--fixed').getBoundingClientRect(); return [window.scrollY, h.top, h.height, Math.round(n.bottom) === innerHeight]; })()")
    assert r[0] > 300 and r[1] == 0 and r[2] == 56 and r[3], r
    p.evaluate('window.scrollTo(0, 0)')
    p.select_option('#un_prk', 'bags'); p.wait_for_timeout(100); assert '1 bag' in body(p)
    p.fill('#pe_prk', '5'); p.fill('#pe_bea', '2.5'); p.select_option('#un_fsh', 'pieces'); p.wait_for_timeout(100)
    shot(p, '10c_units'); tapt(p, 'Save the units'); p.wait_for_timeout(900)
    t = body(p); assert 'Units saved' in t and 'Still missing: how much is in one of fish' in t, t[:500]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); it = dict((i['id'], i) for i in db['items'])
    assert it['prk']['unit'] == 'bags' and it['prk']['per'] == 5 and it['bea']['unit'] == 'bags' and it['bea']['per'] == 2.5 and it['fsh']['unit'] == 'pieces' and it['fsh']['per'] == 0 and it['chk']['unit'] == 'chickens', it
    p.select_option('#un_fsh', 'kg'); tapt(p, 'Save the units'); p.wait_for_timeout(900)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); it = dict((i['id'], i) for i in db['items']); assert it['fsh']['unit'] == 'kg' and it['fsh']['per'] == 1, it['fsh']
    # meals: lunch and dinner only; a meal with a fixed number of plates is not counted
    settings(p, 'centres'); t = body(p); assert 'Breakfast' not in t and 'Dinner: always 60 portions, not counted' in t and 'Lunch: counted by tapping' in t, t[:700]
    # beta 1.6: the dinner eats the food taken out (off by default); the overview can still turn "cooked with the leftovers of lunch" on and off
    assert p.locator('[data-a="cdinleft"]').count() == 1 and not p.locator('[data-a="cdinleft"][data-id="MIN"]').is_checked()
    p.locator('[data-a="cdinleft"][data-id="MIN"]').click(); p.wait_for_timeout(600); db = json.loads(urllib.request.urlopen(B + '/__dump').read()); assert [c for c in db['centres'] if c['id'] == 'MIN'][0]['dinLeft'] is True
    p.locator('[data-a="cdinleft"][data-id="MIN"]').click(); p.wait_for_timeout(600); db = json.loads(urllib.request.urlopen(B + '/__dump').read()); assert [c for c in db['centres'] if c['id'] == 'MIN'][0]['dinLeft'] is False
    assert p.locator('[data-a="cmeal"]').count() == 8 and p.input_value('#fx_MIN_Dinner') == '60'
    shot(p, '10e_centres')
    p.locator('[data-a="cmeal"][data-id="NKW"][data-m="Dinner"]').click(); p.wait_for_timeout(200); p.fill('#fx_NKW_Dinner', '40'); p.locator('[data-a="fixSave"][data-id="NKW"][data-m="Dinner"]').click(); p.wait_for_timeout(900)
    assert 'Nkwazi Centre, Dinner: always 40 portions, not counted.' in body(p)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); ce = dict((c['id'], c) for c in db['centres'])
    assert ce['NKW']['meals'] == ['Lunch', 'Dinner'] and ce['NKW']['fixed'] == {'Dinner': 40} and ce['MIN']['fixed'] == {'Dinner': 60}, ce['NKW']
    p.fill('#fx_NKW_Dinner', ''); p.locator('[data-a="fixSave"][data-id="NKW"][data-m="Dinner"]').click(); p.wait_for_timeout(900)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); assert [c for c in db['centres'] if c['id'] == 'NKW'][0]['fixed'] == {}, db['centres']
    p.locator('[data-a="cmeal"][data-id="NKW"][data-m="Dinner"]').click(); p.wait_for_timeout(600)
    settings(p, 'backup'); t = body(p); assert 'Last backup: 2026-11-19 02:01' in t and 'On' in t, t[:500]
    settings(p, 'comments')
    assert 'Test comment from Anna' in body(p)
    tapt(p, 'Copy the 2 comments to do'); p.wait_for_timeout(200)
    clip = p.evaluate('navigator.clipboard.readText()'); assert 'comments to do (2)' in clip and 'Test comment from Anna' in clip, clip
    p.locator('[data-a="cdone"]').first.click(); p.wait_for_timeout(300); p.locator('[data-a="cdone"]').first.click(); p.wait_for_timeout(300)
    t = body(p); assert 'Test comment from Anna' not in t and 'Nothing to do.' in t and 'Show the 2 done' in t, t[-600:]
    shot(p, '11_settings_comments')
    # install: from Settings, and the window that opens by itself when the browser can install
    tapt(p, 'Settings'); sec(p, 'install')
    tapt(p, 'Put CYP EAT on this computer'); p.wait_for_timeout(100)
    t = p.inner_text('#modal'); assert 'install icon' in t and 'Close' in t, t
    tapt(p, 'Close'); assert p.inner_text('#modal') == ''
    p.evaluate("(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window._prompted = 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); })()")
    p.wait_for_timeout(1900)
    t = p.inner_text('#modal'); assert 'Install CYP EAT' in t and 'Not now' in t, t
    tapt(p, 'Install CYP EAT'); p.wait_for_timeout(200)
    assert p.evaluate('window._prompted') == 1 and p.inner_text('#modal') == ''
    # Luigi cooks for Holy Family: two counts, saved together
    p.locator('nav [data-to="overview"]').click(); p.wait_for_timeout(200); signout(p)
    p.locator('[data-a="mode"][data-m="entry"]').click(); pin(p, '1234'); p.wait_for_timeout(300)
    # after the PIN: always who are you, then which centre; the choice of last time is only marked
    t = body(p); assert 'Who are you?' in t and 'Anna Test Volunteer · Last time' in t.replace('\n', ' ') and p.locator('.who').count() == 0, t[:400]
    p.reload(); p.wait_for_timeout(900); assert 'Who are you?' in body(p)
    tapt(p, 'Anna Test', exact=False); t = body(p); assert 'Which centre are you counting for?' in t and 'Minsundu Last time' in t.replace('\n', ' ') and 'Luigi Last time' not in t.replace('\n', ' '), t[:400]
    shot(p, '13_centre_after_pin')
    tapt(p, 'Luigi', exact=False); p.wait_for_timeout(200); today(p)
    # three steps where the leftovers are not counted; the Save of the quantities opens the count of the people
    assert [x[:2] for x in p.locator('.steprow').all_inner_texts()] == ['1.', '2.', '3.']
    p.locator('.step[data-to="before"]').click(); p.wait_for_timeout(150)
    for i in range(p.locator('[data-a="nc"]').count()): p.locator('[data-a="nc"]').nth(i).click()
    shot(p, '13b_save_and_count'); tapt(p, 'Save and count the portions'); p.wait_for_timeout(400)
    assert 'Tap: +1' in body(p) and 'Lunch · Luigi' in body(p), body(p)[:400]
    assert p.locator('[data-a="grp"]').count() == 2 and 'Holy Family' in body(p), body(p)[:600]
    p.locator('.tap').click(); p.locator('.tap').click(); p.locator('.tap').click()
    p.locator('[data-a="grp"][data-g="Holy Family"]').click(); tapt(p, '+10'); tapt(p, '+5'); tapt(p, 'Undo the last one')
    assert p.inner_text('#cnt') == '10'
    p.wait_for_timeout(2300)
    t = body(p); assert 'Counting: 13 portions · saved' in t and 'Luigi 3 · Holy Family 10 = 13 portions' in t, t[:700]
    shot(p, '14_luigi_holy_family')
    db = json.loads(urllib.request.urlopen(B + '/__dump').read())
    pe = [e for e in db['entries'] if e['type'] == 'people' and e['centre'] == 'LUI' and not e.get('del')][0]
    assert pe['data'] == {'n': 3, 'g': {'Holy Family': 10}}, pe
    # a phone that opens CYP EAT without the link: paste it once
    p2 = br.new_context(viewport={'width': 390, 'height': 844}).new_page(); p2.on('pageerror', lambda e: errors.append(str(e)))
    p2.goto(B + '/'); p2.wait_for_timeout(600)
    assert 'Open the link you received' in body(p2), body(p2)[:300]
    p2.fill('#lk', 'hello'); tapt(p2, 'Open'); assert 'not the CYP EAT link' in body(p2)
    p2.fill('#lk', 'CYP EAT: ' + B + '/?db=' + code + ' (keep it)'); tapt(p2, 'Open'); p2.wait_for_timeout(700)
    assert 'Sign in' in body(p2) and '?db=' in p2.url, body(p2)[:300]
    import os
    if os.environ.get('EAT_KEEP'): br.close(); print('errors:', [e for e in errors if 'ERR_INTERNET_DISCONNECTED' not in e]); print('UI test passed (data kept)'); sys.exit(0)
    # start clean before the real use: the overview removes the tests, the delivery notes stay, and a phone drops the tests at its next sync
    signout(p); p.locator('[data-a="mode"][data-m="admin"]').click(); pin(p, '9876'); p.wait_for_timeout(500)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); notes0 = sorted(e['data']['no'] for e in db['entries'] if e['type'] == 'note' and not e.get('del')); assert len(notes0) >= 5 and len([e for e in db['entries'] if not e.get('del')]) > len(notes0) + 8
    # beta 1.0: the counts of one day at one centre are removed by the overview (Settings > Remove the counts of a day)
    def live_keys(): return sorted(e['key'] for e in json.loads(urllib.request.urlopen(B + '/__dump').read())['entries'] if not e.get('del'))
    k0 = live_keys(); lui = [k for k in k0 if '|LUI|2026-11-19|' in k]; assert 'people|LUI|2026-11-19|Lunch' in lui and 'dbefore|LUI|2026-11-19|' in lui, lui
    settings(p, 'remove')
    t = body(p); assert 'Remove the counts of a day' in t and 'The delivery notes are not touched' in t and p.input_value('#rd') == '2026-11-19' and p.get_attribute('#rd', 'max') == '2026-11-19', t[:500]
    pick(p, '#rc', 'LUI')
    t = body(p).replace('\n', ' '); assert 'Saved on Thu 19 Nov, Luigi' in t and 'Lunch: 13 portions · Saved by Anna Test' in t and 'Quantities' in t and 'What to remove' in t, t[:900]
    # a day with nothing saved: no button
    p.fill('#rd', '2026-11-01'); p.locator('#rd').dispatch_event('change'); p.wait_for_timeout(150)
    t = body(p); assert 'Saved on Sun 1 Nov, Luigi' in t and 'Nothing is saved for this centre on this day.' in t and p.locator('[data-a="rmAsk"]').count() == 0, t[:600]
    p.fill('#rd', '2026-11-19'); p.locator('#rd').dispatch_event('change'); p.wait_for_timeout(150)
    # everything unticked: the button waits
    n = p.locator('[data-a="rmPick"]').count(); assert n >= 2
    for g in p.locator('[data-a="rmPick"]').evaluate_all('els => els.map(e => e.getAttribute("data-g"))'):
        if p.locator('[data-a="rmPick"][data-g="%s"]' % g).is_checked(): p.locator('[data-a="rmPick"][data-g="%s"]' % g).click(); p.wait_for_timeout(80)
    assert p.locator('[data-a="rmAsk"]').is_disabled()
    # only the plates; Close in the window removes nothing
    p.locator('[data-a="rmPick"][data-g="people"]').click(); p.wait_for_timeout(100); assert not p.locator('[data-a="rmAsk"]').is_disabled()
    p.locator('[data-a="rmAsk"]').click(); p.wait_for_timeout(200)
    t = p.inner_text('#modal').replace('\n', ' '); assert 'Remove these counts?' in t and 'Luigi, Thu 19 Nov' in t and 'Portions' in t and 'Quantities' not in t and 'cannot be undone' in t, t
    shot(p, '29_remove_day_window')
    tapt(p, 'Close'); p.wait_for_timeout(300); assert p.inner_text('#modal') == '' and live_keys() == k0
    p.locator('[data-a="rmAsk"]').click(); p.wait_for_timeout(200); tapt(p, 'Yes, remove'); p.wait_for_timeout(1500)
    k1 = live_keys(); assert k1 == [k for k in k0 if k != 'people|LUI|2026-11-19|Lunch'], sorted(set(k0) ^ set(k1))
    t = body(p).replace('\n', ' '); assert 'Removed from Luigi, Thu 19 Nov: portions and kitchen staff.' in t and 'Lunch: 13 portions' not in t and 'Quantities' in t, t[:900]
    assert p.evaluate("eatGet(view(), 'people', 'LUI', '2026-11-19', 'Lunch')") is None
    shot(p, '29b_remove_day_done')
    # the rest of that day at Luigi goes too; the other centres and the delivery notes stay
    for g in p.locator('[data-a="rmPick"]').evaluate_all('els => els.map(e => e.getAttribute("data-g"))'):
        if not p.locator('[data-a="rmPick"][data-g="%s"]' % g).is_checked(): p.locator('[data-a="rmPick"][data-g="%s"]' % g).click(); p.wait_for_timeout(80)
    p.locator('[data-a="rmAsk"]').click(); p.wait_for_timeout(200); tapt(p, 'Yes, remove'); p.wait_for_timeout(1500)
    k2 = live_keys(); assert k2 == [k for k in k0 if '|LUI|2026-11-19|' not in k] and any(k.startswith('note|') for k in k2) and any('|MIN|2026-11-19|' in k for k in k2), sorted(set(k0) ^ set(k2))
    assert 'Nothing is saved for this centre on this day.' in body(p)
    lg = json.loads(urllib.request.urlopen(B + '/__dump').read()); assert len(lg['entries']) >= len(k0), 'nothing is erased from the file'
    p.locator('nav [data-to="overview"]').click(); p.wait_for_timeout(300)
    p.evaluate("queue({ kind: 'start_clean', confirm: 'START' }); render()"); p.wait_for_timeout(1500)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); live = [e for e in db['entries'] if not e.get('del')]
    assert sorted(e['data']['no'] for e in live) == notes0 and all(e['type'] == 'note' for e in live), [e['key'] for e in live if e['type'] != 'note']
    t = body(p); assert p.locator('.cyp-stat__figure').first.inner_text() == '0' and 'Canteens this week' in t, t[:900]
    assert p.evaluate("view().entries.every(e => e.type === 'note')") and p.evaluate("view().names.length") == 2 and p.evaluate("(view().comments || []).length") >= 1
    shot(p, '30_start_clean')
    # beta 1.7 (Daniela, 26/11): undo the data of today, and a day when nobody of the team was at the centre
    signout(p); assert 'Sign in' in body(p)
    p.locator('[data-a="mode"][data-m="entry"]').click(); pin(p, '1234'); p.wait_for_timeout(300); tapt(p, 'Anna Test', exact=False); today(p, 'NKW')
    assert 'Undo the data of today' not in body(p)
    urllib.request.urlopen(B + '/__now?2026-11-19T10:00:00.000Z')   # the server on the day of the phone
    count(p); p.locator('.tap').click(); p.locator('.tap').click(); p.wait_for_timeout(2200); p.locator('nav [data-to="today"]').click(); p.wait_for_timeout(150)
    tapt(p, 'Undo the data of today'); t = p.inner_text('#modal'); assert 'Undo the data of today?' in t and 'Nkwazi' in t, t
    tapt(p, 'Yes, undo'); p.wait_for_timeout(1200)
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); assert not [e for e in db['entries'] if not e.get('del') and e['type'] != 'note' and e['centre'] == 'NKW' and e['date'] == '2026-11-19'], 'undone'
    assert 'was taken out' in body(p) and 'Undo the data of today' not in body(p)
    tapt(p, 'I was not present at the centre today'); tapt(p, 'Yes, nobody was there'); p.wait_for_timeout(800)
    t = body(p); assert 'Nobody of the team was at Nkwazi Centre on Thu 19 Nov' in t and 'does not count as zero' in t and 'What do we eat today?' not in t, t[:600]
    db = json.loads(urllib.request.urlopen(B + '/__dump').read()); sk = [e for e in db['entries'] if not e.get('del') and e['type'] == 'dskip' and e['centre'] == 'NKW']; assert sk and sk[0]['data'] == {'on': True, 'absent': True}, sk
    shot(p, '31_absent'); tapt(p, 'Undo'); p.wait_for_timeout(600); assert 'What do we eat today?' in body(p)
    # beta 1.8 (Daniela, 26/11): a way back on every screen: Weekly -> Daily -> the choice of the day -> the centre
    # beta 1.9: the pages of the bar go back to the choice of the day
    p.locator('nav [data-to="week"]').click(); p.wait_for_timeout(150); p.locator('[data-a="histBack"]').click(); p.wait_for_timeout(150); assert 'Which day are you counting?' in body(p)
    p.locator('[data-a="histBack"]').click(); p.wait_for_timeout(150); assert 'Which centre are you counting for?' in body(p)
    br.close()
print('errors:', [e for e in errors if 'ERR_INTERNET_DISCONNECTED' not in e])
print('UI test passed')
