<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# asymmetric-path: notes

New stepper (task `docs/tasks/w3/asymmetric-path.md`, catalogue `net-asymmetric-path`). Rules, numbers and sources
are in `SPEC.md`; this file holds the decisions around them.

## Decisions

- **Both exits carry a stateful edge device, each with its own table** (deviation from the task's "exit 2 a plain
  second path"). The task's own model needs it: "exit 2 has no entry" (`asymmetric-drop`), "make both exits share
  connection state" (rule 6) and "with `stateful` off even the asymmetric reply passes" all presuppose a device on
  exit 2 that looks the reply up. With exit 2 as a bare router, nothing on the reply's path would check it, and the
  reply would arrive. The book's text supports the reading: "uređaj koji pamti stanje veze vidi promet samo u jednom
  smjeru na jednom od ta dva izlaza" (exit 1's device sees only the request, exit 2's only the reply). The book's
  figure draws one device and says exit 2 is "drugi put"; its NAT explanation ("taj se odgovor ne može prevesti
  natrag") would make a plain exit 2 coherent, but only by drawing address translation, which the task puts out of
  scope (`nat`). Recorded as an open question for the owner below.
- **`stateful` applies to both exits** ("Izlazi pamte stanje veze"), for the same reason: switching off only exit 1
  would leave exit 2 dropping the reply.
- **No address translation is drawn.** The user is 192.0.2.10 (TEST-NET-1, standing for the organization's own
  block), so the request and reply carry the same addresses on either exit and the lesson stays on the state.
  The devices are still called "NAT/firewall" in the title (the book's and catalogue's name); the explanation says NAT
  behaves the same way because its table is also built from the outbound half.
- **6 steps for every preset**, not 5/6/6/6: one step per packet move (user → exit 1, exit 1 → internet, internet →
  server, server → internet, internet → exit k with the lookup, exit k → user). One count keeps `sim.json` `steps`
  true for every preset, and the delivery to the user, or the silence, is its own step: the moment the connection
  works or dies. In the drop case step 6 has no packet; the user's card says "nothing arrives" and the user's capture
  gets "reply: nothing".
- **Presets: the task's four plus two.** `symmetric-ok`, `asymmetric-drop`, `two-captures`, `make-symmetric` as the
  task names them; `make-symmetric` keeps the internet's choice at exit 2 and sets `fix: symmetric`, so it differs from
  `symmetric-ok` (the organization overrides the way back). Added `share-state` (rule 6's second fix, which the task
  lists under `make-symmetric` as "or share state") and `no-state` (the task's `stateful` param note: the device, not
  the path, drops it). Six presets, keys 1–6.
- **Params:** `returnPath` (exit 1 / exit 2, default exit 2), `stateful` (default on), `fix` (none / symmetric path /
  shared state), `captures` (view only: shows the two captures and their joint verdict; the model records captures
  always). The task's `scenario` param is the preset itself.
- **Captures (rule 5):** two boxes above the topology with the events and their step numbers; after a drop each gets a
  muted "alone:" line (the user's: "did the server reply at all?", the server's: "all is well"), and a line under the
  wire box gives the verdict of both together. `diagnose()` in the model computes it and is tested; a capture alone is
  always `inconclusive`.
- **The branch/HQ wording of Primjer 6** became "capture at the user" / "capture at the server", to match the one scene
  (the figure's organization and internet server). The task's English caption is used with that change at step 6 of
  `two-captures`; the task's Croatian caption is used at step 5 of the drop, with "a Izlaz 2 nema zapis" added (see
  the first decision).
- **Simplified:** a state row is written by the request; the model keeps the task's `state: 'ESTABLISHED'`, but the
  page shows "zapisana / recorded", because before the reply nothing is established yet (reviewer's point). No TCP
  flags, timeouts or half-open states.
- **Model reuse:** `models/` has no firewall model yet, so `lookupState` is copied from `sims/stateful-firewall/sim.js
  @ cdb4072` (comment in `sim.js`); `insertState`, `inspect` and `diagnose` are new, pure and promotable.
- **Kit view K2** draws the scene: 12 columns (user over two, gap, exits over three, gap, internet over two, gap, server
  over two), exits in rows 0 and 2, the rest in row 1. Each exit's state table is inside its card (`extra`); the
  hosts' addresses are a full-width line under the name (`extra`) so they do not wrap. The reply arrow is dashed
  (`cast: 'broadcast'` is only the kit's way to dash an arrow; it is one packet to one receiver). The drop is the kit's
  red cross at exit 2 plus a filled badge "no entry: drops it" and a dashed "dropped at exit 2" in the wire box.
- **Colour is not the only carrier:** request solid, reply dashed (chip and wire box outline too); the acting node has
  a thick border; new table rows are highlighted with the kit's changed mark, the matching row has a thick ink frame
  and the word "matches"; drop = cross + words. Checked in grayscale.
- **Terms:** no glossary terms used (none of the pairs is in `kit/glossary.js`); English terms are written in italics
  with the Croatian in parentheses at first mention in the Croatian explanation, and `*hot-potato routing*` in the
  step-4 caption is rendered as `<em lang="en">`.

## Sources

- URM ch. 15, "Paket je otišao, ali se ništa nije vratilo: asimetričan put, NAT i vatrozid" (Što treba znati, Šire o
  temi, digression on hot potato), Primjer 6; figure `ch15-asimetrican-put-nat-vatrozid.svg` (not copied; drawn with
  K2).
- RFC 3022 (traditional NAT: sessions outbound only), RFC 3704 §2.2 (as quoted in the book's footnote).
- `sims/stateful-firewall/` (state lookup, addresses 198.51.100.10:443 and client port 51000).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| asymmetric routing / path | asimetrično usmjeravanje / asimetričan put |
| stateful firewall | vatrozid sa stanjem |
| connection state | stanje veze |
| state table | tablica stanja |
| hot-potato routing | usmjeravanje „vrući krumpir” |
| packet capture | snimka prometa |
| exit (to the internet) | izlaz (prema internetu) |
| established connection | uspostavljena veza |

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"`.
- **models/:** promote `lookupState` (with `stateful-firewall`'s `judge`) as a shared state-table model; this sim
  would then use `lookupState` from there and keep `insertState`/`inspect`/`diagnose` (or promote them too).
- **Kit K2 (nice to have):** a `dashed: true` packet option separate from `cast: 'broadcast'`, for replies.

## Open for the owner

- Exit 2 as a second stateful device (this build) or a plain path with address translation on exit 1 (the book's
  figure; needs NAT drawn). See the first decision.

## Review

A fresh reviewer (a separate agent with no context but the repo) read the diff against `SPEC.md` and the book, and
broke the model 17 ways. It found no model bug; 11 mutations passed the tests (step-local `lookup`/`inserted` not reset,
the step-2 lookup, `insertState` changing its input, a lookup reading only the first row, `initial` ignoring the fix,
delivery drawn from the wrong exit, `reply.delivered`, capture step numbers, shared state only for exit 2, an early
verdict). Tests were added for each and all 11 now fail. The preset test now reads the presets from `index.html`.
Wording fixes from the review: the Croatian locative ("odbačen na Izlazu 2"); the Croatian concept no longer reads as
"crashes the device"; "the path alone is enough" vs "the path was not the problem" reconciled (the path breaks the
connection only together with a device that keeps state); no hot-potato wording when the reply comes back the same
way; capture lines say "korak n:" instead of an ordinal; English "asymmetry is common" as the book says.

## Checks not done here

- A real projector and a lecturer with a clicker.
- The exact fix mechanisms (policy routing, announcing addresses through one exit, state synchronisation) are not
  named on the page and not checked against a source *(check)*.

## Time

Start 2026-11-08 15:33, done 15:53 (about 20 minutes by the clock, one session, including the fresh review).
