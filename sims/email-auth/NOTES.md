<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# email-auth: notes

New stepper (task `docs/tasks/w3/email-auth.md`, catalogue `inet-email-auth`, §4.2, wave 3). There is no kit "decision
path" view (catalogue §7.2), so the page draws the path in HTML, as `lnx-selinux-decision` and `lnx-netfilter-path`
do. Rules, tie-breaks and expected numbers: `SPEC.md`.

## Decisions

- **Layout.** Left: the arriving message (connection, dashed envelope with a flap around the letter with a folded
  corner, the look of `email-path`) and under it the receiver's DNS lookups. Right: the three checks in a row (1 SPF →
  2 DKIM → 3 DMARC record), then a full-width alignment band (4) and the verdict band (5). The numbers 1–5 are on each
  box, on the message lines each check reads (IP and `MAIL FROM` 1, `DKIM-Signature` 2, `From:` 3) and on each DNS
  row, so a student can follow which identifier went where.
- **Alignment has its own band** instead of living in the third box: a line between two domain chips needs width. Box 3
  shows the author domain and the record (step 3); the band draws the lines (step 4). Solid ink line = aligned, dashed
  `--danger` line = not aligned, dotted muted line = the check did not pass (or no signature), so the identifier does
  not count. Each line has its reason in words on it and the outcome at its end (✓ / ✕ / ○ with a word).
- **One step = one check**, five for every scenario (`sim.json` `steps: 5`), as the task says.
- **SPF shows its record as term chips**: the deciding term outlined, a term that did not match struck through, an
  unread one dashed. The count of DNS-querying terms is shown against the limit of 10. `mx`'s two lookups (MX, then the
  host's addresses) appear as indented sub-rows under the TXT lookup in the DNS panel.
- **The scenarios use different SPF paths**: `legit` passes via `mx` (lab.example has no address at the apex, as in
  the UL ch19 zone file, so `a` does not match), `subdomain` and the list via `a`, `spoof` via `ip4` (no DNS term at
  all).
- **The list sends with its own bounce address** (`MAIL FROM radionica-bounces@lista.example` from `198.51.100.7`), so
  SPF passes for `lista.example` and is not aligned with `lab.example`. This is the task's rule 8 ("SPF no longer
  aligns") and the book's "the message comes from the list's address, not yours", and it makes the unsubscribe
  coherent: the 550 goes back to the envelope sender, which must be the list for the list software to see it. (A first
  version kept Ana's envelope; SPF then failed at `-all`, but the refusal would have gone to Ana, not the list. The
  fresh review caught it.) The other reading (envelope kept, SPF `fail`) gives the same DMARC outcome; a test shows it.
- **`listModifiesSubject`** puts `[radionica] ` in front of the subject after signing, drawn as a dashed tag with
  "added by the list"; DKIM then fails. Disabled with a reason outside the list scenario.
- **`subdomain-alignment` preset turns `signed` off**: with the default signature (`d=lab.example`) DKIM alone would
  pass and hide the SPF alignment change. The preset's hint says to switch SPF alignment to strict at step 4 (the param
  does not reset, so the band flips in place).
