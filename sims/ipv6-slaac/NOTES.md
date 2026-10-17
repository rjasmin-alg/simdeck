<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipv6-slaac: notes

New stepper (task `docs/tasks/w2/ipv6-slaac.md`, catalogue `net-ipv6-slaac`, §4.1, wave 2b). Rules, tie-breaks and
expected numbers: `SPEC.md`. The messages on the link are drawn with kit view **K1, message sequence chart**
(`kit/sequence.js`); the task names no view, and K1 gives the time column and the RetransTimer bar.

## Decisions

- **Layout.** Three columns. Left: H's address list (each address with its state mark, scope, state tag and
  lifetimes; at the end, what it is used for), the groups H has joined, the default router, and under them the card
  of the newest message (type, source, destination with the group's name, target, flags, who in the group takes it,
  the RA's prefix option). Centre: the K1 chart with lanes N, H, R. Right: the bit strip (MAC, insert `ff:fe`, flip
  the U/L bit with the first octet in binary, the interface ID, the link-local and global addresses as 8 groups of
  prefix bits and interface ID bits, the solicited-node group with the low 24 bits underlined).
- **H in the middle lane.** H's notes ("link-local: tentative") are centred on its lifeline and need room on both
  sides; the lanes read neighbour, host, router.
- **The message card sits under the address list**, not under the chart: under the chart the RA card (eleven lines)
  pushed the oldest rows out.
- **Multicast to non-members.** Every node sees the frame; the chart ends the arrow in ✕ at a node not in the
  destination group, without a word (the words of two receivers overlapped in lanes this narrow). The message card
  says who is in the group and who is not listening. Members get a word only when they act: "not mine" (in the group,
  the target is not its address), "mine!", "answers", "processes".
- **The RetransTimer** is the striped bar on H's lifeline from the NS to the "preferred" note (✕: expired) or to the
  NA (double cap: stopped). Its label is "1 s"; the name RetransTimer is in the caption. "RetransTimer 1 s" as the
  label covered N's word in the same row.
- **Time** counts from H's first NS, without the random start-up delays (RFC 4862 §5.4.2 and RFC 4861 §6.3.7 allow
  0–1 s before the first NS and the RS, and §6.2.6 up to 0.5 s before the RA). The RS and the RA are at 1 s, the
  global address preferred at 2 s.
- **N and R.** R has `fe80::1` and `2001:db8:1::1`; N has `fe80::2`. "N already holds H's address": for the
  link-local, N's only link-local is H's (a cloned interface with the same MAC); for the global, N has `fe80::2` and
  H's global (set by hand). With the global variant N is in H's solicited-node group from the start, so it also
  takes the first NS (for the link-local) and stays silent: rule 10 shows up without being staged.
- **The three MACs:** `00:1a:2b:3c:4d:5e` (task), `02:00:00:00:00:01` (task; locally administered, and its
  solicited-node group `ff02::1:ff00:1` is R's too, so R takes H's NS and stays silent) and `00:00:5e:00:53:01`, from
  the block RFC 7042 sets aside for documentation, so no real vendor prefix is shown.
- **Changed marks:** the address whose state changed (yellow, outlined), a group just joined, the default router when
  set, the bits just written (`ff:fe` in their step, the address bar just formed), the K1 row of this step. The
  flipped octet always carries the highlight, as the legend's "flipped U/L bit".
- **Preset entries** in `sim.json`: `eui64` and `dad-fail`, so a course can list "EUI-64" or "a duplicate address" on
  its own.
- **Title** "IPv6 SLAAC: samododjela adrese" / "IPv6 SLAAC: address autoconfiguration" (the catalogue's "IPv6 SLAAC" plus
  the term, for search).

## Deviations from the task

- **The global address is written `2001:db8:1:0:21a:2bff:fe3c:4d5e`**, not `2001:db8:1::21a:2bff:fe3c:4d5e` as in the
  task: RFC 5952 §4.2.2 says `::` must not shorten a single 16-bit 0 field, and `ipv6-shorten` teaches exactly that.
  The task's form is a valid address, just not the recommended text form. The English caption uses it this way.
