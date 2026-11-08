<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-secondary-expiry: notes

New stepper (task `docs/tasks/w3/dns-secondary-expiry.md`, catalogue `inet-dns-secondary-expiry`, wave 3). Rules and
expected numbers: `SPEC.md`. Drawn by the page: no kit view has a time axis (Shared requests).

## Decisions

- **A step is a moment, not a clock tick.** The task's "jump to the next interesting event" is made exact: an action,
  one protocol moment (expiry and/or check at one second), or a run of routine checks (same kind and outcome as the
  previous check, nothing taken, no action in between) folded into one step with a count. The first check of each
  kind is its own step, so REFRESH and RETRY are each seen once before they are folded. The task's "first and last
  retry of a run" became "first retry" plus "the rest of the run, up to the last one before the next event", which
  ends one retry before the expiry (day 6, 23:45): the client still gets answers 15 minutes before SERVFAIL.
- **No client-query events.** The client asks S at every step and the card shows what it gets; a separate query
  step added nothing the card does not show.
- **The end of a run** (SPEC): P off → at the expiry; P up → after one full EXPIRE of refreshes from the last
  action, which shows that the expire clock never runs out while P answers (and, in `no-serial-bump`, that the old
  record stays a week later).
- **Buttons put the action at the moment shown** (a second later if an action already happened at that moment) and
  step to it; later scheduled actions are dropped. With the equal-time order (expiry, check, actions) and that
  second, the steps already shown never change (a test adds every allowed action at every step of every preset and
  compares). Each action at most once per run: three hidden params (`editAt`, `killAt`, `reviveAt`, kept in the URL)
  instead of an encoded event list. A second kill after a revive says "once per run; R".
- **After the expiry** S keeps retrying; when P answers, S takes the whole zone again regardless of the serial
  (it has no usable copy). The task leaves this open; it makes V after the expiry work.
- **P back just in time, but the next retry lands on the deadline:** when P returns after the last retry before
  `lastOk + EXPIRE` and the next retry falls exactly on it, the expiry tie-break (expired at exactly that second)
  comes first and the retry reloads the zone in the same second; the caption says both. Task rule 6 ("the next retry
  succeeds") holds for every earlier return. Reachable with V at the run step of `primary-dies`.
- **Timers inside S's card.** The task draws them "under S"; at 1920×1080 the card has room for three two-line timer
  rows, and the log gets a full-width strip below. Bars are progress bars of their own interval (refresh, retry and
  expire differ by 670×, so one shared axis would hide two of them).
- **Captions say P and S** in the lab zone (the cards carry `ns1.lab.example`, `ns2.lab.example`); the estate keeps
  `loom` and `qm-dc02`, which are short and are what the S6 brief's material uses.
- **Records shown:** two A records per zone, no type column (the card says "zapisi A" / "A records"); the type column
  and long names did not fit the card at 1920×1080.
- **Estate client name** `rq.qm.internal` (a colo address in the student-visible zone file). The render farm's real
  lookups are only in the instructor caveat, which the page does not use; product-named hosts in the zone were
  avoided (concepts, not tools).
- **Estate times:** t = 0 is Tue 2026-11-10 17:02, on the 3-hour grid of the listing's last transfer (2026-11-02
  05:02); loom goes off at 20:00 ("in the evening", the task). The expiry is Tue 2026-11-24 17:02, the S6 brief's
  Tuesday. The page shows the transfer date next to the last successful check, so that the expiry visibly counts
  from the check.
- **`authoritative` = mjerodavan** as the task's Terms say; the glossary's *authoritative server* (autoritativni
  poslužitelj, UL) is named once in the explanation, as in `dns-ttl-cache`.

## Deviations from the task

- **Step counts:** `book-edit` 4 (task 4), `no-serial-bump` 3 (4), `primary-dies` 5 (8), `estate-14-days` 5 (8),
  `revived-in-time` 8 (7). They follow from the one step rule above; the task's counts were estimates ("~10 steps").
- **Steps of `revived-in-time`:** the revive at day 5, 00:00 is a step after the retry at the same second (equal-time
  order), and the run ends with a week of refreshes (end-of-run rule).
- **NOTIFY** stays off and is not a toggle (task rule 7 "check whether to add it"): it would be a second mechanism on
  the page, and the task's out-of-scope list names it.
- **Params:** `scene`, `editAt`, `killAt`, `reviveAt` added (hidden), so presets and button-made runs survive a reload,
  a link and the L switch.
- The task's caption is used for the expiry step word for word, with the time and EXPIRE filled in.

## Review

