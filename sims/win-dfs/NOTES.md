<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dfs: notes

New stepper (task `docs/tasks/w3/win-dfs.md`, catalogue §4.5.7). Rules and expected numbers: `SPEC.md`. Drawn with
kit view K1 (`kit/sequence.js`), as `dns-resolution` is.

## Decisions

- **Two parts, one param.** The task's four presets are two halves (namespace referrals; replication conflicts), so
  a `part` choice (resets) picks the half; the params of the other half are hidden (`visible`). The task's own note
  says the entry is two concepts and suggests moving the conflict half to `multimaster-conflict`; I built both halves
  as the task file asks and left that call to the coordinator (OPEN.md was not touched: it is outside the sim's
  folder; the report raises it).
- **Lanes:** Ana's client, FS-ZG, DC-ZG | DC-ST, FS-ST, Marko's client. Split mirrors Zagreb, so the middle of the
  chart is the WAN: replication and a failover to the other site visibly cross it. (The first layout, DC beside the
  client, put the two file servers side by side and the replication chip and receiver word overlapped on the short
  arrow.) Lane colour is the site (series 1 Zagreb, 2 Split); clients are square marks; every lane also says its role
  and site in words, so colour is never the only carrier.
- **Under the chart:** part 1 shows each client's referral cache (path, numbered targets, own-site target in a double
  ring, a "connected" badge, TTL left with a bar); part 2 shows each server's current `plan.xlsx` card (writer, save
  time, "saved over …"), a "waiting to replicate" badge, its `ConflictAndDeleted` bin with hatched cards, and the WAN
  card between them (up/down, window interval, next window).
