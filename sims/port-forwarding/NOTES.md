<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# port-forwarding: notes

Task `docs/tasks/w3/port-forwarding.md` (catalogue `net-port-forwarding`, §4.1, overlap §5.12). Rules and numbers:
`SPEC.md`.

## Decisions

- **Builds on `sims/nat`, not a shared model.** `models/` has no NAT model yet, so `freePort` is copied from
  `sims/nat/sim.js @ ff047ee` unchanged (marked in `sim.js`). `nat`'s `translateOut`/`translateIn` are not reused:
  rule 2 needs the remote end in the lookup and rule 3 a connection that starts from outside, so rows here are
  connections with two directions (`orig`, `reply`), which one lookup serves for both. `classify`, `addForward`,
  `nextPort` and the walk are pure over plain data and take the network as data (tested with a container,
  10.88.0.5), ready for `models/` and for `lnx-container-ports`.
- **Two K4 tables in order, one K2 drawing.** The translation table (first match; its implicit row "no row matches"
  sends an inbound packet on to the forwards, or makes a new row for an outbound one) and the forwards table (first
  match; implicit row "neither a row nor a forward → drop"). The order of the two tables is the rule order. A row a
  forward made is hatched like the forward; a PAT row is solid (legend). The new row of a step is tagged "new"; the
  deciding row gets K4's thick outline, the request chip shows who handed R the packet. The forwards are "not read"
  (hatched) when a row decided or the packet was not addressed to R.
- **Layout.** K2 in five columns with wide gaps (room for the chip between R and K); the packet card and the forwards
  table sit in the drawing's free bottom-left cell, left of the link to W; the translation table gets the full width
  under it. The packet card shows source and destination; a rewritten field is highlighted with its old value struck
  under it ("bilo"/"was"). The protocol is in the card's title. The chip on the wire says only TCP/UDP.
- **Scenes as a param.** The presets differ in who sends, so a `scene` param ("Tko šalje": `A, B, K` / `W, K` / `K` /
  `A`) carries it; it resets to step 0. The other params recompute at the same step.
- **Step counts follow from the walk**, not a script: `steps` is a function of the params (1–6 over every
  combination); `sim.json` `steps` is the default's 5.
- **Decision shown where R sends.** A packet's arrival at R is one step (shown as it arrived), R's rewrite is the next
  (R → host, with the table pointer). A drop at R is shown on the arriving step, as the task's step counts need.
