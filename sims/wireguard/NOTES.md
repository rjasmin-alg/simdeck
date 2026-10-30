<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wireguard: notes

New stepper (task `docs/tasks/w3/wireguard.md`, catalogue `sec-wireguard`, §4.3, wave 3). Rules, tie-breaks and
expected numbers: `SPEC.md`. Drawn with kit view **K1** (message sequence chart, `kit/sequence.js`) as the task asks,
plus kit view **K4** (rule table, `kit/ruletable.js`, mode *most specific*) for each peer's AllowedIPs.

## Decisions

- **Layout**: the K1 chart on the left (lanes A and B; each lane card holds the peer's own address, its key pair,
  the other peer's key and endpoint, and its session keys); on the right A's AllowedIPs, the packet card, B's
  AllowedIPs. Everything fits 1920×1080 with the panel open, nine chart rows included.
- **AllowedIPs as K4 tables**, mode `specific`, rank = prefix length: the longest-prefix tie-break is drawn by the
  kit (the winning row outlined "longest", the shorter match struck "shorter"). The task's "cryptokey-routing table
  per peer" is the same table, which shows the point of the sim: routing table and filter are one list. A's table
  answers "whom to encrypt for" (key: destination), B's "is the source allowed" (key: the inner source).
- **A third peer C exists only as a row** in A's table (`10.0.0.0/24`, tagged "not drawn"). It is needed for the
  task's tie-break (two peers' AllowedIPs overlapping for 10.0.0.2). Picking 10.0.0.3 sends the packet to C: the
  page says A would first handshake with C (not drawn) and B gets nothing. No C lane: a third handshake would be a
  second concept on the screen.
- **`endpointKnown`** means "A has B's endpoint in its config". Off: A cannot send the Initiation, so there is no
  session and nothing ever goes on the wire. B never has A's endpoint configured (a gateway for roaming hosts): it
  learns it from the authenticated Initiation at step 2 (rule 4), which shows roaming already in the handshake preset.
- **Step 9** sends the same inner packet again (counter 1) from A's new address. If the lookup picks C or no peer, B
  learns nothing and keeps the old (now stale, dashed) endpoint; the caption says so.
- **Endpoint before the AllowedIPs check**: a packet that authenticates updates the endpoint even when its inner
  source is then dropped (roam with `allowedOk` off). This follows the whitepaper's "most recent correctly
  authenticated packet" and the reference implementation's receive order (from memory) *(check)*.
- **Spoofing** (rule 4, second half) is a model function (`receiveData` with a wrong key) with tests, and a sentence in
  the explanation; it is not a step, since the task fixes the steps.
- **Silence** (rule 5) shows as: nothing on the wire at step 1; the drop note "dropped, no reply"; no B message after
  any drop; nothing sent without an endpoint.
- **Handshake fields** (ephemeral key in clear, A's static key encrypted to B, encrypted timestamp; Response: ephemeral
  and an empty encrypted payload) are in the packet card, not on the chart arrow, where they collided with the
  receiver word.
- **Keys** are 44-character base64 placeholders (SHA-256 of a label), shown as their first 6 characters; nothing is
  computed. Session keys are named k1 (A→B) and k2 (B→A), so the cards show the mirror: A sends k1, B receives k1.
- **Addresses** are from the documentation ranges (RFC 5737). B listens on UDP 51820.
- **Product name**: WireGuard is named because NLA T09 teaches it ("VPN — WireGuard i IPsec"), COMMON.md §1.
- **Related**: `diffie-hellman`, `encapsulation`, `tls-handshake`, `ssh-key-auth`.

## Deviations from the task

- **K4 for the tables** (the task names only K1). The tables are a rule list with a deciding row, which is what K4
  draws; drawing them by hand would duplicate the kit.
- **Caption wording, step 6**: the task's "encrypted to B's key" / „šifrira njegovim ključem" became "encrypted with
  B's session key" / „šifrira ključem sesije s B": data packets are encrypted with the session key, not B's static
  key. The task's step-5 lookup and step-6 send are two captions (lookup names the winning prefix; send names the
  endpoint).
- **State shape**: besides the task's fields, `routingB` (B's table), `lookup` and `check` (the K4 results), `rows`
  (chart rows) and `changed`. `routing` is A's table.
- **Params**: `innerDst` is a select of four addresses (a choice of four addresses did not fit the panel);
  `innerDst` and `allowedOk` are disabled with a reason under the handshake action.

## Sources

- J. A. Donenfeld, *WireGuard: Next Generation Kernel Network Tunnel*, NDSS 2017 (the whitepaper): cryptokey routing,
  endpoints and roaming, Noise_IK and 1-RTT, message types, silence. Read from memory, not re-fetched offline.
