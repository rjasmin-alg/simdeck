# lnx-netfilter-path: A packet through netfilter

| | |
|---|---|
| Task | `lnx-netfilter-path` (wave 2b, Linux foundations) |
| Catalogue entry | `lnx-netfilter-path` in `docs/catalogue.md` §4.4 |
| Kind | build a new simulator |
| Folder | `sims/lnx-netfilter-path/` |
| Class | stepper |
| Size | M |
| Priority | P1 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `firewall` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **prerouting, input, forward, output, postrouting; where NAT and filter happen**.

The student: send inbound, forwarded and local packets.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T08 (`nftables` u dubinu — tablice, skupovi, otklanjanje kvara u pravilima) (Napredna Linux administracija; chapters not written yet)
- nft(8) man page: "ADDRESS FAMILIES" (ip/inet hooks), "CHAINS" (base chain types and the standard priority table; rule 4), "NAT STATEMENTS" (rule 3) (check)
- nftables wiki: "Netfilter hooks" (rule 1), "Configuring chains" (base chain verdicts; rule 6), "Performing Network Address Translation (NAT)" (rules 2, 7) (check)
- Linux kernel documentation "IP Sysctl" (`net.ipv4.ip_forward`; rule 8) (check)
- RFC 5737 (documentation addresses used in the presets)
- Contrast page: `urm-firewall` (ported from `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html`), one first-match list
- Catalogue seed: NLA T08 → §5.1

## Overlaps (catalogue §5)

- **§5.1 First-match rule evaluation:** Build one rule-table evaluator with presets: router ACL, stateless firewall, pg_hba.conf. Keep netfilter (a path through hooks, not one list), PAM (control flags, not first match), NTFS (deny wins, not first match) and the most-specific-wins rules (win-dhcp-scope-options, win-fgpp) separate, because their rules are different; note the contrast on each page.

## Model and presets

- **Scene:** the classic hook diagram as a decision path (catalogue §7.2 "Decision path"): `prerouting` →
  routing decision → `input` → local process; routing decision → `forward` → `postrouting`; local process →
  `output` → `postrouting`. Each hook box lists the base chains attached to it, sorted by priority, with type
  (`nat`, `filter`) and the rules of the active chain. Around it, a router `rtr` with `eth0` (WAN
  `198.51.100.10`) and `eth1` (LAN `10.0.0.1/24`), an inside server `10.0.0.5`, an outside client
  `203.0.113.7`. The packet is a card with src/dst address and port, rewritten fields marked.
- **State:** `{ packet: { src, sport, dst, dport, proto, iif, oif }, orig: {…}, at: hookName|'route'|'local'|
  'wire'|'dropped', chainIdx, ruleIdx, conntrack: [{ orig, reply, nat }], ipForward: bool, trace: [{ hook, chain,
  rule, verdict }], event }`.
