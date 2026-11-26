# CYP EAT: sources (private)

CYP EAT is the canteen app of the Cicetekelo Youth Project (APJ23, Ndola). This private repository holds the sources. The public repository `maurobif-blip/cyp-eat` holds only what is published (GitHub Pages: https://maurobif-blip.github.io/cyp-eat/) and `Code.gs`. Project notes, in Italian, are in the claude.ai project "Evaluation Cicetekelo": `piattaforma/CYP-EAT_stato-attuale.md` (state, versions, decisions) and `piattaforma/CYP-EAT_storia-alpha.md`.

## Rules
- Never write the staff link, the database key, PINs or the Gemini key in this repository, in chat or in documents. The PINs are typed by Mauro, never by Claude.
- Nothing may touch or reset the data. Test data are removed only from the Overview session, with Mauro's ok.
- Publish (push to `cyp-eat`, new deployment of the script) only with Mauro's explicit ok. Script first, then the app.
- Before a push: pull both repositories and read the last commit. If it is not from this chat, port its changes first.
- Commit messages end with the attribution lines given by the session.
- App text in English; project notes in Italian; no em or en dashes in prose.

## Layout
- `core.js`: the rules (shared database, entries, sums, `eatDayUse`, `eatAccount`...). Runs in the app, in the Google script and in the tests (plain ES5).
- `src/google-side.gs`: the Google side (sheet mirror, Drive file, photo reader, nightly backup). `Code.gs` = `core.js` without its last line + this file.
- `src/index.html.draft1`: the old single page; `screens/assemble.py` cuts it and puts in the pieces of `screens/` (one file for each group of screens: `a.js` ... `o.js`, `icons.js`, `style.css`), then applies the replacement passes `b17.py` ... `b21.py`. Output: `src/index.html` (not in git).
- `build/build.py`: makes `site/` (not in git): page with wordmark and logo inside, `core.js`, `Code.gs`, service worker, icons, fonts and the CYP design system (`build/ds/bundle.css`, `tokens.css`, checked by sha256).
- `test/`: `core.test.js` (node), `server.js` (fake Google script on port 8765, fake photo reader, `/__now`, `/__dump`, `/__load`), `ui_test.py` (Playwright, clock fixed on Thu 19/11/2026), `look.py` (22 screens at 360 px and the overview at 1280 px).

## Build and test
```
python3 screens/assemble.py && python3 build/build.py
node test/core.test.js
node test/server.js 8765 &        # restart it before each UI run
EAT_KEEP=1 python3 test/ui_test.py  # leaves the test database full for look.py
sed "s/wait_for_timeout(120)/wait_for_timeout(20)/" test/look.py > /tmp/look_fast.py && python3 /tmp/look_fast.py
```
`ui_test.py` uses `/usr/bin/google-chrome`; change `executable_path` if the machine has another Chrome. The animation check of `look.py` depends on the speed of the machine.

## Publish (only with Mauro's ok)
1. Version: `EAT_VERSION` in `core.js` (beta 1.x). Build, run the tests.
2. Script: copy `site/Code.gs` into a clone of `maurobif-blip/cyp-eat`, commit, push. In Mauro's Chrome (Claude in Chrome, his Mac): open the Apps Script editor of the project "CYP EAT database" (`https://script.google.com/home/projects/1KtLji0AXfEiMBUFKQzX_KcCpi_-nFJCqdhfhhzEamWKFfTca_lVzhOaC/edit`), check that the account is maurobif@gmail.com, replace the text of the Monaco model with `raw.githubusercontent.com/maurobif-blip/cyp-eat/<commit>/Code.gs` keeping the lines `var SHEET_ID = ...` and `var WEB_APP_URL = ...` of the editor, save, then Esegui il deployment > Gestisci deployment > edit > Versione: Nuova versione > description "beta 1.x" > Esegui il deployment. A new Google service needs Mauro's consent window before the deployment.
3. App: copy `site/` (without `Code.gs`) into the clone of `cyp-eat`, commit, push. GitHub Pages serves it about a minute later; check `core.js?x=<n>` online.
4. Update `piattaforma/CYP-EAT_stato-attuale.md` in the project.

## Live data
The database is the Drive file `cyp-eat-database.json` (id `1QJhVXUmbvo8ReS0ARC8PZqNJbsm7edYI`), readable with the Google Drive connector (the text comes markdown-escaped: unescape `\\` and punctuation before `json.loads`). Comments of the users are in `comments`; when they are addressed, Claude marks them done from the Overview session (`comment_done`). To look at the overview with the real data: load a copy into the test server with `/__load`, after replacing `settings` with test PINs.
