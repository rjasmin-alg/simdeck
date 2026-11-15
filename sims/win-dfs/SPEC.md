<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dfs: specification

Task: `docs/tasks/w3/win-dfs.md` (catalogue §4.5.7). One concept: **a DFS namespace path resolves by a referral to
the nearest target; DFS Replication handles a file changed on both members by keeping the later save.** A stepper,
one message or one event per step, drawn with kit view K1 (message sequence chart) as `dns-resolution` is.

Sources (read 2026-11-15 on Microsoft Learn, via a fetch agent):

- **[ORD]** *Set the Ordering Method for Targets in Referrals*.
- **[TTL]** *Change the Amount of Time that Clients Cache Referrals*.
- **[FB]** *Enable or Disable Referrals and Client Failback*.
- **[NCQ]** *Distributed File System: Namespace Client Questions* (archived, Windows Server 2008 R2 docs).
- **[FAQ]** *DFS Replication – FAQ*; **[DFSR]** *Distributed File System (DFS) Replication* (overview).
- `sims/dns-resolution/` (the reused pattern: ask once, get a referral, cache it for a TTL; K1 lanes).

## Scene

Two sites, Zagreb (ZG) and Split (ST), joined by a WAN link with site link cost 100. Six lanes, left to right:

| Lane | Party | Site |
|---|---|---|
| `CL-ZG` | Ana's computer (client) | ZG |
| `FS-ZG` | file server, folder target `\\FS-ZG\projekti` | ZG |
| `DC-ZG` | namespace server (a DC) | ZG |
| `DC-ST` | namespace server (a DC) | ST |
| `FS-ST` | file server, folder target `\\FS-ST\projekti` | ST |
| `CL-ST` | Marko's computer (client) | ST |

Split mirrors Zagreb, so the WAN is the middle of the chart: replication and a failover to the other site cross it.

The namespace folder is `\\firma.local\dfs\projekti` with the two folder targets above. The file in part 2 is
`plan.xlsx`, at the start the same version `v1` (09:00) on both servers.

The demo has two parts, chosen by the param `part`: `namespace` (rules 1–4) and `replication` (rules 5–7). The page
shows the clients' referral caches in part 1 and the servers' copies of `plan.xlsx` in part 2.

## Rules

