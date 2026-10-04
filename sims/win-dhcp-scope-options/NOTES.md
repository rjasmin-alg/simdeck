<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-scope-options — notes

Task `docs/tasks/w2/win-dhcp-scope-options.md` (thread t-0109, 2026-10-04). Explorer on kit view K4 (rule table,
`kit/ruletable.js`, most-specific mode with `at: 'all'`). Rules and numbers: `SPEC.md`.

## Decisions

- **K4 is used, not drawn by hand.** The task's Depends on line still names K4 "once it exists"; it exists (kit
  0.5.0), so the rule table for the chosen option is `Simdeck.ruleTable` in `'specific'` mode, one row per level with
  `rank` 1–5, the implicit row "set at no level that applies" → not sent. The kit sketch (t-0102) said four option
  tables do not fit: the page shows one option at a time in K4 (clicking an option in the effective table picks it; a
  hidden `focus` param keeps it in the URL and in the presets) and all five options in its own compact table.
- **Scene.** Left: DHCP1 as nested boxes (server ⊃ scope ⊃ reservations) with colour, glyph (■ ◆ ●) and name per
  level, the range, exclusion, leases and next free address; the client card under it. Right: "what the client gets"
  (value with its level chip, overridden values struck through under it, what the client still has) and the K4 table.
  The task's "Odakle / Overridden" columns are folded into the value cell to fit the width at 1920×1080.
- **Renewal (rule 6) in an explorer.** An explorer has no history, so what the clients hold is a hidden param `held`:
  a 4-bit mask of the toggles at their last renewal. The Renew button (key `O`) sets it from the current toggles; the
  exclusion bit stays on when the clients' addresses survive the renewal (they keep `.31`/`.32` after the exclusion is
  removed; `.10`/`.11` are replaced once it is added). Renew renews every client, so one mask is enough. Presets set
  `held` to their own toggles except `change-needs-renew`.
- **Addresses.** The laptop leases before the phone (`.31`, `.32`), so `leases` means something and the phone does
  not get the laptop's address. "Next free" shows what a new client would get, so removing the exclusion visibly
  changes the pool while the laptop keeps `.31`.
- **Levels.** Five levels: server, server class, scope, scope class, reservation. Reservation-level class options are
  left out (the state has none; the table would grow a sixth row). A user class is handled like a vendor class (tested)
  though no preset uses one.
- **Option 051** is shown as a scope option holding the scope's lease (8 days); the option names are translated
  ("Usmjernik", "Poslužitelji imena", …) with the code as data.
- **Controls.** Toggle hints were dropped and the `focus` choice hidden so the panel fits at 1920×1080 (the gate's
  "panel fits" check failed at 1132 px > 800 px with them).
- **"Changed"** marks the effective values that changed with the last param change (not a focus change, and not the
  renders while the page loads).
- **Server class level.** The task lists server, scope, class and reservation options; the model adds a server-class
  level (rank 2) beside the scope class (rank 4) so the ladder is complete. No preset sets one.
- **State shape.** `effective[].overridden` is `[{ level, value }]`, not the task's `[level]`, so the page can strike
  through the beaten value too.
- **Leased / next free** show what the clients hold now (since their last renewal), not the result of the next
  renewal; the client card shows the address after renewal with the old one marked.
- MACs of the phone (`02-AB-CD-04-05-06`) and printer (`02-AB-CD-0A-0B-0C`) were chosen here; the laptop's is the
  task's.

## Deviations from the task

- The `client` choice, toggles and presets are as specified; added the hidden `focus` and `held` params (above).
- The task's Croatian caption for the reservation is split in two sentences ("Pisač ima rezervaciju: uvijek
  10.0.10.40." + the general precedence sentence); it uses the Croatian "rezervacija" without the English term, as
  everywhere else on the page.

## Sources

- RFC 2131 §4.4.5 (T1 = 0.5 × lease), §4.3.2 (renewal); RFC 2132 §3.5 (003), §3.8 (006), §3.17 (015), §8.3 (042),
  §9.2 (051), §9.13 (060); RFC 3004 (077).
- `uvod-u-linux` ch18 "Tko dijeli adrese" → "Što se uz adresu još dijeli", "Koliko dodjela traje", "Tri mehanizma".
- `uvod-u-racunalne-mreze` ch14 "Primjer 2" (options 1, 3, 6 together); `sims/dhcp-dora` for the lease and T1
  arithmetic and the Croatian "zakup".
- Microsoft documentation, cited from memory without access in this session (all *(check)* below).

## Unchecked *(check)*

- Windows Server default lease 8 days (Microsoft, "DHCP Server").
- Precedence server < scope < reservation, per option (Microsoft, "DHCP options precedence" / "Configure DHCP
  options").
- A class-based option (vendor/user class) beats the plain option of the same level.
- Windows hands out the lowest free address (the model's choice; the real order is not documented here).
- A reservation inside an exclusion range (not modelled; the presets avoid it).
- On renewal, an address that has since been excluded is refused and the client gets a new one; a still-valid one is
  kept.
- Microsoft's Croatian UI term for *scope* (the page uses *scope* in italics with "opseg adresa" at first mention).

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| scope | *scope* (opseg adresa) |
| exclusion range | raspon isključenja |
| reservation | rezervacija (UL ch18: ručna dodjela) |
| option | opcija |
| server options / scope options | opcije poslužitelja / opcije *scope*-a |
| vendor class | klasa proizvođača |
| lease | zakup (URM, `dhcp-dora`) |
| renew the lease | obnoviti zakup |

## Shared requests

- **kit.css:** `.sd-ctl { display: flex }` beats the `hidden` attribute that a param's `visible()` sets, so hidden
  params stay visible. Worked around in the page CSS (`.sd-ctl[hidden] { display: none; }`), like `amdahl` and
  `multicore-mesi`. Smallest fix: add `.sd-ctl[hidden] { display: none; }` to kit.css.
- **K4:** none; `at: 'all'`, `rank`, `miss`, `note` and `stickyMark` covered everything.

## Tags

Topic `windows-admin`, tag `dhcp` (both in `tags.json`).

## Time

Start to done in one session on 2026-10-04: about 2 h (reading 20 min, spec and model 25 min, page and layout fits
40 min, tests and notes 20 min, fresh review and its fixes 15 min).

## Review

A fresh reviewer read the diff against SPEC.md and ran 37 mutations of sim.js. Fixed from it: the explanation listed
the lease as a multi-level option; *scope* now carries "(opseg adresa)" on the stage and the Croatian labels use
"opseg"; Leased / next free showed the pool after renewal while the clients still held their old addresses; the
class caption claimed an override where there was none; singular "old value"; Croatian word order. Seven mutants had
survived; the four that were not equivalent now have tests.
