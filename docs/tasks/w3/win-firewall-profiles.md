# win-firewall-profiles: Windows Firewall profiles

| | |
|---|---|
| Task | `win-firewall-profiles` (wave 3, Files, identity and the rest) |
| Catalogue entry | `win-firewall-profiles` in `docs/catalogue.md` §4.5.7 |
| Kind | **add a preset to `sims/lnx-firewalld-zones/`** (no page of its own) |
| Folder | `sims/lnx-firewalld-zones/` |
| Class | stepper |
| Size | S |
| Priority | P3 |
| Courses | WIN1 |
| Topic / tags / level | `windows-admin` / `firewall` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `lnx-firewalld-zones` merged; only one preset task per host folder at a time; uses kit view K4 rule table once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **domain/private/public profile selection by network**.

The student: move a laptop between networks.

This is a **preset on `lnx-firewalld-zones`** (firewalld zones), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.5.7.
5. `sims/lnx-firewalld-zones/` (the host page) and its `NOTES.md`.

## Sources

- No Windows course book yet. Use Microsoft documentation (titles below) and mark every number and rule you could not check with *(check)* in `NOTES.md`.
- Catalogue seed: → §5.16
- Microsoft Learn: "Windows Firewall overview", "Windows Firewall profiles" / "Configure Windows Firewall rules" (profile scope), Network Location Awareness (NLA) service; "Windows Firewall with Advanced Security" *(check titles)*.
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md`, „Vatrozid: zone, usluge i odluka o otvaranju porta" and Šire o temi (the host's rules; terms *zona*, *zadana zona*).
- Host spec: `docs/tasks/w3/lnx-firewalld-zones.md`, Model and presets.

## Overlaps (catalogue §5)

- **§5.16 Firewall zones:** One page, two presets; both pick a rule set by where the packet comes from.

## Model and presets

- **Preset task on `lnx-firewalld-zones`.** Same stage: senders on the left, the picker table in the middle, the
  chosen rule set's card and verdict on the right. Windows labels: zones become the three **profiles** (Domain,
  Private, Public); the host `PC07` (laptop, domain-joined to `quillmoor.example`) has `Wi-Fi` and, in one
  preset, a VPN adapter.
- **What the host model must support:**
  1. Data-driven rule sets with their own names and a default inbound action per set (host has `zones` with
     `target`; Windows default is block inbound, allow outbound *(check)*; map block to the host's `DROP`, since
     Windows Firewall drops silently by default *(check)*).
  2. A **binding row decided by detection**, not by an address: "Domain if a domain controller of the joined
     domain is reachable and authenticated through this adapter; else the category the network was given
     (Private or Public); a new, unidentified network → Public" (Microsoft "Windows Firewall profiles", Network
     Location Awareness *(check)*). The host's rows are source prefix → interface → default; this preset needs a
     row type `detect: {dcReachable}` on the interface binding.
  3. One active profile per adapter; several adapters may have different active profiles at once (since
     Windows 7 / Server 2008 R2 *(check)*); each packet is judged by the profile of the adapter it arrives on.
  4. Rules scoped to profiles: a rule lists the profiles it applies to (e.g. "File and Printer Sharing (SMB-In)"
     enabled for Domain and Private only).
- **State additions:** `adapters: [{name, network, category: 'private'|'public', dcReachable}]`; the packet's
  `iif` picks the adapter; the zone is computed from rule 2 above.
- **Rules (Windows side):** as above, plus: the profile is re-evaluated when the network changes (the move is a
  configuration step, like the host's commands) (derived).
- **Presets (added to the host):**
  - `win-office` PC07 on the office Wi-Fi, DC reachable → Domain; colleague's SMB 445/tcp → allowed by "File and
    Printer Sharing" (enabled for Domain). Derived, unchecked rule set.
  - `win-home` same laptop at home, network set to Private, no DC → Private; SMB still allowed (rule enabled for
    Private). Derived.
  - `win-cafe` café Wi-Fi, new network → Public; SMB 445 → no matching rule for Public → blocked silently
    (timeout). Derived from rules 1–2.
  - `win-vpn` café Wi-Fi (Public) plus VPN adapter that reaches the DC (Domain): SMB from the café network →
    blocked; from the office through VPN → allowed; two profiles at once. Derived *(check rule 3)*.
- **Steps:** `win-office` 4, `win-home` 4, `win-cafe` 4, `win-vpn` 6 (packet → profile pick → rule check →
  verdict; plus a network-change step where the laptop moves).
- **Legend:** as the host, with profile icons (building = Domain, house = Private, globe = Public); changed: the
  binding row that chose the profile and the rule line that decided.
- **Captions:** hr: "Nova, nepoznata mreža: Windows je stavlja u profil Public, a pravilo za dijeljenje datoteka
  ondje nije uključeno." / en: "A new, unknown network: Windows puts it in the Public profile, where the file
  sharing rule is not enabled." — hr: "Kroz VPN je dostupan kontroler domene: to sučelje dobiva profil Domain,
  Wi-Fi ostaje Public." / en: "The domain controller is reachable through the VPN: that adapter gets the Domain
  profile, the Wi-Fi stays Public."
- **Terms:** firewall — vatrozid (UL ch15); firewall profile — profil vatrozida; zone — zona (UL ch15); domain
  controller — kontroler domene; network location — mrežna lokacija *(check)*; inbound rule — ulazno pravilo;
  default zone — zadana zona (UL ch15).
- **Misconceptions:** the profile follows the computer, not the network; Public means "more open"; one profile
  for the whole machine.
- **Out of scope:** outbound rules, IPsec connection security rules, GPO deployment of rules, `netsh`/PowerShell
  syntax beyond one caption.
- **Note for the coordinator:** the host spec has no detection-based binding; request a `detect` binding row
  type (or a precomputed `zoneOf(iif)` hook) in `lnx-firewalld-zones` before this preset lands.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-firewalld-zones/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
