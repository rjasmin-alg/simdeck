<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# syn-outcomes: specification

One concept: **a SYN gets a SYN+ACK, an RST or nothing, and what each means (port scanning)**. The student probes
ports on a host behind a firewall and reads only what comes back. Task: `docs/tasks/w3/syn-outcomes.md`; catalogue
`net-syn-outcomes` (§4.1). Model: `sim.js`; tests: `sim.test.js`.

## Scene

Kit view K1 with three lanes: **Klijent** (C, the client that probes) · **Vatrozid** (F, a firewall on the path, or
"none on this path") · **Poslužitelj** (S, the target of the current probe; its card shows the address and port).
Under the target, a **port strip** (the scene's ports: listening / nothing listening / blocked by a rule) and in the
firewall card its **rule list**: both are what the client cannot see, hidden until `reveal` is on. To the right a
**results table**, one row per finished probe: target and port, what came back, verdict, what it proves (with
`reveal`: also what was really there).

## State

`{ n, cur, ev, probes: [{ name, addr, port, as, phase, reply, verdict, retries, path, fwRule, fwAction }], chart: [...],
timers: [...], table: [...], done }`. `chart` is every event so far (the K1 rows), `ev` the newest one, `cur` its probe.
`timers` are the client's retransmission timers over chart rows. Times are ms since the probe's own first SYN
(each probe is its own little capture).

Scenario data (from the hidden param `scene`, set by the presets): per target `{ addr, exists, listening: [ports],
strip, fw: { rules: [{ port, action }], dflt } | null, rtt }`; per probe `{ target, port, as? }`. Rule actions are
`allow` and `block`; what `block` does is `fwAction` (`drop`, `reject-icmp`, `reject-rst`), or the probe's own `as`.

## One step

One event on the chart for the current probe, in order: (1) the client sends the SYN (seq X); the firewall's
decision and the host's processing happen in the same step (they are not separate messages); (2) the reply reaches the
client, or for silence the next step is a SYN retransmission; (3) for an open port the client's own last message (ACK,
or RST in half-open mode). **The probe's last step also writes its verdict row.** Then the next probe starts.

