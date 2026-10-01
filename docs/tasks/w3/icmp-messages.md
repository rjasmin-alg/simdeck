# icmp-messages: What ping answers mean

| | |
|---|---|
| Task | `icmp-messages` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-icmp-messages` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/icmp-messages/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM |
| Topic / tags / level | `networks` / `icmp` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `hop-rewrite` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **echo reply, unreachable codes, timeout, and what silence means**.

The student: ping through scenarios (down host, ACL, no route).

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/hop-rewrite/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/11-usmjeravanje.md` (Uvod u računalne mreže): "ICMP i dijagnostika puta: `ping` i `traceroute`" (echo / echo reply, destination unreachable, time exceeded, what silence means; footnotes rfc792-echo-ch11, rfc792-unreachable, rfc792-exceeded, ms-tracert) and its "Šire o temi"
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` Primjer 2 "ista mreža ili druga?" (192.168.1.10 and 192.168.2.50, the addresses used here)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/assets/diagrams/ch11-tracert-ttl.svg` (TTL probes, for the `ttl-low` preset)
- RFC 792 (ICMP: types 0, 3, 8, 11 and codes); RFC 1812 §5.2.7.1 (router-generated Destination Unreachable, code 13 administratively prohibited); Microsoft Learn, *ping* and *tracert* command references (output wording, 4 s timeout for rule 6, "TTL expired in transit" for preset 6); Cisco IOS behaviour for unanswered ARP (rule 3, some versions stay silent) (check)
- Catalogue seed: URM ch11

## Model and presets

- **Scene:** the URM ch08 Primjer 2 addresses on a three-segment path: PC 192.168.1.10/24 — R1 (192.168.1.1 |
  10.0.12.1) — R2 (10.0.12.2 | 192.168.2.1) — server 192.168.2.50/24, with an optional firewall box on R2.
  Each preset breaks one thing (marked on the drawing). On the right a **console pane** showing what `ping`
  prints (Windows wording, Linux wording on a toggle), and under the path the ICMP message on the wire with
  type, code and who sent it.
- **State:** `{ scenario, ttl, packet: {at, kind, ttl}, reply: {from, type, code} | null, timer, console:
  [lines] }`.
- **One step:** the echo request or the answer moves one hop, or a device makes its decision. Order: the
  packet arrives → the device applies the first rule that fires (below) → the answer (if any) starts back →
  the console line is printed when it reaches the PC, or "Request timed out" when the timer runs out.
- **Rules:**
  1. Echo request type 8 → the target returns echo reply type 0 with the same data; a reply proves the path
     works in both directions (URM `11-usmjeravanje.md` "ICMP i dijagnostika puta", footnote rfc792-echo-ch11;
     RFC 792).
  2. No route to the destination network → that router sends Destination Unreachable type 3 code 0 (net
     unreachable) to the source (ch11 same section, footnote rfc792-unreachable; RFC 792).
  3. The last router has a route but the host does not answer ARP → it sends type 3 code 1 (host unreachable)
     after its ARP attempts fail (RFC 1812 §5.2.7.1; a Linux router waits about 3 s (check); some router
     firmware stays silent (check, Sources)).
  4. TTL reaches 0 at a router → it drops the packet and sends Time Exceeded type 11 code 0 (ch11, footnote
     rfc792-exceeded; RFC 792).
  5. A filter that rejects sends type 3 code 13 (communication administratively prohibited) (RFC 1812
     §5.2.7.1); a filter that drops sends nothing (drop vs reject, see `rule-first-match`).
  6. Silence: no answer at all within the timeout (Windows 4 s) prints "Request timed out" — it only says no
     reply came, not where the chain broke (ch11 same section, paragraph after rfc792-echo-ch11; check the
     timeout, Sources).
  7. Local target that does not answer ARP: no packet leaves the PC; Windows prints "Reply from
     192.168.1.10: Destination host unreachable." from its **own** address (check), Linux prints "From
     192.168.1.10 … Destination Host Unreachable". Edge: Windows counts this line as "Received", so the
     summary shows 0 % loss (check).
  8. Tie-break: the first device that fires a rule answers; nothing behind it is reached (e.g. a TTL that
     dies at R1 never reveals that R2 has no route).
- **Params:** `os` choice Windows / Linux wording (default Windows); `ttl` range 1–64 (default 64);
  `scenario` select (same list as the presets).
- **Presets:**
  1. `echo-ok` — all up: "Reply from 192.168.2.50: bytes=32 time=… TTL=62" (TTL 64 minus two routers). From
     ch11 ICMP section; TTL arithmetic derived (sender default 64 assumed; Windows default is 128 → 126
     (check)).
  2. `no-route` — R1 has no route to 192.168.2.0/24 and no default: R1 returns 3/0, console "Reply from
     192.168.1.1: Destination net unreachable." (ICMP source = R1's interface toward the PC (check)). From ch11 + RFC 792.
  3. `host-down` — the server is off: R2 ARPs for 192.168.2.50 three times, then returns 3/1 "Destination host
     unreachable" from 192.168.2.1 (rule 3). Derived, unchecked.
  4. `firewall-drop` — R2's firewall drops ICMP echo: nothing comes back, "Request timed out" ×4. Derived.
  5. `firewall-reject` — the same rule set to reject: 3/13 from 192.168.2.1, the PC knows at once. Derived.
  6. `ttl-low` — ttl = 1: R1 returns 11/0 "TTL expired in transit." from 192.168.1.1. This is the first
     probe of `traceroute`; link to `traceroute`. From ch11 + the Windows `tracert` reference (Sources).
- **Steps:** presets 1: 7 (4 hops out and back + print); 2: 3; 3: 6; 4: 5 (out, drop, timer, print);
  5: 5; 6: 3. All ≤ 20.
- **Legend:** echo request (c1), echo reply (c2), ICMP error (c5, with type/code badge), dropped silently
  (danger, ✕ and "…"), the broken element (warn outline); "changed" marks the device that decided this step
  and the console line just printed.
- **Captions:**
  - hr: "R1 nema put do 192.168.2.0/24, pa odbacuje paket i vraća ICMP tip 3, kod 0: *destination network
    unreachable* (odredišna mreža nije dostupna)."
  - en: "The firewall drops the request without a word. After 4 seconds ping prints “Request timed out”;
    silence does not say where the path broke."
- **Terms:** echo request / echo reply — echo zahtjev / echo odgovor; destination unreachable — odredište nije
  dostupno; time exceeded — vrijeme isteklo; time to live (TTL) — vrijeme života; routing table — tablica
  usmjeravanja; gateway — pristupnik; firewall — vatrozid.
- **Misconceptions:** "Request timed out" means the host is down; "Destination host unreachable" always comes
  from a remote router (often it is your own PC); no ping reply means no connectivity at all (ICMP may just
  be filtered).
- **Out of scope:** traceroute itself (`traceroute`), ICMP redirect, PMTUD's type 3 code 4
  (`fragmentation-pmtud`), ICMPv6, port-unreachable for UDP probes (mentioned only).
- **Reuse:** from `hop-rewrite` reuse the path, per-hop TTL decrement and the header view; new here are the
  failure scenarios, ICMP type/code and the console pane.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh icmp-messages sims/icmp-messages` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/icmp-messages/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