- **Failover preset follows the documentation, not the task's wording.** The task says the Split client stays on FS-ZG
  "until the cache expires". The archived *Namespace Client Questions* page says a client *sticks* to its active target
  after a new referral if that target is still listed ("even if more desirable (for example, lower cost) targets appear
  in the new referral"), and that failback moves it back "after the client's referral expires". So the 8 steps are:
  referral, ✕ FS-ST, FS-ZG over the WAN, FS-ST back at 09:10, at 09:31 a new referral (the old one expired at 09:30),
  and the client stays on FS-ZG (failback off) or goes back to FS-ST (failback on). This answers the task's
  misconception "the client always uses the nearest server, even after a failover" more strongly than the task's
  version did.
- **Replication model:** windows at `10:00 + k · replicateAfter`; a window at the same minute as a user action runs
  first; a save waits for the next window strictly after it; changes travel in save order (equal times: sending
  server name). Each version records the version it was saved over, so the receiver can tell "built on mine"
  (replace), "older than mine" (ignore) and "both changed" (conflict). This is a stand-in for DFSR's version vectors,
  not their mechanism.
- **Who keeps the loser.** The DFSR FAQ puts the losing file in ConflictAndDeleted "on the computer that resolved the
  conflict", and warns "the conflict could reside on a server different from the origin of the conflict". The model:
  both members detect the conflict and pick the same winner; a member whose own copy loses moves it to its bin; a
  member whose own copy wins keeps it and does not install the incoming loser. In the `conflict` preset this puts
  Ana's copy on FS-ZG, as the task says. *(check: whether the receiving member also stores an incoming loser.)*
- **Log step.** After a copy is moved to the bin, the next step is a note "conflict logged" (the FAQ: "logs an
  informational event"). It makes the point that nothing is merged and the loser is recoverable. No event ID is
  given (the FAQ gives none for conflicts).
- **Part 2 starts connected.** Ana works on FS-ZG and Marko on FS-ST (part 1's outcome); part 2 does not re-run
  referrals, so the referral cache card is not shown there.
- **The final step of part 2** is Ana opening the file on FS-ZG: she gets Marko's version, and the caption says
  whether her 10:00 change is in it (no-conflict), in the bin (conflict) or the copies still differ (link down).
- **Times** are clock times (09:00, 10:15), TTLs in seconds; both are data (`translate="no"`).
- **Duplicate placeholders:** captions that name a server twice go through `rich()`, which clones a node used twice
  (the first build lost the first `{to}`).

- **Review (fresh agent, 31 mutations of `sim.js`):** sim.js matched SPEC except one bug: with the link down the next
  window was timed from the *oldest* pending save, so a blocked window could come before a newer save (time ran
  back with 1 min windows). Fixed (newest pending save; same in the WAN card), with a test that fails on the old code.
  Two tests added: an open inside the TTL uses the cache (the `cached` branch, unreachable from the presets), and the
  link-down 1 min runs. Two mutants survive as equivalent (the log note queued last instead of next; a redundant
  pending filter). Page fixes from the review: `SMB` and the bin title come from `strings.js`; "the namespace server
  does not check targets" now says "in the model"; the unsourced "an administrator can restore it" is gone; equal
  save times get their own caption (no "the later one wins"); Croatian "svake minute" / "svake 2 min" / "svakih 15
  min" as plural forms, "klijentovu sjedištu", "više ravnopravnih članova (*multi-master*)", and the failback label
  "Vraćanje na bliže odredište" (no English term in a control label). The window note's count can include a change
  that is then dropped as superseded (equal save times only, not reachable from the page's options); left as is.
- **Stickiness needs the target to answer** (model choice, SPEC rule 4): a down active target is tried in list
  order like any other. No schedule reaches it.

## Deviations from the task

- `failover`: stays on FS-ZG even after the referral expires (see Decisions); 8 steps as the task says.
- A `part` param was added (the task's params cover only the halves).
- Lane order: the task shows the sites with a namespace server and a file server each; the order is mine.
- The task's state lists `files: [...]` per server; the model has one file per server (`file`, the current version id)
  plus `bin` and `pending`, and a `versions` table. `replication.pending` is per server.
- `sim.json` `steps` is 6 (the default params: `referral`).

## Model reuse

`dns-resolution` is not in `models/`. Its cache functions are DNS-specific (RRsets, NS + glue), so I copied the
**pattern** (ask once, get a referral, cache it until `expiresAt`, valid while `expiresAt > t`), the K1 page structure
and the `rich()` helper, not code; the header of `sim.js` says so. `orderTargets`, `compareVersions`, `nextWindow` and
`sendOrder` are pure functions over plain data if `win-sysvol-dfsr` or `multimaster-conflict` want them.

## Sources

Read on 2026-11-15 on Microsoft Learn (through a fetch agent; quotes in SPEC.md):

- *Set the Ordering Method for Targets in Referrals* — own site first in random order; lowest cost: other sites
  by cost, equal cost grouped and random within a group; the client tries the next target if the first is not
  available. The PowerShell default is "random order".
- *Change the Amount of Time that Clients Cache Referrals* — 300 s for a namespace root, 1800 s for a folder.
- *Enable or Disable Referrals and Client Failback* — failback exists, folders inherit it from the root.
- *Distributed File System: Namespace Client Questions* (archived 2008 R2 docs) — stickiness after a new referral;
  failback after the referral expires.
- *DFS Replication – FAQ*; *Distributed File System (DFS) Replication* — "uses the version of the file that was saved
  last"; ConflictandDeleted "on the computer that resolved the conflict"; an informational event; cleanup when the
  folder exceeds its configured size; "replicates according to the schedule you set"; active-active.
- `sims/dns-resolution/` (pattern), `docs/tasks/w2/dns-resolution.md`.

## Unchecked *(check)*

1. Which ordering method is the default for a new namespace in the management console ("lowest cost" in the task;
   the PowerShell cmdlet defaults to "random order"). With two sites both give the same list, so the sim is right
   either way; the page says "lowest cost".
2. Client failback off by default (not stated on the pages read).
3. The namespace server includes a down target in the referral (not stated; it has no health check in the pages read).
4. Equal save times: the real tie-break is not documented; the model uses server name order and the caption says so.
5. Whether the receiving member also keeps an incoming loser in its own ConflictAndDeleted (see Decisions).
6. Replication windows as regular ticks: a simplification of a replication schedule (open hours plus continuous
   replication while open).
7. Term pairs below.

## Term pairs (missing in `kit/glossary.js`; written out in `strings.js`)

| en | hr |
|---|---|
| namespace (DFS) | imenski prostor |
| referral | uputa (as in `dns-resolution`) |
| folder target | odredište mape *(check)* |
| site | sjedište *(check)* |
| site link cost | trošak veze između sjedišta *(check)* |
| failover | prebacivanje na rezervu *(check)* |
| client failback | vraćanje *(check)* |
| DFS Replication | replikacija |
| conflict | sukob *(check)* |
| multi-master | višegospodarska (replikacija) *(check)* |
| namespace server | poslužitelj imenskog prostora |

`share` / `dijeljeni resurs` and `cache` / `predmemorija` are in the glossary; the page uses the Croatian words.

## Shared requests

- **K1: a `double` line** for a message row (replication). K1 draws a double line only with `lock` (which adds a lock
  icon); the page sets `data-double` on the arrow and styles it (`.sd-seq-arrow[data-double]`).
- **Kit: `.sd-ctl[hidden] { display: none; }`.** A control with `visible: () => false` gets `hidden`, but
  `.sd-ctl { display: flex }` overrides it; this page (like `amdahl`, the `ari-` pages) adds the rule itself.

## Time

Started 15:24, done (gate pass, review applied, full tests and check) 15:53: about 29 min by the machine clock.
