# lateral-movement: Lateral movement and tiering

| | |
|---|---|
| Task | `lateral-movement` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-lateral-movement` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/lateral-movement/` |
| Class | stepper |
| Size | M |
| Priority | P2 |
| Courses | WIN2, SEC |
| Topic / tags / level | `security` / `attacks` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `win-ntlm-vs-kerberos` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **one admin login on a workstation exposes the domain**.

The student: follow credentials hop to hop; apply tiering.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/win-ntlm-vs-kerberos/` (the model this one builds on) and its `NOTES.md`.

## Sources

- **Instructor-only material is cited below** (`dr-lecture-estate/instructor/`). Use it to get the model right; never put its answers, caveat texts or numbers on the page, and don't turn a scenario's model answer into a preset: students work these scenarios.
- Local material: DR estate (below) for the realistic estate. Use Microsoft documentation for the mechanism; mark every rule you could not check with *(check)* and list it in `NOTES.md`.
- Catalogue seed: → §4.5
- Microsoft: *Mitigating Pass-the-Hash (PtH) Attacks and Other Credential Theft* (v1 and v2); *Securing privileged access* / Enterprise Access Model (the tier model) *(check current title)*; *Windows LAPS*.
- `/home/rjasmin/projects/dr-lecture-estate/instructor/caveats.md` CV-17 (interactive logon = local admin, domain-wide), CV-19 (dormant/leaver Domain Admins), CV-23 (AD not recoverable); `instructor/scenarios/S3.md` (escalation path).
- Catalogue §4.5 (`win-ntlm-vs-kerberos`, the reused model) and `sec-lateral-movement` → `win-laps`.

## Model and presets

- **Scene:** a small AD estate as a graph: a workstation (WS1), a few servers, a file server, and a domain
  controller, drawn in admin tiers (Tier 2 workstations, Tier 1 servers, Tier 0 DC/identity). Each node shows the
  credentials cached in its memory (LSASS) as chips: local users, and any admin who has logged on there. The
  attacker token sits on a node; edges it can use (SMB/WMI/RDP with a stolen credential) light up. A tiering
  toggle enforces that Tier 0 admins never log on to lower tiers. Stepper.
- **State:** `{ nodes: [{id, tier, localAdminHash, cachedCreds: [{who, tier}]}], attacker: {at, held:
  [{who, tier, kind: 'hash'|'ticket'|'password'}]}, tiering, lapsOnWorkstations, reachedTier0, log: [] }`.
- **One step:** 1 initial foothold: attacker runs as a normal user on WS1 (phishing, out of scope upstream);
  2 local privilege escalation to local admin / SYSTEM on WS1; 3 dump cached credentials from WS1 (LSASS);
  4 if a higher-tier admin recently logged on there, the attacker now holds that credential; 5 move: reuse the
  stolen credential (pass-the-hash / pass-the-ticket) to authenticate to the next node; 6 repeat dump → move;
  7 reach a node where a Domain Admin's credential is cached, or the DC itself; 8 outcome: domain compromised, or
  blocked (tiering / LAPS cut an edge).
- **Rules:**
  1. Credentials of whoever logs on interactively are cached in memory and can be reused by a local admin on that
     machine (pass-the-hash, Microsoft *Mitigating Pass-the-Hash Attacks*; NTLM hash is a password-equivalent,
     links to `win-ntlm-vs-kerberos`).
  2. One admin login on a compromised workstation exposes that admin's rights everywhere the credential is valid
     (catalogue concept; DR estate CV-17: a GPO makes every interactive logon a local admin, domain-wide).
  3. Reuse of the same local administrator password/hash across machines lets one dump authenticate to all of
     them (pass-the-hash); LAPS gives each machine a unique rotated local admin password, breaking that edge
     (feeds `win-laps`; Microsoft *Windows LAPS*).
  4. Tiering: Tier 0 (identity) admins must never log on to Tier 1/2 assets, so their credentials are never cached
     where a lower-tier compromise can reach them (Microsoft *Securing privileged access / tier model*
     *(check current naming: Enterprise Access Model)*).
  5. Dormant/leaver privileged accounts widen the blast radius: more cached high-tier credentials to catch (DR
     CV-19: 10 of 16 Domain Admins dormant, leavers enabled).
  6. Kerberos path: a stolen service/TGT ticket moves the same way (pass-the-ticket); overreaching this is out of
     scope, named only.
  Tie-break: when several reusable credentials are held, the attacker picks the highest tier first; ties broken by
  node id.
- **Params:** `tiering` toggle (off); `lapsOnWorkstations` toggle (off); `daLogsOnWS` toggle (on: a Domain Admin
  has a cached session on WS1); `sharedLocalAdmin` toggle (on: same local admin password everywhere).
- **Presets:**
  - `flat` tiering off, DA cached on WS1, shared local admin: foothold → DA in ~3 hops → DC. The catalogue's core
    scenario; from DR CV-17/CV-19 (estate shape), path derived.
  - `laps` same but LAPS on workstations: the shared-local-admin hop is cut; the attacker still reaches the DA
     because that credential is cached (LAPS alone is not enough). Derived; feeds `win-laps`.
  - `tiered` tiering on, DA never logs on to WS1: no high-tier credential to steal, movement stalls at Tier 2.
     From the tier model.
  - `both` tiering + LAPS: foothold stays local; domain intact. Derived.
- **Steps:** `flat` 8, `laps` 8, `tiered` 6, `both` 5.
- **Legend:** tier band (Tier 0/1/2), cached credential chip (by tier colour + shape), stolen credential
  (hatched chip held by the attacker), usable edge (solid), blocked edge (dashed + cut mark), attacker token,
  changed (kit highlight on credentials dumped or edges used this step).
- **Captions:** hr: "Na WS1 je bila prijava domenskog administratora — njegova je vjerodajnica sada u napadačevim
  rukama." / en: "A Domain Admin had logged on to WS1 — that credential is now in the attacker's hands." — hr:
  "Uz slojeve, administrator sloja 0 nikad se ne prijavljuje na radnu stanicu: nema što ukrasti." / en: "With
  tiering, a Tier 0 admin never logs on to a workstation: there is nothing to steal."
- **Terms:** lateral movement — bočno kretanje *(check)*; pass-the-hash — *pass-the-hash* (ponovna uporaba
  sažetka) *(check)*; credential — vjerodajnica; privilege escalation — eskalacija ovlasti; domain controller —
  kontroler domene; tiering — raslojavanje administrativnih ovlasti *(check)*; least privilege — najmanja ovlast;
  Domain Admin — administrator domene.
- **Misconceptions:** an attacker needs the DC's password (they reuse admins' cached credentials); strong
  passwords stop pass-the-hash (the hash is the password); one compromised PC is contained by itself.
- **Out of scope:** the initial phishing (`mfa-phishing`), specific tooling, Kerberos ticket forging
  (golden/silver tickets) beyond a mention, EDR detection.
- **Builds on `win-ntlm-vs-kerberos`:** reuses its credential/hash and authentication-token model; new are the
  estate graph, tiers, credential caching per node and the attacker's reuse logic.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh lateral-movement sims/lateral-movement` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lateral-movement/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
