<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ipsec-ike: notes

New stepper (task `docs/tasks/w3/ipsec-ike.md`, catalogue `sec-ipsec-ike`, §4.3, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. Drawn with kit view **K1** (message sequence chart, `kit/sequence.js`) as the task asks,
plus kit view **K4** (rule table, `kit/ruletable.js`, mode "most specific") for the sender's SPD, which the task does
not name but which is exactly the selector lookup of step 4.

## Decisions

- **Four lanes**: Host A, GW-A, GW-B, Host B. In tunnel mode the gateways are the IPsec peers and the hosts' cards say
  "no IPsec, plain IP"; the LAN legs (Host A → GW-A, GW-B → Host B) are dashed plain-IP arrows. In **transport mode
  the hosts are the peers** and the middle lanes become "Router A/B" (forward, cannot read ESP): RFC 4301 §4.1 has
  transport mode host to host, so the sim does not draw a transport-mode SA between gateways. IKE and ESP arrows
  then run host to host across the routers, inside one routed private network (the routers show 10.1.0.1 and
  10.2.0.1, not the gateways' public addresses), so the hosts' private addresses can be the outer header. This is what makes "tunnel vs transport is about who is protected"
  visible, not just the header layout.
- **Two stacked boxes per peer card**: IKE SA (double border: control; none → "keys, not authenticated" → ✓ PSK or
  certificate) and ESP SA (single border: data; `→ out` and `← in` SPIs). Old SAs are dashed, deleted ones struck.
- **SPI convention**: the receiver picks the SPI of its inbound SA, so the SA into B is `b2000001` and the SA into A
  `a1000001`; the rekey's pair ends in …2. The letter tells the student which side the SA leads to.
- **IKE_SA_INIT reuses DH** with the textbook numbers of `diffie-hellman` (p 23, g 5, a 6, b 15 → KEi 8, KEr 19,
  shared 2), shown in the packet view as `5⁶ mod 23 = 8` and in the INIT arrows' fields. `powMod` is copied from
  `sims/diffie-hellman/sim.js @ 95725f1` (not in `models/` yet).
- **One step per exchange**: IKE_SA_INIT, IKE_AUTH, CREATE_CHILD_SA and INFORMATIONAL each put request and response
  rows in one step; the packet view shows both messages, SK-encrypted payloads hatched.
- **Packet view** puts the original packet and the ESP packet in one grid of columns, so the parts line up: tunnel
  mode leaves two empty columns before the original (the new outer header and ESP go there); transport mode puts
  the original IP header in the outer header's column with a gap where ESP is inserted. Brackets under it mark
  "encrypted" (single) and "authenticated (ICV)" (double). The ESP trailer shows *next header* 4 or 6.
- **Off the selectors** the destination is 10.2.1.9, a second subnet behind GW-B that the tunnel's selectors
  (10.2.0.0/24) do not cover. The SPD has PROTECT (the selectors), DISCARD 10.0.0.0/8 and an implicit BYPASS, so
  10.2.0.9 shows the tie-break (/24 beats /8) and 10.2.1.9 is **discarded** at GW-A: not tunnelled and not sent in the
  clear (the task's *(check which the sim shows)*: the sim shows DISCARD; BYPASS is in the table and the tests).
- **Lifetime**: step 8 of bring-up is a note on A's lane; the rekey preset shows the soft limit, CREATE_CHILD_SA, the
  move to the new SA (seq back to 1), the Delete, and a reply on the other SA of the new pair; in tunnel mode the
  traffic steps draw the plain LAN legs too. N(REKEY_SA) shows the SPI it replaces in the packet view. A K1 timer bar for the
  lifetime was tried and dropped: its label collided with the notes on the same lifeline.
- **Words**: PROTECT/DISCARD/BYPASS are ZAŠTITI/ODBACI/PROPUSTI in Croatian, with the RFC words in the explanation.
  "Obnova ključeva" for rekey. "pristupnik" for gateway (glossary).
- **Related**: `diffie-hellman`, `wireguard`, `encapsulation`, `tls-handshake`.

## Deviations from the task

- **Action `send`** starts with the tunnel already up and has 5 steps (3 off the selectors); `bring-up` with the
  selector toggle off has 5 steps (init, auth, send, match, policy), which is the `no-selector` preset's 5.
- **Rekey's 6 steps**: traffic on the old pair, soft lifetime, CREATE_CHILD_SA, traffic moves (seq 1), Delete, the
  reply on the new B → A SA (shows the pair is two SAs). The task names the preset and its count, not the steps.
- **State shape**: the task's `ikeSA {up, authMethod}` is `ikeSA {state: none|keyed|up, authMethod, dh}`;
  `childSAs` are one-way SAs `{spi, proto, from, to, gen, seq, key, ts, state}` (a pair is two entries); `packet`
  carries `outerSrc/outerDst/innerSrc/innerDst/spi/seq/next/encrypted/authenticated/authOk/tsOk`. Added `peers`
  (which lanes are the IPsec peers), `spd`, `lookup`, `ike` (this step's IKE messages), `check`, `rows`, `changed`.
- **Legend**: the task's "auth ok/fail" is one ✓✕ swatch; "changed" is the kit highlight.

## Sources

- RFC 7296 (IKEv2) §1.2 (IKE_SA_INIT, IKE_AUTH payloads), §1.3 (CREATE_CHILD_SA, SA payload SPI), §1.4.1 (Delete),
  §2.8 (rekeying, lifetimes local), §2.9 (traffic selectors). RFC 4301 §3.2, §4.1 (tunnel/transport, SAs one-way),
  §4.4.1 (SPD, PROTECT/BYPASS/DISCARD), §5.1, §5.2 (outbound/inbound processing). RFC 4303 §2 (ESP format), §2.6
  (next header), §3.3.3 (sequence number), §3.4 (inbound: SA lookup, ICV before decryption). Read from memory, not
  re-fetched offline: *(check)* the section numbers.
- URM `book/chapters/18-kiberneticka-sigurnost.md`, "Šire o temi" (VPN protects the whole traffic between two
  points) and footnote nist80041-vpn (gateway-to-gateway vs host-to-gateway architectures).
- NLA `meta/toc.md` T09 "VPN — WireGuard i IPsec" (chapters not written yet).
- Numbers checked with a scratch Python script (pow, ipaddress) before coding, then pinned in `sim.test.js`.

## Unchecked *(check)*

- RFC section numbers above (from memory).
- SA lifetime "1 h" is an example of local policy, not a standard value.
- "sigurnosna asocijacija" and "selektor prometa" (task marks both *(check)*).
- RFC 4301 orders the SPD (first match); the task's tie-break says most specific. The SPD here is listed most
  specific first, so both give the same answer.

## Term pairs

Not in `kit/glossary.js`; the explanation writes them out at first mention. Proposed with `"src": "simdeck"`:

| English | Croatian | Source |
|---|---|---|
| security association | sigurnosna asocijacija | task *(check)* |
| traffic selector | selektor prometa | task *(check)* |
| tunnel mode | tunelski način | task |
| transport mode | transportni način | task |
| pre-shared key | unaprijed dijeljeni ključ | task |
| key exchange | razmjena ključa | task (also proposed by sym-vs-asym, diffie-hellman) |

Used from the glossary: `[[gateway]]` (pristupnik), `[[certificate]]` (certifikat).

## Shared requests

- **models/**: `powMod` (and the DH toy numbers) from `diffie-hellman` is copied here; promote a `dh` model and point
  this sim at it.
- **Kit: `ruleTable.verdict(ok, text)`** takes a string only; the page builds the same span itself to put a data chip
  (the SPI) in the outcome. Smallest fix: accept a node or array as `text`.
- **Kit: `visible()`/`[hidden]`** on panel controls: the page keeps `.sd-panel [hidden] { display: none }` as
  `diffie-hellman` does (same request as there).

## Checks

- Tests: 46. Four SPD tie-breaks first (most specific destination, equal destination → more specific source then
  earlier, no match → implicit BYPASS, 10.2.1.9 → DISCARD), then rules 1–6, rekey, steps per action, the presets,
  `changed`, params, lanes, duplicate keys in `strings.js`, then the template's generic block (JSON-safe, replay =
  step back, no mutation, both tables, presets valid).
- Mutation pass: 28 own mutants over every rule and the tie-breaks; 27 killed at first, the survivor (the sender
  preferring the newer of two active SAs) now has a direct test. The reviewer's 21 more: 12 survived at first
  (the stepped deliver ignoring a failed selector check, transport ESP covering the IP header, protocol 50, UDP 500,
  the rekey's selectors, `dropped`, the N(REKEY_SA) SPI, the destination-only selector check, the packet's place, the
  Delete and CREATE_CHILD_SA payloads, `changed` at lifetime); all have tests now. One equivalent left: the old
  B → A SA's sequence number, never used.
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md, the task and the RFCs, mutated it,
  drove every step of the four presets plus param variants in both languages (98 screenshots). No model error found.
  Fixed from it: the SPI clipped in the packet view (`overflow: hidden`); transport mode drew private addresses
  across public routers (now one private network, routers 10.1.0.1 / 10.2.0.1, said in the start caption and
  SPEC); "the tunnel is already up" in transport mode (own caption); the rekey's traffic missing the LAN legs; the
  N(REKEY_SA) SPI not shown; highlight rings over SPI chips (chips now fill, no ring; only the SAs a step touches);
  "SPI + protocol + destination" vs RFC 4301's looser lookup and the anti-replay check noted *(check)* in SPEC;
  AH's coverage of the outer header and protocol 50 in the explanation; Croatian: "unaprijed dijeljeni ključ",
  "neispravan ICV", "jednokratni brojevi (nonce)", "sudionik IPseca", "računala … i …" in the INIT caption; the
  K4 win word "decides/odlučuje" (it read "narrowest" with a single hit). Own: the DH line under IKE_SA_INIT said
  "in the clear" (now "each side computes"); "8, 5¹⁵" read as a decimal (now "and").
- Gate: pass (manifest, tests, build, 61 browser checks, tokens, scope), no exceptions declared. Screenshots
  reviewed: 1920×1080 light, dark, grayscale and 375×812 in both languages, plus own shots of every preset's last
  step, IKE_AUTH with certificates, and the middle steps of rekey.

## Time

Start 04:13, done (gate, two mutation passes, fresh review and its fixes) 04:40, one session (about 27 minutes).
