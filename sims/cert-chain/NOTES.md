<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# cert-chain: notes

New stepper (task `docs/tasks/w2/cert-chain.md`, catalogue `inet-cert-chain`, wave 2b). No kit view fits (K1–K4 are
sequence, topology, rule table, block grid), so the page draws its own stage in HTML: certificate cards, signature
arrows, the client's store and clock, the numbered checks and the result. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Stories of machine states.** The book's point is "one command, five machine states", so a preset is a sequence of
  states (`story`: `book`, `intermediate`, `clocks`, `one`). The params set the first state; the story's events change
  it (open the firewall, use `www1.crt`, add the anchor, use the expired certificate). An event that changes nothing
  still makes a state and the caption says "(It already was so.)". The client's clock offset applies to every state.
  `story` is a param without a visible control (presets set it), so a link keeps it.
- **One check per step**, and a state changes together with its first check (connect), so the book's sequence is
  1 + 4 + 2 + 4 + 3 = 14 steps. Issuer search and signature are one check ("who signed
  it, and does the signature verify?"); the date is the next; reaching a certificate that is in the store is the
  `anchor` check (its date included).
- **The estate story** (`expiry-clocks`) moves the true date one event per step (2026-11-02, 11-18, 11-19, 11-20,
  12-01, 12-02) and shows every check at once, two rows: the wildcard on its five endpoints, p4-commit. 5 steps.
- **Result box:** exit status, the client's message as the book prints it (data, untranslated, `translate="no"`), the
  TLS alert (or "none: the conversation never started" for 7), and **where the fix is** (server / client), from the
  task's misconception "the fix is always on the server". Rule 9 in SPEC.md.
- **Sequence strip** above the stage: one chip per state with its exit status once run, so the book's
  7 → 60 → 60 → 0 → 60 is on screen at the end.
- **The store always holds a public root** (`Example Root CA`), as a client's system store does, so "the lab CA is
  not there" is visibly a missing card and not an empty box. A dashed "?" card appears in the store when an issuer
  cannot be found ("not sent, not in the store").
- **Cards** carry the role as a coloured left edge *and* a badge (leaf / intermediate / anchor / self-signed), subject,
  issuer, dates and a clock line at the client's date ("365 days left", "expired 461 days ago", "last day"), with ✓/✗
  once the date was checked. Failed cards get a thick red border; found anchors a green outline; the result box a
  double border on failure. All survive grayscale.
- **No tool names.** The book's commands (and the client program's name) stay in Sources; the page says "the client"
  and shows its messages and exit statuses as data. Estate endpoints are shown by host name only (the scan's product
  remarks are left out).
- `serverCert` is a drop-down, not segmented buttons: four options did not fit the panel in one row at 1920×1080.
- The stage text grows with the stage (`max(1rem, min(2.8cqh, 1.55cqw))`, small labels `max(16px, 0.8em)`).

## Deviations from the task

- **The package's certificate is a leaf plus its own self-signed CA**, both sent (task rule 4 says "self-signed leaf").
  The book's client reports "self-signed certificate in certificate chain", which a client gives for a self-signed CA
  *in* the chain; a lone self-signed leaf gets "self-signed certificate". Modelling it as the book saw it keeps the
  book's exact message and makes `book-five-states` **14 steps** instead of "about 12". The fix stays on the server
  (the CA is marked `localOnly`: made on the machine for itself). From the fresh review.
- **Check order kept as the task says** (leaf first, lowest failing link), although RFC 5280 §6.1 and common clients
  process the built path from the anchor down. It only shows when two certificates fail at once (SPEC.md,
  Simplifications). **Owner decision** (report).
- **An anchor out of date shows no fix side** (p4-commit on 2026-12-02): renewing the server's certificate alone does
  not help while clients hold the old one as their anchor, and spelling out more would come close to the estate
  scenario's answer.
- **Key D moves the client's clock** (`clockOffsetDays` + 1), as the task's button. In the estate story the true date
  moves by the steps; D there makes the client's clock one day fast (so a failure it causes is shown as the client's).
- **Param defaults.** The page opens on the book's sequence, whose first state has port 443 closed and the
  self-signed certificate, so the defaults are `https443Open: false`, `serverCert: 'self'`. The task's defaults (open,
  signed by the lab CA, no anchor) are preset 5, "Build your own", whose end state is the task's caption.
