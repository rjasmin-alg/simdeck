<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# traceroute: notes

New stepper (task `docs/tasks/w3/traceroute.md`, catalogue `net-traceroute`, §4.1 and §5.9, wave 3) on kit view K2
(`kit/topology.js`). Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step is one TTL round** (three probes), as the task says. The phases inside it (out, die, reply, print) are
  listed in the "Krug k / Round k" box under the chain; on the chain they show at once: the probe's arrows with a
  "TTL k" chip on every link (the TTL after each router took 1 off), a red cross where it dies, and the reply's dashed
  arrows back to A.
- **Chain layout.** Cards span two grid columns with one column for the link between them, so an address fits on one
  line. Up to seven nodes (5 routers) in one row; more run back right to left in a second row, with a spacer row for
  the link R6 — R7 (the `stars` preset has 13 nodes). Cards are stacked (mark, address, role, one badge) to keep both
  rows short enough for a 12-line output under them at 1920×1080.
- **One badge per card:** A "redak k / line k" (or "ništa / nothing", dashed), the router where the probes die
  "šalje 11/0 / sends 11/0", S "šalje 0/0", "šalje 3/3" or "odbacuje / drops" (dashed), a silent router "šuti /
  silent" (dashed) in every step. The TTL 1 → 0 is in the round box and the chip on the last link.
- **Silent router** is hatched (`sd-hatch`) with a solid border, not K2's `state: 'down'` (dashed, muted): it works,
  it only does not report itself. Marked by a class added to its card after `Simdeck.topology()` builds it.
- **Colours of the way back.** K2 draws every arrow in ink; the page colours the dashed (reply) paths: Time Exceeded
  in `--c2`, the destination's answer in `--ok` and dotted instead of dashed, so the two differ in grayscale. The
  arrow heads stay ink (the view gives them no class to tell them apart).
- **Reply chips off** (`chip: false`): with the probe's chip on the same link the two collide at this card width; the
  reply is named by the badge on the answering node, the round box and the caption.
- **Output** is printed the way each tool prints it (SPEC.md "Printing"): ICMP probes `tracert`-style (times first,
  whole ms, `<1 ms`), UDP probes `traceroute`-style (address first, three decimals). The command line is written with
  `-d -h <max>` / `-n -m <max>`: no name lookups (the scene has none) and the max hops written out, because the two
  tools' defaults differ. Above 12 lines the output shows the command, "…" and the last 11 lines (30 lines with
  `destFilter` and 30 hops).
- **Destination 192.0.2.20** (RFC 5737 TEST-NET-1) instead of a 198.51.100.x address: 13 characters did not fit the
  card on one line.
