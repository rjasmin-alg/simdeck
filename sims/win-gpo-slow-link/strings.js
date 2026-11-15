/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-slow-link, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept).
   Term pairs not in kit/glossary.js are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent, veza do kontrolera domene i proširenja na klijentu',

      // params
      speed: 'Brzina veze',
      speedHint: 'Procjena klijenta, skala je logaritamska.',
      thresholdKbps: 'Prag spore veze',
      thresholdOff: '0 · isključeno',
      allowScripts: 'Skripte: dopusti preko spore veze',
      pass: 'Prolaz',
      pass_foreground: 'prvi plan',
      pass_background: 'pozadina',

      // units (kbit/s etc.; the decimal separator is the language's)
      unitK: '{v} kbit/s',
      unitM: '{v} Mbit/s',
      unitG: '{v} Gbit/s',
      decimal: ',',

      // presets
      'preset_branch-200mb': 'Podružnica na 200 Mbit/s',
      'hint_branch-200mb': 'WAN veza podružnice: brza, sve se primjenjuje.',
      'preset_vpn-384k': 'VPN od kuće, 384 kbit/s',
      'hint_vpn-384k': 'Ispod praga od 500 kbit/s: spora veza.',
      'preset_threshold-0': 'Prag 0',
      'hint_threshold-0': 'Ista veza, prepoznavanje spore veze isključeno.',
      'preset_allow-scripts': 'Skripte preko spore veze',
      'hint_allow-scripts': '384 kbit/s, za skripte uključeno „dopusti preko spore veze”.',

      // scene
      pcRole: 'klijent',
      dcRole: 'kontroler domene',
      passHead_foreground: 'Prvi plan',
      passLine_foreground: 'pokretanje i prijava',
      passHead_background: 'Osvježavanje u pozadini',
      passLine_background: 'svakih 90 min (+ do 30)',
      dialHead: 'Procjena brzine veze',
      dialNla: 'mjeri prepoznavanje mrežne lokacije (NLA)',
      zoneSlow: 'spora veza',
      zoneFast: 'brza veza',
      zoneNone: 'nema spore veze: prag 0',
      thLabel: 'prag {th}',
      verdictSlow: 'spora veza',
      verdictFast: 'brza veza',
      verdictEqual: 'na pragu: brza',
      verdictOff: 'prag 0: brza',

      // table
      tableTitle: 'Proširenja na klijentu',
      colCse: 'Proširenje',
      colSet: 'Preko spore veze',
      colFast: 'brza veza',
      colSlow: 'spora veza',
      colNow: 'sada',
      markLabel: 'sada',
      cse_registry: 'Administrativni predlošci',
      cse_security: 'Sigurnosne postavke',
      cse_efs: 'Oporavak EFS-a',
      cse_ipsec: 'Sigurnost IP-a (IPsec)',
      cse_scripts: 'Skripte',
      cse_folders: 'Preusmjeravanje mapa',
      cse_software: 'Instalacija softvera',
      cse_quotas: 'Diskovne kvote',
      cse_drivemaps: 'Mapiranje pogona',
      tagPref: 'preferencija',
      tagChanged: 'promijenjeno',
      set_always: 'uvijek',
      set_allowed: 'dopušteno',
      set_notAllowed: 'nije dopušteno',
      res_ran: 'radi',
      res_skipped: 'preskače se',
      res_notInPass: 'nije u prolazu',
      wordWin: 'radi',
      wordSkip: 'nije u prolazu',
      noteSkipped: 'spora veza',
      tally: 'Radi: {ran} od {all} · preskočeno: {skipped} · nije u prolazu: {out}.',

      // legend
      legRan: 'radi',
      legSkipped: 'preskočeno zbog spore veze',
      legOut: 'nije u ovom prolazu',
      legLock: 'uvijek se primjenjuje',
      legChanged: 'promijenjeno zadnjim pomakom',

      // captions
      // every list the page can reach is plural (diskovne kvote, skripte, or several names): "preskaču se"
      capSlow: ['Veza od {speed} sporija je od praga {th}. Preskaču se: {list}; administrativni predlošci i sigurnosne postavke i dalje se primjenjuju.',
        'Veza od {speed} sporija je od praga {th}. Preskaču se: {list}; administrativni predlošci i sigurnosne postavke i dalje se primjenjuju.',
        'Veza od {speed} sporija je od praga {th}. Preskaču se: {list}; administrativni predlošci i sigurnosne postavke i dalje se primjenjuju.'],
      capFast: 'Veza od {speed} nije sporija od praga {th}: to nije spora veza i sve se primjenjuje.',
      capFastBg: 'Veza od {speed} nije sporija od praga {th}: to nije spora veza i sve se u ovom prolazu primjenjuje.',
      capEqual: 'Veza od {speed} točno je na pragu {th}. Spora je samo veza sporija od praga, pa je ova brza i sve se primjenjuje.',
      capEqualBg: 'Veza od {speed} točno je na pragu {th}. Spora je samo veza sporija od praga, pa je ova brza.',
      capOff: 'Prag 0 isključuje prepoznavanje spore veze: i veza od {speed} je brza, sve se primjenjuje.',
      capOffBg: 'Prag 0 isključuje prepoznavanje spore veze: i veza od {speed} je brza.',
      capBg: 'Pri osvježavanju u pozadini instalacija softvera i preusmjeravanje mapa ne rade ni na brzoj vezi: čekaju sinkrono pokretanje ili prijavu.',
      capNow_ran: 'Sada rade: {list}.',
      capNow_skipped: 'Sada se preskaču: {list}.',
      capNow_notInPass: 'Sada nisu u prolazu: {list}.',
      listAnd: ' i ',
      listComma: ', ',

      explain: '<p>Prije obrade pravila grupe klijent procjenjuje brzinu veze do kontrolera domene. Od Windows Viste to radi ' +
        '<em lang="en">network location awareness</em> (prepoznavanje mrežne lokacije), a ne ping. Veza sporija od praga, zadano ' +
        '500 kbit/s, jest <em lang="en">slow link</em> (spora veza). Prag 0 isključuje prepoznavanje: svaka veza je brza. Veza točno ' +
        'na pragu je brza.</p>' +
        '<p>Na sporoj vezi neka se <em lang="en">client-side extensions</em> (proširenja na klijentu) preskaču: instalacija softvera, ' +
        'preusmjeravanje mapa, skripte i diskovne kvote. Administrativni predlošci i sigurnosne postavke primjenjuju se ' +
        'uvijek i to se ne može isključiti (lokot). Oporavak EFS-a, IPsec i preferencija mapiranja pogona zadano se ' +
        'primjenjuju. Za svako proširenje osim prva dva njegovo pravilo „Configure … policy processing” ima opciju „dopusti obradu ' +
        'preko spore mrežne veze” (<em lang="en">Allow processing across a slow network connection</em>).</p>' +
        '<p>Podružnica nije sama po sebi spora veza: WAN veza od 200 Mbit/s daleko je iznad praga i sve se primjenjuje. ' +
        'Spora je veza kućni VPN od 384 kbit/s.</p>' +
        '<p>Instalacija softvera i preusmjeravanje mapa rade samo u sinkronom prolazu u prvom planu (pokretanje i prijava), ' +
        'pa ih pri osvježavanju u pozadini nema ni na brzoj vezi. Kada je prolaz sinkron, pokazuje simulator o obradi pravila grupe.</p>'
    },
    en: {
      stage: 'The client, its link to the domain controller and the client-side extensions',

      speed: 'Link speed',
      speedHint: 'The client\'s estimate; the scale is logarithmic.',
      thresholdKbps: 'Slow-link threshold',
      thresholdOff: '0 · off',
      allowScripts: 'Scripts: allow across a slow link',
      pass: 'Pass',
      pass_foreground: 'foreground',
      pass_background: 'background',

      unitK: '{v} kbit/s',
      unitM: '{v} Mbit/s',
      unitG: '{v} Gbit/s',
      decimal: '.',

      'preset_branch-200mb': 'Branch at 200 Mbit/s',
      'hint_branch-200mb': 'The branch WAN link: fast, everything applies.',
      'preset_vpn-384k': 'Home VPN, 384 kbit/s',
      'hint_vpn-384k': 'Below the 500 kbit/s threshold: a slow link.',
      'preset_threshold-0': 'Threshold 0',
      'hint_threshold-0': 'The same link, slow-link detection off.',
      'preset_allow-scripts': 'Scripts over a slow link',
      'hint_allow-scripts': '384 kbit/s, "allow across a slow link" on for Scripts.',

      pcRole: 'client',
      dcRole: 'domain controller',
      passHead_foreground: 'Foreground',
      passLine_foreground: 'startup and logon',
      passHead_background: 'Background refresh',
      passLine_background: 'every 90 min (+ up to 30)',
      dialHead: 'Estimated link speed',
      dialNla: 'measured by network location awareness (NLA)',
      zoneSlow: 'slow link',
      zoneFast: 'fast link',
      zoneNone: 'no slow link: threshold 0',
      thLabel: 'threshold {th}',
      verdictSlow: 'slow link',
      verdictFast: 'fast link',
      verdictEqual: 'at the threshold: fast',
      verdictOff: 'threshold 0: fast',

      tableTitle: 'Client-side extensions',
      colCse: 'Extension',
      colSet: 'Over a slow link',
      colFast: 'fast link',
      colSlow: 'slow link',
      colNow: 'now',
      markLabel: 'now',
      cse_registry: 'Administrative Templates',
      cse_security: 'Security settings',
      cse_efs: 'EFS recovery',
      cse_ipsec: 'IP security (IPsec)',
      cse_scripts: 'Scripts',
      cse_folders: 'Folder Redirection',
      cse_software: 'Software Installation',
      cse_quotas: 'Disk Quotas',
      cse_drivemaps: 'Drive Maps',
      tagPref: 'preference',
      tagChanged: 'changed',
      set_always: 'always',
      set_allowed: 'allowed',
      set_notAllowed: 'not allowed',
      res_ran: 'runs',
      res_skipped: 'skipped',
      res_notInPass: 'not in this pass',
      wordWin: 'runs',
      wordSkip: 'not in this pass',
      noteSkipped: 'slow link',
      tally: '{ran} of {all} run, {skipped} skipped, {out} not in this pass.',

      legRan: 'runs',
      legSkipped: 'skipped for a slow link',
      legOut: 'not in this pass',
      legLock: 'always applied',
      legChanged: 'changed by the last move',

      capSlow: ['{speed} is below the {th} threshold: {list} is skipped; Administrative Templates and Security settings still apply.',
        '{speed} is below the {th} threshold: {list} are skipped; Administrative Templates and Security settings still apply.'],
      capFast: '{speed} is not below the {th} threshold: not a slow link, everything applies.',
      capFastBg: '{speed} is not below the {th} threshold: not a slow link, everything in this pass applies.',
      capEqual: '{speed} is exactly at the {th} threshold. Only a link slower than the threshold is slow, so this one is fast and everything applies.',
      capEqualBg: '{speed} is exactly at the {th} threshold. Only a link slower than the threshold is slow, so this one is fast.',
      capOff: 'Threshold 0 turns slow-link detection off: even {speed} is a fast link, everything applies.',
      capOffBg: 'Threshold 0 turns slow-link detection off: even {speed} is a fast link.',
      capBg: 'A background refresh does not run Software Installation and Folder Redirection, not even on a fast link: they wait for a synchronous startup or logon.',
      capNow_ran: 'Now running: {list}.',
      capNow_skipped: 'Now skipped: {list}.',
      capNow_notInPass: 'Now not in this pass: {list}.',
      listAnd: ' and ',
      listComma: ', ',

      explain: '<p>Before it processes Group Policy, the client estimates the speed of its link to the domain controller. ' +
        'Since Windows Vista, network location awareness does this, not a ping. A link slower than the threshold, 500 ' +
        'kbit/s by default, is a slow link. Threshold 0 turns detection off: every link is fast. A link exactly at the ' +
        'threshold is fast.</p>' +
        '<p>On a slow link some client-side extensions are skipped: Software Installation, Folder Redirection, Scripts and ' +
        'Disk Quotas. Administrative Templates and Security settings always apply, and that cannot be turned off (the ' +
        'padlock). EFS recovery, IP security and the Drive Maps preference apply by default. For every extension except the ' +
        'first two, its "Configure … policy processing" policy has the option "Allow processing across a slow network connection".</p>' +
        '<p>A branch office is not a slow link by itself: a 200 Mbit/s WAN link is far above the threshold and everything ' +
        'applies. A home VPN at 384 kbit/s is a slow link.</p>' +
        '<p>Software Installation and Folder Redirection run only in a synchronous foreground pass (startup and logon), so a ' +
        'background refresh leaves them out even on a fast link. When a pass is synchronous is shown by the Group Policy processing simulator.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
