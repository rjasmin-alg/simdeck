<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dns-scavenging: specification

One concept: **timestamps, no-refresh and refresh intervals, which stale records disappear and when** (task
`docs/tasks/w3/win-dns-scavenging.md`, catalogue §4.5.3, §5.21). The student runs weeks of client activity in the
AD-integrated zone `corp.example` with aging on the zone and automatic scavenging on the server, and watches which
records the scavenging runs delete, and when.

## Scene

- **Timeline** of days 0 … `until` (a param, 7–60). One row per record of `corp.example`: its timestamp ● and,
  from it, the no-refresh band (hatched), the refresh band (dotted) and the stale zone (cross-hatched); every
  earlier timestamp keeps its bands up to the next one. A deleted record ends in ✕; a record that comes back starts
  new bands. Static records carry a "static" badge and a solid bar, no bands. Scavenging runs are dashed vertical
  lines over all rows with ▼ on the axis; a run that skipped the zone is a thin dotted line with ▽. The part after "now" is shown faint
  (what will happen if nothing changes).
- **Left of each row:** the name, its address, who writes it (the client itself, the DHCP server, the admin, or a
  static record), its timestamp, and the record's state now: no-refresh, refresh, stale, deleted, static.
- **Under the timeline:** the zone's aging settings (aging on/off, no-refresh, refresh, "the zone can be scavenged
  after"), the server's scavenging setting (on/off, period, last run, next run), the safety check (rule 9), and
  the log of this step (refreshes accepted and ignored, updates, records created and deleted, what a run decided).

## State

```
t (hours since day 0 00:00), phase: 'start' | 'clients' | 'run' | 'end', done
zone:    { aging, noRefresh, refresh, agingEnabledAt: 0, canScavengeAfter }       (hours)
server:  { scavenging, period, lastRun, nextRun }                                 (hours, null when none)
records: [{ name, type: 'A', data, owner: null, timestamp, static, source }]       (sorted by name)
clients: [{ name, source: 'client' | 'dhcp' | 'manual', start, every, leavesAt, changeAt, newIp, gone }]
hist:    [{ name, at, kind: 'create' | 'refresh' | 'update' | 'delete', ts }      (what the timeline draws)
          | { kind: 'run', at, skipped: null | 'aging' | 'notYet', deleted: [names] }]
log:     [ entries of this step ], changed: [names]
```

The record shape `{ name, type, data, owner, timestamp, static }` is the record-lifecycle model of
`win-dns-dynamic-update` (catalogue §5.21); `source` is added here. `owner` stays `null`: ownership is that page's
concept. A static record has `timestamp: null` and `static: true` (Windows stores 0; null keeps day 0 free for
records created on day 0).

## One step

One **moment of interest**: a (time, phase) pair in which something happens that the student should see. Each
time has two phases, in this order (tie-break T1): (1) **clients**: registrations, refreshes, updates and clients
leaving, clients in list order; (2) **run**: the scavenging run, if one is due. A clients phase is a moment when a
record is created (or comes back), a timestamp moves (accepted refresh or update) or a client leaves; a refresh
that is ignored is not, and is reported in the log of the next moment. Every scavenging run is a moment, including
one that deletes nothing or skips the zone. After the last moment, if it is before day `until`, one **end** moment
at day `until` shows the state then. Step 0 is day 0 before anything has happened (only static records exist).

At most 20 steps: a run with more moments stops after the 20th (the caption says so).

## Rules

