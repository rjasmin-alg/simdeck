<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# lnx-routing-decision: notes

New stepper (task `docs/tasks/w2/lnx-routing-decision.md`, catalogue §4.4). Rules and expected numbers: `SPEC.md`.
The LAN is kit view K2 (`kit/topology.js`), the routing table kit view K4 (`kit/ruletable.js`); the rest is HTML.

## Decisions

- **Scene** (as `cetiri-podatka-i-tri-mjesta.svg`): on top the three places of demosrv1 side by side, ① the interface
  (name, admin state, address and prefix, its network), ② the routing table (K4), ③ the name files (the `hosts:` line
  with each source's result during a lookup, `/etc/hosts`, the `nameserver` line and "← from the profile `ipv4.dns`").
  Below, the LAN `192.168.122.0/24` (K2: demosrv1, democli1, the gateway that is also the name server, the internet)
  and the terminal: the command, its phases as chips (③ name → ② route → ⇄ the other side, ✓ / ✕ / – pending) and its
  output with the exit status. The place the command uses has a thick border; a place still broken has a dashed
  "broken" tag; what the command read or changed has the kit's changed mark. Each place has its own shape and series
  colour (① circle c1, ② square c2, ③ diamond c3), so the grayscale screenshot keeps them apart.
- **The route lookup in K4**, mode `specific`: every row is read at once (`at: 'all'`, the pointer column hidden), the
  rows that contain the destination are hits ranked by the model's order (prefix, metric, table order), the winner is
  outlined with "✓ gateway" / "✓ on the link", the others "▽ loses" with their `via` struck. The implicit row is "no
  row → unreachable", and it wins when nothing matches. The mark column's header names the destination, and "for DNS"
  when the lookup is the name server's (a name lookup through DNS reads the table too: that is why DNS fails without an
  address). Columns: destination, via, metric; `dev` is always `enp1s0` and `proto` did not fit at 1920×1080 (the
  terminal shows the full `ip route` lines).
- **`break` is a fault at step 0**, not a command in the script, so changing it live re-runs the same commands (task
  "Params"). The presets set `script` and `break` together; a preset's story starts with the fault already there, and
  its first step reads the broken place (`ip route`, `ip -br addr`, `cat /etc/resolv.conf`). At step 0 the broken place
  carries the changed mark (task "Legend").
- **`script`** is a param (a select of the six presets, `resets`), because the steps differ per preset and `break` must
  re-run the same list.
- **`target`** applies to a ping whose destination has a name (healthy step 6, stale-hosts step 3, no-default step 4):
  by address there is no name phase. `getent` is always by name and `ip route get` always by address.
- **Nobody there:** a LAN address where nobody answers (`.99` from the stale line, `.250` the wrong name server) is drawn
  as one hatched "nobody there" node, present for the whole demo when the script and break send to it (`strangers()`).
- **The packet in K2:** the ping (to the next hop on the bus, and gateway → internet when off-link), or the DNS query
  when the step's last network action was the name lookup. Route lookups send nothing; they badge the next hop and the
  destination.
- **The profile fix** (`bad-resolver` step 4) brings the connection up again, which in the model also restores the
  address and the default and connected routes (so `bad-resolver` with `break: address` ends repaired, and says so).
- **Captions** stay within two lines at 1920×1080 in both languages for every script × break × target × step (720
  states, a Playwright scan). The task's caption (no-default step 4) is used as written.

## Deviations from the task

- **Healthy script:** `getent hosts democli1` and `ping -c1 democli1` instead of `getent hosts demosrv1` and `ping -c1
  1.1.1.1`. With the book's commands, `resolver` and `hosts` broke nothing in the default script (demosrv1's own name is
  in `/etc/hosts`, 1.1.1.1 needs no name), which defeats "break each one, see which command fails". Now every break
  fails at least one command (SPEC.md "Break each place").
