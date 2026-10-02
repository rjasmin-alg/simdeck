/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of layered-diagnosis, in both languages (docs/sim-ui.md §9). Croatian is the original (the
   URM book's ch. 15 and its web fragment dijagnostika-po-slojevima.html); layer names follow ch. 4.
   layerN is the nominative ("fizički sloj"), layerNL the locative ("u fizičkom sloju"); count is the nominative
   ("1 provjera"), checks the genitive after "nakon" ("nakon 1 provjere"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri pristupa dijagnostici kroz isti OSI stog',
      fault: 'Sloj s kvarom',
      faultHint: 'Pristupi ne znaju unaprijed gdje je kvar.',
      layer1: 'fizički sloj', layer2: 'podatkovni sloj', layer3: 'mrežni sloj', layer4: 'transportni sloj',
      layer5: 'sjednički sloj', layer6: 'prezentacijski sloj', layer7: 'aplikacijski sloj',
      layer1L: 'fizičkom sloju', layer2L: 'podatkovnom sloju', layer3L: 'mrežnom sloju', layer4L: 'transportnom sloju',
      layer5L: 'sjedničkom sloju', layer6L: 'prezentacijskom sloju', layer7L: 'aplikacijskom sloju',
      name1: 'Fizički', name2: 'Podatkovni', name3: 'Mrežni', name4: 'Transportni',
      name5: 'Sjednički', name6: 'Prezentacijski', name7: 'Aplikacijski',
      apBu: 'Odozdo prema gore', apTd: 'Odozgo prema dolje', apDc: 'Podjela napola',
      dirBu: 'od fizičkog naviše', dirTd: 'od aplikacijskog naniže', dirDc: 'od mrežnog, pa prema ishodu testa',
      test: 'test dostupnosti',
      markOk: 'radi',
      markFault: 'kvar',
      markOut: 'isključen',
      stWait: 'Još ništa nije provjereno.',
      stCheck: 'Provjera {k}: {layer} radi.',
      stTestOk: 'Test dostupnosti uspio: slojevi 1–3 rade, dalje naviše.',
      stTestFail: 'Test dostupnosti nije uspio: kvar je u slojevima 1–3, dalje naniže.',
      stFound: 'Kvar pronađen u {layer}, nakon {checks}.',
      stElim: 'Niži slojevi rade, pa je kvar u {layer} ({checks}).',
      checks: ['{n} provjere', '{n} provjere', '{n} provjera'],
      count: ['{n} provjera', '{n} provjere', '{n} provjera'],
      factAvg: 'Prosjek provjera za svih 7 mogućih slojeva s kvarom:',
      factNow: 'Provjera do kvara u ovom slučaju:',
      presetBook: 'Primjer 8: web-aplikacija ne radi',
      presetBookHint: 'Koliko provjera treba podjeli napola do kraja, uključujući test dostupnosti, i zašto nastavlja baš naviše?',
      presetDown: 'Test dostupnosti ne uspije',
      presetDownHint: 'Koliko provjera sad treba podjeli napola, i koji su to slojevi?',
      presetMid: 'Kvar u transportnom sloju',
      presetMidHint: 'Zašto čist pristup odozdo prema gore ovdje troši više truda od podjele napola, iako nađe isti uzrok?',
      presetNet: 'Kvar u mrežnom sloju',
      presetNetHint: 'Kako podjela napola zaključi da je kvar baš u mrežnom sloju?',
      legendOk: 'provjeren, radi',
      legendFault: 'kvar pronađen',
      legendOut: 'isključen testom dostupnosti',
      legendNow: 'provjera u ovom koraku',
      captionStart: 'Korisnik kaže samo „ne radi mi“. Kvar je u {layer}. Svaki korak svaki pristup napravi jednu provjeru. Pritisni →.',
      evCheck: '{ap}: {layer} radi.',
      evTestOk: '{ap}: test dostupnosti uspio, pa fizički, podatkovni i mrežni sloj rade; nastavlja se naviše.',
      evTestFail: '{ap}: test dostupnosti nije uspio, pa je kvar u mrežnom sloju ili niže; nastavlja se naniže.',
      evFound: '{ap}: kvar u {layer}, nakon {checks}.',
      evElim: '{ap}: i fizički sloj radi, pa je kvar u {layer}, nakon {checks}.',
      evDone: 'Sva tri pristupa su pronašla kvar: {bu}, {td} i {dc} provjera.',
      explain: '<p>Kad korisnik kaže samo „ne radi mi“, preostaje <strong>dijagnostika po slojevima</strong>: sustavan, ' +
        'ponovljiv redoslijed provjera kroz slojeve, umjesto nasumičnog pogađanja. Bit nije koji se sloj provjerava ' +
        'prvi, nego da se provjerava dosljednim redoslijedom, tako da se nijedan sloj ne preskoči.</p>' +
        '<p><em>Bottom-up</em> (odozdo prema gore) kreće od fizičkog sloja; sav rad je u mreži, a pristup klijentu ili ' +
        'poslužitelju treba tek u vrlo kasnoj fazi, ali u velikim mrežama zna biti dugotrajan. <em>Top-down</em> ' +
        '(odozgo prema dolje) prolazi iste slojeve obrnutim redoslijedom, od aplikacijskog.</p>' +
        '<p><strong>Zašto podjela napola obično isključi uzroke brže.</strong> <em>Divide and conquer</em> (podjela ' +
        'napola) kreće od sredine, obično mrežnog sloja, testom dostupnosti (ICMP <em>echo</em>). Ako test uspije, ' +
        'pretpostavlja se da su svi niži slojevi u redu, pa se nastavlja naviše; ako ne uspije, nastavlja se naniže. ' +
        'Jedan test odmah prepolovi prostor sumnjivih slojeva, umjesto da ih se provjerava jedan po jedan.</p>' +
        '<p>„Obično“, a ne uvijek: kvar u aplikaciji <em>top-down</em> nađe prvom provjerom. U prosjeku po svih sedam ' +
        'slojeva podjela napola treba najmanje provjera. Pojednostavljeno: ovdje svaka provjera stoji jednako, a ' +
        'provjera jednog sloja otkriva samo kvar u tom sloju.</p>'
    },
    en: {
      stage: 'Three approaches to diagnosis through the same OSI stack',
      fault: 'Faulty layer',
      faultHint: 'The approaches do not know in advance where the fault is.',
      layer1: 'the physical layer', layer2: 'the data link layer', layer3: 'the network layer', layer4: 'the transport layer',
      layer5: 'the session layer', layer6: 'the presentation layer', layer7: 'the application layer',
      layer1L: 'the physical layer', layer2L: 'the data link layer', layer3L: 'the network layer', layer4L: 'the transport layer',
      layer5L: 'the session layer', layer6L: 'the presentation layer', layer7L: 'the application layer',
      name1: 'Physical', name2: 'Data link', name3: 'Network', name4: 'Transport',
      name5: 'Session', name6: 'Presentation', name7: 'Application',
      apBu: 'Bottom-up', apTd: 'Top-down', apDc: 'Divide and conquer',
      dirBu: 'from physical upward', dirTd: 'from application downward', dirDc: 'from network, then by the test',
      test: 'reachability test',
      markOk: 'works',
      markFault: 'fault',
      markOut: 'excluded',
      stWait: 'Nothing checked yet.',
      stCheck: 'Check {k}: {layer} works.',
      stTestOk: 'Reachability test passed: layers 1–3 work, go upward.',
      stTestFail: 'Reachability test failed: the fault is in layers 1–3, go downward.',
      stFound: 'Fault found in {layer}, after {checks}.',
      stElim: 'The lower layers work, so the fault is in {layer} ({checks}).',
      checks: ['{n} check', '{n} checks'],
      count: ['{n} check', '{n} checks'],
      factAvg: 'Average checks over all 7 possible faulty layers:',
      factNow: 'Checks to the fault in this case:',
      presetBook: 'Example 8: a web application fails',
      presetBookHint: 'How many checks does divide and conquer need to the end, the reachability test included, and why does it go upward?',
      presetDown: 'The reachability test fails',
      presetDownHint: 'How many checks does divide and conquer need now, and which layers are they?',
      presetMid: 'Fault in the transport layer',
      presetMidHint: 'Why does pure bottom-up spend more effort here than divide and conquer, though it finds the same cause?',
      presetNet: 'Fault in the network layer',
      presetNetHint: 'How does divide and conquer conclude that the fault is in the network layer itself?',
      legendOk: 'checked, works',
      legendFault: 'fault found',
      legendOut: 'excluded by the reachability test',
      legendNow: 'checked in this step',
      captionStart: 'The user only says "it does not work". The fault is in {layer}. In every step each approach makes one check. Press →.',
      evCheck: '{ap}: {layer} works.',
      evTestOk: '{ap}: the reachability test passed, so the physical, data link and network layers work; go upward.',
      evTestFail: '{ap}: the reachability test failed, so the fault is in the network layer or below; go downward.',
      evFound: '{ap}: fault in {layer}, after {checks}.',
      evElim: '{ap}: the physical layer works too, so the fault is in {layer}, after {checks}.',
      evDone: 'All three approaches have found the fault: {bu}, {td} and {dc} checks.',
      explain: '<p>When a user only says "it does not work", what is left is <strong>layer-by-layer diagnosis</strong>: a ' +
        'systematic, repeatable order of checks through the layers instead of random guessing. What matters is not ' +
        'which layer is checked first but that the checks follow a consistent order, so that no layer is skipped.</p>' +
        '<p><em>Bottom-up</em> starts at the physical layer; all the work is on the network itself, and access to the ' +
        'client or server is needed only very late, but in large networks it can take long. <em>Top-down</em> goes ' +
        'through the same layers in the opposite order, from the application.</p>' +
        '<p><strong>Why divide and conquer usually rules causes out faster.</strong> <em>Divide and conquer</em> starts in ' +
        'the middle, usually the network layer, with a reachability test (ICMP <em>echo</em>). If the test passes, all ' +
        'lower layers are assumed to be fine and the checks go upward; if it fails, they go downward. One test at once ' +
        'halves the space of suspect layers, instead of checking them one by one.</p>' +
        '<p>"Usually", not always: <em>top-down</em> finds an application fault with its first check. Averaged over all ' +
        'seven layers, divide and conquer needs the fewest checks. Simplified: here every check costs the same, and a ' +
        'check of one layer reveals only a fault in that layer.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