- **`serverCert` has a fourth value `public`** (the public-CA chain), because `sendIntermediate` needs a chain with an
  intermediate outside the `missing-intermediate` preset. In the `book` story the first certificate is always the book's
  self-signed one and in the `intermediate` story always the public chain (the control is disabled there with a reason),
  which also keeps every combination within 20 steps.
- **Steps:** `missing-intermediate` is 8 (task: 6): 2 for the failing state + 6 for the full public chain (connect,
  leaf issuer, leaf date, intermediate issuer, intermediate date, anchor). `book-five-states` 14 (above), `expiry-clocks` 5,
  `wrong-client-clock` 3, as the task says.
- **"certificate is not yet valid"** (before `notBefore`) is added: the clock range −400 days reaches it at the book's
  date (alert `certificate_expired` covers "not currently valid").
- **Signature failure** (`sigOk`, "certificate signature failure", `bad_certificate`) is in the model and tested but no
  preset uses it: signatures are `sec-digital-signature`'s concept.
- **Anchor dates are checked** (task rule 6 "every certificate in the path"); RFC 5280 §6.1 takes the anchor as an
  input without dates, but clients check it, and the estate's p4-commit expires exactly that way.
- **Preset entries** in `sim.json` for `missing-intermediate`, `expiry-clocks` and `wrong-client-clock`, so a course
  file (DR for the expiry clocks) can name them as `cert-chain#<preset>`.

## Sources

- `uvod-u-linux/book/chapters/21-web-posluzitelji.md`, "TLS i certifikati: od čega se sastoji povjerenje i što se lomi
  kad istekne": the definitions, the certificates and dates, the five-state transcript (7, 60, 60, 0, 60, with its
  messages), the client's `date`, "satom onoga tko provjerava"; Primjer 1; the footnotes quoting RFC 5280 §3.2,
  §4.1.2.5, §4.1.2.6, §6/§6.1.1, RFC 9846 §6.2 (`unknown_ca`, `certificate_expired`) and the server directive that the
  file "must include at least the end-entity (leaf) certificate".
- `uvod-u-linux/assets/diagrams/chapter-21/lanac-povjerenja-i-spremiste.svg`: chain on the server, store on the client,
  the decision on the client. Used for the two-sided layout; nothing copied.
- RFC 8446 §4.4.2 (certificate list order, leaf first), §6.2 (`bad_certificate`) *(check: from the RFC as remembered,
  not re-read for this task)*.
- `dr-lecture-estate/student/certs/tls-scan-2026-11-01.txt` and `student/scenarios/S4.md`. Nothing from `instructor/`.

## Checks

- Numbers printed from the model before the page was written (`node` script over every preset; book first 12 steps, 14 after the review): history
  7/60/60/0/60, reasons connect/self-signed/unknown-issuer/–/expired, fixes server/server/client/–/server;
  `www1-istekao.crt` expired 461 days at 2026-09-05; wildcard 397-day, 17 days left and p4-commit 29 at 2026-11-02;
  wrong clock offset +483 (2028-01-01), `www1.crt` expired 118 days; clock −400 → 2025-08-01 (not yet valid, fix
  client), +800 → 2028-11-13. All asserted in `sim.test.js`.
- Rule tests broken on purpose, one mutation at a time: first 28 ( start at the last certificate, date before
  issuer, store searched before the sent ones, a sent root taken as anchor, self-signed accepted, alert names, no date
  check, anchor dates unchecked, exclusive notAfter / notBefore, not-yet-valid called expired, connect exit 60 / with an
  alert / after the certificates, the three fix-side rules, signature ignored, clock offset ignored, book events
  reordered, intermediate always sent, the wildcard's notAfter off by a day, scene change without its first check,
  `changed` always empty, no-op events marked changed, the book's first certificate from the params, day arithmetic off
  by one), then 17 more after the fresh review (fix-side rules, the package CA, anchor not yet valid, anchor and
  intermediate dates at the true day, history and result revealed early, `newCheck`, `certsOf` without the store,
  offset and true date in the state, the estate story ignoring the offset, `sceneStart` at step 0, the estate's
  `changed`): all **45** fail a test.
