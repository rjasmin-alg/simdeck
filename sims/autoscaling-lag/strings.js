/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of autoscaling-lag, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* marks an English term in italics on the Croatian page (the page
   turns it into <em lang="en">); the terms are missing from kit/glossary.js and written out this way (NOTES.md,
   "Term pairs"). Numbers are formatted by the page with the decimal separator below. The title and subtitle come from
   sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Potražnja i kapacitet jedne usluge po taktovima, narudžbe kapaciteta, iskorištenost i p99 prema cilju',
      chart: 'Stupci potražnje, kapacitet po blokovima, narudžbe od takta narudžbe do takta isporuke, ρ i p99 po taktu',
      dec: ',',

      scenario: 'Scenarij',
      scSpike: 'Vršak',
      scProv: 'Rezervacija',
      scSpot: 'Spot',
      scenarioHint: 'Spot: ormari A i B po 10, spot 8, potražnja 20.',
      lead: 'Vrijeme isporuke',
      lead1: '1 takt',
      lead4: '4 takta',
      lead9: '9 taktova',
      spike: 'Vršak 16 u taktovima 2\u2060–\u20606',
      baseline: 'Osnovni kapacitet',
      policy: 'Skaliranje',
      polNone: 'nikakvo',
      polReactive: 'reaktivno',
      polPre: 'unaprijed',
      policyHint: 'Reaktivno: nakon ρ > 0,8 naruči do ρ 0,7.',
      noOrders: 'Bez skaliranja nema narudžbi.',
      leadFixed: 'Rezervacija stiže za 3 takta; skaliranje ovdje ništa ne naručuje.',

      presetProv: 'Rezervirani blok',
      presetProvHint: 'Naručen u 0. taktu, radi od 3.: ρ 1,6 → 0,53, p99 0,66 s',
      presetFast: 'Brzo autoskaliranje',
      presetFastHint: 'Isporuka 1 takt: zasićen samo 2. takt, zatim 22,9 i ρ 0,70',
      presetSlow: 'Sporo autoskaliranje',
      presetSlowHint: 'Isporuka 4 takta: zasićeni taktovi 2–5',
      presetLate: 'Prekasno',
      presetLateHint: 'Isporuka 9 taktova: 12,9 stiže u 11. taktu, ρ 0,35',
      presetSpot: 'Spot i domene kvara',
      presetSpotHint: 'Ispad ormara A u taktovima 2–4, spot oduzet u 6.',

      legendDemand: 'potražnja',
      legendBaseline: 'osnovni kapacitet',
      legendReserved: 'rezervirani',
      legendSpot: 'spot',
      legendOrder: 'narudžba → isporuka',
      legendSat: 'zasićeno',
      legendSlo: 'cilj p99',
      legendChanged: 'promijenjen ishod',

      axisCap: 'zah./s',
      axisTick: 'takt',
      rowRho: 'ρ',
      rowP99: 'p99',
      sec: '{v} s',
      pct: '{v}',
      inf: '∞',
      slo: 'cilj ≤ {v}',
      orderAmt: '+{v}',
      orderAt: 'takt {t}',
      orderBeyond: '→ takt {t}',
      down: 'ispad',
      reclaimed: 'oduzet',
      blockRackA: 'A',
      blockRackB: 'B',
      blockSpot: 'spot',

      nSat: ['{n} takt zasićenja', '{n} takta zasićenja', '{n} taktova zasićenja'],
      nSpike: ['{n} takt', '{n} takta', '{n} taktova'],
      range: '{a}–{b}',

      cLagSpike: 'Autoskaliranje (*autoscaling*) je reagiralo u {a}. taktu, ali novi kapacitet stiže tek u {b}. — {sat}, a vršak traje {spike}.',
      cLag: 'Autoskaliranje (*autoscaling*) je reagiralo u {a}. taktu, ali novi kapacitet stiže tek u {b}. taktu — {sat}.',
      cLagNoSat: 'Autoskaliranje (*autoscaling*) je reagiralo u {a}. taktu na ρ {rho}, a novih {amt} stiže u {b}. taktu. Nijedan takt nije zasićen, ali p99 je iznad cilja dok kapacitet ne stigne.',
      cTooLate: 'Autoskaliranje je naručilo {amt} u {a}. taktu, ali kapacitet stiže tek u {b}. taktu, nakon vrška (taktovi {from}–{to}): {sat}, a novih {amt} stoji gotovo neiskorišteno uz ρ {rho}.',
      cBeyond: 'Autoskaliranje je naručilo {amt} u {a}. taktu, ali uz isporuku za {lead} kapacitet stiže tek u {b}. taktu, nakon kraja prikaza: {sat}.',
      cPre: 'Vršak je bio poznat unaprijed: {amt} naručeno je u {a}. taktu, {lead} ranije, i radi od {b}. takta, kad vršak počinje. Nijedan takt nije zasićen; nakon vrška kapacitet miruje uz ρ {rho}.',
      cNoScaler: 'Bez autoskaliranja: {sat} ({list}), a ništa ne naručuje dodatni kapacitet.',
      cNoScalerCalm: 'Bez autoskaliranja: najveće opterećenje je potražnja {d} na kapacitetu {c}, ρ {rho}, p99 {p}; ništa se ne naručuje.',
      cPreSat: 'Vršak je bio poznat unaprijed: {amt} naručeno je u {a}. taktu i radi od {b}. takta. Ipak {sat} ({list}): naručeni kapacitet se već računa, pa autoskaliranje čeka njega.',
      cCalm: 'Potražnja {d} na kapacitetu {c}: ρ {rho}, nije iznad 0,8, pa autoskaliranje ništa ne naručuje — a p99 je već {p}, iznad cilja od {slo}.',
      cCalmOk: 'Potražnja {d} na kapacitetu {c}: ρ {rho}, p99 {p}, unutar cilja; autoskaliranje nema što raditi.',
      cProv: 'Rezervirani blok naručen je u 0. taktu, ali radi tek od {b}.: taktovi 0–{last} zasićeni su uz ρ {rho0}; od {b}. takta kapacitet je {c}, ρ {rho}, p99 {p}, ispod cilja od {slo}.',
      cSpot: 'Spot blok oduzet je u {t}. taktu: kapacitet pada na {c} uz potražnju {d}, i ništa ga samo ne vraća.',

      explain:
        '<p>Kapacitet usluge zbroj je blokova koji rade. Novi blok ne radi odmah: od narudžbe do rada prođe ' +
        '<em lang="en">lead time</em> (vrijeme isporuke). Blok naručen u taktu <var>t</var> radi od takta ' +
        '<var>t</var> + isporuka.</p>' +
        '<p><em lang="en">Autoscaling</em> (autoskaliranje) ovdje je reaktivno: nakon takta u kojem je iskorištenost ' +
        '<var>ρ</var> = potražnja / kapacitet veća od 0,8 naruči toliko da <var>ρ</var> padne na 0,7, umanjeno za ono ' +
        'što je već naručeno. Pomaže samo kad nagli porast opterećenja, <em lang="en">load spike</em> (vršak), traje ' +
        'dulje od vremena isporuke; kraći vršak prođe zasićen, a kapacitet stigne kad više ne treba. Poznati vršak ' +
        'može se naručiti unaprijed, vrijeme isporuke ranije.</p>' +
        '<p>ρ = 0,8 nije 20 % rezerve: uz 10 zah./s srednje vrijeme u sustavu već je pet puta dulje od samog ' +
        'posluživanja, a p99 2,3 s (vidi simulator o kašnjenju pri gotovo punoj iskorištenosti). Na <var>ρ</var> ≥ 1 ' +
        'red raste bez granice: stupac dobiva „∞”.</p>' +
        '<p>Blokovi su raspoređeni po <em lang="en">failure domain</em> (domena kvara), npr. ormarima: ispad jednog ' +
        'ormara uzme samo njegove blokove, a oni se vrate kad ormar proradi. <em lang="en">Spot instance</em> ' +
        '(prekidiva instanca) jeftiniji je kapacitet koji davatelj smije oduzeti; oduzet blok ne vraća se sam. ' +
        'To nije samo jeftiniji kapacitet: ne može se planirati unaprijed. <em lang="en">Reserved capacity</em> ' +
        '(rezervirani kapacitet) ostaje, ali se čeka.</p>' +
        '<p>Smanjivanje kapaciteta, predviđanje i trošak nisu dio ovog prikaza.</p>'
    },
    en: {
      stage: 'Demand and capacity of one service per tick, capacity orders, utilisation and p99 against the target',
      chart: 'Demand bars, capacity by block, orders from the tick they are placed to the tick they come online, ρ and p99 per tick',
      dec: '.',

      scenario: 'Scenario',
      scSpike: 'Spike',
      scProv: 'Reserved',
      scSpot: 'Spot',
      scenarioHint: 'Spot: racks A and B with 10 each, spot 8, demand 20.',
      lead: 'Lead time',
      lead1: '1 tick',
      lead4: '4 ticks',
      lead9: '9 ticks',
      spike: 'Spike to 16 at ticks 2\u2060–\u20606',
      baseline: 'Baseline capacity',
      policy: 'Scaling',
      polNone: 'none',
      polReactive: 'reactive',
      polPre: 'ahead',
      policyHint: 'Reactive: after ρ > 0.8, order up to ρ 0.7.',
      noOrders: 'No scaling, no orders.',
      leadFixed: 'The reserved block takes 3 ticks; scaling orders nothing here.',

      presetProv: 'Reserved block',
      presetProvHint: 'Ordered at tick 0, online at 3: ρ 1.6 → 0.53, p99 0.66 s',
      presetFast: 'Fast scaler',
      presetFastHint: 'Lead time 1 tick: only tick 2 saturated, then 22.9 and ρ 0.70',
      presetSlow: 'Slow scaler',
      presetSlowHint: 'Lead time 4 ticks: ticks 2–5 saturated',
      presetLate: 'Too late',
      presetLateHint: 'Lead time 9 ticks: 12.9 arrives at tick 11, ρ 0.35',
      presetSpot: 'Spot and failure domains',
      presetSpotHint: 'Rack A down at ticks 2–4, spot reclaimed at 6',

      legendDemand: 'demand',
      legendBaseline: 'baseline capacity',
      legendReserved: 'reserved',
      legendSpot: 'spot',
      legendOrder: 'order → online',
      legendSat: 'saturated',
      legendSlo: 'p99 target',
      legendChanged: 'outcome changed',

      axisCap: 'req/s',
      axisTick: 'tick',
      rowRho: 'ρ',
      rowP99: 'p99',
      sec: '{v} s',
      pct: '{v}',
      inf: '∞',
      slo: 'target ≤ {v}',
      orderAmt: '+{v}',
      orderAt: 'tick {t}',
      orderBeyond: '→ tick {t}',
      down: 'down',
      reclaimed: 'reclaimed',
      blockRackA: 'A',
      blockRackB: 'B',
      blockSpot: 'spot',

      nSat: ['{n} saturated tick', '{n} saturated ticks'],
      nSpike: ['{n} tick', '{n} ticks'],
      range: '{a}–{b}',

      cLagSpike: 'Autoscaling reacted at tick {a}, but the new capacity arrives only at tick {b}: {sat}, and the spike lasts {spike}.',
      cLag: 'Autoscaling reacted at tick {a}, but the new capacity arrives only at tick {b}: {sat}.',
      cLagNoSat: 'Autoscaling reacted at tick {a} to ρ {rho}, and the new {amt} arrive at tick {b}. No tick saturates, but p99 is over the target until the capacity arrives.',
      cTooLate: 'Autoscaling ordered {amt} at tick {a}, but the capacity arrives only at tick {b}, after the spike (ticks {from}–{to}): {sat}, and the new {amt} sit almost idle at ρ {rho}.',
      cBeyond: 'Autoscaling ordered {amt} at tick {a}, but with a lead time of {lead} the capacity arrives only at tick {b}, after the end of the run: {sat}.',
      cPre: 'The spike was known ahead: {amt} ordered at tick {a}, {lead} early, is online at tick {b} when the spike starts. No tick saturates; after the spike the capacity idles at ρ {rho}.',
      cNoScaler: 'No autoscaler: {sat} ({list}), and nothing orders more capacity.',
      cNoScalerCalm: 'No autoscaler: the busiest tick is demand {d} on capacity {c}, ρ {rho}, p99 {p}; nothing is ordered.',
      cPreSat: 'The spike was known ahead: {amt} ordered at tick {a} runs from tick {b}. Still {sat} ({list}): the capacity on order already counts, so the autoscaler waits for it.',
      cCalm: 'Demand {d} on capacity {c}: ρ {rho}, not above 0.8, so the autoscaler orders nothing — yet p99 is already {p}, over the {slo} target.',
      cCalmOk: 'Demand {d} on capacity {c}: ρ {rho}, p99 {p}, within the target; the autoscaler has nothing to do.',
      cProv: 'The reserved block was ordered at tick 0 but runs only from tick {b}: ticks 0–{last} are saturated at ρ {rho0}; from tick {b} capacity is {c}, ρ {rho}, p99 {p}, under the {slo} target.',
      cSpot: 'The spot block was reclaimed at tick {t}: capacity drops to {c} for a demand of {d}, and nothing brings it back by itself.',

      explain:
        '<p>A service\'s capacity is the sum of the blocks that run. A new block does not run at once: between the order ' +
        'and the first tick it runs lies the <em>lead time</em>. A block ordered at tick <var>t</var> runs from tick ' +
        '<var>t</var> + lead time.</p>' +
        '<p><em>Autoscaling</em> here is reactive: after a tick whose utilisation <var>ρ</var> = demand / capacity is ' +
        'above 0.8, it orders enough to bring <var>ρ</var> back to 0.7, less what is already on order. It helps only ' +
        'when the <em>load spike</em> lasts longer than the lead time; a shorter spike passes saturated, and the ' +
        'capacity arrives when it is no longer needed. A known spike can be ordered ahead, one lead time early.</p>' +
        '<p>ρ = 0.8 is not 20 % headroom: at 10 req/s the mean time in the system is already five times the service ' +
        'time alone, and p99 is 2.3 s (see the simulator on latency near full utilisation). At <var>ρ</var> ≥ 1 the ' +
        'queue grows without bound: the bar gets an "∞".</p>' +
        '<p>Blocks are spread over <em>failure domains</em>, racks for example: one rack down takes only its own ' +
        'blocks, and they come back when the rack does. A <em>spot instance</em> (preemptible) is cheaper capacity ' +
        'the provider may take back; a reclaimed block does not come back by itself. It is not just cheaper ' +
        'capacity: it cannot be planned for. <em>Reserved capacity</em> stays, but has to be waited for.</p>' +
        '<p>Scaling in, prediction and cost are not part of this picture.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
