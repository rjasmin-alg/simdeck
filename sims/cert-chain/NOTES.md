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
