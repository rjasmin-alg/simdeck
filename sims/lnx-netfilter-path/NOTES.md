<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-netfilter-path: notes

New stepper (task `docs/tasks/w2/lnx-netfilter-path.md`, catalogue `lnx-netfilter-path`, wave 2b). There is no kit
"decision path" view, so the page draws the hook diagram in HTML (a CSS grid of boxes with arrow tracks); the chains
of the current hook are kit view **K4** (`Simdeck.ruleTable`, mode `first`, the chain's policy as the implicit row),
one table per chain in run order. Rules and expected numbers: `SPEC.md`.

## Decisions

- **One param picks the packet** (`packet`: `ssh-in`, `port-fwd`, `lan-out`, `local-out`), plus the task's three
  params (`ipForward`, `inputPolicy`, `fwdRule`) and two more: `reply` (the reply walks the diagram after the packet
  arrives; needed for rule 7 on the page) and `extra` (`none` / `10` / `0`: the second input chain of preset 5 and
  its priority, so the rule 4 tie-break can be shown on the page, not only in the tests).
- **One step per box**, including the end boxes: the packet at `local` or `out`, or in the `dropped` bin, is a step of
  its own (the drop is decided at the hook or routing step, the next step shows it gone and says why it is final).
- **The routing decision for local traffic comes before `output`** (`local → route-out → output → postrouting`).
  nft(8)'s `route` chain type ("a new route lookup is performed if relevant parts of the IP header have changed")
  implies the lookup happens before `output`, and the nftables wiki's hook diagram draws it there. The task wrote
  `output → route → postrouting`; the step count (4) is the same.
- **The ruleset is one small `ip` table** (SPEC.md "Ruleset"): `nat_pre`, `filter_in`, `filter_fwd`, `nat_post`, and
  the optional `extra`. `output` has no base chain, so the local-out packet shows "no base chain: the packet passes".
  The filter chains start with `ct state established,related accept`, so the reply is accepted by state; the
  masquerade rule matches only the LAN (`ip saddr 10.0.0.0/24 oif eth0`), so the router's own packet is not
  rewritten.
- **The `extra` chain** has one rule (`ip saddr 10.0.0.0/24 accept`) and policy drop: an admin who meant "only the LAN
  may reach the router" and did not see that `filter_in`'s accept is not final. The task gave it only the policy.
- **Conntrack** is shown as a small table (original tuple, expected reply tuple, NAT kind, state). An entry appears
  at the packet's first hook (`prerouting` or `output`), is removed when the packet is dropped (never confirmed),
  and turns `established` when the reply passes. A skipped nat chain shows what conntrack did in its place.
- **Rewritten fields** on the packet card: the field rewritten in this step is highlighted (kit changed mark); a
  field that differs from the packet as sent has a dashed outline and the old value struck under it. `oif` is set by
  the routing decision and highlighted then.
- **Rule text is data**: generated from the model's rule objects (`iif eth0 tcp dport 8080`, `dnat to 10.0.0.5:80`),
  monospace, `translate="no"`. In a K4 row that was read and failed, the failing match parts are struck with ✕ by the
  page (the K4 `miss` would strike the whole match cell).
- **Concepts, not tools**: the page names netfilter (the Linux kernel framework the concept is about), the hooks,
  conntrack and `net.ipv4.ip_forward`; it never names the packet-filter front end. Rule syntax is shown because the
  rules are the subject.
- **Panel fit**: six presets in two columns (as `amdahl`), short preset and option labels, one hint (`extra`). The
  panel measures exactly its height at 1920×1080 in both languages; a longer label would make it scroll.

## Deviations from the task

- **`masquerade` is 10 steps**, not 7: the reply walks five boxes (prerouting, route, forward, postrouting, out) like
  any packet. The other five presets match the task (4, 5, 4, 4, 3). Defaults (`ssh-in`) are 4 (`sim.json` `steps`).
- **Local traffic: route before `output`** (Decisions).
- **Params added**: `packet`, `reply`, `extra` (Decisions). State: `at` names the box; a drop sets `at: 'dropped'` and
  `dropAt` to where it happened; `visited` lists the boxes lit for this packet; the `route` box after prerouting and
  the `route-out` box for local packets are separate.

## Sources

- nft(8), nftables v1.0.9, read on this machine: "IPV4/IPV6/INET ADDRESS FAMILIES" (Table 1, the hooks), "CHAINS"
  (Table 5 types incl. "Only the first packet of a connection actually traverses this chain"; Table 6 standard
  priorities; "lower priority values have precedence"; policy accept by default), "VERDICT STATEMENT" (accept "can
  still be dropped later by another hook … or another forward base chain that has a higher priority number"; drop
  "no further chains or hooks are evaluated"), "NAT STATEMENTS" (where snat/masquerade/dnat are valid; "All future
  packets in this connection will also be mangled").
- nftables wiki pages "Netfilter hooks", "Configuring chains", "Performing NAT" *(check: not reachable offline; every
  rule above rests on the man page)*.
- Linux "IP Sysctl" `ip_forward`; the drop at the input route lookup with forwarding off *(check: from memory of
  `ip_route_input_slow`, not re-read)*.
- Equal priorities: nft(8) does not say; "order undefined" is the task's statement *(check)*.
- Conntrack's reverse translation points (dst at prerouting/output, src at postrouting/input) and the removal of an
  unconfirmed entry on drop *(check: from memory of the kernel's nf_nat/nf_conntrack core, not re-read)*.
- RFC 5737 documentation addresses. No course text (NLA T08 has no chapter).

## Checks

- Numbers printed by a script from the model before the page was written (the six presets and eight other
  combinations; maximum 10 steps over all 864 param combinations), asserted in `sim.test.js`.
- **Mutations**: 26 one-at-a-time mutations of `sim.js` (chain order descending, tie by reversed name, no tie flag,
  accept final, drop not final, last match, policy ignored, routing on the pre-DNAT address, ip_forward ignored,
  ip_forward dropping local delivery, nat chains on every packet, no conntrack translation, NAT points swapped,
  masquerade not rewriting, DNAT without the port, conntrack reply tuple not updated, entry kept on drop, reply not
  established, iif and saddr matches ignored, shortest prefix, input leading to out, reply on the wrong interface,
  ip_forward checked for local output, `extra` priority and `fwdRule` ignored): all **26** fail a test.
- `npm run gate -- lnx-netfilter-path`: pass (manifest, tests, build, 63 browser checks, tokens, scope). Screenshots
  at 1920×1080 light, dark, grayscale and 375×812, hr and en, reviewed; plus every preset at its key steps with a
  local Playwright script. Fixed from them: the panel scrolling (two-column presets, shorter labels, fewer hints), a
  caption losing its first chain name (one DOM node used twice), "conntrack translates" overflowing a hook box (a
  short verdict on its own line), a doubled ▶ in the K4 pointer chip, the route table repeating "destination" on
  every row, `ip_forward = 0` printed twice in the route box, `oif` wrapping to a third row on the packet card.
- **Not run on a machine** *(check)*: the presets are derived from the man page, not captured from a router.
- **Fresh review** (a separate agent read the task, SPEC.md, model, tests, strings and page against nft(8); it
  confirmed the model and ran 17 mutations of its own, 10 survived: 7 equivalent with this ruleset, 3 real gaps).
  Fixed from it: tests for a dropped reply keeping its established entry, the reply's input interface, and the
  conntrack lookup at `output` for a local reply (all three mutations now fail); the drop caption claiming "the
  connection is not recorded" for a dropped reply (`cDroppedReply`); hosts named by side (outside / inside host)
  instead of client / server, which was wrong for `lan-out` and `local-out`; the explanation's "every filter sees the
  old source" (now the filter in `forward` and everything before `srcnat`) and DNAT in `output` (the route is looked
  up again); "not tracked yet" on the card when the lookup simply has not happened, and "removed" after a drop; the
  tie warning ("the documentation does not fix the order"); Croatian captions saying "praćenje veza" instead of
  "conntrack"; "Zatim i odgovor", "Drugi lanac na kuki input", "LAN prolazi, ostalo drop", "filtar" throughout, the
  *chain* term introduced before "bazni lanac"; the English legend as verbs like the Croatian one.

## Term pairs

None of these is in `kit/glossary.js`; the Croatian explanation writes the term rule out by hand
(`<i lang="en">hook</i> (kuka)`), captions use the Croatian words. For the coordinator to add with `"src": "simdeck"`:

| en | hr | source |
|---|---|---|
| hook | kuka | task *(check)* |
| chain | lanac | task |
| routing decision | odluka o usmjeravanju | task |
| connection tracking | praćenje veza | task *(check)* |
| stateful firewall | vatrozid sa stanjem | task (URM book) |
| verdict | presuda | task *(check)*; used as the K4 column header |
| masquerade | maskiranje | this sim *(check)* |
| DNAT | prevođenje odredišne adrese | task caption |

`packet filtering` and `network address translation` (URM book) are not used as terms on the page.

## Shared requests

- A kit **decision path** view (catalogue §7.2, ~15 consumers: SELinux, netfilter, SPF/DKIM/DMARC, boot chain): this
  page and `lnx-selinux-decision` both draw boxes with arrows in a CSS grid by hand.
- K4 (`ruletable.js`): strike individual parts of one match cell (a rule's text has several match expressions); the
  page does it itself with `.nf-miss`.

## Time

Start 2026-10-15 11:39, done 12:05 (CEST): about 26 minutes, one session, including the fresh review.