- **One step:** the packet advances by one box: at a hook, all base chains at that hook run in priority order
  (one step per hook, the trace lists each chain's verdict); at the routing decision, the output interface is
  chosen. The order within a step: match rules top-down → apply the verdict → apply any NAT to the packet card →
  move.
- **Rules:**
  1. Paths: to a local address: `prerouting` → route → `input`; through the router: `prerouting` → route →
     `forward` → `postrouting`; locally generated: `output` →  `postrouting`.
  2. The routing decision after `prerouting` looks at the destination *after* DNAT: a packet to `198.51.100.10:8080`
     DNATed to `10.0.0.5:80` goes through `forward`, not `input`.
  3. DNAT happens in `prerouting` (and `output` for local traffic); SNAT/masquerade in `postrouting`. So the
     `forward` filter sees the new destination and the old source.
  4. Within a hook, base chains run in ascending priority: `dstnat` −100, `filter` 0, `srcnat` 100 (the standard
     priority table). Tie-break for equal priority: order undefined in nft; the model runs them by
     chain name and shows a warning (check).
  5. Within a chain, rules run top-down; the first `accept`/`drop` ends that chain; no match → the chain's
     policy (default `accept`). This is first match per chain, not for the whole path (contrast §5.1).
  6. `accept` ends only the current base chain: the packet continues to later chains at the same hook and to
     later hooks; `drop` is final everywhere.
  7. NAT chains see only the first packet of a connection; conntrack applies the same translation to the rest
     and reverses it for replies.
  8. With `ip_forward` = 0, a packet whose route is not local is dropped at the routing decision and never
     reaches `forward` (check, Sources).
- **Params:** `ipForward` toggle, default on; `inputPolicy` choice `accept`/`drop`, default `drop`;
  `fwdRule` choice `dport 80` / `dport 8080` / none, default `dport 80` (which port the forward chain allows;
  shows rule 3).
- **Presets:**
  1. `inbound-ssh` (derived, unchecked): `203.0.113.7` → `198.51.100.10:22`. `prerouting` (dstnat: no match) →
     route: local → `input` (filter: `tcp dport 22 accept`) → the local SSH server. 4 steps.
  2. `port-forward` (derived, unchecked): `203.0.113.7` → `198.51.100.10:8080`; `prerouting` DNAT to `10.0.0.5:80`
     → route: `eth1` → `forward` (filter: `tcp dport 80 accept`) → `postrouting` → wire. With `fwdRule` =
     `dport 8080` the packet is dropped in `forward`. A rule in `input` never sees it. 5 steps.
  3. `masquerade` (derived, unchecked): `10.0.0.5:50000` → `203.0.113.7:443`; `prerouting` → route: `eth0` →
     `forward` accept → `postrouting` masquerade: src becomes `198.51.100.10` → wire; the reply packet is
     un-NATed by conntrack without visiting the nat chain (rule 7). 7 steps.
  4. `local-out` (derived, unchecked): `rtr` itself opens a connection to `203.0.113.7`: `output` → route → `postrouting` → wire;
     `input` and `forward` stay dark. 4 steps.
  5. `accept-not-final` (derived, unchecked): two base chains on `input`, `filter` priority 0 with `tcp dport 22
     accept` and `extra` priority 10 with policy `drop` → the ssh packet of preset 1 is dropped. 4 steps.
  6. `no-forwarding` (derived, unchecked): preset 3 with `ipForward` off → dropped at the routing decision. 3 steps.
- **Steps:** 4, 5, 7, 4, 4, 3.
- **Legend:** hook boxes (lit = visited, dark = not on this path), chain type tags (`nat`, `filter`), verdict
  shapes (✓ accept, ✕ drop, ↷ NAT rewrite); "changed" highlight marks the packet field rewritten this step and
  the rule that matched.
- **Captions:** hr: "*DNAT* (prevođenje odredišne adrese) u `prerouting` promijenio je odredište u
  `10.0.0.5:80` prije odluke o usmjeravanju — zato paket ide kroz `forward`, a ne `input`." en: "DNAT in
  `prerouting` changed the destination to `10.0.0.5:80` before the routing decision, so the packet goes through
  `forward`, not `input`."
- **Terms:** hook — kuka (check); chain — lanac; rule — pravilo; verdict — presuda (check); routing decision —
  odluka o usmjeravanju; connection tracking — praćenje veza (check); packet filtering — filtriranje paketa (URM book);
  network address translation — prevođenje mrežnih adresa (URM book); stateful firewall — vatrozid sa stanjem (URM book).
- **Misconceptions:** a port-forward needs an `input` rule; `accept` in one chain means the packet is accepted;
  SNAT/masquerade changes the source before the filter sees it.
- **Out of scope:** `ingress`/`egress` hooks, the bridge and netdev families, `raw`/`mangle`/`route` chains
  (listed by priority only), conntrack helpers, sets and maps, the older rule syntax, firewalld (`lnx-firewalld-zones`),
  container port publishing (`lnx-container-ports`).
- **Note for the coordinator:** no course text yet (NLA T08 has no chapter; UL never mentions netfilter or
  nftables), so all presets are derived and every rule rests on nft(8)/nftables wiki only (Sources); Croatian terms
  need the NLA author.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `lnx-netfilter-path` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh lnx-netfilter-path sims/lnx-netfilter-path` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/lnx-netfilter-path/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