| Outcome | Steps | Rows |
|---|---|---|
| open (SYN+ACK) | 3 | SYN; SYN+ACK; ACK (connect) or RST (half-open) |
| closed (RST from the host or the firewall) | 2 | SYN; RST+ACK |
| ICMP reject | 2 | SYN; ICMP 3/13 |
| silence (drop or no host) | 3 | SYN; SYN again; SYN a third time |

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | **Firewall first, first match wins, then the default policy**; with two rules for one port the earlier wins (tie-break: rule order). `allow` passes; `block` is `fwAction`: `drop` discards silently; `reject-icmp` answers with ICMP Destination Unreachable type 3 code 13 "communication administratively prohibited"; `reject-rst` answers with a TCP RST+ACK in the host's name (same address, same numbers as the host's own, rule 4). The firewall is stateful: the reply to an allowed SYN passes back. `firewall` off removes every firewall from every path. | URM ch15 "Tri ishoda", ch18 "odbij po zadanome" and Primjer 5 (stateful); RFC 1812 §5.2.7.1 (code 13); iptables-extensions(8) REJECT `--reject-with tcp-reset` *(check: a real filter's RST carries the same seq/ack as the host's)* |
| 2 | **No host at the address → silence.** Nothing answers (TEST-NET 192.0.2.1 in the book's capture). A router's ICMP host unreachable is out of scope. | URM ch15 "Tri ishoda" (third outcome), capture figure; RFC 5737 |
| 3 | **Listening → SYN+ACK** seq Y, ack X+1. The client then sends ACK seq X+1 ack Y+1 (`scan: connect`) or RST seq X+1 (`half-open`: the connection is never completed). | URM ch13 Primjer 3 (X = 4000, Y = 9500), ch15 first outcome; RFC 9293 §3.5 |
| 4 | **Host present, nothing listening (CLOSED) → RST+ACK, seq 0, ack X+1**: "if the connection does not exist (CLOSED), a reset is sent in response to any incoming segment except another reset"; the SYN has no ACK, so the reset is `<SEQ=0><ACK=SEG.SEQ+SEG.LEN><CTL=RST,ACK>` and the SYN counts one. | RFC 9293 §3.5.2, §3.10.7.1; URM ch15 quotes it |
| 5 | **Silence → retransmission** of the same SYN (same seq) with RTO 1 s, doubling: +1 s, +2 s (the third SYN at 3 s), a timer of 4 s after it; the page shows **two retransmissions** and then gives up (the 4 s timer is drawn expired on the third SYN's row, the step that writes the verdict). The book's capture (`book-capture`) keeps its own gaps, 1.029 s and 1.024 s. | RFC 6298 §2.1 (1 s), §5.5 (back-off); URM ch15 capture ("dva ponovljena SYN-a") |
| 6 | **Verdict** from what came back: SYN+ACK → **open**; RST → **closed**; no reply after the retransmissions, or ICMP type 3 code 1, 2, 3, 9, 10 or 13 → **filtered**. (Other ICMP codes: no verdict; none occurs here.) | RFC 9293 behaviour; URM ch15; the code list is the task's, a port-scanning convention, not from an RFC *(check)*: RFC 1122 §4.2.3.9 calls 0, 1, 5 soft errors and 2, 3, 4 hard. Only code 13 occurs on the page |
| 7 | **What it proves** (ranking C > B > A): SYN+ACK → an application accepts connections on the port; RST → the host and its TCP layer are alive; ICMP 3/13 → a filter on the way refused it (the ICMP comes from the filter's address); silence → nothing definite (no host, or a drop on the way). **Tie-break:** a `reject-rst` firewall makes a blocked port look **closed** and the client reads "host alive": the client cannot tell its RST from the host's. Only `reveal` shows who sent it. | URM ch15 Primjer 2 *(check: the reject-rst case is derived)* |

**Params.** `firewall` toggle (default on; disabled with a reason in scenes without a firewall); `fwAction` (default
`drop`; disabled when no blocked probe uses it); `scan` `connect` / `half-open` (default `connect`); `reveal`
(default off). Every param but `reveal` restarts at step 0; `reveal` only changes the view, so a class can read the
capture first and then reveal the truth at the same step (a deviation from the task, which restarts on every change).

**Seeing it from the client (reveal off).** Silent SYNs are drawn as stopping short, half way to the firewall lane
(✕ in empty space) whatever the cause, the firewall card says its rules are not visible, the host card shows only the address, and an RST from a
`reject-rst` firewall is drawn from the host's lane, as the client sees it. With `reveal` on, a dropped SYN ends in ✕
at the firewall, a SYN to no host ends in ✕ at a dashed "no device" card, the forged RST comes from the firewall lane,
and the deciding rule is marked in the firewall card. The RST caption is the client's reading ("to the client this
means: the host exists …"), true for the host's own RST; for a forged one, `reveal` adds who sent it.

## Presets and expected numbers

Checked with a script before the page, and in `sim.test.js`.

| Preset | Probes and results | Steps |
|---|---|---|
| 1 `book-three` | After URM ch15 Primjer 2 (adapted: the book's capture A has one repeated SYN after about 10 s; here rule 5 applies, as everywhere), port 8080 on three servers (documentation addresses, RFC 5737). **C** 198.51.100.10: SYN 4000, SYN+ACK 9500/4001, ACK 4001/9501 → open. **B** 198.51.100.20: SYN, RST+ACK 0/4001 (step 5) → closed. **A** 203.0.113.30: SYN at 0, 1 s, 3 s, no reply → filtered (step 8). Hidden truth: a firewall in front of A allows only 443 (default deny), and A does listen on 8080. Firewall off: A is open (8 steps). | 3 + 2 + 3 = **8** |
| 2 `book-capture` | The capture figure: 172.66.147.243:80 SYN 0, SYN+ACK 0/1 at 7.203 ms, ACK 1/1 at 7.236 ms → open; 192.168.1.1:59999 SYN, RST+ACK at 0.628 ms → closed; 192.0.2.1:80 SYN at 0, 1.029 s, 2.053 s → filtered (no host). Relative numbers as the capture shows them (x = y = 0). | 3 + 2 + 3 = **8** |
| 3 `behind-firewall` | 192.168.2.20, on another network than the client (the firewall routes between them, so its ICMP has an address of its own), listening on 22 and 80; rules 22 block, 80 allow, 8080 allow, default block. 22 → filtered (an SSH server listens), 80 → open, 8080 → closed. `reject-icmp` or `reject-rst`: 22 takes 2 steps (7). | 3 + 3 + 2 = **8** |
| 4 `drop-vs-reject` | Port 22 of the same host three times, `as` drop, reject-icmp, reject-rst: filtered (silence), filtered (ICMP 3/13 after 10 ms), **closed** (RST+ACK 0/4001 from the firewall after 10 ms). | 3 + 2 + 2 = **7** |
| 5 `no-host` | 192.0.2.1, ports 22 and 80: both silent, both filtered, exactly like a drop. | 3 + 3 = **6** |

Times: derived scenes have an RTT of 20 ms to the host and 10 ms to the firewall; the client's ACK leaves when the
SYN+ACK arrives. Every combination of params stays within 3 to 20 steps (at most 9: `drop-vs-reject` without
firewall, three open probes).

**The capture's details** *(check)*: the analyzer shows the RST+ACK as "Seq=1 Ack=1" in relative numbers; the absolute
seq of a reset to a SYN is 0 (rule 4), and the page shows 0. The retransmissions in the capture are about 1 s apart,
not doubling: the capturing host retransmitted its first SYNs at a fixed 1 s (some current kernels do,
`tcp_syn_linear_timeouts`); RFC 6298 doubles. The book's Primjer 2 speaks of "ten seconds of nothing". The page keeps
the capture's numbers for its preset and the RFC's elsewhere.

## Misconceptions shown

1. No answer means the host is down: `book-three` A and `behind-firewall` 22 listen behind a drop (`reveal`).
2. A closed port means a firewall blocked it: RST comes from a live TCP stack (`book-three` B, `behind-firewall`
   8080); only a `reject-rst` filter imitates it (`drop-vs-reject`).
3. "Filtered" is a fact about the host: it is about the path (`no-host` and a drop look the same).

## Out of scope

UDP scanning, other probe types, any scanning tool, OS fingerprinting, rate limits, ICMP from routers for missing
hosts (→ `icmp-messages`), the stateful firewall's rule logic (→ `stateful-firewall`, `rule-first-match`), closing
the connection after a connect probe.
