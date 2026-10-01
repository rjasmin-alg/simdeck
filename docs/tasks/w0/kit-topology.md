# kit-topology: kit view K2: topology with moving packets

| | |
|---|---|
| Task | `kit-topology` (wave 2a) |
| Owner | coordinator (kit owner) |
| Size | M |
| Depends on | pilot `arp-local-remote` merged |
| Licence | AGPL-3.0-or-later |

## Goal

Extract the **topology with moving packets** from the pilot sim `sims/arp-local-remote/` into the kit, so the 27 sims that need it
draw it the same way: nodes (host, switch, router, server, AP) and links in HTML/SVG at 1:1, a packet moving per step with its headers shown, link and node failure, per-node tables beside the node.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

`arp-spoofing`, `bgp-hijack`, `bgp-path-selection`, `broadcast-storm`, `cdn-anycast`, `cgnat`, `db-replication`, `domains`, `hop-rewrite`, `intervlan-routing`, `lnx-policy-routing`, `lnx-routing-decision`, `multicast-igmp`, `packet-journey`, `quorum-split-brain`, `raft`, `route-summarisation`, `static-default-route`, `stp`, `sync-async-replication`, `traceroute`, `vlan-trunk`, `vrrp-failover`, `wifi-roaming`, `win-ad-backup-restore`, `win-ad-replication`, `win-ad-sites`

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
