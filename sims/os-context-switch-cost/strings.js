/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of os-context-switch-cost, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms picked by {n} (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a
   glossary term (first mention; [[=term]] later ones). Cache and TLB are not in kit/glossary.js yet: the Croatian
   pair is written out (NOTES.md, Term pairs). The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Vremenska crta procesora, korisni udio vremena i graf prema kvantu',
      us: '{v} µs',
      ms: '{v} ms',
      pct: '{v} %',

      q: 'Kvant Q',
      qHint: 'Koliko dugo proces radi prije sljedeće promjene.',
      kind: 'Što se mijenja',
      kindHint: 'Dretva i označeni TLB čuvaju unose u TLB-u.',
      kind_process: 'proces',
      kind_thread: 'dretva',
      kind_tagged: 'označeni TLB',
      direct: 'Izravni trošak D',
      directHint: 'Spremanje i vraćanje stanja, raspoređivač.',
      wCache: 'Zagrijavanje priručne memorije',
      wTlb: 'Zagrijavanje TLB-a',
      wTlbOff: 'Bez brisanja TLB-a nema ni zagrijavanja TLB-a.',
      rate: 'Brzina tijekom zagrijavanja',
      rateHint: 'Udio pune brzine dok proces čeka na promašaje.',

      preset_desktop: 'Stolno računalo',
      hint_desktop: 'Kvant 10 ms: 100 promjena u sekundi, gubitak se jedva vidi.',
      preset_server: 'Poslužitelj',
      hint_server: 'Kvant 1 ms: oko tisuću promjena u sekundi.',
      'preset_too-often': 'Prečesto',
      'hint_too-often': 'Kvant 100 µs: vrijeme ne pojede sama promjena od 2 µs, nego zagrijavanje.',
      preset_threads: 'Dretve',
      hint_threads: 'Kvant 100 µs, isti adresni prostor: TLB ostaje, priručna memorija se ipak ohladi.',
      preset_thrash: 'Nikad zagrijan',
      hint_thrash: 'Kvant 20 µs kraći je od zagrijavanja od 50 µs.',

      legD: 'D promjena',
      legW: 'W zagrijavanje, uz zastoje',
      legU: 'U puna brzina',
      legAB: 'A, B: procesi ili dretve',
      legChanged: 'prešao 90 % ili 50 %',
      segD: 'D',
      segW: 'W',
      segU: 'U',
      proc_A: 'A',
      proc_B: 'B',

      tlHead: 'Procesor: A i B se izmjenjuju, kvant {Q}, prikazano {w}',
      tlLabel: 'Vremenska crta: šest kvanata, svaki počinje promjenom od {d}, zatim {wt} zagrijavanja i {f} pune brzine.',

      gHead: 'Korisno vrijeme procesora',
      gSplit: 'Jedan kvant i jedna promjena, {t}:',
      gD: 'D promjena konteksta',
      gW: 'zastoji tijekom W',
      gU: 'koristan rad: U i {r} od W',
      gRate: 'Promjena u sekundi',
      gCrossed: 'prešao {b}',
      gLabel: 'Korisno {p} vremena procesora; mjerila na 50 % i 90 %.',

      cHead: 'Korisno prema kvantu (logaritamska os)',
      cNow: 'sada',
      cLabel: 'Graf: korisni udio raste s kvantom; trenutni kvant {Q} daje {p}.',

      kSaved: 'Sprema se i vraća (upravljački blok)',
      kCold: 'Ohladi se',
      item_regs: 'registri opće namjene',
      item_pc: 'programsko brojilo',
      item_sp: 'pokazivač stoga',
      item_flags: 'zastavice (statusni registar)',
      item_fpu: 'registri FPU i SIMD',
      item_ptbr: 'registar baze tablice stranica',
      item_tlb: 'unosi u TLB-u',
      item_cache: 'sadržaj priručne memorije',
      st_saved: 'sprema se',
      st_same: 'isti, ne mijenja se',
      st_flushed: 'obrisani',
      st_kept: 'ostaju',
      st_tagged: 'ostaju, označeni',
      st_cold: 'istisnuo ga je drugi',
      note: 'Vremena su ilustrativna, nisu izmjerena.',

      cap_warm: 'Kvant {Q}: sama promjena konteksta traje {D}, ali proces zatim {W} radi sporo dok puni {fill}.',
      cap_thrash: 'Kvant {Q} nije dulji od zagrijavanja ({W}): proces nikad ne dođe do pune brzine i cijeli kvant radi s {r} pune brzine.',
      cap_nowarm: 'Kvant {Q}: nema zagrijavanja, pa promjena konteksta košta samo izravnih {D}.',
      fill_both: 'priručnu memoriju i TLB',
      fill_cache: 'priručnu memoriju (TLB ostaje)',
      cap_low: 'Korisno je samo {p} vremena procesora.',
      cap_high: 'Korisno je {p} vremena procesora.',
      cap_rate: ['{s} promjena u sekundi.', '{s} promjene u sekundi.', '{s} promjena u sekundi.'],
      cap_more: 'Zagrijavanje odnese {x} puta više od same promjene.',

      explain: '<p>Kad mu istekne [[time quantum]], proces ustupa procesor. Ta promjena, [[process switch]], ima dva ' +
        'troška. <b>Izravni</b>: jezgra sprema stanje procesora u [[process control block (PCB)]]: registre, programsko ' +
        'brojilo, pokazivač stoga, zastavice, FPU i SIMD. Raspoređivač bira sljedeći proces, a [[dispatcher]] vraća ' +
        'njegovo stanje. To traje nekoliko mikrosekundi.</p>' +
        '<p><b>Neizravni</b>: novi proces zatječe hladnu priručnu memoriju (<i lang="en">cache</i>), a nakon promjene ' +
        'adresnog prostora i prazan <i lang="en">TLB</i> (spremnik prijevoda adresa). Dok ih ne napuni, ' +
        'proces radi, ali često čeka na memoriju. Taj gubitak obično je mnogo veći od izravnog.</p>' +
        '<p>Što je kvant kraći, promjena je više u sekundi, a svaka nosi isto zagrijavanje. Ako je kvant kraći od ' +
        'zagrijavanja, proces nikad ne radi punom brzinom.</p>' +
        '<p>Kad se izmjenjuju dvije dretve istog procesa ([[thread]]), adresni prostor ostaje isti, pa ostaje i TLB; ' +
        'priručna memorija ipak se ohladi. Procesor s označenim TLB-om (unosi nose oznaku adresnog prostora) također ' +
        'ga ne mora brisati. Sistemski poziv je samo [[mode switch]]: proces ostaje isti, a plaća se samo promjena ' +
        'načina rada.</p>' +
        '<p><b>Česte zablude</b>: da je trošak samo spremanje registara; da su dretve besplatne; da je kraći kvant ' +
        'uvijek bolji jer je sustav odzivniji.</p>' +
        '<p>Brojke su ilustrativne. Ovdje se ne mjeri stvarni stroj i ne prikazuje politika raspoređivanja.</p>'
    },
    en: {
      stage: 'CPU timeline, useful share of time and a chart against the quantum',
      us: '{v} µs',
      ms: '{v} ms',
      pct: '{v} %',

      q: 'Quantum Q',
      qHint: 'How long a process runs before the next switch.',
      kind: 'What changes',
      kindHint: 'A thread of the same process and a tagged TLB keep the TLB entries.',
      kind_process: 'process',
      kind_thread: 'thread',
      kind_tagged: 'tagged TLB',
      direct: 'Direct cost D',
      directHint: 'Save and restore the state, run the scheduler.',
      wCache: 'Cache warm-up',
      wTlb: 'TLB warm-up',
      wTlbOff: 'No TLB flush, so no TLB warm-up.',
      rate: 'Speed while warming up',
      rateHint: 'Share of full speed while the process waits on misses.',

      preset_desktop: 'Desktop',
      hint_desktop: 'Quantum 10 ms: 100 switches a second, the loss barely shows.',
      preset_server: 'Server',
      hint_server: 'Quantum 1 ms: about a thousand switches a second.',
      'preset_too-often': 'Too often',
      'hint_too-often': 'Quantum 100 µs: the warm-up eats the time, not the 2 µs switch itself.',
      preset_threads: 'Threads',
      hint_threads: 'Quantum 100 µs, same address space: the TLB stays, the cache still goes cold.',
      preset_thrash: 'Never warm',
      hint_thrash: 'The 20 µs quantum is shorter than the 50 µs warm-up.',

      legD: 'D context switch',
      legW: 'W warm-up: runs, but stalls',
      legU: 'U full speed',
      legAB: 'A, B: processes or threads',
      legChanged: 'crossed 90 % or 50 %',
      segD: 'D',
      segW: 'W',
      segU: 'U',
      proc_A: 'A',
      proc_B: 'B',

      tlHead: 'CPU: A and B take turns, quantum {Q}, showing {w}',
      tlLabel: 'Timeline: six quanta, each starts with a switch of {d}, then {wt} of warm-up and {f} at full speed.',

      gHead: 'Useful CPU time',
      gSplit: 'One quantum and one switch, {t}:',
      gD: 'D context switch',
      gW: 'stalls during W',
      gU: 'useful work: U plus {r} of W',
      gRate: 'Switches per second',
      gCrossed: 'crossed {b}',
      gLabel: 'Useful {p} of CPU time; marks at 50 % and 90 %.',

      cHead: 'Useful share against the quantum (log axis)',
      cNow: 'now',
      cLabel: 'Chart: the useful share grows with the quantum; the current quantum {Q} gives {p}.',

      kSaved: 'Saved and restored (control block)',
      kCold: 'Goes cold',
      item_regs: 'general-purpose registers',
      item_pc: 'program counter',
      item_sp: 'stack pointer',
      item_flags: 'flags (status register)',
      item_fpu: 'FPU and SIMD registers',
      item_ptbr: 'page-table base register',
      item_tlb: 'TLB entries',
      item_cache: 'cache contents',
      st_saved: 'saved',
      st_same: 'same, unchanged',
      st_flushed: 'flushed',
      st_kept: 'kept',
      st_tagged: 'kept, tagged',
      st_cold: 'pushed out by the other',
      note: 'The timings are illustrative, not measured.',

      cap_warm: 'Quantum {Q}: the switch itself takes {D}, but the process then runs slowly for {W} while it refills {fill}.',
      cap_thrash: 'Quantum {Q} is no longer than the warm-up ({W}): the process never reaches full speed and runs the whole quantum at {r} speed.',
      cap_nowarm: 'Quantum {Q}: no warm-up, so a context switch costs only the direct {D}.',
      fill_both: 'the cache and the TLB',
      fill_cache: 'the cache (the TLB stays)',
      cap_low: 'Only {p} of CPU time is useful.',
      cap_high: '{p} of CPU time is useful.',
      cap_rate: ['{s} switch per second.', '{s} switches per second.'],
      cap_more: 'The warm-up costs {x} times as much as the switch itself.',

      explain: '<p>When its [[time quantum]] runs out, a process gives up the CPU. A [[process switch]] has two costs. ' +
        '<b>Direct</b>: the kernel saves the processor state in the [[process control block (PCB)]]: registers, ' +
        'program counter, stack pointer, flags, FPU and SIMD. The scheduler picks the next process, and the ' +
        '[[dispatcher]] restores its state. That takes a few microseconds.</p>' +
        '<p><b>Indirect</b>: the new process finds a cold <i>cache</i>, and after a change of address space an empty ' +
        '<i>TLB</i> (the address translation buffer). Until it has refilled them it runs, but often waits on memory. This ' +
        'loss is usually much larger than the direct one.</p>' +
        '<p>The shorter the quantum, the more switches per second, and each brings the same warm-up. If the quantum is ' +
        'shorter than the warm-up, the process never runs at full speed.</p>' +
        '<p>A [[=process switch]] to a [[thread]] of the same process keeps the address space, so the TLB stays; the cache ' +
        'still goes cold. A CPU with a tagged TLB (entries carry an address-space tag) need not flush it either. A ' +
        'system call is only a [[mode switch]]: the process stays, and only the change of mode is paid.</p>' +
        '<p><b>Common mistakes</b>: that the cost is the register save; that threads switch for free; that a shorter ' +
        'quantum is always better because the system responds faster.</p>' +
        '<p>The numbers are illustrative. No real machine is measured here, and scheduler policy is not shown.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
