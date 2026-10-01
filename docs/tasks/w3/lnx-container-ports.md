# lnx-container-ports: Publishing a container port

| | |
|---|---|
| Task | `lnx-container-ports` (wave 3, Linux) |
| Catalogue entry | `lnx-container-ports` in `docs/catalogue.md` §4.4 |
| Kind | **add a preset to `sims/port-forwarding/`** (no page of its own) |
| Folder | `sims/port-forwarding/` |
| Class | stepper |
| Size | S |
| Priority | P2 |
| Courses | NLA |
| Topic / tags / level | `linux-admin` / `containers`, `tcp` / `advanced` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; **hard:** `port-forwarding` merged; only one preset task per host folder at a time |

## Goal

One concept: **-p is DNAT on the host**.

The student: publish ports, connect from outside.

This is a **preset on `port-forwarding`** (Port forwarding (DNAT)), not a page of its own (catalogue §5). Add it to that sim's presets, with its own strings in both languages and its own tests. If the host's model cannot express it without changes, write the change you need under "Shared requests" in the host's `NOTES.md` and stop.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.4.
5. `sims/port-forwarding/` (the host page) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/napredna-linux-administracija/meta/toc.md`, §3 Kontejneri, topic T16 ("Mreža kontejnera — mostovi, objava porta, razrješavanje imena među kontejnerima"); chapters not written yet
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/16-cjelina-klik-do-odgovora.md` (table row "Prevođenje adrese (NAT)") and `10-ipv6.md` (RFC 1631, RFC 2993 notes); port of the URM PAT page `/home/rjasmin/projects/uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/pat.html` (inbound packets with no mapping)
- `/home/rjasmin/projects/uvod-u-linux/book/chapters/15-vatrozid-selinux-i-udaljeni-pristup.md` (vatrozid, firewalld zones; for the bypass preset)
- RFC 3022 (Traditional NAT, NAPT); nft(8) and iptables-extensions(8), `DNAT` target
- podman-run(1) `--publish` (address-bound publish, rootless `rootlessport`/pasta); Docker documentation "Port publishing and mapping" and "Packet filtering and firewalls" (no SNAT for rootful publish, published ports bypass ufw/firewalld input rules, docker-proxy); netavark's nftables output for rule wording; Podman/Docker default bridges (`podman0` 10.88.0.0/16, `docker0` 172.17.0.0/16) and "port is already allocated" error text, for the builder only
- Catalogue seed: NLA T16 → §5.12

## Overlaps (catalogue §5)

- **§5.12 NAT and port publishing:** urm-nat and urm-pat are near-duplicates (8,253 bytes each, same layout); merge them into one page with two modes on port. Port forwarding and container port publishing are both DNAT: one page with a "container" preset.

## Model and presets

This task adds presets to the `port-forwarding` host; it builds no model of its own.

- **Mapping onto the host:** the host's NAT router becomes the container host `host1` (outside address
  192.0.2.10 on `eth0`); the host's inside LAN becomes the container bridge 10.88.0.1/16 (one example
  subnet; label it "the container bridge"); the inside server becomes container `web` 10.88.0.5 listening on
  tcp/80. The host's forward table row is what publishing writes. Outside client: 203.0.113.7.
