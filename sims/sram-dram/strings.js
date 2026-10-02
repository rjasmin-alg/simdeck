/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of sram-dram, in both languages (docs/sim-ui.md §9). English is the original
   (single-page-labs/sram-dram.html: its step boxes, info cards and comparison table); Croatian is written for simdeck.
   None of the cell terms is in kit/glossary.js, so the pairs are written out (English in italics with the Croatian in
   parentheses at first mention in the explanation) and listed in NOTES.md. Signal names (WL, BL, Q), transistor
   names, voltages and times are data: the page puts them in translate="no" elements.
   cmp1 … cmp16 are the comparison table's rows, "parameter | SRAM | DRAM". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'SRAM ćelija sa šest tranzistora i DRAM ćelija s jednim tranzistorom i kondenzatorom, iste operacije jedna uz drugu, i naboj DRAM ćelije kroz vrijeme',
      view: 'Prikaz',
      viewCells: 'Ćelije',
      viewTable: 'Usporedba',
      bit: 'Prvi upisani bit',
      refresh: 'Osvježavanje nakon 64 ms',
      refreshHint: 'Isključeno: kontroler preskoči osvježavanje i DRAM ćelija dalje curi.',
      presetRefresh: 'Upis 1, s osvježavanjem',
      presetRefreshHint: 'Osvježavanje u 64. ms vraća naboj, čitanje u 128. ms daje 1.',
      presetNoRefresh: 'Upis 1, bez osvježavanja',
      presetNoRefreshHint: 'Što očita DRAM u 128. ms?',
      presetZero: 'Upis 0, bez osvježavanja',
      presetZeroHint: 'Što 0 može izgubiti?',
      presetTable: 'Tablica usporedbe',
      legendSram: 'SRAM: bistabil',
      legendDram: 'DRAM: kondenzator',
      legendChanged: 'promijenjeno u ovom koraku',
      legendLost: 'bit izgubljen',
      sramTitle: 'SRAM: šest tranzistora (6T)',
      dramTitle: 'DRAM: tranzistor i kondenzator (1T1C)',
      stored: 'Pohranjeni bit',
      written: 'Zapisani bit',
      latchSub: 'izlaz unakrsno spregnutih invertora',
      charge: 'Naboj ćelije',
      since: 'Od zadnjeg obnavljanja',
      senseAmp: 'Osjetilno pojačalo',
      saOff: 'isključeno',
      saSensed: 'očitalo {bit}',
      dv: 'Pomak na liniji bita',
      noDv: 'nema čitanja',
      lost: 'bit izgubljen',
      holds: 'drži bit dok ima napajanja',
      noValue: 'još nije upisano',
      high: 'visoko',
      low: 'nisko',
      blPre: 'predpunjena',
      blUp: 'raste',
      blDown: 'pada',
      blShare: 'dijeli naboj',
      opStart: 'Uključeno napajanje',
      opWrite: 'Upis {bit}',
      opRead: 'Čitanje',
      opRestore: 'Povratni upis',
      opWait: 'Čekanje {ms} ms',
      opRefresh: 'Osvježavanje',
      opSkip: 'Osvježavanje izostaje',
      threshold: 'prag očitanja',
      window: 'rok od 64 ms',
      axisT: 'vrijeme',
      chartTitle: 'Naboj DRAM ćelije kroz vrijeme',
      sramCol: 'SRAM (6T)',
      dramCol: 'DRAM (1T1C)',
      paramCol: 'Svojstvo',

      captionStart: 'Napajanje je uključeno. SRAM bistabil je pao u nepoznato stanje, DRAM kondenzator je prazan. Korak 1 upisuje {bit} u obje ćelije.',
      captionWriteSram: 'SRAM: WL raste, upisni pokretači tjeraju BL na {bl} i BL̄ na {blb} i nadjačaju bistabil: Q = {bit}.',
      captionWriteSramFlip: 'SRAM: WL raste, upisni pokretači tjeraju BL na {bl} i BL̄ na {blb}, nadjačaju bistabil i preokrenu ga: Q = {bit}.',
      captionWriteDram: 'DRAM: linija bita na {bl} puni ili prazni kondenzator na {after}; kad WL padne, naboj ostaje zarobljen.',
      captionReadSram: 'SRAM: Q = {q} razmiče predpunjene BL i BL̄, pojačalo očita {read}, a bistabil ostaje kakav je bio.',
      captionReadDram: 'DRAM: kondenzator dijeli naboj s linijom bita, pomak je {dv} i pojačalo očita {sensed}. Ćelija je sada na {after}: čitanje je razorno.',
      captionReadWrong: 'Zapisan je bio {bit}: bit je izgubljen.',
      captionRestoreDram: 'Povratni upis: pojačalo vraća očitani {sensed} u ćeliju, naboj je opet {after}.',
      captionRestoreWrong: 'Povratni upis: pojačalo upisuje pogrešan {sensed}, pa je bit sada trajno izgubljen.',
      captionRestoreSram: 'SRAM ne treba povratni upis.',
      captionWaitSram: 'Čekanje {ms} ms: SRAM drži Q = {q}.',
      captionWaitDram: 'DRAM curi s {before} na {after}, {since} od zadnjeg obnavljanja.',
      captionWaitEmpty: 'DRAM: ćelija s 0 nema naboja koji bi iscurio, ostaje na {after}.',
      captionOverdue: 'Rok od 64 ms je prošao.',
      captionRefresh: 'Osvježavanje: pojačalo očita {sensed} pri {before} i vrati ga u ćeliju, naboj je {after}. Tako se svaki red obnovi unutar 64 ms; SRAM osvježavanje ne treba.',
      captionSkip: 'Kontroler preskoči osvježavanje: rok od 64 ms je istekao, a naboj ({before}) i dalje curi. SRAM-u to ne smeta.',

      cmp1: 'Tranzistora po bitu | 6 (4 u jezgri, 2 pristupna) | 1 tranzistor i 1 kondenzator',
      cmp2: 'Površina ćelije | oko 100–150 F² | oko 6–8 F²',
      cmp3: 'Način pohrane | bistabil od unakrsno spregnutih invertora (aktivan) | naboj na kondenzatoru (pasivan)',
      cmp4: 'Čitanje | nerazorno | razorno (dijeljenje naboja)',
      cmp5: 'Osvježavanje | ne treba | treba, svakih 64 ms (tREFW)',
      cmp6: 'Vrijeme pristupa (tipično) | 0,5–2 ns (L1–L3) | 10–15 ns (tRCD + CL)',
      cmp7: 'Trajanje ciklusa | oko 1 ns | oko 45–50 ns (tRC u DDR4)',
      cmp8: 'Propusnost | vrlo velika (široka sabirnica na čipu) | ograničena brojem pinova i širinom sučelja',
      cmp9: 'Potrošnja pri radu | veća po pristupu (pokreće bistabil) | manja po pristupu, ali osvježavanje dodaje svoje',
      cmp10: 'Potrošnja u mirovanju | samo podpražno curenje | prevladava osvježavanje',
      cmp11: 'Cijena po GB | 500 $ i više (kao priručna memorija) | oko 3–5 $ (masovna roba)',
      cmp12: 'Gustoća | mala (MB na čipu) | velika (GB po modulu)',
      cmp13: 'Tipična uporaba | L1/L2/L3 priručna memorija, registri, TCAM | glavna memorija, okvirni spremnici, HBM',
      cmp14: 'Zaštita ECC | paritetni bitovi po liniji priručne memorije | ECC na čipu (DDR5), bočni ECC',
      cmp15: 'Ranjivost na rowhammer | ne postoji (nema pohrane naboja) | postoji: parazitska sprega susjednih redova',
      cmp16: 'Izazov smanjivanja | površina 6T ćelije, stabilnost pri čitanju | smanjivanje kondenzatora (dielektrici visokog κ), vrijeme zadržavanja',

      explain: '<p><b>SRAM</b> (statička memorija) pamti bit u <i lang="en">latch</i> (bistabil) od dvaju ' +
        '<i lang="en">cross-coupled inverters</i> (unakrsno spregnuti invertori), P1/N1 i P2/N2. Pozitivna povratna veza ' +
        'drži bit dok god ima napajanja, pa SRAM ne treba osvježavanje, ali troši šest tranzistora po bitu. Dva ' +
        '<i lang="en">access transistors</i> (pristupni tranzistori), N3 i N4, spajaju ćeliju na linije bita kad ' +
        '<i lang="en">wordline</i> (linija riječi, WL) poraste.</p>' +
        '<p><b>Čitanje SRAM-a:</b> obje <i lang="en">bitlines</i> (linije bita, BL i BL̄) predpune se, WL poraste, a Q i Q̄ ' +
        'razmaknu linije za 50–100 mV. <i lang="en">Sense amplifier</i> (osjetilno pojačalo) pojača tu razliku. Čitanje je ' +
        'nerazorno: bistabil sam pokreće linije. <b>Upis:</b> upisni pokretači jači su od PMOS tranzistora ćelije i ' +
        'preokrenu bistabil; rezerva upisa ovisi o omjeru veličina tranzistora (<i lang="en">β ratio</i>).</p>' +
        '<p><b>DRAM</b> (dinamička memorija) pamti bit kao naboj na kondenzatoru od oko 20 fF iza jednog pristupnog ' +
        'tranzistora. <i lang="en">Leakage</i> (curenje) kroz spoj i ispod praga stalno odvodi taj naboj, pa svaki red mora ' +
        'dobiti <i lang="en">refresh</i> (osvježavanje) unutar 64 ms (32 ms pri visokoj temperaturi). Kontroler zato šalje ' +
        'naredbu REF svakih 7,8 µs (tREFI); osvježavanje je čitanje i povratni upis i u DDR4 uzima 5–10 % propusnosti.</p>' +
        '<p><b>Čitanje DRAM-a je razorno.</b> Kondenzator (C_s, oko 20 fF) dijeli naboj s linijom bita (C_BL, oko 200 fF) ' +
        'predpunjenom na V_DD/2: pomak je ΔV = (V_cell − V_DD/2) × C_s / (C_s + C_BL), za punu ćeliju samo oko 55 mV. Nakon ' +
        'dijeljenja ćelija je blizu V_DD/2, pa pojačalo odmah mora napraviti <i lang="en">write-back</i> (povratni upis).</p>' +
        '<p><b>Zašto ne samo SRAM?</b> DRAM ćelija zauzima oko 6 F², SRAM oko 100–150 F². Zato je SRAM brza i skupa ' +
        'priručna memorija (L1, L2, L3), a DRAM gusta i jeftina glavna memorija. Procesor ubrzava brže od memorije ' +
        '(<i lang="en">memory wall</i>, zid memorije), pa današnji procesori 30–50 % čipa daju priručnoj memoriji.</p>' +
        '<p><b>Sigurnost:</b> naboj u DRAM-u omogućuje smetnje između susjednih redova (rowhammer), a razlika u vremenu ' +
        'između pogotka u priručnoj memoriji i pristupa DRAM-u je bočni kanal (Flush+Reload, Spectre, Meltdown). SRAM ' +
        'bistabil je otporan na smetnje, ali je sama prisutnost linije u priručnoj memoriji bočni kanal.</p>' +
        '<p><b>Dalje:</b> STT-MRAM kao zamjena za SRAM u L2, HBM (DRAM složen u 3D), CXL (dijeljenje memorije među ' +
        'poslužiteljima) i obrada u memoriji (PIM).</p>' +
        '<p>Brzina curenja u ovom prikazu je ilustrativna: puna ćelija padne na V_DD/2 za 100 ms. Stvarne ćelije drže naboj ' +
        'od desetaka milisekundi do sekundi.</p>'
    },
    en: {
      stage: 'A six-transistor SRAM cell and a one-transistor, one-capacitor DRAM cell taking the same operations side by side, and the DRAM cell\'s charge over time',
      view: 'View',
      viewCells: 'Cells',
      viewTable: 'Comparison',
      bit: 'First bit written',
      refresh: 'Refresh after 64 ms',
      refreshHint: 'Off: the controller skips the refresh and the DRAM cell keeps leaking.',
      presetRefresh: 'Write 1, with refresh',
      presetRefreshHint: 'The refresh at 64 ms restores the charge; the read at 128 ms gives 1.',
      presetNoRefresh: 'Write 1, no refresh',
      presetNoRefreshHint: 'What does the DRAM read at 128 ms?',
      presetZero: 'Write 0, no refresh',
      presetZeroHint: 'What can a 0 lose?',
      presetTable: 'Comparison table',
      legendSram: 'SRAM: latch',
      legendDram: 'DRAM: capacitor',
      legendChanged: 'changed in this step',
      legendLost: 'bit lost',
      sramTitle: 'SRAM: six transistors (6T)',
      dramTitle: 'DRAM: one transistor, one capacitor (1T1C)',
      stored: 'Stored bit',
      written: 'Bit written',
      latchSub: 'cross-coupled latch output',
      charge: 'Cell charge',
      since: 'Since last restore',
      senseAmp: 'Sense amplifier',
      saOff: 'off',
      saSensed: 'sensed {bit}',
      dv: 'Bitline swing',
      noDv: 'no read',
      lost: 'bit lost',
      holds: 'holds the bit while powered',
      noValue: 'nothing written yet',
      high: 'high',
      low: 'low',
      blPre: 'precharged',
      blUp: 'rising',
      blDown: 'falling',
      blShare: 'sharing charge',
      opStart: 'Power on',
      opWrite: 'Write {bit}',
      opRead: 'Read',
      opRestore: 'Write-back',
      opWait: 'Wait {ms} ms',
      opRefresh: 'Refresh',
      opSkip: 'No refresh',
      threshold: 'sense threshold',
      window: '64 ms window',
      axisT: 'time',
      chartTitle: 'DRAM cell charge over time',
      sramCol: 'SRAM (6T)',
      dramCol: 'DRAM (1T1C)',
      paramCol: 'Parameter',

      captionStart: 'Power is on. The SRAM latch has settled into an unknown state; the DRAM capacitor is empty. Step 1 writes {bit} into both cells.',
      captionWriteSram: 'SRAM: WL goes high, the write drivers force BL to {bl} and BL̄ to {blb} and overpower the latch: Q = {bit}.',
      captionWriteSramFlip: 'SRAM: WL goes high, the write drivers force BL to {bl} and BL̄ to {blb}, overpower the latch and flip it: Q = {bit}.',
      captionWriteDram: 'DRAM: the bitline at {bl} charges or drains the capacitor to {after}; when WL goes low, the charge is trapped.',
      captionReadSram: 'SRAM: Q = {q} pulls the precharged BL and BL̄ apart, the sense amplifier reads {read}, and the latch stays as it was.',
      captionReadDram: 'DRAM: the capacitor shares its charge with the bitline, the swing is {dv} and the sense amplifier reads {sensed}. The cell is now at {after}: the read is destructive.',
      captionReadWrong: 'It was written as {bit}: the bit is lost.',
      captionRestoreDram: 'Write-back: the sense amplifier drives the {sensed} it read back into the cell; the charge is {after} again.',
      captionRestoreWrong: 'Write-back: the sense amplifier writes the wrong {sensed}, so the bit is now lost for good.',
      captionRestoreSram: 'The SRAM needs no write-back.',
      captionWaitSram: 'Wait {ms} ms: the SRAM holds Q = {q}.',
      captionWaitDram: 'The DRAM leaks from {before} to {after}, {since} since its last restore.',
      captionWaitEmpty: 'DRAM: a cell holding 0 has no charge to leak; it stays at {after}.',
      captionOverdue: 'The 64 ms window has passed.',
      captionRefresh: 'Refresh: the sense amplifier reads {sensed} at {before} and writes it back; the charge is {after}. Every row is restored like this within 64 ms; the SRAM needs no refresh.',
      captionSkip: 'The controller skips the refresh: the 64 ms window is over and the charge ({before}) keeps leaking. The SRAM does not mind.',

      cmp1: 'Transistors per bit | 6 (4 core, 2 access) | 1 transistor and 1 capacitor',
      cmp2: 'Cell area | about 100–150 F² | about 6–8 F²',
      cmp3: 'Storage | cross-coupled bistable latch (active) | charge on a capacitor (passive)',
      cmp4: 'Read | non-destructive | destructive (charge sharing)',
      cmp5: 'Refresh | not needed | needed, every 64 ms (tREFW)',
      cmp6: 'Access time (typical) | 0.5–2 ns (L1–L3) | 10–15 ns (tRCD + CL)',
      cmp7: 'Cycle time | about 1 ns | about 45–50 ns (tRC in DDR4)',
      cmp8: 'Bandwidth | very high (wide on-die bus) | limited by pin count and interface width',
      cmp9: 'Power, active | higher per access (drives the latch) | lower per access, but refresh adds its own',
      cmp10: 'Power, standby | sub-threshold leakage only | refresh power dominates',
      cmp11: 'Cost per GB | $500 and more (as cache) | about $3–5 (commodity)',
      cmp12: 'Density | low (MBs on die) | high (GBs per module)',
      cmp13: 'Typical use | L1/L2/L3 cache, register files, TCAMs | main memory, frame buffers, HBM',
      cmp14: 'ECC | parity bits per cache line | on-die ECC (DDR5), sideband ECC',
      cmp15: 'Rowhammer | not applicable (no stored charge) | vulnerable: parasitic coupling between rows',
      cmp16: 'Scaling challenge | 6T cell area, read stability margin | capacitor scaling (high-κ dielectrics), retention time',

      explain: '<p><b>SRAM</b> (static memory) keeps a bit in a <i>latch</i> made of two <i>cross-coupled inverters</i>, ' +
        'P1/N1 and P2/N2. The positive feedback holds the bit for as long as the supply is on, so SRAM needs no refresh, ' +
        'but it costs six transistors per bit. Two <i>access transistors</i>, N3 and N4, connect the cell to the bitlines ' +
        'when the <i>wordline</i> (WL) goes high.</p>' +
        '<p><b>SRAM read:</b> both <i>bitlines</i> (BL and BL̄) are precharged, WL goes high, and Q and Q̄ pull the lines ' +
        '50–100 mV apart. The <i>sense amplifier</i> amplifies that difference. The read is non-destructive: the latch ' +
        'drives the lines itself. <b>Write:</b> the write drivers are stronger than the cell\'s PMOS pull-ups and flip ' +
        'the latch; the write margin depends on transistor sizing (the <i>β ratio</i>).</p>' +
        '<p><b>DRAM</b> (dynamic memory) keeps a bit as charge on a capacitor of about 20 fF behind one access ' +
        'transistor. Junction and sub-threshold <i>leakage</i> drains that charge all the time, so every row needs a ' +
        '<i>refresh</i> within 64 ms (32 ms at high temperature). The controller issues a REF command every 7.8 µs ' +
        '(tREFI); a refresh is a read plus a write-back and takes 5–10 % of the bandwidth in DDR4.</p>' +
        '<p><b>A DRAM read is destructive.</b> The capacitor (C_s, about 20 fF) shares its charge with the bitline (C_BL, ' +
        'about 200 fF), precharged to V_DD/2: the swing is ΔV = (V_cell − V_DD/2) × C_s / (C_s + C_BL), only about 55 mV ' +
        'for a full cell. After the sharing the cell sits near V_DD/2, so the sense amplifier must do a <i>write-back</i> ' +
        'at once.</p>' +
        '<p><b>Why not just SRAM?</b> A DRAM cell takes about 6 F², an SRAM cell about 100–150 F². So SRAM is the fast, ' +
        'expensive cache (L1, L2, L3) and DRAM the dense, cheap main memory. Processors speed up faster than memory (the ' +
        '<i>memory wall</i>), so today\'s processors give 30–50 % of the die to cache.</p>' +
        '<p><b>Security:</b> DRAM\'s stored charge allows disturbance between neighbouring rows (rowhammer), and the time ' +
        'difference between a cache hit and a DRAM access is a side channel (Flush+Reload, Spectre, Meltdown). The SRAM ' +
        'latch is immune to disturbance, but whether a line is in the cache is itself the side channel.</p>' +
        '<p><b>Next:</b> STT-MRAM as an SRAM replacement in L2, HBM (3D-stacked DRAM), CXL (memory pooled across servers) ' +
        'and processing in memory (PIM).</p>' +
        '<p>The leak rate on this page is illustrative: a full cell falls to V_DD/2 in 100 ms. Real cells keep their ' +
        'charge for tens of milliseconds to seconds.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