- **RTTs in integer µs** so every printed time is exact (no float rounding); whole ms rounded half up.
- **Captions** add, when it applies: the round right after a silent hop passed it (rule 6, "the row of stars was no
  broken link"), a line faster than the one before (rule 8), and the end at max hops (rule 7, or at a router when max
  hops is below the destination's hop). Stars in captions are data (`* * *`), not caption markup.
- **Croatian TTL caption.** The task's hr caption is singular („Sonda s TTL-om 3 umire na R3 …"); the page speaks of
  the round's three probes: „Sonde s TTL-om 3 umiru na R3: TTL pada na 0, R3 ih odbacuje i za svaku šalje *Time
  Exceeded* (vrijeme isteklo) s adrese 10.0.2.2. Redak 3 ispisa: 10.0.2.2." The en caption likewise.
- **Tool names.** `tracert` and `traceroute` are the subject here (COMMON.md §1: a command appears where it is being
  taught; the book's Primjer 6 compares them), so they label the probe choice ("ICMP echo (tracert)", "UDP
  (traceroute)") and appear on the command line. Windows and Unix are named only in Sources, not on the page.

## Deviations from the task

- **Fifth param `routers`** (range 2–11, default 5, resets to step 0). The task's params are `tool`, `silent`,
  `destFilter`, `maxHops`, but its presets need 5 and 11 routers (`stars` = Primjer 5's 12 lines).
- **`silent` lists R1 … R11** whatever the chain; a silent router not on the chain changes nothing and the start
  caption says so (SPEC.md rule 6). A select's options cannot follow another param.
- **`tracert`'s "Request timed out."** after a stars line is left out (localised OS text, not a model fact).
- **No K2 view change:** none needed. The kit's drop, beside-the-link replies, badges, `span` and `className` covered
  it; the silent hatch is a class added by the page.

## Sources

- URM `book/chapters/11-usmjeravanje.md` §"ICMP i dijagnostika puta: `ping` i `traceroute`" (Što treba znati, Šire o
  temi), Primjer 5 (12 lines, hop 9 `* * *`, 10–12 normal), Primjer 6 (ICMP echo vs UDP, echo reply vs port
  unreachable); figure `assets/diagrams/ch11-tracert-ttl.svg` (TTL after each router, the silent hop's stars);
  screenshot `assets/images/ch11-traceroute-ispis.png` (output format, three decimals, hop 5 84.108 ms above hop 6).
- URM ch11 Primjer 1: A 192.168.1.10, R1 192.168.1.1.
- RFC 792 (Echo, Destination Unreachable code 3 = port unreachable, Time Exceeded code 0); RFC 1812 §5.3.1 (TTL);
  RFC 1812 §4.3.2.4 ICMP source address *(check: section number not verified offline)*; RFC 5737 (documentation
  addresses).
- Microsoft Learn, *tracert* (ICMP echo, TTL from 1, + 1, max 30, `-d`, `-h`, asterisks for routers that do not
  return Time Exceeded); FreeBSD *traceroute(8)* (UDP probes, base port 33434, port unreachable ends it, `-n`, `-m`).
- Derived and checked here: every RTT, printed line, port and step count in SPEC.md. Reference script (python3,
  standard library), run 2026-10-28, output equal to the model's:

  ```python
  LINK = [200, 1500, 3000, 18000, 2000, 1200, 800, 10500, 1000, 600, 400]; LAST = 300
  GEN = [300, 400, 500, 9000, 400, 600, 500, 700, 500, 400, 600]; GEN_S = 100
  JIT = [0, 41, 17, 63, 8, 52, 29, 74, 12, 47, 35, 58, 21]
  addr = lambda k: '192.168.1.1' if k == 1 else '10.0.%d.2' % (k - 1)
  def rtts(k, n):
      one = sum(LINK[:min(k, n)]) + (LAST if k > n else 0)
      return [2 * one + (GEN[k - 1] if k <= n else GEN_S) + JIT[(3 * (k - 1) + j) % 13] for j in range(3)]
  tr = lambda us: '<1 ms' if us < 1000 else '%d ms' % ((us + 500) // 1000)
  def run(n, tool='tracert', silent=None, filt=False, maxh=30):
      for k in range(1, (maxh if filt else min(n + 1, maxh)) + 1):
          dest = k > n; a = '192.0.2.20' if dest else addr(k)
          if (not dest and silent == k) or (dest and filt):
              print('%3d' % k + '     *   ' * 3 if tool == 'tracert' else '%2d  * * *' % k); continue
          r = rtts(k, n)
          print('%3d' % k + ''.join(tr(x).rjust(9) for x in r) + '  ' + a if tool == 'tracert'
                else '%2d  %s' % (k, a) + ''.join('  %.3f ms' % (x / 1000) for x in r))
  run(5); run(11, silent=9); run(5, tool='traceroute'); run(5, filt=True, maxh=8)
  ```

## Unchecked *(check)*

- UDP base port: the man page's base port 33434 is the first probe's port; the LBL source adds the sequence number
  counted from 1, which would make it 33435.
- Rounding of `tracert`'s whole milliseconds (half up here).
- RFC 1812 §4.3.2.4 section number (the rule itself, an address of the interface the error leaves by, the reviewer
  confirmed).
- The `filtered` preset is derived, not checked against a real trace.
- The delay values are made up to show rule 8 (hop 4 answers slowly: 54 ms, hop 5 50 ms).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| time to live (TTL) | vrijeme života (TTL) |
| hop | skok |
| probe | sonda (probni paket) |
| ICMP Time Exceeded | poruka o isteku vremena |
| port unreachable | *port* nije dostupan |
| maximum hops | najveći broj skokova |

`firewall` (vatrozid) is in the glossary; the page writes it out rather than as `[[firewall]]` because the page does
not otherwise load `glossary.js`.

## Shared requests

- **K2: a class (or `c`) on a packet's arrow and head**, so a page can colour a reply's whole arrow, not just its
  dashed line (here the heads stay ink). Smallest change: `packets[].className` added to the path, head and cross.
- **K2: a dashed unicast packet** (`packets[].dashed`): the reply arrows use `cast: 'broadcast'` only to get the
  dash; a unicast ICMP reply is not a broadcast. Fine while `broadcast` only dashes.
- **K2: a node `className`** (or a `state: 'quiet'`: hatched, solid border), for a node that works but does not
  answer; the page adds the class to the card after the view builds it.
- **K2: a template for columns** (`colsTemplate` or node `span` in the docs' fit notes): cards spanning two columns
  with one link column between them fit seven nodes with addresses in a row; worth saying in `docs/sim-ui.md` §10 "Fit".
- **Model promotion:** nothing taken from `hop-rewrite` but its TTL − 1 rule (one line); no promotion needed for this
  sim. `round`, `rtts`, `ttlOnLinks`, `formatLine` are pure and string-free if `packet-journey` wants them.

## Tags

Topic `networks`, tag `routing` (both in `tags.json`), level `intro`.

## Review

A fresh reviewer read the diff against SPEC.md (2026-10-28): every number recomputed independently and confirmed;
50 mutations of `sim.js`, 47 killed. Survivors were the per-probe `rtt`, `reply` and `at` (untested), the off-path
boundary R(n + 1), `destFilter: 'false'` and `state.dst`; tests added for each, and all six mutants now fail. Page
fixes from the review: "died only at S" when S answered (now "got as far as S"); "like every one before" at TTL 1
dropped and "probes with a larger TTL will pass" no longer said when the trace ends at that router; Croatian plural
of max hops in the start caption (`hopsN`: do 4 skoka, do 30 skokova, tested); the phase word "stiže / arrive" when
the probes reach S; the destination bold in the filtered caption. Left: the off-path silent note shows only at
step 0 (a later switch changes nothing and says nothing, as SPEC allows).

## Time

2026-10-28, 14:09 → 14:34, about 25 minutes, one session (plus a 4-minute review).
