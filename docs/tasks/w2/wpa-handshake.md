# wpa-handshake: WPA2/WPA3 handshake and what an attacker sees

| | |
|---|---|
| Task | `wpa-handshake` (wave 2b, Network fundamentals) |
| Catalogue entry | `net-wpa-handshake` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/wpa-handshake/` |
| Class | stepper |
| Size | M |
| Priority | B1 |
| Courses | URM, SEC |
| Topic / tags / level | `networks` / `wifi` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **PMK origin, 4-way handshake, why WPA2-PSK can be cracked offline and SAE can't**.

The student: step the handshake; toggle the attacker's capture view.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, section "Sigurnost bežične mreže: od otvorenog pristupa do WPA3" (802.11i, PSK vs 802.1X, PMK, WPA3/SAE, KRACK in "Šire o temi") and the Primjer on the home vs faculty network; figure `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch17-pmk-porijeklo-rukovanje.svg`
- IEEE 802.11i-2004 (4-way handshake, PTK derivation); Wi-Fi Alliance, *Wi-Fi CERTIFIED WPA3 security* (2018), as cited in ch17
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 10 "Bežične mreže": card "porijeklo PMK"
- `docs/proposal-simdeck.md` (first batch) and `docs/playbook.md` §10.8
- Catalogue seed: proposal first batch; URM card ch17-pmk-porijeklo-rukovanje

## Model and presets

- **Scene:** three lanes on the K1 sequence chart: station (STA), access point (AP) and a passive
  **observer** lane on the side ("what anyone in range can record"). Under STA and AP, a key panel shows what
  each side holds (passphrase, PMK, PTK split into KCK/KEK/TK, GTK); the observer panel shows only what went
  over the air. Secrets are drawn as locked boxes that never cross a lane.
- **State:** `{ mode, step, passphrase, ssid, onAir: [{msg, from, to, fields}], sta: {keys}, ap: {keys},
  observer: {captured: [...], canTestGuesses: bool, note}, guessRate, passClass }`.
- **One step:** one message (or one local derivation) happens; then both key panels and the observer panel
  update; the caption says what was sent and what it did **not** reveal.
- **Rules:**
  1. Personal mode: PMK = PBKDF2-HMAC-SHA1(passphrase, SSID, 4096 iterations, 256 bits); passphrase 8–63
     characters. The PMK is computed on both sides and never sent (IEEE 802.11i; book ch17 "Sigurnost bežične
     mreže", PSK paragraph).
  2. Enterprise mode: the PMK comes from a per-user 802.1X/EAP exchange with a RADIUS server, before the
     4-way handshake; the handshake that follows is identical (book ch17, the PMK paragraph and Primjer on
     home vs faculty network, figure `ch17-pmk-porijeklo-rukovanje.svg`).
  3. Message 1 (AP→STA): ANonce, in clear. Message 2 (STA→AP): SNonce and a MIC. Message 3 (AP→STA): ANonce,
     the GTK encrypted with the KEK, MIC, "install keys". Message 4 (STA→AP): acknowledgement with MIC.
     (IEEE 802.11i §8.5.3, check the clause number for the edition cited.)
  4. PTK = PRF(PMK, "Pairwise key expansion", min/max(AP MAC, STA MAC) ‖ min/max(ANonce, SNonce)); the PTK
     splits into KCK (computes the MIC), KEK (wraps the GTK) and TK (encrypts data). Each side derives the PTK
     after it has both nonces: STA after message 1, AP after message 2.
  5. On the air the observer records: both MAC addresses, the SSID, both nonces, the MICs and the encrypted
     GTK. Never the passphrase, PMK or PTK.
  6. **Why that matters in WPA2-Personal:** everything the PTK depends on except the PMK is public, and the
     PMK depends only on the passphrase and the SSID. So a recorded message 1 + 2 lets the observer *test a
     guessed passphrase offline*: guess → PMK → PTK → MIC, compare with the recorded MIC. No further contact
     with the network is needed, and nothing limits the rate except computing power. The defence is a long,
     random passphrase.
  7. Enterprise: the PMK is per user and not derived from a shared password, so a recorded handshake gives no
     shared password to test (the inner EAP method's strength is a separate topic: `aaa-8021x`).
  8. **WPA3-Personal (SAE):** before the 4-way handshake, STA and AP run SAE (commit, confirm). The PMK comes
     out of SAE, not from PBKDF2 of the passphrase, so a recording does not allow offline guessing: each guess
     needs a live SAE exchange with the AP, which can refuse or slow them down. SAE also gives forward
     secrecy: learning the password later does not decrypt earlier recordings. (Wi-Fi Alliance WPA3
     announcement cited in ch17; the SAE exchange itself is shown as two opaque messages, as the book keeps
     its detail out of scope.)
- **Params:** `mode` choice: WPA2-Personal / WPA2-Enterprise / WPA3-Personal (resets); `observer` toggle
  (show the observer lane and panel); `passClass` select: 8 lowercase letters / 8 mixed letters and digits /
  4 random dictionary words / 12 random characters / 20 random characters; `guessRate` range 10^3–10^10
  guesses per second, log scale.
- **Presets:**
  1. `home` (WPA2-Personal, observer off): the four messages and both key panels; 6 steps (PMK on both sides,
     M1, STA derives PTK, M2 + AP derives PTK, M3, M4 + install). From book ch17.
  2. `observer` (WPA2-Personal, observer on): the same 6 steps; after M2 the observer panel turns to "a guess
     can now be tested offline". A small explorer row below shows the passphrase space and time to try it all:
     8 lowercase letters 26^8 ≈ 2.1 × 10^11; 4 words from a 7,776-word list ≈ 3.7 × 10^15; 12 random
     characters from 62 ≈ 3.2 × 10^21; at 10^6 guesses/s that is about 2.4 days, 117 years and 10^8 years.
     Derived, unchecked: the arithmetic is exact; the guess rate is a slider, not a claim about hardware.
  3. `faculty` (WPA2-Enterprise, observer on): 802.1X/EAP shown as one grouped step that yields a per-user PMK,
     then the same four messages; the observer panel says "no shared password to test". 7 steps. From book
     ch17 Primjer (home vs faculty network).
  4. `wpa3` (WPA3-Personal, observer on): SAE commit and confirm (2 steps), then the four messages; the
     observer panel says "each guess needs the AP, online". 8 steps.
  5. `compare` (observer on): WPA2-Personal and WPA3-Personal side by side in lockstep (the kit's compare
     view if it exists, else two stacked charts), ending on the two observer verdicts. 8 steps.
- **Steps:** 6 / 6 / 7 / 8 / 8.
- **Legend:** in clear (solid arrow), encrypted (hatched arrow, `.sd-hatch`), secret held locally (locked
  box), recorded by the observer (eye mark). "Changed" highlights the key that was just derived, or the
  message just sent.
- **Captions:**
  - hr: "Poruka 2: klijent šalje svoj SNonce i MIC. Lozinka i PMK nisu poslani — ali sve ostalo od čega ovisi
    sesijski ključ sada je u zraku."
  - en: "Message 2: the client sends its SNonce and a MIC. The password and the PMK are not sent, but everything
    else the session key depends on is now on the air."
- **Terms:** 4-way handshake — rukovanje u četiri koraka; Pairwise Master Key (PMK) — glavni ključ;
  Pre-Shared Key (PSK) — unaprijed dijeljena lozinka; Pairwise Transient Key (PTK) — sesijski ključ;
  personal / enterprise mode — osobni / poslovni način rada; nonce — jednokratni broj *(check)*;
  offline guessing — pogađanje lozinke bez mreže *(check)*; Simultaneous Authentication of Equals (SAE).
  The Croatian terms not marked come from book ch17.
- **Misconceptions it targets:**
  - "WPA2 sends the password, or a hash of it, over the air." It sends neither.
  - "A recorded handshake reveals the password." It lets an observer test guesses offline, so the password's
    strength decides; a long random passphrase stays safe.
  - "Enterprise uses a different handshake." The same four messages; only the PMK's origin differs (the
    book's main point).
  - "WPA3 is WPA2 with a longer key." The difference is that offline guessing stops working.
- **Out of scope:** how guessing is done in practice (tools, hardware, capture commands), deauthentication,
  PMKID, KRACK (book ch17 "Šire o temi" mentions it; a possible later preset), TKIP vs CCMP internals, the
  mathematics of SAE (Dragonfly), group key handshake.
- **Note for the coordinator:** the attacker view is kept at the level the book and the proposal ask for:
  what is visible and why passphrase strength matters, as a defence lesson. No step performs or explains an
  actual attack.
<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `wpa-handshake` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh wpa-handshake sims/wpa-handshake` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/wpa-handshake/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
