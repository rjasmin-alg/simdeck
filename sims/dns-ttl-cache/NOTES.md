<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-ttl-cache: notes

New stepper (task `docs/tasks/w3/dns-ttl-cache.md`, catalogue `inet-dns-ttl-cache`, wave 3). Rules and expected
numbers: `SPEC.md`. Drawn by the page: no kit view has a time axis (Shared requests).

## Decisions

- **Busy resolvers refetch at the moment of expiry.** The task's step order has each client ask at the step times,
  but its own `book-naive` numbers (R3 fetched at −5 min, 10 min steps) cannot happen if asks only come at steps.
  The model therefore treats each office as asking all the time: an entry that reaches `fetchedAt + ttl` is
  refetched at that moment, and every event between two steps happens at its own time. The client icon still
  reports at every step. A side effect worth having: the step size (5 or 10 min) changes what is shown, never when a
  resolver switches. Equal times: zone edits first, then R1, R2, R3 (the task's order).
- **One set of offices for every preset.** Each resolver has a fixed phase (one fetch at R1 −50, R2 −20, R3 −5 min)
  and, before the first zone edit, fetched every old TTL along it; presets change only the operator's choices. This
  gives the task's numbers for `book-naive`, `lowered-too-late` (R2 at −20 → +40) and `negative`, and the task's
  outcome for `book-lowered`.
- **The window follows the params** (SPEC.md, "The window"), so changing a param by hand keeps a sensible view, and
  it is capped at 20 steps (the lowering then sits left of the axis, marked "←").
- **`lower` toggle added.** The task's params give no way to say "no lowering" (`book-naive`); `lowerAt` 0 would
  still hand out 300 s after the change. `lower`, `lowerAt` and `newTtl` are hidden in the new-name scenario, where
  they do nothing.
- **`scenario` param added** (address move / new name), so the `negative` preset survives a hand-changed param and
  a language switch (the kit keeps only control params in the URL).
- **Marks:** "changed" (the yellow card) is set when the cached *value* changes (old → new, nothing → answer,
  NXDOMAIN → address), not on every refetch: with 300 s TTLs and 10 min steps every resolver refetches every step,
  and highlighting all of them would hide the switch. Refetches are shown as their own badge ("↻ 2 upita").
- **The lowering changes the TTL of `posluzitelj` only**, not the SOA; the negative TTL stays min(900, `oldTtl`)
  (RFC 2308 §5 with the SOA TTL = `$TTL`).
- **Each track draws the whole lifetime of each fetched record**, the part after "now" faded and dashed: the
  expiry is fixed when the record is fetched (rule 2), so showing it is not a forecast. The card says "stara do
  +55 min" for a resolver still handing out the old address after the change.
- **Several resolvers switching in the same step** with the same old TTL get one sentence (`book-lowered` at 0).

## Deviations from the task

- `book-lowered`: R3's 3600 s entry expires at −65 (fetched −125), not at −15 (fetched −75): the shared phase of R3
  is −5 mod 60 min. Outcome unchanged: all three hold 300 s entries well before 0 and switch at 0.
- `lowered-too-late`: R1 (−50) and R3 (−5) were not given by the task. R3 fetched after the lowering, so it gets
  300 s and switches at 0; R1 switches at +10; R2 at +40 as the task says. The observed window is 40 min; the
  task's "still ~60 min" is the bound (an entry fetched just before −10 lasts until +50).
- `book-lowered`: with the task's numbers all three switch at exactly 0 (all on the 5-minute grid, edits first);
  the caption says the window is at most one new TTL.
- Params added: `scenario`, `lower` (above). `changeAt` is fixed at 0 in the model, not a param.
- Times derived by the task for `book-naive` (+10, +40, +55) and the addresses 192.168.180.2 / .3 are as the task
  gives them; the book gives neither *(derived)*.

## Sources

- UL ch19 (`~/projects/uvod-u-linux/book/chapters/19-dns.md`): "Tko odgovara kad se pita za ime" (definitions
  *TTL zapisa*, *predmemorija*), "Vlastiti poslužitelj imena" (`MINIMUM`, *negativno predmemoriranje*), Primjer 2
  (`$TTL 3600`, lower to 300 s one full TTL before, no recall, `MINIMUM` 900 s, "sniženje vrijedi samo za ono što
  se dijeli odsad nadalje", "Sniziti ga na dan selidbe ne pomaže ništa").
- RFC 1035 §3.2.1, §4.1.3; RFC 2181 §8; RFC 2308 §5; RFC 8767 §4.
- `sims/dns-resolution/` for `valid`, `left` and `serve` (copied, below).
- The DR estate scenario S6 was not used: its timeline fits secondary expiry, not TTL (task note).

## Reuse from dns-resolution

`models/` has no DNS model yet, so `valid`, `left` and `serve` are copied into `sim.js` with the comment
`// from sims/dns-resolution/sim.js @ a66760c`; `fetch` calls `serve` on the zone written in dns-resolution's zone
shape. A test checks the copied `serve` still answers like the original (answer with aa, NXDOMAIN TTL = min of the
SOA's TTL and MINIMUM). Promotion candidate: a `dns-cache` model with `valid`, `left`, `serve` from
dns-resolution; this sim's `fetch`/`advance` could join it later.

## Checks

- Numbers: an independent Python hand model (busy resolvers, edits first) gave book-naive 10/40/55,
  book-lowered 0/0/0, lowered-too-late 10/40/0 and, with `oldTtl` 1800, 10/10/25 before the model was run; the model
  agrees (`sim.test.js`, "presets").
- Rule tests broken on purpose, 19 mutations one at a time (valid at 0 s left, resolvers before edits at equal
  times, refetch at the next step instead of at expiry, fetch keeps the old TTL, a TTL change shortens cached
  entries, recall on the address edit, negative TTL = MINIMUM, negative TTL the larger, negative TTL from the
  lowered record, full TTL instead of what is left, source always "cache", changed on any refetch, no negative
  caching, a different phase, first question ignored, seed not strictly before the first edit, window not capped,
  lowering ignored, refetch count not reset): every one fails a test (the negative-TTL-display one after a test was
  added for it).
- Fresh review (a separate agent read the code against SPEC.md and the book, broke rules and drove the page in both
  languages): model and numbers confirmed. Fixed from it: the "before the change" caption implied that records
  expiring before 0 are safe (they are refetched with the old address and the full old TTL); "another fifteen
  minutes" in the explanation (it is up to fifteen minutes from the question); the Croatian case after
  `[[cache]]`; the start caption named the lowered TTL as the zone's and used the future tense for a lowering
  already done; SPEC said only two params reset (all do); quiet steps after everyone switched now say so. Ten
  mutations that survived its run now have tests (source with `>=`, step 0 never "auth", nothing → answer not a
  change, step 0 refetch count, the "in time" boundary, the new-name window from MINIMUM, the step log not reset,
  NXDOMAIN counted as old, the seed TTL fixed at 3600, the seed using the last edit): 29 mutations in all, none
  survive. `to` lost its `2 × newTtl` term, which never won (`newTtl` ≤ 300 s ≤ one step). Left as is: the
  *mjerodavni* / *autoritativni* term choice (report, for the coordinator).
- Page sweep: every step of every combination of `scenario` × `oldTtl` × `lower` × `lowerAt` (−120, −70, −40, −10,
  0) × `newTtl` × `stepMin` in both languages (1696 states): no console errors, no empty or broken caption, no page
  scroll or stage overflow at 1920×1080.
- `npm run gate -- dns-ttl-cache`: passes; screenshots reviewed at 1920×1080 light, dark,
  grayscale and 375×812 in both languages, plus `book-naive` +40, `book-lowered` 0, `lowered-too-late` 0 and +30
  (dark), `negative` 0, and `lowerAt` −120 (window capped).

## Unchecked *(check)*

- RFC 1035 §4.1.3 defines the TTL field; that a resolver hands out the decremented TTL is RFC 1035 §7.4 / RFC 8767
  §4 as the task cites it *(check)*.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| record TTL | TTL zapisa | UL ch19, definition |

The glossary has *authoritative server* as "autoritativni poslužitelj" (UL); the page uses the task's "mjerodavni
poslužitelj" (URM) and names the glossary term once in the explanation, as `dns-resolution` does.

## Shared requests

- **A time-axis kit view** (the task names one: "kit view 'time axis'"; none exists). This page draws its own: a
  row grid with an axis of step ticks, labelled markers (change, lowering), a "now" line through every row, and
  per-row segments from start to end time with past/future styling and cut ends at the window's edges. Other
  over-time sims (secondary expiry, DHCP leases, certificate lifetimes) could share it.
- **Kit legend swatches** `old` (hollow circle), `new` (filled circle), `nx` (hatched square) and `bar` (a
  part-filled bar): defined in the page's CSS.
- **A control with `visible: () => false` stays visible:** `kit.js` sets `hidden` on the `.sd-ctl` wrapper, but
  `kit.css` gives `.sd-ctl` `display: flex`, which wins over the `[hidden]` default. The page adds
  `.sd-ctl[hidden] { display: none; }`; the kit could add it once for every page.
- **`Simdeck.h` writes `dataset: { x: null }` as `data-x="null"`**, so an attribute selector `[data-x]` matches. The
  page drops null keys itself (`ds()`); the kit could skip null and undefined values.

## Time

Start 2026-10-25 08:56, gate passing and status ready after the review fixes at 09:21: about 25 min of build and review.
