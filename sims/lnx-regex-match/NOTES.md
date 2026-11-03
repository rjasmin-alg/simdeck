<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-regex-match: notes

Task `docs/tasks/w3/lnx-regex-match.md` (wave 3, Linux, stepper, M, P2, UL and AUT). Rules, numbers and sources:
`SPEC.md`.

## Decisions

- **Two models, one walk.** The stepper walks a backtracking matcher (the `grep -P` model, as the task's coordinator
  note says); the POSIX leftmost-longest result is computed separately by a set-of-end-positions matcher that never
  backtracks, and appears in the result box when the walk is done. The result row of the chosen form's tool is marked
  "this form" (BRE, ERE → POSIX; PCRE → backtracking). A note beside the pattern says which model the walk is. The
  form switch changes parsing (BRE vs ERE/PCRE) and which row is the tool's; ERE and PCRE parse the same for this subset.
- **Granularity of a step** (SPEC.md table): a token test, one more repetition, entering an alternation, a step
  back, a new start and the verdict are each one step. A greedy quantifier's "one more" that misses at once ends the
  repetition in the same step (the choice point it would leave is used immediately) instead of a test step plus a
  back step. With this rule four of the task's six step counts come out exactly (6, 8, 10, 20).
- **`tries`** counts token tests (characters and anchors, hits and misses). The explosion preset gives 367, "into
  hundreds" as the task asks.