- **On-link `ip route get`:** `ip route get 192.168.122.186` on demosrv1 instead of the book's `ip route get
  192.168.122.57` on democli1, to keep one host in the scene. The output has the same shape (no `via`, `src` the host's
  address).
- **stale-hosts:** UL Primjer 2 mirrored onto democli1: the stale line is `192.168.122.99 democli1` and the pings go to
  democli1. The task's `ping 192.168.122.57` from demosrv1 would ping the host itself over the `local` table, which is
  out of scope.
- **State:** the task's `steps: [{ place, result }]` is called `phases` (with `phase` added), so it does not read as the
  kit's steps. Added `profile`, `broke`, `text`, `lookup`, `name`, `packet`, `route`, `dest`.
- **The resolver break** assumes the profile has `ipv4.ignore-auto-dns yes` besides `ipv4.dns 192.168.122.250`: the
  book's profile is DHCP, and without it `.1` from DHCP would be listed too and resolution would succeed slowly.
- **`ping -c1 -W1`** everywhere: the book's silent no-reply output comes from `-W 1`; without it an absent on-link host
  gives `Destination Host Unreachable` lines.
- **`/etc/hosts`** holds `192.168.122.57 demosrv1` (the book does not show the file; the `no-address` preset needs the
  own name there).
- **Outputs:** IPv6 addresses are left out (`ip -br addr` also prints `::1/128` and the `fe80::` address in reality);
  ping lines are shortened with "…" (ttl, time and the rtt line made up nothing).
- **Command line of the fix:** two commands, `sudo nmcli connection modify 'cloud-init enp1s0' ipv4.dns 192.168.122.1`
  and `sudo nmcli connection up 'cloud-init enp1s0'` (the book's profile name and `connection up` output), as one step.

## Sources

- UL ch14, read for this task: "Sučelje, adresa i ruta" (`ip -br link/addr`, `ip route`, `ip route get` with and
  without `via`, definitions), "Ime umjesto adrese" (`hosts: files dns myhostname`, `/etc/hosts`, `resolv.conf`,
  `getent` exit statuses, NetworkManager writing the file, the fix in `ipv4.dns`), "Trajna konfiguracija" (`nmcli
  connection modify/up` and its output, the profile name `cloud-init enp1s0`), "Dijagnostika" (the seven-rung ladder;
  `ping` to `.99` with 100 % loss and exit 1), Primjer 2 and 3. Diagram `cetiri-podatka-i-tri-mjesta.svg`.
- `sims/routing-table/sim.js` @ 7bd975d: `parse`, `format`, `mask`, `match` copied into `sim.js` (models/ has no IPv4
  model yet); the lookup itself is new because it adds the metric tie-break.
- From memory, not checked against a machine *(check)*: metric as the tie-break at equal prefix (ip-route(8)); the
  kernel removing routes whose `src` was a deleted address (the DHCP default route); `ip link set down` removing the
  device's routes; `RTNETLINK answers: Network is unreachable` and `ping: connect: Network is unreachable`, both exit 2;
  `Error: Nexthop has invalid gateway.` for a gateway that is not on the link; ping's `Temporary failure in name
  resolution` / `Name or service not known` and exit 2 (the reviewer confirmed these with high confidence); nss-myhostname's `127.0.0.2` without an address; the listing
  order of `ip route` (network, the longer prefix first, metric); `nmcli connection up` restoring the address and routes.
- Made up: `www.example.org` → `203.0.113.10` (RFC 5737, task), the DNS zone, the `.99` and `.250` addresses (task).

## Concepts, not tools

The subject is how a Linux host keeps address, route and resolver, which the course (UL ch14) teaches with `ip`,
`getent`, `/etc/nsswitch.conf`, `/etc/resolv.conf` and NetworkManager's profile by name; those are what is taught. No
other product is named. The commands only read state or make the book's own changes.

## Term pairs

From the glossary: *network interface*, *IP address*, *network prefix*, *default route*, *gateway*, *name
resolution*, *resolver*. Missing from `kit/glossary.js`, written out in both tables:

- *routing table* — **usmjerivačka tablica** (UL ch14; task "Terms")
- *route lookup* — **traženje rute** (task caption)

## Shared requests

- **Kit (K2):** cards put the mark beside the lines; at five columns in half the stage that wraps every name, so the
  page stacks the mark above the lines (`.rd-net .sd-topo-card`). A `compact` or `stack` card option would serve
  other pages with five or more nodes.
- **Kit (K4):** an `at: 'all'` table still draws an empty pointer column; the page hides `.sd-rt-ptr`.
- **Models:** the IPv4 helpers are copied for the third time (`subnet-mask` → `routing-table` → here); an `ipv4` model
  in `models/` (parse, format, mask, match, and a lookup with the metric tie-break) would serve all three.

## Checks

- `node --test sims/lnx-routing-decision/sim.test.js`: tie-breaks first (metric, table order, longer prefix beats
  metric), one or more per rule, the ladder, "break each place", every preset's numbers, faults and strangers, then the
  template's generic block.
- **Mutations:** 34 of my own (one per rule and tie-break, the outputs, the breaks, the fix, the packets); 33 caught,
  the survivor is equivalent (a line after an early return).
- **Fresh review** (a separate agent read the task, SPEC.md, the model, tests, strings and page against UL ch14; 55
  mutations on a copy; nine states in a browser). Fixed from it: a name lookup that fails for want of a route to the
  name server was blamed on the name (rule 7 now gives it the address or route rung, with its own caption); the fix's
  "also put back the address" when only the route was gone; the `hosts:` caption claiming `/etc/hosts` answered when it
  had not; a ping that found no route still drew the DNS query; `ping -W1`; the resolver break's `ignore-auto-dns`
  assumption; deleting the address flushes every route on the device; same-network listing order (longer prefix
  first); a one-row caption for `ip route get 1.1.1.1`; "the own network" in English. Tests added for its survivors
  (first hosts line wins, an off-link gateway refused on a healthy host, the DNS packet's reply, the ping's via, what
  the fix marks, the resolver break in the profile, listing order with metrics, the address rung of an empty table).
  Not taken: a node for the `.253`/`.254` routers of `longest-prefix` (the table and caption name them; a sixth column
  does not fit); the `search` list (out of scope, noted in SPEC.md).
- Fit: every script × break × target × step in both languages at 1920×1080 and 2560×1440 (Playwright scan): no
  overflow in the stage, captions within two lines at 1920×1080.
- `npm run gate -- lnx-routing-decision`: pass. Screenshots at 1920×1080 light, dark, grayscale and 375×812 in both
  languages reviewed, plus each preset at its key step.

## Time

2026-10-22 23:15 to 23:53, one session: reading and design, model, tests and page, fit and screenshots, a fresh
review (run while NOTES.md was written) and its fixes: about 38 minutes of work.
