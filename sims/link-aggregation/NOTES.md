<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# link-aggregation: notes

New explorer (task `docs/tasks/w3/link-aggregation.md`, catalogue `net-link-aggregation`, §4.1, wave 3). Rules and
expected numbers: `SPEC.md`. No kit view is named by the task; the stage is drawn in the page (HTML + one stretched
SVG for the strands).

## Decisions

- **Stage, left to right.** The hash calculator (one row per flow: flow and client, last MAC byte, last IP octet,
  source port, `hash mod n = i`, the link it gives), the strands (an SVG with `preserveAspectRatio="none"` and
  non-scaling strokes, stretched over its column), SW, the lanes, S. Above: the policy, the formula (marked
  "simplified", as the task's coordinator note asks), and `link = hash mod n → up links`. Below: offered, delivered,
  fastest flow, capacity.
- **A lane is its own load bar.** Each lane is a pipe 1 Gbit/s high; each flow on it is a band whose height is its
  rate, the rest hatched (idle capacity). Over the pipe: the link number, its load ("0,4 / 1 Gbit/s") and the flows on
  it (more than 5 → "8 tokova"). The task's "load bar and list under each lane" is this label line plus the pipe.
- **Alignment without measuring.** Every vertical position inside the fabric is a percentage of its height (9 table
  slots: header + 8 flows; per lane an 8 % label band, the pipe, a 3 % gap), so the SVG strands meet the table rows and
  the band centres at any size; nothing is measured after layout.
- **Unused hash inputs** are struck through and muted in the calculator (shape + colour), header included.
- **Traffic direction.** Flows go from the clients to S, so SW is the end that hashes (the explanation says each end
  chooses for what it sends). Hash inputs are symmetric (XOR), so nothing in the lesson depends on the direction.
- **Changed marks** compare with the state before the last input, flows matched by their headers (`flowKey`), not by
  position: adding flows or turning on "all from C1" marks nothing that did not move. Marked: the table row (kit
  highlight + ink border), the band (highlight inset + ink outline) and the strand (highlight underlay).
- **Failover caption** compares with the same settings and no failure (`failover` in the model), so it says how many
  flows moved and how many of them came from working links whatever was on screen before; with one link left it
  follows the task's en caption ("all 8 flows were re-hashed onto link 1 and now share its 1 Gbit/s").
- **Rule 5 caption.** A policy change that moves nothing says "Policy … gives the same assignment: nothing moved."
- **Numbers.** Rates in Mbit/s inside the model; shown in Gbit/s with at most 3 decimals and a decimal comma in
  Croatian (0,167 for 1/6).
- **Colours.** Flow k uses series colour k (c1…c8), always with its label (F1…F8) on the chip and the band.
- **No OS or product names** on the page (COMMON §1): "bond", "member link", the policy names and LACP / IEEE 802.1AX
  are the subject; the Linux bonding document is in Sources only.

## Deviations from the task

- **`demand` is in Mbit/s (100–1000, step 100)**, shown as 0,1–1 Gbit/s: the kit snaps ranges as
  `round((v − min) / step) · step + min`, which with step 0.1 gives values like 0.30000000000000004 in the URL.
- **`fail` has a fourth option, `all`.** With members ≥ 2 and only link 1 or link 2 failing, rule 6 (every member
  down, "the bond is down") could not be reached from the page.
- **`many-clients` splits 6 + 2 (not "e.g. 5 + 3") at demand 0,2 Gbit/s.** The seeded MACs give 6 + 2; with the
  default demand of 1 Gbit/s both links would just be full (2 Gbit/s delivered), so the preset sets 0,2: offered 1,6
  is less than the bond's 2, yet only 1,4 arrives (link 1 full, link 2 has 0,6 spare). `fail` (preset 4) keeps 0,2, so
  its numbers are the task's 8 × 0,125 = 1 Gbit/s.
- **`four-links` uses `layer2`** (the task names no policy): F1 → 3, F2 → 1, F3 → 2, link 4 idle.
- **Seeded values** (MACs, IPs, ports) are mine, chosen so the presets show the task's cases; they are in SPEC.md.
- **The demand hint** was dropped to keep the panel within 1080 px in Croatian.

## Sources

- Napredna Linux administracija, `meta/toc.md`, T06 "VLAN-ovi, mostovi i udruživanje sučelja" (title only; the
  chapter is not written, so there are no worked numbers to match).
- Linux kernel `Documentation/networking/bonding.rst`, `xmit_hash_policy` layer2 / layer2+3 / layer3+4 *(check: not
  read offline here; the formulas follow the task file's simplification)*.
- IEEE 802.1AX (Link Aggregation, LACP; formerly 802.3ad) *(check)*.
- URM has no link aggregation text (the task's grep).
- Numbers checked with a python3 script (standard library) before coding, 2026-10-27, equal to the model's:

  ```python
  S = dict(mac=0x10, ip=10, port=5000)
  macs = [0x3a,0x5c,0x71,0x8e,0x24,0x9b,0x46,0xd2]; ips = [21,22,23,24,25,26,27,28]
  ports = [50612,51088,49733,52310,50944,53217,49906,51475]; c1ports = list(range(50612, 50620))
  def flows(n, same): return [dict(mac=macs[0], ip=ips[0], port=c1ports[k]) if same else dict(mac=macs[k], ip=ips[k], port=ports[k]) for k in range(n)]
  def h(f, pol):
      x = f['mac'] ^ S['mac']
      return x if pol == 'l2' else x ^ f['ip'] ^ S['ip'] if pol == 'l23' else f['port'] ^ S['port'] ^ f['ip'] ^ S['ip']
  def assign(n, same, pol, members, fail):
      up = [m for m in range(1, members + 1) if m not in fail]
      return [up[h(f, pol) % len(up)] if up else None for f in flows(n, same)]
  print(assign(1, False, 'l2', 2, []))                 # [1]
  print(assign(4, True, 'l2', 2, []), assign(4, True, 'l34', 2, []))   # [1, 1, 1, 1] [2, 1, 2, 1]
  print(assign(8, False, 'l2', 2, []))                 # [1, 1, 2, 1, 1, 2, 1, 1]  → 6 + 2
  print(assign(8, False, 'l23', 2, []))                # [2, 1, 1, 1, 2, 2, 2, 1]  → 4 + 4
  print(assign(8, False, 'l2', 2, [2]))                # all 1
  print(assign(3, False, 'l2', 4, []))                 # [3, 1, 2]
  print(assign(8, False, 'l2', 3, []), assign(8, False, 'l2', 3, [2]))
  # [1, 2, 2, 3, 2, 2, 3, 3] [1, 1, 3, 1, 1, 3, 1, 1]: 7 moved, F4 F7 F8 from link 3
  ```

## Unchecked *(check)*

- The kernel's exact `xmit_hash_policy` formulas (they fold more bits and, for layer2, add the packet type); the page
  says "simplified" and the explanation says the real formula mixes more bits.
- That 802.1AX names the unit a "conversation" mapped to one link (task file's wording).
- Croatian terms marked *(check)* in the task: članska veza, *bond* (udruženo sučelje), sažetak (*hash*), raspodjela
  opterećenja, LACP (protokol za udruživanje veza).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| link aggregation | udruživanje sučelja (NLA T06) |
| bond | *bond* (udruženo sučelje) *(check)* |
| member link | članska veza *(check)* |
| flow | tok |
| hash | sažetak (*hash*) *(check)* |
| load balancing | raspodjela opterećenja *(check)* |
| LACP | protokol za udruživanje veza *(check)* |

`hashing` (raspršivanje) is in the glossary and used as `[[hashing]]`. `tags.json` labels the tag "agregacija veza";
the page title uses "udruživanje veza" (the NLA chapter's verb); the owner may want one term.

## Shared requests

- None for the kit. The lanes-with-bands drawing could become a kit view if another sim (e.g. `lnx-bonding-modes`,
  catalogue §4.4, which names this sim as its base) needs it.
- **Model promotion:** `lnx-bonding-modes` (NLA T06 → `net-link-aggregation`) will likely reuse `hashOf`, `assign`
  and `share`; they are pure functions over plain data and can move to `models/` unchanged.

## Tags

Topic `networks`, tag `link-aggregation` (both in `tags.json`), level `intro`.

## Review

A fresh reviewer read the files against SPEC.md (2026-10-27): every number recomputed independently in python3 and
confirmed; 40 mutations of `sim.js`, 9 survived (5 of them equivalent on the seeded data: MAC and IP are 1:1, no flow
is ever on a down member). Fixed: tests now pin `flowKey` including the source port, `samePair` false for different
clients sharing a link, `overloaded` at exactly 1 Gbit/s and reading demands rather than rates; re-run, all four
killed. `changed()` no longer marks a flow that had no link before or after (bond down ↔ up). Page fixes: rule 5's
"same assignment" sentence only when the policy alone changed (not on a preset or reset); the failover caption says
"on another link than without the failure" (its count is against the no-failure state, while the highlights compare
with the last input, so the two may differ by design); singular forms for one flow ("the flow was re-hashed", "from
a working link"); no "has its 1 Gbit/s" for a single flow below 1 Gbit/s; hr "svih 8 tokova … dijeli"; en "at r Gbit/s
each".
- **Open (owner):** the policy names layer2 / layer2+3 / layer3+4 are Linux bonding's `xmit_hash_policy` values; the
  task mandates them and NLA T06 teaches Linux bonding, so they stay.

## Time

2026-10-27, 11:29 → 11:48, about 19 minutes, one session (the fresh review included).
