<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-secondary-expiry: specification

One concept: **SOA serial, refresh, retry, expire; a dead primary takes the zone down later** ("a secondary is a
cache with a timer"). Task `docs/tasks/w3/dns-secondary-expiry.md`, catalogue `inet-dns-secondary-expiry` (§4.2).
Class: stepper. The student: kill the primary, run time.

## Scene

- A primary P and a secondary S for one zone, each with its copy (SOA serial and two A records), and a client that
  asks S for one name. S's three timers (refresh, retry, expire) are drawn as bars inside S's card; a log below.
- **lab** (presets 1–3, 5): UL ch19's `lab.example` (`/var/named/lab.example.zone`: serial 2026090301, refresh
  3600, retry 900, expire 604800; `posluzitelj A 192.168.180.1`, `klijent A 192.168.180.100`). P =
  `ns1.lab.example` (the book's `MNAME`); S = `ns2.lab.example` *(derived: the book has no secondary)*. The edit
  sets `klijent` to 192.168.180.101 *(derived)*. The client asks `klijent.lab.example A`. Times show as
  "dan 7, 00:00" / "day 7, 00:00" from the start.
- **estate** (preset 4): `qm.internal` from the estate's student-visible files: `db.qm.internal` (SOA serial
  2019052414, refresh 10800, retry 3600, expire 1209600; `loom A 10.40.1.5`, `rq A 10.44.10.30`) and the secondary's
  zone listing (`qm-dc02`, secondary of `qm.internal`, master 10.40.1.5, last transfer 2026-11-02 05:02). P = loom,
  S = qm-dc02, the client is the colo render farm asking `rq.qm.internal A` *(the name is chosen here: a colo
  address in the zone)*. t = 0 is **Tue 2026-11-10 17:02**, the secondary's last successful check before loom goes
  off: S checks on the 3-hour grid of its last transfer (05:02 + 3 h·k), and 17:02 is the last grid point before
  the evening *(derived)*. Times show as dates in the estate's calendar.

## State

`{ t, scene, soa: { refresh, retry, expire }, primary: { up, serial, records }, secondary: { serial, records, lastOk,
lastXfer, mode: ok | retrying | expired, expired, expiredAt, expireAt, nextRefresh | null, nextRetry | null },
lastCheck: { t, kind, outcome }, actedSinceCheck, lastActionAt, acted[], ev, client: { qname, rcode, value },
changed[], log[], done }`. Times in seconds from the start. At t = 0 S has just checked P successfully (serials
equal): `lastOk` = 0, `expireAt` = EXPIRE, `nextRefresh` = REFRESH.

## Rules

1. **Refresh.** `REFRESH` seconds after its last successful check, S asks P for the SOA serial (RFC 1035 §3.3.13
   `REFRESH`; UL ch19 "Vlastiti poslužitelj imena", the SERIAL/REFRESH/RETRY/EXPIRE paragraph).
2. **Serial, not contents.** If P's serial is greater than S's (RFC 1982 serial arithmetic, 32 bits; exactly 2^31
   apart is undefined and counts as not greater), S transfers the zone and takes P's records and serial. Otherwise
   S keeps its copy even if P's records differ, and nothing reports an error (UL ch19: "onaj tko zonu preuzima
   uspoređuje brojeve, a ne sadržaj"; UL ch20 Primjer 3). Either way the check is a **success**: `lastOk` = t,
   `expireAt` = t + EXPIRE, next refresh at t + REFRESH.
3. **Retry.** If P does not answer, S stops the refresh timer and tries again every `RETRY` seconds (RFC 1035
   §3.3.13 `RETRY`); `expireAt` stays where it was.
4. **Expire.** When `t ≥ lastOk + EXPIRE`, S stops being authoritative and answers SERVFAIL (RFC 1035 §3.3.13
   `EXPIRE`; UL ch19: "koliko dugo sekundarni smije odgovarati kad primarnog nema"). **Tie-break:** at exactly
   `lastOk + EXPIRE` the zone is expired. After the expiry S keeps retrying every RETRY; when a retry gets an answer,
   S takes the whole zone again (a transfer, whatever the serials) and is authoritative again *(check)*.
5. **Until then, the last copy.** Until the expiry S answers every query from its last copy: a dead primary is
   invisible to clients for up to EXPIRE.
6. **P back in time.** If P comes back before the expiry, the next retry succeeds (rule 2) and the expire clock
   starts over from that retry.
