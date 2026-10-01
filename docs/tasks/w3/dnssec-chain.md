# dnssec-chain: DNSSEC chain of trust

| | |
|---|---|
| Task | `dnssec-chain` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-dnssec-chain` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dnssec-chain/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | UL, SEC |
| Topic / tags / level | `internet` / `dns` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **DS → DNSKEY → RRSIG from the root down**.

The student: step validation; break a signature.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (Uvod u Linux): "Vlastiti poslužitelj imena" → "Šire o temi", the paragraph on `dnssec-validation yes;` and RFC 9364 (BCP 237); the `aa`-flag remark. The book only names DNSSEC; the rules below come from the RFCs.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/21-web-posluzitelji.md` "TLS i certifikati" (definitions *lanac povjerenja*, *sidro povjerenja*, reused as Croatian terms)
- RFC 9364 (DNSSEC overview, BCP 237); RFC 4033 §5; RFC 4034 §3 (RRSIG), §5 (DS); RFC 4035 §3.2.3 (AD bit), §4.3, §5.2–5.5 (validation, bogus/insecure)
- Mark every rule not checked against the RFC text with *(check)* in `NOTES.md`.

## Model and presets

- **Scene:** three zone boxes stacked top to bottom, root `.` → `hr.` → `grafo.hr.` (the URM book's fictional company), each holding its DNSKEY RRset (KSK and ZSK, shown with key tags), the RRSIG over it, and, for the parent, the DS record for the child. A validating resolver on the left with its trust anchor (root KSK). The answer `www.grafo.hr A` with its RRSIG at the bottom. A check list beside each link lights up step by step (kit view "decision path").
- **State:** `{ zones: [{ name, ksk: { tag, alg }, zsk: { tag, alg }, dnskeySig: { by, valid, expires }, ds: { forChild, keyTag, digestOk } | null }], answer: { rrset, sig: { by, valid, expires } }, now, anchor: { tag }, checks: [{ id, zone, kind, result }], verdict: 'secure'|'bogus'|'insecure'|null }`.
- **One step:** one check, top-down: (1) trust anchor matches the root KSK; then per zone (2) DNSKEY RRset is signed by that zone's KSK; (3) the parent's DS matches the child's KSK (digest of the DNSKEY) and the DS RRset is signed by the parent's ZSK; finally (4) the answer RRset's RRSIG verifies with the zone's ZSK and `now` is within the signature's inception/expiration. The first failed check ends validation.
- **Rules:**
  1. Validation starts at a configured trust anchor (root KSK) and walks down; nothing above the anchor is checked (RFC 4033 §5, RFC 4035 §5).
  2. A zone's DNSKEY RRset must be signed by a key whose digest is in the parent's DS RRset (RFC 4035 §5.2; DS format RFC 4034 §5).
  3. Every other RRset is signed by a key in the zone's DNSKEY RRset (in practice the ZSK) (RFC 4035 §5.3).
  4. A signature is valid only between its inception and expiration times, by the resolver's clock (RFC 4034 §3.1.5; RFC 4035 §5.3.1).
  5. Verdicts: all checks pass → **secure** (resolver sets AD) (RFC 4035 §3.2.3, §4.3); a check fails → **bogus**, and a validating resolver returns SERVFAIL, not the data (RFC 4035 §5.5); a delegation with a proven absence of DS → **insecure**, data returned without AD (RFC 4035 §4.3, §5.2). Tie-break: an absent DS without a valid denial proof (NSEC/NSEC3) is bogus, not insecure (check).
  6. Tampering with any byte of a signed RRset breaks its RRSIG (rule 3) but the DS chain above it stays intact: the break is located at exactly one link.
- **Params:** button `tamper-answer` (key T); toggle `expireSig` (answer RRSIG expired yesterday), default off; toggle `removeDs` (parent publishes no DS for `grafo.hr`), default off; choice `dsMismatch` none/after-ksk-rollover, default none. Each takes effect from the next validation (`resets: true`).
- **Presets:**
  1. `secure` — full chain valid. Outcome: 7 checks pass, verdict secure, AD set. Derived, unchecked.
  2. `tampered-answer` — `www.grafo.hr A` changed in transit. Outcome: checks 1–6 pass, check 7 fails, bogus, client gets SERVFAIL.
  3. `expired-signature` — answer RRSIG expiration = yesterday. Outcome: bogus at check 7 even though no data changed (rule 4).
  4. `unsigned-child` — `hr.` publishes no DS for `grafo.hr` (with a valid denial proof). Outcome: insecure after check 4; answer delivered without AD.
  5. `ksk-rollover-mismatch` — `grafo.hr` rolled its KSK, the parent's DS still has the old key tag. Outcome: bogus at the DS check for `grafo.hr`; the whole zone fails to validate.
- **Steps:** `secure` 7; `tampered-answer` 7; `expired-signature` 7; `unsigned-child` 5; `ksk-rollover-mismatch` 6.
- **Legend:** key icons (filled = KSK, hollow = ZSK), chain links between zones, tick/cross per check (shape plus colour); "changed" marks the check evaluated this step.
- **Captions:** hr: "Zapis DS u zoni hr. odgovara ključu KSK zone grafo.hr (oznaka 31406), a skup DS potpisan je ključem ZSK zone hr. Karika vrijedi." en: "The DS record in hr. matches grafo.hr's KSK (key tag 31406), and the DS set is signed by hr.'s ZSK. The link holds." (key tag illustrative)
- **Terms:** *trust anchor* — sidro povjerenja; *chain of trust* — lanac povjerenja; *signature* — potpis; *key signing key (KSK)* — ključ za potpisivanje ključeva; *zone signing key (ZSK)* — ključ za potpisivanje zone; *validating resolver* — rezolver koji provjerava (*validating resolver*); *bogus / insecure* — neispravno / nezaštićeno (check).
- **Misconceptions:** "DNSSEC encrypts DNS" (it signs, nothing is hidden); "a failed validation shows a warning" (the client simply gets SERVFAIL); "an unsigned zone is an error".
- **Reuse from `dns-resolution`:** the root → TLD → authoritative walk and zone boxes; new here are keys, signatures, DS and the check list.
- **Out of scope:** NSEC/NSEC3 internals, algorithm details, key generation, DNS over TLS/HTTPS, resolver configuration beyond `dnssec-validation yes`.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `dnssec-chain` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh dnssec-chain sims/dnssec-chain` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dnssec-chain/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
