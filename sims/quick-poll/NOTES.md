<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# quick-poll: notes

Task `docs/tasks/w3/quick-poll.md`, catalogue `tool-quick-poll` (§4.11). A new native sim of class `tool`
(lecturer-only). Rules and numbers: `SPEC.md`.

## The blocker, and what was built anyway

The task and `docs/tasks/OPEN.md` say how votes reach the page is the owner's decision: (a) a shared-state capability
of the hosting, (b) a small local server on the lecture-room computer, (c) counts typed in after a show of hands. Its
default is "only the model and layouts can be built", and that is what this is:

- the pure model (`sim.js`), the same for (a), (b) and (c): a transport hands in ballots `{ pollId, voter, option, at }`
  and calls `vote`; the lecturer's buttons call `close`, `open`, `reveal`, `reset`;
- the projector layout and the phone layout, side by side (view *both*) or alone;
- a **demo mode**, so the page is usable today as a demonstration of the mechanism: the phone mock-up on the stage
  votes with this browser's voter id, and **Probni razred: +5 odgovora** (`D`) adds five seeded answers. The
  projector says "Pokazni način" under the join code, and the Ideja text says plainly that a static page cannot
  receive answers from other devices yet.

**Published as a demo** (owner, 2026-11-09): `status` is `"ready"` and the page sits in `lecturer › classroom › poll`.
It says on the projector ("Pokazni način") and in the Ideja text that a static page cannot receive answers from other
devices yet. The builder had held it at `"wip"` because a published "Brza anketa" that phones cannot reach promises
more than it does; the owner chose to publish the demo anyway. A follow-up task that adds a transport should not need
to change the model.

## Decisions

- **Kit params hold the settings, the page holds the poll** (as in `countdown`): `kind` (A–D / yes-no / confidence)
  and `view`. Every render reconciles the poll with the params: another kind is a new poll (the letters change).
  R (reset settings) does **not** wipe the votes.
- **The correct answer is not a kit param** (found by the review): the kit shows params in the open panel and writes
  them into the URL (`?correct=B`), so the room would read it before reveal. It is a select in the collapsed panel
  section "Točan odgovor i tekst pitanja", kept in the poll (sessionStorage), never in the URL; its options are the
  poll's letters (A–B for yes/no), and it is disabled for `confidence` with the reason "Samoprocjena nema točnog
  odgovora." Presets therefore never carry a correct answer (they would be answer keys anyway).
- **Reveal also closes**: revealing an open poll closes it (no votes after the split is seen); a revealed poll cannot be
  reopened, only replaced with **Novo pitanje** (`N`). A closed poll can be reopened (`O`) for latecomers.
- **Space** = the next of close → reveal (a page key; the kit gives Space only to steppers). `O` close / reopen, `V`
  reveal, `N` new question, `D` practice class. A focused control keeps its own Space (as in `countdown`).
- **Ballot instead of `vote(state, voterId, option)`** *(deviation)*: the ballot carries `pollId`, so a phone still on
  the previous question is refused as `stale`; `at` is the transport's arrival number, stored, never read.
- **Rejected ballot codes in a fixed order** (SPEC rule 6), so the phone's message is predictable when several apply.
- **Percentages: ties stay ties** (SPEC rule 5). The task asked for two things that conflict: "ties shown as ties" and
  "rounded so they sum to 100 (largest remainder)". Plain largest remainder shows 1, 1, 1 as 34, 33, 33, a tie shown
  as a lead. Here equal counts form a group that gets the leftover points together or not at all; the sum is then
  99 (or 98) and a note under the bars says why. Checked numbers in SPEC.md.
- **Bar length = percentage of all answers** (not of the largest bar), so bars of a poll add up to the whole.
- **The most chosen bar(s) get ▲** (all of a tie), the correct one ✓ on the letter and a thick outline round the row;
  both only after reveal. Before reveal every bar is the same hatched track and the number is "?": nothing about the
  split (lengths, ▲, ✓, aria-labels) is in the page.
- **Number format**: "62 % (13)": the percentage first (what the room reads), the count beside it.
- **Voter id**: 16 hex characters from `crypto.getRandomValues`, kept in `localStorage`
  (`simdeck.quick-poll.voter`), so it is "random per browser" (rule 4); the model refuses anything that is not
  8–32 lower-case letters and digits, so a name cannot be a voter id. The practice class uses ids `sim<poll>v<n>`.
