# dhcp-dora: DHCP DORA and the lease

<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->

Task: `docs/tasks/w2/dhcp-dora.md` (catalogue `net-dhcp-dora`, §4.1). Class: stepper. Pilot of kit view
**K1: message sequence chart**.

**One concept:** discover/offer/request/ack, T1/T2 renewal, expiry.

Sources, short names used below: **UL** = Uvod u Linux `book/chapters/18-mrezne-usluge.md`, "Tko dijeli adrese";
**URM** = Uvod u računalne mreže `book/chapters/14-aplikacijski-sloj.md`, "DHCP: DORA slijed…"; **RFC** = RFC 2131,
options RFC 2132.

## Scene

| Lane | Address | Notes |
|---|---|---|
| C, client `democli1` | MAC `52:54:00:37:ea:d6` | UL "Što poslužitelj pamti" (the Kea lease line) |
| A, server | 192.168.180.1, pool .100, .101, .102 | UL: the client got .100; `routers` = .180.1 (UL "Što se uz adresu još dijeli") |
| B, plain server (param) | 192.168.180.2, pool .150, .151, .152 | UL figure `dhcp-cetiri-poruke.svg` (two servers); .150 is the task's number |
| B, partner of A (param) | 192.168.180.2, A's pool | hot standby: holds a copy of A's bindings (derived, *check*) |

Options every server sends with OFFER and ACK: 1 mask 255.255.255.0, 3 router 192.168.180.1, 6 DNS 192.168.180.1
(after the option change: 192.168.180.53, derived), 51 lease time, 54 server identifier (RFC 2132 §3.3, 3.5, 3.8,
9.2, 9.7). OFFER and ACK carry `yiaddr`; the REQUEST after an offer carries option 50 (requested address) and 54
(RFC §4.3.2 "SELECTING").

Messages take no time: DORA happens at t = 0. Time jumps from timer to timer.

## State

```
{ t, p: { lease, bcastFlag },
  client: { state: INIT|SELECTING|REQUESTING|BOUND|RENEWING|REBINDING|OFF, addr, serverId, leaseStart, lease,
            t1, t2, exp, retry, retried, opts, startAt, acks },
  servers: [{ id, ip, up, partner, pool: [addr…], leases: [{ addr, mac, expires }], offered: { addr, mac } | null, opts }],
  msgs: [{ n, t, type, kind, from, to: [ids], bcast, cause, src, dst, f: { ciaddr, yiaddr, chaddr, flagB, o50, o51,
           o54, opts }, state: flight|done|lost, lost: [ids], got: [ids], ignored: [ids], react: { id: what }, freed }],
  rows: [{ kind: 'msg', n } | { kind: 'note', t, lane, what }],   // the chart, one row per message or event
  queue: [n…], events: [{ at, kind: down|opt|off|release, srv, done }], hist: [{ at, state }], last, done }
```

`OFF` (the computer left) is added to the task's state list; an OFF client keeps `addr` for the display only.
`lostAddr` is the address dropped at the last expiry (the caption says whether the new one differs). `last` says what the step did, for the caption.

## One step

Exactly one protocol event, in this order of checks:

1. a scripted event due at the current `t` (server down, option change, client leaves);
2. else the oldest message in flight is delivered and its receivers react (a reaction may send messages);
   **offers that answer the same DISCOVER are delivered together** (see rule 3);
3. else `t` moves to the next timer and it fires: the earliest of the next scripted event, the client's timer
   (start, T1, retry, T2, expiry), and a server's lease expiry (servers that are up). Ties at the same time: scripted
   event, then client, then servers in list order.

A message whose receivers are all down is lost when it is sent (✕) and needs no delivery step.

## Rules

1. **DISCOVER is broadcast** from 0.0.0.0:68 to 255.255.255.255:67 by a client without an address; the client
   enters SELECTING (RFC §4.1, §4.4.1; UL "Četiri poruke", "Portovi 67 i 68").
2. **Every server that is up and has a free address offers** (DHCPOFFER with `yiaddr`, option 51, option 54). It
   offers the client's existing binding if it has one, else the first pool address nobody holds or was offered. The
   offer is remembered as `offered`, not as a binding (RFC §3.1 step 2: it need not reserve it; UL "Drugo"). A full
   pool stays silent. *Tie-break:* servers answer in list order (A, then B). A failover partner on standby stays
   silent while A is up (derived).
