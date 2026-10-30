<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lateral-movement: specification

One concept: **one admin logon on a workstation exposes the domain.** An attacker with a foothold on a workstation
copies the credentials cached in its memory and reuses them, machine by machine, until a Tier 0 credential opens the
domain controller, or no stolen credential opens another machine. The student follows the credentials hop by hop and
sees what LAPS and tiering each cut.

Task: `docs/tasks/w3/lateral-movement.md`. Catalogue: `sec-lateral-movement` (`docs/catalogue.md` §4.3).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[PTH]** Microsoft, *Mitigating Pass-the-Hash (PtH) Attacks and Other Credential Theft*, v1 (2012) and v2 (2014):
  interactive logons leave reusable credentials (the NT hash) in the memory of the logon process (LSASS); a local
  administrator can read them; the hash is a password equivalent; shared local administrator passwords let one
  dump open many machines; privileged accounts must not log on to less trusted machines. Not re-read for this task:
  section numbers not given *(check)*.
- **[EAM]** Microsoft Learn, *Securing privileged access* and the *Enterprise access model*, with the legacy
  *Active Directory administrative tier model* (Tier 0 identity, Tier 1 servers, Tier 2 workstations; an admin
  account logs on only to assets of its own tier). The current name of the model is the Enterprise access model;
  the page says "tiering" and "Tier 0/1/2", as the task does *(check current title)*.
- **[LAPS]** Microsoft Learn, *Windows LAPS overview*: a unique, rotated password for the local administrator
  account of each managed machine, stored in the directory.
- **[DR]** `dr-lecture-estate`, instructor caveats CV-17 (every interactive logon is a local admin, domain-wide),
  CV-19 (dormant and leaver Domain Admins still enabled), CV-23 (AD not recoverable), scenario S3 (escalation path).
  Used only for the estate's shape (a workstation where admins log on, privileged leavers). No names, numbers or
  answers from them are on the page; the high-tier credential the hop-by-hop path finds sits on an application
  server, not where S3's answer has it.
- **[NK]** `docs/tasks/w3/win-ntlm-vs-kerberos.md` rules 5–6 (the NT hash as a password equivalent; pass-the-hash).
  That sim is not built yet, so nothing is reused from it (NOTES.md).
- **[T]** The task file's "Model and presets".

## Scene

- **Three tier bands**, top to bottom: Tier 0 · identity (DC1), Tier 1 · servers (FS1, APP1), Tier 2 ·
  workstations (WS1, WS2). Each band has its tier colour, a left edge in its own line style (solid, double, dotted)
  and its label, so it reads in grayscale.
- **Machine cards** (kit view K2): the machine, its role, its local Administrator's hash fragment (`#7c1e`, with a
  LAPS tag on a LAPS-managed workstation; the DC has none: "directory: every account's hash"), and **in memory**:
  one chip per cached credential. Chip shape and colour by the account's tier: ◆ Tier 0, ■ Tier 1, ● Tier 2,
  ○ ordinary user (dotted). A logon that tiering refused is a dashed grey chip with the name struck through.
- **Attacker token**: the card where the attacker is has a thick border and a filled badge "attacker · SYSTEM" (or
  "· user" before the escalation). Machines it has been on keep a badge "taken".
- **Edges** from the attacker's machine to every machine it could try next: solid when a held credential works
  there, dashed with a red cross when the only credential it would try fails (LAPS). The path so far is drawn in
  ink. A move or refused try is a packet on its edge, labelled with the credential (name or `#hash`).
- **Attacker panel**: where it is, the path, and **stolen credentials** (hatched chips, best tier first) with the
  kind (NT hash or password) and **opens:** the machines where each works; a machine where it is tried but fails is
  struck through. At the end, the outcome: "Domain compromised" (double red border, ✕) or "Contained at Tier k"
  (green border, ✓).

## State

```
{ nodes: [{ id, tier, role, localAdminHash, cachedCreds: [{ who, tier, kind, leaver? }], refused: [{ who, tier, kind }] }],
  attacker: { at, priv: null | 'user' | 'system', held: [{ who, tier, kind: 'hash' | 'password', local?, hash?, from, all? }],
              visited: [ids], dumped: [ids], tried: [{ via, from, to }], path: [ids] },
  tiering, lapsOnWorkstations, reachedTier0, outcome: null | 'compromised' | 'contained', done,
  last: { kind, n, ... }, log: [events] }
```

Tiers: 0, 1, 2 for admin tiers; `USER` = 3 for an ordinary account (admin nowhere). A held credential's key
(`keyOf`): a domain account by name, a local Administrator by `local:<hash>`.

## The estate

| Machine | Tier | Local Administrator | Logons (without tiering) |
|---|---|---|---|
| DC1 | 0 | none (a DC has no local accounts) | da-admin |
| APP1 | 1 | `#91c2` (own) | srv-admin; old-admin as a scheduled task if `leaverAdmin` |
| FS1 | 1 | `#e58d` (own) | srv-admin |
| WS1 | 2 | `#7c1e` image, or `#3fa9` | ana; da-admin if `daLogsOnWS` |
| WS2 | 2 | `#7c1e` image, or `#d04b` | ivo; srv-admin (a server admin works from their workstation) |

