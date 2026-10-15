/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dns-dynamic-update, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* is an English term in
   italics on the Croatian page (the page's rich() turns it into <em lang="en">). [[term]] is a kit/glossary.js term.
   Terms missing from the glossary are written out (NOTES.md, "Term pairs").
   Host names, record data, accounts, SIDs, message names, return codes and times are data: the page writes them
   with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dinamičko ažuriranje: zona i poruke',

      // zone column
      zoneAd: 'integrirana u AD',
      setting: 'Dinamička ažuriranja:',
      optNone: 'nijedna',
      optBoth: 'nesigurna i sigurna',
      optSecure: 'samo sigurna',
      colName: 'ime',
      colType: 'vrsta',
      colData: 'adresa',
      colOwner: 'vlasnik (u ACL-u)',
      colTime: 'zapisano',
      colMark: 'korak',
      dayAt: 'dan {d}, {t}',
      ownerNone: 'nitko',
      ownerUnknown: 'nema računa',
      markAdded: 'novi',
      markUpdated: 'promijenjen',
      markRemoved: 'obrisan',
      markRefused: 'odbijeno',
      markKept: 'ostaje',
      markTarget: 'u poruci',
      accTitle: 'Računi računala u AD-u',
      accDeleted: 'obrisan',
      accReset: 'resetiran',
      accRenamed: 'bio {old}',

      // lanes
      roleClient: 'član domene',
      roleWorkgroup: 'izvan domene, bez računa',
      roleDc: 'DNS i AD',
      account: 'račun',

      // chart
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteGaveUp: 'nema računa: odustaje',
      noteAdmin: 'admin briše {name}',

      // message card
      msgNone: 'Još nema poruka',
      msgTitle: 'Korak {n}',
      kSoa: 'upit SOA',
      kUnsigned: 'nepotpisano',
      kSigned: 'potpisano',
      kTkey: 'sigurnosni kontekst',
      kAdmin: 'administrator',
      kAnswer: 'provjera na DC1',
      asks: 'pita',
      primary: 'primarni',
      opAdd: 'dodaj',
      opDel: 'obriši',
      signature: 'potpis',
      sigNone: 'nema',
      tkeyLine: 'Kerberos unutar GSS-TSIG; DC1 sad zna tko šalje',
      chkZoneOk: 'postavka zone: prima ovo ažuriranje',
      chkZoneUnsigned: 'postavka zone: samo potpisana ažuriranja',
      chkZoneNone: 'postavka zone: nikakva ažuriranja',
      chkNoAcl: '{name}: ACL se ne gleda',
      chkNew: '{name}: novo ime, vlasnik postaje pošiljatelj',
      chkOpen: '{name}: nema vlasnika, otvoren',
      chkOwn: '{name}: vlasnik {owner} = pošiljatelj',
      chkNotOwn: '{name}: vlasnik {owner} ≠ pošiljatelj {sender}',
      chkSkipped: 'vlasnik se ne provjerava',
      adminLine: 'zastarjeli zapis {name} ({data}) obrisan ručno',
      adminNext: 'PC1 se zatim ponovno registrira',
      accepted: 'prihvaćeno',
      refused: 'odbijeno',

      // params
      pUpdates: 'Dinamička ažuriranja u zoni',
      pAction: 'Što se događa',
      actJoin: 'PC1 se pridružuje domeni',
      actMove: 'PC1 dobiva novu adresu',
      actRename: 'PC2 preimenovan u PC2-NEW',
      actRebuildNew: 'PC1 reinstaliran, novi račun',
      actRebuildReset: 'PC1 reinstaliran, resetiran račun',
      actRogue: 'prijenosno računalo izvan domene',
      pAdmin: 'Zatim admin briše zastarjeli zapis',
      pAdminOff: 'Samo kad je potpisano ažuriranje odbijeno zbog vlasnika',

      // presets
      presetJoin: 'Pridruživanje',
      presetJoinHint: 'PC1 sam upisuje svoj zapis: nepotpisano odbijeno, potpisano prihvaćeno',
      presetMove: 'Nova adresa',
      presetMoveHint: 'Vlasnik mijenja svoj zapis: 10.0.0.51 → 10.0.1.23',
      presetRebuildNew: 'Reinstalacija, novi SID',
      presetRebuildNewHint: 'Isto ime, drugi račun: REFUSED, ime vodi na staru adresu',
      presetRebuildReset: 'Reinstalacija, resetiran račun',
      presetRebuildResetHint: 'Isti SID: ažuriranje prolazi',
      presetRename: 'Preimenovanje',
      presetRenameHint: 'PC2 → PC2-NEW: novo ime, staro obrisano',
      presetHijack: 'Nesigurna zona',
      presetHijackHint: 'Računalo izvan domene preuzima ime fs1',

      // legend
      legUnsigned: 'nepotpisano',
      legSigned: 'potpisano',
      legAnswer: 'odgovor',
      legOwner: 'vlasnik',
      legSid: 'SID bez računa',
      legOk: 'prihvaćeno',
      legNo: 'odbijeno',
      legChanged: 'ovaj korak',

      // captions
      capStart_join: '{c} se pridružuje domeni i od DHCP-a dobiva {ip}. Pri pokretanju sam pokušava upisati svoj zapis u zonu {zone}: administrator ga ne dodaje ručno.',
      capStart_move: '{c} je premješten u drugu podmrežu i dobiva {ip}. Promjena adrese pokreće registraciju; zapis {name} još vodi na {old}.',
      capStart_rename: 'PC2 je preimenovan u {c}. Preimenovan je i račun računala, a SID je ostao isti. Nakon ponovnog pokretanja {c} registrira novo ime.',
      capStart_rebuildNew: 'PC1 je reinstaliran: stari račun je obrisan, a novi PC1 pridružen s novim SID-om {sid} i adresom {ip}. Zapis {name} još vodi na {old}.',
      capStart_rebuildReset: 'PC1 je reinstaliran, ali je stari račun resetiran, ne obrisan: SID {sid} ostaje. Nova adresa {ip}; zapis {name} još vodi na {old}.',
      capStart_rogue: 'Prijenosno računalo izvan domene ({ip}, bez računa računala) šalje ažuriranje za {name}, ime datotečnog poslužitelja.',
      capSoa: '{n}. {c} pita za SOA imena {q}. Odgovara DC1: u zoni integriranoj u AD svaki DC koji ima zonu navodi sebe kao primarni poslužitelj, kojemu se šalju ažuriranja.',
      capUnsigned: '{n}. {c} prvo šalje *dynamic update* (dinamičko ažuriranje) bez potpisa: {upd}.',
      capUnsignedAgain: '{n}. {c} ponovno prvo šalje nepotpisano ažuriranje: {upd}.',
      capOkUnsigned: '{n}. NOERROR: zona prima i nepotpisana ažuriranja, pa DC1 upisuje promjenu, a ne pita tko ju je poslao.',
      capHijack: '{n}. NOERROR: zona prima i nepotpisana ažuriranja, pa {name} sada vodi na {ip}, prijenosno računalo. Tko otvori datotečni poslužitelj, stiže na njega.',
      capRefusedUnsigned: '{n}. Zona prihvaća samo *secure dynamic update* (sigurno dinamičko ažuriranje): nepotpisano ažuriranje odbijeno je, klijent se prijavljuje računom računala i šalje potpisano.',
      capGaveUp: '{n}. REFUSED: zona prima samo potpisana ažuriranja, a prijenosno računalo nema račun računala kojim bi se prijavilo. Odustaje; {name} i dalje vodi na {data}.',
      capRefusedNone1: '{n}. REFUSED: dinamička ažuriranja u zoni su isključena. {c} to ne zna, pa pokušava i s potpisom.',
      capGaveUpNone: '{n}. REFUSED: dinamička ažuriranja u zoni su isključena, a prijenosno računalo nema račun za potpis. Odustaje; {name} i dalje vodi na {data}.',
      capTkey: '{n}. TKEY: {c} se prijavljuje kao {acc}, svojim računom računala (*computer account*), Kerberosom unutar GSS-TSIG. DC1 i {c} sad dijele sigurnosni kontekst.',
      capSigned: '{n}. Isto ažuriranje, sad potpisano: DC1 zna da ga šalje {acc} sa SID-om {sid}.',
      capOkNew: '{n}. NOERROR: imena {name} nije bilo, a novo ime smije stvoriti svako prijavljeno računalo. Vlasnik zapisa (u ACL-u) postaje {acc} ({sid}).',
      capOkOwner: '{n}. NOERROR: vlasnik zapisa {name} je SID {sid}, isti kao pošiljatelj. {name} sad vodi na {ip}.',
      capResetTail: ' Resetiran račun zadržao je SID, pa je to i dalje vlasnik.',
      capOkRename: '{n}. NOERROR: {new} je novo ime, vlasnik {acc}; {old} pripada istom SID-u, pa ga DC1 briše. Da ažuriranje nije stiglo do DC1, {old} bi ostao do čišćenja zastarjelih zapisa.',
      capRefusedOwner: '{n}. Zapis {name} pripada starom računu CORP\\PC1$ ({owner}). Novi PC1 ima drugi SID ({sid}), pa ga ne smije mijenjati — ime i dalje vodi na {old}.',
      capFixHint: ' Uključi „Zatim admin briše zastarjeli zapis”.',
      capStartNoneTail: ' No dinamička ažuriranja u ovoj zoni su isključena.',
      capKeepsOwnerTail: ' Zapis zadržava starog vlasnika ({sid}): uz „samo sigurna” ovaj bi klijent opet bio odbijen.',
      capRefusedNone2: '{n}. REFUSED i s potpisom: kad su dinamička ažuriranja isključena, ni vlasnik ne mijenja zapis. Zapise tada upisuje samo administrator.',
      capAdmin: '{n}. Kasnije, u {time}: administrator briše zastarjeli zapis {name} ({old}). PC1 se zatim ponovno registrira (ponovno pokretanje ili ručna registracija).',

      explain:
        '<p><b>Klijenti upisuju sami sebe.</b> Računalo s Windowsima samo upisuje svoj zapis A u zonu: pri pokretanju, kad ' +
        'se promijeni adresa ili obnovi najam, na ručni zahtjev i periodički. Administrator ne ' +
        'dodaje svako računalo ručno.</p>' +
        '<p><b>Redoslijed.</b> Klijent pita za SOA svojeg imena i šalje ažuriranje poslužitelju koji se javi (u zoni ' +
        'integriranoj u AD to može biti svaki DC). Prvo šalje nepotpisano; ako je odbijeno (REFUSED), dogovara sigurnosni ' +
        'kontekst (TKEY, GSS-TSIG) računom računala i šalje isto ažuriranje potpisano.</p>' +
        '<p><b>Vlasnik zapisa.</b> Zapis u zoni integriranoj u AD ima [[access control list]]. Tko stvori novo ime, postaje ' +
        'njegov vlasnik; postojeći zapis smije mijenjati samo vlasnik. Vlasnik je <i>SID</i> računa, ne ime: ' +
        'reinstalirano računalo s novim računom ima drugi SID, pa ne smije mijenjati svoj stari zapis, i ime vodi na ' +
        'staru adresu. Resetiran račun zadržava SID. Popravak: administrator obriše zastarjeli zapis, a sljedeća ' +
        'registracija stvori novi s novim vlasnikom. („Vlasnik” ovdje znači vlasnik u ACL-u, ne ime vlasnika zapisa.)</p>' +
        '<p><b>Postavka zone</b> (<i lang="en">Dynamic updates</i>): <i lang="en">None</i> odbija sve; ' +
        '<i lang="en">Nonsecure and secure</i> prima i nepotpisana ažuriranja, od bilo koga, za bilo koje ime, pa svako ' +
        'računalo u mreži može preuzeti tuđe ime; <i lang="en">Secure only</i> prima samo potpisana i provjerava vlasnika. ' +
        '<i lang="en">Secure only</i> postoji samo za zone integrirane u AD.</p>' +
        '<p><b>Izvan ove stranice:</b> DHCP koji upisuje zapise umjesto klijenata, čišćenje zastarjelih zapisa, zapisi PTR, ' +
        'TSIG s dijeljenim ključem, Kerberos iznutra.</p>'
    },

    en: {
      stage: 'Dynamic update: the zone and the messages',

      zoneAd: 'AD-integrated',
      setting: 'Dynamic updates:',
      optNone: 'None',
      optBoth: 'Nonsecure and secure',
      optSecure: 'Secure only',
      colName: 'name',
      colType: 'type',
      colData: 'address',
      colOwner: 'owner (ACL)',
      colTime: 'written',
      colMark: 'step',
      dayAt: 'day {d}, {t}',
      ownerNone: 'nobody',
      ownerUnknown: 'no account',
      markAdded: 'new',
      markUpdated: 'changed',
      markRemoved: 'deleted',
      markRefused: 'refused',
      markKept: 'stays',
      markTarget: 'in the message',
      accTitle: 'Computer accounts in AD',
      accDeleted: 'deleted',
      accReset: 'reset',
      accRenamed: 'was {old}',

      roleClient: 'domain member',
      roleWorkgroup: 'outside the domain, no account',
      roleDc: 'DNS and AD',
      account: 'account',

      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteGaveUp: 'no account: gives up',
      noteAdmin: 'admin deletes {name}',

      msgNone: 'No messages yet',
      msgTitle: 'Step {n}',
      kSoa: 'SOA query',
      kUnsigned: 'unsigned',
      kSigned: 'signed',
      kTkey: 'security context',
      kAdmin: 'administrator',
      kAnswer: 'check at DC1',
      asks: 'asks',
      primary: 'primary',
      opAdd: 'add',
      opDel: 'delete',
      signature: 'signature',
      sigNone: 'none',
      tkeyLine: 'Kerberos inside GSS-TSIG; DC1 now knows who sends',
      chkZoneOk: 'zone setting: takes this update',
      chkZoneUnsigned: 'zone setting: signed updates only',
      chkZoneNone: 'zone setting: no updates at all',
      chkNoAcl: '{name}: ACL not consulted',
      chkNew: '{name}: new name, the sender becomes its owner',
      chkOpen: '{name}: no owner, open',
      chkOwn: '{name}: owner {owner} = the sender',
      chkNotOwn: '{name}: owner {owner} ≠ sender {sender}',
      chkSkipped: 'owner not checked',
      adminLine: 'stale record {name} ({data}) deleted by hand',
      adminNext: 'PC1 then registers again',
      accepted: 'accepted',
      refused: 'refused',

      pUpdates: 'Zone dynamic updates',
      pAction: 'What happens',
      actJoin: 'PC1 joins the domain',
      actMove: 'PC1 gets a new address',
      actRename: 'PC2 renamed to PC2-NEW',
      actRebuildNew: 'PC1 rebuilt, new account',
      actRebuildReset: 'PC1 rebuilt, account reset',
      actRogue: 'a laptop outside the domain',
      pAdmin: 'Then the admin deletes the stale record',
      pAdminOff: 'Only when the signed update was refused for its owner',

      presetJoin: 'Join',
      presetJoinHint: 'PC1 writes its own record: unsigned refused, signed accepted',
      presetMove: 'New address',
      presetMoveHint: 'The owner changes its record: 10.0.0.51 → 10.0.1.23',
      presetRebuildNew: 'Rebuild, new SID',
      presetRebuildNewHint: 'Same name, another account: REFUSED, the name leads to the old address',
      presetRebuildReset: 'Rebuild, account reset',
      presetRebuildResetHint: 'Same SID: the update goes through',
      presetRename: 'Rename',
      presetRenameHint: 'PC2 → PC2-NEW: new name added, old one deleted',
      presetHijack: 'Nonsecure zone',
      presetHijackHint: 'A machine outside the domain takes the name fs1',

      legUnsigned: 'unsigned',
      legSigned: 'signed',
      legAnswer: 'answer',
      legOwner: 'owner',
      legSid: 'SID with no account',
      legOk: 'accepted',
      legNo: 'refused',
      legChanged: 'this step',

      capStart_join: '{c} joins the domain and gets {ip} from DHCP. At startup it tries to write its own record into {zone}: no admin adds it by hand.',
      capStart_move: '{c} has moved to another subnet and gets {ip}. The address change starts a registration; {name} still leads to {old}.',
      capStart_rename: 'PC2 has been renamed to {c}. Its computer account was renamed too, and the SID stayed the same. After the restart {c} registers the new name.',
      capStart_rebuildNew: 'PC1 was rebuilt: the old account was deleted and a new PC1 joined with a new SID {sid} and address {ip}. {name} still leads to {old}.',
      capStart_rebuildReset: 'PC1 was rebuilt, but the old account was reset, not deleted: the SID {sid} stays. New address {ip}; {name} still leads to {old}.',
      capStart_rogue: 'A laptop outside the domain ({ip}, no computer account) sends an update for {name}, the file server\'s name.',
      capSoa: '{n}. {c} asks for the SOA of {q}. DC1 answers: in an AD-integrated zone every DC holding the zone names itself as the primary, the server to send updates to.',
      capUnsigned: '{n}. {c} first sends the dynamic update unsigned: {upd}.',
      capUnsignedAgain: '{n}. {c} again sends the update unsigned first: {upd}.',
      capOkUnsigned: '{n}. NOERROR: the zone takes unsigned updates too, so DC1 writes the change without asking who sent it.',
      capHijack: '{n}. NOERROR: the zone takes unsigned updates too, so {name} now leads to {ip}, the laptop. Whoever opens the file server reaches the laptop.',
      capRefusedUnsigned: '{n}. The zone accepts secure dynamic updates only: the unsigned update is refused, the client authenticates with its computer account and sends a signed one.',
      capGaveUp: '{n}. REFUSED: the zone takes signed updates only, and the laptop has no computer account to authenticate with. It gives up; {name} still leads to {data}.',
      capRefusedNone1: '{n}. REFUSED: dynamic updates are off in this zone. {c} does not know that, so it tries signed as well.',
      capGaveUpNone: '{n}. REFUSED: dynamic updates are off in this zone, and the laptop has no account to sign with. It gives up; {name} still leads to {data}.',
      capTkey: '{n}. TKEY: {c} authenticates with its computer account {acc} (Kerberos inside GSS-TSIG). DC1 and {c} now share a security context.',
      capSigned: '{n}. The same update, now signed: DC1 knows it comes from {acc} with SID {sid}.',
      capOkNew: '{n}. NOERROR: there was no {name}, and any authenticated computer may create a new name. The record\'s owner (on its ACL) becomes {acc} ({sid}).',
      capOkOwner: '{n}. NOERROR: the owner of {name} is SID {sid}, the same as the sender. {name} now leads to {ip}.',
      capResetTail: ' The reset account kept its SID, so it is still the owner.',
      capOkRename: '{n}. NOERROR: {new} is a new name, owned by {acc}; {old} belongs to the same SID, so DC1 deletes it. Had the update not reached DC1, {old} would stay until stale records are scavenged.',
      capRefusedOwner: '{n}. The {name} record belongs to the old CORP\\PC1$ account ({owner}). The new PC1 has another SID ({sid}), so it may not change it, and the name still leads to {old}.',
      capFixHint: ' Switch on "Then the admin deletes the stale record".',
      capStartNoneTail: ' Dynamic updates are off in this zone, though.',
      capKeepsOwnerTail: ' The record keeps its old owner ({sid}): under Secure only this client would be refused again.',
      capRefusedNone2: '{n}. REFUSED even signed: with dynamic updates off, not even the owner changes a record. Only an administrator writes records then.',
      capAdmin: '{n}. Later, at {time}: the administrator deletes the stale record {name} ({old}). PC1 then registers again (a restart or a manual re-registration).',

      explain:
        '<p><b>Clients write their own records.</b> A Windows computer registers its own A record in the zone: at ' +
        'startup, when its address changes or its lease renews, on request, and periodically. ' +
        'No admin adds every PC by hand.</p>' +
        '<p><b>The order.</b> The client asks for the SOA of its name and sends the update to the server that answers ' +
        '(in an AD-integrated zone any DC). It sends unsigned first; if that is refused (REFUSED), it negotiates a ' +
        'security context (TKEY, GSS-TSIG) with its computer account and sends the same update signed.</p>' +
        '<p><b>The record\'s owner.</b> A record in an AD-integrated zone has an [[access control list]]. Whoever ' +
        'creates a new name becomes its owner; an existing record may be changed by its owner only. The owner is the ' +
        'account\'s <i>SID</i>, not its name: a rebuilt computer with a new account has another SID, so it may not change ' +
        'its old record, and the name leads to the old address. A reset account keeps its SID. The fix: an admin deletes ' +
        'the stale record, and the next registration creates a new one with the new owner.</p>' +
        '<p><b>The zone setting</b> (Dynamic updates): None refuses everything; Nonsecure and secure takes unsigned ' +
        'updates too, from anyone, for any name, so any machine on the network can take another\'s name; Secure only ' +
        'takes signed updates only and checks the owner. Secure only exists for AD-integrated zones only.</p>' +
        '<p><b>Not on this page:</b> DHCP registering records for clients, scavenging stale records, PTR records, TSIG ' +
        'with a shared key, Kerberos inside.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