3. **The client takes the first offer it receives** and broadcasts DHCPREQUEST with option 54 = the chosen server and
   option 50 = the offered address (RFC §3.1 step 3, §4.3.2; UL "Treće"). *Tie-break:* A's offer is first (rule 2's
   order); offers from the same DISCOVER arrive in the same step and every later one is ignored.
4. **The named server records the binding** `{ addr, mac, expires: t + lease }`, clears its offer and sends DHCPACK;
   **a server that sees a REQUEST naming another server frees its offered address** (RFC §3.1 step 4; UL "Četvrto").
   A partner gets a copy of every binding A records, extends or deletes (derived).
5. **OFFER and ACK to a client without an address are broadcast** (to 255.255.255.255:68) when the client set the
   BROADCAST flag (param, default on, as in URM's picture); without it they are unicast to `yiaddr`:68 / `chaddr`.
   To a client with an address (`ciaddr`) they are unicast. NAK is broadcast (RFC §4.1).
6. **T1 = 0.5 × lease, T2 = 0.875 × lease**, from the moment the ACK arrives; options 58/59 are not sent. Exact: RFC
   §4.4.5 says the times SHOULD get a random fuzz; the model leaves it out and the explanation says so (UL "Koliko
   dodjela traje": 600 → 300 and 525).
7. **At T1 the client enters RENEWING and unicasts DHCPREQUEST** (`ciaddr` set, no option 54) to the server that
   gave the lease, from addr:68 to server:67. That server, if it has the binding, extends it and ACKs by unicast; the
   ACK **restarts the lease from now** (RFC §4.3.2 "RENEWING", §4.4.5).
8. **At T2 the client enters REBINDING and broadcasts DHCPREQUEST** (`ciaddr` set, no option 54). A server that has
   this binding extends it and ACKs; **a server without it stays silent** (RFC §4.3.2 "REBINDING", *check*: the RFC
   says "MUST remain silent" for INIT-REBOOT and "SHOULD check ciaddr" for REBINDING; silence for an unknown lease is
   the model's reading).
9. **Retry once.** With no answer in RENEWING or REBINDING, the client sends the REQUEST again after half the time
   left to the next timer (T2, or expiry), at least 60 s; if that is not before the next timer, no retry (RFC
   §4.4.5). **One retry per state is the model's simplification** (the task's rule): the RFC keeps retransmitting on
   the same rule, so a real client in `server-dies` would also send at 472.5 s. The explanation says so.
10. **At expiry the client drops the address, returns to INIT and sends DHCPDISCOVER in the same step** (RFC §4.4.5).
    If no server offers (all down, or the DISCOVER is lost), the client stays in INIT and the run ends; the caption
    says many hosts then give themselves a link-local address from 169.254.0.0/16 (RFC 3927, *check*: no OS named).
11. **NAK and RELEASE.** A server asked to renew a binding it does not have answers DHCPNAK (*check*: RFC §4.3.2 only
    says the server SHOULD check `ciaddr`; the model's reading); a NAK received while REQUESTING, RENEWING or
    REBINDING sends the client to INIT and it starts again with DISCOVER at once. DHCPRELEASE (unicast, `ciaddr`) deletes the binding at once
    (RFC §3.1, §4.3.2, §4.4.6; UL "Dva su koraka izvan tog niza"). No preset reaches a NAK; a test drives it.

Other events:

- **Server down** (`failAt`): A stops; messages to it are lost (✕). It never comes back in this model.
- **Option change** (`optChange`): at lease / 8 every server's option 6 becomes 192.168.180.53; the client sees it
  only in its next ACK (UL "Što se uz adresu još dijeli": the server changes more than the address).
- **Client leaves** (`leave`): at 5/12 of the lease (2 h → 50 min, UL Primjer 3) the client goes OFF; with
  `release` it first unicasts DHCPRELEASE. Switched off without it, the binding stays until its `expires`, when the
  server deletes it (a step).

## End of a run

The run ends at the first step after which: the client is BOUND by an ACK after the first one (a renewal, a rebind,
or a new DORA after expiry) and no scripted event is pending; or the client is in INIT with nothing more to try; or
nothing is left to happen. `steps(params)` replays to that point.

## Params

| Key | Type | Values | Default |
|---|---|---|---|
| `lease` | choice, resets | 600 s, 7200 s (2 h), 691200 s (8 days) | 600 |
| `serverB` | choice, resets | `none`, `plain`, `partner` | `none` |
| `failAt` | choice, resets | `none`, `t1` (A down at T1 − 10 s), `t2` (A down at T2 − 10 s of the first lease) | `none` |
| `leave` | choice, resets | `stay`, `off`, `release` | `stay` |
| `optChange` | toggle, resets; disabled while `failAt` ≠ none (one story at a time) | | off |
| `bcastFlag` | toggle | | on |

The task's `serverB` toggle became a three-way choice, to tell a plain second server from a failover partner (the
misconception "the second server is a backup"); `leave` and `optChange` are added to reach the `classroom-2h` and
`windows-8d` outcomes. Every one of the 324 combinations ends in at most 20 steps (`sim.test.js`).

## Presets and expected numbers (checked by script and `sim.test.js`)

| # | Id | Params | Steps (task) | Outcome |
|---|---|---|---|---|
| 1 | `lease-600` | defaults | 8 (8) | DORA at 0 s; RENEWING at 300 s, ACK; new T1 600 s, T2 825 s, expiry 900 s; BOUND |
| 2 | `two-servers` | serverB plain | 8 (7) | A offers .100, B .150; client takes A, B's offer ignored; B frees .150 on the REQUEST; renewal at 300 s goes to A only |
| 3 | `server-dies` | failAt t1 | 11 (11) | A down at 290 s; RENEW 300 s ✕, retry 412.5 s ✕, REBIND 525 s ✕, retry 585 s ✕ (60 s minimum; half of 75 s is 37.5 s), expiry 600 s → DISCOVER ✕, INIT |
| 4 | `rebind-to-b` | serverB partner, failAt t1 | 11 (9) | B silent at DISCOVER (standby), copies A's binding; RENEW ✕ ×2; REBIND 525 s reaches B, B ACKs; BOUND on B, lease 525–1125 s |
| 5 | `no-backup` | serverB plain, failAt t1 | 17 (new) | as 2, then as 3, but B hears the REBIND (525 s) and its retry (585 s) and stays silent; expiry 600 s → DISCOVER, B offers .150 → BOUND on B with a different address |
| 6 | `classroom-2h` | lease 7200, leave off | 7 (7) | T1 1 h, T2 1 h 45 min; off at 50 min without RELEASE; A keeps .100 until 2 h (70 min more) and deletes it at 2 h |
| 7 | `windows-8d` | lease 691200, optChange | 9 (7) | T1 4 d, T2 7 d; DNS changed at 1 d; the client keeps the old DNS until the renewal ACK at 4 d (new T1 8 d, T2 11 d, expiry 12 d) |

The task's step counts were derived and unchecked; this model counts a delivery that only changes the receiver
(the ACK that binds the client) as its own step. Differences: `two-servers` 8 (the run goes on to the renewal, which
shows that it is unicast to A only), `rebind-to-b` 11 (a lost RENEW retry, the REBIND, B's ACK and its arrival are
four steps), `windows-8d` 9 (the option change is a step, and the renewal is three).

Arithmetic (600 s lease, A down): T1 300; retry 300 + max(60, (525 − 300)/2) = 412.5; T2 525; retry 525 + max(60,
(600 − 525)/2) = 585 < 600; expiry 600. `failAt t2` without B: renewal at 300 s succeeds (T1 600, T2 825, expiry 900),
A down at 515 s, RENEW 600 ✕, retry 712.5 ✕, REBIND 825 ✕, retry 885 ✕, expiry 900 → INIT: 14 steps.
Longest run: plain B with `failAt t2`, 20 steps.

## Legend

Solid arrow = unicast, dashed arrow with a head at every receiver = broadcast, ✕ = lost (receiver down); server
badge ▲ up / ▼ down (a down server's card and lifeline are dashed/dotted). Lease bar: BOUND solid, RENEWING diagonal
hatch, REBINDING vertical bars, OFF fine hatch; the server's record as a dashed box; the future of the current lease
faint. Changed: the newest message's name (yellow + ink outline), the client's state box, a changed lease record,
the "now" label and the newest lease-bar segment.

## Out of scope

Relay and `giaddr`, rogue servers, DHCPDECLINE and the ARP probe, INIT-REBOOT, DHCPv6, option contents beyond
1/3/6/50/51/54, retransmission of DISCOVER, a server that comes back up.
