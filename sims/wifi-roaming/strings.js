/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of wifi-roaming, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). None of the Wi-Fi terms is in kit/glossary.js yet,
   so the term pairs are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Hodnik s tri access pointa i jakost signala duž njega',
      decimal: ',',

      // params
      position: 'Položaj klijenta',
      client: 'Klijent',
      clientDefault: 'Uobičajen',
      clientSticky: 'Ljepljiv',
      clientCustom: 'Vlastiti',
      trigger: 'Prag za traženje',
      delta: 'Potrebna prednost (histereza)',
      btm: 'AP predlaže (802.11v)',
      support: 'Klijent na zahtjev AP-a',
      supportCoop: 'prihvaća',
      supportLegacy: 'ignorira (stari)',

      // presets
      'preset_default-walk': 'Uobičajen',
      'presetHint_default-walk': 'Prelazak na 20 m i na 50 m',
      'preset_sticky-client': 'Ljepljiv',
      'presetHint_sticky-client': 'Na 30 m stoji ispod AP-B, a drži se AP-A',
      'preset_no-hysteresis': 'Bez histereze',
      'presetHint_no-hysteresis': 'Prag −70, prednost 0: na 15 m su jednaki',
      'preset_ap-asks': 'AP pita: ignorira',
      'presetHint_ap-asks': 'Ljepljiv klijent bez 802.11v: zahtjev ništa ne mijenja',
      'preset_ap-asks-cooperative': 'AP pita: prihvaća',
      'presetHint_ap-asks-cooperative': 'Ljepljiv klijent s 802.11v: prelazi na 16 m',

      // legend
      legendAp: 'AP-A, AP-B, AP-C',
      legendLink: 'trenutačno pridružen',
      legendOther: 'ostali AP-ovi',
      legendTrigger: 'prag klijenta',
      legendBand: 'histereza',
      legendRoam: 'prelazak',
      legendBtm: 'AP predlaže',
      legendChanged: 'upravo se dogodilo',

      // stage
      corridorTitle: 'Hodnik, 60 m, jedna mreža (isti SSID), jedan distribucijski sustav',
      chartTitle: 'Jakost signala (RSSI, dBm) duž hodnika',
      chartSub: 'deblja crta: AP na kojem je klijent; svjetlije: put koji tek slijedi',
      dbm: 'dBm',
      metres: '{x} m',
      clientMark: 'klijent',
      lineTrigger: 'prag {v}',
      lineBtm: 'AP pita {v}',
      lineLost: 'veza se gubi {v}',
      ds: 'distribucijski sustav',

      cardTitle: 'Klijent na {x}',
      colAp: 'AP',
      colRssi: 'signal',
      colDiff: 'prema trenutačnom',
      associated: 'pridružen',
      settings: 'Prag {trig} dBm, prednost više od {d} dB',
      settingsBtm: '802.11v uključen, klijent zahtjev {how}',
      howCoop: 'prihvaća',
      howLegacy: 'ignorira',
      qualityLabel: 'Veza:',
      q_good: 'dobra (dovoljna za glas)',
      q_fair: 'srednja',
      q_poor: 'slaba',

      logTitle: 'Događaji do ovog mjesta',
      logEmpty: 'Još nijednog prelaska: klijent je na AP-A.',
      log_client: 'klijent prelazi',
      log_btm: 'AP pita, klijent prihvaća',
      log_ignored: 'AP pita, klijent ignorira',
      log_lost: 'veza prekinuta',
      logReassoc: 'Reassociation Request i Response, distribucijski sustav ažuriran, {from} obaviješten',
      logRejoin: 'skeniranje i pridruživanje iznova',
      logAhead: ['Dalje niz hodnik još {n} događaj', 'Dalje niz hodnik još {n} događaja', 'Dalje niz hodnik još {n} događaja'],

      // captions
      capRoamClient: 'Na {x} {from} je pao na {rf} dBm (prag {trig}), a {to} je jači za {m} dB, više od {d}: ' +
        'klijent šalje {to2} zahtjev za ponovno pridruživanje (Reassociation Request).',
      capRoamBtm: 'Na {x} {from} ({rf} dBm) šalje zahtjev 802.11v i predlaže {to} ({rt} dBm). Klijent ga podržava ' +
        'i prihvaća: sam šalje {to2} zahtjev za ponovno pridruživanje.',
      capBtmIgnored: 'Na {x} {from} ({rf} dBm) predlaže prelazak na {to} ({rt} dBm), ali stari klijent zahtjev ' +
        'ignorira i ostaje: AP može samo pitati.',
      capLost: 'Na {x} {from} je na {rf} dBm, ispod −90: veza je prekinuta. Klijent ponovno skenira i pridružuje se ' +
        'najjačem: {to} ({rt} dBm).',
      capLookStay: 'Na {x} {cur} je na {rc} dBm, ispod praga {trig}, pa klijent gleda ostale AP-ove: {best} je jači za ' +
        'samo {m} dB, a treba više od {d}. Ostaje.',
      capLookEqual: 'Na {x} {cur} je na {rc} dBm, ispod praga {trig}, a {best} je jednako jak. Jednak signal nikad ' +
        'ne pokreće prelazak: klijent ostaje.',
      capLookNone: 'Na {x} {cur} je na {rc} dBm, ispod praga {trig}, ali nijedan drugi AP nije jači. Klijent ostaje.',
      capSticky: 'Na {x} {best} daje {rb} dBm, a klijent je i dalje pridružen {cur} na {rc} dBm: o prelasku ' +
        'odlučuje klijent, a njegov prag je {trig} dBm.',
      capFine: 'Na {x} klijent je na {cur} ({rc} dBm), iznad praga {trig}: drugi AP uopće ne traži.',
      capQuality: 'Veza: {q}.',

      explain: '<p>Tri <i>access pointa</i> iste mreže (isti SSID) stoje uz hodnik i spojena su na isti distribucijski ' +
        'sustav. Signal slabi s udaljenošću; model ovdje je izveden za nastavu (−40 dBm na 1 m, eksponent 3), ' +
        'ne izmjeren.</p>' +
        '<p><b>O prelasku (<i>roaming</i>) odlučuje klijent.</b> Kad signal njegova AP-a padne ispod praga, klijent ' +
        'pogleda ostale i prelazi samo ako je neki jači za više od zadane prednosti. Ta <i>histereza</i> sprječava ' +
        'skakanje amo-tamo kad su dva AP-a podjednaka. Prelazak je <i>ponovno pridruživanje</i>: klijent novom AP-u ' +
        'šalje zahtjev (Reassociation Request), ovaj odgovara, distribucijski sustav doznaje gdje je klijent, a stari ' +
        'AP dobiva obavijest.</p>' +
        '<p><b>Ljepljiv klijent</b> (<i>sticky client</i>) ima nizak prag: stoji ispod drugog AP-a, a drži se dalekog ' +
        'na −84 dBm. Pridružen je, ali veza je slaba. Pridružen ne znači dobar signal.</p>' +
        '<p><b>AP može samo pitati.</b> Zahtjevom 802.11v (BSS Transition Management) predlaže jači susjedni AP; klijent ' +
        'koji to ne podržava zahtjev ignorira. To nije mobilna mreža u kojoj mreža prebacuje telefon s ćelije na ' +
        'ćeliju. Izvan ovog prikaza ostaju brzi prelazak (802.11r), popis susjeda (802.11k), zidovi i kanali te AP koji ' +
        'slabog klijenta sam odspoji.</p>' +
        '<p>Brojevi (prag −70 dBm, prednost 8 dB, −67 dBm za glas) uobičajene su vrijednosti iz preporuka proizvođača, ' +
        'ne iz standarda.</p>'
    },
    en: {
      stage: 'A corridor with three access points and the signal along it',
      decimal: '.',

      position: 'Client position',
      client: 'Client',
      clientDefault: 'Typical',
      clientSticky: 'Sticky',
      clientCustom: 'Custom',
      trigger: 'Roam trigger',
      delta: 'Required margin (hysteresis)',
      btm: 'AP suggests (802.11v)',
      support: 'Client, when asked',
      supportCoop: 'accepts',
      supportLegacy: 'ignores (legacy)',

      'preset_default-walk': 'Typical client',
      'presetHint_default-walk': 'Roams at 20 m and at 50 m',
      'preset_sticky-client': 'Sticky client',
      'presetHint_sticky-client': 'At 30 m it stands under AP-B and clings to AP-A',
      'preset_no-hysteresis': 'No hysteresis',
      'presetHint_no-hysteresis': 'Trigger −70, margin 0: equal at 15 m',
      'preset_ap-asks': 'AP asks: ignored',
      'presetHint_ap-asks': 'Sticky client without 802.11v: the request changes nothing',
      'preset_ap-asks-cooperative': 'AP asks: accepts',
      'presetHint_ap-asks-cooperative': 'Sticky client with 802.11v: moves at 16 m',

      legendAp: 'AP-A, AP-B, AP-C',
      legendLink: 'associated now',
      legendOther: 'other APs',
      legendTrigger: 'client\'s trigger',
      legendBand: 'hysteresis',
      legendRoam: 'roam',
      legendBtm: 'AP suggests',
      legendChanged: 'just happened',

      corridorTitle: 'Corridor, 60 m, one network (same SSID), one distribution system',
      chartTitle: 'Signal strength (RSSI, dBm) along the corridor',
      chartSub: 'thick line: the AP the client is on; lighter: the walk still ahead',
      dbm: 'dBm',
      metres: '{x} m',
      clientMark: 'client',
      lineTrigger: 'trigger {v}',
      lineBtm: 'AP asks {v}',
      lineLost: 'link lost {v}',
      ds: 'distribution system',

      cardTitle: 'Client at {x}',
      colAp: 'AP',
      colRssi: 'signal',
      colDiff: 'vs current',
      associated: 'associated',
      settings: 'Trigger {trig} dBm, margin more than {d} dB',
      settingsBtm: '802.11v on, the client {how} a request',
      howCoop: 'accepts',
      howLegacy: 'ignores',
      qualityLabel: 'Link:',
      q_good: 'good (voice-grade)',
      q_fair: 'fair',
      q_poor: 'poor',

      logTitle: 'Events so far',
      logEmpty: 'No roam yet: the client is on AP-A.',
      log_client: 'client roams',
      log_btm: 'AP asks, client accepts',
      log_ignored: 'AP asks, client ignores',
      log_lost: 'link lost',
      logReassoc: 'Reassociation Request and Response, distribution system updated, {from} notified',
      logRejoin: 'scan and join from scratch',
      logAhead: ['{n} more event further down the corridor', '{n} more events further down the corridor'],

      capRoamClient: 'At {x} {from} has dropped to {rf} dBm (trigger {trig}) and {to} is {m} dB stronger, more ' +
        'than {d}: the client sends a Reassociation Request to {to2}.',
      capRoamBtm: 'At {x} {from} ({rf} dBm) sends an 802.11v request naming {to} ({rt} dBm). The client supports ' +
        'it and accepts: it sends the Reassociation Request to {to2} itself.',
      capBtmIgnored: 'At {x} {from} ({rf} dBm) asks the client to move to {to} ({rt} dBm), but the legacy client ' +
        'ignores it and stays: the AP can only ask.',
      capLost: 'At {x} {from} is at {rf} dBm, below −90: the link is lost. The client scans again and joins the ' +
        'strongest from scratch: {to} ({rt} dBm).',
      capLookStay: 'At {x} {cur} is at {rc} dBm, under the trigger {trig}, so the client looks: {best} is only ' +
        '{m} dB stronger and it needs more than {d}. It stays.',
      capLookEqual: 'At {x} {cur} is at {rc} dBm, under the trigger {trig}, and {best} is exactly as strong. An ' +
        'equal signal never starts a roam: the client stays.',
      capLookNone: 'At {x} {cur} is at {rc} dBm, under the trigger {trig}, but no other AP is stronger. The client ' +
        'stays.',
      capSticky: 'At {x} {best} gives {rb} dBm, yet the client stays associated to {cur} at {rc} dBm: the client ' +
        'decides when to roam, and its trigger is {trig} dBm.',
      capFine: 'At {x} the client is on {cur} ({rc} dBm), above its trigger {trig}: it does not even look.',
      capQuality: 'Link: {q}.',

      explain: '<p>Three access points of one network (the same SSID) stand along a corridor, on one distribution ' +
        'system. The signal weakens with distance; the model here is derived for teaching (−40 dBm at 1 m, exponent ' +
        '3), not measured.</p>' +
        '<p><b>The client decides when to roam.</b> When the signal of its AP falls below its trigger, the client looks ' +
        'at the others and moves only if one is stronger by more than the required margin. That <i>hysteresis</i> ' +
        'stops it jumping back and forth when two APs are about equal. A roam is a <i>reassociation</i>: the client ' +
        'sends a Reassociation Request to the new AP, which answers, the distribution system learns where the client ' +
        'is, and the old AP is notified.</p>' +
        '<p>A <b>sticky client</b> has a low trigger: it stands under another AP and clings to a far one at −84 dBm. ' +
        'It is associated, but the link is poor. Associated does not mean a good signal.</p>' +
        '<p><b>The AP can only ask.</b> With an 802.11v request (BSS Transition Management) it suggests a stronger ' +
        'neighbour; a client without support ignores it. This is not a mobile network, where the network hands the ' +
        'phone from cell to cell. Left out here: fast transition (802.11r), neighbour reports (802.11k), walls and ' +
        'channels, and an AP that disconnects a weak client itself.</p>' +
        '<p>The numbers (trigger −70 dBm, margin 8 dB, −67 dBm for voice) are common values from vendors\' design guides, not ' +
        'from the standard.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
