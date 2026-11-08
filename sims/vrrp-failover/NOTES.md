<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# vrrp-failover: notes

New stepper (task `docs/tasks/w3/vrrp-failover.md`, catalogue `ha-vrrp-failover`, §4.7). Kit view **K2**
(`Simdeck.topology`) draws the switched segment; the page draws the time line, the routers' state and timer, and the
frame card. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Events, not buttons.** The kit replays a stepper from its params, so the task's buttons ("fail R1", "restore R1",
  "shut down R1 cleanly", "cut R1–R2 link") are one `event` select (resets to step 0): `fail`, `restore`, `shutdown`,
  `start`, `cut`. Each event is one run; its phases come from the rules (`plan(p)`), so changing priorities or
  preemption changes the run (e.g. failing R1 when R2 has the higher priority is a 3-step "nothing happens").
- **`start` event** (both routers start at once) is how the `tie` preset elects: equal priorities give equal timers,
  both become Master, and the §6.4.3 tie-break settles it (R1 .2 steps down, R2 .3 asserts with an advertisement).
- **`restore` starts with R1 down and R2 Master** ("R1 returns"), as the task's `preempt-back` describes, not after a
  replay of `master-fails`.
- **`prioR1` is a param** (task lists only `prioR2`): the `tie` preset needs R1 at 100. Both ranges are 1–254; 255
  (the address owner) cannot be chosen because no router here owns 192.168.1.1. `backupHears` still implements "the
  owner always preempts" and has a test.
- **Preemption follows RFC 9568 §6.4.2 literally**: a higher-priority Backup *discards* the lower Master's
  advertisements and takes over when its own Master_Down timer runs out (3.22 s for priority 200), then the old
  Master hears it and steps down. It does not take over on the first advert it hears.
- **Every takeover has three steps**: `expire` (state change), `announce` (advertisement + gratuitous ARP into the
  switch; the switch learns the port from their source MAC, the virtual MAC), `flood` (out to all ports: hosts refresh
  the same entry, the other router hears the advertisement). This keeps "the switch learns, the hosts don't" visible.
- **Time line** (top left): one lane per router (Master filled, Backup light with a dashed top edge, not running
  hatched), adverts as ticks (dashed when lost), and a traffic lane (green while a router forwards, hatched red while
  frames are lost); a red line marks now. The axis runs to one interval past the run's end.
- **Lost time** is the time with no forwarder: the router on the switch port of the virtual MAC must be up and
  Master. In `preempt-back` the model loses no time (the switch moves to R1 while R1 is already Master); the caption
  says the second switch-over can drop frames in flight and why preemption is often delayed or switched off.
  "Gateway changes" counts the switch-overs (1 vs 0 for `preempt-back` vs `no-preempt`).
- **`cut` = the routers stop hearing each other's advertisements** while both still reach the switch (the caption
  gives "a packet filter drops them" as one cause). The adverts are drawn ending in a cross at the other router. A
  link-level cut would also split the hosts, which is a different scenario. After R2 takes over, R1's next
  advertisement (t = 4 s) pulls the MAC back: MAC flapping, two gateways; the explanation points to quorum and
  split-brain.
- **The switch's MAC table shows only the virtual MAC's row.** The hosts' rows never change in this sim and did not
  fit the 1920×1080 stage; the title says "MAC → port".
