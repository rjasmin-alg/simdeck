/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of dhcp-dora, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); terms
   missing from kit/glossary.js are written out this way (NOTES.md, "Term pairs").
   The title and subtitle come from sim.json (title, concept). Message names (DHCPDISCOVER …), state names (BOUND …),
   addresses and times are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klijent i DHCP poslužitelji na jednom segmentu: poruke, zapisi o zakupu i vremenska crta zakupa',

      // params
      lease: 'Trajanje zakupa (opcija 51)',
      lease600: '600 s',
      lease2h: '2 h',
      lease8d: '8 dana',
      serverB: 'Drugi poslužitelj',
      bNone: 'nema',
      bPlain: 'običan B',
      bPartner: 'B, partner od A',
      failAt: 'Poslužitelj A prestaje raditi',
      failNone: 'nikad',
      failT1: '10 s prije T1',
      failT2: '10 s prije T2',
      leave: 'Klijent odlazi',
      leaveStay: 'ostaje',
      leaveOff: 'ugašen',
      leaveRelease: 'uz RELEASE',
      optChange: 'Promjena DNS-a (opcija 6)',
      optOff: 'Samo kad poslužitelj ne prestaje raditi.',
      bcastFlag: 'Zastavica BROADCAST',

      // presets
      presetLease600: '600 s: obnova',
      presetLease600Hint: 'Jedan poslužitelj, zakup 600 s: obnova na T1 = 300 s.',
      presetTwo: 'Dvije ponude',
      presetTwoHint: 'A i B nude, klijent uzima prvu ponudu, B oslobađa svoju adresu.',
      presetDies: 'A nestane',
      presetDiesHint: 'A prestaje raditi 10 s prije T1: obnova, ponovno vezanje i istek.',
      presetPartner: 'Partner B',
      presetPartnerHint: 'A nestane, a partner B s kopijom zapisa potvrđuje zakup na T2.',
      presetNoBackup: 'B nije rezerva',
      presetNoBackupHint: 'B ne zna zakup: klijent na isteku kreće ispočetka i dobiva drugu adresu.',
      presetClass: 'Učionica, 2 h',
      presetClassHint: 'Zakup 2 h, računalo ugašeno nakon 50 minuta bez DHCPRELEASE.',
      presetWin: '8 dana',
      presetWinHint: 'Zadano trajanje zakupa u Windows Serveru. Promjena DNS-a stiže do klijenta tek na T1, nakon 4 dana.',

      // legend
      legUnicast: 'jednoodredišno',
      legBroadcast: 'emitirano svima',
      legLost: '✕ izgubljeno',
      legUpDown: '▲ radi / ▼ ne radi',
      legChanged: 'promijenjeno u ovom koraku',

      // lanes
      client: 'Klijent',
      serverA: 'Poslužitelj A',
      serverBName: 'Poslužitelj B',
      up: '▲ radi',
      down: '▼ ne radi',
      partnerRole: 'partner od A, u pripravnosti',
      noAddr: 'bez adrese',
      addr: 'adresa',
      optRouter: 'pristupnik',
      optDns: 'DNS',
      leases: 'Zapisi o zakupu',
      empty: 'prazno',
      offered: 'ponuđeno',
      until: 'do {t}',
      copy: 'kopija',
      stINIT: 'početno stanje',
      stSELECTING: 'čeka ponude',
      stREQUESTING: 'traži izabranu',
      stBOUND: 'ima adresu',
      stRENEWING: 'obnavljanje',
      stREBINDING: 'ponovno vezanje',
      stOFF: 'ugašeno',

      // chart
      earlier: ['↑ još {n} raniji redak', '↑ još {n} ranija retka', '↑ još {n} ranijih redaka'],
      chartEmpty: 'Još nema poruka. Pritisni →.',
      causeT1: 'T1',
      causeT2: 'T2',
      causeRetry: 'ponovno',
      causeExpiry: 'istek',
      causeLeave: 'odlazak',
      reStandby: 'pripravnost, šuti',
      reSilent: 'nema zapis, šuti',
      reFreed: 'oslobađa {addr}',
      reFull: 'nema slobodnih',
      reLate: 'kasni, zanemareno',
      reIgnored: 'zanemareno',
      reReleased: 'briše zapis',
      noteDown: '▼ {srv} prestaje raditi',
      noteOff: 'računalo ugašeno',
      noteOpt: 'opcija 6: DNS {dns}',
      noteExpire: 'zapis istekao: {addr} slobodna',

      // message card
      msgTitle: 'Poruka {n}',
      msgNone: 'Još nema poruka.',
      msgNew: 'nova',
      msgOld: 'iz ranijeg koraka',
      fFrom: 'od',
      fTo: 'prema',
      fHow: 'kako',
      fBcast: 'emitirano svima',
      fUni: 'jednoodredišno',
      fFlag: 'zastavica B',
      o50: '50 tražena adresa',
      o51: '51 trajanje zakupa',
      o54: '54 oznaka poslužitelja',
      o1: '1 maska',
      o3: '3 pristupnik',
      o6: '6 DNS',
      flagNote: 'Bez zastavice B poslužitelj smije odgovoriti izravno na yiaddr i chaddr.',
      flagNoteOff: 'Zastavica B nije postavljena: poslužitelj odgovara izravno na yiaddr i chaddr.',
      stLost: '✕ izgubljena: nitko je ne prima',
      stFlight: 'putuje',

      // lease bar
      barTitle: 'Zakup klijenta',
      barServer: 'zapis na {srv}',
      now: 'sada {t}',
      mStart: 'početak',
      mExp: 'istek',
      kBound: 'ima adresu (BOUND)',
      kRenew: 'obnavljanje (RENEWING)',
      kRebind: 'ponovno vezanje (REBINDING)',
      kOff: 'ugašeno, a zapis stoji',

      // times
      tS: '{v} s',
      tMin: '{v} min',
      tH: '{v} h',
      tD: '{v} d',

      // captions
      capStart: 'Klijent democli1 još nema adresu. Pritisni → i poslat će prvu poruku.',
      capDiscover: '*Broadcast* (emitiranje): klijent bez adrese šalje DHCPDISCOVER s {src} na {dst}, svima na segmentu, jer adrese nema nikome uputiti.',
      capOffer: '{who}: ponuda još nije dodjela, adresa nije upisana kao zakup.',
      capOfferOne: '{srv} nudi {addr}',
      capStandby: ' {srv} je partner u pripravnosti i šuti dok A radi.',
      capFull: ' {srv} nema slobodnih adresa.',
      capNoOffer: 'Nijedan poslužitelj ne nudi adresu: klijent ostaje bez nje (INIT).',
      capChoose: 'Klijent uzima prvu ponudu, od {srv} ({addr}), i opet emitira: DHCPREQUEST nosi oznaku izabranog poslužitelja (opcija 54) {ip}, pa svi saznaju koga je izabrao.',
      capLate: ' Ponuda od {srv} ({addr}) stigla je uz nju i klijent je zanemaruje.',
      capAck: '{srv} zapisuje vezu {addr} ↔ {mac} do {exp} i šalje DHCPACK.',
      capFreed: ' {srv} iz istog zahtjeva vidi da nije izabran i oslobađa {addr}.',
      capCopy: ' Partner {p} dobiva kopiju zapisa.',
      capBound: 'DHCPACK je stigao: klijent ima adresu {addr}. Zakup {lease}: T1 = {t1}, T2 = {t2}, istek {exp}.',
      capBoundAgain: 'Klijent opet ima adresu, ali drugu: {addr}, od poslužitelja {srv}. Zakup od {now} do {exp}.',
      capBoundSame: 'Klijent opet ima adresu {addr}, od poslužitelja {srv}, ali kao novi zakup: od {now} do {exp}.',
      capRenewed: 'Zakup je obnovljen od {now}: novi T1 = {t1}, T2 = {t2}, istek {exp}. Adresa {addr} ostaje ista.',
      capRebound: '{srv} je potvrdio zakup: klijent zadržava {addr}, sada kod poslužitelja {srv}. Zakup od {now}, istek {exp}.',
      capDns: ' Tek sada klijent dobiva novi DNS {dns}.',
      capRenew: 'T1 = {now}: klijent ulazi u stanje obnavljanja (*renewing*) i šalje DHCPREQUEST izravno poslužitelju {srv}, samo njemu.',
      capRenewLost: ' {srv} ne radi i zahtjev se gubi. Sljedeći pokušaj: {retry}.',
      capRenewAck: '{srv} ima zapis i produljuje ga do {exp}: odgovara DHCPACK-om izravno na {addr}.',
      capRetryRenew: 'Odgovora nema: klijent ({now}) ponovno šalje DHCPREQUEST poslužitelju {srv}, nakon pola vremena preostalog do T2.',
      capRetryRebind: 'Odgovora nema: klijent ({now}) ponovno emitira DHCPREQUEST, nakon pola preostalog zakupa, ali najmanje 60 s.',
      capRetryLost: ' Opet ga nitko ne prima.',
      capRebind: 'T2 = {now}: ponovno vezanje (*rebinding*). Klijent emitira DHCPREQUEST: neka se javi bilo koji poslužitelj koji zna ovaj zakup.',
      capRebindLost: ' Nijedan poslužitelj ne radi i zahtjev se gubi.',
      capSilent: '{srv} prima zahtjev, ali o ovom zakupu nema zapisa i šuti. Običan drugi poslužitelj nije rezerva.',
      capRebindAck: '{srv} kao partner ima kopiju zapisa: produljuje zakup do {exp} i odgovara DHCPACK-om.',
      capExpire: 'Istekao je *lease* (zakup adrese): klijent prestaje koristiti {addr} i kreće ispočetka s DHCPDISCOVER.',
      capExpireLost: ' Nijedan poslužitelj ne radi: ponude nema i klijent ostaje bez adrese. Mnogi sustavi tada sami sebi daju adresu iz 169.254.0.0/16.',
      capDown: 'Poslužitelj {srv} prestaje raditi ({now}). Klijent to ne zna: do T1 ne pita ništa.',
      capOpt: 'Na poslužitelju je opcija 6 (DNS) promijenjena u {dns}. Klijent i dalje koristi {old}: do sljedećeg DHCPACK-a ne pita ništa.',
      capOff: 'Računalo je ugašeno ({now}) bez DHCPRELEASE. Poslužitelj {srv} i dalje drži {addr} zauzetom, do {until}: još {left}.',
      capOffNoLease: 'Računalo je ugašeno ({now}).',
      capRelease: 'Prije gašenja ({now}) klijent šalje DHCPRELEASE izravno poslužitelju {srv}: adresa {addr} mu više ne treba.',
      capReleased: '{srv} briše zapis: {addr} je odmah opet slobodna.',
      capServerExpire: 'Na poslužitelju {srv} istječe zapis ({now}): {addr} je tek sada opet slobodna, {left} nakon što je računalo otišlo.',
      capNakSent: '{srv} o tom zakupu nema zapis i odgovara DHCPNAK.',
      capNak: 'Stigao je DHCPNAK: klijent odmah prestaje koristiti {addr} i kreće ispočetka.',
      capIgnored: 'Klijent zanemaruje poruku od {srv}.',
      list2: '{a} i {b}',

      explain: '<p>Klijent bez adrese ne može nikome pisati izravno, pa DHCPDISCOVER šalje kao ' +
        '<em lang="en">broadcast</em> (emitiranje), s 0.0.0.0:68 na 255.255.255.255:67. Svaki poslužitelj koji radi i ima slobodnu adresu iz svojeg ' +
        'skupa (<em lang="en">pool</em>) odgovara ponudom, DHCPOFFER. Ponuda nije dodjela. Klijent uzima prvu i opet ' +
        'emitira DHCPREQUEST s oznakom izabranog poslužitelja, pa ostali iz iste poruke saznaju da nisu izabrani. ' +
        'Izabrani zapisuje vezu adrese i MAC adrese i potvrđuje je porukom DHCPACK.</p>' +
        '<p>Adresa je posuđena na zadano vrijeme, <em lang="en">lease</em> (zakup). Na T1, pola zakupa, klijent ' +
        'izravno pita poslužitelja koji mu je adresu dao; na T2, sedam osmina zakupa, pita bilo kojeg, emitiranjem. ' +
        'RFC 2131 traži da se T1 i T2 malo raspu nasumce, da se klijenti ne jave svi odjednom; ovdje su točni. ' +
        'Bez odgovora klijent ponavlja zahtjev nakon pola preostalog vremena, ali ne prije 60 s; ovdje to čini samo jednom. ' +
        'Na isteku prestaje koristiti adresu i kreće ispočetka.</p>' +
        '<p>Drugi poslužitelj nije sam po sebi rezerva: tuđi zakup ne zna, pa na ponovno vezanje šuti. Zakup može ' +
        'produljiti samo partner koji ima kopiju zapisa. Računalo ugašeno bez DHCPRELEASE ostavlja adresu zauzetom do ' +
        'isteka, a promjena opcije na poslužitelju do klijenta stiže tek s idućim DHCPACK-om. Zato trajanje zakupa ' +
        'nije proizvoljno.</p>' +
        '<p>Dok klijent nema adresu, OFFER i ACK idu svima ako je klijent postavio zastavicu BROADCAST; bez nje ' +
        'poslužitelj smije odgovoriti izravno na ponuđenu adresu i MAC adresu klijenta.</p>'
    },
    en: {
      stage: 'A client and DHCP servers on one segment: messages, lease records and the lease timeline',

      lease: 'Lease time (option 51)',
      lease600: '600 s',
      lease2h: '2 h',
      lease8d: '8 days',
      serverB: 'Second server',
      bNone: 'none',
      bPlain: 'plain B',
      bPartner: 'B, A\'s partner',
      failAt: 'Server A goes down',
      failNone: 'never',
      failT1: '10 s before T1',
      failT2: '10 s before T2',
      leave: 'The client leaves',
      leaveStay: 'stays',
      leaveOff: 'switched off',
      leaveRelease: 'with RELEASE',
      optChange: 'DNS change (option 6)',
      optOff: 'Only when no server goes down.',
      bcastFlag: 'BROADCAST flag',

      presetLease600: '600 s: renewal',
      presetLease600Hint: 'One server, a 600 s lease: renewal at T1 = 300 s.',
      presetTwo: 'Two offers',
      presetTwoHint: 'A and B offer, the client takes the first offer, B frees its address.',
      presetDies: 'A disappears',
      presetDiesHint: 'A goes down 10 s before T1: renewing, rebinding and expiry.',
      presetPartner: 'Partner B',
      presetPartnerHint: 'A disappears, and partner B, holding a copy of the records, confirms the lease at T2.',
      presetNoBackup: 'B is no backup',
      presetNoBackupHint: 'B does not know the lease: at expiry the client starts over and gets another address.',
      presetClass: 'Classroom, 2 h',
      presetClassHint: 'A 2 h lease, the computer switched off after 50 minutes without DHCPRELEASE.',
      presetWin: '8 days',
      presetWinHint: 'The default lease time in Windows Server. A DNS change reaches the client only at T1, 4 days later.',

      legUnicast: 'unicast',
      legBroadcast: 'broadcast to all',
      legLost: '✕ lost',
      legUpDown: '▲ up / ▼ down',
      legChanged: 'changed in this step',

      client: 'Client',
      serverA: 'Server A',
      serverBName: 'Server B',
      up: '▲ up',
      down: '▼ down',
      partnerRole: 'A\'s partner, on standby',
      noAddr: 'no address',
      addr: 'address',
      optRouter: 'gateway',
      optDns: 'DNS',
      leases: 'Lease records',
      empty: 'empty',
      offered: 'offered',
      until: 'until {t}',
      copy: 'copy',
      stINIT: 'initial state',
      stSELECTING: 'collecting offers',
      stREQUESTING: 'asking the chosen one',
      stBOUND: 'has an address',
      stRENEWING: 'renewing',
      stREBINDING: 'rebinding',
      stOFF: 'switched off',

      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      chartEmpty: 'No messages yet. Press →.',
      causeT1: 'T1',
      causeT2: 'T2',
      causeRetry: 'retry',
      causeExpiry: 'expiry',
      causeLeave: 'leaving',
      reStandby: 'standby, silent',
      reSilent: 'no record, silent',
      reFreed: 'frees {addr}',
      reFull: 'pool used up',
      reLate: 'late, ignored',
      reIgnored: 'ignored',
      reReleased: 'deletes record',
      noteDown: '▼ {srv} goes down',
      noteOff: 'computer switched off',
      noteOpt: 'option 6: DNS {dns}',
      noteExpire: 'record expired: {addr} free',

      msgTitle: 'Message {n}',
      msgNone: 'No messages yet.',
      msgNew: 'new',
      msgOld: 'from an earlier step',
      fFrom: 'from',
      fTo: 'to',
      fHow: 'how',
      fBcast: 'broadcast to all',
      fUni: 'unicast',
      fFlag: 'B flag',
      o50: '50 requested address',
      o51: '51 lease time',
      o54: '54 server identifier',
      o1: '1 mask',
      o3: '3 gateway',
      o6: '6 DNS',
      flagNote: 'Without the B flag the server may answer straight to yiaddr and chaddr.',
      flagNoteOff: 'The B flag is not set: the server answers straight to yiaddr and chaddr.',
      stLost: '✕ lost: nobody receives it',
      stFlight: 'on its way',

      barTitle: 'Client\'s lease',
      barServer: 'record on {srv}',
      now: 'now {t}',
      mStart: 'start',
      mExp: 'expiry',
      kBound: 'has an address (BOUND)',
      kRenew: 'renewing (RENEWING)',
      kRebind: 'rebinding (REBINDING)',
      kOff: 'switched off, record still held',

      tS: '{v} s',
      tMin: '{v} min',
      tH: '{v} h',
      tD: '{v} d',

      capStart: 'Client democli1 has no address yet. Press → and it sends its first message.',
      capDiscover: 'Broadcast: the client without an address sends DHCPDISCOVER from {src} to {dst}, to everyone on the segment, because it has no address to send to.',
      capOffer: '{who}: an offer is not yet an assignment, the address is not recorded as a lease.',
      capOfferOne: '{srv} offers {addr}',
      capStandby: ' {srv} is a standby partner and stays silent while A is up.',
      capFull: ' {srv} has no free addresses.',
      capNoOffer: 'No server offers an address: the client stays without one (INIT).',
      capChoose: 'The client takes the first offer, from {srv} ({addr}), and broadcasts again: DHCPREQUEST carries the chosen server\'s identifier (option 54) {ip}, so every server learns whom it chose.',
      capLate: ' The offer from {srv} ({addr}) arrived with it, and the client ignores it.',
      capAck: '{srv} records the binding {addr} ↔ {mac} until {exp} and sends DHCPACK.',
      capFreed: ' From the same request, {srv} sees it was not chosen and frees {addr}.',
      capCopy: ' Partner {p} gets a copy of the record.',
      capBound: 'DHCPACK has arrived: the client has the address {addr}. Lease {lease}: T1 = {t1}, T2 = {t2}, expiry {exp}.',
      capBoundAgain: 'The client has an address again, but a different one: {addr}, from server {srv}. Lease from {now} to {exp}.',
      capBoundSame: 'The client has the address {addr} again, from server {srv}, but as a new lease: from {now} to {exp}.',
      capRenewed: 'The lease is renewed from {now}: new T1 = {t1}, T2 = {t2}, expiry {exp}. The address {addr} stays the same.',
      capRebound: '{srv} has confirmed the lease: the client keeps {addr}, now with server {srv}. Lease from {now}, expiry {exp}.',
      capDns: ' Only now does the client get the new DNS server {dns}.',
      capRenew: 'T1 = {now}: the client enters RENEWING and unicasts DHCPREQUEST to server {srv}, and to nobody else.',
      capRenewLost: ' {srv} is down and the request is lost. Next try: {retry}.',
      capRenewAck: '{srv} has the record and extends it until {exp}: it answers with DHCPACK straight to {addr}.',
      capRetryRenew: 'No answer: the client ({now}) sends DHCPREQUEST to server {srv} again, after half the time left until T2.',
      capRetryRebind: 'No answer: the client ({now}) broadcasts DHCPREQUEST again, after half the lease that is left, but at least 60 s.',
      capRetryLost: ' Again nobody receives it.',
      capRebind: 'T2 = {now}: rebinding. The client broadcasts DHCPREQUEST: any server that knows this lease may answer.',
      capRebindLost: ' No server is up and the request is lost.',
      capSilent: '{srv} receives the request but has no record of this lease, so it stays silent. A plain second server is no backup.',
      capRebindAck: '{srv}, as the partner, holds a copy of the record: it extends the lease until {exp} and answers with DHCPACK.',
      capExpire: 'The lease has expired: the client stops using {addr} and starts again with DHCPDISCOVER.',
      capExpireLost: ' No server is up: there is no offer and the client stays without an address. Many systems then give themselves an address from 169.254.0.0/16.',
      capDown: 'Server {srv} goes down ({now}). The client does not know: until T1 it asks nothing.',
      capOpt: 'Option 6 (DNS) is changed to {dns} on the server. The client keeps using {old}: until its next DHCPACK it asks nothing.',
      capOff: 'The computer is switched off ({now}) without DHCPRELEASE. Server {srv} still holds {addr} as taken, until {until}: another {left}.',
      capOffNoLease: 'The computer is switched off ({now}).',
      capRelease: 'Before switching off ({now}), the client unicasts DHCPRELEASE to server {srv}: it no longer needs {addr}.',
      capReleased: '{srv} deletes the record: {addr} is free again at once.',
      capServerExpire: 'The record on server {srv} expires ({now}): {addr} is free only now, {left} after the computer left.',
      capNakSent: '{srv} has no record of this lease and answers DHCPNAK.',
      capNak: 'DHCPNAK has arrived: the client stops using {addr} at once and starts again.',
      capIgnored: 'The client ignores the message from {srv}.',
      list2: '{a} and {b}',

      explain: '<p>A client without an address cannot send to anyone directly, so it broadcasts DHCPDISCOVER from ' +
        '0.0.0.0:68 to 255.255.255.255:67. Every server that is up and has a free address in its pool answers with an ' +
        'offer, DHCPOFFER. An offer is not an assignment. The client takes the first one and broadcasts DHCPREQUEST ' +
        'naming the chosen server, so the others learn from the same message that they were not chosen. The chosen ' +
        'server records the binding of address and MAC address and confirms it with DHCPACK.</p>' +
        '<p>The address is borrowed for a set time, the lease. At T1, half the lease, the client asks the server that ' +
        'gave it the address, directly; at T2, seven eighths of the lease, it asks any server, by broadcast. RFC 2131 ' +
        'asks for a little random fuzz on T1 and T2, so that clients do not all call at once; here they are exact. ' +
        'Without an answer the client repeats the request after half the time left, but not sooner than 60 s; here it does so only once. At expiry it ' +
        'stops using the address and starts over.</p>' +
        '<p>A second server is not a backup by itself: it does not know another server\'s lease, so it stays silent ' +
        'when the client rebinds. Only a partner that holds a copy of the records can extend the lease. A computer ' +
        'switched off without DHCPRELEASE keeps its address taken until expiry, and an option changed on the server ' +
        'reaches the client only with its next DHCPACK. That is why the lease time is not arbitrary.</p>' +
        '<p>While the client has no address, OFFER and ACK go to everyone if the client set the BROADCAST flag; ' +
        'without it, the server may answer straight to the offered address and the client\'s MAC address.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
