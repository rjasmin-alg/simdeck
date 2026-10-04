/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-kerberos, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in italics on
   the Croatian page (the page's rich() turns it into <em lang="en">). None of the Kerberos terms is in kit/glossary.js
   yet, so the pairs are written out (NOTES.md, "Term pairs").
   Host names, account names, SPNs, message names, error codes and times are data: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Kerberos: poruke, karte i ključevi',

      // lanes
      lanePc: 'PC07',
      laneKdc: 'KDC',
      laneFs: 'FS01',
      rolePc: 'korisnica ana',
      roleKdc: 'na DC01',
      roleFs: 'datotečni poslužitelj',
      halfAs: 'AS',
      halfTgs: 'TGS',
      clock: 'sat',
      keys: 'ključevi',
      skTgs: 'sesija TGS',
      skFs: 'sesija FS01',
      fromPassword: 'iz lozinke',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteCheckOk: '{skew}: unutar 5 min',
      noteCheckBad: '{skew}: više od 5 min',
      noteFsOk: '{skew}: prolazi',
      noteNtlm: 'Windows tada pokušava NTLM',
      fAccess: 'pristup',

      // params
      skewMin: 'Sat PC07 prema KDC-u',
      byName: 'Mapa po imenu (\\\\fs01), ne po adresi',
      cached: 'Karta za uslugu već u memoriji',
      hoursLater: 'Sati nakon prijave u 08:00',
      hours: '{v} h',
      min: '{v} min',
      plusDays: '+{d} d',

      // presets
      presetOpen: 'Otvori mapu',
      presetOpenHint: 'Prijava i prvi pristup: AS, TGS, AP, 8 koraka',
      presetSkew7: 'Sat +7 min',
      presetSkew7Hint: 'KDC odbija vrijeme: KRB_AP_ERR_SKEW, 3 koraka',
      presetSkew4: 'Sat +4 min',
      presetSkew4Hint: 'Unutar 5 minuta: sve prolazi',
      presetCached: 'Karta u memoriji',
      presetCachedHint: 'Dva sata kasnije: samo AP, KDC se ne pita',
      presetByIp: 'Po IP adresi',
      presetByIpHint: '\\\\10.10.0.20: nema SPN-a, pa NTLM',

      // legend
      legendMsg: 'poruka',
      legendErr: 'pogreška',
      legendTicket: 'karta, lokot: čiji ključ',
      legendAuth: 'autentifikator (vrijeme)',
      legendCheck: 'provjera',
      legendKey: 'ključ',
      legendChanged: 'ovaj korak',

      // message card
      msgNone: 'Još nema poruka',
      msgTitle: 'Korak {n}',
      msgCheck: 'provjera',
      tgt: 'TGT',
      st: 'karta za uslugu',
      part: 'dio za primatelja',
      auth: 'autentifikator',
      holdsSkTgs: 'ključ sesije TGS',
      holdsSkFs: 'ključ sesije FS01',
      holdsPac: 'PAC: SID-ovi ane i njezinih grupa',
      holdsTime: 'vrijeme iz autentifikatora',
      user: 'korisnik',
      spn: 'SPN',
      validTo: 'vrijedi do {t}',
      renewTo: 'obnova do {t}',
      opens: 'otvara: {who}',
      whoKdc: 'KDC',
      whoPc: 'PC07',
      whoFs: 'FS01',
      whoPcKdc: 'PC07 i KDC',
      whoFsKdc: 'FS01 i KDC',
      whoPcFs: 'PC07 i FS01',
      fromCache: 'iz memorije, KDC se ne pita',
      checkSkewOk: '|{skew}| ≤ 5 min',
      checkSkewBad: '|{skew}| > 5 min',
      checkOpenTime: 'vrijeme otvoreno ključem {key}',
      checkOpenTicket: 'karta otvorena ključem {key}',
      checkOk: 'prolazi',
      checkBad: 'odbijeno',
      checkReplay: 'autentifikator nije već viđen',
      checkToken: 'token ane iz PAC-a',
      errCode: 'pogreška',

      // cache
      cacheTitle: 'Karte na PC07',
      cacheAt: 'vrijeme domene {t}',
      cacheNone: 'nema karata',
      cacheExpired: 'istekla',
      cacheNew: 'nova',

      // captions
      capStartAs: '{unc}: ana se prijavljuje na PC07 i otvara mapu. Karata još nema, pa prvo ide AS razmjena.',
      capStartTgs: '{unc}, {h} nakon prijave: TGT iz 08:00 još vrijedi, pa PC07 počinje od TGS-a.',
      capStartAp: '{unc}: karta za {spn} je u memoriji i vrijedi do {exp}, pa PC07 ide ravno na FS01.',
      capStartRenewTgt: '{unc}, {h} nakon prijave: TGT iz 08:00 istekao je u 18:00 (živi 10 h), pa PC07 aninim spremljenim ključem ponovno traži TGT.',
      capStartRenewAll: '{unc}, {h} nakon prijave: TGT i karta za uslugu iz 08:00 istekli su u 18:00 (TGT živi 10 h), pa PC07 aninim spremljenim ključem ponovno traži TGT.',
      capAsReq: '{n}. AS-REQ: PC07 šalje ime ana i vrijeme {time} zaključano ključem iz anine lozinke (*pre-authentication*, predautentifikacija). Lozinka ne ide mrežom.',
      capAsOk: '{n}. KDC otvara vrijeme aninim ključem iz svoje baze i uspoređuje ga sa svojim satom: razlika {skew}, unutar 5 minuta.',
      capAsBadAhead: '{n}. Sat na PC07 žuri {m} min pred KDC-om, više od dopuštenih 5: KRB_AP_ERR_SKEW.',
      capAsBadBehind: '{n}. Sat na PC07 kasni {m} min za KDC-om, više od dopuštenih 5: KRB_AP_ERR_SKEW.',
      capAsRep: '{n}. KDC vraća *TGT* (kartu za dobivanje karata) zaključan ključem krbtgt: ana ga nosi, ali ga ne može otvoriti. Ključ sesije TGS stiže i zasebno, pod aninim ključem. KDC ga ne pamti: nalazi ga u TGT-u.',
      capTgsReq: '{n}. TGS-REQ: TGT, *authenticator* (autentifikator: vrijeme {time} pod ključem sesije TGS) i ime usluge {spn}.',
      capTgsRep: '{n}. KDC otvara TGT ključem krbtgt, vrijeme je unutar 5 min (razlika {skew}), a {spn} pripada računu FS01$. Karta za uslugu zaključana je ključem FS01$ i vrijedi do {exp}.',
      capTgsCapped: ' Ne dulje od TGT-a, iako bi 600 min trajalo dalje.',
      capTgsSkew: '{n}. KDC: vrijeme u autentifikatoru odstupa {m} min od sata KDC-a, više od 5: KRB_AP_ERR_SKEW. Valjani TGT ne pomaže dok se satovi ne slože.',
      capTgsUnknown: '{n}. Nijedan račun nema *SPN* (ime principala usluge) {spn}: KDC_ERR_S_PRINCIPAL_UNKNOWN. SPN je registriran za ime poslužitelja, ne za adresu; Windows tada pokušava NTLM.',
      capApReq: '{n}. AP-REQ unutar *SMB session setup*: karta za uslugu i autentifikator (vrijeme {time}) pod ključem sesije FS01.',
      capApCached: ' Karta je iz memorije: KDC se ne pita.',
      capApOk: '{n}. FS01 otvara kartu svojim ključem FS01$, uzima iz nje ključ sesije, provjerava vrijeme (razlika {skew}, unutar 5 min) i da autentifikator nije već viđen, a iz PAC-a slaže anin token. DC se ništa ne pita.',
      capApBad: '{n}. FS01 otvara kartu, ali vrijeme u autentifikatoru odstupa {m} min od sata FS01, više od 5: KRB_AP_ERR_SKEW. Karta je valjana, sat nije.',
      capApRep: '{n}. FS01 odgovara (AP-REP pod ključem sesije) i ana vidi {unc}.',
      capErrAs: '{n}. KRB-ERROR {code}: prijava ne uspijeva, ana nema TGT ni pristup mapi.',
      capErrAsRenew: '{n}. KRB-ERROR {code}: KDC ne izdaje novi TGT, pa ana ne dobiva pristup mapi.',
      capErrFs: '{n}. KRB-ERROR {code}: FS01 ne otvara mapu.',

      explain:
        '<p><b>Tri razmjene.</b> AS: PC07 dokazuje da zna aninu lozinku tako da pošalje vrijeme zaključano ključem iz nje; ' +
        'KDC ima isti ključ i vraća <em lang="en">TGT</em> (kartu za dobivanje karata). TGS: s TGT-om PC07 traži kartu za ' +
        'uslugu <span translate="no">cifs/fs01.quillmoor.example</span>. AP: kartu nosi do FS01 unutar <em lang="en">SMB session setup</em>.</p>' +
        '<p><b>Tko što može otvoriti.</b> TGT je zaključan ključem <span translate="no">krbtgt</span>, koji ima samo KDC; ' +
        'karta za uslugu ključem računa <span translate="no">FS01$</span>. Ana nosi obje, a ne može otvoriti nijednu. FS01 svoju ' +
        'otvara sam i iz PAC-a u njoj slaže anin token: za pristup ne pita DC.</p>' +
        '<p><b>Vrijeme.</b> Svaki zahtjev nosi vrijeme klijenta. Primatelj ga odbija ako je od njegova sata dalje od 5 min ' +
        '(politika <i>Maximum tolerance for computer clock synchronization</i>); točno 5:00 prolazi. Stupac vremena lijevo pokazuje sat strane koja šalje ili provjerava. Kerberos ne treba točno ' +
        'vrijeme, nego satove koji se slažu: zato članovi domene uzimaju vrijeme od DC-a.</p>' +
        '<p><b>Trajanje.</b> TGT 10 h (obnova do 7 dana), karta za uslugu 600 min, ali nikad dulje od TGT-a. Dok karta vrijedi, ' +
        'PC07 je uzima iz memorije. U ovom modelu trajanje se mjeri vremenom domene; sat PC07 mijenja samo vrijeme koje PC07 piše.</p>' +
        '<p><b>Po adresi.</b> <span translate="no">\\\\10.10.0.20</span> traži SPN <span translate="no">cifs/10.10.0.20</span>, ' +
        'a njega nema nijedan račun. KDC odbija, a Windows prelazi na NTLM (zasebna simulacija). Windows može prijeći na NTLM i nakon drugih pogrešaka Kerberosa; ova stranica prikazuje samo Kerberos.</p>' +
        '<p><b>Izvan ove stranice:</b> delegiranje, povjerenja među domenama, vrste šifriranja, provjera PAC-a na DC-u.</p>'
    },

    en: {
      stage: 'Kerberos: messages, tickets and keys',

      lanePc: 'PC07',
      laneKdc: 'KDC',
      laneFs: 'FS01',
      rolePc: 'user ana',
      roleKdc: 'on DC01',
      roleFs: 'file server',
      halfAs: 'AS',
      halfTgs: 'TGS',
      clock: 'clock',
      keys: 'keys',
      skTgs: 'TGS session',
      skFs: 'FS01 session',
      fromPassword: 'from password',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteCheckOk: '{skew}: within 5 min',
      noteCheckBad: '{skew}: more than 5 min',
      noteFsOk: '{skew}: passes',
      noteNtlm: 'Windows then tries NTLM',
      fAccess: 'access',

      skewMin: 'PC07 clock vs KDC',
      byName: 'Share by name (\\\\fs01), not by address',
      cached: 'Service ticket already cached',
      hoursLater: 'Hours after the 08:00 logon',
      hours: '{v} h',
      min: '{v} min',
      plusDays: '+{d} d',

      presetOpen: 'Open the share',
      presetOpenHint: 'Logon and first access: AS, TGS, AP, 8 steps',
      presetSkew7: 'Clock +7 min',
      presetSkew7Hint: 'The KDC rejects the time: KRB_AP_ERR_SKEW, 3 steps',
      presetSkew4: 'Clock +4 min',
      presetSkew4Hint: 'Within 5 minutes: everything passes',
      presetCached: 'Cached ticket',
      presetCachedHint: 'Two hours later: AP only, the KDC is not asked',
      presetByIp: 'By IP address',
      presetByIpHint: '\\\\10.10.0.20: no SPN, so NTLM',

      legendMsg: 'message',
      legendErr: 'error',
      legendTicket: 'ticket, padlock: whose key',
      legendAuth: 'authenticator (time)',
      legendCheck: 'check',
      legendKey: 'key',
      legendChanged: 'this step',

      msgNone: 'No messages yet',
      msgTitle: 'Step {n}',
      msgCheck: 'check',
      tgt: 'TGT',
      st: 'service ticket',
      part: 'part for the receiver',
      auth: 'authenticator',
      holdsSkTgs: 'TGS session key',
      holdsSkFs: 'FS01 session key',
      holdsPac: 'PAC: SIDs of ana and her groups',
      holdsTime: 'the time from the authenticator',
      user: 'user',
      spn: 'SPN',
      validTo: 'valid until {t}',
      renewTo: 'renew until {t}',
      opens: 'opened by: {who}',
      whoKdc: 'KDC',
      whoPc: 'PC07',
      whoFs: 'FS01',
      whoPcKdc: 'PC07 and KDC',
      whoFsKdc: 'FS01 and KDC',
      whoPcFs: 'PC07 and FS01',
      fromCache: 'from the cache, the KDC is not asked',
      checkSkewOk: '|{skew}| ≤ 5 min',
      checkSkewBad: '|{skew}| > 5 min',
      checkOpenTime: 'time opened with {key}',
      checkOpenTicket: 'ticket opened with {key}',
      checkOk: 'passes',
      checkBad: 'rejected',
      checkReplay: 'authenticator not seen before',
      checkToken: 'ana\'s token from the PAC',
      errCode: 'error',

      cacheTitle: 'Tickets on PC07',
      cacheAt: 'domain time {t}',
      cacheNone: 'no tickets',
      cacheExpired: 'expired',
      cacheNew: 'new',

      capStartAs: '{unc}: ana logs on to PC07 and opens the share. There are no tickets yet, so the AS exchange comes first.',
      capStartTgs: '{unc}, {h} after logon: the TGT from 08:00 is still valid, so PC07 starts with the TGS.',
      capStartAp: '{unc}: the ticket for {spn} is cached and valid until {exp}, so PC07 goes straight to FS01.',
      capStartRenewTgt: '{unc}, {h} after logon: the TGT from 08:00 expired at 18:00 (it lives 10 h), so PC07 asks for a new TGT with ana\'s stored key.',
      capStartRenewAll: '{unc}, {h} after logon: the TGT and the service ticket from 08:00 expired at 18:00 (a TGT lives 10 h), so PC07 asks for a new TGT with ana\'s stored key.',
      capAsReq: '{n}. AS-REQ: PC07 sends the name ana and the time {time}, locked with the key from ana\'s password (pre-authentication). The password does not cross the network.',
      capAsOk: '{n}. The KDC opens the time with ana\'s key from its database and compares it with its own clock: {skew} apart, within 5 minutes.',
      capAsBadAhead: '{n}. PC07\'s clock is {m} minutes off the KDC, more than the 5 allowed: KRB_AP_ERR_SKEW.',
      capAsBadBehind: '{n}. PC07\'s clock is {m} minutes off the KDC, more than the 5 allowed: KRB_AP_ERR_SKEW.',
      capAsRep: '{n}. The KDC returns a TGT locked with the krbtgt key: ana carries it but cannot open it. The TGS session key also comes separately, under ana\'s key. The KDC does not keep it: it finds it in the TGT.',
      capTgsReq: '{n}. TGS-REQ: the TGT, an authenticator (the time {time} under the TGS session key) and the service name {spn}.',
      capTgsRep: '{n}. The KDC opens the TGT with the krbtgt key, the time is within 5 min (off by {skew}), and {spn} belongs to the account FS01$. The service ticket is locked with the FS01$ key and valid until {exp}.',
      capTgsCapped: ' No longer than the TGT, although 600 min would last longer.',
      capTgsSkew: '{n}. KDC: the authenticator is {m} minutes off its clock, more than 5: KRB_AP_ERR_SKEW. A valid TGT does not help until the clocks agree.',
      capTgsUnknown: '{n}. No account has the SPN (service principal name) {spn}: KDC_ERR_S_PRINCIPAL_UNKNOWN. The SPN is registered for the server\'s name, not its address; Windows then tries NTLM.',
      capApReq: '{n}. AP-REQ inside the SMB session setup: the service ticket and an authenticator (the time {time}) under the FS01 session key.',
      capApCached: ' The ticket is from the cache: the KDC is not asked.',
      capApOk: '{n}. FS01 opens the ticket with its own FS01$ key, takes the session key from it, checks the time (off by {skew}, within 5 min) and that the authenticator is not a replay, and builds ana\'s token from the PAC. It asks the DC nothing.',
      capApBad: '{n}. FS01 opens the ticket, but the authenticator is {m} minutes off its clock, more than 5: KRB_AP_ERR_SKEW. The ticket is valid; the clock is not.',
      capApRep: '{n}. FS01 answers (AP-REP under the session key) and ana sees {unc}.',
      capErrAs: '{n}. KRB-ERROR {code}: the logon fails; ana has no TGT and no access to the share.',
      capErrAsRenew: '{n}. KRB-ERROR {code}: the KDC issues no new TGT, so ana gets no access to the share.',
      capErrFs: '{n}. KRB-ERROR {code}: FS01 does not open the share.',

      explain:
        '<p><b>Three exchanges.</b> AS: PC07 proves it knows ana\'s password by sending the time locked with a key made from it; ' +
        'the KDC holds the same key and returns a TGT (ticket-granting ticket). TGS: with the TGT, PC07 asks for a ticket for ' +
        'the service <span translate="no">cifs/fs01.quillmoor.example</span>. AP: it carries that ticket to FS01 inside the SMB session setup.</p>' +
        '<p><b>Who can open what.</b> The TGT is locked with the <span translate="no">krbtgt</span> key, which only the KDC holds; ' +
        'the service ticket with the key of the account <span translate="no">FS01$</span>. ana carries both and can open neither. ' +
        'FS01 opens its own and builds ana\'s token from the PAC inside: it does not ask the DC for access.</p>' +
        '<p><b>Time.</b> Every request carries the client\'s time. The receiver rejects it when it is more than 5 min from its own clock ' +
        '(the policy <i>Maximum tolerance for computer clock synchronization</i>); exactly 5:00 passes. The time column on the left shows the clock of the party that sends or checks. Kerberos does not need the right ' +
        'time, it needs clocks that agree: that is why domain members take their time from a DC.</p>' +
        '<p><b>Lifetimes.</b> TGT 10 h (renewable up to 7 days), service ticket 600 min, but never longer than the TGT. While a ticket is ' +
        'valid, PC07 takes it from its cache. In this model lifetimes are measured on domain time; PC07\'s clock only changes the times PC07 writes.</p>' +
        '<p><b>By address.</b> <span translate="no">\\\\10.10.0.20</span> asks for the SPN <span translate="no">cifs/10.10.0.20</span>, ' +
        'which no account has. The KDC refuses and Windows falls back to NTLM (a separate simulation). Windows can fall back to NTLM after other Kerberos errors too; this page shows Kerberos alone.</p>' +
        '<p><b>Not on this page:</b> delegation, trusts between domains, encryption types, PAC validation at the DC.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