- `npm run gate -- cert-chain`: pass (manifest, tests, build, 65 browser checks, tokens, scope). Screenshots at
  1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps (light and
  dark) with a local Playwright script. Found and fixed from them: the hidden `story` control showing (see Shared
  requests), the panel overflowing (shorter labels, drop-down), the estate's date strip wrapping (MM-DD), dark-mode
  number and mark on the highlighted check row.
- **Fresh review** (a separate agent read the task, SPEC.md, the model, tests, page and strings against the book and
  the RFCs, and ran 36 mutations of its own; 26 survived at first). Fixed from it: the package certificate (above);
  the estate caption calling a not-yet-valid certificate "expired"; "key and signature as before" claimed in captions
  where it was false (now only with a server-side renewal); English verb agreement and the Croatian 2–4 forms in the
  estate caption; `fixFor` reading the built-in certificates instead of those given to `validate()`; Croatian case in
  the explanation ("drži svoj *trust store* … u njemu"), "lanac povjerenja" and "spremište povjerenja" for the stage
  and concept, one name for the lab CA ("lab. tijelo"), "javnog CA-a", "port 443 otvoren", "prije {n} dana", the
  estate hint dated 2026-11-02 and without "wildcard"; a legend entry for self-signed; tests for every surviving
  mutation. Kept, with reasons above or in SPEC.md: the check order, the issuer search order, `bad_certificate`.

## Term pairs

Not in `kit/glossary.js`; written out in both tables until the coordinator adds them (`"src": "simdeck"`):

- *intermediate certificate* — posrednički certifikat (no book term; the book has *posrednik* only for HTTP
  intermediaries)
- *leaf certificate* / *end-entity certificate* — krajnji certifikat (UL ch21 footnote: "certifikat krajnjeg
  entiteta")

All other terms are in the glossary: *certificate*, *certificate chain*, *trust store*, *trust anchor*, *certificate
authority*, *self-signed certificate*, *validity period*, *TLS alert*, *exit status*.

## Shared requests

- **kit.css: `.sd-ctl[hidden] { display: none; }`.** A control whose `visible()` returns false gets `hidden` from
  `kit.js`, but `.sd-ctl`'s own `display` wins, so it still shows. Worked around in the page with
  `[data-sim="cert-chain"] .sd-panel [hidden] { display: none; }`; drop that line when the kit has the rule.

## Time

Start 2026-10-14 17:16, done 17:55 (CEST): about 40 minutes, one session, including the fresh review.

## ACME renewal presets (task `acme-renewal`)

Preset task `docs/tasks/w3/acme-renewal.md` (wave 3, catalogue `inet-acme-renewal`): story `acme` and presets
`acme-healthy`, `acme-port80-closed`, `acme-dns01`, `acme-machine-off`; entry `acme-healthy`. Rules and numbers:
`SPEC.md`, "ACME renewal".

### Decisions

- **Extended the host model additively** instead of stopping with a shared request. The task allows that only if the
  host "cannot express it without changes"; it cannot (no day timeline, no agent, no challenge), but the way earlier
  preset tasks did it on main (quorum fencing, WSUS rings, DNS split brain) is an opt-in story in the host's own
  `sim.js`, with the host's stories unchanged. Done so: the `acme*` params are read only by the `acme` story; a test
  checks that the book's sequence gives the same states with them set. The host's `validate()` is reused for the web
  client's check (`acmeCheck`), as the host's header comment invited ("a later page … ACME renewal can reuse them").
- **Time in hours** for the agent (a renewal has a time of day), whole days for the client's check (the host's model).
  The checks run on days 61 and 91 only, where both agree (SPEC.md, Simplifications).
- **The tie-break is visible**: the first certificate is issued by the first run (03:00), so its notAfter is 03:00 and
  the day-60 03:00 run lands on exactly a third; the page shows it as its own step ("exactly a third: not yet").
  This is also how "renewal from day 60" and "exactly a third is not yet" (both in the task) hold together.
- **Fixed delay 3 h** (runs at 03:00 and 15:00), so the delay exists on the page without randomness.
- **Kit view K1** (`kit/sequence.js`, exists now) draws the challenge: four lanes (ACME client, web server port 80, DNS,
  the CA); the lane a challenge does not use says "not involved", so HTTP-01 and DNS-01 differ visibly. The file the
  client writes to its own web server is a dotted arrow (local); the CA's `GET :80` is dropped with ✕ and "port 80
  closed" when the port is closed; a refused TXT publish is ✕ at DNS. The chart has no time column (the time is in the
  timeline's heading).
