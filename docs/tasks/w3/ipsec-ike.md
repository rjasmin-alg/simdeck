# ipsec-ike: IPsec and IKE

| | |
|---|---|
| Task | `ipsec-ike` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-ipsec-ike` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/ipsec-ike/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | NLA, SEC |
| Topic / tags / level | `security` / `vpn` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `diffie-hellman` is merged and reuse its model (COMMON.md §6); uses kit view K1 message sequence chart once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **IKE phases, transport vs tunnel mode, ESP**.

The student: step a site-to-site tunnel coming up.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.
5. `sims/diffie-hellman/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, topic T09 (Napredna Linux administracija; chapters not written yet)
- Catalogue seed: NLA T09
- RFC 7296, *Internet Key Exchange Protocol Version 2 (IKEv2)*, §1.2 (IKE_SA_INIT, IKE_AUTH), §2.9 (traffic selectors).
- RFC 4301, *Security Architecture for the Internet Protocol*, §3.2, §4.1 (SAs, tunnel vs transport, SPD actions); RFC 4303 (ESP). NLA chapters for T09 are not written yet; mark derived specifics *(check)*.
- URM ch18 „Šifriranje prometa…" (VPN gateway-to-gateway architecture), `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md`.

## Model and presets

- **Scene:** K1 sequence chart for a site-to-site tunnel between gateway GW-A and GW-B, each with its protected
  subnet behind it. Two stacked boxes per gateway: the IKE SA (control) and the pair of IPsec/ESP SAs (data). A
  packet view at the bottom shows the original inner IP packet and how it is wrapped, differing by mode. Stepper.
- **State:** `{ phase, ikeSA: {up, authMethod}, childSAs: [{in, out, spi}], mode: 'tunnel'|'transport',
  packet: {innerSrc, innerDst, outerSrc, outerDst, espProtected, authOk}, selectors: {local, remote}, outcome }`.
- **One step (IKEv2):** 1 IKE_SA_INIT: GW-A and GW-B negotiate crypto and do a Diffie-Hellman exchange → shared
  keys for the IKE SA; 2 IKE_AUTH: each authenticates (pre-shared key or certificate) and the first Child SA (the
  ESP pair) is created with its traffic selectors; 3 a host behind GW-A sends to a host behind GW-B; 4 GW-A matches
  the packet to the selectors and the outbound Child SA; 5 ESP: encrypt + authenticate, wrap per mode; 6 GW-B
  receives, checks the SPI and ESP auth, decrypts; 7 GW-B checks the inner addresses against the selectors and
  delivers; 8 rekey / SA lifetime note.
- **Rules:**
  1. IKE builds and authenticates a secure channel and then negotiates the ESP SAs; it does not carry the data
     itself (RFC 7296 IKEv2, §1).
  2. IKEv2 is two exchanges: IKE_SA_INIT (DH, crypto) then IKE_AUTH (identity + first Child SA) (RFC 7296 §1.2).
  3. SAs are unidirectional and identified by SPI + protocol + destination; a bidirectional tunnel needs a pair
     (RFC 4301 §4.1; RFC 4303).
  4. Tunnel mode: a new outer IP header wraps the whole original packet, so gateways can protect traffic for hosts
     behind them (site-to-site); transport mode: the original IP header stays and only the payload is protected,
     for host-to-host (RFC 4301 §3.2, §4.1).
  5. ESP provides confidentiality + integrity + authentication of the protected portion; AH (integrity only) is
     noted, not simulated (RFC 4303; RFC 4301).
  6. Traffic selectors decide which packets enter which SA; a packet outside the selectors is not tunnelled
     (RFC 7296 §2.9).
  Tie-break: overlapping selectors match the most specific; a packet matching none goes in the clear or is dropped
  by policy (RFC 4301 PROTECT/BYPASS/DISCARD) *(check which the sim shows)*.
- **Params:** `mode` choice tunnel/transport (tunnel); `auth` choice PSK/certificate (PSK); `action` choice
  bring-up/send/rekey (bring-up); `selectorMatch` toggle (on).
- **Presets:**
  - `site-to-site` IKEv2 bring-up then an inner packet 10.1.0.5 → 10.2.0.9 wrapped in tunnel mode and delivered.
    From RFC 7296 / RFC 4301; the catalogue's "step a site-to-site tunnel coming up".
  - `transport` host-to-host in transport mode: original IP header kept, only payload protected. From RFC 4301 §3.2.
  - `no-selector` a packet to a destination outside the selectors: not tunnelled. From RFC 7296 §2.9.
  - `rekey` Child SA lifetime reached: a new SA pair is created and traffic moves to it. From RFC 7296 (rekeying).
- **Steps:** `site-to-site` 8, `transport` 8, `no-selector` 5, `rekey` 6.
- **Legend:** IKE SA (control box), Child/ESP SA (data box with SPI), tunnel-mode packet (outer header around the
  whole inner packet), transport-mode packet (inner header kept, payload wrapped), auth ok/fail, changed (kit
  highlight on the SA or packet touched this step).
- **Captions:** hr: "IKE_SA_INIT: pristupnici Diffie–Hellmanom dogovaraju ključeve za upravljački kanal." / en:
  "IKE_SA_INIT: the gateways agree keys for the control channel with Diffie–Hellman." — hr: "Tunelski način:
  cijeli izvorni paket dobiva novo vanjsko IP zaglavlje." / en: "Tunnel mode: the whole original packet gets a new
  outer IP header."
- **Terms:** security association — sigurnosna asocijacija *(check)*; key exchange — razmjena ključa; tunnel mode —
  tunelski način; transport mode — transportni način; gateway — pristupnik; traffic selector — selektor prometa
  *(check)*; pre-shared key — unaprijed dijeljeni ključ; encapsulating security payload — ESP.
- **Misconceptions:** IKE encrypts the data (it sets up the keys; ESP carries data); tunnel vs transport is about
  strength (it is about who is protected); one SA is bidirectional.
- **Out of scope:** IKEv1 main/aggressive mode, NAT traversal detail, cipher suite negotiation internals, AH
  beyond a mention.
- **Builds on `diffie-hellman`:** reuses its key-agreement step for IKE_SA_INIT; new are the SA boxes, ESP
  wrapping, tunnel vs transport and traffic selectors.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh ipsec-ike sims/ipsec-ike` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/ipsec-ike/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
