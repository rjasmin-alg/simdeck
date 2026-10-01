# arp-spoofing: ARP spoofing, man in the middle

| | |
|---|---|
| Task | `arp-spoofing` (wave 3, Networking basics and LAN protocols) |
| Catalogue entry | `net-arp-spoofing` in `docs/catalogue.md` §4.1 |
| Kind | build a new simulator |
| Folder | `sims/arp-spoofing/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | URM, SEC |
| Topic / tags / level | `networks` / `arp`, `attacks` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `arp-local-remote` is merged and reuse its model (COMMON.md §6); uses kit view K2 topology with moving packets once it exists; until then draw your own and say so in NOTES.md |

## Goal

One concept: **a forged reply rewrites the victim's ARP cache**.

The student: step the attack, then turn on dynamic ARP inspection.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.1.
5. `sims/arp-local-remote/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md` "ARP: od IP adrese do MAC adrese" (ARP request broadcast / unicast reply, the ARP table, a new reply *supersedes* the old entry with no check; ARP is stateless and needs no authentication) and Šire o temi (ARP spoofing / cache poisoning as the direct consequence)
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Prijetnje i napadi" (MITM; ARP spoofing on the local segment) and Primjer 2 "ARP lažiranje kao čovjek u sredini na lokalnom segmentu" (why it works, whose traffic now flows through the attacker, why the edge firewall never sees it)
- RFC 826 (ARP: swap fields, unicast reply, "the new hardware address supersedes the old one"), RFC 5227 (IPv4 Address Conflict Detection / gratuitous ARP = ARP Announcement)
- MITRE ATT&CK T1557.002 "Adversary-in-the-Middle: ARP Cache Poisoning"; CVE-1999-0667
- Cisco, "Dynamic ARP Inspection" (DAI) and "DHCP Snooping" configuration guide (the defence: validate ARP against the DHCP snooping binding table on trusted/untrusted ports) *(check: no local copy)*
- Catalogue seed: URM ch08 (ARP), ch18 (the attack); builds on `arp-local-remote`

## Model and presets

- **Scene:** one Ethernet segment with a switch and three hosts: victim V, gateway GW, attacker X. Each host
  shows its **ARP table** (IP → MAC). The switch optionally shows DHCP-snooping trusted/untrusted ports and a
  binding table. A traffic arrow shows where V's packets to GW actually go. Reuses `arp-local-remote`'s ARP
  model and the K2 topology view (copied per COMMON.md §6).
- **State:** `{ step, arp: { V: {ip:mac}, GW: {...}, X: {...} }, flow: 'V->GW'|'V->X->GW', dai: bool,
  bindings: [{ip, mac, port, trusted}], lastReply: {from, claimsIp, withMac}, verdict }`.
- **One step:** one ARP event or one data packet. Attack phase: X sends a forged ARP reply ("GW's IP is at
  X's MAC") to V (and one to GW for the other direction); V overwrites its entry with no check; the next data
  packet from V to GW now goes to X, who forwards it on (MITM). Defence phase: with DAI on, the switch checks
  each ARP reply against the binding table and drops the forged one on the untrusted port. Order within a step:
  show the frame → (DAI check) → update table or drop → redraw the flow → caption.
- **Rules:**
  1. ARP request is broadcast to the whole segment; only the owner replies, unicast (URM ch08 "Što treba
     znati"; RFC 826).
  2. A host accepts and stores any ARP reply (or any sender's address in a request) and a new MAC supersedes
     the old entry with no verification that the claim is true (URM ch08; RFC 826 "supersedes the old one";
     MITRE T1557.002 "stateless and does not require authentication").
  3. Attack: X sends V a forged reply mapping GW's IP to X's MAC; V's cache now points GW → X, so V's traffic
     for GW goes to X, who can read, modify and forward it — man in the middle (URM ch18 Primjer 2; MITRE
     T1557.002).
  4. Bidirectional: to intercept both ways X also poisons GW's cache (V's IP → X's MAC); otherwise only one
     direction is captured (derived from rule 3; URM ch18 Primjer 2 forwards traffic on).
  5. The edge firewall/router never sees the attack: it happens entirely within the local segment, before any
     traffic reaches the network boundary (URM ch18 Primjer 2, last sentence — argument for defence in depth).
  6. Gratuitous ARP / ARP Announcement (a host announcing its own address) uses the same unaccountable
     mechanism, which is why it can be abused (URM ch08 Šire o temi; RFC 5227).
  7. Defence — Dynamic ARP Inspection: the switch trusts ARP only on trusted ports and, on untrusted ports,
     drops any ARP reply whose IP/MAC/port does not match the DHCP-snooping binding table, so the forged reply
     from X is discarded and V's cache stays correct (Cisco DAI *(check)*).
  8. Tie-break / determinism: the most recent accepted reply wins the cache entry (rule 2); with DAI, a reply
     that fails the binding check is dropped and the entry is unchanged, regardless of order.
- **Params:** `dai` toggle (default off); `direction` choice `one-way`|`two-way` poisoning (default two-way);
  `attackerPort` choice `untrusted`|`trusted` (default untrusted, to show DAI only guards untrusted ports);
  button `reset-cache`.
- **Presets:**
  1. `clean` — V resolves GW normally: broadcast request, unicast reply, V's cache GW → GW-MAC, traffic V→GW
     direct. Baseline from `arp-local-remote` / URM ch08.
  2. `poison` — X sends the forged reply; V's cache entry for GW flips to X-MAC with no check; V→GW traffic now
     routes V→X→GW. From URM ch18 Primjer 2. Outcome: MITM established, firewall blind (rule 5).
  3. `two-way` — X poisons both V and GW; full bidirectional interception. Rule 4. Derived from URM ch18.
  4. `dai-blocks` — same attack with DAI on and X on an untrusted port: the switch compares the forged reply
     to the binding table (GW's IP is bound to GW-MAC on GW's port), drops it; V's cache stays GW → GW-MAC,
     traffic stays direct. Rule 7. From Cisco DAI *(check)*.
- **Steps:** 4 (`clean`), 6 (`poison`), 8 (`two-way`), 7 (`dai-blocks`). Derived.
- **Legend:** victim V (c1), gateway GW (c2), attacker X (danger); ARP request (dashed, to all), ARP reply
  (solid, unicast); forged reply marked with a skull/warning icon; data flow arrow; DAI drop (red X on the
  switch port). "changed" marks the ARP-table row that just changed and the redirected flow.
- **Captions:**
  - hr: "Napadač šalje lažni ARP odgovor: „IP pristupnika je na mojoj MAC adresi". Žrtvina ARP tablica
    prepisuje zapis bez provjere — od sad promet za pristupnik ide napadaču."
  - en: "With Dynamic ARP Inspection on, the switch checks the reply against the DHCP-snooping binding table,
    sees GW's IP does not belong to the attacker's port, and drops it. The victim's cache stays correct."
- **Terms:** ARP spoofing / cache poisoning — ARP lažiranje / trovanje ARP predmemorije; man in the middle —
  čovjek u sredini; ARP table / cache — ARP tablica; gratuitous ARP — ARP objava (gratuitous ARP);
  Dynamic ARP Inspection — dinamička provjera ARP-a (DAI) *(check)*; DHCP snooping — nadzor DHCP-a *(check)*;
  default gateway — zadani pristupnik; forged reply — lažni odgovor.
- **Misconceptions:** the switch or firewall stops ARP spoofing by default (it is on-segment, below the
  boundary, rule 5); ARP verifies who replies (it accepts any reply, rule 2); you need to beat GW's reply in a
  race (the latest reply simply overwrites, rule 8); a strong password helps (wrong layer — URM ch18 says so).
- **Out of scope:** static ARP entries, 802.1X port auth, the DHCP snooping mechanism itself
  (`net-dhcp-rogue`), IPv6 NDP spoofing (`net-ipv6-ndp`), packet contents once intercepted (TLS defends the
  payload — note only).
- **Builds on `arp-local-remote`:** reuses its ARP request/reply and cache model on one segment; new are the
  forged reply, the MITM flow redirection, and the DAI/snooping defence.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh arp-spoofing sims/arp-spoofing` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/arp-spoofing/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