1. **Static records are never scavenged** (timestamp 0). A record the admin adds with "Delete this record when it
   becomes stale" gets the current time, rounded down to the hour, as its timestamp and ages like a dynamic one;
   nothing refreshes it afterwards (Microsoft, "Understanding Aging and Scavenging", WS2008; "Don't be afraid of
   DNS scavenging, just be patient", Microsoft Learn troubleshooting).
2. **Refresh** (a dynamic update with the same data): while `now < ts + noRefresh` the server does not accept it
   and the timestamp stays; from `now ≥ ts + noRefresh` it is accepted and sets `ts = now` (same documents:
   "Upon expiration of the no-refresh period, the server begins to accept attempts to refresh"). Tie-break T2: a
   refresh at exactly `ts + noRefresh` is accepted.
3. **Update** (the data changes, e.g. a new address): always accepted and sets `ts = now`, even inside the
   no-refresh interval (same: "it can, however, accept updates before that time … the server also updates (resets)
   the record time stamp"). A registration of a name with no record is an update too.
4. **Stale:** a record may be deleted when `now > ts + noRefresh + refresh` (troubleshooting article: "If the
   current date and time is greater than the timestamp plus No-refresh and Refresh intervals, the record is
   deleted"). Tie-break T3: at exactly `ts + noRefresh + refresh` it is kept.
5. **Only a scavenging run deletes**, and only on a server with automatic scavenging on. Runs come every `period`
   after scavenging is enabled (day 0): at `period`, `2·period`, … *(check: the time of the first run after
   enabling)*. Zone aging alone deletes nothing (both documents: "set in all three places").
6. **"The zone can be scavenged after"** = the time aging was enabled + `refresh` (rounded down to the hour); a run
   scavenges the zone only when `now > canScavengeAfter` (WS2008: "when the current server time is greater than the
   value of the start scavenging time"). Tie-break T4: a run at exactly that time skips the zone. Aging is enabled
   at day 0, so with the defaults the day-7 run skips the zone. A zone with aging off is never scavenged.
7. **Defaults:** no-refresh 7 days, refresh 7 days, scavenging period 7 days (WS2008 terminology table: all three
   "by default … seven days").
8. **Clients:** the Windows DNS client refreshes its record every 24 h (WS2008: "renews DNS registration of client
   resource records every 24 hours"; troubleshooting: "Windows clients dynamically update DNS every 24 hours"). A
   DHCP-registered record is refreshed by the DHCP server when the lease renews, at half the lease (RFC 2131
   §4.4.5, T1 = 0.5 × lease; WS2008: "DHCP servers, which renew client address leases" make refresh attempts):
   every 4 days for an 8-day lease, every 12 h for a 1-day lease *(check: that the DHCP server refreshes at every
   renewal)*. A client that has left sends nothing.
9. **Safe setting**, shown on the page: `refresh` must be at least the longest refresh period of any client (24 h,
   or half the lease); otherwise a live record can turn stale between two refreshes and be deleted. WS2008: the
   refresh interval "should be large enough to allow all clients to refresh their records"; the troubleshooting
   article asks for room for several attempts. The task says "longer than"; with refreshes landing before the run
   (T1) "at least" is the exact boundary in this model *(check)*. Below it a live record **can** be deleted: whether
   it is depends on where the refreshes fall against its timestamp (with refreshes every `c` hours from the
   timestamp, it survives when ⌈noRefresh / c⌉ · c ≤ noRefresh + refresh), so the page says "can vanish".
10. **A deleted record comes back** at its client's next refresh: the client's dynamic update finds no record and
    creates it (rule 3), with a new timestamp.
11. **Aging off on the zone:** timestamps are still written (WS2008: dynamic records in primary zones are time
    stamped) and refreshes follow rule 2 on this server *(check: the troubleshooting article says the timestamp
    may be updated where the client registers but is not replicated)*; every run skips the zone.

### Tie-breaks

- **T1:** at the same time, clients act first (in list order), then the run. A record refreshed on the day of a
  run is judged with its new timestamp.
- **T2:** a refresh at exactly `ts + noRefresh` is accepted.
- **T3:** a record at exactly `ts + noRefresh + refresh` is not stale (`>`, not `≥`).
- **T4:** a run at exactly `canScavengeAfter` skips the zone.
- **T5:** an address change at a client's refresh time is one update (not an update and a refresh).

## Scenarios, names and addresses

`corp.example`; `fs1` 10.0.0.20 is a static record in every scenario. All client actions and runs are at 00:00 of
their day, except refreshes every 12 h (1-day lease).

| `scenario` | Clients |
|---|---|
| `leaver` | `pc1` 10.0.0.51 (client, 24 h, stays); `pc2` 10.0.0.52 (client, 24 h, registers day 0, leaves day 1) |
| `printer` | `prn4` 10.0.0.40 (DHCP-registered, refreshed every `lease`/2) |
| `static` | `old-nas` 10.0.0.30 (added by the admin on day 0 with "delete when stale"); `pc1` 10.0.0.51 (client, 24 h) |
| `move` | `pc1` 10.0.0.51 (client, 24 h), new address 10.0.1.23 on day 3 |

## Params

| Param | Values | Default |
|---|---|---|
| `scenario` | `leaver`, `printer`, `static`, `move` | `leaver` |
| `noRefresh` | 1–14 days | 7 |
| `refresh` | 1–14 days | 7 |
| `period` | 1–7 days | 7 |
| `scavenging` | server: automatic scavenging on/off | on |
| `aging` | zone: aging on/off | on |
| `lease` | 1 / 8 days (shown for `printer`) | 8 |
| `until` | 7–60 days | 21 |

Every param resets the demo to step 0: it changes which moments there are.

## Presets and expected numbers

Checked with an independent Python hand model before the model was written (NOTES.md, "Checks").

1. **`defaults`** (derived, unchecked) — `leaver`, 7/7/7, until 21. **8 steps:** day 0 PC1 and PC2 register (ts 0);
   day 1 PC2 leaves (PC1's refresh ignored); day 7 PC1's refresh accepted, ts 7 (days 2–6 ignored); day 7 run
   **skips the zone** (can be scavenged only after day 7, T4); day 14 PC1 ts 14; day 14 run: PC2 is not stale
   (0 + 7 + 7 = 14 is not < 14, T3); day 21 PC1 ts 21; day 21 run **deletes PC2, 20 days after it left**.
2. **`too-aggressive`** (derived, unchecked) — `printer`, 1/1/1, lease 8, until 8. **11 steps:** day 0 PRN4
   registered by DHCP (ts 0); day 1 run skips the zone (T4); day 2 run: not stale (0 + 2 = 2, T3); day 3 run
   **deletes PRN4**; day 4 renewal, PRN4 back (ts 4); runs on days 4, 5, 6 keep it; day 7 run deletes it again;
   day 8 back; day 8 run. The name is missing from day 3 to day 4 and from day 7 to day 8. Rule 9 shows ⚠: refresh
   1 day < the printer's 4 days.
3. **`static-survives`** (derived, unchecked) — `static`, 7/7/7, until 21. **7 steps:** day 0 the admin adds
   old-nas (ts 0) and PC1 registers; days 7, 14, 21 PC1 refreshes and a run follows; the day-21 run **deletes
   old-nas**; fs1 stays.
4. **`aging-only`** (derived, unchecked) — `leaver`, scavenging off, until 60. **11 steps:** day 0, day 1 (PC2
   leaves), PC1's timestamp moves on days 7, 14, …, 56, and the end moment on day 60: **PC2 is still in the zone**,
   stale since day 14, with no run at all.
5. **`ip-change`** (derived, unchecked) — `move`, until 14. **5 steps:** day 0 PC1 registers (ts 0); day 3 the new
   address is an update, **ts 3 at once** (rule 3, inside the no-refresh interval); day 7 run skips the zone, and
   PC1's refresh that day is ignored (3 + 7 = 10); **day 10 refresh accepted, ts 10**; day 14 run keeps PC1.

The default (`defaults`) has 8 steps = `sim.json` `steps`. With a 1-day lease the printer survives 1/1/1 (17 steps
to day 8, every renewal accepted).

## Legend

Timestamp ●; no-refresh band (hatched); refresh band (dotted); stale (cross-hatched); deleted ✕; static (badge,
no bands); scavenging run (dashed vertical line, "run"); changed in this step (highlight).

## Out of scope

AD tombstones of deleted records (`dNSTombstoned`), replication of timestamps between DCs, the zone's list of
scavenging servers, scavenging started by hand, DHCP lease cleanup and name protection (`win-dhcp-dns-update`),
PTR zones, ownership of records (`win-dns-dynamic-update`).
