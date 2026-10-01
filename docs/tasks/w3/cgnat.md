# cgnat: Carrier-grade NAT

| | |
|---|---|
| Task | `cgnat` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-cgnat` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/cgnat/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `nat` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `nat` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **double NAT, shared address space, why port forwarding fails**.

The student: step a connection through two NATs.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/nat/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` "NAT: kad više uređaja dijeli jednu adresu" (NAT/PAT, sessions are one-way outbound, port forwarding, NAT is not a security mechanism) and Primjer 4 "tablica PAT-a — zašto odlazna sesija radi sama, a dolazna ne" (the PAT table with two inside hosts)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` "Javne i privatne adrese" → Šire o temi: the 100.64.0.0/10 shared address space for Carrier-Grade NAT between CGN and subscriber CPE (RFC 6598, quoted)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/pat.html` (the adopted `nat` page: Primjer 4 PAT table, reused model)
- RFC 6598 (IANA-Reserved IPv4 Prefix for Shared Address Space, 100.64.0.0/10, BCP 153), RFC 6888 (Common Requirements for CGN), RFC 3022 (Traditional NAT), RFC 5737 (documentation address blocks 203.0.113.0/24, 198.51.100.0/24)
- Catalogue seed: URM ch11; extends `urm-pat` → §5.12

## Overlaps (catalogue §5)

- **§5.12 NAT and port publishing:** urm-nat and urm-pat are near-duplicates (8,253 bytes each, same layout); merge them into one page with two modes on port. Port forwarding and container port publishing are both DNAT: one page with a "container" preset.

## Model and presets

- **Scene:** a connection crossing **two** NAT boxes: subscriber host → home router (NAT1, private →
  CGN address) → carrier CGN (NAT2, CGN → one public address shared by many subscribers) → internet server.
  Each NAT shows its translation table; a second subscriber behind the same CGN is drawn to make the sharing
  visible. Reuses the `nat` page's PAT-table model (copied per COMMON.md §6). Uses K2 topology view when it
  exists.
- **State:** `{ step, packet: {src, dst, srcPort, dstPort, dir: 'out'|'in'}, nat1: [{inside, mapped,
  dst}], nat2: [{inside, mapped, dst}], attemptedForward: bool, verdict }`. Two layers of the same
  one-way-table rule from `nat`.
- **One step:** the packet moves one hop; at each NAT it is translated (outbound: rewrite source addr+port,
  add/lookup a table row; inbound: look up the row, rewrite destination, or drop if none). Order within a
  step: show packet header → NAT lookup/insert → rewrite → caption.
- **Rules:**
  1. NAT/PAT rewrites source IP (and port) on the way out and reverses it on the way back, from a row created
     only when an outbound packet crosses (URM ch11 "NAT"; Primjer 4).
  2. Sessions are one-way outbound; an inbound packet with no existing row is dropped, at **each** NAT
     independently (URM ch11, "Sesije u tradicionalnom NAT-u jednosmjerne su"; Primjer 4b).
  3. CGN address space is 100.64.0.0/10, used only between the CGN and subscriber CPE; it is neither public nor
     one of the three classic private ranges (URM ch08 Šire o temi; RFC 6598).
  4. Double NAT: a packet is translated twice outbound and twice inbound; the subscriber's public identity is
     the CGN's shared address + a CGN-assigned port, not anything the subscriber controls (RFC 6888 *(check)*).
  5. Port forwarding configured on the home router (NAT1) does not help: the inbound packet still dies at the
     CGN (NAT2), where the subscriber cannot add a static row — so inbound services fail behind CGN (derived
     from rule 2 applied at NAT2; RFC 6888 UPnP/PCP limitation *(check)*).
  6. Many subscribers share one public address, distinguished only by CGN-assigned ports; the public address
     alone no longer identifies one subscriber (RFC 6598/6888 *(check)*).
  7. Tie-break / determinism: each NAT assigns the lowest free mapped port; equal inside ports from different
     hosts get distinct mapped ports (same rule as `nat`, Primjer 4a: 51000 → 61000, 61001).
