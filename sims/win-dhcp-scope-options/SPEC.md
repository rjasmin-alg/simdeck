<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# win-dhcp-scope-options — specification

One concept: **exclusions and reservations decide the address; server, scope, class and reservation options are
merged per option, and the most specific level that sets an option wins.** Class: explorer (no steps). Task:
`docs/tasks/w2/win-dhcp-scope-options.md`; catalogue `docs/catalogue.md` §4.5.4 and the contrast in §5.1.

Every number and rule below is checked by `sim.test.js`. *(check)* marks a vendor rule or number that could not be
confirmed against the vendor's documentation in this session (no network access to it); `NOTES.md` lists them.

## 1. The world

| Thing | Value | Source |
|---|---|---|
| DHCP server | `DHCP1` | task |
| Scope | `10.0.10.0/24`, range `10.0.10.10`–`10.0.10.250` | task |
| Exclusion range (toggle `exclusion`, default on) | `10.0.10.10`–`10.0.10.30` | task |
| Lease (option 051) | 8 days = 691 200 s, a scope property | Microsoft "DHCP Server": default 8 days *(check)* |
| T1 | half the lease: 4 days = 345 600 s | RFC 2131 §4.4.5 (T1 = 0.5 × lease); UL ch18 "Koliko dodjela traje"; same arithmetic as `dhcp-dora` |
| Server options | 006 `10.0.0.10`, 015 `corp.example` | task |
| Scope options | 003 `10.0.10.1`; 006 `10.0.10.53` when `scope006` is on (default off); 051 the lease | task |
| Scope class option | 042 `10.0.0.123` for vendor class `VoIP-Phone`, when `classNtp` is on (default off) | task |
| Reservation | printer `02-AB-CD-0A-0B-0C` → `10.0.10.40`; its option 003 `10.0.10.254` when `resOption003` is on (default off) | task |
| Clients | laptop `02-AB-CD-01-02-03` (no class); phone `02-AB-CD-04-05-06` (vendor class `VoIP-Phone`, option 60); printer (above) | task; MACs of the phone and printer chosen here |

The options shown are 003 Router, 006 DNS Servers, 015 DNS Domain Name, 042 NTP Servers, 051 Lease (RFC 2132 §3.5,
§3.8, §3.17, §8.3, §9.2). The vendor class travels in option 60 (RFC 2132 §9.13), the user class in option 77 (RFC
3004). No client in the presets sends a user class; the model handles one the same way as a vendor class.

## 2. Rules

1. **Address.** A client with a reservation (matched by MAC) gets the reserved address. Any other client gets the
   lowest free address of the range: not excluded, not reserved, not leased to a client before it (Microsoft,
   "Manage DHCP scopes: exclusions and reservations" *(check)*). Windows' real choice order is not documented here;
   the model takes the lowest *(check)*. Dynamic clients lease in a fixed order: laptop, then phone.
   - Expected: exclusion on → laptop `10.0.10.31`, phone `10.0.10.32`; exclusion off → laptop `10.0.10.10`, phone
     `10.0.10.11`; printer always `10.0.10.40`. With the exclusion on the next free address for a new client is
     `10.0.10.33`.
   - Tie-break: equal candidates cannot happen (addresses are distinct); a reserved address inside the range is never
     handed to another client, even when it is the lowest free.
2. **Reservations and exclusions.** A reservation must lie in the scope's subnet (`inSubnet`, tested). Exclusions take
   addresses out of the pool, typically for static servers and gateways. Whether a reservation may sit inside an
   exclusion range is not modelled *(check)*; the reservation `10.0.10.40` is outside `10.0.10.10–30`.
