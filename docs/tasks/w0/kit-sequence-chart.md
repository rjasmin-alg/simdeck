# kit-sequence-chart: kit view K1: message sequence chart

| | |
|---|---|
| Task | `kit-sequence-chart` (wave 2a) |
| Owner | coordinator (kit owner) |
| Size | M |
| Depends on | pilot `dhcp-dora` merged |
| Licence | AGPL-3.0-or-later |

## Goal

Extract the **message sequence chart** from the pilot sim `sims/dhcp-dora/` into the kit, so the 31 sims that need it
draw it the same way: lanes per party, one arrow per step with a label and the fields that matter, the current arrow highlighted, an optional "what an eavesdropper sees" overlay, lost/dropped messages, timers on a lane.

## Do

- Add it to `kit/` **additively** (playbook §4: after the first real page, the kit only grows), with tests, a
  section in `docs/sim-ui.md`, and a changelog line.
- Move the pilot onto the kit version; the pilot's screenshots must not change in a way a student would notice.
- Text in HTML or SVG drawn at 1:1 (no `viewBox` scaling of labels), both languages, colour plus shape or
  pattern, reduced motion respected, fits 1920×1080 with 2–6 parties or nodes.
- Before freezing the API, check it against two consumers below with different needs (sketch them, don't
  build them).

## Consumers (from the task files)

`aaa-8021x`, `acme-renewal`, `dhcp-relay`, `dhcp-rogue`, `dns-resolution`, `email-path`, `ftp-active-passive`, `http-exchange`, `ipsec-ike`, `ntp-sync`, `oauth-flow`, `smtp-dialogue`, `ssh-key-auth`, `ssh-tunnels`, `syn-outcomes`, `tcp-retransmit`, `tcp-states`, `tcp-teardown`, `tcp-vs-udp-loss`, `tls-handshake`, `websocket`, `win-dhcp-authorization`, `win-dhcp-dns-update`, `win-dhcp-failover`, `win-domain-join`, `win-domain-logon`, `win-kerberos`, `win-ntlm-vs-kerberos`, `win-smb-session`, `wireguard`, `wpa-handshake`

## Done when

The pilot uses the kit view, the kit tests pass, `docs/sim-ui.md` documents it, and COMMON.md mentions it.