- **Cap at 20 steps.** A longer walk shows its first 19 actions and jumps to the end at step 20; the caption says how
  many steps were skipped and the total tries (the task's "the page jumps after 20 steps and shows the count"). This
  applies to typed patterns too, and to `book-ro-t` switched to BRE (70 actions).
- **Give-up limit.** The matcher stops after 100 000 tries (`(a+)+b` on 24 a's in PCRE): "gave up", exit status 2.
  GNU grep -P does stop with "exceeded PCRE's backtracking limit", exit 2, on `^(a+)+$` against a long run of a's
  (checked); on `(a+)+b` it answers 1 at once because PCRE2 notices `b` never occurs. The caption says so: "unless a
  shortcut spares it the walk". The POSIX row still answers.
- **Typed pattern and line on the stage**, as in `sql-injection`/`hash-properties` (the kit has no text param). They
  are model params set with `sim.set` and kept in the URL by the page (`?pattern=&text=`, only when they differ from
  the preset or defaults); the kit's URL writer leaves foreign keys alone, so links, reload and the language switch
  keep them. Typing resets to step 0. Enter/Escape leaves the field so the clicker steps again.
- **Captions** come from `captionOf` in the model (tested). The task's greedy caption is used word for word as
  `cBackMoreEnd`, chosen when the failing token met the end of the line and the repetition giving back had taken the
  last character. At a match with untried choice points the caption says how many were never tried, and adds the
  POSIX span when it differs.
- **Marks** (never colour alone): the token and cell being tried have a thick frame; a hit ✓, a miss ✕ with a dashed
  red frame; consumed characters filled (series colour 1); a choice point is a bookmark shape; a step back shows ↶ on
  the token and the popped entry, dashed, "(taken)", at the top of the stack; anchor tests carry ⚓; the backtracking
  match is a solid bar under the cells, the POSIX match a dashed bar; "no match" ✕. BRE's ordinary `+ ? | ( )`
  tokens are dashed and labelled "ordinary here".
- **Concepts, not tools.** `grep`, `grep -E` and `grep -P` are the subject of UL ch06 (the book's commands), so they
  are named; no other tool is.
- **`related`** is left out: `spl-automata` and `aut-regex-to-nfa` (the catalogue's pairs) do not exist yet and the
  check rejects unknown ids. Add them when they land.

## Deviations from the task

- **`book-ro-t`: 5 tries, not 4.** `o+` tries a third `o` against `t` and misses before `t` is tested (r, o, o, o✗, t).
  Steps: 6, as the task says.
- **`leftmost-longest`: 3 steps, not 6.** Enter `a|ab`, `a`✓, match. The backtracking matcher stops at its first
  match; the point of the preset (POSIX says `ab`) is in the result box and the caption.
- **`anchor-scan`: 15 steps, not 12.** Seven starts (0–6, including the empty end), a test at each, `$`✗ once, six
  restarts, the verdict.
- **Line ≤ 32 characters, not 24.** The book's lines (`root:x:0:0:root:/root:/bin/bash`, 31;
  `bin:x:1:1:bin:/bin:/sbin/nologin`, 32) are the presets; 33 cells fit at 1920×1080 and wrap on a phone.
- **State fields** beyond the task's list: `act` (the action record), `jumped`, `limit`, `error`, `exit`, `pushed`,
  `popped` (for the stage); `ti` is a token index, `-1` at the verdict.
- **Character classes**: seven `[:class:]` names are accepted inside brackets (the task: "beyond one example" out of
  scope); no preset uses them.

## Cross-check

`grep` in this machine's agent shell is a ugrep wrapper; the checks used `/usr/bin/grep` (GNU grep 3.11) directly.
Result (2026-11-03): ERE/PCRE 3000 patterns, 0 mismatches; BRE 1500 patterns, 0 mismatches. The 13 pinned cases in
`sim.test.js` (`REAL`) were also run by hand with `/usr/bin/grep -bo`. Mutation run: 13 deliberate breaks of rules
1–8 and the step cap (stack as a queue, fewer repetitions first, right branch first, `[^…]` not negated, BRE `+` as an
operator, ERE parsing for BRE, no restarts, `^` at any start, `$` anywhere, giving back all repetitions at once, no
empty-iteration guard, POSIX shortest, no jump count): each makes at least one test fail.

```js
// Cross-check the model against GNU grep (-G, -E, -P: -bo gives the first match's offset and text) and JS RegExp.
const L = require(process.argv[2]);
const { execFileSync } = require('child_process');
let seed = 12345; const r = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const atoms = ['a', 'b', 'c', '.', '[ab]', '[^a]', 'ab', 'a|b', '(a|ab)', '(ab|a)', '(a|b)', '(a*)', '(a+|b)', 'x'];
function pat() { let s = r(3) === 0 ? '^' : ''; const n = 1 + r(3); for (let i = 0; i < n; i++) { let a = atoms[r(atoms.length)]; if (a.includes('|') && !a.startsWith('(')) a = '(' + a + ')'; s += a; const q = r(5); if (q === 1) s += '*'; else if (q === 2) s += '+'; else if (q === 3) s += '?'; } if (r(4) === 0) s += '$'; if (r(6) === 0) s += '|' + atoms[r(3)]; return s; }
function txt() { const n = r(7); let s = ''; for (let i = 0; i < n; i++) s += 'abcx'[r(4)]; return s; }
function grep(flag, p, t) {
  try { const out = execFileSync('/usr/bin/grep', [flag, '-bo', '--', p], { input: t + '\n' }).toString(); const line = out.split('\n')[0]; if (!line) return 'empty'; const k = line.indexOf(':'); const from = +line.slice(0, k); return { from, to: from + line.length - k - 1 }; }
  catch (e) { if (e.status === 1) { // -o prints nothing for an empty match; check the line matches at all
      try { execFileSync('/usr/bin/grep', [flag, '-q', '--', p], { input: t + '\n' }); return 'empty'; } catch (e2) { return null; } }
    return 'err'; }
}
let n = 0, bad = 0;
for (let k = 0; k < 3000; k++) {
  const p = pat(), t = txt();
  const pr = L.parse(p, 'ERE'); if (!pr.ok) continue;
  n++;
  const posix = L.posixMatch(p, t, 'ERE');
  const bt = L.run(p, t, 'ERE').match;
  const g = grep('-E', p, t);
  const js = (() => { const m = new RegExp(p).exec(t); return m ? { from: m.index, to: m.index + m[0].length } : null; })();
  const gp = grep('-P', p, t);
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const gOk = g === 'empty' ? (posix && posix.from === posix.to) : eq(g, posix);
  const gpOk = gp === 'empty' ? (bt && bt.from === bt.to) : eq(gp, bt);
  if (!gOk || !eq(js, bt) || !gpOk) { bad++; if (bad < 15) console.log('MISMATCH', JSON.stringify(p), JSON.stringify(t), 'posix', posix, 'grep-E', g, 'bt', bt, 'js', js, 'grep-P', gp); }
}
// BRE: the same random patterns read as basic
let nb = 0, badb = 0;
for (let k = 0; k < 1500; k++) {
  const p = pat().replace(/\|/g, '+'), t = txt() + '+()';
  const pr = L.parse(p, 'BRE'); if (!pr.ok) continue;
  nb++;
  const posix = L.posixMatch(p, t, 'BRE');
  const g = grep('-G', p, t);
  const gOk = g === 'empty' ? (posix && posix.from === posix.to) : JSON.stringify(g) === JSON.stringify(posix);
  if (!gOk) { badb++; if (badb < 10) console.log('BRE MISMATCH', JSON.stringify(p), JSON.stringify(t), posix, g); }
}
console.log('ERE/PCRE checked', n, 'mismatches', bad, '| BRE checked', nb, 'mismatches', badb);
```

Run: `node xcheck.js "$PWD/sims/lnx-regex-match/sim.js"` (from the repo root).

## Refused patterns

GNU grep 3.11, exit status for `echo a | grep <form> -- <pattern>`: 2 for ERE `(a`, `[ab`, `[z-a]`, `[[:foo:]]`,
`a\`, `[[:alpha:]-z]`; BRE `\(a`, `[ab`, `a\`, `[z-a]`; PCRE `(a`, `a)`, `[ab`, `*a`, `a**`, `[z-a]`, `a\`. 0 or 1
(accepted) for ERE `a)`, `)`, `*a`, `a**`, `a|`, `()`, `a{2}`, `a{`, `\d`, `^*`, `[[.a.]]`. The model marks each
refusal `invalid` (grep exit 2) or not (not covered here, no exit status shown); `sim.test.js` pins the split.

## Review

A fresh reviewer (subagent, read-only) read the diff against SPEC.md, fuzzed about 9000 patterns in all three forms
against `/usr/bin/grep` (no disagreement on valid patterns) and 20 000 walks (cap, JSON, captions), and reported
defects, all fixed:
- the typed fields went stale when a preset or Reset was clicked while a field had focus (render now compares the
  field with the params, not with focus);
- `?step=` of a typed walk was clamped to the default walk's 6 steps on reload, link and language switch (the page
  applies it again after the typed params);
- PCRE `\` inside brackets was read as an ordinary character (now refused as not covered);
- exit status 2 was shown for patterns grep accepts (now the split above);
- `[[.a.]]`, `[[=a=]]` were parsed silently, `[[:alpha:]-z]` accepted (now refused);
- minor: a lone `)` in ERE reported "empty alternative"; "stops after repetition 0"; "the left side failed" for a
  middle branch; the exit field at the give-up limit now hedges like the caption.
Not fixed, noted: text is handled per UTF-16 unit and `[[:upper:]]` is ASCII only (grep in a UTF-8 locale matches `É`).

## Term pairs (missing from `kit/glossary.js`)

Used, written out in both tables (italic English with the Croatian in parentheses at the first mention in the
Croatian explanation):

- backtracking — vraćanje unatrag *(check)*
- greedy quantifier — pohlepni kvantifikator *(check)*
- anchor — sidro *(check)*
- alternation — alternacija (UL ch06 uses "alternacija iz norme")
- choice point — točka izbora (from the task's caption)
- pattern — uzorak (UL ch06)

Present and used: regular expression, basic regular expression, extended regular expression, exit status.

## Shared requests

- None for the kit. (A `text` param type in `Simdeck.mount` would replace the page's own URL handling for typed
  fields here and in `sql-injection` and `hash-properties`; not needed.)

## Unchecked *(check)*

- The Croatian terms marked *(check)* above.
- "matcher" is left in English in the Croatian text, as in the task's Croatian caption.

## Time

Started 22:24, done 22:52 on 2026-11-03: about 30 minutes in one session (model and cross-check 10 min, page 10 min, review and fixes 10 min).
