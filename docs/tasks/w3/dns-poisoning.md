# dns-poisoning: DNS cache poisoning

| | |
|---|---|
| Task | `dns-poisoning` (wave 3, Internet and application protocols) |
| Catalogue entry | `inet-dns-poisoning` in `docs/catalogue.md` §4.2 |
| Kind | build a new simulator |
| Folder | `sims/dns-poisoning/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `internet` / `dns`, `attacks` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `dns-resolution` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **forged answers race the real one; TXID and port randomisation**.

The student: step the race at different entropy.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.2.
5. `sims/dns-resolution/` (the model this one builds on) and its `NOTES.md`.

## Sources

- No local course book covers this. Closest: `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/18-kiberneticka-sigurnost.md` "Prijetnje i napadi" (DNS lažiranje mentioned with ARP lažiranje, Pitanja 7) and `/home/rjasmin/projects/uvod-u-linux/book/chapters/19-dns.md` (TTL, `dnssec-validation`)
- RFC 5452 "Measures for Making DNS More Resilient against Forged Answers" (§3 acceptance rules, §4 source-port randomisation, §7 and §9 the probability calculation)
- RFC 4035 §5 (validation stops forged data); RFC 3833 "Threat Analysis of the DNS" (background)
- Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** kit view "message sequence chart" with four lanes: client, caching resolver, authoritative server, and an off-path forger. One query goes out with its identifying fields shown (question, transaction ID, UDP source port); the genuine answer travels on the long arrow; forged answers arrive on a shorter arrow before it. A counter panel shows the guessing space and the probability that one forged answer matches.
- **State:** `{ entropy: { txidBits, portBits }, forgedPerRace, races, accepted: 'real'|'forged'|null, cache: { name, addr, ttl, poisoned }, dnssec, now, log[] }`.
- **One step:** one phase of one race, in order: (1) resolver sends the query; (2) forged answers arrive (drawn as a bundle with a count, not one arrow each); (3) the resolver checks the match rules; (4) the genuine answer arrives and is accepted or discarded; (5) cache state and TTL are shown. The match outcome is deterministic per preset (seeded `Simdeck.rng`, seed as a param) and the probability is always shown next to it.
- **Rules:**
  1. A resolver accepts an answer only if it matches the outstanding query: same question, same transaction ID, from the address and port it asked, to the source port it used (RFC 5452 §3, §4).
  2. The first matching answer wins; later ones for the same query are discarded (RFC 5452 §3, check).
  3. The chance that one forged answer matches is 1 / (2^txidBits × 2^portBits): 16-bit ID only → 1/65,536; with source-port randomisation across ~16 bits → about 1/4.3 × 10⁹ (RFC 5452 §7 and §9.2 give the calculation, check exact port range).
  4. While a genuine answer is cached, there is no query and so no race until its TTL expires (ties to `dns-ttl-cache`); a forged answer that wins is cached for the TTL it carries.
  5. With DNSSEC validation on and a signed zone, a forged answer fails its signature check and the resolver returns SERVFAIL instead of caching it (RFC 4035 §5; see `dnssec-chain`).
- **Params:** choice `entropy` "ID only (16 bit)" / "ID + random port (≈32 bit)", default ID only; range `forgedPerRace` 1–1000, default 100; toggle `dnssec`, default off; range `seed` 1–99.
- **Presets** (all derived, unchecked):
  1. `id-only` — 16-bit ID, fixed port, 100 forged answers per race: P(match) = 100/65,536 ≈ 0.15 % per race. With seed 7 the forged answer loses; the page shows the expected number of races before a match (≈ 655).
  2. `random-port` — same, plus random source port: P ≈ 100/4.3 × 10⁹ ≈ 2.3 × 10⁻⁸ per race. Outcome: genuine answer accepted.
  3. `ttl-limits-races` — TTL 3600 s: at most one race per hour per name, so ≈ 655 races take ≈ 27 days at 16 bits, and ≈ 4.3 × 10⁷ races ≈ 4,900 years with random ports (arithmetic shown).
  4. `dnssec-on` — a forged answer is forced to match (to show the last line of defence): validation fails, the client gets SERVFAIL, nothing is cached.
- **Steps:** 5 per race; `ttl-limits-races` 6 (one race plus the time-scale summary).
- **Legend:** solid arrow = genuine answer, dashed arrow bundle = forged answers, lock = DNSSEC signature; "changed" marks the field compared or the cache entry written this step.
- **Captions:** hr: "Rezolver prihvaća samo odgovor s istim pitanjem, istom oznakom transakcije i na isti izvorišni port. Uz 16 bita za oznaku i nasumičan port, jedan lažni odgovor pogađa s vjerojatnošću oko 1 : 4,3 milijarde." en: "The resolver accepts only an answer with the same question, transaction ID and source port. With a 16-bit ID and a random port, one forged answer matches with a probability of about 1 in 4.3 billion."
- **Terms:** *cache poisoning* — trovanje predmemorije; *transaction ID* — oznaka transakcije; *source port randomisation* — nasumičan izvorišni port; *forged answer* — lažirani odgovor; *entropy* — entropija; *validation* — provjera (DNSSEC).
- **Misconceptions:** "DNS over UDP trusts anything that arrives"; "a long TTL makes poisoning easier" (it limits races, but a poisoned entry also lives longer); "DNSSEC prevents the race" (it prevents acceptance, not the race).
- **Reuse from `dns-resolution`:** resolver, cache and authoritative lanes; new here are the match fields and the probability panel.
- **Out of scope:** on-path attackers, attack tooling or traffic generation of any kind, birthday-style variants, 0x20 case randomisation, DNS cookies. The page explains why the defences work; it does not teach how to mount the attack.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh dns-poisoning sims/dns-poisoning` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/dns-poisoning/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
