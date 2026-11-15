<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-gpo-slow-link: spec

One concept: **when the link to the domain controller is slower than the slow-link threshold (500 kbit/s by
default), the client skips some client-side extensions (Software Installation, Folder Redirection, Scripts, Disk
Quotas) and still applies the others (Administrative Templates and Security always); a branch office on a fast WAN
link is not a slow link.**

Task: `docs/tasks/w3/win-gpo-slow-link.md` (catalogue §4.5.2). Explorer (no steps). The extensions are drawn with kit
view K4 (rule table, `kit/ruletable.js`, marks set by the page) under a scene drawn by the page: the client `PC07`,
the link with its speed dial (log scale, the threshold marked, the slow zone hatched) and the domain controller `DC01`.

## Scene

| Thing | Data |
|---|---|
| Client | `PC07`, user `ana`; the pass is a foreground pass (startup and logon) or a background refresh |
| Link | the speed the client estimates to `DC01`, in kbit/s, on a ladder of 17 notches (log scale) |
| Threshold | the "Configure Group Policy slow link detection" value, kbit/s |

## Params

| Param | Values | Default | Note |
|---|---|---|---|
| `speed` | 0–16, an index into `SPEEDS` (below) | 14 = 200 000 kbit/s | the task's `speedKbps` 0–1 000 000 (log scale): the kit's range has no log scale, so the slider moves along a ladder of notches and the model reads `speedKbps = SPEEDS[speed]` (deviation, NOTES.md) |
| `thresholdKbps` | 0–5 000, step 100 | 500 | 0 = detection off |
| `allowScripts` | off / on | off | "Allow processing across a slow network connection" for Scripts |
| `pass` | `foreground`, `background` | `foreground` | |

`SPEEDS` (kbit/s): 56, 128, 256, 384, 500, 768, 1 000, 1 500, 2 000, 5 000, 10 000, 20 000, 50 000, 100 000,
200 000, 500 000, 1 000 000. It holds the four values the presets and the tie-break need: 384 (the VPN), 500 (equal to
the default threshold), 200 000 (the branch) and values on both sides of every threshold notch up to 5 000.

## Rules

1. **Slow or fast.** `slow = threshold > 0 && speedKbps < threshold`. Default threshold 500 kbit/s; threshold 0 turns
   detection off (every link is fast). Since Windows Vista the speed is estimated by Network Location Awareness, not
   by pings. *Source: Microsoft Learn, "Configure Group Policy slow link detection" (policy reference: "If you type 0
   all connections are considered to be fast … the system uses the default value of 500 kilobits per second"; text
   seen in search snippets of the policy text, title checked); "GPOs and Slow Link Detection" (Microsoft Learn
   archive blog: NLA replaces ICMP since Vista).*
   **Tie-break T1:** speed equal to the threshold is **fast** ("slower than" is strict) *(check)*.
   **Tie-break T2:** threshold 0 wins over any speed, also the slowest notch (56 kbit/s).
2. **Always applied.** Administrative Templates (registry-based policy) and Security settings are applied over a slow
   link, and this cannot be changed (padlock). *Source: "Specifying Group Policy for Slow Link Detection" (Windows
   Server 2003 TechNet, table 2.6: Security cannot be turned off) and "Group Policy and Slow Links"; Administrative
   Templates: same sources.*
3. **Applied by default, can be turned off.** EFS recovery and IP security are applied over a slow link by default
   *(check: EFS; IP security in table 2.6)*. The Drive Maps preference extension too: its policy says that, when not
   configured, Drive Maps items are allowed to process across a slow network connection *(check: read only in a
   mirror of the policy text)*.
4. **Skipped by default.** On a slow link, Software Installation, Folder Redirection, Scripts and Disk Quotas are
   skipped *(check: Disk Quotas)*. *Source: the 2003 table and "Group Policy and Network Bandwidth" (Software
   Installation, Scripts, Folder Redirection).*
5. **Allow across a slow link.** Each configurable extension has "Allow processing across a slow network
   connection"; on, it runs on a slow link as on a fast one (rule 4 off for it). The page offers it for Scripts
   (`allowScripts`); the model takes it for any configurable extension (`allowSlow`), and ignores it for the two
   always-applied ones.
6. **Not in this pass.** Software Installation and Folder Redirection run only in a foreground pass (startup, logon);
   in a background refresh they are *not in this pass* whatever the speed (`win-gpo-processing` rule 3: they apply
   only in a synchronous foreground pass). **Tie-break T3:** "not in this pass" wins over "skipped for a slow link"
   (a background refresh on a slow link shows them grey, not with the snail).

Per extension and per link (fast, slow) the model gives `ran`, `skipped` (slow link) or `notInPass`; the row's
`now` is the one for the current link.

## The extensions (table order, the task's)

| id | Extension | Over a slow link | Foreground only |
|---|---|---|---|
| `registry` | Administrative Templates | always (padlock) | no |
| `security` | Security settings | always (padlock) | no |
| `efs` | EFS recovery | by default | no |
| `ipsec` | IP security | by default | no |
| `scripts` | Scripts | not by default; `allowScripts` | no |
| `folders` | Folder Redirection | not by default | yes |
| `software` | Software Installation | not by default | yes |
| `quotas` | Disk Quotas | not by default | no |
| `drivemaps` | Drive Maps (preference) | by default *(check)* | no *(check, NOTES.md)* |

## Expected numbers (checked with a Python hand model before coding, NOTES.md)

| Preset | speed | threshold | allowScripts | pass | slow | ran | skipped | not in pass |
|---|---|---|---|---|---|---|---|---|
| `branch-200mb` | 200 000 | 500 | off | fg | no | 9 | 0 | 0 |
| `vpn-384k` | 384 | 500 | off | fg | yes | 5 (registry, security, efs, ipsec, drivemaps) | 4 (scripts, folders, software, quotas) | 0 |
| `threshold-0` | 384 | 0 | off | fg | no | 9 | 0 | 0 |
| `allow-scripts` | 384 | 500 | on | fg | yes | 6 (+ scripts) | 3 (folders, software, quotas) | 0 |

More: 500 at 500 → fast, 9 ran (T1); 384 at 500 in a background refresh → 5 ran, 2 skipped (scripts, quotas), 2 not in
this pass (T3); 200 000 at 5 000 → fast; 2 000 at 5 000 → slow.

**Flipped rows.** Moving from `branch-200mb` to `vpn-384k` flips scripts, folders, software and quotas (ran →
skipped); turning `allowScripts` on there flips scripts (skipped → ran).

## Misconceptions shown

- "A branch office means a slow link": the branch at 200 Mbit/s is fast; only the speed against the threshold counts.
- "On a slow link no policy applies": five of nine still run at 384 kbit/s.
- "Security settings can be skipped over a slow link": the padlock; `allowSlow` has no effect on them.

## Out of scope

Roaming profiles and offline files over slow links, remote-access specifics, how the bandwidth is measured, the
DirectAccess "treat as fast" policy, the "Always treat WWAN connections as a slow link" option, the separate user-profile
slow-link threshold.
