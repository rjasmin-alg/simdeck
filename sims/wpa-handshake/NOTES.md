<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wpa-handshake: notes

New stepper (task `docs/tasks/w2/wpa-handshake.md`, catalogue `net-wpa-handshake`, wave 2b). Drawn with kit view
**K1, message sequence chart** (`kit/sequence.js`, kit 0.6.0), which exists, so nothing is drawn by hand in its place.
Rules and expected numbers: `SPEC.md`.

## Decisions

- **The observer is K1's eavesdropper column** (`eve`), not a third lane: the kit built that column for exactly this
  ("what a passive observer reads of that message"). The task's "observer lane on the side" is the column; its
  accumulated record and verdict are a side panel (the task's "observer panel").
- **Key panels are the lane card bodies**: passphrase (or the user's login in enterprise), PMK, KCK/KEK/TK (marked as
  one PTK by a bar on their left), GTK. Every secret is a locked box with a short hex prefix; a key not yet held is a
  dashed "none". "Changed" highlights the key derived in the step; the installed TK gets a thick border and ✓.
- **Real key derivation.** PMK (PBKDF2-HMAC-SHA1, 4096), PTK (802.11i PRF-384 with the min/max ordering) and the MIC
  key are computed for real in `sim.js` (SHA-1, HMAC, PBKDF2 and the PRF are about 90 lines, no dependency), so the
  same PMK on both sides and a new PMK for another passphrase are visible as values, and the tests can use the
  802.11i Annex H vectors. The MIC is computed over a stand-in for the frame, and `{GTK}KEK` is symbolic (SPEC.md,
  Simplifications). PBKDF2 takes about 40 ms in node and is memoised per passphrase and SSID.
- **Enterprise has a third lane**, the authentication server (the book figure's "802.1X, poslužitelj autentikacije").
  The EAP exchange is one arrow STA → server through the AP (one grouped step, as the task asks), then the server
  hands the PMK to the AP over the wire (a protected arrow, "nothing: not on the air" in the observer column). That
  makes 7 steps without a separate "PMK on both sides" step: STA and server get it in the EAP step.
- **SAE as two exchanges both ways** (commit, confirm: four arrows in two steps), because SAE is symmetric; the task's
  "two opaque messages" read as two message types. The SAE PMK is a stand-in that depends on the password and two
  fixed per-session random values (SPEC.md rule 8); Dragonfly itself stays out of scope.
- **`mode` has a fourth value, `compare`** (deviation): the task lists `mode` as three choices and `compare` as a
  preset; a preset needs a param value to select. Compare ends aligned: WPA2 waits during SAE (steps 1–2, "WPA2 has no
  exchange before the handshake: it waits"), then both runs do the same step from the PMK on, so the identical part
  sits side by side and both verdicts arrive at step 8. Nothing stops early.
- **The default run is `home`** (WPA2-Personal, observer off): `sim.json` `steps` = 6. `passClass` default is
  8 lowercase letters (the weak home password), `guessRate` 10^6.
- **`passClass` is disabled in enterprise** (no shared password) and **`guessRate` unless the explorer shows**
  (WPA2-Personal with the observer on); each says why in the hint, as the kit does for disabled params. Neither resets: changing the
  class recomputes the keys at the same step.
- **Explorer row** only in WPA2-Personal with the observer on, all five classes at once (log-scale bar of the time to
  try all, the chosen class marked "this network"), with the task's note "the arithmetic is exact; the rate is a slider,
  not a claim about hardware" on the page.
- **Receiver words** ("MIC correct", "checks the user", "over the wire") only where the arrow has room: not on M3
  (its field list fills the arrow) and not in the three-lane and compare charts. The MIC check is in the captions.
- **Captions** say what was sent and what was not; with the observer on, the step where the verdict changes appends
  the observer's line (M2 in WPA2-Personal: "can test a guessed password offline").
- **No attack is performed or explained**, as the task's note asks: the page states that a recorded M1 + M2 allows
  testing guesses (guess → PMK → PTK → MIC, compared with the recorded MIC) and shows the size of the passphrase space.
  The one place that runs that chain is a model test (rule 6), which checks that the recorded values suffice and that
  a wrong guess does not match. No tool, capture method or hardware is named.

## Deviations from the task

- `mode` gained `compare` (above).
- **"4 words … about 117 years"** in the task is 115.9 years (7776^4 / 10^6 s, Julian or 365-day year alike); the page
  shows 116. The other two figures (2.4 days, 10^8 years) are right.
- The observer is a column, not a lane (above).
- Rows are 2.35rem high instead of K1's 2.75rem at projector size, so a WPA3 run keeps more rows in view (page CSS sets
  `--sd-seq-row`; see Shared requests).

## Sources

- `uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, "Sigurnost bežične mreže: od otvorenog pristupa do WPA3"
  and Primjer 5 (osobni naspram poslovnog Wi-Fi-ja); figure `assets/diagrams/ch17-pmk-porijeklo-rukovanje.svg`.
- IEEE 802.11i-2004 §8.5.1.2, §8.5.3, Annex H.3 and H.4 (PRF and passphrase-to-PSK vectors, both reproduced).
  The same clauses are §12.7.1 and §12.7.6 in IEEE 802.11-2016 *(check against the edition the course cites)*.
- Wi-Fi Alliance, *Wi-Fi CERTIFIED WPA3™ security* press release, 26 June 2018 (as cited in ch17).
- The task file's numbers for the explorer.

## Checks

- Numbers: an independent Python script (stdlib `hashlib.pbkdf2_hmac`, `hmac`) reproduced the Annex H vectors, the
  scene's PMK, KCK/KEK/TK and MIC 2 (`a9092aa6…`, `fa9da4df…`, `c7f5085d…`, `184b7291…`, `985b6bc0…`, now fixed in
  `sim.test.js`) and the explorer table (2.417 days, 6.919 years, 115.9 years, 1.022 × 10^8 years,
  2.232 × 10^22 years at 10^6/s).
- Rule tests broken on purpose, one mutation at a time (21 mutations: PBKDF2 iterations and salt, min/max order and
  signed compare, KCK/KEK swap, PRF label, STA deriving before M1, a MIC in M1, GTK held early, PMK leaked into M2,
  MACs/SSID not recorded, testable after M1, the wired PMK on the air, AP holding the enterprise PMK early, enterprise
  testable, SAE PMK from PBKDF2, one-way SAE, compare without waiting, explorer exponent, MIC key): every one fails a
  test.
- `npm run gate -- wpa-handshake`: all checks pass; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus each preset at its key step (observer step 4, faculty step 7, wpa3 step 8, compare steps 6
  and 8) in both languages.
- **Fresh review** (a separate agent read the diff against SPEC.md and broke rules on purpose, 38 mutations). Fixed
  from it: the rule 5 test now catches any 8-character part of a secret, a hash of the password or login and the
  PSK-style PMK, in every mode, with its own secret list; eap and sae have their own captured-list tests (MACs and SSID
  with the first frame, SAE values from both sides); tests for the SAE PMK depending on the password, `passClass` in
  compare, nobody installing before M4 and the GTK after M3 in every mode, `changed`, the explorer's other two times;
  SPEC's M3 MIC sentence; the guess-rate slider now disabled unless the explorer shows; the compare column titles from
  the string table; the WPA3 reason (random values that never go on the air, recorded SAE values that do not let a guess
  be checked) in cmp6 and the explanation; the M1 reason, "GTK in clear" and four Croatian wordings. The 14 mutations
  that had survived are caught now. Left as is: `canTestGuesses` ≡ anonce && snonce (equivalent, the MIC comes with the
  SNonce), `cmpBytes` length order (lengths always equal), and consistent changes to the M3/M4 MIC stand-in on both
  sides (no vector pins a stand-in).

## Unchecked *(check)*

- Croatian "jednokratni broj" for *nonce* and "pogađanje lozinke bez mreže" for *offline guessing* (the task marks
  both *(check)*; not in the book).
- The 802.11-2016 clause numbers above.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| Pairwise Master Key (PMK) | glavni ključ | book ch17 |
| Pairwise Transient Key (PTK) | sesijski ključ | book ch17 |
| Pre-Shared Key (PSK) | unaprijed dijeljena lozinka | book ch17 |
| personal / enterprise mode | osobni / poslovni način rada | book ch17 |
| nonce | jednokratni broj | task *(check)* |
| offline guessing | pogađanje lozinke bez mreže | task *(check)* |
| Simultaneous Authentication of Equals (SAE) | (no Croatian term; the book keeps the English) | book ch17 |

`4-way handshake` (rukovanje u četiri koraka) is in the glossary and used as `[[4-way handshake]]`.

## Shared requests

- **K1: a row height option** (`spec.rowHeight`, or a documented `--sd-seq-row` override). The page sets
  `--sd-seq-row: 2.35rem` at projector size: with tall lane cards (six key rows) the default 2.75rem left only
  4–5 rows of a 14-row WPA3 run in view. Smallest change: document the custom property as page-settable in
  `docs/sim-ui.md` §11, or add `rowHeight` to the spec next to `timeWidth`.
- **K1: a two-way message** (one row, arrows both ways, for symmetric exchanges such as SAE commit/confirm or a
  key agreement) would halve the SAE rows. Not needed now; noted for later consumers (`tls-handshake` has the same
  shape in its key share).

## Time

Start 2026-10-04 00:56, done (gate passing, review addressed) 2026-10-04 01:26, about 30 min of build and review.
