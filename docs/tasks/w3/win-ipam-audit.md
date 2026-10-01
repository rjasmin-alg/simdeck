# win-ipam-audit: Who had this IP at 14:32?

| | |
|---|---|
| Task | `win-ipam-audit` (wave 3, IPAM) |
| Catalogue entry | `win-ipam-audit` in `docs/catalogue.md` §4.5.5 |
| Kind | build a new simulator |
| Folder | `sims/win-ipam-audit/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | WIN2, SEC |
| Topic / tags / level | `windows-admin` / `ip-addressing` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ipam-address-plan` is merged and reuse its model (COMMON.md §6); uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **correlating leases and logon events to find a machine and a user**.

The student: answer an incident question from the audit trail.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.5.
5. `sims/win-ipam-address-plan/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course material. Use the vendor's documentation and standard textbooks; mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.
- Microsoft document titles below are cited from memory, without URLs; confirm each title and the numbers taken from it *(check)*.
- Microsoft, "IPAM: IP address tracking" / "Audit IP address usage" (search by IP, client ID, host name, user name; correlation of DHCP lease events with DC and NPS logon events); "Analyze DHCP Server log files" (audit log format and event IDs, `DhcpSrvLog-<day>.log`); Windows Security event 4768 "A Kerberos authentication ticket (TGT) was requested"
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/18-mrezne-usluge.md`, "Tko dijeli adrese" → "Što poslužitelj pamti" (the lease record: address, hardware address, client ID, expiry, host name)

## Model and presets

- **Scene:** kit view K4 rule table. A question card at the top: "Who had `10.0.40.57` on 28 Sep at 14:32?". Below, three evidence tables on one time axis (08:00–18:00): DHCP lease events (time, event, IP, MAC, host name), logon events from the DCs (time, event, user, client address), and the current DNS record for the address. A reasoning strip shows the chain IP → lease → MAC/host → logon → user, filled in step by step, with each link's evidence row.
- **State:** `question: { ip, at }`, `leaseEvents: [{ t, id: new|renew|release|expire, ip, mac, host }]`, `logonEvents: [{ t, user, clientIp, kind: tgt|logoff }]`, `dnsNow: { name, ip }`, `retentionDays`, `askedDaysAgo`, `chain: [{ link, evidence, ok }]`, `answer: { host, users: [] } | unknown`.
- **One step:** one link of the chain: (1) find the lease that covered `ip` at `at`; (2) read its MAC and host name; (3) find logon events from that IP after the lease start and before `at`; (4) drop users who logged off before `at`; (5) state the answer or why there is none.
- **Rules:**
  1. The lease covering time T is the last "new lease" or "renew" for the IP at or before T that was not followed by "release" or "expire" before T (Microsoft, DHCP Server audit log event IDs 10 new, 11 renew, 12 release, 16/17 deleted/expired (check)).
  2. The MAC (client ID) identifies the device; the host name in the lease is what the client sent and may be wrong or empty.
  3. A logon (Kerberos TGT request, Security event 4768 (check)) records the user and the client address; it ties a user to the IP only during that device's lease.
  4. Several users from the same device before T → several candidates; the trail alone can't decide (needs the workstation's own logon records).
  5. The DHCP server's own audit log keeps about a week (one file per weekday, overwritten (check)); IPAM keeps what it collected for longer (retention configurable (check)). A question older than the retention of every source has no answer.
  6. Current DNS shows who has the name **now**, not who had the address then; it is never evidence for T.
  7. Tie-break: an event exactly at T counts as before T.
- **Params:** `preset` evidence sets (via presets); `at` choice 09:10 / 14:32 / 17:55 (default 14:32); `askedDaysAgo` range 0–14 (default 0); `ipamCollected` toggle (default on).
- **Presets:**
  1. `one-user` — derived, unchecked: 08:12 new lease `10.0.40.57` → MAC `02-AB-CD-0A-0B-07`, host PC-LAB07; 13:05 renew; 08:15 TGT ana from `10.0.40.57`. Answer: PC-LAB07, ana.
  2. `address-reused` — derived, unchecked: PC-LAB07 08:12–11:58 (release), LAPTOP-IVAN new lease 12:30; 12:33 TGT ivan. Answer at 14:32: LAPTOP-IVAN, ivan — taking the day's first lease gives the wrong machine. At 09:10 the answer is PC-LAB07, ana.
  3. `two-users` — derived, unchecked: on PC-LAB07, ana 08:15 and marko 13:50, no logoff events → two candidates; the trail narrows it to one device, not one person.
  4. `too-old` — derived, unchecked: asked 9 days later with `ipamCollected` off → the DHCP server's files for that weekday were overwritten → no answer; on → IPAM still has it.
  5. `dns-trap` — derived, unchecked: DNS now says `pc-lab12 A 10.0.40.57`; the lease trail for 14:32 says PC-LAB07: DNS is about now.
- **Steps:** 5 per question (one per chain link); presets 2 and 3 ask twice: one-user 5; address-reused 10; two-users 5; too-old 5; dns-trap 5.
- **Legend:** evidence rows with a time marker on the shared axis; the row used by the current chain link outlined; links ✓ found / ✕ missing / ≈ ambiguous; the question time as a vertical line. "Changed" marks the chain link added and the evidence row it used.
- **Captions:**
  - hr: "U 14:32 adresu 10.0.40.57 drži *lease* (dodjela) iz 12:30 — LAPTOP-IVAN. Jutarnja dodjela za PC-LAB07 oslobođena je u 11:58."
  - en: "At 14:32 the address 10.0.40.57 is held by the 12:30 lease, LAPTOP-IVAN. The morning lease for PC-LAB07 was released at 11:58."
  - hr: "Dva korisnika prijavila su se s istog računala prije 14:32. Trag dodjela daje stroj, ne osobu."
  - en: "Two users logged on from the same computer before 14:32. The lease trail gives the machine, not the person."
- **Terms:** audit log — revizijski zapisnik; lease — dodjela (UL ch18); client identifier — oznaka klijenta; logon event — događaj prijave; retention — razdoblje čuvanja; correlation — povezivanje (korelacija) zapisa; evidence — dokaz.
- **Misconceptions:** "DNS tells you who had the IP" (only who has the name now); "an IP identifies a person"; "logs are always there when you need them".
- **Out of scope:** NAT and proxies, VPN pools, clock skew between servers, wireless/NPS accounting details, legal handling of evidence.
- **Reuse from `win-ipam-address-plan` (soft dependency):** the IPAM frame and range objects; new: lease and logon event trails and the correlation chain.
- **Note for the coordinator:** the task's tags include `authentication`, which doesn't fit this concept (it seems copied across the IPAM rows); `ip-addressing` (plus `dhcp`/`dns`) looks right.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh win-ipam-audit sims/win-ipam-audit` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/win-ipam-audit/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
