<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dns-ttl-cache: specification

One concept: **an answer already handed out lives in caches until its TTL runs out; lower the TTL one full old TTL
before you move.** Task `docs/tasks/w3/dns-ttl-cache.md`, catalogue `inet-dns-ttl-cache` (§4.2). Class: stepper.

## Scene

- The zone `lab.example` on its authoritative server: `posluzitelj.lab.example A` 192.168.180.1 (old), from t = 0
  192.168.180.2 (new). `$TTL 3600`, SOA `MINIMUM` 900. In the new-name scenario `novi.lab.example A` 192.168.180.3
  is added at t = 0. (UL ch19 Primjer 2: `$TTL 3600`, `MINIMUM` 900, the names. The addresses are invented, in
  the book's 192.168.180.0/24 lab range *(derived)*.)
- Three caching resolvers R1–R3 (three offices), each with one client that asks at every step and shows the answer
  it got: old, new or "no such name".
- A time axis in minutes relative to the change (t = 0, "utorak 09:00" / "Tuesday 09:00"). Times in the model are
  seconds; the page shows minutes.

## Parameters

| key | values | default | notes |
|---|---|---|---|
| `scenario` | `move`, `newname` | `move` | move = the address changes at 0; newname = a name is added at 0 |
| `oldTtl` | 3600, 1800, 300 s | 3600 | the zone's TTL before any lowering; also the SOA's own TTL |
| `lower` | on / off | off | lower the record's TTL before the move (move only) |
| `lowerAt` | −120 … 0 min, step 10 | −70 | when the TTL is lowered (move, `lower` on) |
| `newTtl` | 300, 60 s | 300 | the lowered TTL (move, `lower` on) |
| `stepMin` | 5, 10 min | 10 | one step; resets the demo |

`changeAt` is fixed at 0. Every param resets the demo: each one moves the window (below).

## The window (derived from the params)

- **move:** `from` = `lowerAt` or −2 steps, whichever is earlier, when `lower` is on; otherwise −`oldTtl` (a full
  old TTL of history). `to` = when the lowering came at least one full old TTL before the change ("in time"),
  2 steps (at least one new TTL, since `newTtl` ≤ 300 s ≤ one step); otherwise `oldTtl`.
- **newname:** `from` = −5 min (the first question); `to` = `from` + (negative TTL + 1 step) rounded up to a step.
- If that is more than 20 steps, `from` moves later so the run is 20 steps (the lowering is then left of the axis).
- Steps = (`to` − `from`) / step.

## Who asks when

- **move:** every resolver is busy: its office asks for `posluzitelj.lab.example` all the time. A resolver whose
  entry expires therefore asks the authoritative server **at the moment it expires**, not at the next step. The
  client icon shows the answer at each step's time. Each resolver has a fixed phase, the time of one of its
  fetches: R1 −50 min, R2 −20 min, R3 −5 min; before the first zone edit it fetched every `oldTtl` along that
  phase. (Task numbers for `book-naive`.)
- **newname:** the clients ask for `novi.lab.example`, from −5 min (R1), 0 (R2) and +5 min (R3) on, and from then on
  all the time like above. Before its first question a client shows nothing.

## One step

Advance t by the step. Then process every event in (t − step, t] in time order; at equal times **zone edits come
first**, then the resolvers in id order (task: (1) edits at or before t, (2) clients in id order). Events:

- a zone edit (TTL lowered, address changed, name added);
- an entry reaching `fetchedAt + ttl` (rule 1) → the resolver asks at once (rule 2);
- a client's first question → the resolver asks.

Then each client asks at t and gets the cached answer (rule 5). Step 0 is the same run up to `from` inclusive.

## Rules

1. **Expiry.** A cached entry may be used while `t < fetchedAt + ttl`; at `t = fetchedAt + ttl` it is expired and
   the resolver asks again. Tie-break: equality counts as expired. (UL ch19 "Tko odgovara kad se pita za ime",
   definition *TTL zapisa*; RFC 8767 §4 as cited there; same as `dns-resolution` rule 6.)
2. **Fetch.** On a miss the resolver gets the zone's **current** address and the zone's **current** TTL. The TTL is
   fixed in the entry at fetch time: a later TTL change in the zone does not shorten entries already cached. (UL
   ch19 Primjer 2: "sniženje vrijedi samo za ono što se dijeli odsad nadalje"; RFC 1035 §3.2.1.)
3. **No recall.** Nothing removes a cached entry before it expires; a change in the zone does not reach caches. (UL
   ch19 Primjer 2: "ne postoji način da ga se odande pozove natrag".)
4. **Negative caching.** A "no such name" answer is cached for min(SOA `MINIMUM`, the SOA record's TTL) =
   min(900, `oldTtl`) s: 900 s at the default `oldTtl` 3600, 300 s at `oldTtl` 300. (RFC 2308 §5; UL ch19 Primjer 2
   and the definition *negativno predmemoriranje*.) The lowering changes the TTL of `posluzitelj` only, not the
   SOA.
5. **Remaining TTL.** The answer a resolver gives its client carries `fetchedAt + ttl − t`. (RFC 1035 §4.1.3; RFC
   8767 §4.) *(check: §4.1.3 defines the field, the decrement is RFC 1035 §7.4 / RFC 8767 §4.)*
6. **The authoritative server is always up.** Serve-stale (RFC 8767) is out of scope.

## Marks per step

- **source:** `auth` if the entry the client got was fetched in this step's interval (t − step, t], else `cache`.
  At step 0: `auth` only if it was fetched at `from`.
- **changed:** the cached value (address, or no-such-name) differs from the previous step.
- **refetches:** how many times the resolver asked in the interval (300 s TTL and 10 min steps: 2).
- **old until:** for a resolver that holds the old address at t ≥ 0, the time its entry expires: no earlier switch
  is possible (rule 3).

## Presets and expected numbers

Checked with an independent Python hand model before the model was written (NOTES.md, "Checks").

1. **`book-naive`** — `lower` off, `oldTtl` 3600, step 10. Window −60 … +60, **12 steps**. Entries at t = 0 were
   fetched at −50, −20, −5 with 3600 s. R1 switches at **+10**, R2 at **+40**, R3 at **+55** min: old answers for
   up to 55 min after the change (one old TTL in the worst case). At step +40 R2's caption: "R2's record fetched at
   −20 min (TTL 3600 s) expired, so it asked the authoritative server and now answers with the new address
   192.168.180.2". At +50 R3 answers old with 300 s left.
2. **`book-lowered`** — `lower` on at **−70**, `newTtl` 300, step 5. Window −70 … +10, **16 steps**. The 3600 s
   entries expire at −50 (R1, fetched −110), −20 (R2, fetched −80) and −65 (R3, fetched −125; the task's −75 does
   not fit R3's phase, NOTES.md) and are refetched with 300 s. From then on each refetches every 5 min on the
   5-minute grid, so all three expire at exactly 0, ask after the edit (edits first) and **switch at 0**. At most one
   new TTL (5 min) of old answers in general.
3. **`lowered-too-late`** — `lower` on at **−10**, step 10. Window −20 … +60, **8 steps**. R2 fetched at −20 with
   3600 s and keeps the old address until **+40** (rule 2). R1 fetched at −50 with 3600 s: old until **+10**. R3
   fetched at −5, after the lowering, with 300 s, and switches at **0**. Worst case: an entry fetched just before
   −10 lasts until +50 (task: "window still ~60 min").
4. **`negative`** — `scenario` newname, step 5. Window −5 … +15, **4 steps**. R1 asks for `novi` at −5: NXDOMAIN,
   cached 900 s, so "no such name" at −5, 0 and +5; at **+10** it expires (equality) and R1 gets 192.168.180.3. R2
   first asks at 0, after the name was added (edits first): the new address at once. R3 at +5: the same.

## Out of scope

The iterative walk from the root (`dns-resolution`), serve-stale, prefetching, client-side OS and browser caches,
putting the TTL back up after the move.