A fresh reviewer read the code against SPEC.md, recomputed the preset table with its own Python model (all five rows
match), ran 45 mutants of `sim.js` (39 killed) and drove the page in both languages. Survivors: three equivalent
(a transfer folded into a run needs an edit in between, which breaks the run anyway; the run loop's action check is
redundant with `moment()`; kill-while-off is unreachable), two that differ only for a scheduled action that does
nothing (URL-only; SPEC now says "an action that took effect"), and `MAX_STEPS` (the test now asserts 20; random
sampling of ~49k param sets never passed 11 steps, so the 20-step limit and its note are a safety net). Fixed from
it: the revive caption when S never noticed P was gone; the end caption offering actions already used; P and S
letters in the estate's end caption; "sad je {exp}" read as the current time (now "rok isteka … sad pada na");
"klijent" the record against "klijent" the client (now "zapis klijent"); the Croatian explanation (a sentence
starting with an English term, nested parentheses, a book title on the page); "Both are an" in English; small
Croatian wording; the client's address and "14 d" wrapping at 1920×1080.

## Sources

- UL ch19 (`~/projects/uvod-u-linux/book/chapters/19-dns.md`), "Vlastiti poslužitelj imena": the zone file and SOA
  values, the SOA field definitions (RFC 1035 §3.3.13 quoted), *primarni / sekundarni poslužitelj*, *prijenos zone*,
  and the SERIAL/REFRESH/RETRY/EXPIRE paragraph ("uspoređuje brojeve, a ne sadržaj"; "koliko dugo sekundarni smije
  odgovarati kad primarnog nema").
- UL ch20 Primjer 3 (the forgotten serial bump: "ispravan zapis na jednom mjestu i stari na svima ostalima, bez
  ijedne poruke o pogrešci").
- RFC 1035 §3.3.13; RFC 1982 §3.2 (serial comparison); RFC 1996 (NOTIFY, out of scope); RFC 5936 (AXFR). Cited from
  the book's quotations and from memory (no network in this session).
- Estate, student-visible: `student/configs/hq/loom/var/lib/bind/db.qm.internal` (SOA values, `loom`, `rq`),
  `student/configs/colo/qm-dc02/dns-zones.txt` (secondary, master, last transfer), `student/scenarios/S6.md` (the
  dates). The instructor's `caveats.md` CV-02 was read for the model only; none of its text is on the page.

## Checks

- Numbers: an independent Python count (retries before expiry 666 / 331, run lengths 166 / 167 / 475, dates of the
  estate run) before the model was written; the model agrees (`sim.test.js`, "presets").
- Page sweep: every step of every preset, and of 112 param combinations (refresh 900/86400 × retry 300/7200 × expire
  7/14 d × both zones × seven action schedules, including revive after expiry and actions at the same second), in both
  languages (1714 states): no console errors, no unfilled placeholder, no page scroll, no stage or card overflow at
  1920×1080.
- `npm run gate -- dns-secondary-expiry`: see the report for the final run; screenshots reviewed at 1920×1080 light,
  dark, grayscale and 375×812 in both languages, plus every preset's key steps.

## Unchecked *(check)*

- That a secondary whose zone has expired takes the whole zone again (rather than comparing serials) when the primary
  answers. Common behaviour; RFC 1035 does not say.
- RFC 1982 and RFC 5936 section numbers are from memory.
- The exact moment loom goes off on 2026-11-10 (the task says "in the evening"; 20:00 chosen) *(derived)*.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| serial (SOA `SERIAL`) | serijski broj | UL ch19, ch20 |
| refresh (`REFRESH`) | osvježavanje | task Terms; UL ch19 ("osvježiti") |
| retry (`RETRY`) | ponovni pokušaj | task Terms; UL ch19 ("ponavljanje neuspjelog osvježavanja") |
| expire (`EXPIRE`) | istek | task Terms |
| authoritative (of a secondary) | mjerodavan | task Terms (URM); the glossary has *authoritative server* = autoritativni poslužitelj (UL) |

Used from the glossary: *primary server*, *secondary server*, *zone transfer*, *authoritative server*, *cache*.

## Shared requests

- **A time-axis kit view**, as `dns-ttl-cache` asked: this page needed timers as bars over three very different
  intervals and a log of moments; it draws progress bars and a list instead of an axis.
- **Kit legend swatches** for a solid, a dashed and a red-outlined bar (`se-refresh`, `se-retry`, `se-expire`) and a
  red hatch (`se-expired`): defined in the page's CSS.
- **`.sd-ctl[hidden] { display: none; }`** in `kit.css` (hidden params still show otherwise; as `dns-ttl-cache`).
- **`t.parts` with the same node in two placeholders** moves the node to the last place, so a caption that names a
  server twice loses the first mention. The page copies every node (`parts()` in `index.html`); the kit could clone
  node values itself.
- **Promotion:** this sim does not use the `dns-records` model (that model answers queries from a zone; this one
  needs only the SOA timers and two records), so nothing was copied. The `dns-split-brain` preset that the task says
  this page will host can reuse `SCENES`, `moment` and `serialGt`.

## Split brain presets (task `dns-split-brain`)

Presets `split-brain` (6 steps) and `split-brain-retire` (5), entry `split-brain`. Rules and numbers: SPEC.md, "Split
brain". Built 2026-11-08.

- **Host support, added here.** The task says to stop and file a shared request if the host cannot express two
  primaries. It could not (one P, one S, one client). Following the precedent of the other preset tasks that extended
  their host with an opt-in mode (`quorum-split-brain` fencing and Windows flows, `lnx-cow-filesystem` win-vss), the
  support is added additively: scenes `split` and `retire` get a state of their own (`split: true`) and their own
  `initial`/`step` branch, render and caption. The one-primary scenes, their state and their 29 tests are unchanged;
  `SCENES` is untouched (the data is `SPLIT`). The host's `serialGt` and `serialInc` are reused, as its notes offered.
- **What the task asked of the host:** (1) two primaries, each with its own copy: yes; (2) a per-client "which server"
  mapping and a per-server non-recursive view with `aa`: yes (groups H and D, the direct table); (3) an edit on one
  server: yes, as a fixed step. No timers between primaries; `retire` uses REFRESH once.
- **Fixed steps, no E/K/V.** "Edit one primary, query both" is the script: the edit is step 3. E, K and V act on the
  one-primary run; in the split mode they are hidden and their keys put a note in the caption. The SOA params are
  hidden too.
- **The examples follow the mode** (as in `quorum-split-brain`): the one-primary page lists its five and "Two
  primaries" (the way in); the split mode lists "Zone edit" (the way back) and its two. Seven in a list did not fit
  the panel at 1920×1080 (958 > 926 px). Keys 1–7 reach all of them.
- **The edit raises P2's serial** to 2026110102; the task gives the start serial 2026110101 only.
- **`split-brain-retire` starts where `split-brain` ends** (P2 edited, both groups have asked), so the fix is shown
  on the broken state; the task marks this preset optional, and it is built because the host's refresh and serial
  rule cover it.
- **Group answers carry `aa`** too: the server a group asks is authoritative for the zone, so its answer to a
  recursive query is authoritative (UL ch19 shows `qr aa rd ra` from the lab server). The direct table is the
  measurement the explanation recommends.
- **Names:** P1/P2, groups H/D as in the task; `ns1`/`ns2.corp.example` on the cards. The kinds "stand-alone" and
  "directory-integrated" name server are said generically (no product names). No estate names; the instructor's
  caveat is not quoted (the task's own caption is used for the direct step).
- **Steps:** the task's first step "show both copies" is the start state; D asks again after the edit (step 5), which
  the expected answers need. Six steps, as the task says.
- **Layout:** two columns (P1 and group H, P2 and group D), a bracket per zone above (one bracket after the switch),
  the direct table below. P1's side is series colour 1, P2's colour 2, always with the P1/P2 label and position. On
  the phone each column stacks and the direct table lists each server's answer under its name.
- **Level:** the host is `intro`; the task gives this preset `advanced`. Entries have no level field, so the entry is
  listed under the host's level *(for the owner: in the thread report; OPEN.md is outside a preset task's scope)*.

Checks: `sim.test.js` adds 10 tests (tie-breaks first); 8 mutants of the split code (aa only on NOERROR, a fixed
resolver map, the newest serial wins, the edit reaching P1, `>=` instead of RFC 1982, a transfer at the switch, a
fixed refresh, one step short) each fail at least one. A browser sweep over every step of both presets in both
languages, light and dark at 1920×1080 and at 375×812: no page scroll, no card overflow, no text under 16 px, no
console errors, no unfilled placeholder, every word from the tables, and the E key's note. Screenshots reviewed
(light, dark, grayscale, phone, both languages).

Term pairs (missing from `kit/glossary.js`; written out in both tables): *non-recursive query* — nerekurzivni upit
(UL ch19 "rekurzivni"; task Terms); *authoritative answer (aa)* — mjerodavan odgovor (task Terms); *split-brain* —
razdvojeni mozak (task Terms). Used from the glossary: *primary server*, *zone transfer*; *zone apex* (vrh zone) is
said in the captions in plain words.

Unchecked *(check)*: RFC 1034 §4.3.2 step 3 and RFC 9499 §6 wording are from memory (no network in this session);
the AA flag in an answer to a recursive query from a server that is also authoritative is from UL ch19's example.

Shared requests: none new. (The kit could hide `type: 'button'` params with `visible`, as it does other params; the
page hides E/K/V by CSS on `aria-keyshortcuts`.)

Time: start 2026-11-08 21:58, gate passing at about 23:25 (about 90 min).

## Time

Start 2026-10-28 16:53, gate passing and status ready at 17:55: about 60 min, of which the fresh review
ran about 20 min in parallel with the page sweep and NOTES.