Accounts: ana, ivo (users); srv-admin (Tier 1, admin on APP1 and FS1); da-admin (Tier 0, Domain Admin);
old-admin (Tier 0, a leaver's Domain Admin account, still enabled). Hash fragments are illustrative.

## Rules

1. **Cached credentials are reusable by a local admin** [PTH]: an interactive logon leaves the account's NT hash in
   memory (`kind: 'hash'`); a scheduled task stores the account's password in the machine's secrets
   (`kind: 'password'`). Only an attacker running as SYSTEM can copy them: the dump comes after the escalation. A
   dump also copies the local Administrator's hash. A stolen hash is used as it is (pass-the-hash): no cracking.
2. **One admin logon exposes that admin's rights everywhere** [PTH, T]: `works(c, n)`: a Tier 0 account is admin
   on every machine; a Tier 1 account on the Tier 1 machines; an ordinary user on none; a local Administrator hash on
   every machine whose local Administrator has the same hash.
3. **One local password, or LAPS** [PTH, LAPS]: with `sharedLocalAdmin` every workstation has the image's hash, so
   the dump of one opens the others. With `lapsOnWorkstations` each workstation has its own (LAPS wins over the
   shared toggle). Servers never share the image's password (built one by one); the DC has no local account.
4. **Tiering** [EAM]: with `tiering`, an admin account never logs on to a machine of a lower tier (a higher tier
   number): da-admin is refused on WS1, srv-admin on WS2, old-admin's task on APP1. The refused logons are kept in
   `refused` for the page. Users log on anywhere; Tier 0 still logs on to DC1.
5. **Leavers widen the blast radius** [DR CV-19, T]: with `leaverAdmin` an enabled leaver's Domain Admin account
   runs a task on APP1, one more Tier 0 credential to catch. Without it, the hop-by-hop path stops at Tier 1.
6. **Kerberos** [T]: a ticket stolen from memory is reused the same way (pass-the-ticket). Named in the
   explanation only; not modelled (the task says so).

**What the attacker tries** (`expects`): a domain account exactly where it works (any domain user can read who is
an admin where from the directory); a local Administrator hash on the other machines of the same tier (same image,
maybe the same password), which is where LAPS shows.

**Tie-breaks** (`candidates`), in this order:
- T1 the credential's tier, highest first (the task's rule);
- T2 the target's tier, highest first, then the target's node id (the task's "ties broken by node id"; the target's
  tier comes first so that a Domain Admin goes to the DC rather than to APP1, which sorts before DC1 by id);
- T3 a domain account before a local hash, then the account name, then the key (total order).

A pair already tried and refused, and machines already visited, are not candidates.

## One step

| Kind | When | Effect |
|---|---|---|
| `foothold` | step 1 | attacker on WS1 as user ana (phishing is upstream, out of scope) |
| `escalate` | still user | priv SYSTEM |
| `dump` | on a machine not yet dumped, not the DC | copies its cached credentials and local hash; keeps only what is new (`gained`; a hash already held is in `same`) |
| `compromised` | on DC1, not yet dumped | the directory: every account's hash, krbtgt included; outcome `compromised`, done |
| `move` | best candidate works | attacker on the target as SYSTEM (admin there), added to the path |
| `refused` | best candidate fails | the pair is recorded in `tried`; the attacker stays |
| `stalled` | no candidate left | outcome `contained`, done; `tier` = the highest tier reached |

`reachedTier0` is set when a Tier 0 credential is held. `steps(p)` counts steps until done.

## Presets and expected numbers

Checked with a script over the model before writing the page, and in `sim.test.js`.

| Preset | Params | Steps | Path | Outcome |
|---|---|---|---|---|
| `flat` (defaults) | no tiering, no LAPS, DA on WS1, one image, leaver | **5** | WS1 → DC1 (da-admin) | compromised |
| `laps` | + LAPS | **5** | WS1 → DC1 (da-admin); WS1's local hash would be refused on WS2 | compromised |
| `tiered` | + tiering | **6** | WS1 → WS2 (`#7c1e`), dump WS2 gains ivo only | contained at Tier 2 |
| `both` | + tiering + LAPS | **5** | WS1; `#3fa9` tried on WS2: refused | contained at Tier 2 |
| `chain` | no DA on WS1 | **9** | WS1 → WS2 (`#7c1e`) → APP1 (srv-admin) → DC1 (old-admin's password) | compromised |

Step sequences: `flat` foothold, escalate, dump, move, compromised; `tiered` foothold, escalate, dump, move, dump,
stalled; `both` foothold, escalate, dump, refused, stalled. `chain` without the leaver: WS1 → WS2 → APP1 → FS1,
10 steps, contained at Tier 1. Over all 32 combinations of the five toggles: at most 10 steps (tested); compromised exactly
when a Tier 0 credential was stolen; with tiering always contained.

`sim.json` `steps` is 5 (the defaults, `flat`).

## Captions (the task's, verbatim)

- hr: "Na WS1 je bila prijava domenskog administratora — njegova je vjerodajnica sada u napadačevim rukama." /
  en: "A Domain Admin had logged on to WS1 — that credential is now in the attacker's hands." (the dump that
  gains a Tier 0 credential cached by an interactive logon)
- hr: "Uz slojeve, administrator sloja 0 nikad se ne prijavljuje na radnu stanicu: nema što ukrasti." /
  en: "With tiering, a Tier 0 admin never logs on to a workstation: there is nothing to steal." (the stall, when
  tiering refused a Tier 0 logon on a workstation; with the Domain Admin toggle off, tiering kept nothing of Tier 0
  off a workstation, so the note is not shown)

## Legend

Tier 0, Tier 1, Tier 2, user (credential chips: shape + colour); stolen (hatched); move (solid line); cut (dashed
with ✕); logon refused (dashed chip); changed (the kit's highlight: credentials copied, the machine moved to).
Tier bands are labelled in the drawing; the attacker token is a labelled badge.

## Misconceptions (in the explanation)

The attacker needs the DC's password (no: someone else's cached credential); a strong password stops
pass-the-hash (no: the hash is the password); one compromised PC stays contained (not if an admin logged on to it).

## Out of scope

The initial phishing, any specific tool, Kerberos ticket forging (golden/silver tickets), detection, credential
isolation features, network segmentation (every machine can reach every other's admin ports here).
