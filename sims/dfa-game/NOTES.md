<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dfa-game: notes

Adopted from `single-page-labs/dfa-classroom-game.html` (task `docs/tasks/w1/dfa-game.md`, catalogue `spl-dfa-game`)
into the simdeck kit. The as-is copy is the first commit of the thread; single-page-labs is not a git repository, so
there is no source commit to cite (sha256 of the copy starts `af0a657e30cc`).

## Decisions

- **Class `tool`** (catalogue: "import as `tool`"; playbook §10.4): a lecturer's classroom game, never on course pages.
  No steps, no presets, no kit params; the transport is the kit's reset button, as on `student-picker`.
- **The model** (`sim.js`, DOM-free, `window.SimLogic`) keeps the original's rules: the four task types and their
  oracle; `runDfa` (no start state, a symbol outside the automaton's alphabet, or a missing transition rejects);
  the test words (target and neighbours, the fixed banana words, every word up to `min(4, max(2, |target|))`, only over
  the game alphabet, at most 240); one move per player per round; a round closes at `max(expected, joined)` moves;
  moves applied in submission order; the counterexample is the first failing test word; new states on the original's
  ellipse; auto layout; the 900 × 640 drawing space.
- **Tie-breaks** (each has a test): clashing moves in one round, the later submission wins (two transitions on the same
  state and symbol leave the second; two toggles cancel); a move that fails is logged and skipped, the rest of the round
  applies; the counterexample is the first failing word in test order; test words keep their first occurrence.
- **Log as events**: the model returns `{ key, vars }` events instead of Croatian log lines; the page stamps the time
  and words them, so each tab reads the shared log in its own language.
- **Sync stays tab-to-tab** in one browser over a broadcast channel, with the original's messages (`STATE`,
  `JOIN_PLAYER`, `ACTION`, `REQUEST_STATE`, `HELLO`). It is not a network load, and it works from `file://` (checked
  with three tabs in Chromium). Several devices would need a server, which a static simdeck page cannot have; see
  the report (the owner decides, like `quick-poll` in `docs/tasks/OPEN.md`). The explanation says how to play on one
  computer: one expected player, and the presenter types the moves the class proposes.
- **Session in `sessionStorage`** (`simdeck.dfa-game`: id, name, role, room, game), so the language switch (a reload)
  keeps the role and the game; the tab then rejoins its room (presenter re-sends the game, player asks for it).

## Deviations from the original

- **Defect fixed: every tab had the same id.** The original kept the client id in `localStorage`, which all tabs of a
  browser share, so the second tab took the first tab's id and every tab ignored the others' messages
  (`msg.from === client.id`). That is why "multi-device sync unverified" never worked even across tabs. The id is now
  per tab (`sessionStorage`).
- **Presenter code dropped.** It was sent to every player inside the public game state and only guarded a restart from
  the same tab, so it protected nothing.
- `alert()` messages are now caption messages; the presenter-only buttons and the submit button use `aria-disabled`
  and say why in the caption. Clearing the automaton keeps its `confirm()`.
- The move fields are rebuilt only when the action or the automaton's states and symbols change (the original rebuilt
  them on every message, which wiped a state name being typed).
- The tests panel shows a fresh check without storing it (the original stored it on first render, so the status card
  read FAIL before anyone validated).
- The state pills were dropped (the diagram shows the states); the alphabet pills moved to the task bar.
- State names are cut at 12 characters and the target at 12 in the input fields (the original had no limit; long
  names break the diagram on a projector).
- The diagram is drawn 1:1 in CSS pixels (positions scaled from 900 × 640) so its text is never scaled below 16 px;
  start, state and accepting state are told apart by the arrow, the ring and the double ring, not colour alone.
- Wording: the Croatian keeps the original's; "Counterexample", "Auto layout", "Export", "Import" and PASS/FAIL became
  Croatian words (Protuprimjer, Automatski raspored, Izvezi, Uvezi, PROLAZI/NE PROLAZI). The explanation ("Ideja") is new.
- The model guards a move before the game starts (`notStarted`); the original only checked in the sending tab.

## Sources

- `/home/rjasmin/projects/single-page-labs/dfa-classroom-game.html` (own, no dependencies, no network loads).

## Term pairs

| en | hr |
|---|---|
| deterministic finite automaton (DFA) | deterministički konačni automat |
| accepting state | prihvatljivo stanje |

Both are also listed by `sims/automata/NOTES.md`; written out in `strings.js`. *counterexample* (protuprimjer) is in
the glossary and used as `[[counterexample]]`.

## Shared requests

None.

## Checks

- `npm run gate -- dfa-game` passes (it sees the not-connected state). A full game, one presenter and two player
  tabs over seven rounds to a passing automaton plus one failing round, was played by script in both languages:
  sync, round closing, a refused empty symbol, counterexample highlight, the `L` switch keeping role and game, no
  console errors, no page or panel scroll at 1920×1080, no sideways scroll at 375×812. Screenshots in light, dark,
  grayscale and phone were reviewed (thread library, `game/`).
- Every model rule was broken once and a test failed each time (30 mutations: submission order, the round threshold
  and its `max`, one move per player, not started, presenter not listed, first counterexample, failing move skipped,
  test dedupe, the 240 cap, the enumeration length, the ends and even oracles, missing transition, alphabet check,
  one-character symbols, empty state, toggle, removal of incoming transitions and of the start mark, target symbols
  joining the alphabet, the even-task target, the player cap, players kept on restart, alphabet kept on clear, the drag
  clamp, log order and cap, the import's accept filter, rename on rejoin).
- *(check)* Several physical devices: not possible with a broadcast channel; not checked.
- Dragging a state with the mouse was checked by script: the presenter's new position reaches the player tab.

## Time

2026-10-03, 08:59 → 09:20 CEST, about 20 minutes (wall clock).
