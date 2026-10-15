/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-domain-join, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). [[term]] is a kit/glossary.js term.
   Terms missing from the glossary are written out (NOTES.md, "Term pairs").
   Host names, addresses, DNs, accounts, password labels, message names and return codes are data: the page writes
   them with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Učlanjenje u domenu: stanje i poruke',

      // strip
      roleWorkgroup: 'radna grupa',
      roleMember: 'član domene',
      restartTag: 'treba ponovno pokretanje',
      dnsLine: 'DNS poslužitelj',
      dnsOnDc: 'na DC01',
      dnsPublic: 'javni razrješivač',
      lsa: 'tajna LSA',
      cur: 'trenutna',
      prev: 'prethodna',
      snapLine: 'snimka s dana {d}:',
      chanTitle: 'sigurni kanal',
      chanNone: 'nema',
      chanOk: 'radi',
      chanBroken: 'prekinut',
      matchCur: 'odgovara trenutnoj',
      matchPrev: 'odgovara prethodnoj',
      matchNone: 'ne odgovara',
      objTitle: 'račun računala u AD-u',
      objNone: 'još nema objekta',
      objPwd: 'lozinka računala',
      userTitle: 'tko učlanjuje',
      userOrdinary: 'običan korisnik',
      joinedCount: 'učlanjenih računala',
      adminTitle: 'administrator',
      adminLine: 'popravlja kanal',
      dayN: 'dan {d}',
      tlTitle: 'dani',
      tlSnap: 'snimka',
      tlRevert: 'vraćanje',
      tlToday: 'sada',

      // lanes
      laneClient: 'klijent',
      laneDc: 'kontroler domene',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      pongLabel: 'odgovor',
      reCreated: 'stvoren',
      reQuota: 'kvota',
      reSet: 'spremljena',
      noteNoDc: 'nema DC-a: neuspjeh',
      noteRestart: 'ponovno pokretanje',
      noteSnapshot: 'snimka',
      noteRevert: 'vraćena snimka',
      noteTrust: 'prijava odbijena',
      logonField: 'prijava',

      // params
      pScenario: 'Scenarij',
      scJoin: 'učlanjenje',
      scRevert: 'snimka i vraćanje',
      pDns: 'DNS poslužitelj klijenta',
      optDc01: 'DNS na DC01',
      optPublic: 'javni razrješivač',
      pJoins: 'Računala koja je ana već učlanila',
      pAge: 'Snimka se vraća na dan',
      offJoin: 'Samo za učlanjenje',
      offRevert: 'Samo za snimku i vraćanje',

      // presets
      presetJoin: 'Učlanjenje',
      presetJoinHint: 'SRV, LDAP ping, račun računala, lozinka p0, sigurni kanal',
      presetRevert65: 'Vraćanje nakon 65 dana',
      presetRevert65Hint: 'Dvije promjene lozinke: kanal prekinut, pa popravak',
      presetRevert35: 'Vraćanje nakon 35 dana',
      presetRevert35Hint: 'Jedna promjena: p0 je prethodna, kanal radi',
      presetWrongDns: 'Pogrešan DNS',
      presetWrongDnsHint: 'Javni razrješivač ne zna SRV zapis domene',
      presetQuota: 'Kvota',
      presetQuotaHint: 'Jedanaesto računalo običnog korisnika: odbijeno',

      // legend
      legDns: 'DNS',
      legLdap: 'LDAP i SAMR',
      legNetlogon: 'Netlogon (sigurni kanal)',
      legPw: 'lozinka računala',
      legBroken: 'kanal prekinut',
      legChanged: 'ovaj korak',

      // captions
      capStart_join: '{c} je u radnoj grupi, a DNS poslužitelj mu je {dns}. Korisnički račun {u} učlanjuje ga u domenu {d}: *domain join* (učlanjenje u domenu).',
      capStartPublicTail: ' To je javni razrješivač, ne DNS domene.',
      capStartQuotaTail: [' Račun {u} dosad je učlanio {n} računalo.', ' Račun {u} dosad je učlanio {n} računala.', ' Račun {u} dosad je učlanio {n} računala.'],
      capStart_revert: '{c} je član domene od dana 0: *machine password* (lozinka računala) {p} s obje strane, *secure channel* (sigurni kanal) radi. Na dan {a} njegov se virtualni stroj vraća na *snapshot* (snimka) s dana 0.',
      capSrvQuery: '{n}. {c} pita svoj DNS poslužitelj {dns} za SRV zapis {q}: koje je računalo DC domene?',
      capSrvAnswer: '{n}. DNS na DC01 odgovara: {target}, priključak 389 ({ip}). {c} sad zna kojem se DC-u obratiti.',
      capNx: '{n}. NXDOMAIN: javni razrješivač nema zone domene {d}, pa nema ni SRV zapisa.',
      capFail: '{n}. Učlanjenje ne uspijeva: kontroler domene nije pronađen, ništa nije stvoreno. Računalo koje se učlanjuje mora koristiti DNS domene.',
      capPing: '{n}. LDAP ping (CLDAP, UDP 389) prema DC01: radi li i je li DC domene {d}?',
      capPong: '{n}. DC01 odgovara svojim imenom i domenom {d} ({nb}).',
      capCreate: '{n}. {u} se prijavljuje i stvara *computer account* (račun računala) {dn}. Brojač za {u}: {k} od {max}.',
      capQuota: '{n}. Odbijeno: {u} je običan korisnički račun i već je stvorio {max} računa računala, a {attr} (zadano {max}) više ne dopušta. Ništa nije stvoreno; administrator može unaprijed stvoriti objekt ili dati pravo stvaranja.',
      capSetPwd: '{n}. {c} postavlja na objekt slučajnu lozinku {p}, *machine password* (lozinka računala), i sprema je kao tajnu LSA. Učlanjenje je gotovo: treba ponovno pokretanje.',
      capRestart: '{n}. {c} se ponovno pokreće, sada kao član domene {d}.',
      capChannelJoin: '{n}. Netlogon gradi *secure channel* (sigurni kanal) s DC01, prijavljuje se lozinkom {p}: odgovara trenutnoj na objektu. Preko kanala sad rade prijava u domenu i GPO-i.',
      capSnapshot: '{n}. Dan 0: snimka virtualnog stroja. U njoj je i tajna LSA: trenutna {p}, prethodne nema.',
      capChange: '{n}. Dan {day}: lozinka je stara 30 dana, pa je {c} sam mijenja preko sigurnog kanala: {from} → {to}. DC sprema {to} kao trenutnu, {from} kao prethodnu.',
      capRevert: '{n}. Dan {day}: snimka je vraćena. {c} je opet na {p}, kao na dan 0, a vraćanje ne dira AD: DC zna {known}.',
      capChannelCur: '{n}. Netlogon se prijavljuje lozinkom {p}: to je trenutna lozinka na DC-u. Sigurni kanal radi.',
      capChannelPrev: '{n}. Netlogon se prijavljuje lozinkom {p}: to je prethodna lozinka na DC-u, koju DC još prihvaća. Sigurni kanal radi.',
      capChannelBroken: '{n}. Vraćanje snimke vratilo je {c} na lozinku {p}, a DC zna samo {cur} i {prev}: *secure channel* (sigurni kanal) ne prolazi.',
      capChannelRepaired: '{n}. Netlogon se prijavljuje lozinkom {p}: odgovara trenutnoj. Sigurni kanal opet radi.',
      capLogonOk: '{n}. {u} se prijavljuje u domenu preko sigurnog kanala: uspijeva.',
      capLogonRefused: '{n}. {u} se pokušava prijaviti i dobiva *The trust relationship between this workstation and the primary domain failed* (odnos povjerenja s domenom nije uspio). Bez sigurnog kanala nema prijave u domenu.',
      capChangeAfter: '{n}. Po svom zapisu {c} ima lozinku staru {age} dana (vraćenu s dana 0), pa je odmah mijenja: {from} → {to}. Obje su strane opet usklađene.',
      capReset: '{n}. Administrator ({adm}) na {c} resetira lozinku računala svojim vjerodajnicama, ne preko kanala: nova lozinka {p} s obje strane. Objekt, SID i članstva u grupama ostaju; brisanje računa i ponovno učlanjenje dali bi novi SID.',
      capEndQuiet: ' Od snimke nije bilo promjene lozinke, pa se ništa ne vidi.',

      explain:
        '<p><b>Pronaći DC.</b> Pri učlanjenju u domenu (<i lang="en">domain join</i>) računalo pita svoj DNS poslužitelj za SRV zapis ' +
        '<code>_ldap._tcp.dc._msdcs.&lt;domena&gt;</code> i dobiva imena kontrolera domene; zatim jednom od njih šalje ' +
        'LDAP ping (CLDAP, UDP 389). Javni razrješivač te zapise nema, pa računalo u domeni mora koristiti DNS domene.</p>' +
        '<p><b>Račun računala</b> (<i lang="en">computer account</i>). U AD-u nastaje objekt računala (zadano u <code>CN=Computers</code>), ili se koristi ' +
        'objekt koji je administrator unaprijed stvorio. Običan korisnik smije stvoriti najviše 10 takvih objekata ' +
        '(<code>ms-DS-MachineAccountQuota</code>).</p>' +
        '<p><b>Lozinka računala i sigurni kanal.</b> Klijent postavlja slučajnu lozinku, <i lang="en">machine password</i> ' +
        '(lozinka računala), na svoj objekt i čuva je kao tajnu LSA. Nakon ponovnog pokretanja Netlogon njome gradi ' +
        '<i lang="en">secure channel</i> (sigurni kanal) s DC-om; prijava u domenu i GPO-i ' +
        'idu preko njega. Klijent sam mijenja lozinku svakih 30 dana; obje strane čuvaju trenutnu i prethodnu, a ' +
        'kanal prolazi dok klijentova lozinka odgovara jednoj od njih na DC-u.</p>' +
        '<p><b>Snimka</b> (<i lang="en">snapshot</i>). Vraćanje snimke [[virtual machine]] vraća i staru tajnu LSA, a AD ostaje gdje je bio. Nakon ' +
        'jedne promjene klijent još ima prethodnu lozinku; nakon dvije DC je više ne zna i kanal je prekinut. ' +
        'Učlanjenje dakle nije trajno: to je par lozinki koje se moraju slagati.</p>' +
        '<p><b>Popravak.</b> Administrator resetira lozinku računala s obje strane (ili računalo ponovno učlani u isti ' +
        'objekt). Brisanje računa računala nije popravak: novi objekt ima novi SID, a stara članstva u grupama i ' +
        'dozvole nestaju.</p>' +
        '<p><b>Izvan ove stranice:</b> prijava korisnika u pojedinostima, vraćanje snimke DC-a, učlanjenje bez mreže.</p>'
    },

    en: {
      stage: 'Domain join: state and messages',

      roleWorkgroup: 'workgroup',
      roleMember: 'domain member',
      restartTag: 'restart required',
      dnsLine: 'DNS server',
      dnsOnDc: 'on DC01',
      dnsPublic: 'public resolver',
      lsa: 'LSA secret',
      cur: 'current',
      prev: 'previous',
      snapLine: 'snapshot from day {d}:',
      chanTitle: 'secure channel',
      chanNone: 'none',
      chanOk: 'works',
      chanBroken: 'broken',
      matchCur: 'matches current',
      matchPrev: 'matches previous',
      matchNone: 'no match',
      objTitle: 'computer account in AD',
      objNone: 'no object yet',
      objPwd: 'machine password',
      userTitle: 'joining user',
      userOrdinary: 'ordinary user',
      joinedCount: 'computers joined',
      adminTitle: 'administrator',
      adminLine: 'repairs the channel',
      dayN: 'day {d}',
      tlTitle: 'days',
      tlSnap: 'snapshot',
      tlRevert: 'revert',
      tlToday: 'now',

      laneClient: 'client',
      laneDc: 'domain controller',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      pongLabel: 'reply',
      reCreated: 'created',
      reQuota: 'quota',
      reSet: 'stored',
      noteNoDc: 'no DC: join fails',
      noteRestart: 'restart',
      noteSnapshot: 'snapshot',
      noteRevert: 'snapshot reverted',
      noteTrust: 'logon refused',
      logonField: 'logon',

      pScenario: 'Scenario',
      scJoin: 'join',
      scRevert: 'snapshot and revert',
      pDns: "Client's DNS server",
      optDc01: 'DNS on DC01',
      optPublic: 'public resolver',
      pJoins: 'Computers ana has already joined',
      pAge: 'Revert the snapshot on day',
      offJoin: 'Join only',
      offRevert: 'Snapshot and revert only',

      presetJoin: 'Join',
      presetJoinHint: 'SRV, LDAP ping, computer account, password p0, secure channel',
      presetRevert65: 'Revert after 65 days',
      presetRevert65Hint: 'Two password changes: channel broken, then the repair',
      presetRevert35: 'Revert after 35 days',
      presetRevert35Hint: 'One change: p0 is the previous one, the channel works',
      presetWrongDns: 'Wrong DNS',
      presetWrongDnsHint: "A public resolver does not know the domain's SRV record",
      presetQuota: 'Quota',
      presetQuotaHint: "An ordinary user's eleventh computer: refused",

      legDns: 'DNS',
      legLdap: 'LDAP and SAMR',
      legNetlogon: 'Netlogon (secure channel)',
      legPw: 'machine password',
      legBroken: 'channel broken',
      legChanged: 'this step',

      capStart_join: '{c} is in a workgroup and its DNS server is {dns}. The user account {u} joins it to the domain {d}.',
      capStartPublicTail: " That is a public resolver, not the domain's DNS.",
      capStartQuotaTail: [' {u} has joined {n} computer so far.', ' {u} has joined {n} computers so far.'],
      capStart_revert: '{c} has been a domain member since day 0: the machine password {p} on both sides, the secure channel works. On day {a} its virtual machine is reverted to a snapshot from day 0.',
      capSrvQuery: '{n}. {c} asks its DNS server {dns} for the SRV record {q}: which host is a DC of the domain?',
      capSrvAnswer: '{n}. The DNS on DC01 answers: {target}, port 389 ({ip}). {c} now knows which DC to talk to.',
      capNx: '{n}. NXDOMAIN: the public resolver does not hold the zones of {d}, so there is no SRV record.',
      capFail: "{n}. The join fails: no domain controller could be contacted, nothing was created. A joining computer must use the domain's DNS.",
      capPing: '{n}. An LDAP ping (CLDAP, UDP 389) to DC01: is it up, and is it a DC of {d}?',
      capPong: '{n}. DC01 answers with its name and the domain {d} ({nb}).',
      capCreate: '{n}. {u} authenticates and creates the computer account {dn}. The count for {u}: {k} of {max}.',
      capQuota: '{n}. Refused: {u} is an ordinary user and has already created {max} computer accounts, and {attr} (default {max}) allows no more. Nothing was created; an admin can pre-create the object or grant the right to create it.',
      capSetPwd: '{n}. {c} sets a random machine password {p} on the object and stores it as an LSA secret. The join is done: restart required.',
      capRestart: '{n}. {c} restarts, now as a member of {d}.',
      capChannelJoin: '{n}. Netlogon builds the secure channel with DC01, authenticating with {p}: it matches the current one on the object. Domain logon and GPOs now work over the channel.',
      capSnapshot: '{n}. Day 0: a snapshot of the virtual machine. It holds the LSA secret too: current {p}, no previous.',
      capChange: '{n}. Day {day}: the password is 30 days old, so {c} changes it itself, over the secure channel: {from} → {to}. The DC keeps {to} as current, {from} as previous.',
      capRevert: '{n}. Day {day}: the snapshot is reverted. {c} is back on {p}, as on day 0, and the revert does not touch AD: the DC knows {known}.',
      capChannelCur: "{n}. Netlogon authenticates with {p}: that is the DC's current password. The secure channel works.",
      capChannelPrev: "{n}. Netlogon authenticates with {p}: that is the DC's previous password, which it still accepts. The secure channel works.",
      capChannelBroken: '{n}. Reverting the snapshot put {c} back on password {p}; the DC knows only {cur} and {prev}: the secure channel fails.',
      capChannelRepaired: '{n}. Netlogon authenticates with {p}: it matches the current one. The secure channel works again.',
      capLogonOk: '{n}. {u} logs on to the domain over the secure channel: it works.',
      capLogonRefused: '{n}. {u} tries to log on and gets "The trust relationship between this workstation and the primary domain failed". No domain logon without the secure channel.',
      capChangeAfter: '{n}. By its own record {c} has a password {age} days old (restored from day 0), so it changes it at once: {from} → {to}. Both sides are in step again.',
      capReset: '{n}. An administrator ({adm}) resets the machine password on {c} with their own credentials, not over the channel: a new {p} on both sides. The object, its SID and its group memberships stay; deleting the account and joining again would give a new SID.',
      capEndQuiet: ' No password change since the snapshot, so nothing shows.',

      explain:
        '<p><b>Finding a DC.</b> A joining computer asks its DNS server for the SRV record ' +
        '<code>_ldap._tcp.dc._msdcs.&lt;domain&gt;</code> and gets the names of the domain controllers; then it sends ' +
        "one of them an LDAP ping (CLDAP, UDP 389). A public resolver has no such records, so a domain member must use the domain's DNS.</p>" +
        '<p><b>The computer account.</b> A computer object is created in AD (by default in <code>CN=Computers</code>), or ' +
        'an object an administrator pre-created is used. An ordinary user may create at most 10 of them ' +
        '(<code>ms-DS-MachineAccountQuota</code>).</p>' +
        '<p><b>Machine password and secure channel.</b> The client sets a random password on its object and keeps it as ' +
        'an LSA secret. After the restart Netlogon uses it to build a secure channel with a DC; domain logon and GPOs go ' +
        'over it. The client changes the password itself every 30 days; both sides keep the current and the previous ' +
        "one, and the channel works while the client's password matches one of them on the DC.</p>" +
        '<p><b>Snapshots.</b> Reverting a [[virtual machine]] snapshot brings back the old LSA secret too, while AD stays ' +
        'where it was. After one change the client still has the previous password; after two the DC no longer knows ' +
        'it and the channel is broken. So a join is not a one-off: it is a pair of passwords that must agree.</p>' +
        '<p><b>The repair.</b> An administrator resets the machine password on both sides (or joins the computer to the ' +
        'same object again). Deleting the computer account is not a repair: a new object has a new SID, and the old ' +
        'group memberships and permissions are gone.</p>' +
        '<p><b>Not on this page:</b> user logon in detail, reverting a DC snapshot, offline domain join.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