- **What the host model must support** (request under "Shared requests" in `sims/port-forwarding/NOTES.md`
  if it does not):
  1. a DNAT rule `{proto, matchAddr (any | one host address), hostPort} → {insideIp, insidePort}` added by a
     step (the publish command), not only at preset load;
  2. the inbound path: DNAT in prerouting, then the forward path to the inside host, a connection-tracking
     entry, and the reply's source rewritten back (un-DNAT) on the way out (Sources: RFC 3022, DNAT target);
  3. a connection attempt with no matching rule that ends in "connection refused" (nothing listening on the
     host port);
  4. a rule bound to one host address only (`127.0.0.1`), so an outside connection does not match;
  5. a refused rule add when the host port is already taken (error caption, table unchanged);
  6. labels per preset (the host's strings come from the host; the preset supplies its own in hr and en).
  If item 2 already exists for the host's own presets, only items 4–5 are likely new.
- **Rules shown:**
  1. Publishing host port 8080 to container port 80 (`run -p 8080:80 web`) adds DNAT tcp dport 8080 →
     10.88.0.5:80 on every host address; the container engine writes it into the host's nat table
     *(check rule wording against the engine's rule output, Sources)*.
  2. The client's source address is not rewritten: `web` sees 203.0.113.7 (DNAT only, no SNAT) (rootful
     engine).
  3. Without publishing, the container is reachable from the host via 10.88.0.5 but not from outside: there
     is no rule (derived).
  4. Publishing on `127.0.0.1:8080:80` matches only connections to 127.0.0.1; from outside → refused.
  5. A second publish on host port 8080 fails: the host port is already allocated (engine error)
     *(check text)*.
  6. DNAT happens in prerouting, before the input/forward decision, so the packet takes the forward path;
     a host firewall that only filters input does not see it, so published ports bypass the host's input
     rules *(check for an engine that adds its own forward rules; Sources)*.
- **Presets:**
  1. `publish`: `run -d -p 8080:80 web`; 203.0.113.7:51000 → 192.0.2.10:8080 becomes → 10.88.0.5:80; the
     reply 10.88.0.5:80 → 203.0.113.7:51000 leaves as 192.0.2.10:8080. Steps: run (rule appears), SYN in,
     DNAT, forward, deliver, reply, un-DNAT: 7. Derived from rules 1–2.
  2. `not-published`: same container without `-p`; outside → 192.0.2.10:80 → refused; from the host, a
     request to 10.88.0.5 works. 5 steps. Derived.
  3. `loopback-only`: `-p 127.0.0.1:8080:80`; outside → refused; on the host a request to 127.0.0.1:8080
     works (needs the host's local-origin path; if the host has no output-path DNAT, drop this second half).
     5 steps. Derived.
  4. `port-taken`: second container `-p 8080:80` → error, table unchanged; `-p 8081:80` works. 4 steps.
     Derived.
  5. `firewall-bypass` (optional, only if the host models an input filter): input policy allows only tcp/22,
     yet the 8080 connection succeeds via forward. 6 steps. Derived, unchecked.
- **Captions:**
  - hr: "`-p 8080:80` nije ništa drugo nego pravilo *DNAT* (prevođenje odredišne adrese) na domaćinu: 192.0.2.10:8080 postaje 10.88.0.5:80."
  - en: "-p 8080:80 is nothing more than a DNAT rule on the host: 192.0.2.10:8080 becomes 10.88.0.5:80."
  - hr: "Pravilo vrijedi samo za adresu 127.0.0.1, pa paket izvana ne pogađa ni jedan redak tablice."
  - en: "The rule applies only to 127.0.0.1, so a packet from outside matches no row."
- **Terms:** port publishing — objava porta (NLA toc T16); NAT — prevođenje adrese (NAT) (URM ch16);
  container — kontejner; bridge — most (NLA T06, T16); connection tracking — praćenje veza *(check)*;
  firewall — vatrozid (UL ch15).
- **Misconceptions:** the container itself listens on the host's port (it is the host's NAT rule); a
  published port is protected by the host's input firewall rules; publishing needs SNAT so the container
  sees the host as the client.
- **Out of scope:** rootless publishing (a rootless engine forwards in user space, not with DNAT: mention it
  in the explanation as the exception), a user-space port proxy, IPv6, UDP, random host ports, name
  resolution between containers (rest of T16).
- **Note for the coordinator:** the Kind line says "build a new simulator; adds a preset": it is only a
  preset. The host `port-forwarding` has no local course source and its own model is not filled yet; check
  that it gets items 1–5 above before this task starts.

<!-- model: filled -->

## Steps

1. Skip: this is a preset on the host.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/port-forwarding/` changed (and only the preset's parts of them).
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
