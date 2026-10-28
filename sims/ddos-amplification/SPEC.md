<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ddos-amplification: spec

One concept: **spoofed small requests become large replies at the victim** (task
`docs/tasks/w3/ddos-amplification.md`, catalogue `inet-ddos-amplification`, §4.2, wave 3). An explorer: the
student picks a public UDP service (which sets the amplification factor), the sent rate, the victim's link
capacity and the defences; the arrow widths, the load gauge and the caption recompute at once.

Out of scope (task): how to find or use reflectors, attack tooling, botnets, real incidents, scrubbing products.
The page shows the arithmetic and the defences only. Header overhead is ignored (stated on the page).

## Scene

Three columns, from the URM ch18 diagram `ch18-drdos-pojacavanje.svg`:

- **Sender** (left): emits small requests whose *source address is forged to the victim's*. Rate `sentMbps`.
- **Reflectors** (middle): a row of publicly reachable UDP services. Each answers the request — to the address in
  the request, i.e. the victim. The reply is larger than the request by the service's factor.
- **Victim** (right): its access link is a pipe of fixed capacity `victimMbps`. A gauge shows load against it.

Request arrows are thin and dashed (forged source), reply arrows solid with width ∝ rate. A defence panel lists
what each defence stops.

## Services and the amplification factor (rule 2)

The **bandwidth amplification factor (BAF)** = UDP payload bytes of the reply / UDP payload bytes of the request
(URM ch18, footnote `cisa-drdos`; US-CERT/CISA Alert TA14-017A). One representative figure per service, taken
from the alert's BAF table (checked against TA14-017A, last revised 2019-12-18):

| service (page label) | BAF | alert row | note |
|---|---|---|---|
| DNS (open resolver) | 54 | DNS: 28 to 54 | top of the published range; the book's "nekoliko desetaka" |
| SNMPv2 | 6.3 | SNMPv2: 6.3 | a small factor, for contrast |
| SSDP | 30.8 | SSDP: 30.8 | |
| NTP | 556.9 | NTP: 556.9 | a factor in the hundreds |

Default service `dns`. The figures are the alert's; a range row (DNS) is represented by the top of its range, the
worst case the attacker exploits. The protocol names are data (language-neutral, `translate="no"`).

## State (explorer), derived from the params

```
{ service, baf,
  sentMbps, sentEffective,          // sentEffective = 0 when ingress filtering is on (rule 6a)
  reflectedMbps,                    // what arrives at the victim's link (rule 3), after the defences
  victimCapacity,                   // = victimMbps
  load, loadPct, times,            // reflectedMbps / victimCapacity, as a fraction, a %, and a ×-factor
  saturated,                        // reflectedMbps >= victimCapacity (rule 4)
  effectiveMbps,                    // headroom left for legitimate traffic: max(0, capacity - reflectedMbps)
  defences: { ingressFiltering, reflectorsClosed, rateLimit, victimFilter },
  stopped: { atSource, atReflector } }   // which defence removed the traffic, for the caption and the panel
```

`round1(x) = Math.round(x * 10) / 10`. All displayed Mbit/s are `round1`.

## Rules

1. **Reflected = sent × BAF** (rule 3, URM ch18): `rawReflected = sentEffective × baf`, summed over reflectors
   (one service class here; header overhead ignored, stated on the page). `reflectedMbps = round1(rawReflected ×
   defence factors)`.
2. **BAF per service** matches the table above (rule 2).
3. **Ingress filtering** at the sender's network (BCP 38 / RFC 2827, rule 6a): the forged requests never leave, so
   `sentEffective = 0` and `reflectedMbps = 0`; the victim's link is free, `effectiveMbps = capacity`. It
   dominates every other defence (nothing reaches the reflectors). `stopped.atSource = true`.
4. **Reflectors closed** (rule 6b): no service answers, `reflectedMbps = 0`. `stopped.atReflector = true`. (If
   ingress filtering is also on, the traffic was already stopped at the source; `atSource` wins in the caption.)
5. **Rate limiting** the reflectors (rule 6b, illustrative): halves the reflected rate (`× 0.5`). Applied after
   services close (if closed, the rate is already 0).