1. **Referral.** A namespace path is virtual. A client resolves it by asking a namespace server for a referral, the
   list of targets, and then connects to a target directly [ORD: "After the client receives the referral, the client
   attempts to access the first target in the list"]. The model's client asks the namespace server of its own site
   (how it finds one, the domain referral, is out of scope).
2. **Target order, lowest cost.** Targets in the client's own site come first; targets in other sites follow by
   ascending site link cost; targets with equal cost are in random order [ORD]. **Tie-break in the model:** equal cost
   → server name order (the page says the real order is random). With two sites, the "random order" method gives the
   same list (own site first, the one other site after it) [ORD]; which method is the default is not stated *(check)*.
3. **Referral cache.** The client keeps the referral for its TTL and does not ask again during it: **1800 s** for a
   folder (300 s for a namespace root, mentioned only) [TTL]. An entry is valid while `expiresAt > t`; at
   `expiresAt` it is expired (as in `dns-resolution`).
4. **Failover and failback.** If a target does not answer, the client tries the next target in its list [ORD, FB].
   The namespace server does not leave a down target out of the referral (not stated; model) *(check)*. When the
   referral expires and the client asks again:
   - **failback off:** the client *sticks* to the target it is connected to if that target is in the new referral,
     even when a better target is back [NCQ: "the client 'sticks' to this target, even if more desirable (for
     example, lower cost) targets appear in the new referral"] (model: only while that target answers; a down one
     is tried in list order like any other);
   - **failback on:** the client goes back to the first target of the new list that answers [NCQ: "fail back to a
     local target after the client's referral expires"; FB].
   Whether failback is off by default is not stated *(check)*; the model's default is off.
5. **Replication is not instantaneous.** A save is a pending change on its server. Changes travel only in a
   replication window, at `10:00 + k · replicateAfter` (k = 1, 2, …), and only when the WAN link is up [DFSR,
   FAQ: "Data replicates according to the schedule you set"; the periodic window is the model's simplification].
   - **Tie-break, same time:** a window at the same time as a user action runs first (the user acts after it).
   - **Tie-break, send order:** in a window, pending changes are sent in the order they were made (save time);
     equal times → sending server name order.
   - A pending change whose server no longer holds that version (it lost a conflict there) is not sent.
   - The window for pending changes is the first one strictly after the newest pending save (with the link down,
     older saves stay pending).
   - A window with nothing pending is not a step. With the link down, a window is shown once per batch of new saves
     (the change waits) and nothing is sent.
6. **Compare on arrival.** Each version knows the version it was saved over (`base`). The receiving server compares
   the incoming version I with its own current version L:
   - I was built on L (L is an ancestor of I) → I replaces L, no conflict;
   - L already contains I → nothing changes;
   - otherwise both changed since a common version → **conflict**.
7. **Conflict: the later save wins** [FAQ: "When DFS Replication detects a conflict, it uses the version of the file
   that was saved last"]. Nothing is merged. **Tie-break, equal save times:** not stated (the FAQ says time stamps
   decide) *(check)*; the model lets the version saved on the server whose name sorts first win (FS-ST before FS-ZG).
   - If I wins, L is moved to `DfsrPrivate\ConflictAndDeleted` on the receiving server [FAQ: "It moves the other file
     into the DfsrPrivate\ConflictandDeleted folder … on the computer that resolved the conflict"], and the server
     logs the conflict [FAQ: "logs an informational event"] (the next step, a note).
   - If L wins, the server keeps L and does not install I (model: the losing copy is kept once, on the member that
     held it as its current file) *(check)*.
   - Each member reaches the same winner on its own; the loser stays in ConflictAndDeleted until its size quota
     cleans it up [FAQ].

## Params

| Key | Values | Default | Part |
|---|---|---|---|
| `part` | `namespace`, `replication` (resets) | `namespace` | both |
| `fsStUp` | toggle: FS-ST up at the start; off → down at 09:00, back at 09:10 (resets) | on | 1 |
| `failback` | toggle | off | 1 |
| `linkUp` | toggle: WAN link for replication | on | 2 |
| `secondEditDelay` | 120 s / 1200 s (2 / 20 min) | 120 s | 2 |
| `replicateAfter` | 60 s / 900 s (1 / 15 min) | 900 s | 2 |

## Timelines

**Part 1** (times from 09:00:00): with `fsStUp` on, Ana opens the folder at 09:00, then Marko at 09:00. With `fsStUp`
off, FS-ST is down: Marko opens at 09:00, FS-ST comes back at 09:10, Marko opens again at 09:31 (his referral expired
at 09:30). An "open" with no valid referral is: referral request → referral → connect attempts in list order (a
down target is one step with ✕) — or, after an expiry with an active connection, failback off: connect to the
active target again (it sticks).

**Part 2** (times from 10:00): Ana saves `plan.xlsx` on FS-ZG at 10:00 (over `v1`). Marko opens it on FS-ST at
`10:00 + secondEditDelay` and saves it at the same time, over what he opened. Windows as in rule 5. After the last
save: windows until nothing is pending (link up) or one blocked window (link down), any conflict log, then Ana opens
the file on FS-ZG.

## Expected numbers

| Preset | Params | Steps | Outcome |
|---|---|---|---|
| `referral` | defaults | **6** | ZG cache `[FS-ZG, FS-ST]`, ST cache `[FS-ST, FS-ZG]`, both TTL 1800 s, expires 09:30; Ana → FS-ZG, Marko → FS-ST |
| `failover` | `fsStUp` off | **8** | 09:00 ✕ FS-ST, connected FS-ZG over the WAN; 09:10 FS-ST back; 09:31 new referral `[FS-ST, FS-ZG]` expiring 10:01, still FS-ZG |
| (failback) | `fsStUp` off, `failback` on | 8 | as above, then connects to FS-ST at 09:31 |
| `conflict` | part 2, defaults | **8** | 10:00 Ana v→FS-ZG; 10:02 Marko opens `v1` on FS-ST, saves; 10:15 window; Ana's to FS-ST: conflict, FS-ST keeps Marko's; Marko's to FS-ZG: conflict, Marko's (10:02) wins, Ana's → ConflictAndDeleted on FS-ZG; log; Ana opens Marko's version |
| `no-conflict` | part 2, delay 20 min | **8** | 10:15 Ana's to FS-ST, replaces `v1`; 10:20 Marko opens Ana's, saves over it; 10:30 Marko's to FS-ZG, replaces Ana's; Ana opens Marko's version (built on hers); bins empty |
| (fast window) | part 2, `replicateAfter` 1 min | 8 | 10:01 Ana's to FS-ST; 10:02 Marko opens Ana's (the 10:02 window had nothing pending); 10:03 Marko's to FS-ZG; no conflict |
| (link down) | part 2, `linkUp` off | 5 | Ana saves, Marko opens `v1`, saves, 10:15 blocked, Ana opens her own version; copies differ |
| (link down, 20 min) | part 2, `linkUp` off, 20 min | 6 | Ana saves, 10:15 blocked, Marko opens `v1` at 10:20, saves, 10:30 blocked, Ana opens her own |
| (link down, 1 min) | part 2, `linkUp` off, 1 min, 2 / 20 min | 6 | blocked windows at 10:01 and 10:03 / 10:01 and 10:21: each batch's window is after its newest save |

The task file says `failover` takes 8 steps and that the client stays on FS-ZG *until* the cache expires; [NCQ]
says it stays even after (rule 4), so the 8 steps end with the new referral and the sticky connection. `sim.json`
`steps` is 6 (the default params: `referral`).

Checked with `node --test sims/win-dfs/sim.test.js` (every row above is a test).