- **Timeline**: one tick per day (the day's most telling run: renewed > failed > no-op), short muted = nothing to do,
  taller red = failed (✗ over the first), full green = a new certificate (✓); the last third of each certificate hatched;
  notAfter lines; machine-off span dotted; "now" cursor. Shape and marks carry the meaning in grayscale.
- **Right column**: the ACME client (timer, catch-up, rule, this run's verdict with time left, failures in the log),
  the certificate the server sends, and on check days the host's compact result (exit status, message, alert, fix).
- **Mode switch** as in `dns-secondary-expiry`: `render` sets `data-cc-mode="acme"` on `<html>`; CSS shows the ACME
  legend items, the ACME explanation, and the examples 1 (way back) + 6–9; the chain page shows its five and "ACME
  renewal" (the way in). Keys 1–9 reach all nine. The chain page's host-only controls hide in the ACME story and the
  ACME controls in the chain stories. The client's clock offset (and key D) stays: it moves the web client's check.
- **Presets in two columns** (`.sd-presets`): six visible examples made the panel 47 px too tall at 1920×1080.
- **Captions**: the task's port-80 caption is used, with "one third is left" made "less than one third is left" (at the
  15:00 run it is less; at exactly a third the client does nothing, by the tie-break).
- Misconceptions on the page: "the CA renews for me" (issue caption and explanation: a timer on your machine),
  "HTTPS only needs port 443" (port-80 preset, explanation), "30 days before expiry" (explanation: older docs).
  The web server's reload is mentioned (cert caption, explanation), not modelled.

### Deviations from the task

- **Step lists.** healthy and dns01 are 5 steps and port80-closed 6, as the task says, but made of different items: the
  task's "issue" is step 0, and the tie run (day 60 03:00) is a step of its own. port80-closed: tie, fail (d60 15:00),
  retry with the client still at exit 0 (d61), last run at notAfter with 60 failures (d90 03:00), expired (d91). The
  task's "nobody reads the log" is the failure count in the client's box and the captions.
- **machine-off** is 5 steps as the task says (issue, d30, off, catch-up at boot d62 08:00, new certificate, check d91);
  the renewal lands on day 62 and the new notAfter is **day 152 08:00**, not 150.
- **No "random delay" control**: the delay is the fixed 3 h the task asks for; nothing to set.
- **Wildcard needs DNS-01**: in the model (`challengeAllowed`) and tests, and in the explanation; no preset (the page has
  one name).

### Sources

As in SPEC.md, "ACME renewal": UL ch21 "TLS i certifikati" (the HTTP-01 paragraph, the timer unit, "program zna
obnoviti certifikat, a paket odlučuje kada ga se pita", the one-third rule and its footnote [40]); RFC 8555 §7.4, §8.3,
§8.4 *(check: not re-read)*; CA documentation "Challenge Types" (90 days, wildcard and DNS-01) *(check)*.
`napredna-linux-administracija/meta/toc.md` T50 has no written chapter yet; nothing taken from it.

### Checks

- Numbers printed from the model before the page (node script over the four presets and every combination of the
  settings: 5 or 6 steps), then asserted in `sim.test.js`: 13 new tests, three tie-breaks first (exactly a third, the
  day-60 tie run, one catch-up at boot), then rules 1–6 and the four presets, then all settings within 20 steps,
  JSON-safe, and the chain stories unchanged by the acme settings.
- **24 mutations** of the ACME model, one at a time (≤ for <, a 30-day rule, port 80 or TXT ignored, any challenge for
  a wildcard, no catch-up, two catch-ups, the off span ignored, delay 0, one run a day, renewal despite a failed
  challenge, no retries after notAfter, the fetch always reaching, DNS-01 via the web server, the new certificate shown
  before finalize, notAfter rounded up, the clock offset ignored, an 89-day lifetime, no tie step, no check on the retry
  day, the check on day 90, a later boot, the CA starting the exchange, no proof row): **all 24 fail a test**.
- `npm run gate -- cert-chain`: pass (the default page: one screen, words, keys, both languages, phone, motion). The
  gate does not step the ACME presets, so a local Playwright script opened every step of the four presets at
  1920×1080 (hr light, en light and dark), checked fit (no page or stage scroll), console and the gate's word probe,
  and took a grayscale shot of each preset's last step and a 375×812 shot: no problems. Screenshots reviewed; fixed
  from them: the legend wrapping the title in Croatian (shorter labels), the right column overflowing (compact result,
  one timer line), the chart's time column (dropped), the run box marked changed on every step, the phone stage
  collapsing the chart.
- Not done: a fresh reviewer (the definition of done asks it of new sims; this is a preset).

### Term pairs

*ACME* — ACME (protocol name, no Croatian); *challenge* — izazov (UL ch21: "izazov HTTP-01"); *token* — oznaka (UL ch21);
*renewal* — obnavljanje. Not in `kit/glossary.js`; written out in both tables. *timer* — mjerač vremena and *certificate
authority* are in the glossary.

### Time

Start 2026-11-08 22:46, done 23:05 (CET): about 19 minutes, one session, including the checks.

## Revocation presets (task `pki-revocation`)

Preset task `docs/tasks/w3/pki-revocation.md` (wave 3, catalogue `sec-pki-revocation`): story `revoke` and presets
`revoked-unchecked`, `crl-catches`, `stale-crl`, `ocsp-good`, `ocsp-blocked`, `stapled`; entry `revoked-unchecked`.
Rules and numbers: `SPEC.md`, "Revocation: CRL vs OCSP".

### Decisions

- **Extended the host model additively**, as the ACME preset did, instead of stopping with a shared request: the task
  allows that only if the host "cannot express it without changes", and it cannot (no revocation state, no CA side,
  no verdict after the chain). An opt-in story `revoke` in the host's `sim.js`; the chain is the host's `validate()`
  unchanged, so expiry is checked first (the task's tie-break) for free. A test checks that every other story gives
  the same states with the revocation params set.
- **The lab CA and `www1.crt`** (UL ch21, already in the host) are the chain: NLA T50 is "PKI u kući — vlastito tijelo",
  your own CA, and the anchor is already the student's own. 4 chain checks + lookup + verdict = 6 steps.
- **Dates 2026-10-15 … 10-26**, not the estate's 2026-11-12 CRL date: that CRL is a student scenario (hq-vpn01) and
  the page must not hint at it.
- **"Fresh"** means the client fetches the CA's latest list now; "not fresh" means it holds the list from before the
  revocation and keeps using it while its `nextUpdate` has not passed at its clock. So the clock offset (key D)
  matters: two days ahead, the held list is out of date and the client fetches the new one and rejects.
- **`responderReachable` covers the CA's revocation server for both CRL fetches and OCSP** (labelled "Upiti o
  opozivu prolaze" / "Revocation queries get through"). With a held list no fetch is needed, so blocking does not
  matter there either.
- **Layout**: three columns, server (the card with a crossed-seal "revoked" badge and its subject struck through, and
  the stapled response attached below it) | the lab CA (its record of serial 1003, reachable/blocked, its lists with
  the one the client used marked "← klijent" and 1003 boxed, the OCSP responder with the query and answer) | client
  (clock, its check mode and soft/hard policy, the store). Below: the checks (chain + one revocation row: ✓ good,
  ✗ revoked, ? unknown, – not asked) and the verdict box (solid ok / dashed warn for soft-fail / double danger; the
  word and ✓ ? ✗ too; "yet the certificate is revoked" when an accepted certificate is revoked).
- **Controls appear only where they act** (`visible`, not `disabled`): with the disabled-reason lines the panel was
  up to 123 px too tall at 1920×1080 in Croatian.
- **Legend in the revocation story** (six, so the header keeps one line): revoked, CRL, OCSP query, stapled, outcome
  ✓ ? ✗ (one swatch with the three verdict colours), changed. Leaf and anchor are left out there: the cards carry
  their role as a word badge.
- **Presets**: the chain page shows a seventh button, "Opoziv: bez provjere" (the way in, like "Obnavljanje ACME");
  the revocation story shows the way back and its six. `.sd-preset { line-height: 1.15 }` (as in other sims) keeps
  the chain page's panel on one screen with the seventh button (it was 16 px over). Keys 1–9 reach presets 1–9 only,
  so the six revocation presets have no number key (the kit's limit); they are reached by clicking.
- **Misconceptions** on the page: expiry = revocation (validity caption "Opoziv ne mijenja datume", the card's clock
  line still "još 319 dana"); a revoked certificate always fails (`revoked-unchecked`, `stale-crl`, `ocsp-blocked`);
  OCSP strictly better than CRL (soft-fail in `ocsp-blocked`, the explanation; stapling fixes it).

### Deviations from the task

- **Added a `hardFail` toggle** (not in the task's params), shown for CRL and OCSP: without it the task's verdict
  `unknown-hard-fail` cannot occur. No preset uses it.
- **Task captions**: both are used as given, the stapled one after "Klijent odbija vezu (izlazni status 60,
  upozorenje certificate_revoked)." and the unchecked one with "(izlazni status 0)" appended.
- **Steps** "host chain steps + 2": the host chain here is 4 checks (the lab chain), so 6 steps per preset.
- **Exit status 60 and the messages** for a revoked certificate and a hard-fail are the host's convention; real
  clients may differ (SPEC.md, rule 7, *(check)*).
- Task topic/tags/level (`security` / `tls` / `advanced`) cannot be set on a preset entry; the host is `internet`,
  `tls`, `intro`. Reported.

### Sources

As in SPEC.md, "Revocation": RFC 5280 §3.3 and §5, RFC 6960, RFC 6066 §8, RFC 8446 §6.2 *(check: not re-read for this
task)*; NLA `meta/toc.md` T50 (term *opoziv*; chapters not written yet). Dates and serial numbers invented.

### Checks

- Numbers printed from the model before the page (node script over the six presets, the clock offsets −50, 1, 2, 5,
  6, 319, 320 and each check unreachable with soft and hard fail), then asserted in `sim.test.js`: 11 new tests,
  two tie-breaks first (expired and not-yet-valid before revocation), then rules 1–5, the steps and reveal, the six
  presets, every setting within 20 steps and JSON-safe, the other stories unchanged by the revocation settings.
- **28 mutations** of the revocation model, one at a time (revocation before expiry, lookup kept on a chain failure,
  `none` asking anyway, the held list's `nextUpdate` exclusive or read at the true date, `crlFresh` ignored, a serial
  only on lists after its revocation day, out-of-date lists accepted, CRL fetch and OCSP ignoring reachability, the
  staple needing the responder, soft-fail rejecting, `hardFail` ignored, OCSP ignoring the revocation date, no
  `unknown` answer, no extra list at a revocation, no lookup step, result or lookup revealed early, the alert, the fix
  side, a staple from before the revocation, a staple without stapling, the unknown reason, the client's clock ignored,
  `newCheck` in the lookup step, the revocation a day later, the lab CA missing from the store): **all 28 fail a test**.
- `npm run gate -- cert-chain`: pass (67 browser checks on the default page). The gate does not step the revocation
  presets, so a local Playwright script opened every step of the six presets at 1920×1080 (hr light, en light and
  dark): no page, stage or panel scroll, smallest text 16 px, a caption on every step, no console errors; grayscale
  shots of `ocsp-blocked` and `crl-catches` and 375×812 shots of `stapled` and `stale-crl` (no sideways scroll). The
  chain and ACME modes rechecked (their presets, fit). Screenshots reviewed; fixed from them: the panel overflow
  (controls hidden instead of disabled), the legend wrapping the header (six items, short labels), the toggle label
  wrapping ("Poslužitelj za opoziv dostupan" → "Upiti o opozivu prolaze").
- Not done: a fresh reviewer (the definition of done asks it of new sims; this is a preset).

### Term pairs

Not in `kit/glossary.js`; written out in both tables (Croatian explanation: English in italics, Croatian in brackets):
*revocation* — opoziv (NLA T50); *certificate revocation list* (CRL) — popis opozvanih certifikata; *OCSP* — OCSP
(protokol statusa certifikata) *(check)*; *OCSP stapling* — prilaganje statusa *(check)*; *soft-fail* — meki neuspjeh
*(check)*; *hard-fail* — (no Croatian term used; "odbija" on the page); *serial number* — serijski broj; *responder* —
poslužitelj za opoziv *(check)*.

### Time

Start 2026-11-09 04:43, done 05:00 (CET): about 17 minutes, one session, including the checks.