- **`join` has 10 steps: the 10th is `ready`**, a step with no message: H's addresses get their use ("for this link",
  "beyond the link, via fe80::1") and the caption answers the misconceptions (no DHCP server, the router sent only
  the prefix). The task's phase list has nine phases and says 10 steps; the default router is set at the RA (its
  rule 6), not at the last step.
- **One parameter added: `iidOnly`** (toggle "The interface ID only"), so the `eui64` preset can show the bit strip
  alone; it resets to step 0. With it on, the prefix length, A flag and duplicate settings are hidden.
- **`eui64`'s 4 steps** are: split the MAC, insert `ff:fe`, flip the U/L bit, then all three MACs side by side (MAC,
  U/L before → after, interface ID): "when one variant finishes, run the others" (COMMON.md §11).
- **"tentative" is "nepotvrđena" in Croatian**, not "privremena" as in the task's caption: URM ch10 uses "privremene
  adrese" for temporary (RFC 8981) addresses, which the explanation mentions on the same page. The task's Croatian
  caption is otherwise used word for word for the NS step. Owner to confirm (report).
- **The legend has no "unicast" entry**: every message in this sim is multicast (the RA to `ff02::1`, the usual case,
  RFC 4861 §6.2.6).
- **`duplicate: link-local`** (not a preset) ends after 4 steps: NS, NA, the link-local duplicate, IPv6 off.

## Sources

- URM `book/chapters/10-ipv6.md`, "Vrste IPv6 adresa i podmreža veličine /64" (64-bit interface ID, SLAAC, `fe80::/10`)
  and its "Šire o temi" (SLAAC needs no servers, NDP, stateful assignment, temporary addresses); the diagram
  `ch10-vrste-adresa-prefiksi.svg` (link-local vs global) was the model for the two address bars.
- RFC 4862 §5.3 (link-local, infinite lifetimes), §5.4.2 (join groups, NS from `::`), §5.4.3 (NS for a tentative
  target: from `::` = duplicate, from a unicast source = address resolution, ignore), §5.4.4 (NA for a tentative
  target), §5.4.5 (duplicate; hardware-derived link-local → disable IPv6 SHOULD), §5.5.3 (a)–(d).
- RFC 4861 §6.2.1 (AdvValidLifetime 2 592 000 s, AdvPreferredLifetime 604 800 s, AdvDefaultLifetime 3 × 600 s),
  §6.2.6 (RA in answer to an RS: multicast to all-nodes is the usual case), §6.3.4 (default router from a non-zero
  router lifetime), §6.3.7 (RS to all-routers), §7.2.4 (an NS from `::` is answered to all-nodes with S = 0), §10
  (RETRANS_TIMER 1 000 ms).
- RFC 4291 §2.5.1 and Appendix A (modified EUI-64, the U/L bit), §2.7.1 (solicited-node `ff02::1:ffXX:XXXX`);
  RFC 2464 §4 (Ethernet interface ID); RFC 5952 §4 (text form); RFC 7042 §2.1.1 (documentation MACs).
- RFC 8981 (temporary addresses), RFC 7217 (stable opaque interface IDs): the explanation's last paragraph only.
- Numbers checked with Python's `ipaddress` before coding (EUI-64 of all three MACs, link-local, global, solicited-node,
  the RFC 5952 forms, 30 and 7 days in seconds).

## Unchecked *(check)*

- RFC section numbers and constants are from memory of the RFC texts (no network in this session); the URM chapter's
  own quotes of RFC 4862 and 4291 agree.
- The task's "many OSes, including Windows and current Linux defaults, do not use EUI-64 IIDs: check": the
  explanation says "many current systems" and names none (concepts, not tools); not checked further.
