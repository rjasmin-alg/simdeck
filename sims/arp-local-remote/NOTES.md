<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# arp-local-remote: notes

New stepper (task `docs/tasks/w2/arp-local-remote.md`, catalogue `net-arp-local-remote`, overlap §5.9), pilot of kit
view **K2: topology with moving packets**. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Steps depend on the params** (`steps(params)`, as `radio-networks` does): 8 per packet, 5 on a cache hit. The
  defaults (A → B, /24, empty cache) give 8, which is `sim.json` `steps`; the longest run is `mask-28`, 16.
- **The `mask-28` preset is a second network, not a mask value.** The task's `mask` param (/24, /25, /28) applies to A
  on 192.168.1.0, but the preset uses host 192.168.5.77/28 (Primjer 6). So a `net` choice (`lan` / `lan28`) switches
  the scene; in `lan28` the destination select is hidden (the run is fixed: .70, then .90) and the mask is disabled
  with the reason "U ovoj mreži maska je /28." `net` resets to step 0.
- **`mask` changes A's mask only.** B, C and R keep /24; the decision is A's. /28 on `lan` makes B and C (.20, .30)
  remote for A, so A sends to B via R although B is on the same wire: a real misconfiguration, left in as a "what if";
  what R does next (forward, ICMP redirect) is out of scope. /25 changes nothing for these addresses (all below 128),
  which is itself a point to make.
- **`cache` seeds every next hop of the run** into A's table ("A already knows the next hop's MAC"), so `mask-28`
  with cache is 5 + 5 = 10 steps.
- **Destination select values** are the five addresses the task lists; `dst` = 192.168.1.1 (the gateway itself) is
  local (tie-break in SPEC.md rule 2).
- **RFC 826 merge rule in full**: a station that hears the request and already has the sender's IP refreshes the MAC
  (`refreshed`, a dashed row with the word "osvježeno"/"refreshed"); only the target adds a new entry. It shows up
  naturally in `mask-28` packet 2: B, which learned A on packet 1, hears the request for R and refreshes A's entry.
- **Step 6 (`arpHear`) has no frame on the move**: the request's dashed arrows stay drawn, and the badges say who
  hears and who answers. The reply leaves at step 7.
- **MAC addresses** are locally administered and chosen so the station shows: A `02:00:00:aa:aa:aa`, B `…bb:bb:bb`,
  C `…cc:cc:cc`, R `02:00:00:00:00:01`. The book gives none *(check)*. `lan28`'s C (192.168.5.74) is derived too.
- **The decision box** shows all 32 bits in four octets; after the compare, bits that differ between the two AND
  results are highlighted (yellow, bold, underlined). On a phone the bits are hidden and only the dotted decimals stay.
- **K2 layout**: five equal columns (A, B, C, R, cloud); a lane over the bus carries the frame of the step: a dashed
  arrow with a head at every listener for the broadcast, a solid one for unicast; a chip labelled
  "zahtjev/odgovor/ping" moves from sender to receiver on a forward step (CSS animation of `left`, off under reduced
  motion). Positions are `(column + 0.5) × 20 %`. Kept in the page; the reusable part for later path pages is the
  model's scene and the column/lane CSS.
- **Model is promotable**: `sim.js` exports `and`, `bits`, `maskIp`, `decide`, `hear`, `learn`, `NETS` as pure functions
  over plain data with no strings.
- **Legend swatches** `dash`, `line`, `row`, `tick` are page CSS on `.sd-swatch[data-shape]` (the kit has round,
  hollow, hl).
- Captions mark English terms in Croatian with `*term*` in `strings.js`; the page turns them into `<em lang="en">`.
  A caption placeholder used twice is cloned (a DOM node appended twice would move).

## Deviations from the task

- Added param `net` (see above), needed to reach the `mask-28` preset with the task's params.
- The hr caption in the task ("192.168.2.50 AND … traži MAC adresu *default gateway* …") is split over the steps:
  the AND result in step 2, the decision and "not the destination" in step 3.

## Sources

- URM `book/chapters/08-mrezni-sloj.md`: "ARP: od IP adrese do MAC adrese", Primjer 2, 5, 6, 7.
- URM diagrams `ch08-lokalno-udaljeno-odrediste.svg`, `ch08-arp-zahtjev-odgovor.svg` (dashed arrows to all, solid
  arrow back: the same convention here).
- RFC 826 (broadcast request, swap and unicast reply, merge rule); RFC 1122 §3.3.1, §3.3.1.1.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| subnet mask | podmrežna maska |
| bitwise AND | bitovno I |
| default gateway | zadani pristupnik |
| next hop | sljedeći skok *(check: task file marks it "check")* |
| ARP table | ARP tablica |
| ARP request / ARP reply | ARP zahtjev / ARP odgovor |
| broadcast / unicast | emitirano / jednoodredišno |

## Shared requests

None. (`models/` unchanged; the model is ready to promote for `net-hop-rewrite` and other §5.9 path pages.)

## Checks

- `node --test sims/arp-local-remote/sim.test.js`: 22 tests. Each rule broken once on a copy (compare, next hop, ARP
  target, cache hit, sender hearing itself, non-target learning, no merge refresh, IP destination): a test failed
  every time.
- `npm run gate -- arp-local-remote --shots …`: pass (61/61 browser checks). Screenshots looked at: 1920×1080 light,
  dark, grayscale, panel hidden, help, 375×812, both languages, and extra states (broadcast heard, reply, remote send,
  cache hit, `mask-28` packet 2).

## Review

A fresh reviewer read the diff against `SPEC.md` and broke 26 things in a copy of `sim.js`; 22 were caught. Two gaps were
real and now have tests (the frame's dst MAC comes from A's table, not from the station list; a target that already
has the asker refreshes one row, never adds a second). The other two cannot happen in this model (A is never an ARP
target; A only asks on a miss). Also fixed from the review: the explanation now says the gateway's address stays out
of the packet *when it is only the next hop* (the `dst` = gateway option sends to it as the destination); the
`looks-close` hint ("first two numbers match, the third is close"); Croatian case with the term rule (the English term
with its Croatian pair as an apposition, nominative); Croatian closing quotes „…“; ARP rows ≥ 16 px on phones;
"pitatelj" replaced by "onaj koji pita". Left as is: "ping" as the name of the echo exchange (the concept at intro
level, not a tool) *(check)*.

## Time

Start 2026-10-03 19:42 CEST, done 20:00 CEST: about 20 min of wall clock.