- URM `book/chapters/18-kiberneticka-sigurnost.md`, „Šifriranje prometa: VPN, TLS i dvije vrste enkripcije" (what a
  VPN gives; gateway-to-gateway and host-to-gateway).
- NLA `meta/toc.md` T09 (chapters not written yet).
- `sims/diffie-hellman/` for the key-chip idea. Its model is not in `models/`, and none of it is needed (the Noise
  cryptography is out of scope), so nothing was copied.
- Numbers (prefix matches, documentation ranges, key strings) checked with a scratch Python script (`ipaddress`,
  `hashlib`) before coding, then pinned in `sim.test.js`.

## Unchecked *(check)*

- Whitepaper section numbers: the task says §5.3 for silence; my memory puts "Silence is a Virtue" at §5.1 and cookies
  (DoS mitigation) at §5.3.
- Round and message names (Initiation, Response; transport data) and that both sides hold the keys after the Response
  (strictly, the responder waits for the initiator's first data packet before it sends with them; out of scope).
- Longest prefix match between peers, and that the same prefix assigned to a second peer moves to it.
- Endpoint updated before the inner-source check (see Decisions).
- UDP 51820 as the conventional port.
- Croatian terms: sudionik (peer), usmjeravanje po ključu (cryptokey routing), krajnja točka (endpoint), roaming /
  promjena mreže (task).

## Term pairs

In `kit/glossary.js` and used: handshake, public key, private key, network prefix, access control list. Not in the
glossary; the explanation writes them out at first mention. Proposed with `"src": "simdeck"`:

| English | Croatian | Source |
|---|---|---|
| peer | sudionik | task *(check)* |
| tunnel | tunel | task |
| cryptokey routing | usmjeravanje po ključu | task *(check)* |
| endpoint | krajnja točka | task *(check)* |
| roaming | roaming / promjena mreže | task *(check)* |
| session key | ključ sesije | task |
| ephemeral key | privremeni ključ | this sim |

## Shared requests

- **K1: a note on two lanes at once.** Step 4 ("both derive session keys") is two note rows, one per lane; a note
  spanning A and B in one row would save a row.

## Checks

- Numbers: every SPEC.md value (prefix matches, documentation ranges, key strings) checked with a scratch Python
  script before coding, then pinned in `sim.test.js`.
- Tests: 35. Three tie-breaks first (longest prefix, independent of table order; a prefix moved to the later peer;
  equal prefixes in a hand-made table), prefix boundaries, then rules 1–6 (an unknown key in the Initiation: no endpoint,
  no Response; the spoofed packet; endpoint before the AllowedIPs check; silence over all 96 param combinations), steps
  per action, presets, `changed`, the duplicate-key check on `strings.js`, then the template's generic block.
- Mutation: the fresh reviewer ran 50 mutants; 6 survived, 3 of them equivalent. The other 3 (Initiation without
  `identify`, a reply on an AllowedIPs drop, `tableB` not marked changed) now have tests; I re-ran those 3 mutants and
  4 more (Response without a recognised key, the missing step-9 note, shortest prefix): all killed. The new `changed`
  test also found that step 7 did not mark the packet card changed (fixed).
- Fresh review (a separate agent, playbook §7.4): read the model against SPEC.md and the task, mutated it, drove all
  presets and 13 odd combinations in both languages. Fixed from it: A's table clipped its mark header at 1920×1080
  (header now `→ 10.0.0.2`, columns rebalanced); a struck "C" read as "€" (table rows now `C · ZNWC2n…`, peer and key,
  which is also what "cryptokey" routing means); the step-9 outcome was missing from the chart (note on B); English step
  6 said "B's session key" (now "the session key A shares with B (k1)"); English step 2 was ambiguous about the
  ephemeral key (now "in the clear"); Croatian "od B" → "sudionika B", "smije li izvor" → "je li izvor dopušten",
  commas after relative clauses; legend ✓ icon readable; SPEC's step 9 row; B no longer answers an Initiation from an
  unknown key (the model would have, though no preset reaches it).
- Overflow sweep: 576 states (both languages, every action, destination, toggle and step) at 1920×1080, no box
  overflows and no page scroll.
- Gate: pass (manifest, tests, build, 61 browser checks, tokens, scope), no exceptions declared. Screenshots reviewed:
  1920×1080 light, dark, grayscale and 375×812 in both languages, plus own shots of every preset's last step and
  the C, no-peer and no-endpoint cases.

## Time

Start 15:41, done (gate, fresh review and its fixes) 16:05, one session.
