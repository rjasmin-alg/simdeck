<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vrrp-failover: specification

One concept: **master election, virtual IP, preemption, gratuitous ARP.** Task `docs/tasks/w3/vrrp-failover.md`,
catalogue `ha-vrrp-failover` (§4.7). The student fails and restores the Master and watches how long the gateway is
gone, and who notices.

Source of the rules: RFC 9568, *Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6* (April 2024,
obsoletes RFC 5798). Section numbers checked against the RFC text on 2026-11-08: §6.1 parameters, §6.2 timers,
§6.3 state diagram, §6.4.1 Initialize, §6.4.2 Backup, §6.4.3 Active; §5.2.4 Priority; §7.2 transmitting; §7.3 the
virtual MAC. **RFC 9568 calls the Master "Active"** (its §1.1: the term "has been changed to 'Active Router'") and
the timers Active_Down_Interval, Active_Adver_Interval. The page keeps **Master**, the name of the task, the course and
most of the literature, and says once in the explanation that the current RFC calls it Active.

## Scene

- One segment, 192.168.1.0/24, a switch with ports 1–4 (as `arp-local-remote`'s addresses): host **A** 192.168.1.10
  (port 1), host **B** 192.168.1.20 (port 2), router **R1** 192.168.1.2 (port 3), router **R2** 192.168.1.3 (port 4).
  The routers lead to the cloud (8.8.8.8 stands for any far address).
- Virtual router VRID 1: **virtual IP 192.168.1.1** (the hosts' default gateway), **virtual MAC 00:00:5e:00:01:01**
  (§7.3: 00-00-5E-00-01-{VRID}). No router owns 192.168.1.1, so priorities are 1–254 (§5.2.4).
- Hosts' ARP tables: one entry, 192.168.1.1 → 00:00:5e:00:01:01 (learned earlier). Empty in the `start` event.
- The switch's MAC table: A's MAC → 1, B's MAC → 2, the virtual MAC → the Master's port.
- Advertisements go to 224.0.0.18 (MAC 01:00:5e:00:00:12) with the **virtual MAC as source** (§7.2, §6.4.3 note).
- Times are kept in centiseconds, the RFC's unit, and shown in seconds.

## Rules

1. **Advertisements.** The Master sends an advertisement every Advertisement_Interval (default 100 cs = 1 s, §6.1).
2. **Timer.** A Backup that hears no advertisement for Master_Down_Interval becomes Master (§6.4.2, "If the
   Active_Down_Timer fires").
   Skew_Time = ((256 − Priority) × Master_Adver_Interval) / 256; Master_Down_Interval = 3 × Master_Adver_Interval
   + Skew_Time (§6.1). The Priority is the Backup's own: higher priority, shorter skew, takes over first.
   On startup a non-owner goes to Backup with the timer running (§6.4.1). `skewTime`, `downInterval`.
3. **Election and tie-break.** Highest priority wins; **equal priority → the higher primary IPv4 address wins**,
   "based on an unsigned integer comparison" (§6.4.3). `wins(a, b)`. A Master that hears a winner steps down to
   Backup; otherwise it discards the advertisement and **sends one at once** to assert itself (§6.4.3,
   `masterHears`). Priority 255 belongs to the address owner (§5.2.4); here none, so the params clamp to 1–254.
4. **Preemption.** A Backup that hears an advertisement: if preempt is off, **or the sender's priority ≥ its own**,
   it resets its timer; else (preempt on, lower sender) it **discards** it (§6.4.2). So a preempting Backup with a
   higher priority takes over **when its own timer runs out**, not on the first advert it hears, and then the old
   Master hears its advertisement and steps down (rule 3). Preempt_Mode defaults to true; the address owner always
   preempts (§6.1). `backupHears`. Equal priorities never preempt (≥).
5. **Takeover.** When the timer fires the router sends an advertisement, broadcasts a **gratuitous ARP** for every
   virtual IPv4 address with the virtual MAC, and becomes Master (§6.4.2). Both frames carry the virtual MAC as
   source, so the **switch** learns the virtual MAC on the new port as they arrive. Hosts hear the GARP and
   **refresh** their existing entry with the **same** MAC: nothing changes for them (RFC 826 merge, as in
   `arp-local-remote`; a host without an entry adds none). URM ch08 "Šire o temi": ARP objava; RFC 5227.
6. **Clean shutdown.** A Master that shuts down sends an advertisement with **priority 0** and leaves (§6.4.3
   Shutdown). A Backup that hears priority 0 sets its timer to **Skew_Time** only (§6.4.2). A Backup that shuts down
   just stops its timer (§6.4.2).
7. **No hearing, two Masters** (derived). If the routers cannot hear each other's advertisements but both reach the
   switch, the Backup's timer runs out and both are Master. Each sends advertisements from the virtual MAC, so the
   switch moves the MAC to whichever port it heard last (MAC flapping): a duplicate gateway. Link: `quorum-split-brain`.

**The forwarder.** A's frames to the gateway go to the switch port of the virtual MAC. They get through when the
router on that port is up and Master; otherwise they are **lost**. `lost` adds the time with no forwarder;
`gwChanges` counts changes of forwarder.

## Events (`event`) and steps

Each event is one run; its phases come from the rules (`plan(p)`). Every takeover has the same three steps:
`expire` (timer runs out, state → Master), `announce` (advert + GARP into the switch; the switch learns the port),
`flood` (the switch floods them: hosts refresh the same entry, the other router hears the advert).

| Event | Start | Phases | Steps |
|---|---|---|---|
| `fail` | election winner Master | advert, fail, wait, expire, announce, flood, frame, summary | 8 |
| `fail` (R1 is the Backup) | R2 Master | advert, fail, summary | 3 |
| `restore` (R1 preempts) | R1 down, R2 Master | advert, restore, wait, expire, announce, flood, frame, summary | 8 |
| `restore` (no preemption) | R1 down, R2 Master | advert, restore, wait, summary | 4 |
| `shutdown` | winner Master | advert, shutdown, expire, announce, flood, frame, summary | 7 |
| `shutdown` (R1 Backup) | R2 Master | advert, shutdown, summary | 3 |
| `start` | both Initialize, no Master | start, expire, announce, flood, summary | 5 |
| `cut` | winner Master | advert, cut, wait, expire, announce, flood, flap, summary | 8 |

`wait` jumps to t = 3 × Advertisement_Interval: three adverts missed (`fail`), dropped (`cut`) or discarded / heard
(`restore`). Events happen "right after an advertisement at t = 0".

## Params

`event` (fail / restore / shutdown / start / cut; resets), `prioR1` 1–254 (200), `prioR2` 1–254 (100), `preempt`
(on), `advInterval` 100 cs / 10 cs (1 s / 0.1 s).

## Presets and expected numbers (checked by `sim.test.js` and by hand)

| # | Preset | Params | Expected |
|---|---|---|---|
| 1 | `master-fails` | defaults | R2's Master_Down = 300 + 156·100/256 = 300 + 60.94 = **360.94 cs ≈ 3.61 s**; switch moves 00:00:5e:00:01:01 from port 3 to 4; A's entry unchanged; **3.61 s** of lost frames |
| 2 | `preempt-back` | `restore` | R1 (200) discards 3 adverts of R2 (100); its timer 300 + 56·100/256 = **321.88 cs ≈ 3.22 s** runs out; R1 Master, R2 steps down; one more change of gateway, no lost time in the model |
| 3 | `no-preempt` | `restore`, preempt off | R1 resets its timer on each advert, stays Backup; R2 stays Master; no change |
| 4 | `tie` | `start`, both 100 | both timers 3.61 s, both Master, the switch sees the MAC on ports 3 and 4; R1 (.2) steps down, R2 (.3) asserts and stays Master |
| 5 | `clean-shutdown` | `shutdown` | R2's timer set to Skew_Time = **60.94 cs ≈ 0.61 s**; 0.61 s lost |
| 6 | `fast-adverts` | interval 10 cs | Master_Down = 30 + 6.09 = **36.09 cs ≈ 0.36 s** |
| 7 | `split` | `cut` | R2 Master at 3.61 s, both Master; R1's advert at 4 s pulls the MAC back to port 3; 2 changes of gateway |

Hand check: 156/256 = 0.609375; 56/256 = 0.21875; 3 × 100 + 60.9375 = 360.9375; 3 × 10 + 6.09375 = 36.09375.

## Out of scope

VRRP authentication (removed in v3), IPv6 (neighbour advertisements), load balancing behind the VIP, health checks
and tracking, specific daemons, the Accept_Mode flag, the advertisement's checksum and TTL check.