- **`policy` and `aspf` write the lab record**: defaults give exactly the book's `v=DMARC1; p=none;
  rua=mailto:postmaster@lab.example`; strict adds `; aspf=s`. `adkim` has no param (stays relaxed).
- **Verdict actions**: pass → delivered; fail + `p=none` → delivered and seen in the aggregate report (monitoring
  mode); `quarantine` → spam folder; `reject` → `550 5.7.1 Email rejected per DMARC policy for lab.example` (RFC 9989
  §7.2's example reply with the lab domain). The receiver here applies `p=reject` literally, and the caption says
  "this receiver"; the explanation states RFC 9989 §7.4: a receiver MUST NOT reject on `p=reject` alone and, without
  other knowledge, MUST treat the mail as `quarantine`.
- **DMARC box**: chips only for tags the record carries (`p=…`, `aspf=s` when strict); the effective alignment modes,
  defaults included, are said in words under them.
- **Each check reads a different zone** (captions and explanation): SPF the MAIL FROM domain's, DKIM the signer's,
  DMARC the From: domain's. In `spoof` the first two lookups go to zlo.example and the third to lab.example.
- **DKIM keys**: lab.example's is the start of the book's key (`p=MIIBIjAN…`, the book cuts it at 72 columns too);
  zlo.example's is RFC 8463 Appendix A's Ed25519 example key, so the two keys show `k=rsa` and `k=ed25519`. The DNS
  panel cuts a key after eight characters.
- **Invented data**: `news.lab.example` (192.168.180.25), `lista.example` / `radionica@lista.example`
  (198.51.100.7), `zlo.example` (203.0.113.66), `bilten@`, `bounce@`, `x@`, the subjects. Documentation address blocks
  (RFC 5737) for the outside hosts. From the books: `lab.example`, `posluzitelj.lab.example` 192.168.180.1, MX 10, the
  SPF, key and DMARC records, `sel1`. From `email-path`: `mx.drugdje.example`, `ivan@drugdje.example`, `ana@`, the
  subject "Raspored laboratorija".
- **Reuse from `email-path`**: the message shape (envelope around letter) and the hosts. `models/` has no email model
  and `email-path`'s functions (MX routing, trace lines) are not needed here, so nothing is copied; nothing to promote
  from this sim either unless a later task needs SPF/DMARC evaluation (`checkHost`, `parseDmarc`, `alignment` are pure
  and promotable).
- **Organisational domain = last two labels.** For these names (all under `.example`) RFC 7489's public suffix list
  and RFC 9989's DNS tree walk agree.

## Deviations from the task

- The task names "three check boxes in a row (SPF, DKIM, DMARC alignment) and a verdict box". Here the third box is the
  DMARC record and the alignment is a band under the row (see Decisions); the five steps map one-to-one to five boxes.
- Preset `subdomain-alignment` sets `signed: false` (not stated in the task) so that the task's outcome ("relaxed →
  aligned, strict → not aligned") decides DMARC.

## Sources

- UL `book/chapters/20-elektronicka-posta.md`, "Kako primatelj zna da je poruka doista vaša" ("Što treba znati":
  SPF record `v=spf1 a mx -all`, `a` covers AAAA, `mx` two lookups and no implicit MX, ten-term limit, qualifiers and
  default `+`, `none`; DKIM key at `s._domainkey.d`, `sel1._domainkey.lab.example`, "takes part of the responsibility",
  separates signer from author; DMARC record `_dmarc.lab.example`, author domain, authenticated identifier, relaxed and
  strict alignment, missing `p` = `none`, the three values, monitoring mode, the comparison table), "Šire o temi"
  (`p=reject` and indirect flows, list unsubscribes, `550 5.7.1` example, receivers and `p=reject`), Primjer 3 (check
  the record where it is read), Primjer 4 (the mailing list). Its footnotes quote RFC 7208 §2.6.1, §4.5, §4.6.2,
  §4.6.4, §5.1, §5.3, §5.4, §10.2, §10.3; RFC 6376 §1, §3.6.2.1, §6; RFC 8301; RFC 8463 §3; RFC 9989 §1, §3.2.x,
  §4.1, §4.4, §4.7, §7.2, §7.4.
- UL ch19 zone file (`lab.example` has no apex address).
- `assets/diagrams/chapter-20/omotnica-i-zaglavlje.svg`: envelope vs header framing; nothing copied.
- RFC 7208 §4.7 (no match → neutral), RFC 8463 Appendix A (example key): from memory, no network in this session.

## Unchecked *(check)*

- RFC 7208 §4.7 for "no mechanism matched → neutral", and RFC 8463 Appendix A for the example key: from memory.
- `permerror` for a signature whose key record is missing (RFC 6376 §6.1.2 calls it PERMFAIL; Authentication-Results
  names it `permerror`).
- The `include`, `exists`, `ptr` and `redirect` terms are counted for the limit but not evaluated (they give
  `permerror`); a syntax error after the deciding term is not read (RFC 7208 §4.6: `permerror`); `a` is drawn as one
  A/AAAA query (RFC 7208 §5.3 asks only A for an IPv4 client). None of this is reachable from the presets.

## Term pairs

Missing from `kit/glossary.js`, written out in both tables until the coordinator adds them (`"src": "simdeck"`, from
UL ch20's definitions):

- *SPF record* — zapis pošiljatelja
- *DKIM signature* — potpis poruke

Used from the glossary: envelope, qualifier, selector, author domain, authenticated identifier, identifier alignment,
organizational domain, domain owner assessment policy, monitoring mode, aggregate report.

## Shared requests

- **Kit: a decision path view** (catalogue §7.2, ~15 consumers). This is the third sim to draw one by hand (after
  `lnx-selinux-decision`, `lnx-netfilter-path`). What this one needed: numbered boxes in a row with arrows, a
  result per box (✓ / ✕ / ○ with border styles), a box state "not reached yet", and a band of "connections" (two chips
  joined by a solid / broken / dotted line with a label).

## Checks

- Tests: 36 (four tie-breaks first, among them "only pass counts" with `~all`, `?all`, `-all` and a missing key, rules 1–8, preset numbers, the legit lookup order, one check per step, changed
  marks, then the template's generic block over 8 param combinations).
- Mutation pass on a copy (42 mutations: HELO or From: instead of MAIL FROM, last match wins, default qualifier,
  softfail mapping, `all` not matching, `a` without AAAA, implicit MX, limit off by one / missing / counting every
  term, no record → neutral, two records accepted, no match → fail, CIDR ignored, DKIM intact ignored, missing key
  passing, unsigned = fail, the tag not breaking the signature or tagging every scenario, AND instead of OR, SPF only,
  no record → fail, failed checks aligning, relaxed = identical, strict = same org, three-label org domain, case
  sensitivity, default strict, missing p → reject, non-DMARC record accepted, a pass following p, quarantine →
  reject, reply code, unsubscribe on any reject / on quarantine, author from the envelope, DKIM read with aspf, policy
  and aspf params ignored, key name reversed, list IP unchanged, SPF lookups not logged): all 42 killed after one test
  was added (DKIM alignment reads `adkim`, not `aspf`).
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md, the book and the RFCs, drove 168 page
  loads (every preset and nine param variants × steps × languages; no console errors, no overflow, captions match the
  state) and ran 29 mutations of its own. Fixed from it: the receiver's duty under `p=reject` understated (now RFC 9989
  §7.4's MUST NOT / MUST, and "this receiver applies it literally"); "every check reads the sending side's zone"
  (DMARC reads the From: domain's zone, which is the point of `spoof`); "only pass counts" untested for softfail,
  neutral and DKIM permerror (tie-break test added); the list keeping Ana's envelope while the list software learns of
  the refusal (now the list's bounce address); `redirect` skipped instead of counted; Croatian glossary terms in the
  wrong case after a preposition (sentences rephrased so the term is nominative); an ambiguous "changed the address";
  implied `aspf=r`/`adkim=r` chips; names breaking mid-label (`<wbr>` after dots); a raw state code as a tooltip;
  "organisational" next to the glossary's "organizational"; unused keys; "zakonita" for the legitimate message (the
  book's word). Left as is (out of scope, noted under Unchecked): A-only lookups, syntax errors after the deciding term,
  `ip6` and `mx:<domain>` details, a second DMARC record.
- Gate: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots reviewed: the gate's light, dark,
  grayscale and phone in both languages, plus my own of every preset at its key steps in both languages
  (`legit` 0/1/5, list signed 2, unsigned 5, tagged 5 with reject and quarantine, spoof 4/5, subdomain strict 4,
  phone at list-unsigned 5). Fixed on the way: the panel 44 px too tall (shorter toggle labels, one hint dropped), a
  caption node reused for a repeated placeholder (it vanished from its first place), `DKIM-Signature:` breaking inside
  its name, the DNS panel clipping its last row in the tagged list case (wider left column, keys cut), a heading
  splitting into flex items in English and on the phone.

## Time

Start 08:25 UTC, done (gate, mutation pass, fresh review and its fixes) 08:56 UTC: about 31 minutes, one session.
