/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ipv6-slaac, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   Addresses, MACs and message names are data, passed in as placeholders (translate="no").
   The title and subtitle come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Veza s računalom H, susjedom N i usmjernikom R',

      // params
      iidOnly: 'Samo identifikator sučelja',
      mac: 'MAC adresa računala H',
      mac1: '00:1a:2b:3c:4d:5e',
      mac2: '02:00:00:00:00:01',
      mac3: '00:00:5e:00:53:01',
      prefixLen: 'Duljina prefiksa u oglasu',
      aFlag: 'Zastavica A u oglasu',
      duplicate: 'N već ima H-ovu adresu',
      dupNone: 'nijednu',
      dupLl: 'link-local',
      dupGlobal: 'globalnu',

      // presets
      presetJoin: 'H se spaja na vezu',
      presetEui: 'EUI-64: identifikator iz MAC adrese',
      presetDad: 'Dvostruka globalna adresa',
      presetDadHint: 'N već koristi globalnu adresu koju H želi.',
      presetP56: 'Oglas s prefiksom /56',
      presetAoff: 'Oglas sa zastavicom A = 0',

      // legend
      legTentative: 'nepotvrđena',
      legPreferred: 'preferirana',
      legDuplicate: 'dvostruka',
      legMulticast: 'multicast (grupi)',
      legPrefix: 'bitovi prefiksa',
      legIid: 'bitovi identifikatora',
      legChanged: 'promijenjeno u ovom koraku',

      // lanes
      laneH: 'Računalo H',
      laneN: 'Susjed N',
      laneR: 'Usmjernik R',
      noAddrYet: 'još bez IPv6 adrese',
      ipv6Off: 'IPv6 isključen',
      chartEmpty: 'Na vezi još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      reNotMine: 'nije moja',
      reOwns: 'moja je!',
      reAnswers: 'odgovara',
      reProcesses: 'obrađuje',
      noteFormed: '{scope}: nepotvrđena',
      notePreferred: '{scope}: preferirana',
      noteNoAddr: 'nema globalne',

      // address list
      addrTitle: 'Adrese računala H',
      addrNone: 'Još nijedna IPv6 adresa.',
      scLink: 'link-local',
      scGlobal: 'globalna',
      stTentative: 'nepotvrđena',
      stPreferred: 'preferirana',
      stDuplicate: 'dvostruka',
      life: 'valjana {v} · preferirana {p}',
      days: ['{n} dan', '{n} dana', '{n} dana'],
      seconds: '{n} s',
      groupsTitle: 'Grupe',
      groupsNone: 'još ni u jednoj',
      gAllNodes: 'svi čvorovi',
      gAllRouters: 'svi usmjernici',
      gSolicited: 'traženi čvor',
      routerTitle: 'Zadani usmjernik',
      routerNone: 'još nijedan',
      routerLife: '{n} s',
      useLink: 'za ovu vezu',
      useBeyond: 'izvan veze, preko {r}',
      offNote: 'Link-local adresa je dvostruka: IPv6 na ovom sučelju je isključen.',
      dupNote: 'Dvostruka adresa se ne dodjeljuje.',
      noLenNote: 'Prefiks /{p} + 64 bita ≠ 128: nema globalne adrese.',
      noANote: 'A = 0: SLAAC ne slaže adresu (DHCPv6).',

      // message card
      msgTitle: 'Poruka {n} na vezi',
      msgNone: 'Na vezi još nema poruka',
      msgNew: 'nova',
      msgOld: 'zadnja',
      nameNS: '*Neighbor Solicitation* (traženje susjeda)',
      nameNA: '*Neighbor Advertisement* (oglas susjeda)',
      nameRS: '*Router Solicitation* (traženje usmjernika)',
      nameRA: '*Router Advertisement* (oglas usmjernika)',
      fSrc: 'izvor',
      fDst: 'odredište',
      fTarget: 'cilj',
      fMembers: 'u grupi',
      fNobody: 'nitko',
      fIgnore: 'ne slušaju:',
      fFlags: 'zastavice',
      fRouterLife: 'životni vijek usmjernika',
      fPrefix: 'opcija prefiksa',
      fValid: 'valjana',
      fPreferred: 'preferirana',
      unspecified: 'nespecificirana',
      lifeVal: '{n} s',

      // bit strip
      bitsTitle: 'Adresa iz bitova',
      rowMac: 'MAC',
      rowSplit: 'na pola',
      rowInsert: 'umetni ff:fe',
      rowFlip: 'obrni bit U/L',
      rowIid: 'identifikator sučelja',
      rowLl: 'link-local',
      rowGlobal: 'globalna',
      rowSn: 'traženi čvor',
      ulBit: 'bit U/L',
      half: 'polovica {n}',
      prefixBits: ['prefiks, {n} bit', 'prefiks, {n} bita', 'prefiks, {n} bitova'],
      iidBits: ['identifikator, {n} bit', 'identifikator, {n} bita', 'identifikator, {n} bitova'],
      missing: ['nedostaje {n} bit', 'nedostaju {n} bita', 'nedostaje {n} bitova'],
      noA: 'A = 0: iz ovog prefiksa nema adrese',
      notYet: 'čeka oglas usmjernika',
      lowBits: 'zadnja 24 bita',
      cmpTitle: 'Tri MAC adrese',
      cmpUl: 'U/L',

      // captions
      capStart: 'H se spaja na vezu s usmjernikom R i susjedom N. Još nema nijednu IPv6 adresu, a nitko mu je neće dodijeliti: složit će je sam.',
      capStartIid: 'Identifikator sučelja (*interface identifier*) ima 64 bita i nastaje iz 48-bitne MAC adrese {mac}. Pritisni → za sljedeći korak.',
      capIid: 'Od MAC adrese {mac} H slaže 64-bitni identifikator sučelja (*interface identifier*, modificirani EUI-64): razdvoji je na pola, umetne ff:fe i obrne bit U/L. Dobiva {iid}.',
      capLl: 'H stavlja fe80::/64 ispred identifikatora: {addr} je *link-local* adresa, za koju ne treba usmjernik. Adresa je nepotvrđena (*tentative*) i još se ne koristi. H ulazi u grupe {all} i {sn}.',
      capGua: 'Oglas nosi {prefix} sa zastavicom A. H dodaje svoj 64-bitni identifikator sučelja i dobiva {addr}, nepotvrđenu dok DAD ne završi.',
      capGuaGroup: 'Grupa {sn} ovisi samo o zadnja 24 bita, pa je H već u njoj.',
      capNs: 'H šalje *Neighbor Solicitation* (traženje susjeda) s adrese :: na {sn}: pita je li itko već vlasnik {addr}. Dok nema odgovora, adresa je nepotvrđena (*tentative*).',
      capNsNobody: 'Nitko drugi nije u toj grupi.',
      capNsNotMine: '{who} je u grupi, ali cilj nije njegova adresa: šuti.',
      capNsOwner: '{who} već ima tu adresu.',
      capOk: 'Prošla je 1 s (*RetransTimer*) bez odgovora: nitko drugi nema {addr}. Adresa je sada *preferred* (preferirana) i smije biti izvor.',
      capNa: '{who} odgovara porukom *Neighbor Advertisement* (oglas susjeda) na {all}: {addr} je već njegova. H je označava kao dvostruku (*duplicate*) i ne dodjeljuje je.',
      capNaLl: 'Link-local izvedena iz MAC adrese je dvostruka, pa H isključuje IPv6 na tom sučelju: bez nje ne može ni pitati usmjernik.',
      capNaGlobal: 'H zadržava link-local adresu i zadani usmjernik, ali globalnu adresu nema.',
      capRs: 'Link-local je preferirana, pa H s nje šalje *Router Solicitation* (traženje usmjernika) na {dst}, grupu svih usmjernika. U njoj je samo R.',
      capRa: 'R odgovara porukom *Router Advertisement* (oglas usmjernika) s {src} na {dst}: prefiks {prefix}, A = {a}, životni vijek usmjernika {life} s. {src} postaje H-ov zadani usmjernik.',
      capRaM: 'Zastavica M = 1 kaže da adrese dijeli poslužitelj.',
      capNoLength: 'Prefiks je /{p}: {p} + 64 = {sum} bitova, a adresa ih ima 128. H ne može dodati 64-bitni identifikator i zanemaruje prefiks. Ostaje samo link-local, uz zadani usmjernik.',
      capNoA: 'Zastavica A = 0: usmjernik kaže da adresu iz ovog prefiksa računalo ne slaže samo. Tu nastupa DHCPv6, poslužitelj koji dijeli adrese. SLAAC ne daje adresu; ostaje link-local.',
      capReady: 'H je spreman: {ll} za razgovor na ovoj vezi, {gua} za sve izvan nje, preko zadanog usmjernika {r}. Adresu nije dodijelio ni R ni DHCP poslužitelj: R je poslao samo prefiks.',
      capSplit: '48-bitna MAC adresa {mac} dijeli se na dvije polovice od po 3 okteta: {a} i {b}.',
      capInsert: 'Između polovica umeće se ff:fe: {eui}. Sada ima 64 bita.',
      capFlip: 'Bit U/L (0x02 u prvom oktetu) se obrće: {before} → {after}. Identifikator sučelja je {iid}.',
      capFlipLocal: 'Ova MAC adresa je lokalno administrirana (U/L = 1), pa bit prelazi u 0.',
      capCompare: 'Sve tri MAC adrese: bit U/L se obrće uvijek, u oba smjera. Tih 64 bita ide iza svakog /64 prefiksa, i iza fe80:: i iza prefiksa iz oglasa.',

      explain:
        '<p><em lang="en">Stateless address autoconfiguration</em> (bezstanjska samododjela adrese, SLAAC) slaže adresu od dva ' +
        'dijela: <b>prefiksa</b> od 64 bita i <b>identifikatora sučelja</b> od 64 bita. Identifikator računalo ima samo, ' +
        'a prefiks za <em lang="en">link-local</em> adresu je uvijek fe80::/64. Zato link-local adresa nastaje bez ' +
        'ikakvog usmjernika.</p>' +
        '<p>Svaka nova adresa je najprije nepotvrđena (<em lang="en">tentative</em>). <em lang="en">Duplicate address ' +
        'detection</em> (otkrivanje dvostruke adrese, DAD) pita vezu je li adresa zauzeta: <em lang="en">Neighbor ' +
        'Solicitation</em> s adrese :: na grupu traženog čvora (ff02::1:ff i zadnja 24 bita adrese). Ako u 1 s nitko ' +
        'ne odgovori, adresa je preferirana. Ako vlasnik odgovori, adresa je dvostruka i ne koristi se. Kad dva ' +
        'računala ispituju istu adresu u isto vrijeme, oba gube.</p>' +
        '<p>Globalnu adresu računalo slaže iz <em lang="en">Router Advertisement</em> poruke: usmjernik javlja prefiks, ' +
        'a zastavica A kaže smije li računalo samo dodati identifikator. Prefiks mora biti dug točno 64 bita, inače ' +
        'zbroj nije 128 i adrese nema. Računalo usput dobiva [[default route]] preko usmjernika.</p>' +
        '<p>Česte zablude: SLAAC ne treba DHCP poslužitelj; usmjernik ne dodjeljuje adresu, nego šalje samo prefiks; ' +
        'adresa se ne koristi čim nastane, nego tek nakon DAD-a.</p>' +
        '<p>Identifikator iz MAC adrese (EUI-64) jednak je u svakoj mreži, pa otkriva uređaj. Mnogi današnji sustavi ' +
        'zato ga biraju nasumično (privremene adrese) ili ga izvode iz tajnog ključa i prefiksa (stabilne neprozirne ' +
        'adrese). Postupak SLAAC-a i DAD-a ostaje isti.</p>'
    },
    en: {
      stage: 'A link with host H, neighbour N and router R',

      iidOnly: 'The interface ID only',
      mac: 'H\'s MAC address',
      mac1: '00:1a:2b:3c:4d:5e',
      mac2: '02:00:00:00:00:01',
      mac3: '00:00:5e:00:53:01',
      prefixLen: 'Prefix length in the RA',
      aFlag: 'A flag in the RA',
      duplicate: 'N already holds H\'s address',
      dupNone: 'none',
      dupLl: 'link-local',
      dupGlobal: 'global',

      presetJoin: 'H joins the link',
      presetEui: 'EUI-64: the interface ID from a MAC',
      presetDad: 'Duplicate global address',
      presetDadHint: 'N already uses the global address H wants.',
      presetP56: 'An RA with a /56 prefix',
      presetAoff: 'An RA with A = 0',

      legTentative: 'tentative',
      legPreferred: 'preferred',
      legDuplicate: 'duplicate',
      legMulticast: 'multicast (to a group)',
      legPrefix: 'prefix bits',
      legIid: 'interface ID bits',
      legChanged: 'changed in this step',

      laneH: 'Host H',
      laneN: 'Neighbour N',
      laneR: 'Router R',
      noAddrYet: 'no IPv6 address yet',
      ipv6Off: 'IPv6 off',
      chartEmpty: 'Nothing on the link yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      reNotMine: 'not mine',
      reOwns: 'mine!',
      reAnswers: 'answers',
      reProcesses: 'processes',
      noteFormed: '{scope}: tentative',
      notePreferred: '{scope}: preferred',
      noteNoAddr: 'no global',

      addrTitle: 'H\'s addresses',
      addrNone: 'No IPv6 address yet.',
      scLink: 'link-local',
      scGlobal: 'global',
      stTentative: 'tentative',
      stPreferred: 'preferred',
      stDuplicate: 'duplicate',
      life: 'valid {v} · preferred {p}',
      days: ['{n} day', '{n} days'],
      seconds: '{n} s',
      groupsTitle: 'Groups',
      groupsNone: 'none yet',
      gAllNodes: 'all nodes',
      gAllRouters: 'all routers',
      gSolicited: 'solicited node',
      routerTitle: 'Default router',
      routerNone: 'none yet',
      routerLife: '{n} s',
      useLink: 'for this link',
      useBeyond: 'beyond the link, via {r}',
      offNote: 'The link-local address is a duplicate: IPv6 is off on this interface.',
      dupNote: 'A duplicate address is not assigned.',
      noLenNote: 'Prefix /{p} + 64 bits ≠ 128: no global address.',
      noANote: 'A = 0: SLAAC builds no address (DHCPv6).',

      msgTitle: 'Message {n} on the link',
      msgNone: 'Nothing on the link yet',
      msgNew: 'new',
      msgOld: 'last',
      nameNS: '*Neighbor Solicitation*',
      nameNA: '*Neighbor Advertisement*',
      nameRS: '*Router Solicitation*',
      nameRA: '*Router Advertisement*',
      fSrc: 'source',
      fDst: 'destination',
      fTarget: 'target',
      fMembers: 'in the group',
      fNobody: 'nobody',
      fIgnore: 'not listening:',
      fFlags: 'flags',
      fRouterLife: 'router lifetime',
      fPrefix: 'prefix option',
      fValid: 'valid',
      fPreferred: 'preferred',
      unspecified: 'unspecified',
      lifeVal: '{n} s',

      bitsTitle: 'The address, bit by bit',
      rowMac: 'MAC',
      rowSplit: 'split',
      rowInsert: 'insert ff:fe',
      rowFlip: 'flip the U/L bit',
      rowIid: 'interface ID',
      rowLl: 'link-local',
      rowGlobal: 'global',
      rowSn: 'solicited node',
      ulBit: 'U/L bit',
      half: 'half {n}',
      prefixBits: ['prefix, {n} bit', 'prefix, {n} bits'],
      iidBits: ['interface ID, {n} bit', 'interface ID, {n} bits'],
      missing: ['{n} bit missing', '{n} bits missing'],
      noA: 'A = 0: no address from this prefix',
      notYet: 'waits for a router advertisement',
      lowBits: 'low 24 bits',
      cmpTitle: 'Three MAC addresses',
      cmpUl: 'U/L',

      capStart: 'H plugs into a link with router R and neighbour N. It has no IPv6 address yet, and nobody will hand it one: it builds its own.',
      capStartIid: 'The interface identifier is 64 bits long and comes from the 48-bit MAC address {mac}. Press → for the next step.',
      capIid: 'From its MAC address {mac}, H builds a 64-bit interface identifier (modified EUI-64): split it in half, insert ff:fe, flip the U/L bit. It gets {iid}.',
      capLl: 'H puts fe80::/64 in front of the identifier: {addr} is its link-local address, which needs no router. The address is tentative and not used yet. H joins the groups {all} and {sn}.',
      capGua: 'The RA carries {prefix} with the A flag set. H appends its 64-bit interface ID and gets {addr}, still tentative until DAD finishes.',
      capGuaGroup: 'The group {sn} depends on the low 24 bits only, so H is already in it.',
      capNs: 'H sends a Neighbor Solicitation from :: to {sn}: does anyone already own {addr}? Until there is an answer, the address stays tentative.',
      capNsNobody: 'Nobody else is in that group.',
      capNsNotMine: '{who} is in the group, but the target is not its address: it stays silent.',
      capNsOwner: '{who} already holds that address.',
      capOk: '1 s (RetransTimer) has passed with no answer: nobody else has {addr}. The address is now preferred and may be a source.',
      capNa: '{who} answers with a Neighbor Advertisement to {all}: {addr} is already its own. H marks it duplicate and does not assign it.',
      capNaLl: 'A link-local derived from the MAC address is a duplicate, so H turns IPv6 off on that interface: without it, it cannot even ask a router.',
      capNaGlobal: 'H keeps its link-local address and the default router, but has no global address.',
      capRs: 'The link-local is preferred, so H sends a Router Solicitation from it to {dst}, the all-routers group. Only R is in it.',
      capRa: 'R answers with a Router Advertisement from {src} to {dst}: prefix {prefix}, A = {a}, router lifetime {life} s. {src} becomes H\'s default router.',
      capRaM: 'The M flag = 1 says a server hands out the addresses.',
      capNoLength: 'The prefix is /{p}: {p} + 64 = {sum} bits, and an address has 128. H cannot append a 64-bit identifier and ignores the prefix. It keeps only its link-local, with a default router.',
      capNoA: 'A = 0: the router says hosts do not build addresses from this prefix themselves. That is where DHCPv6, a server that hands out addresses, comes in. SLAAC gives no address; the link-local stays.',
      capReady: 'H is ready: {ll} for talking on this link, {gua} for everything beyond it, via the default router {r}. Neither R nor a DHCP server assigned the address: R sent only the prefix.',
      capSplit: 'The 48-bit MAC address {mac} is split into two halves of 3 octets each: {a} and {b}.',
      capInsert: 'ff:fe goes in between the halves: {eui}. Now it has 64 bits.',
      capFlip: 'The U/L bit (0x02 in the first octet) is flipped: {before} → {after}. The interface identifier is {iid}.',
      capFlipLocal: 'This MAC address is locally administered (U/L = 1), so the bit becomes 0.',
      capCompare: 'All three MAC addresses: the U/L bit is always flipped, both ways. These 64 bits go after any /64 prefix, after fe80:: and after the prefix from the RA.',

      explain:
        '<p>Stateless address autoconfiguration (SLAAC) builds an address from two parts: a 64-bit <b>prefix</b> and a ' +
        '64-bit <b>interface identifier</b>. The host has the identifier on its own, and the prefix of a link-local ' +
        'address is always fe80::/64. That is why the link-local address needs no router at all.</p>' +
        '<p>Every new address starts out tentative. Duplicate address detection (DAD) asks the link whether the address ' +
        'is taken: a Neighbor Solicitation from :: to the solicited-node group (ff02::1:ff and the low 24 bits of the ' +
        'address). If nobody answers within 1 s, the address is preferred. If the owner answers, it is a duplicate and ' +
        'is not used. When two hosts probe the same address at the same time, both lose.</p>' +
        '<p>The global address comes from a Router Advertisement: the router announces the prefix, and the A flag says ' +
        'whether the host may append its identifier itself. The prefix must be exactly 64 bits long, otherwise the sum is ' +
        'not 128 and there is no address. The host also gets a [[default route]] via the router.</p>' +
        '<p>Common mistakes: SLAAC needs no DHCP server; the router does not assign the address, it only sends the prefix; ' +
        'an address is not used the moment it is formed, only after DAD.</p>' +
        '<p>An identifier from the MAC address (EUI-64) is the same on every network, so it gives the device away. Many ' +
        'current systems therefore pick it at random (temporary addresses) or derive it from a secret key and the prefix ' +
        '(stable opaque addresses). The SLAAC and DAD steps stay the same.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