- **Params:** `direction` choice `outbound`|`inbound` (default outbound); `portForward` toggle on NAT1
  (default off); `subscribers` range 1–3 behind the CGN (default 2); `scenario` is driven by the preset.
- **Presets:**
  1. `outbound-works` — subscriber A `192.168.1.10:51000` → home router `100.64.0.5:61000` → CGN
     `203.0.113.5:62000` → server `198.51.100.10:443`; reply retraces both rows home. Two-layer version of URM
     Primjer 4a. Addresses from URM/RFC 5737; the CGN layer derived.
  2. `inbound-dropped` — an unsolicited packet to `203.0.113.5:62050`: no CGN row, dropped at NAT2 before it
     ever reaches the home router. Rule 2 at the carrier edge. From URM Primjer 4b, extended.
  3. `port-forward-fails` — A forwards port 8080 on the home router to its web server; an outside client hits
     `203.0.113.5:8080`: the CGN has no row for 8080, drops it; the forward on NAT1 is never consulted. Rule 5.
     Derived, unchecked.
  4. `shared-address` — two subscribers A and B behind the same CGN both appear as `203.0.113.5`, distinguished
     only by CGN ports `62000` vs `62001`; one public address, two homes. Rules 6–7. Derived from URM Primjer
     4a port-assignment rule.
- **Steps:** 7 (`outbound-works`, 3 hops each way + start), 4 (`inbound-dropped`), 5 (`port-forward-fails`),
  6 (`shared-address`). Derived.
- **Legend:** private addr (c1), CGN/shared addr 100.64/10 (c2, hatched), public addr (c3), server (c4);
  NAT box (square with a table icon); dropped packet (danger X). "changed" marks the row created/looked up and
  the rewritten header field.
- **Captions:**
  - hr: "Dolazni paket na `203.0.113.5:8080` — CGN nema redak za taj *port*, pa ga odbacuje prije nego dođe do
    kućnog usmjernika. Prosljeđivanje *portova* na kućnom usmjerniku nikad se ne pročita."
  - en: "Subscriber A and subscriber B both leave as 203.0.113.5; only the CGN-assigned ports (62000 vs 62001)
    tell them apart. The public address no longer identifies one home."
- **Terms:** carrier-grade NAT — operatorski NAT (CGN) *(check)*; shared address space — dijeljeni adresni
  prostor; double NAT — dvostruki NAT; port forwarding — prosljeđivanje *portova*; translation table — tablica
  prijevoda; private address — privatna adresa; public address — javna adresa.
- **Misconceptions:** CGN addresses are public (they are 100.64/10, neither public nor the classic private
  ranges); port forwarding on your router fixes inbound access behind CGN (it dies at the carrier NAT);
  one public address = one customer (many share it, distinguished by port).
- **Out of scope:** CGN logging/port-block allocation for lawful intercept, A+P / MAP-E / DS-Lite / NAT64
  variants, IPv6 as the escape (mention only), the NAT-is-not-security argument (lives on `net-port-forwarding`
  / URM NAT page).
- **Builds on `nat`:** reuses the one-way PAT-table rule and port-assignment tie-break; new is the second NAT
  layer, the 100.64/10 space, and the "port forwarding can't reach you" result.

<!-- model: filled -->

**Note for the coordinator:** §5.12 clusters NAT/PAT/port-forwarding/CGN. CGN is a distinct enough concept
(double translation, shared space, inbound impossible) to stay its own page, but it must reuse the `nat`
model and should link to `net-port-forwarding`. The URM book covers 100.64/10 and one-way NAT but not the
CGN-specific port-forwarding failure; those rules lean on RFC 6888 and are marked *(check)*.

## Steps

1. `npm run admin` → + Novi simulator `cgnat` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh cgnat sims/cgnat` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/cgnat/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