7. **No NOTIFY** (RFC 1996, out of scope): a change on P reaches S only at a refresh or retry.

**Equal times.** At one second: the expiry first, then the check, then the actions (edit, kill, revive in that
order). So a kill at t = 0 comes right after the successful check at 0, and a revive at the second of a retry is
seen by the next retry, not that one.

## Actions

Each is one step at its moment. `edit`: P's record changes; with `bumpSerial` on, P's serial + 1 (mod 2^32). An
edit while P is off does nothing (P cannot be edited). `kill`: P stops answering. `revive`: P answers again. Each
action happens at most once per run (params `editAt`, `killAt`, `reviveAt`, −1 = none).

**Buttons** (E edit, K kill, V revive): the action is set at the moment the current step shows (a second later if an
action already happened at that moment, so the steps shown so far stay unchanged) and the page steps to it. Later
scheduled actions are dropped ("the steps after it are rewritten"). Rejected presses (kill while off, revive while
on, edit while off, a second action of a kind, the 20-step limit) change nothing and are said in the caption.

## One step

A step is the next **action**, or the next **protocol moment** (the expiry and/or the check at one second), or a
**run** of routine moments. A moment is **routine** when it is only a check (no expiry), it did not transfer, its
kind (refresh/retry) and outcome (current/fail) equal the previous check's, and no action took effect since that
check (a scheduled action that does nothing, reachable only by a hand-made URL, does not break a run).
A run is a maximal series of routine moments: one step, with its count, first and last time ("retry ×666"). The
first check of a kind (a refresh that fails, the first retry, the first refresh after a success by retry) is thus
always its own step, so RETRY and REFRESH are seen once before they are folded.

## The end of a run

No scheduled action is left, and either P is off and the zone has expired (the run ends at the expiry), or P is up
and the next moment would be after `H` = (last action's time, or 0) + EXPIRE (the run ends with the last check not
after H: a full EXPIRE of successful refreshes shows that the clock never runs out while P answers). At most 20 steps.

## Params

| key | values | default | notes |
|---|---|---|---|
| `refresh` | 900–86400 s, step 300 | 3600 | resets |
| `retry` | 300–7200 s, step 300 | 900 | resets |
| `expire` | 604800, 1209600 s | 604800 | resets |
| `bumpSerial` | on / off | on | read by the edit; resets |
| `scene` | `lab`, `estate` | `lab` | hidden; set by presets |
| `editAt`, `killAt`, `reviveAt` | −1 or seconds | 600, −1, −1 | hidden; set by presets and the buttons |

Defaults = preset 1.

## Presets and expected numbers

Checked with an independent Python count before the model was written; the model agrees (`sim.test.js`, "presets").

| preset | params | steps | the steps (time: what) |
|---|---|---|---|
| `book-edit` | lab, edit at 600 s, serial bumped | 4 | 600 edit (serial 2026090302) · 3600 refresh → transfer, client gets .101 · 7200 refresh, same serial · 10800–604800 refresh ×166 |
| `no-serial-bump` | as 1, serial not bumped | 3 | 600 edit (serial stays 2026090301) · 3600 refresh, same serial, S keeps .100 · 7200–604800 refresh ×167, S still .100 |
| `primary-dies` | lab, kill at 0 | 5 | 0 kill · 3600 refresh fails · 4500 retry fails · 5400–603900 retry ×666 · 604800 (day 7, 00:00) expiry → SERVFAIL (the retry at 604800 fails too) |
| `estate-14-days` | estate, kill at 10680 s (Tue 10 Nov 20:00) | 5 | 20:00 kill · 20:02 refresh fails · 21:02 retry fails · Tue 10 Nov 22:02 – Tue 24 Nov 16:02 retry ×331 · **Tue 24 Nov 17:02** expiry → SERVFAIL |
| `revived-in-time` | lab, kill at 0, revive at 432000 (day 5) | 8 | 0 kill · 3600 fail · 4500 retry fail · 5400–432000 retry ×475 · 432000 revive · 432900 retry succeeds, expire now 1037700 (day 12, 00:15) · 436500 refresh · 440100–1034100 refresh ×166 |

The estate's expiry counts from the last successful check (Tue 10 Nov 17:02), not from the last transfer (Mon 2 Nov
05:02, which would give Mon 16 Nov 05:02).

## Marks

"changed" per step: P (up/down, serial, records), S (serial, records, mode), each timer whose deadline moved, the
client's answer. Changed record rows and serials are highlighted; S's records that differ from P's carry "≠ P".
