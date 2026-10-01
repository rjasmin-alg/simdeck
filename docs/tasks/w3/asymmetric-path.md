# asymmetric-path: Asymmetric path through NAT and firewall

| | |
|---|---|
| Task | `asymmetric-path` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-asymmetric-path` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/asymmetric-path/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | URM |
| Topic / tags / level | `networks` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `stateful-firewall` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **replies taking another path break stateful devices**.

The student: toggle the return path, watch the connection die.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/stateful-firewall/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/15-analiza-prometa.md` "Paket je otišao, ali se ništa nije vratilo: asimetričan put, NAT i vatrozid" (Što treba znati + Šire o temi) and Primjer 6 "paket izlazi, ništa se ne vraća" (two explanations: a stateful device that saw only the outbound half, or a genuinely asymmetric path; proof needs captures from both sides)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch15-asimetrican-put-nat-vatrozid.svg` (the book's figure: two exits, state on exit 1, reply returns via exit 2 and is not recognised)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html` (the adopted `stateful-firewall` page: stateless vs stateful filter — reused state model)
- RFC 2663 / RFC 3022 (stateful NAT, sessions one-way outbound), RFC 3704 (ingress filtering; "hot potato" / asymmetric routing between ISPs)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/meta/plan-interaktivne-stranice.md` §6, page 9 "Dijagnostika" (card "asimetričan put kroz NAT i vatrozid")
- Catalogue seed: URM card ch15; builds on `stateful-firewall`

## Model and presets

- **Scene:** an organization network with **two exits** to the internet — exit 1 carrying a stateful
  device (NAT/firewall), exit 2 a plain second path — and a server out in the internet. The stateful device
  shows its connection-state table. A request arrow and a reply arrow are drawn separately so the student sees
  them take different exits. Reuses `stateful-firewall`'s state-table model (copied per COMMON.md §6); K2
  topology view when it exists.
- **State:** `{ step, outPath: 'exit1'|'exit2', inPath: 'exit1'|'exit2', stateTable: [{src, dst, sport,
  dport, state:'ESTABLISHED'}], reply: {seen, matchedState, delivered}, verdict }`.
- **One step:** one packet movement. Outbound: the request leaves via `outPath`; if that is exit 1, the
  stateful device records the connection. The server replies. Inbound: the reply arrives via `inPath`; the
  stateful device accepts it only if it matches a recorded connection on the **same** device, otherwise drops
  it. Order within a step: send packet → stateful lookup/insert → deliver or drop → caption.
- **Rules:**
  1. A stateful NAT/firewall builds its table only from the outbound half of a connection; a returning packet
     is allowed only if it matches an existing entry on that device (URM ch15 "Tradicionalni NAT sesije gradi
     jednosmjerno…"; RFC 3022).
  2. If the reply returns via a different exit, the stateful device on exit 1 never saw the outbound half for
     the reply it would need to match — so it cannot recognise the reply as part of the connection and drops
     it, even though the server really sent it (URM ch15 Što treba znati; the figure).
  3. This happens even with nothing deliberately blocking: asymmetric routing alone (two exits, reply via the
     other) breaks any check that assumes request and reply share a path (URM ch15: "bez ijednog uređaja koji
     namjerno išta blokira").
  4. Between ISPs, "hot potato" routing makes request and reply routinely take different physical paths, so
     symmetric-path assumptions do not hold on the internet at large (URM ch15; RFC 3704).
  5. Diagnosis: one-sided capture is inconclusive — the sender's capture shows the request sent, the
     receiver's shows the reply sent; the loss is on a device neither capture sees. Proof needs captures from
     both sides at once (URM ch15 Šire o temi; Primjer 6).
  6. Fix: make the path symmetric (policy/source routing so the reply returns via exit 1), or make both exits
     share connection state, or put the stateful device where it sees both halves (derived from rule 1;
     *(check)* exact mechanisms).
  7. Tie-break / determinism: the stateful device's verdict depends only on whether a matching entry exists on
     *that* device, not on timing; replaying a step gives the same drop/accept.
- **Params:** `returnPath` toggle exit 1 ↔ exit 2 (default exit 2 = asymmetric); `stateful` toggle on the
  exit-1 device (default on); `scenario` driven by preset. (With `stateful` off, even the asymmetric reply
  passes — showing the device, not the path, is what drops it.)
- **Presets:**
  1. `symmetric-ok` — request out exit 1, reply back via exit 1: the stateful device matches its entry,
     reply delivered. Baseline from URM ch15 (healthy case).
  2. `asymmetric-drop` — request out exit 1 (state recorded there), reply back via exit 2: exit 2 has no entry
     and the exit-1 device never sees the reply, so it is dropped; the user gets nothing though the server
     replied. From URM ch15 figure + Primjer 6 (first explanation).
  3. `two-captures` — the diagnostic view: the branch capture shows "request sent / nothing back", the HQ
     capture shows "reply sent"; only both together reveal the gap. From URM ch15 Primjer 6 / Šire o temi.
  4. `make-symmetric` — force the reply back via exit 1 (source routing) or share state: the connection now
     completes. Rule 6. Derived, unchecked.
- **Steps:** 5 (`symmetric-ok`), 6 (`asymmetric-drop`), 6 (`two-captures`), 6 (`make-symmetric`). Derived.
- **Legend:** request (solid c1), reply (dashed c2), exit-1 device with state table (square), exit 2 (plain
  line), dropped reply (danger X with "no matching state"), server (c3). "changed" marks the state-table row
  and the point where the reply is dropped.
- **Captions:**
  - hr: "Zahtjev je izašao kroz Izlaz 1, pa je ondje zapisano stanje veze. Odgovor se vratio kroz Izlaz 2 —
    uređaj na Izlazu 1 ga nikad ne vidi i ne prepoznaje kao dio iste veze, pa pada."
  - en: "The branch capture says the request left and nothing came back; HQ's capture says the reply was sent.
    Neither capture alone shows where it died — the drop is on a device neither one sees."
- **Terms:** asymmetric path / routing — asimetričan put / usmjeravanje; stateful firewall — vatrozid sa
  stanjem; connection state — stanje veze; hot-potato routing — usmjeravanje „vrući krumpir"; packet capture —
  snimka prometa; default route / exit — izlaz prema internetu; established connection — uspostavljena veza.
- **Misconceptions:** the reply was never sent (it was; the stateful device dropped it, rule 2); a one-sided
  capture can find the fault (it cannot, rule 5); the firewall is "broken" (it is doing exactly its job on the
  half it saw); NAT/firewall loss always means a deliberate block (asymmetry alone suffices, rule 3).
- **Out of scope:** the stateless-vs-stateful contrast itself (`stateful-firewall`), NAT table mechanics
  (`net-cgnat`/NAT page), BGP path selection, conntrack internals, ECMP hashing details.
- **Builds on `stateful-firewall`:** reuses its connection-state table and "reply allowed only if it matches a
  recorded outbound connection" rule; new is the second exit and the path asymmetry that starves the match.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `asymmetric-path` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh asymmetric-path sims/asymmetric-path` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/asymmetric-path/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
