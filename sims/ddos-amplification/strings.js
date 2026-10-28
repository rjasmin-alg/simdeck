/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ddos-amplification, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder.
   The title and subtitle are not here: they come from sim.json (title, concept).
   Terms (denial of service, amplification, bandwidth amplification factor, spoofed source address, reflector,
   ingress filtering, rate limiting) are not yet in kit/glossary.js, so they are written out in both languages here
   rather than as [[term]] (COMMON.md §4; listed in NOTES.md "Term pairs"). Service and protocol names, bit rates and
   addresses are data: the page wraps them in translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Pojačavanje: mali lažirani upiti, velik odgovor žrtvi',

      // service names and unit (data, same in both languages)
      svcDns: 'DNS', svcSnmp: 'SNMPv2', svcSsdp: 'SSDP', svcNtp: 'NTP',
      unitMbps: 'Mbit/s',

      // scene labels
      sender: 'Napadač',
      senderSub: 'šalje male upite',
      reflectors: 'Javne UDP usluge',
      reflectorsSub: 'reflektori (pojačala)',
      victim: 'Žrtva',
      victimSub: 'pristupna veza',
      forged: 'izvor = žrtva',
      reqLabel: 'mali upit',
      repLabel: 'velik odgovor',

      // gauge
      gaugeTitle: 'Opterećenje pristupne veze',
      capMark: 'kapacitet',
      loadLine: '{load} Mbit/s od {cap} Mbit/s ({pct} %)',
      satTimes: 'promet premašuje vezu {times}×',
      freeLine: 'slobodno za zakoniti promet: {free} Mbit/s',
      blockedSource: 'upiti zaustavljeni na izvoru',
      blockedReflector: 'usluge zatvorene',

      // params
      pService: 'Javna UDP usluga',
      pSent: 'Poslani promet (lažirani upiti)',
      pVictim: 'Kapacitet žrtvine veze',
      pIngress: 'Filtriranje na izvoru (BCP 38)',
      pClosed: 'Reflektori zatvoreni',
      pRate: 'Ograniči brzinu reflektora',
      pVictimFilter: 'Filtar na žrtvinom rubu',

      // presets
      'preset_book-dns': 'DNS: upit malen, odgovor velik',
      'preset_saturation': 'Zasićenje spore veze',
      'preset_larger-factor': 'Veći faktor (NTP)',
      'preset_ingress-filtering': 'Filtriranje na izvoru pomaže',
      'preset_victim-side-filter': 'Filtar kod žrtve ne pomaže',
      'hint_book-dns': 'DNS faktor 54: 10 Mbit/s upita stiže kao oko 540 Mbit/s; veza od 1 Gbit/s na pola.',
      'hint_saturation': 'Isti napad, veza od 100 Mbit/s: zasićena višestruko.',
      'hint_larger-factor': 'NTP faktor u stotinama: 10 Mbit/s samo premašuje vezu od 1 Gbit/s.',
      'hint_ingress-filtering': 'Isto kao zasićenje, ali s filtriranjem na izvoru: do žrtve ne stiže ništa.',
      'hint_victim-side-filter': 'Isto kao zasićenje, ali s filtrom na žrtvi: veza je i dalje puna.',

      // legend
      legReq: 'upit (lažiran izvor)',
      legRep: 'odgovor (širina ∝ brzini)',
      legGauge: 'kapacitet veze',
      legSat: 'zasićeno',
      legDefence: 'obrana',
      legChanged: 'promijenjeno',

      // captions
      capBaf: 'Faktor pojačanja propusnosti je {baf}: svaki bajt upita postaje {baf} bajtova odgovora. {sent} Mbit/s lažiranih upita stiže žrtvi kao oko {refl} Mbit/s odgovora.',
      capUnder: 'To je {pct} % kapaciteta veze ({cap} Mbit/s) — veza nije zasićena.',
      capSat: 'To je {times}× kapaciteta veze ({cap} Mbit/s) — veza je zasićena, zakoniti promet se bori za ostatak.',
      capIngress: 'Filtriranje na izvoru (BCP 38) odbacuje lažirane upite u mreži napadača: do reflektora ne stiže ništa, pa je žrtvina veza slobodna.',
      capClosed: 'Reflektori su zatvoreni: nijedna javna usluga ne odgovara, pa do žrtve ne stiže pojačani promet.',
      capRate: 'Ograničena brzina reflektora prepolovila je pojačani promet.',
      capVictimFilter: 'Filtar na žrtvinom rubu odbacuje poplavu tek nakon pristupne veze — veza je već puna, pa opterećenje ostaje {times}×. Filtriranje kod žrtve ne pomaže (pa ni filtriranje jedne adrese kad ih napada tisuće).',

      explain:
        '<p><b>Pojačavajući napad uskraćivanja usluge</b> (<i>distributed reflective denial of service</i>, DRDoS): napadač šalje male upite javnim UDP uslugama, ali u svaki upiše <i>lažiranu izvorišnu adresu</i> — žrtvinu umjesto svoje. UDP nema rukovanja, pa usluga ne može znati da je adresa lažna i odgovor šalje žrtvi.</p>' +
        '<p><i>Faktor pojačanja propusnosti</i> (bandwidth amplification factor, BAF) jest omjer bajtova odgovora prema bajtovima upita. Promet kod žrtve ≈ poslani promet × BAF (zbrojeno po reflektorima; zaglavlja se zanemaruju). Mala količina upita žrtvi stiže mnogostruko uvećana.</p>' +
        '<p>Napadaču ne treba propusnost kao žrtvi — faktor obavlja posao. Reflektori su prevarene javne usluge, ne napadači. <b>Obrana</b> djeluje na različite dijelove: <i>filtriranje na izvoru</i> (BCP 38 / RFC 2827) uklanja lažirane upite u mreži napadača; zatvaranje ili ograničavanje usluga smanjuje pojačani promet; filtriranje kod žrtve ne pomaže kad je njezina veza već puna.</p>' +
        '<p class="ddos-note">Faktori pojačanja: US-CERT/CISA Alert TA14-017A. Zanemarena su zaglavlja i detalji redova čekanja — prikazane su aritmetika i obrane.</p>'
    },

    en: {
      stage: 'Amplification: small forged requests, a large reply at the victim',

      svcDns: 'DNS', svcSnmp: 'SNMPv2', svcSsdp: 'SSDP', svcNtp: 'NTP',
      unitMbps: 'Mbit/s',

      sender: 'Attacker',
      senderSub: 'sends small requests',
      reflectors: 'Public UDP services',
      reflectorsSub: 'reflectors (amplifiers)',
      victim: 'Victim',
      victimSub: 'access link',
      forged: 'source = victim',
      reqLabel: 'small request',
      repLabel: 'large reply',

      gaugeTitle: 'Access-link load',
      capMark: 'capacity',
      loadLine: '{load} Mbit/s of {cap} Mbit/s ({pct} %)',
      satTimes: 'traffic exceeds the link {times}×',
      freeLine: 'free for legitimate traffic: {free} Mbit/s',
      blockedSource: 'requests stopped at the source',
      blockedReflector: 'services closed',

      pService: 'Public UDP service',
      pSent: 'Sent traffic (forged requests)',
      pVictim: 'Victim link capacity',
      pIngress: 'Ingress filtering at the source (BCP 38)',
      pClosed: 'Reflectors closed',
      pRate: 'Rate-limit the reflectors',
      pVictimFilter: 'Filter at the victim edge',

      'preset_book-dns': 'DNS: small request, large reply',
      'preset_saturation': 'Saturating a slow link',
      'preset_larger-factor': 'A larger factor (NTP)',
      'preset_ingress-filtering': 'Source filtering helps',
      'preset_victim-side-filter': 'A victim-side filter does not help',
      'hint_book-dns': 'DNS factor 54: 10 Mbit/s of requests arrives as about 540 Mbit/s; a 1 Gbit/s link at half.',
      'hint_saturation': 'The same attack, a 100 Mbit/s link: saturated several times over.',
      'hint_larger-factor': 'NTP, a factor in the hundreds: 10 Mbit/s alone exceeds a 1 Gbit/s link.',
      'hint_ingress-filtering': 'Like saturation, but with source filtering: nothing reaches the victim.',
      'hint_victim-side-filter': 'Like saturation, but with a filter at the victim: the link is still full.',

      legReq: 'request (forged source)',
      legRep: 'reply (width ∝ rate)',
      legGauge: 'link capacity',
      legSat: 'saturated',
      legDefence: 'defence',
      legChanged: 'changed',

      capBaf: 'The bandwidth amplification factor is {baf}: every byte of request becomes {baf} bytes of reply. {sent} Mbit/s of forged requests reach the victim as about {refl} Mbit/s of replies.',
      capUnder: 'That is {pct} % of the link capacity ({cap} Mbit/s) — the link is not saturated.',
      capSat: 'That is {times}× the link capacity ({cap} Mbit/s) — the link is saturated, and legitimate traffic competes for what is left.',
      capIngress: 'Ingress filtering at the source (BCP 38) drops the forged requests inside the attacker network: nothing reaches the reflectors, so the victim link is free.',
      capClosed: 'The reflectors are closed: no public service answers, so no amplified traffic reaches the victim.',
      capRate: 'Rate-limiting the reflectors halved the amplified traffic.',
      capVictimFilter: 'A filter at the victim edge drops the flood only after the access link — the link is already full, so the load stays {times}×. Filtering at the victim does not help (nor does filtering one address when thousands attack at once).',

      explain:
        '<p><b>A reflective, amplified denial-of-service attack</b> (distributed reflective denial of service, DRDoS): the attacker sends small requests to public UDP services, but writes a <i>spoofed source address</i> into each — the victim\'s, not its own. UDP has no handshake, so the service cannot tell the address is forged and sends its reply to the victim.</p>' +
        '<p>The <i>bandwidth amplification factor</i> (BAF) is the ratio of reply bytes to request bytes. Traffic at the victim ≈ sent traffic × BAF (summed over reflectors; header overhead ignored). A small amount of requests reaches the victim many times larger.</p>' +
        '<p>The attacker needs nowhere near the victim\'s bandwidth — the factor does the work. The reflectors are tricked public services, not the attackers. <b>Defences</b> act on different parts: <i>ingress filtering</i> (BCP 38 / RFC 2827) removes the forged requests inside the attacker network; closing or rate-limiting the services lowers the amplified traffic; filtering at the victim does not help once its link is already full.</p>' +
        '<p class="ddos-note">Amplification factors: US-CERT/CISA Alert TA14-017A. Header overhead and queueing detail are ignored — the page shows the arithmetic and the defences.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