6. **Victim-edge filter does not help** (rule 6c, URM ch18 "filtriranje jedne adrese ne pomaže…"): a filter at the
   victim's own edge drops the flood only *after* it has crossed the access link, so `load`, `times` and
   `saturated` are **unchanged**. It is the key misconception, shown as a defence that moves nothing.
7. **Saturation** (rule 4): `saturated = reflectedMbps >= victimCapacity`. Boundary (tie-break): exactly equal is
   saturated (`>=`). Legitimate traffic then competes for what is left; the model shows it as "saturated", no
   queueing detail. `load` is **not** clamped (it can read > 100 %); `effectiveMbps` is clamped at 0.

### Defence order (deterministic)

`sentEffective = ingressFiltering ? 0 : sentMbps`. `base = sentEffective × baf`. `afterClose = reflectorsClosed ?
0 : base`. `afterLimit = rateLimit ? afterClose × 0.5 : afterClose`. `reflectedMbps = round1(afterLimit)`.
`victimFilter` changes nothing numeric (rule 6).

## Presets (arithmetic from rule 1; BAF from the table)

| id | service | sentMbps | victimMbps | defences | → reflected | load | point |
|---|---|---|---|---|---|---|---|
| `book-dns` | dns (54) | 10 | 1000 | — | 540 | 54 % | URM Pitanja 6: a DNS reply dwarfs the request; a 1 Gbit/s link at about half |
| `saturation` | dns (54) | 10 | 100 | — | 540 | 540 % | same attack, a 100 Mbit/s link: saturated ~5× over |
| `larger-factor` | ntp (556.9) | 10 | 1000 | — | 5569 | 557 % | a factor in the hundreds: 10 Mbit/s alone exceeds a 1 Gbit/s link |
| `ingress-filtering` | dns (54) | 10 | 100 | ingressFiltering | 0 | 0 % | preset 2 + BCP 38 at the source: forged requests never leave, victim free |
| `victim-side-filter` | dns (54) | 10 | 100 | victimFilter | 540 | 540 % | preset 2 + a filter at the victim only: the link is still full (rule 6) |

(540 = round1(10 × 54); 5569 = round1(10 × 556.9).)

## Steps

None (explorer). `class: "explorer"`, no `steps`.

## Legend

- request arrow: thin, dashed, with the forged-source chip (`izvor = žrtva` / `source = victim`);
- reply arrow: solid, width ∝ rate;
- the load gauge with a capacity threshold mark;
- "saturated" (over the mark, hatched);
- the four defence switches with labels;
- "changed": the arrows or gauge that moved with the last param change (thick ink outline + highlighter).

## Captions

hr: "Faktor pojačanja propusnosti je 54: svaki bajt upita postaje 54 bajta odgovora. 10 Mbit/s lažiranih upita
stiže žrtvi kao oko 540 Mbit/s odgovora." en: "The bandwidth amplification factor is 54: every byte of request
becomes 54 bytes of reply. 10 Mbit/s of forged requests reach the victim as about 540 Mbit/s of replies."
(Computed live from the actual BAF and rates; a defence or saturation adds one sentence.)

## Terms (not yet in `kit/glossary.js`; written out in both tables, listed in NOTES "Term pairs")

*denial of service (DoS)* — uskraćivanje usluge; *distributed DoS (DDoS)* — distribuirano uskraćivanje usluge;
*amplification* — pojačavanje; *bandwidth amplification factor* — faktor pojačanja propusnosti; *spoofed source
address* — lažirana izvorišna adresa; *reflector* — reflektor (book: *pojačalo* / javna UDP usluga); *ingress
filtering* — filtriranje na ulazu (BCP 38); *rate limiting* — ograničavanje brzine.

## Misconceptions (from the task)

- "the attacker needs as much bandwidth as the victim" — no: the sent rate is small, the factor does the work;
- "blocking the attacker's address stops it" — the packets come from thousands of legitimate servers;
- "the reflectors are the attackers" — they are tricked public services;
- "a filter at the victim helps" — once the access link is full, dropping the flood at the victim is too late
  (preset `victim-side-filter`, rule 6).
