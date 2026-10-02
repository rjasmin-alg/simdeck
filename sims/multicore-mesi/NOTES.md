<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# multicore-mesi: notes

Adopted from `single-page-labs/homogeni-multicore-simulator.html` (task `docs/tasks/w1/multicore-mesi.md`, catalogue
`spl-multicore-mesi`, lab LV13). The simdeck copy is canonical from here on.

## Decisions

- **Class `explorer`.** The original is three interactive panels (Amdahl sliders, MESI buttons, a false sharing
  animation), not a stepper. The kit's one-screen layout shows one panel at a time: the param **Prikaz / View**
  (Amdahl · MESI · False sharing) switches the stage; each view's own controls appear only in that view.
- **Three concepts on one page, kept on purpose.** COMMON.md §1 says one concept per sim, but the catalogue entry
  decides "import; split MESI out as a `step` page later" (`arh-mesi`, catalogue §4.9). This task imports; the split
  is a later task. Reported.
- **MESI operations are params** (`o1` … `o16`, hidden choice params with values `r0 w0 r1 w1`), so the state is
  `initial(params)` like any explorer, and a reload, a link and the language switch (which reloads) keep the
  operations. At most 16 operations (one lecture demo); then Read/Write are `aria-disabled` and the stage says to
  undo or empty the caches. Undo (`U`) and "Empty the caches" were added; the original had only "Reset MESI".
- **Keys:** `Q`/`W` core 0 read/write, `O`/`P` core 1 read/write, `U` undo; they switch to the MESI view if needed.
- **False sharing uses the same MESI model** (`access` over `caches[core][line]`): core 0 writes `counter[0]`, core 1
  writes `counter[1]`, in turn, core 0 first. The original's timer animation became the slider **Number of writes**
  (0–16), so the lecturer sets the count and the state is reproducible.
- **Presets (keys 1–8):** Amdahl 80 % / 8 cores (the original's default), Amdahl 95 % / 64 cores, MESI empty, both
  read (E then S S), a write invalidates (r0 r1 w0), writes in turn (w0 w1 w0 r1: three write-backs), false sharing
  without and with padding at 8 writes.
- **Chart.js dropped, not vendored.** The task says vendor it; step 5 allows "vendor or drop". One line chart does not
  need a 200 KB library: it is an inline SVG drawn at 1:1 in pixels (text ≥ 16 px, kit tokens, both themes), redrawn
  on resize, like `amdahl`. The original's points at n = 1, 2, 4 … 64 are marked on a continuous curve (log x axis), with
  the 1/(1 − p) ceiling dashed and the current n as a highlighted dot. No third-party code remains, so no `credits`.

## Deviations from the original (and why)

- **RAM value corrected.** The original incremented "RAM: X" on every write, while its own state text said
  "Modified — RAM zastarjeo". Now each cache holds its own value of X, RAM changes only on a write-back, and the RAM
  box says "stale" while a copy is M.
- **Invalidation count corrected.** The original counted a read that turns the other core's M into S as an
  invalidation; that is a downgrade with a write-back. Only copies that become I are counted.
- **Write to S is an upgrade** (bus invalidate, no data fetch), shown as such in the log; the "Misses" counter includes
  it. A write to E is a hit with no bus traffic (E→M), as in the original.
- **"Relative speed" bar replaced.** The original showed made-up figures ("~95 %", `100 − inval/ops·90`). Now the bar is
  the share of writes served by the own cache without the bus, which the model counts (0 % without padding, 75 % with
  padding at 8 writes).
- **Log** shows the last six operations, each with its state changes; the caption explains the newest one (why E or S,
  why the other copy became I).
- **Wording:** "Sekvencijalni zid" and "Efikasnost" kept; "speedup", "Hits", "Writebacki" became Croatian ("Ubrzanje",
  "Pogoci", "Pisanja natrag"); state names as *Modified* (izmijenjena) etc. by the term rule. Emoji and arrows on buttons
  dropped (kit buttons with key caps).
- **Fonts:** the original used system fonts and a Chart.js CDN script; both gone (kit fonts, no network loads).
- **The original's back link** (`./`, "Svi materijali") became the kit's back link.

## Sources

- The original page (model, wording, numbers: 80 % / 8 cores → 3.33×, 42 %, 5.0×).
- Amdahl, G. M. (1967), "Validity of the single processor approach to achieving large scale computing capabilities".
- MESI (Illinois protocol): Papamarcos & Patel (1984), "A low-overhead coherence solution for multiprocessors with
  private cache memories"; Hennessy & Patterson, *Computer Architecture: A Quantitative Approach*, ch. 5.
- *(check)* Whether LV13 teaches a read of an M line as write-back to RAM (as here) or as a direct cache-to-cache
  transfer; both end in S S. The original wrote back.
- *(check)* 64-byte lines and 4-byte integers are the original's assumptions (common, not universal).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| speedup | ubrzanje |
| cache coherence | koherencija predmemorija |
| cache line | linija predmemorije |
| invalidation | invalidacija |
| false sharing | lažno dijeljenje |
| padding | dopuna |
| Modified / Exclusive / Shared / Invalid (MESI states) | izmijenjena / isključiva / dijeljena / nevaljana |

`cache`, `hit`, `bus` and `write-back` come from the glossary (`[[…]]`).

## Shared requests

- **Glossary:** add the term pairs above with `"src": "simdeck"`.
- **kit.css: `.sd-ctl[hidden]` is still shown** (the request `amdahl` filed); worked around in this page's CSS.
- **kit: a hidden state param.** The MESI history is kept in 16 hidden `choice` params because the kit has no param
  type for state without a control. A `{ type: 'state' }` param (no control, kept in the URL) would replace them.
- **models/: Amdahl.** `speedup(p, n)` is the classic form of `sims/amdahl/sim.js` `amdahl(s, n)` (with s = 1 − p);
  written out here (one line) rather than copied. A shared `models/amdahl.js` would serve amdahl, webserver-amdahl and
  this sim.
- **Catalogue `arh-mesi`:** `access()` in `sim.js` is pure and promotable as the MESI model for that later step page.

## Checks not done here

- Real projector and clicker (an explorer has no step keys; `R`, 1–8, Q/W/O/P/U work).
- The gate's screenshots show only preset 2 (Amdahl); the MESI and false sharing views were shot separately
  (presets 3–8, hr and en, light, dark, grayscale, 375×812) and reviewed.
- The explanation, opened, scrolls inside the panel at 1920×1080 (the gate checks the panel closed).

## Time

Start 2026-10-02 06:19, done 06:33 (about 15 minutes of wall clock, one session).
