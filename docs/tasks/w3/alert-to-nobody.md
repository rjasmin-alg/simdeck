# alert-to-nobody: The alert that reaches nobody

| | |
|---|---|
| Task | `alert-to-nobody` (wave 3, Storage, backup and disaster recovery) |
| Catalogue entry | `dr-alert-to-nobody` in `docs/catalogue.md` §4.6 |
| Kind | build a new simulator |
| Folder | `sims/alert-to-nobody/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | DR |
| Topic / tags / level | `storage` / `disaster-recovery` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **the alert path depends on the system that failed**.

The student: fail the site, follow the alert.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.6.

## Sources

- `/home/rjasmin/projects/dr-lecture-estate/student/scenarios/S1.md` (DR estate scenario)
- Catalogue seed: DR S1
- DR estate (student side only): `student/scenarios/S1.md` and `S5.md` (loom dies, Sat 04:12);
  `student/configs/hq/watchtower/kuma-notification.json` (SMTP via 10.40.1.5 to one address) and
  `kuma-monitors.csv` (every monitor notifies the same address); `student/configs/hq/hq-mon01/alertmanager.yml`
  (webhook to a chat relay on hq-mon01); `student/inventory/hq.md` and `hosts.csv` (watchtower on squall,
  hq-mon01 on hq-pve-04, loom = SMTP relay + chat server); `student/configs/pfx/pfx-zbx/summary.txt`
  (mails a personal address); `student/handbook/constraints.md` (leave dates); `handbook/it-wiki.md`
  ("Everything important is monitored and alerts by email" — the claim to test)
- `~/projects/napredna-linux-administracija/meta/toc.md` T37 ("uzbuna koja se ne ignorira")
- faultline `js/engine/graph.js` (gate `all` = series dependency) for rule 1

## Model and presets

- **Scene:** a map of sites (HQ, colo, cloud, external mail provider) and, drawn across it, the **alert
  path** as a chain of hops: *monitor* → *sender/relay* → *mailbox or chat* → *person*. Each hop sits in
  the site where it actually runs. An alert travels as a token hop by hop; the person at the end has a
  status (on duty / on leave / asleep). A "silence" indicator for an outside watchdog, if one exists.
- **State:** `{ sites: {id: {up}}, hops: [{id, kind, site, up}], paths: [{id, hops: id[]}], person: {name,
  available}, token: {path, at, delivered|null}, watchdog: {site, expectsEveryMin}|null, t }`.
- **One step:** (1) a failure (a site or one host) is applied; (2) the monitor notices; (3) the alert token
  moves one hop per step; (4) it stops at the first dead hop or is delivered; (5) the watchdog (if any)
  reports missing heartbeats.
- **Rules:**
  1. An alert is delivered only if every hop on its path is up: the path is a series system; its
     availability is the product of the hops' (derived; faultline `graph.js` gate `all`).
  2. A hop in the failed site is down; a monitor that lives in the site it watches dies with it and sends
     nothing (DR S1: monitors at HQ).
  3. A sender that relays through the failed host cannot report that host's failure (DR S5: the
     availability monitor mails via `loom`, and `loom` is what died).
  4. Delivery to a mailbox is not delivery to a person: the recipient must be available (DR
     `handbook/constraints.md`: the only recipient is on leave from 2026-11-23).
  5. Silence is detectable only from outside: a watchdog in another failure domain that expects a heartbeat
     every N minutes raises the alarm when it stops (dead man's switch) (derived; standard practice) (check).
  6. Tie-break: when several paths exist, the alert counts as delivered if any one reaches an available
     person (paths are alternatives, hops in a path are a series).
- **Params:** `failure` choice HQ site / `loom` only / cloud region (HQ site); `watchdog` toggle (off);
  `secondPath` toggle "relay outside HQ + a second person" (off); `recipient` choice on duty / on leave (on
  leave).
- **Presets** (DR estate student material; the path from the configs named in Sources):
  1. `s1-hq-power` — S1, Thursday 2026-11-26 14:05: the availability monitor (`watchtower`, VM on `squall` at
     HQ) and the metrics monitor (`hq-mon01`, on `hq-pve-04` at HQ) are both down: **no alert is ever sent**;
     the external mailbox is up and empty.
  2. `s5-loom-dies` — S5, Saturday 04:12: the monitor at HQ is up and sees `loom` and `loom-smb` fail, but it
     sends mail through the SMTP relay on `loom` (10.40.1.5): **the alert dies at hop 2**.
  3. `metrics-to-chat` — the metrics monitor's alerts go by webhook to a chat relay on `hq-mon01` and then to
     the chat server on `loom`: any `loom` failure silences them too (DR
     `configs/hq/hq-mon01/`, `inventory/hq.md`).
  4. `on-leave` — the path works (a non-HQ failure), the mail arrives in the mailbox of the one person it is
     addressed to, who is on parental leave: **delivered to nobody**.
  5. `fixed` — watchdog in the cloud expecting a heartbeat every 5 min + relay outside HQ + a second person:
     S1 is noticed by the watchdog at **≤ 5 min** and reaches someone (derived).
- **Steps:** `s1-hq-power` 4 (fail, nothing notices, mailbox empty, summary); `s5-loom-dies` 5;
  `metrics-to-chat` 5; `on-leave` 6; `fixed` 6.
- **Legend:** hop (box with its site colour **and** site label), dead hop (crossed), alert token (envelope),
  stopped token (envelope with "✕"), person on leave (grey with "odsutan"), watchdog (clock icon). "Changed"
  marks the hop the token reached in this step.
- **Captions:**
  - hr: „Nadzor (*monitoring*) radi i vidi da je `loom` pao — ali poštu šalje preko `loom`a. Uzbuna stane
    na drugom koraku."
  - en: "The whole HQ is dark, and both monitors were in it. The mailbox outside is fine; nothing will ever
    arrive in it."
- **Terms:** alert — uzbuna (NLA T37 „uzbunjivanje"); alert path — put uzbune; monitoring — nadzor (praćenje);
  relay — posrednik (relej) (check); heartbeat — signal života; dead man's switch — sklopka mrtvaca (check;
  or „nadzor tišine"); on-call — dežurstvo.
- **Misconceptions:** "we have monitoring, so we will know"; "the mail was sent, so someone was told";
  "monitoring the monitor is paranoia".
- **Out of scope:** alert routing rules and grouping, escalation policies in depth, notification products,
  the SLO side of alerting (`slo-error-budget`).

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh alert-to-nobody sims/alert-to-nobody` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/alert-to-nobody/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
