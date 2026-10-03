<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dhcp-dora: notes

New stepper (task `docs/tasks/w2/dhcp-dora.md`, catalogue `net-dhcp-dora`), pilot of kit view **K1: message sequence
chart**. It replaces the placeholder that was in `sims/dhcp-dora/` (a four-step Croatian-only page with `steps.js`).
Rules and expected numbers: `SPEC.md`.

## Decisions

- **One step, one event**, in the task's order of checks (scripted event, delivery, next timer). A message is drawn
  in the step it is sent and takes effect in the step it is delivered, so the ACK that binds the client is its own
  step ("DHCPACK has arrived"). Messages take no time: the whole DORA is at 0 s.
- **Offers from one DISCOVER arrive together** in one step: the client takes the first (A's, the list order) and the
  rest are marked "late, ignored". Delivering them one per step put the REQUEST before B's offer had arrived and
  pushed one combination to 21 steps.
- **A lost message needs no delivery step**: receivers that are down get ✕ at send time; a broadcast with some
  receivers up is delivered to those.
- **`serverB` is a choice, not a toggle**: `none`, `plain`, `partner`. A plain B does not know A's lease and stays
  silent at REBINDING; a partner (hot standby) holds a copy of every binding A records and answers only when A is
  down. Without the distinction the `rebind-to-b` preset contradicts the misconception the task names ("the second
  server is a backup that takes over the lease"). Added preset `no-backup` (plain B, A down) to show that one:
  the client loses .100 at expiry and comes back with .150 from B.
- **Added params `leave` (`stay`/`off`/`release`) and `optChange`** to reach `classroom-2h` and `windows-8d`. The
  client leaves at 5/12 of the lease (2 h → 50 min, UL Primjer 3); the DNS option changes at lease / 8 (8 days → 1 day).
  `optChange` is disabled while a server fails ("one story at a time"); it also keeps every combination ≤ 20 steps.
- **`failAt t1` is 10 s before T1** (the task's 290 s for 600 s); `t2` is 10 s before the first lease's T2 (515 s):
  the renewal at 300 s has already moved the lease, so A's failure shows at the next T1 (600 s), 14 steps.
- **End of a run**: the client is BOUND again by a later ACK with no scripted event pending, or stays in INIT with
  nothing to try, or nothing is left (SPEC.md). So `two-servers` runs on to the renewal (8 steps), which shows the
  T1 REQUEST going to A only.
- **NAK** is in the model (a server asked to renew a binding it lacks), with a test, but no preset reaches it.
- **Times**: the 600 s lease shows seconds (412,5 s with a decimal comma in Croatian); 2 h and 8 days show
  d/h/min/s. The lease bar keeps one scale for a whole run (the longest expiry the run reaches).
- **Chart**: lanes C, A, (B) with lifelines; one row per message or event note; message name near the sender,
  receiver reactions ("no record, silent", "frees .150", "late, ignored", "on its way") near the receiver. When the
  rows do not fit, the oldest are dropped and "↑ N earlier rows" says so (on a phone the page scrolls instead).
- **On the kit view since kit 0.4.0** (task `kit-sequence-chart`, 2026-10-03): the lane cards' frame, mark and name,
  lifelines, arrows, tips, ✕, message chips, receiver words, notes, the time column and the dropping of old rows are
  drawn by `Simdeck.sequence` (`docs/sim-ui.md` §11); the page keeps the card bodies, the field card, the lease bar
  and the `none` legend swatch, and decides which lanes are down in each row. Differences a student would not notice:
  the lifelines and arrows sit at the card centres (they were at column centres of the area without gaps, up to 8 px
  off), the time column is 0.8rem further from the first lifeline, a word at a receiver one lane from the sender
  that is not the outermost lane (A, from C, with B shown) sits beyond A instead of before it, and the broadcast
  legend swatch is the kit's (its dashes show).
- **Field card** shows the first message sent in this step, or the one delivered in it ("from an earlier step"):
  ports, broadcast/unicast, ciaddr/yiaddr/chaddr, flag B, options 50/51/54/1/3/6, and under OFFER/ACK to a client
  without an address the BROADCAST-flag note (rule 5).
- **Presets in two columns** (page CSS on `.sd-presets`) with short labels; the longer description is each preset's
  hint (tooltip). Seven presets and six params did not fit the 1920×1080 panel otherwise.
- **Windows Server** is named only in the 8-day preset's hint (the label is "8 dana"): the task asks for that
  default, and the WIN1 course teaches the Windows Server DHCP role. The reviewer flagged it under "concepts, not
  tools"; it is kept, and the report asks the owner. The caption about
  169.254.0.0/16 names no OS.
- **Model is promotable** (`models/dhcp-lease`, as `models/README.md`'s example): `timers`, `retryAt`, `freeAddr`,
  `serverHears` and the client reactions are pure functions over plain data with no strings. `win-dhcp-scope-options`
  builds on this sim.

## Deviations from the task

- Step counts: `two-servers` 8 (task 7), `rebind-to-b` 11 (task 9), `windows-8d` 9 (task 7); the task marked them
  derived and unchecked. `lease-600` 8, `server-dies` 11, `classroom-2h` 7 match.
- `serverB` toggle → three-way choice; params `leave` and `optChange` added; preset `no-backup` added (seven presets).
- State `OFF` added to the client states; `hist` (lease-bar history) and `rows` (chart) added to the state.
- Title in Croatian uses "zakup" (URM), and the lease bar says "zakup"; the UL word "dodjela" appears in the concept.

## Sources

- UL `uvod-u-linux/book/chapters/18-mrezne-usluge.md`: "Četiri poruke", "Portovi 67 i 68", "Što poslužitelj pamti"
  (client MAC, .100, `valid_lifetime=600`, `democli1`), "Što se uz adresu još dijeli" (options 1, 3, 6, 51; router
  192.168.180.1), "Koliko dodjela traje" (600 → 300 / 525), Primjer 3 (2 h lease, T1 after 1 h, machines switched off).
- UL figure `assets/diagrams/chapter-18/dhcp-cetiri-poruke.svg` (two servers; REQUEST broadcast tells B it lost).
- URM `uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, "DHCP: DORA slijed…", and figure
  `ch14-dhcp-dora-broadcast.svg` (all four broadcast).
- RFC 2131 §3.1, §4.1, §4.3.2, §4.4.1, §4.4.5, §4.4.6; RFC 2132 §3.3, 3.5, 3.8, 9.1, 9.2, 9.7; RFC 3927 (169.254/16).
- Windows Server 8-day default lease: Microsoft's Windows Server DHCP documentation *(check the exact title)*.

Unchecked *(check)*: silence of a server without the binding at REBINDING (RFC states it for INIT-REBOOT); the partner's
hot-standby behaviour (a model of failover, not an RFC); DNS 192.168.180.1 / .53 and pools .101–.102, .151–.152 are
derived; the 8-day default's documentation title.

**Coordinator note (from the task):** URM ch14 says all four DORA messages are broadcast; RFC 2131 §4.1 makes OFFER
and ACK broadcast only with the BROADCAST flag. The sim follows the RFC with the flag on by default, so the default
picture matches the book; the field card and the explanation say what changes without it. A footnote in URM may help.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| lease | zakup (URM) / dodjela (UL) |
| lease time | trajanje zakupa |
| broadcast | *broadcast* (emitiranje) |
| unicast | jednoodredišno |
| renewing | obnavljanje |
| rebinding | ponovno vezanje |
| server identifier | oznaka poslužitelja |
| requested address | tražena adresa |
| BROADCAST flag | zastavica BROADCAST (zastavica B) |
| failover partner | partner (u pripravnosti) |

`pool` → `skup adresa` is in the glossary already.

## Shared requests

None. `models/` unchanged. The model is ready to promote as `models/dhcp-lease.js` for `win-dhcp-scope-options`,
`net-dhcp-relay` and `net-dhcp-rogue`.

## Checks

- `node --test sims/dhcp-dora/sim.test.js`: 33 tests, tie-breaks first; every one of the 324 param combinations ends
  in ≤ 20 steps.
- `npm run gate -- dhcp-dora --shots …`: pass, 61/61 browser checks. Screenshots looked at: 1920×1080 light, dark,
  grayscale, help, panel hidden and 375×812, both languages; plus single states (`no-backup` steps 11 and 17,
  `rebind-to-b` 11 in dark, `classroom-2h` 6, `windows-8d` 9, `server-dies` 11).

## Review

A fresh reviewer read the model against SPEC.md and RFC 2131 and ran 60 mutations on a copy of `sim.js`: 46 caught,
14 missed. Of the misses, 3 cannot happen in reachable runs (two servers only, late offers in reverse order; a run
that never ends in INIT; partner never offers); the rest now have tests (existing binding re-offered, address offered
to another MAC skipped, retry times for a 2 h lease, `retryAt` equality, `addr` null after expiry, B's new lease
expiry 1200 s, a no-offer DISCOVER ends the run, partner copy on RELEASE and server expiry, no expiry on a down
server, the option change reaches every server). Re-run of the RELEASE-copy, binding-reoffer, down-server-expiry,
option-to-all and NAK-state mutations: all caught.

Fixed from the review: "one retry per state" is now called the model's simplification (SPEC rule 9 and the
explanation, which says the client repeats the request and the sim does it once); the renewing NAK is marked
*check*; the client accepts a NAK only while REQUESTING, RENEWING or REBINDING; the offer caption says "not recorded
as a lease" (the server card does show the open offer); the "different address" caption checks the address
(`capBoundSame` otherwise). Left as is: an OFF client keeps `addr` for the display (SPEC says so); Windows Server in
one hint (above).

## Time

Start 2026-10-03 20:03 CEST, done about 20:45 CEST: about 40 min of wall clock (model and tests ~15 min, page and
screenshots ~15 min, review and fixes ~10 min).