- **Master, not Active.** RFC 9568 renamed Master to Active; the page uses Master (task, course, most literature) and
  says so once in the explanation. Croatian: glavni / pričuvni, state chips "G glavni" / "P pričuvni" (the task's
  "B / M" badges, in each language's letter).
- **Advert frame card** shows Ethernet (destination 01:00:5e:00:00:12, source = virtual MAC) and VRRP (source IP,
  224.0.0.18, priority, virtual IP); the IP layer and the interval field are folded away for space.
- **Seconds** are shown with 2 decimals at 1 s adverts and 3 at 0.1 s, trailing zeros dropped, a decimal comma in
  Croatian (3,61 s; 0,361 s).
- **Colours**: A c1, B c2, switch c3, R1 c4, R2 c5. Grayscale: state carried by chip fill/dash and letters, lost time
  by hatching, broadcast by dashes.

## Deviations from the task

- Buttons → the `event` select; added params `prioR1` and the `start` event (Decisions).
- Added a 7th preset `split` (the `cut` event; rule 7 had a button but no preset).
- Step counts differ from the task's estimates because every takeover is three steps (Decisions):
  `master-fails` 8 (= task), `preempt-back` 8 (task 5), `no-preempt` 4 (= task), `tie` 5 (task 4),
  `clean-shutdown` 7 (task 5), `fast-adverts` 8 (task 6), `split` 8. All ≤ 20.
- Task rule 4 says a higher-priority Backup takes over "when it hears the lower-priority advertisement". RFC 9568
  §6.4.2 says it *discards* that advertisement and takes over when its own timer runs out; SPEC.md and the model
  follow the RFC (Decisions).
- `preempt-back`'s "second short interruption" is a gateway change with 0 s lost in the model (Decisions).
- Task captions: the hr caption is split over the `master-fails` steps (wait, expire, announce, flood); the en caption
  is the `tie` summary word for word.
- Kit view K2 exists, so nothing is drawn by hand except the time line and the router extras.

## Sources

- RFC 9568 (April 2024): §1.1 (Active instead of Master), §5.2.4 (priority 0 and 255), §6.1 (Skew_Time,
  Master_Down_Interval, Preempt_Mode default true, owner always preempts), §6.4.1–6.4.3 (state machine, tie-break
  "unsigned integer comparison" of primary addresses, shutdown sends priority 0), §7.2 and §6.4.3 note (virtual MAC
  as source), §7.3 (00-00-5E-00-01-{VRID}), §5.1.1.2 (224.0.0.18). Checked against the RFC text on 2026-11-08.
- RFC 5227 (ARP announcement); URM `book/chapters/08-mrezni-sloj.md` "Šire o temi" (ARP objava = gratuitous ARP),
  "ARP: od IP adrese do MAC adrese".
- NLA `meta/toc.md` T54 (load distribution and VRRP; chapter not written yet).
- Scene addresses from `sims/arp-local-remote/` (192.168.1.0/24, A .10, B .20, gateway .1, MAC style 02:00:00:…).
  Its model functions are not reused: this sim does no ARP resolution, so nothing was copied. `models/` unchanged.

## Term pairs (missing from `kit/glossary.js`; written out in both tables)

| en | hr |
|---|---|
| Master / Backup (VRRP) | glavni / pričuvni (usmjernik) *(check: task marks it "check")* |
| advertisement | oglas *(check)* |
| preemption | preuzimanje prednosti *(check; the glossary's OS term is "preempcija")* |
| gratuitous ARP / ARP announcement | ARP objava (URM ch08) |
| virtual IP address / virtual MAC | virtualna IP adresa / virtualni MAC |
| default gateway | zadani pristupnik (URM ch08) |
| switch / port / MAC table | preklopnik / priključak / MAC tablica |
| priority | prioritet |

## Shared requests

None.

## Checks

- `node --test sims/vrrp-failover/sim.test.js`: 31 tests (tie-breaks first). 29 mutations of `sim.js` (address
  tie-break, priority order, skew, 3×, preempt on equal, preempt ignored, owner, priority 0, step-down, clamp, GARP
  and advert source MAC, switch learning, host entry changed, GARP adding an entry, skew vs full timer, cut, flap,
  lost time, forwarder up-check, tie expiry, and the 8 below from the review): each failed a test, with the unmodified
  copy passing.
- `npm run gate -- vrrp-failover`: pass (62/62 browser checks). Screenshots reviewed: 1920×1080 light, dark,
  grayscale, 375×812, both languages; extra states of every preset (fail wait/announce/frame/summary, tie flood,
  split flap, preempt-back discard, clean-shutdown priority 0, fast-adverts expiry).

## Review

A fresh reviewer checked SPEC.md against RFC 9568 §6 (no wrong or missing rule, section numbers right) and ran 38
mutants of its own on a copy: 28 caught, 5 equivalent, 8 missed. The 8 now have tests (`review:` in `sim.test.js`): a
Master that steps down restarts its timer; a Backup that shuts down sends no priority 0 and stops its timer; a failed
router leaves the Master state; in a cut the old Master hears nothing; the step-0 timer uses the Backup's own
priority; the tie keeps the last port and R2 asserts with a second advert; `cut` with R2 as the first Master. Also
fixed from the review: `cut` captions named R1 and port 3 when R2 started as Master (now placeholders); `start`
without a tie said "port –" (own caption: the switch has not seen the MAC yet); "the switch delivers its virtual MAC"
→ "sends frames for the virtual MAC"; "the routers send ten times as many" → "the Master sends"; the badge
"potvrđuje se" → "ostaje glavni" / "stays Master". Kept: "brojač" for timer (the reviewer found it acceptable;
"mjerač vremena" is the alternative) *(check)*.

## Time

Start 2026-11-08 11:50 CET, done 12:20 CET: about 30 min of wall clock.
