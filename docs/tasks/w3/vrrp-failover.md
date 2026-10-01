# vrrp-failover: VRRP failover

| | |
|---|---|
| Task | `vrrp-failover` (wave 3, High availability and distributed systems) |
| Catalogue entry | `ha-vrrp-failover` in `docs/catalogue.md` §4.7 |
| Kind | build a new simulator |
| Folder | `sims/vrrp-failover/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA, URM |
| Topic / tags / level | `distributed` / `fault-tolerance` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `arp-local-remote` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **master election, virtual IP, preemption, gratuitous ARP**.

The student: fail and restore the master.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.7.
5. `sims/arp-local-remote/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T54 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T54 (load distribution and VRRP; chapter not written yet)
- RFC 9568, "Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6" (obsoletes RFC 5798):
  §6 protocol state machine, Skew_Time and Master_Down_Interval, preemption, priority 0 and 255 *(check
  section numbers)*; RFC 5227 (ARP announcement)
- `~/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md`, "ARP: od IP adrese do MAC adrese" →
  "Šire o temi" (gratuitous ARP = ARP objava) and Primjer 5 (ARP request/reply, the gateway)
- Reused model: `docs/tasks/*/arp-local-remote.md` (segment, ARP tables, frames)

## Model and presets

- **Scene:** reuses `arp-local-remote`'s K2 segment: hosts A (192.168.1.10) and B (192.168.1.20) with their
  ARP tables, and a switch with its MAC table (MAC → port). Two routers **R1** (192.168.1.2, priority 200)
  and **R2** (192.168.1.3, priority 100) share the **virtual IP 192.168.1.1** (the hosts' default gateway)
  and the virtual MAC `00:00:5e:00:01:01` (VRID 1). Each router shows its state (Initialize / Backup /
  Master) and its Master_Down timer as a shrinking bar; advertisements are packets every second.
- **State:** reuses `arp-local-remote`'s `{arp, frame}`; new: `{ t, routers: [{id, ip, prio, up, state,
  downTimer}], vip, vmac, preempt, advInterval, switchMac: {mac: port}, lostMs }`.
- **One step:** advance to the next event: an advertisement, a router failing or returning, a timer
  expiring, a state change, the gratuitous ARP, a host frame to the gateway.
- **Rules** (RFC 9568 "Virtual Router Redundancy Protocol (VRRP) Version 3", §6; obsoletes RFC 5798)
  (check section numbers):
  1. The Master sends an advertisement every Advertisement_Interval (default 1 s).
  2. A Backup that hears no advertisement for Master_Down_Interval = 3 × Master_Adver_Interval +
     Skew_Time, with Skew_Time = ((256 − Priority) × Master_Adver_Interval) / 256, becomes Master. Higher
     priority → shorter skew → takes over first.
  3. Election: highest priority wins; equal priority → the higher primary IP address wins (tie-break).
     Priority 255 is reserved for the router that owns the virtual address.
  4. Preempt mode (default on): a Backup with higher priority than the current Master takes over when it
     hears the lower-priority advertisement; with preempt off it stays Backup. The address owner always
     preempts.
  5. A new Master sends a **gratuitous ARP** for the virtual IP with the virtual MAC. Hosts' ARP entries
     do not change (the MAC is the same virtual MAC); the **switch** relearns which port that MAC is on (URM
     ch08 "Šire o temi", ARP announcement; RFC 5227).
  6. A Master that shuts down cleanly sends an advertisement with priority 0; the Backup then takes over
     after Skew_Time only, not the full Master_Down_Interval.
  7. If the routers cannot hear each other but both reach the hosts, both become Master (duplicate gateway;
     link `quorum-split-brain`) (derived).
- **Params:** `prioR2` range 1–254 (100); `preempt` toggle (on); `advInterval` choice 1 s / 0.1 s (1 s);
  buttons "fail R1", "restore R1", "shut down R1 cleanly", "cut R1–R2 link".
- **Presets** (numbers from rule 2; derived, checked by hand):
  1. `master-fails` — R1 (200) is Master, fails right after an advertisement at t = 0: R2's Master_Down =
     3 + 156/256 = **3.61 s**; R2 becomes Master, sends gratuitous ARP; the switch moves the virtual MAC to
     R2's port; host A's ARP table is unchanged; traffic to 8.8.8.8 resumes. ≈ 3.6 s of lost frames.
  2. `preempt-back` — R1 returns: its priority-200 advertisement makes R2 (100) step down; R1 Master again,
     a second short interruption.
  3. `no-preempt` — preset 2 with preempt off: R2 stays Master, R1 stays Backup; no second interruption.
  4. `tie` — both priority 100: R2 (192.168.1.3) wins over R1 (192.168.1.2) by the higher address.
  5. `clean-shutdown` — R1 sends priority 0: R2 takes over after Skew_Time **0.61 s**.
  6. `fast-adverts` — advertisement interval 0.1 s: Master_Down = 0.3 + 0.061 = **0.36 s**.
- **Steps:** `master-fails` 8 (adverts, fail, timer, state change, GARP, switch update, host frame,
  summary); `preempt-back` 5; `no-preempt` 4; `tie` 4; `clean-shutdown` 5; `fast-adverts` 6.
- **Legend (adds to `arp-local-remote`'s):** router state badge (B / M), advertisement (small packet with
  priority), Master_Down timer (bar), gratuitous ARP (broadcast packet, "GARP"), virtual IP/MAC (dashed
  label on the current Master). "Changed" marks state changes and table entries updated in this step.
- **Captions:**
  - hr: „R2 tri sekunde ne čuje oglas (*advertisement*) i postaje glavni usmjernik (*master*). Šalje
    ARP objavu (*gratuitous ARP*): domaćini ne mijenjaju ništa, preklopnik uči novi priključak."
  - en: "Equal priorities, so the higher address wins: R2 at .3 is Master, R1 at .2 is Backup."
- **Terms:** virtual router — virtualni usmjernik; virtual IP — virtualna IP adresa; master / backup —
  glavni / pričuvni (check); priority — prioritet; preemption — preuzimanje prednosti (check);
  advertisement — oglas (check); gratuitous ARP / ARP announcement — ARP objava (URM ch08 „ARP objava");
  default gateway — zadani pristupnik (URM ch08).
- **Misconceptions:** "the hosts change their gateway"; "gratuitous ARP rewrites every host's ARP table"
  (the virtual MAC stays the same; it is for the switch); "failover is instant".
- **Out of scope:** VRRP authentication (removed in v3), IPv6 VRRP (neighbour advertisements), load
  balancing behind the VIP, health-check scripts, specific daemons.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh vrrp-failover sims/vrrp-failover` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/vrrp-failover/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
