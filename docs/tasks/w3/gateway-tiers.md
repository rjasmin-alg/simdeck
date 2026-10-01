# gateway-tiers: Multi-tier relay through a gateway

| | |
|---|---|
| Task | `gateway-tiers` (wave 3, Radio and crisis communications) |
| Catalogue entry | `kk-gateway-tiers` in `docs/catalogue.md` §4.10 |
| Kind | build a new simulator |
| Folder | `sims/gateway-tiers/` |
| Class | stepper |
| Size | M |
| Priority | P3 |
| Courses | KK |
| Topic / tags / level | `radio` / `emergency-comms` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged; soft: start after `directed-net` is merged and reuse its model (COMMON.md §6) |

## Goal

One concept: **local nets, gateways and delay to the coordination level**.

The student: send a message from field to HQ.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.10.
5. `sims/directed-net/` (the model this one builds on) and its `NOTES.md`.

## Sources

- `/home/rjasmin/projects/KAKA/KK2_Napredne_Krizne_Komunikacije.pptx` (text from `ppt/slides/*.xml`): "Ograničenja jednostavne mreže" (one NCS handles 10–15 stations), "Višeslojna mrežna arhitektura" (local / regional / national / international tiers and bands), "Međumrežna veza — Gateway operater" (only station between tiers, no content changes, "via" prefix), "Dokumentacijski standardi za napredne operacije" (serial format, e.g. 9A1NCS-260501-047; gateways add their own), "Greške specifične za napredne operacije" (bypass), "Vježba 2 — Višeslojna krizna mreža".
- `/home/rjasmin/projects/KAKA/KK_Operativni_Prirucnik.docx` §7.4 "Model eskalacije" (which band per incident size) and §8.3 "Vježba 3 — Višeslojna mreža s HF" (gateway bypass error; serial continuity check through gateways).
- Catalogue seed: KK2 slides

## Model and presets

- **Scene:** three nets stacked as tiers, each a horizontal slot strip with its own NCS: local (tactical) net on
  VHF/UHF, regional net on HF 80 m, national net on HF 40 m (international 20 m drawn greyed, out of scope). One
  gateway station per pair of tiers sits on both strips (GW1 local↔regional, GW2 regional↔national). A message
  card travels from the field station F to HQ (the national NCS), gaining a "via" prefix and a serial number at
  each gateway; a delay clock adds up the time spent queueing and sending in each tier.
- **State:** `{ t, tiers: [{id, band, slotS, ncs, queue: [msgIds], busyUntil}], gateways: [{id, from, to}],
  msg: {id, text, from, to, prio, path: ['F', 'via GW1', …], serials: ['9A1NCS-260501-047', …], tier, phase:
  'queued'|'sending'|'acked', delayS}, background: [{tier, count}] }`.
- **One step:** one exchange in the tier where the message currently is (queue wait shown as one step per
  message ahead, or collapsed), phases: (1) the tier's NCS serves the head of its queue; (2) if it is our message:
  sender → receiver in that net, ACK; (3) at a gateway: it adds "via [own call]" and its own serial and registers
  the message in the next tier's queue; (4) the delay clock adds the tier's slot time.
- **Reused from `directed-net`:** one net = NCS + queue + 2 slots per message (send, ACK). **New:** several nets
  with different slot lengths, gateways that belong to two nets, the via prefix and serial chain, end-to-end delay.
- **Rules:**
  1. Tiers (KK2 "Višeslojna mrežna arhitektura"): local net VHF/UHF up to 30 km with its own NCS; regional net HF
     80 m or a relay chain; national net HF 40 m coordinating regional NCSs. Every tier has its own NCS;
     horizontal traffic goes through the NCS.
  2. The gateway is the only station that talks between two tiers; it receives in one and forwards to the next
     tier's NCS (KK2 "Međumrežna veza — Gateway operater").
  3. The gateway never changes the content; it adds the relay prefix "[local call] via [gateway call]"; a message
     may cross several gateways and each is recorded (KK2).
  4. Every message that crosses tiers gets a serial number [NCS call]-[YYMMDD]-[number], e.g. 9A1NCS-260501-047;
     each gateway adds its own serial when the message passes (KK2 "Dokumentacijski standardi").
  5. Delay per tier = (messages ahead × 2 + 2) × slot length; slot length 15 s on VHF/UHF, 30 s on HF
     *(illustrative)*. End-to-end delay = sum over tiers.
  6. Bypass is an error (KK2 "Greške specifične za napredne operacije"; handbook Vježba 3 problem 2): a local NCS
     calling the national NCS directly skips the regional log, and the serial chain shows a gap.
  7. Priorities order each tier's queue as in `priority-traffic` (HITNO first); this page shows one message's
     journey, so background traffic is routine.
- **Params:** `busyRegional` range 0–6 messages ahead (default 0); `busyNational` range 0–6 (default 0);
  `prio` choice RUTINSKO / PRIORITET / HITNO (default RUTINSKO); `bypass` toggle (default off); `slotHF` range
  15–60 s (default 30).
- **Presets** (delays from rule 5; call signs fictional, the serial format from KK2):
  1. `quiet` (KK2): F → local NCS net → GW1 → regional → GW2 → national (HQ); no traffic ahead: 2 × 15 + 2 × 30 +
     2 × 30 = 150 s. Path "F via GW1 via GW2", serials: local 9A1NCS-260501-047, then one per gateway.
  2. `busy-regional`: 4 routine messages ahead in the regional net: + 8 × 30 s = 390 s; the tier with the queue,
     not the distance, sets the delay.
  3. `priority-jump`: as 2 with `prio` PRIORITET → it goes ahead of the 4 routine messages: back to 150 s.
  4. `bypass` (KK2 error; handbook Vježba 3 problem 2): the local NCS calls the national NCS directly: the regional
     log has no entry, the serial chain at HQ lacks the regional serial → flagged at the end check (handbook Vježba
     3 evaluation: "provjera kontinuiteta serijskih brojeva kroz gateway").
- **Steps:** 1: 6; 2: 10 (4 waits collapsed to one step each); 3: 6; 4: 5.
- **Legend:** tier strips by band label, NCS (bold), gateway (two-tier badge "GW"), message card (envelope) with
  via chain and serials, queue position numbers, delay clock. "Changed" marks the via chain or serial added in this
  step and the clock.
- **Captions:**
  - hr: „GW1 prima poruku u lokalnoj mreži i prijavljuje je regionalnom NCS-u kao „F via GW1“, sa svojim
    serijskim brojem. Sadržaj ne mijenja ni jednom riječju.“
  - en: "GW1 receives the message in the local net and registers it with the regional NCS as "F via GW1", with its
    own serial number. It does not change a single word of the content."
- **Terms** (KK2, handbook): multi-tier network — višeslojna mrežna arhitektura; local (tactical) net — lokalna
  (taktička) mreža; regional / national net — regionalna / nacionalna mreža; gateway operator — gateway operater;
  relay prefix — relay prefiks (check); serial number — serijski broj; coordination level — koordinacijska razina
  (check).
- **Misconceptions:** the gateway may summarise or fix a message (rule 3); going straight to the top is faster and
  harmless (preset 4); delay is set by distance (preset 2).
- **Out of scope:** HF propagation (`ionosphere-muf`), international procedure and English prowords, digital
  store-and-forward, frequency choice.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh gateway-tiers sims/gateway-tiers` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/gateway-tiers/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