- **Join code**: four characters without look-alikes (no 0/O, 1/I/L), from a number drawn once per browser session
  (`crypto`), kept in `sessionStorage` with the poll. No QR code: it would need a vendored encoder and there is no
  address to encode until the transport exists.
- **Practice class**: five new voters per press; each vote from `Simdeck.rng(pollId · 100003 + n)` over weights per
  kind (A–D 2:5:2:1, yes/no 3:2, confidence 2:4:3:1), so a demo looks like a class and repeats exactly. Refused when
  the poll is not open (the caption says so).
- **Lecturer text**: the kit has no text param, so the panel has a collapsed "Tekst pitanja i odgovora" with the
  question and the option fields (page-owned inputs). Empty question: the projector says "Pitanje je na slajdu."
  (preset `abcd-blank`). Empty option: the letter alone (A–D), Da/Ne (yes/no), or the confidence scale. Typed text is
  shown with `translate="no"` (it is the lecturer's language, not the page's). Enter or Esc leaves the field so the
  clicker keys work again.
- **sessionStorage** (`simdeck.quick-poll`) keeps the poll across the language switch (which reloads); a poll saved
  more than 3 hours ago is dropped. Nothing is stored after the tab closes (out of scope: storing results).
- **Phone messages**: recorded / changed / already recorded / closed, not recorded / previous question / not in this
  poll; after close the phone says "Glasanje je zatvoreno. Tvoj odgovor: B." when it had voted.
- **Narrow screens**: the stage grows with its content (`container-type: inline-size`, height auto) and stacks the
  projector above the phone; the three poll buttons take the sticky bar's row.
- **Confidence labels** (hr): Sigurno znam / Mislim da znam / Ne znam sigurno / Pogađam: gender-neutral first person.

## Deviations from the task

- `vote` takes a ballot object (above).
- Percentages may sum to 99 or 98 when a tie cannot share the leftover points (above); the task's two wishes conflict.
- The correct answer is a page control, not a param, so it is not in presets or `?` links (rule 3).
- No QR code (join code only).
- A demo mode (phone mock-up and practice class) the task did not ask for, so the page shows the mechanism without a
  transport.

## Sources

- Task file and catalogue §4.11 only; no course material (the task says none is needed).

## Term pairs

None used as glossary terms. The task's pairs (poll — anketa, vote — glas/odgovor, reveal — otkriti rezultate,
join code — kod za pristup) appear as plain Croatian words; *kod za pristup* *(check)* is the task's own suggestion.

## Shared requests

- **A `text` param in the kit** (as `endianness` asked): the question and option fields are page-owned inputs here.
- **The kit's `.sd-ctl[hidden]`**: a param whose `visible()` is false keeps `display: flex` from `.sd-ctl`, so it stays
  on screen (seen here in a first draft with two correct-answer params). One line in `kit.css`
  (`.sd-ctl[hidden] { display: none; }`) would fix it for every sim that uses `visible`.
- **A per-param "not in the URL" flag** would have let the correct answer stay a kit param (rule 3).

## Checks

- `npm run gate -- quick-poll`: pass (46 browser checks); gate screenshots of both languages at 1920×1080 light, dark,
  grayscale and 375×812 looked at.
- Extra screenshots of states the gate does not reach (votes, reveal with a correct answer, a 7/7/7/2 tie summing to
  99, yes/no closed with a refused phone vote, the phone view, 375×812 revealed), both languages, light and dark:
  looked at; no console errors, no sideways scroll.
- **Fresh review** (a separate agent, against `SPEC.md`): brute-forced `percents` for every count 0–25 on A–D (floor or
  floor + 1, ties equal, distinct counts sum to 100, monotone): no violation. It found the correct answer visible in
  the panel and URL before reveal (fixed, above), `cut` splitting an emoji (fixed: code points) and SPEC's wording on
  practice-class ids (fixed). Its surviving mutants now fail tests: `reveal` only from open, `sanitize` dropping
  `revealed`, `vote` storing a missing `at`, `reset` not cutting, `setKind` dropping the question, `!=` on `pollId`,
  `own()` replaced by a plain lookup (`constructor`), `create` accepting `pollId` 0, `joinCode` without `floor`.
  Left as equivalent: the `rem > 0` filter, the join code's wrap, `o !== 'total'`. Removed the unused `accepted()`.
- *(check)* Not checked on a real phone or projector; the transport does not exist.

## Time

2026-11-09, 02:53 → 03:13, about 20 minutes (wall clock), including the fresh review and its fixes.
