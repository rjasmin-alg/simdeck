# kit-rule-table: kit view K4: rule table with the matching row

| | |
|---|---|
| Task | `kit-rule-table` (wave 2a) |
| Owner | coordinator (kit owner) |
| Size | M |
| Depends on | pilot `rule-first-match` merged |
| Licence | AGPL-3.0-or-later |

## Goal

Extract the **rule table with the matching row** from the pilot sim `sims/rule-first-match/` into the kit, so the 22 sims that need it
draw it the same way: an ordered rule list, the packet or request being evaluated, the row being compared highlighted per step, the matching row marked, implicit default shown, and evaluation modes (first match, most specific, deny wins) so the contrast in catalogue §5.1 can be shown.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

`dmz-matrix`, `dns-records`, `lnx-access-decision`, `lnx-firewalld-zones`, `lnx-pam-stack`, `win-access-token`, `win-dhcp-policies`, `win-dhcp-scope-options`, `win-dns-policies`, `win-dns-zone-types`, `win-fgpp`, `win-firewall-profiles`, `win-gpo-loopback`, `win-gpo-precedence`, `win-gpo-security-filtering`, `win-gpo-targeting`, `win-gpo-tattooing`, `win-group-scopes`, `win-ipam-audit`, `win-ipam-reconcile`, `win-ntfs-inheritance`, `win-ntfs-share-effective`

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