3. **Option precedence, per option.** Levels from least to most specific: server (rank 1) → server class (2) → scope
   (3) → scope class (4) → reservation (5). For each option code separately, the most specific level that sets it
   **and applies to the client** wins; the levels it beat are listed as overridden (Microsoft, "DHCP options
   precedence" *(check)*). Reservation options apply only to the client of that reservation.
   - Expected: defaults, laptop: 003 `10.0.10.1` from scope; 006 `10.0.0.10` and 015 `corp.example` from server; 042
     not sent; 051 8 days from scope.
   - Tie-break: two levels never share a rank; one option is set at most once per level and class (the state is
     keyed by code). Different options can come from different levels for the same client (per option, not per
     level).
4. **Class options.** Within one level, an option set for a vendor or user class that the client presents (option 60
   / 77) beats the plain option of that level; a class option for a class the client does not present does not apply
   *(check)*. Ranks 2 and 4 encode it. Reservation-level class options are not modelled.
5. **Not sent.** An option set at no level that applies to the client is not sent (the table's implicit row).
6. **Changes reach a client at renewal.** The client keeps the configuration of its last lease. A changed option
   reaches it only when it renews: at T1 (4 days with the 8-day lease) or by hand (Renew). Until then the page shows
   "still has the old value" for each option that differs. At renewal a dynamic client keeps its address if it is
   still valid (in the range, not excluded, not reserved for someone else); otherwise it gets the lowest free one
   (the server refuses the old address *(check)*).
   - Modelled with a hidden param `held`: a 4-bit mask of the toggles at the clients' last renewal (bit 1 `scope006`,
     2 `resOption003`, 4 `exclusion`, 8 `classNtp`). Renew sets the option bits to the current toggles; the exclusion
     bit becomes "on" if it is on now **or** was on at the last lease (exclusion on → off: the clients keep `.31`/`.32`,
     which are still valid; off → on: `.10`/`.11` are excluded now and are replaced by `.31`/`.32`). Renew renews
     every client (the held mask is one for all three).
   - Expected (`change-needs-renew`): scope 006 set after the laptop's lease → the server would now send
     `10.0.10.53`, the laptop still has `10.0.0.10` until Renew.
7. **Contrast** (catalogue §5.1): this is most specific wins, not first match; the page's explanation says so and
   relates `rule-first-match`.

## 3. State (`initial(params)`, JSON-safe)

`server: { options, classOptions }`, `scope: { subnet, range, exclusions, lease, options, classOptions,
reservations: [{ name, mac, ip, options }] }`, `leases: [{ name, mac, ip }]` (what the dynamic clients hold now, since their last renewal),
`client: { name, mac, vendorClass, userClass, reserved }`, `offer` (the client's address at its next renewal), `nextFree` (what a new client would get now, besides the
held leases),
`ladders: { [code]: [{ level, rank, value, cls, applies, hit, miss }] }`, `effective: [{ code, value, level,
overridden: [{ level, value }] }]`, `has: { ip, options: { [code]: value | null } }` (what the client holds since its
last renewal), `stale: [code | 'ip']`, `t1` (seconds).

## 4. Params and presets

Params: `client` laptop / printer / phone (default laptop); `scope006` (off); `resOption003` (off); `exclusion`
(on); `classNtp` (off); `focus` the option shown in the rule table (003, 006, 015, 042, 051; default 006); `held`
(hidden, default 4). Button Renew (key `O`).

| # | Preset | Params | Expected |
|---|---|---|---|
| 1 | `server-and-scope` | defaults, focus 003 | laptop `10.0.10.31`; 003 from scope, 006 and 015 from server |
| 2 | `scope-overrides` | `scope006`, held 5, focus 006 | laptop DNS `10.0.10.53` from scope, server's `10.0.0.10` overridden; 015 still from server |
| 3 | `reservation` | printer, `resOption003`, held 6, focus 003 | printer `10.0.10.40`; 003 `10.0.10.254` from reservation beats scope `10.0.10.1`; the laptop (same params) keeps `10.0.10.1` |
| 4 | `class-option` | phone, `classNtp`, held 12, focus 042 | phone 042 `10.0.0.123` from scope class; the laptop gets no 042 |
| 5 | `change-needs-renew` | `scope006`, held 4, focus 006 | effective 006 `10.0.10.53`; the laptop still has `10.0.0.10`; Renew → has `10.0.10.53` |

All presets are derived from the task, not from a vendor screenshot.

## 5. Out of scope

DHCP policies (`win-dhcp-policies`), failover, superscopes, DNS registration, relay, reservation-level class options,
lease expiry and rebinding (`dhcp-dora`).