- **Rule 2 matches the remote end too** (the book's "par (*port*, vanjsko odredište)"). `nat` matches the outside port
  alone (its fragment's behaviour), so `book` with port 61000 is dropped here and delivered to A there. The caption
  says why (row 1 holds 61000 for 198.51.100.10:443).
- **Rule 7 port skipping** ignores the protocol (a forwarded port is skipped for TCP and UDP alike), as the task says.
  It is a simplification: a real NAT reserves no ports for its forwards (the fresh reviewer's note; SPEC says so).
  `freePort`, like `nat`'s, does not keep separate TCP and UDP port spaces either.
- **Rule 8 is model-only.** The page has one forward toggle (the task's param), so a second forward cannot be added
  from the page; `addForward` refuses it (same protocol and port) and the explanation says so.
- **Hairpin source port** is the next free PAT port (61000 in the preset), per RFC 4787 REQ-9's "external address".
- **Panel fit.** Five examples and five settings overflowed the panel by 12 px; the page sets the settings group's gap
  to 0.4rem (kit 0.55rem). The toggles have no hints for the same reason; the explanation carries them.

## Deviations from the task file

- Default `extPort` is 61050, not 8080: the default equals preset 1 (the book's Primjer 4), as in `nat`.
- State names: one `table` (the task's `pat` and `conn`), `hop.pkt` (the task's `packet`), no `chart`.
- Rule 8 has no on-page caption (above).
- The `scene` param is added (the task's four params cannot express its presets).

## Sources

- URM ch. 11 (`book/chapters/11-usmjeravanje.md`): "NAT: kad više uređaja dijeli jednu adresu" (one-way sessions,
  port forwarding, RFC 3022 and RFC 4864 quotes) and Primjer 4 (203.0.113.5, A and B on 51000, 61000/61001, 61050
  dropped). The explanation's "NAT is not a firewall" paragraph follows the chapter's RFC 4864 quote.
- `sims/nat` (scene, numbers, `freePort`) and its NOTES.
- RFC 3022 §2 (static address maps for inbound sessions), RFC 2663 (terms), RFC 4787 §6 REQ-9 (hairpinning),
  RFC 5737 (documentation addresses), RFC 1918 (192.168.1.0/24).
- Not opened here: iptables-extensions(8) and the netfilter packet-flow diagram (rule 7's order is marked *(check)*).

## Unchecked *(check)*

- Rule 6 against the router UI used in class (some home routers offer "TCP/UDP" as one forward).
- Rule 7: conntrack before nat PREROUTING for packets of a known connection; port selection per protocol.
- Rule 8 per protocol (the task said "two forwards on one outside port").
- Croatian "prevođenje odredišne adrese" for DNAT and "petlja kroz usmjernik" for hairpinning (task file marks both
  *check*); the page uses "petlja kroz usmjernik" and keeps *hairpinning* in italics in the explanation.

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr |
|---|---|
| port forwarding | prosljeđivanje *portova* |
| destination NAT (DNAT) | prevođenje odredišne adrese *(check)* |
| translation table | tablica prijevoda |
| inside / outside address | unutarnja / vanjska adresa |
| router | usmjernik |
| hairpinning (NAT loopback) | *hairpinning*, petlja kroz usmjernik *(check)* |
| (table) entry, row | zapis |

## Shared requests

- **models/:** promote a NAT model (`freePort` from `nat`, `classify`/`addForward` from here) so `nat`,
  `port-forwarding`, `cgnat` and `lnx-container-ports` share one copy. `nat`'s inbound lookup ignores the remote end;
  an optional parameter would keep its behaviour.
- **Glossary:** the pairs above, `"src": "simdeck"`.
- **Kit (K2), optional:** a `diamond` node kind (the page draws K and W's diamond with page CSS on `data-id`), and a
  way to place a non-node box in a free grid cell (the page appends its own element to the topology grid and resets
  its placement for phones).

## Checks

- `npm run gate -- port-forwarding` passes; screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus every preset's key steps (drop at R, row match, forward, wrong protocol, hairpin off and
  on) in hr and en.
- Every rule was broken once in `sim.js` (rows before forwards, port skip, lowest free port, remote-end match, source
  kept on a forward, protocol match, drop, duplicate refused, hairpin source, the opener's check of an answer, reply
  rewritten back, on-link direct) and each made a test fail.
- A fresh reviewer (a separate agent) read the diff against SPEC.md and ran 30 mutants; the survivors it found
  (protocol in row matching, hairpin port with rows present, the next free port, the hairpin row's `as`, the orig
  fallback of the miss tie-break) now have tests, and its caption fix ("no forward covers {dst}") is in.
- Not done: a real projector and a lecturer with a clicker.

## Container host presets (task `docs/tasks/w3/lnx-container-ports.md`, thread t-0214)

Four presets, keys 6–9: `container-publish`, `container-not-published`, `container-loopback`, `container-port-taken`;
one entry in `sim.json` (`container-publish`). Rules and numbers: SPEC.md "Container host".

- **Decisions.**
  - **The host is extended, not stopped.** The task says to stop if the host cannot express the preset. Items 1, 3,
    4, 5 and 6 of its list were missing (a rule added by a step, "connection refused", an address-bound rule, a
    refused add on the page, labels per preset), but the engine was built for this (`classify` takes the network as
    data). As `broadcast-storm` did on `stp`, the additions are additive: `addForward` takes an optional `addr` and
    returns `clash`; `classify` misses a forward on `addr`; a separate `walkContainer` reuses both. The router's
    scenes, numbers and tests are unchanged (all old tests pass untouched, apart from the defaults test that now lists
    the two new params).
  - **A `container` toggle** (label "Domaćin kontejnera") switches the page; `cscene` picks the scene. The router's five
    settings are hidden while it is on, `cscene` while it is off (`visible`; page CSS for `[hidden]`, as `cert-chain`).
  - **Examples follow the toggle**: the page sets `data-pf-host` on `.sd-page` in `render` and CSS hides the other
    host's presets (1–5 router, 6–9 container; the number keys reach all nine). Presets in two columns, the router's
    fifth spanning both. This is what fits: with all nine shown the panel was 1166 px of 864; now 864 of 864 in both
    languages (no margin left: a longer label overflows).
  - **Refused, not dropped.** A packet to the host's own address that matches nothing gets a reset from the host (a
    hop H → sender with the RST flag on the packet card, chip "RST"); the router keeps dropping. The tables show the
    lookup on the RST hop, struck where the bound address differs.
  - **Commands on the packet card's place**: "Naredba sustavu za kontejnere", the command in monospace, then "Dodano
    pravilo n" / the refusal. The new rule is tagged "novi", the clashing one "zauzet". No engine name and no engine
    error text (COMMON.md §1): the command is written `run -d -p 8080:80 web`, the refusal in words.
  - **Legend labels cover both hosts** ("računalo u LAN-u, kontejner", "usmjernik, domaćin"): the kit builds the
    legend once.
  - **Names**: client `C`, host `H` with `host1` under its name, containers `web` and `web2` (marks are the names).
- **Deviations from the task.** Step counts 5/5/3/4 instead of 7/5/5/4 (SPEC.md); no `firewall-bypass` preset (no
  input filter in the host; rule 6 is in the explanation); one `sim.json` entry instead of four; the host's tags,
  topic and level stay `nat` / `networks` / `intro` (the task's `linux-admin`, `containers`, `tcp`, `advanced` cannot
  be set per entry; all four exist in `tags.json`).
- **Sources.** The task file's mapping and rules; RFC 3022 (NAPT, the reply's rewrite); RFC 9293 §3.10.7.1 (reset for
  a closed port); RFC 5737. Not opened here: nft(8), iptables-extensions(8), the engines' documentation, netavark's
  rule output, the NLA chapters (not written yet).
- **Unchecked *(check)*.** C1 rule wording against the engine's nat table; C5's error text; C6 (published ports bypass
  input rules; an engine may add its own forward rules); the explanation's "127.0.0.1:8080 from the host reaches the
  container" (needs the engine's local handling, not modelled); a host whose firewall drops instead of resetting
  shows silence, not "refused".
- **Term pairs** (written out; not in `kit/glossary.js`): port publishing — objava *porta*; container — kontejner;
  container host — domaćin kontejnera; bridge — most; connection tracking — praćenje veza *(check)*; reset (RST) —
  reset; connection refused — spoj odbijen; rootless — bez administratorskih ovlasti *(check)*.
- **Shared requests.**
  - **Kit:** a control hidden by `visible()` stays shown (`.sd-ctl`'s `display` beats `[hidden]`; as `cert-chain`).
  - **Kit:** presets that follow a param (`visible(params)` on a preset, or preset groups); the page hides them with CSS.
  - **models/:** when the NAT model is promoted, take `addForward`'s `addr`/`clash` and the "refused at the host"
    outcome with it.
- **Checks.** 9 tests added (two tie-breaks first, C1–C6, step counts). Mutation run, each caught: clash ignoring the
  any-address rule, bound rules never clashing, `addr` not matched, refused turned into drop, publishing at load, a
  source rewrite on publish, the host's sockets read before the rules, a refused add that changes the table, the
  local answer run through the rules, no un-DNAT. `npm run gate -- port-forwarding` passes; every container step
  screenshotted in hr and en at 1920×1080 and reviewed, plus the gate's light, dark, grayscale and 375×812 shots.
- **Time:** start 2026-10-30 17:46, done 18:01 (one session).

## Time

Start 2026-10-28 11:22, done 11:50 (one session).
