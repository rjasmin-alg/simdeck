/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of multimaster-conflict, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   *word* marks an English term in italics on the Croatian page (the page turns it into <em lang="en">); the terms are
   missing from kit/glossary.js and written out this way, English term then the Croatian in parentheses at the first
   mention (NOTES.md, "Term pairs"). The title and subtitle come from sim.json (title, concept). Values (x = 20, phone
   numbers), clock readings, version vectors, attribute names, M1/M2/DC1/DC2 and GUIDs are data, shown with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva glavna poslužitelja kao vremenske crte: upisi, poruke replikacije, razdvajanje mreže i razrješenje sukoba',

      // lanes
      master: 'glavni poslužitelj',
      dc: 'kontroler domene',
      clock: 'sat',
      skewSlow: 'kasni {n} s',
      skewFast: 'žuri {n} s',
      empty: 'prazno',
      sib: 'sukob',

      // chart
      chartEmpty: 'Još se ništa nije dogodilo.',
      earlier: ['↑ {n} raniji redak', '↑ {n} ranija retka', '↑ {n} ranijih redaka'],
      noteCreate: 'upis',
      noteUser: 'korisnik',
      notePart: 'razdvajanje mreže',
      noteHeal: 'mreža spojena',
      noteResolve: 'razrješenje',
      noteRejected: 'odbačeno',
      reApplied: 'upisano',
      reKept: 'zadržava svoje',
      reSiblings: 'sukob: čuva oba',
      reSame: 'već ima',
      reQueued: 'čeka u redu',

      // resolution box
      boxTitle: 'Razrješenje',
      boxRule: 'pravilo',
      boxQueue: 'Poruke u redu čekanja',
      boxFlight: 'Poruke na putu',
      boxWait: 'Sukob se razrješava kad obje strane prime tuđe izmjene.',
      boxNothing: 'Nema ničega na čekanju.',
      boxRound2: 'drugi krug',
      wroteAt: 'stvarno vrijeme {t}',
      stampLbl: 'pečat',
      verLbl: 'inačica',
      stWinner: 'pobjednik',
      stKept: 'zadržano',
      stLost: 'izgubljeno',
      stSib: 'sukob',
      stOver: 'prepisano redom',
      rule_stamp: 'veći pečat vremena pobjeđuje',
      rule_origin: 'isti pečat: pobjeđuje veća oznaka (ID) izvora',
      rule_version: 'viša inačica atributa pobjeđuje',
      rule_adstamp: 'ista inačica: pobjeđuje kasniji pečat',
      rule_guid: 'ista inačica i pečat: pobjeđuje veći GUID kontrolera',
      rule_dominates: 'jedan vektor pokriva drugi: novija inačica zamjenjuje stariju',
      rule_concurrent: 'nijedan vektor ne pokriva drugi: istodobno, čuvaju se oba',
      rule_single: 'samo jedna izmjena: nema sukoba',
      rule_order: 'upisi redom: kasniji je vidio raniji i zamijenio ga',
      footSilent: 'Nitko ne javlja gubitak: klijent je dobio potvrdu upisa.',
      footChoose: 'Odabrati mora aplikacija ili korisnik.',
      footInc: 'Očekivano {intended}, dobiveno {got}.',
      footIncVv: 'Očekivano {intended}: aplikacija mora spojiti istodobne inačice.',
      footBoth: 'Različiti atributi: obje izmjene ostaju.',

      // params
      strategy: 'Pravilo razrješenja',
      stratLww: 'zadnji upis',
      stratVv: 'vektori',
      stratAd: 'AD',
      skewM2: 'Odstupanje sata M2',
      partition: 'Razdvajanje mreže',
      writers: 'Tko upisuje',
      wBoth: 'obje strane',
      wM1: 'samo M1',
      wM2: 'samo M2',
      inc: 'Obje strane: x + 1',
      incOff: 'U AD primjeru upisi su atributi korisnika.',
      heal: 'Spoji mrežu',

      // values (the AD title attribute; phone numbers and x are data)
      v_title1: 'asistentica',
      v_title2: 'docentica',

      // presets
      presetSkew: 'Sat kasni',
      presetSkewHint: 'Kasniji upis na M2 gubi jer M2 kasni 4 s.',
      presetSynced: 'Bez pomaka',
      presetSyncedHint: 'Bez pomaka pobjeđuje 30, a gubi se upis na M1.',
      presetVv: 'Vektori inačica',
      presetVvHint: 'Nijedan vektor ne pokriva drugi: sukob ostaje vidljiv.',
      presetAd: 'AD atribut',
      presetAdHint: 'Isti atribut: kasniji pečat pobjeđuje; različiti atributi: oba ostaju.',
      presetInc: 'Izgubljeno +1',
      presetIncHint: 'Obje strane dodaju 1 na 10: rezultat 11, a trebalo je 12.',

      // legend
      legWrite: 'upis klijenta',
      legMsg: 'poruka replikacije',
      legQueued: 'u redu čekanja',
      legWall: 'razdvajanje mreže',
      legWinner: 'pobjednik',
      legLost: 'izgubljeno',
      legSib: 'sukob (oba)',
      legChanged: 'promijenjeno u ovom koraku',

      // captions
      capStart: 'Zapis {what} upisan je na M1. Oba glavna poslužitelja primaju upise i naknadno ih šalju jedan drugome: *multi-master replication* (replikacija s više glavnih poslužitelja). Pritisni →.',
      capStartAd: 'Korisnik {what} stvoren je na DC1. Svaki kontroler domene prima izmjene i šalje ih drugome, atribut po atribut. Pritisni →.',
      capRepl: 'Početna replikacija: {from} šalje {what} na {to}. Obje kopije su jednake.',
      capReplAd: 'Početna replikacija: {from} šalje korisnika {what} na {to}. Obje kopije su jednake.',
      capPart: '*Partition* (razdvajanje mreže): {a} i {b} ne mogu razgovarati. Oba i dalje primaju upise, a poruke čekaju u redu.',
      capWrite: 'Klijent upisuje {what} na {side} u stvarnom vremenu {t}. {side} ga odmah prihvaća i označava pečatom vlastitog sata: {stamp}.',
      capWriteVv: 'Klijent upisuje {what} na {side} u stvarnom vremenu {t}. {side} ga odmah prihvaća.',
      capWriteInc: 'Klijent na {side} čita x = {read} i upisuje {value} (+1), u stvarnom vremenu {t}. Pečat po satu {side}: {stamp}.',
      capWriteAd: '{side} postavlja {attr} = {value} u stvarnom vremenu {t}: inačica {ver}, pečat {stamp}.',
      capSkewSlow: 'Sat {side} kasni {n} s.',
      capSkewFast: 'Sat {side} žuri {n} s.',
      capVv: 'Vektor inačica na {side} sada je {vv}.',
      capQueued: 'Poruka za {other} čeka u redu.',
      capFlight: 'Poruka za {other} je na putu.',
      capRejected: 'Ali na {side} već stoji upis s većim pečatom ({stored}): novi upis odbačen je odmah, iako je klijent dobio potvrdu. Izmjena se ipak šalje dalje sa svojim pečatom.',
      capHeal: 'Mreža je ponovno spojena. Poruke iz reda isporučuju se redom kojim su poslane.',
      capApplied: '{to} prima {what} od {from} i upisuje ga: {why}.',
      capKept: '{to} prima {what} od {from} i zadržava svoje {mine}: {why}. Primljeni upis odbačen je bez ikakve poruke.',
      capSiblings: '{to} prima {what}: vektori {a} i {b}, nijedan ne pokriva drugi. Upisi su bili istodobni, pa {to} čuva oba.',
      capSame: '{to} već ima tu inačicu.',
      why_new: '{to} ga još nema',
      why_stamp: 'pečat {a} veći je od {b}',
      why_origin: 'isti pečat, a veća je oznaka (ID) izvora ({o})',
      why_version: 'inačica {a} viša je od {b}',
      why_adstamp: 'ista inačica, a pečat {a} kasniji je od {b}',
      why_guid: 'ista inačica i pečat, a GUID kontrolera {o} je veći',
      why_dominates: 'vektor {a} pokriva {b}',
      whyLost_stamp: 'pečat {a} manji je od {b}',
      whyLost_origin: 'isti pečat, a manja je oznaka (ID) izvora ({o})',
      whyLost_version: 'inačica {a} niža je od {b}',
      whyLost_adstamp: 'ista inačica, a pečat {a} raniji je od {b}',
      whyLost_guid: 'ista inačica i pečat, a GUID kontrolera {o} je manji',
      whyLost_dominates: 'njegov vektor {b} već pokriva {a}',
      capResSkew: '*Last-writer-wins* (pobjeđuje zadnji upis) — ali „zadnji“ po satu M2, koji kasni {n} s. Upis {lost} dogodio se kasnije i izgubljen je bez ikakve poruke.',
      capResLww: 'Obje kopije sada imaju {win}. Upis {lost} izgubljen je: *last-writer-wins* (pobjeđuje zadnji upis) od dva istodobna upisa uvijek odbaci jedan, i nitko to ne javlja.',
      capResInc: 'Obje strane dodale su 1 na {base}, a rezultat je {got}, ne {intended}: jedno povećanje je izgubljeno, iako su se obje strane „slagale“ oko operacije. *CRDT* (brojač koji se spaja zbrajanjem) ne bi ga izgubio.',
      capResIncVv: 'Dva upisa {a} i {b} čuvaju se kao sukob: ništa nije izgubljeno, ali točan rezultat {intended} mora izračunati aplikacija. *CRDT* (brojač koji se spaja zbrajanjem) to radi sam.',
      capResIncOrder: '{side} je pročitao {read} i upisao {value}, ali taj je upis izgubio na pečatu: rezultat je {got}, a trebalo je {intended}. Jedno povećanje je izgubljeno.',
      capResVv: 'Vektori inačica {a} i {b}: nijedna strana nije vidjela tuđi upis. To je sukob, i sustav ga prijavljuje umjesto da pogađa: odabrati mora aplikacija ili korisnik.',
      capResAd: 'Atribut po atribut: {attr} ima istu inačicu na obje strane, pa odlučuje pečat. Ostaje {win}, a {lost} je izgubljen.',
      capResAdVer: 'Atribut po atribut: za {attr} odlučuje inačica. Ostaje {win}, a {lost} je izgubljen.',
      capResAdGuid: 'Atribut po atribut: za {attr} su inačica i pečat jednaki, pa odlučuje GUID kontrolera. Ostaje {win}, a {lost} je izgubljen.',
      capResAdSkew: 'Pečat je po satu DC2, koji kasni {n} s: kasnija izmjena izgubila je zbog odstupanja satova.',
      capResAd2: 'Različiti atributi istog korisnika: obje izmjene su zadržane, ništa nije izgubljeno.',
      capResOrder: 'Upisi su stigli redom: {win} je nastao nakon {old} i zamijenio ga. Nema sukoba i ništa nije izgubljeno.',
      capResSingle: 'Upisivala je samo jedna strana: {win} je na obje kopije. Nema sukoba.',
      capResNone: 'Nitko nije upisivao: nema sukoba.',

      explain: '<p>Kod <em lang="en">multi-master replication</em> (replikacija s više glavnih poslužitelja) svaki poslužitelj ' +
        'odmah prihvaća upis i tek ga onda šalje ostalima. Dok je mreža razdvojena, obje strane mogu promijeniti isti zapis: ' +
        'nastaje <em lang="en">conflict</em> (sukob). Kad se mreža spoji, svaki poslužitelj mora odlučiti koja inačica ostaje.</p>' +
        '<p><b><em lang="en">Last-writer-wins</em></b> (pobjeđuje zadnji upis) zadržava inačicu s većim pečatom vremena, a pečat ' +
        'daje sat poslužitelja koji je primio upis. Jedan od dva istodobna upisa uvijek se odbacuje, bez poruke. Ako sat kasni ' +
        '(<em lang="en">clock skew</em>, odstupanje satova), izgubiti može i upis koji se stvarno dogodio kasnije.</p>' +
        '<p><b><em lang="en">Version vectors</em></b> (vektori inačica) broje upise svakog poslužitelja. Ako jedan vektor ' +
        'pokriva drugi, novija inačica je vidjela stariju i zamjenjuje je; ako nijedan ne pokriva drugi, upisi su bili ' +
        'istodobni i čuvaju se oba, a odabire aplikacija ili korisnik.</p>' +
        '<p><b>Active Directory</b> razrješava sukob po atributu: viša inačica atributa, zatim kasniji pečat, zatim veći GUID ' +
        'kontrolera domene. Izmjene različitih atributa istog objekta zato obje ostaju.</p>' +
        '<p>Povećanje brojača na obje strane također je sukob: obje strane upišu 11, a trebalo je 12. Strukture koje se spajaju ' +
        'bez gubitka (<em lang="en">CRDT</em>) rješavaju upravo to.</p>'
    },
    en: {
      stage: 'Two masters as timelines: writes, replication messages, a network partition and the conflict resolution',

      // lanes
      master: 'master',
      dc: 'domain controller',
      clock: 'clock',
      skewSlow: '{n} s slow',
      skewFast: '{n} s fast',
      empty: 'empty',
      sib: 'conflict',

      // chart
      chartEmpty: 'Nothing has happened yet.',
      earlier: ['↑ {n} earlier row', '↑ {n} earlier rows'],
      noteCreate: 'write',
      noteUser: 'user',
      notePart: 'network partition',
      noteHeal: 'network healed',
      noteResolve: 'resolution',
      noteRejected: 'discarded',
      reApplied: 'applied',
      reKept: 'keeps its own',
      reSiblings: 'conflict: keeps both',
      reSame: 'has it already',
      reQueued: 'queued',

      // resolution box
      boxTitle: 'Resolution',
      boxRule: 'rule',
      boxQueue: 'Messages in the queue',
      boxFlight: 'Messages on their way',
      boxWait: 'The conflict is resolved when each side receives the other side\'s changes.',
      boxNothing: 'Nothing is waiting.',
      boxRound2: 'second round',
      wroteAt: 'real time {t}',
      stampLbl: 'stamp',
      verLbl: 'version',
      stWinner: 'winner',
      stKept: 'kept',
      stLost: 'lost',
      stSib: 'conflict',
      stOver: 'overwritten in order',
      rule_stamp: 'the larger timestamp wins',
      rule_origin: 'equal stamps: the larger origin id wins',
      rule_version: 'the higher attribute version wins',
      rule_adstamp: 'equal versions: the later stamp wins',
      rule_guid: 'equal version and stamp: the higher DC GUID wins',
      rule_dominates: 'one vector covers the other: the newer version replaces the older',
      rule_concurrent: 'neither vector covers the other: concurrent, both are kept',
      rule_single: 'only one change: no conflict',
      rule_order: 'writes in order: the later one saw the earlier and replaced it',
      footSilent: 'Nobody reports the loss: the client was told the write succeeded.',
      footChoose: 'The application or the user has to choose.',
      footInc: 'Intended {intended}, got {got}.',
      footIncVv: 'Intended {intended}: the application has to merge the siblings.',
      footBoth: 'Different attributes: both changes stay.',

      // params
      strategy: 'Resolution rule',
      stratLww: 'last writer',
      stratVv: 'vectors',
      stratAd: 'AD',
      skewM2: 'Clock skew of M2',
      partition: 'Network partition',
      writers: 'Who writes',
      wBoth: 'both sides',
      wM1: 'M1 only',
      wM2: 'M2 only',
      inc: 'Both sides: x + 1',
      incOff: 'In the AD example the writes are attributes of a user.',
      heal: 'Heal the network',

      // values
      v_title1: 'teaching assistant',
      v_title2: 'assistant professor',

      // presets
      presetSkew: 'A slow clock',
      presetSkewHint: 'The later write on M2 loses because M2 is 4 s slow.',
      presetSynced: 'No skew',
      presetSyncedHint: 'Without skew 30 wins, and the write on M1 is lost.',
      presetVv: 'Version vectors',
      presetVvHint: 'Neither vector covers the other: the conflict stays visible.',
      presetAd: 'AD attribute',
      presetAdHint: 'Same attribute: the later stamp wins; different attributes: both stay.',
      presetInc: 'Lost +1',
      presetIncHint: 'Both sides add 1 to 10: the result is 11, it should be 12.',

      // legend
      legWrite: 'client write',
      legMsg: 'replication message',
      legQueued: 'queued',
      legWall: 'network partition',
      legWinner: 'winner',
      legLost: 'lost',
      legSib: 'conflict (both)',
      legChanged: 'changed in this step',

      // captions
      capStart: 'Record {what} was written on M1. Both masters accept writes and send them to each other afterwards: multi-master replication. Press →.',
      capStartAd: 'User {what} was created on DC1. Each domain controller accepts changes and sends them to the other, attribute by attribute. Press →.',
      capRepl: 'Initial replication: {from} sends {what} to {to}. Both copies are equal.',
      capReplAd: 'Initial replication: {from} sends user {what} to {to}. Both copies are equal.',
      capPart: 'Network partition: {a} and {b} cannot talk. Both still accept writes, and the messages wait in a queue.',
      capWrite: 'A client writes {what} on {side} at real time {t}. {side} accepts it at once and stamps it with its own clock: {stamp}.',
      capWriteVv: 'A client writes {what} on {side} at real time {t}. {side} accepts it at once.',
      capWriteInc: 'A client on {side} reads x = {read} and writes {value} (+1) at real time {t}. Stamp from the clock of {side}: {stamp}.',
      capWriteAd: '{side} sets {attr} = {value} at real time {t}: version {ver}, stamp {stamp}.',
      capSkewSlow: 'The clock of {side} is {n} s slow.',
      capSkewFast: 'The clock of {side} is {n} s fast.',
      capVv: 'The version vector on {side} is now {vv}.',
      capQueued: 'The message for {other} waits in the queue.',
      capFlight: 'The message for {other} is on its way.',
      capRejected: 'But {side} already holds a write with a larger stamp ({stored}): the new write is discarded at once, although the client was told it succeeded. The change is still sent on with its stamp.',
      capHeal: 'The network is healed. The queued messages are delivered in the order they were sent.',
      capApplied: '{to} receives {what} from {from} and applies it: {why}.',
      capKept: '{to} receives {what} from {from} and keeps its own {mine}: {why}. The received write is discarded without any message.',
      capSiblings: '{to} receives {what}: vectors {a} and {b}, neither covers the other. The writes were concurrent, so {to} keeps both.',
      capSame: '{to} already has this version.',
      why_new: '{to} does not have it yet',
      why_stamp: 'stamp {a} is larger than {b}',
      why_origin: 'equal stamps, and the origin id is larger ({o})',
      why_version: 'version {a} is higher than {b}',
      why_adstamp: 'equal versions, and stamp {a} is later than {b}',
      why_guid: 'equal version and stamp, and the GUID of {o} is higher',
      why_dominates: 'vector {a} covers {b}',
      whyLost_stamp: 'stamp {a} is smaller than {b}',
      whyLost_origin: 'equal stamps, and the origin id is smaller ({o})',
      whyLost_version: 'version {a} is lower than {b}',
      whyLost_adstamp: 'equal versions, and stamp {a} is earlier than {b}',
      whyLost_guid: 'equal version and stamp, and the GUID of {o} is lower',
      whyLost_dominates: 'its vector {b} already covers {a}',
      capResSkew: 'The last writer wins, but "last" by the clock of M2, which is {n} s slow. The write {lost} happened later and is lost without any message.',
      capResLww: 'Both copies now hold {win}. The write {lost} is lost: of two concurrent writes, last-writer-wins always throws one away, and nobody reports it.',
      capResInc: 'Both sides added 1 to {base}, and the result is {got}, not {intended}: one increment is lost, although both sides "agreed" on the operation. A counter that merges by adding (a CRDT) would not lose it.',
      capResIncVv: 'The two writes {a} and {b} are kept as a conflict: nothing is lost, but the application has to compute the correct {intended}. A counter that merges by adding (a CRDT) does that itself.',
      capResIncOrder: '{side} read {read} and wrote {value}, but that write lost on the stamp: the result is {got}, it should be {intended}. One increment is lost.',
      capResVv: 'Version vectors {a} and {b}: neither saw the other\'s write. This is a conflict, and the system says so instead of guessing: the application or the user has to choose.',
      capResAd: 'Attribute by attribute: {attr} has the same version on both sides, so the stamp decides. {win} stays, and {lost} is lost.',
      capResAdVer: 'Attribute by attribute: for {attr} the version decides. {win} stays, and {lost} is lost.',
      capResAdGuid: 'Attribute by attribute: for {attr} version and stamp are equal, so the DC GUID decides. {win} stays, and {lost} is lost.',
      capResAdSkew: 'The stamp comes from the clock of DC2, which is {n} s slow: the later change lost because of the clock skew.',
      capResAd2: 'Different attributes of the same user: both changes are kept, nothing is lost.',
      capResOrder: 'The writes arrived in order: {win} came after {old} and replaced it. No conflict, and nothing is lost.',
      capResSingle: 'Only one side wrote: {win} is on both copies. No conflict.',
      capResNone: 'Nobody wrote: no conflict.',

      explain: '<p>In <b>multi-master replication</b> every server accepts a write at once and only then sends it to the others. ' +
        'While the network is partitioned, both sides can change the same record: a <b>conflict</b>. When the network heals, each ' +
        'server has to decide which version stays.</p>' +
        '<p><b>Last-writer-wins</b> keeps the version with the larger timestamp, and the stamp comes from the clock of the server ' +
        'that took the write. One of two concurrent writes is always thrown away, without a message. If a clock is slow (<b>clock ' +
        'skew</b>), even the write that really happened later can lose.</p>' +
        '<p><b>Version vectors</b> count the writes of each server. If one vector covers the other, the newer version has seen the ' +
        'older one and replaces it; if neither covers the other, the writes were concurrent, both are kept, and the application or ' +
        'the user chooses.</p>' +
        '<p><b>Active Directory</b> resolves a conflict per attribute: the higher attribute version, then the later stamp, then the ' +
        'higher domain controller GUID. Changes to different attributes of the same object therefore both stay.</p>' +
        '<p>An increment on both sides is a conflict too: both sides write 11, and it should be 12. Data types that merge without ' +
        'loss (<b>CRDTs</b>) solve exactly that.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
