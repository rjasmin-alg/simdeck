/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of wifi-channels, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   Terms follow URM ch. 17: kanal, frekvencijski pojas, access point (in italics, untranslated, as in the book),
   CSMA/CA, DFS; the pairs missing from kit/glossary.js are written out here (NOTES.md, "Term pairs").
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tlocrt s access pointovima i frekvencijski pojas',
      decimal: ',',

      // params
      band: 'Frekvencijski pojas',
      band24: '2,4 GHz',
      band5: '5 GHz',
      width: 'Širina kanala (MHz)',
      w22: '22 (802.11b)',
      layout: 'Raspored',
      layoutRow: 'tri u redu',
      layoutSquare: 'četiri u kvadratu',
      range: 'Domet: čuju se do',
      chLabel: 'Kanal {ap}',
      chValue: '{ch}',

      // presets
      'preset_all-on-6': 'Svi na 6',
      'preset_one-six-eleven': '1, 6 i 11',
      'preset_one-three-six': '1, 3 i 6',
      'preset_four-in-a-square': 'Kvadrat',
      'preset_five-ghz-80': '5 GHz, 80',
      'preset_five-ghz-160': '5 GHz, 160',
      'presetHint_all-on-6': 'Svi na kanalu 6. A i C se ne čuju; B čuje oba.',
      'presetHint_one-six-eleven': 'Tri kanala koja se ne preklapaju.',
      'presetHint_one-three-six': '„Raširi ih”: djelomično preklapanje je gore od dijeljenja.',
      'presetHint_four-in-a-square': 'Četiri u kvadratu. Spusti domet na 25 m: sukob nestaje.',
      'presetHint_five-ghz-80': 'Četiri bloka od 80 MHz, tri u DFS potpojasu.',
      'presetHint_five-ghz-160': 'Samo dva bloka od 160 MHz za četiri AP-a.',

      // legend
      legendAp: 'AP i njegov blok',
      legendCci: '⇄ dijele kanal',
      legendOverlap: '⚠ preklapanje',
      legendDfs: 'DFS potpojas',
      legendChanged: 'promijenjeno',

      // floor plan
      floorTitle: 'Tlocrt',
      scale: '{m} m',
      apChannel: 'kanal {ch}',
      airtime: 'u eteru',
      corrupt: '⚠ pokvareni okviri',
      chipCci: '⇄ dijele',
      chipOverlap: '⚠ {mhz} MHz',
      apAria: 'AP {ap}: kanal {ch}, {lo}–{hi} MHz',

      // pairs
      pairsTitle: 'Parovi',
      colPair: 'Par',
      colDist: 'Udaljenost',
      colHear: 'Čuju se',
      colKind: 'Sukob',
      yes: 'da',
      no: 'ne',
      kindCci: '⇄ isti kanal',
      kindOverlap: '⚠ preklapanje {mhz} MHz',
      kindNone: 'nema',
      kindFar: 'nema (predaleko)',
      dist: '{d} m',

      // spectrum
      specTitle: 'Pojas {band}',
      specRange: '{lo}–{hi} MHz · širina {w} MHz',
      subDfs: 'DFS',
      subClosed: 'nije za Wi-Fi',
      subIndoor: 'bez DFS',
      axisCh: 'kanal',
      blockAria: 'AP {ap} na kanalu {ch}: {lo}–{hi} MHz',

      // captions
      capOverlap: '{a} (kanal {cha}) i {b} (kanal {chb}) preklapaju se za {mhz} MHz: ne čekaju jedan drugoga, nego si međusobno kvare okvire.',
      capUse1611: ' Koristi 1, 6 i 11.',
      capUse40: ' Na 2,4 GHz bez preklapanja stanu samo dva bloka od 40 MHz: 1+5 i 9+13.',
      capMoreOverlap: [' Takav je još {n} par.', ' Takva su još {n} para.', ' Takvih je još {n} parova.'],
      capShareFirst: '{aps} su na istom kanalu {ch}',
      capShareMore: ', a {aps} na kanalu {ch}',
      capShareEnd: ': oni koji se čuju izmjenjuju se, jer ih CSMA/CA tjera da čekaju.',
      capCciAlso: ' {a} i {b} uz to dijele kanal {ch}.',
      capAirtime: ' Vrijeme u eteru: {list}.',
      capHalf: '{a} i {b} su na istom kanalu {ch} i čuju se: CSMA/CA ih tjera da se izmjenjuju, pa svaki dobije pola vremena u eteru.',
      capClean: 'Nijedan par koji se čuje nije na istom ni na preklopljenom kanalu: svaki AP ima cijelo vrijeme u eteru.',
      capAlone: 'Na {m} m nijedan AP ne čuje drugoga: ovdje nije važno koji su kanali.',
      capDfs: [' Kanal {list} je u DFS potpojasu: AP mora otići s njega čim čuje radar.', ' Kanali {list} su u DFS potpojasevima: AP mora otići s kanala čim čuje radar.', ' Kanali {list} su u DFS potpojasevima: AP mora otići s kanala čim čuje radar.'],
      and: 'i',

      explain: '<p>Pojas se dijeli na <b>kanale</b>, i <em>access point</em> u danom trenutku odašilje na jednome. ' +
        'Na 2,4 GHz kanal n ima središte na 2407 + 5·n MHz, ali je širok 20 MHz (802.11b čak 22): kanali su razmaknuti ' +
        '5 MHz, pa se susjedni preklapaju. Uobičajeni plan je <b>1, 6 i 11</b>: čist je i na 22 MHz. Na 20 MHz u Europi ' +
        'stanu i četiri, 1, 5, 9 i 13, jer se njihovi rubovi samo dodiruju, a to nije preklapanje.</p>' +
        '<p>Dva AP-a koja se čuju i rade na <b>istom kanalu</b> (smetnje na istom kanalu, <em>co-channel interference</em>) ' +
        'dijele medij: CSMA/CA ih tjera da se izmjenjuju, pa svaki dobije dio vremena u eteru. Ako se njihovi kanali ' +
        '<b>djelomično preklapaju</b> (smetnje susjednog kanala, <em>adjacent-channel interference</em>), jedan drugoga ne ' +
        'prepoznaju kao promet na svojem kanalu, ne čekaju se i kvare si okvire. Zato „raširi ih: 1, 3, 6, 9” nije ' +
        'bolje od dijeljenja, nego gore.</p>' +
        '<p>Na 5 GHz u Europi ima 19 kanala od 20 MHz (36–64 i 100–140). Spajanjem kanala (<em>channel bonding</em>) ' +
        'AP dobiva širi kanal, ali ih je manje: 9 od 40 MHz, 4 od 80 i samo 2 od 160. Šire nije uvijek brže: na gustom ' +
        'katu četiri AP-a na dva kanala dijele vrijeme. Potpojasevi 5250–5350 i 5470–5725 MHz traže dinamičku selekciju ' +
        'frekvencije (DFS): AP mora otići s kanala čim čuje radar. Pojas 6 GHz (razredi LPI i VLP) ovdje nije prikazan.</p>' +
        '<p>Domet ovdje je jedan broj; stvarni ovisi o zidovima i snazi. Veća snaga ne rješava pokrivenost: širi i ' +
        'smetnje na istom kanalu (primjer 4).</p>'
    },
    en: {
      stage: 'Floor plan with access points and the frequency band',
      decimal: '.',

      band: 'Frequency band',
      band24: '2.4 GHz',
      band5: '5 GHz',
      width: 'Channel width (MHz)',
      w22: '22 (802.11b)',
      layout: 'Layout',
      layoutRow: 'three in a row',
      layoutSquare: 'four in a square',
      range: 'Range: they hear each other up to',
      chLabel: 'Channel {ap}',
      chValue: '{ch}',

      'preset_all-on-6': 'All on 6',
      'preset_one-six-eleven': '1, 6 and 11',
      'preset_one-three-six': '1, 3 and 6',
      'preset_four-in-a-square': 'Square',
      'preset_five-ghz-80': '5 GHz, 80',
      'preset_five-ghz-160': '5 GHz, 160',
      'presetHint_all-on-6': 'All on channel 6. A and C do not hear each other; B hears both.',
      'presetHint_one-six-eleven': 'Three channels that do not overlap.',
      'presetHint_one-three-six': '"Spread them out": partial overlap is worse than sharing.',
      'presetHint_four-in-a-square': 'Four in a square. Lower the range to 25 m: the conflict goes.',
      'presetHint_five-ghz-80': 'Four 80 MHz blocks, three in a DFS sub-band.',
      'presetHint_five-ghz-160': 'Only two 160 MHz blocks for four APs.',

      legendAp: 'AP and its block',
      legendCci: '⇄ share a channel',
      legendOverlap: '⚠ overlap',
      legendDfs: 'DFS sub-band',
      legendChanged: 'changed',

      floorTitle: 'Floor plan',
      scale: '{m} m',
      apChannel: 'channel {ch}',
      airtime: 'airtime',
      corrupt: '⚠ corrupted frames',
      chipCci: '⇄ share',
      chipOverlap: '⚠ {mhz} MHz',
      apAria: 'AP {ap}: channel {ch}, {lo}–{hi} MHz',

      pairsTitle: 'Pairs',
      colPair: 'Pair',
      colDist: 'Distance',
      colHear: 'Hear',
      colKind: 'Conflict',
      yes: 'yes',
      no: 'no',
      kindCci: '⇄ same channel',
      kindOverlap: '⚠ overlap {mhz} MHz',
      kindNone: 'none',
      kindFar: 'none (too far)',
      dist: '{d} m',

      specTitle: '{band} band',
      specRange: '{lo}–{hi} MHz · width {w} MHz',
      subDfs: 'DFS',
      subClosed: 'not for Wi-Fi',
      subIndoor: 'no DFS',
      axisCh: 'channel',
      blockAria: 'AP {ap} on channel {ch}: {lo}–{hi} MHz',

      capOverlap: '{a} (channel {cha}) and {b} (channel {chb}) overlap by {mhz} MHz: they do not wait for each other and corrupt each other\'s frames.',
      capUse1611: ' Use 1, 6 and 11.',
      capUse40: ' At 2.4 GHz only two 40 MHz blocks fit without overlap: 1+5 and 9+13.',
      capMoreOverlap: [' There is {n} more such pair.', ' There are {n} more such pairs.'],
      capShareFirst: '{aps} are on the same channel {ch}',
      capShareMore: ', and {aps} on channel {ch}',
      capShareEnd: ': those that hear each other take turns, because CSMA/CA makes them wait.',
      capCciAlso: ' {a} and {b} also share channel {ch}.',
      capAirtime: ' Airtime: {list}.',
      capHalf: '{a} and {b} are on the same channel {ch} and hear each other: CSMA/CA makes them take turns, so each gets half the airtime.',
      capClean: 'No pair that hears each other is on the same or an overlapping channel: every AP has all the airtime.',
      capAlone: 'At {m} m no AP hears another: the channels do not matter here.',
      capDfs: [' Channel {list} is in a DFS sub-band: the AP must leave it as soon as it hears radar.', ' Channels {list} are in DFS sub-bands: the AP must leave its channel as soon as it hears radar.'],
      and: 'and',

      explain: '<p>A band is divided into <b>channels</b>, and an access point sends on one of them at a time. At 2.4 GHz ' +
        'channel n is centred at 2407 + 5·n MHz but is 20 MHz wide (802.11b even 22): the channels are 5 MHz apart, so ' +
        'neighbours overlap. The usual plan is <b>1, 6 and 11</b>: it is clean even at 22 MHz. At 20 MHz Europe also fits ' +
        'four, 1, 5, 9 and 13, because their edges only touch, and touching is not overlapping.</p>' +
        '<p>Two APs that hear each other on the <b>same channel</b> (co-channel interference) share the medium: CSMA/CA ' +
        'makes them take turns, so each gets a part of the airtime. If their channels <b>partly overlap</b> ' +
        '(adjacent-channel interference), neither recognises the other as traffic on its own channel, they do not wait ' +
        'for each other and corrupt each other\'s frames. So "spread them out: 1, 3, 6, 9" is not better than sharing, ' +
        'it is worse.</p>' +
        '<p>At 5 GHz Europe has 19 channels of 20 MHz (36–64 and 100–140). Channel bonding gives an AP a wider channel, ' +
        'but there are fewer of them: 9 of 40 MHz, 4 of 80 and only 2 of 160. Wider is not always faster: on a dense ' +
        'floor four APs on two channels share the airtime. The sub-bands 5250–5350 and 5470–5725 MHz require dynamic ' +
        'frequency selection (DFS): the AP must leave the channel as soon as it hears radar. The 6 GHz band (LPI and VLP ' +
        'classes) is not shown here.</p>' +
        '<p>Range here is one number; the real one depends on walls and power. More power does not fix coverage: it ' +
        'widens co-channel interference too (preset 4).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