- Croatian terms marked *(check)* below.

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| stateless address autoconfiguration (SLAAC) | bezstanjska samododjela adrese (SLAAC) | URM ch10 |
| interface identifier | identifikator sučelja | URM ch10 |
| link-local address | link-local adresa | URM ch10 |
| prefix | prefiks | URM ch10 |
| Neighbor Discovery (NDP) | otkrivanje susjeda | URM ch10 |
| duplicate address detection (DAD) | otkrivanje dvostruke adrese | task *(check: not in URM)* |
| Router Solicitation / Router Advertisement | traženje usmjernika / oglas usmjernika | task *(check)* |
| Neighbor Solicitation / Neighbor Advertisement | traženje susjeda / oglas susjeda | task (NS); NA by analogy *(check)* |
| tentative / preferred / duplicate (address state) | nepotvrđena / preferirana / dvostruka | simdeck *(check: see deviations)* |
| solicited-node multicast address | (multicast adresa) traženog čvora | simdeck *(check)* |
| all-nodes / all-routers group | svi čvorovi / svi usmjernici | simdeck |
| default router | zadani usmjernik | simdeck (glossary has *default route*, zadana ruta) |
| valid / preferred lifetime | valjana / preferirana (vrijeme) | simdeck *(check)* |
| router lifetime | životni vijek usmjernika | simdeck *(check)* |
| temporary address | privremena adresa | URM ch10 |
| stable opaque interface ID | stabilna neprozirna adresa | simdeck *(check)* |

`default route` (zadana ruta) is used from the glossary, as `[[default route]]` in the explanation.

## Checks

- Tests: 23 (four tie-breaks first, rules 1–11, times, the scene, the other two MACs, step counts, then the template's
  generic block over six param sets). Each rule was broken once in a scripted mutation pass (27 mutations: the U/L
  bit, the link-local prefix, tentative, the NS source, the solicited-node group, the wait, the `::` probe tie,
  address-resolution NS, IPv6 off, the NA destination, the default router, the prefix-check order (a)–(d), the (c)
  boundary, `fe80::/10`, the length and A checks, infinite lifetimes, one group join, the single-0 rule, the
  first-of-equal-runs rule, the stopped timer, time on the RS, the router kept after an NA, N's addresses, the L flag,
  the low-24-bit split): every one failed a test.
- Fresh review (a separate agent, playbook §7.4): read the model and tests against SPEC.md and the RFCs (facts and
  numbers correct), ran about 90 mutations on a copy, read the page and strings. Fixed from it: the solicited-node
  underline for MAC `02:00:00:00:00:01` took the fixed `ff` byte (now `solicitedNodeParts`); tests added for the order
  of checks (a)–(c), preferred = valid, the times, the default router at the end, the stopped timer, N's addresses,
  the RA's L and O and the other two MACs; the global's lifetimes now come from the RA option; the page reads the
  NA/RA flags and the router lifetime from the model instead of typing them; SPEC rules 3 and 6 say what is the
  RFC and what is this model's choice. Left as is: the A = 0 caption names DHCPv6 (M = 1 is shown in the same RA).
- Browser sweep of every step of 11 runs (the five presets, `duplicate: link-local`, the other two MACs, `eui64` with
  the local MAC, A = 0 with /56, `dad-fail` with the local MAC) in both languages, at 1920×1080 and 375×812: 184 states
  each, no page scroll, nothing outside the stage or a box, no chart rows dropped at 1920×1080, no
  `undefined`/`NaN`/`null`, no console errors, every visible word from the tables.
- Gate screenshots reviewed (light, dark, grayscale, phone, both languages). Found and fixed on the way: the panel
  123 px too tall (MAC as a drop-down, two hints dropped, the view switch as a toggle, hidden settings really hidden),
  receiver words overlapping in the chart, the RA card squeezing the chart, the changed row unreadable in dark mode
  (dark text on dark cells), the /56 labels wrapping into the bar, chart rows dropped on the phone, address bars too
  wide on the phone.

## Shared requests

- **kit.css: `.sd-ctl[hidden] { display: none; }`.** `.sd-ctl { display: flex }` beats the `hidden` attribute, so a
  param's `visible: (p) => false` never hides it. This page adds the rule for itself (scoped). It also affects
  `arp-local-remote`: with the `mask-28` preset its "Odredište pinga" is `hidden` but still shown (checked).
- **kit/sequence.js `fit()` on phones:** the phone CSS lets the list grow (`overflow: visible`), but `fit()` still
  drops rows while `scrollHeight > clientHeight + 1`, and a receiver word or ✕ hanging 4 px below the last row
  makes it drop all but two. Either skip the drop under the phone media query or give `.sd-seq-list` some bottom
  padding there. This page pads its own list on phones.
- **Glossary:** the term pairs above, `"src": "simdeck"`, once the owner confirms the *(check)* ones.

## Time

Start 10:40, done (gate, sweeps, fresh review and its fixes) 11:20: about 40 minutes, one session.
