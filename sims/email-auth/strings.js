/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of email-auth, in both languages (docs/sim-ui.md §9). Same keys in hr and en. {name} is a
   placeholder, [[term]] a glossary term (first mention), [[=term]] a later mention. Addresses, host names, DNS names,
   records, header names, SMTP replies and the result tokens of the checks (pass, fail, none…) are data: the page
   puts them in translate="no" elements. "SPF record" and "DKIM signature" are not in the glossary yet (NOTES.md,
   Term pairs), so the Croatian strings write the pair out. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Provjera pošiljatelja na prijemnom poslužitelju',
      msgTitle: 'Poruka stiže na {host}',
      connFrom: 'spojio se s adrese',
      viaList: 'šalje je dopisna lista {list}',
      envTitle: 'omotnica (SMTP)',
      letterTitle: 'pismo: zaglavlje',
      tagNote: 'dodala lista',
      readBy: 'čita provjera {n}',
      dnsTitle: 'DNS upiti prijemnog poslužitelja',
      dnsEmpty: 'Još nema upita.',
      noRecord: '(nema zapisa)',
      stepN: 'korak {n}',

      gSpf: 'SPF',
      gDkim: 'DKIM',
      gDmarc: 'Zapis DMARC',
      gAlign: 'Poravnanje s domenom iz From:',
      gVerdict: 'Ishod DMARC-a i pravilo',
      qSpf: 'Smije li ova adresa slati za domenu iz MAIL FROM?',
      qDkim: 'Je li itko preuzeo dio odgovornosti za poruku?',
      qDmarc: 'Što traži domena iz From:?',
      qVerdict: 'Što prijemni poslužitelj čini s porukom?',
      notYet: 'još nije provjereno',

      spfRecordOf: 'zapis domene {domain}:',
      spfNoRecord: 'domena nema zapis SPF',
      spfMultiple: 'dva zapisa SPF',
      spfDnsTerms: 'članova s upitom u DNS: {n} od najviše {max}',
      termMatch: 'podudara se',
      termNo: 'ne podudara se',
      termUnread: 'ne čita se',
      termSkip: 'preskače se',
      termLimit: 'preko granice od deset',
      termError: 'nepoznat član',
      dkimSigned: 'potpis:',
      dkimKeyAt: 'ključ:',
      dkimKeyFound: 'ključ pronađen',
      dkimNoKey: 'ključa nema',
      dkimOk: 'potpis odgovara poruci',
      dkimChanged: 'poruka je promijenjena nakon potpisivanja',
      dkimNone: 'u zaglavlju nema {h}',
      dmarcAuthor: 'domena autora (From:):',
      dmarcRecordAt: 'zapis:',
      dmarcPDefault: 'nema oznake p: čita se kao p=none',
      dmarcNoRecord: 'domena nema zapis DMARC',
      alAligned: 'poravnato',
      alNot: 'nije poravnato',
      alNotCounted: 'provjera nije prošla',
      alOff: 'ne broji se',
      alNoSig: 'nema potpisa',
      alSame: 'isto ime',
      alSameOrg: 'ista organizacijska domena',
      alStrictDiff: 'strogo: imena se razlikuju',
      alDiffOrg: 'druga organizacijska domena',
      modeRelaxed: 'opušteno',
      modeStrict: 'strogo',
      vPass: 'DMARC prolazi',
      vFail: 'DMARC ne prolazi',
      vNone: 'nema zapisa DMARC, nema ni ishoda',
      policyIs: 'pravilo',
      actDeliver: 'isporučeno u sandučić',
      actReport: 'isporučeno; vlasnik domene neuspjeh vidi u skupnom izvješću',
      actQuarantine: 'sumnjiva pošta: ide u mapu neželjene pošte',
      actReject: 'odbijeno u SMTP sjednici',
      unsub: 'lista odbijenicu čita kao mrtvu adresu i odjavljuje {who}',

      legPass: 'prolazi',
      legFail: 'ne prolazi',
      legNone: 'nema / ne broji se',
      legAligned: 'poravnato',
      legNotAligned: 'nije poravnato',
      legChanged: 'promijenjeno u ovom koraku',

      scenario: 'Poruka',
      sLegit: 'zakonita',
      sList: 'preko liste',
      sSpoof: 'krivotvorena',
      sSub: 'iz poddomene',
      policy: 'Pravilo domene lab.example',
      aspf: 'Poravnanje za SPF (aspf)',
      signed: 'lab.example potpisuje',
      listModifiesSubject: 'Lista mijenja Subject:',
      listModifiesSubjectHint: 'Lista mijenja poruku nakon potpisivanja.',
      listOnly: 'Samo za poruku preko liste.',
      pLegit: 'Zakonita poruka',
      pListSigned: 'Lista, potpisano, p=reject',
      pListUnsigned: 'Lista, bez potpisa, p=reject',
      pSpoof: 'Krivotvoreni From:',
      pSub: 'Poddomena: opušteno ili strogo',
      pSubHint: 'Na koraku 4 prebaci poravnanje za SPF na strogo.',

      cArrive: 'Stroj s adrese {ip} predaje poruku poslužitelju {host}. Prije nego što je primi, poslužitelj je provjerava triput, a svaka provjera čita drugu zonu: SPF zonu domene iz MAIL FROM, DKIM zonu potpisnika, DMARC zonu domene iz From:.',
      cArriveList: 'Lista {list} Aninu poruku šalje dalje svojim članovima, sa svog poslužitelja {ip}. U omotnicu upisuje svoju povratnu adresu, {mailFrom}, da joj se odbijenice vraćaju; zaglavlje From: ostaje Anino.',
      cSpfMatch: 'Zapis pošiljatelja (SPF) čita se za domenu {domain}, domenu iz MAIL FROM. Tu adresu nosi [[envelope]]; zaglavlje From: SPF ne čita. Član {term} podudara se s adresom {ip}: {result}.',
      cSpfMx: 'Član mx traži dva upita: najprije zapis MX, zatim adresu stroja {host}.',
      cSpfAll: 'Zapis pošiljatelja (SPF) čita se za domenu {domain}, onu iz MAIL FROM. Nijedan član prije {term} ne podudara se s adresom {ip}, a {all} se podudara sa svime: {result}.',
      cSpfList: 'SPF prolazi, ali za domenu liste, a ne za lab.example: lista šalje sa svog stroja i pod svojom povratnom adresom.',
      cSpfOther: 'Zapis pošiljatelja (SPF) čita se za domenu {domain}, onu iz MAIL FROM: {result}.',
      cDkimPass: 'Potpis navodi d={d} i s={s}, pa se ključ čita s imena {key}; [[selector]] je prvi dio tog imena. Potpis odgovara poruci: {signer} preuzima dio odgovornosti za nju. O tome tko ju je napisao ne govori ništa.',
      cDkimFail: 'Ključ se čita s imena {key}, ali lista je nakon potpisivanja promijenila redak Subject:, pa potpis više ne odgovara poruci: {result}.',
      cDkimNone: 'Poruka nema DKIM-Signature, pa nema što provjeriti: {result}.',
      cDkimNoKey: 'Na imenu {key} nema ključa, pa se potpis ne može provjeriti: {result}.',
      cDmarc: 'U zaglavlju From: piše {domain}: to je [[author domain]], jedino ime koje čitatelj vidi, i od nje DMARC kreće. Zapis na {name} traži p={p}.',
      cDmarcNoP: 'Zapis nema oznaku p, pa se čita kao p=none.',
      cDmarcNone: 'U zaglavlju From: piše {domain}: to je [[author domain]]. Na {name} nema zapisa, pa DMARC za ovu poruku ne vrijedi.',
      cAlSpfYes: 'Domena koju je potvrdio SPF, {d}, poravnata je s {author} ({how}).',
      cAlSpfNo: 'SPF je prošao za {d}, ali ta domena nije poravnata s {author} ({how}).',
      cAlSpfFailed: 'SPF nije prošao, pa se njegova domena ne broji.',
      cAlDkimYes: 'Domena potpisa {d} poravnata je s {author} ({how}).',
      cAlDkimNo: 'DKIM je prošao za {d}, ali ta domena nije poravnata s {author} ({how}).',
      cAlDkimFailed: 'DKIM nije prošao, pa se njegova domena ne broji.',
      cAlDkimNone: 'Potpisa nema.',
      cAlSpoof: 'SPF prolazi i DKIM prolazi, ali su obje potvrđene domene {d}, a u zaglavlju From: piše {author}. Nema poravnanja, DMARC ne prolazi.',
      howSame: 'isto ime',
      howSameOrg: 'opušteno: ista organizacijska domena',
      howStrict: 'strogo: imena se razlikuju',
      howDiffOrg: 'druga organizacijska domena',
      cPass: 'DMARC prolazi: dovoljna je jedna poravnata potvrda. Prolaz znači samo da je uporaba imena {author} ovlaštena, a ne da je poruka sigurna ili poželjna.',
      cReport: 'DMARC ne prolazi. Uz p=none vlasnik domene ne iskazuje želju: poruka se isporučuje kao i inače, a o neuspjehu vlasnika obavještava [[aggregate report]]. To je [[monitoring mode]].',
      cQuarantine: 'DMARC ne prolazi. p=quarantine traži da se poruka smatra sumnjivom: ide u mapu neželjene pošte.',
      cReject: 'DMARC ne prolazi. Ovaj prijemni poslužitelj pravilo p=reject provodi doslovno i poruku odbija u SMTP sjednici: {reply}.',
      cUnsub: 'Lista odbijenicu čita kao znak da adresa {who} više ne radi i odjavljuje je, a taj čitatelj nije učinio ništa.',
      cNoDmarc: 'Bez zapisa DMARC nema ni ishoda: poruka se obrađuje kao da DMARC ne postoji.',

      explain: '<p>Tri mehanizma odgovaraju na tri različita pitanja, i svaki čita zapis iz druge zone: SPF iz zone ' +
        'domene iz MAIL FROM, DKIM iz zone potpisnika, DMARC iz zone domene iz From:. ' +
        '<b>SPF</b>: smije li stroj s ove adrese slati za domenu iz MAIL FROM? <i lang="en">SPF record</i> (zapis ' +
        'pošiljatelja) čita se slijeva nadesno; prvi član koji se podudari odlučuje, a [[qualifier]] ispred njega daje ' +
        'ishod (+ pass, - fail, ~ softfail, ? neutral). Članova s upitom u DNS smije biti najviše deset. ' +
        '<b>DKIM</b>: <i lang="en">DKIM signature</i> (potpis poruke) kaže da domena d= preuzima dio odgovornosti za ' +
        'poruku; ključ se čita na imenu s._domainkey.d, gdje je s [[selector]].</p>' +
        '<p>Nijedan od njih ne gleda From:, ime koje čitatelj vidi. Domena koju je potvrdio SPF ili DKIM je ' +
        '[[authenticated identifier]], a [[author domain]] je domena iz From:. <b>DMARC</b> traži da se to dvoje poklopi; ' +
        'to je [[identifier alignment]]. Opušteno znači da je [[organizational domain]] ista, strogo da je ime isto. ' +
        'DMARC prolazi ako je SPF prošao i poravnat je, <b>ili</b> ako je DKIM prošao i poravnat je. Kad ne prođe, ' +
        '[[domain owner assessment policy]] (p=none, quarantine, reject) kaže što vlasnik domene traži. To je zamolba: ' +
        'prijemna strana ne smije odbiti poruku samo zato što zapis kaže p=reject, nego bez drugih saznanja s njom ' +
        'postupa kao da piše p=quarantine. Prijemni poslužitelj u ovom primjeru pravilo provodi doslovno.</p>' +
        '<p><b>Česte zablude.</b> „SPF provjerava redak From:" — ne, provjerava omotnicu. „DKIM pass znači da je poruka ' +
        'od onoga tko piše u From:" — ne, potpis zlo.example prolazi i na tuđem From:. „p=reject je najsigurniji izbor" ' +
        '— lista poruku šalje sa svog stroja i pod svojom povratnom adresom, pa SPF domeni lab.example ne pomaže; bez ' +
        'potpisa poruka pada i biva odbijena, a lista čitatelje odjavljuje.</p>'
    },
    en: {
      stage: 'Sender checks at the receiving server',
      msgTitle: 'A message arrives at {host}',
      connFrom: 'connection from',
      viaList: 'sent on by the mailing list {list}',
      envTitle: 'envelope (SMTP)',
      letterTitle: 'letter: header',
      tagNote: 'added by the list',
      readBy: 'read by check {n}',
      dnsTitle: 'DNS lookups by the receiver',
      dnsEmpty: 'No lookups yet.',
      noRecord: '(no record)',
      stepN: 'step {n}',

      gSpf: 'SPF',
      gDkim: 'DKIM',
      gDmarc: 'DMARC record',
      gAlign: 'Alignment with the From: domain',
      gVerdict: 'DMARC result and policy',
      qSpf: 'May this address send for the MAIL FROM domain?',
      qDkim: 'Has anyone taken some responsibility for the message?',
      qDmarc: 'What does the From: domain ask for?',
      qVerdict: 'What does the receiver do with the message?',
      notYet: 'not checked yet',

      spfRecordOf: 'record of {domain}:',
      spfNoRecord: 'the domain has no SPF record',
      spfMultiple: 'two SPF records',
      spfDnsTerms: 'terms that query DNS: {n} of at most {max}',
      termMatch: 'matches',
      termNo: 'no match',
      termUnread: 'not read',
      termSkip: 'skipped',
      termLimit: 'over the limit of ten',
      termError: 'unknown term',
      dkimSigned: 'signature:',
      dkimKeyAt: 'key:',
      dkimKeyFound: 'key found',
      dkimNoKey: 'no key',
      dkimOk: 'the signature matches the message',
      dkimChanged: 'the message changed after signing',
      dkimNone: 'no {h} in the header',
      dmarcAuthor: 'author domain (From:):',
      dmarcRecordAt: 'record:',
      dmarcPDefault: 'no p tag: read as p=none',
      dmarcNoRecord: 'the domain has no DMARC record',
      alAligned: 'aligned',
      alNot: 'not aligned',
      alNotCounted: 'the check did not pass',
      alOff: 'not counted',
      alNoSig: 'no signature',
      alSame: 'same name',
      alSameOrg: 'same organizational domain',
      alStrictDiff: 'strict: the names differ',
      alDiffOrg: 'different organizational domain',
      modeRelaxed: 'relaxed',
      modeStrict: 'strict',
      vPass: 'DMARC passes',
      vFail: 'DMARC fails',
      vNone: 'no DMARC record, so no result',
      policyIs: 'policy',
      actDeliver: 'delivered to the inbox',
      actReport: 'delivered; the domain owner sees the failure in the aggregate report',
      actQuarantine: 'suspicious mail: goes to the spam folder',
      actReject: 'refused in the SMTP session',
      unsub: 'the list reads the refusal as a dead address and unsubscribes {who}',

      legPass: 'pass',
      legFail: 'fail',
      legNone: 'none / not counted',
      legAligned: 'aligned',
      legNotAligned: 'not aligned',
      legChanged: 'changed in this step',

      scenario: 'Message',
      sLegit: 'legitimate',
      sList: 'via a list',
      sSpoof: 'spoofed',
      sSub: 'from a subdomain',
      policy: 'Policy of lab.example',
      aspf: 'SPF alignment (aspf)',
      signed: 'lab.example signs',
      listModifiesSubject: 'The list edits Subject:',
      listModifiesSubjectHint: 'The list changes the message after it was signed.',
      listOnly: 'Only for the message via the list.',
      pLegit: 'Legitimate mail',
      pListSigned: 'List, signed, p=reject',
      pListUnsigned: 'List, unsigned, p=reject',
      pSpoof: 'Spoofed From:',
      pSub: 'Subdomain: relaxed or strict',
      pSubHint: 'At step 4, switch SPF alignment to strict.',

      cArrive: 'The machine at {ip} hands a message to {host}. Before accepting it, the server checks it three times, and each check reads a different zone: SPF the zone of the MAIL FROM domain, DKIM the signer\'s zone, DMARC the zone of the From: domain.',
      cArriveList: 'The list {list} sends Ana\'s message on to its members from its own server, {ip}. It writes its own bounce address, {mailFrom}, into the envelope so that refusals come back to it; the From: header stays Ana\'s.',
      cSpfMatch: 'The SPF record is read for {domain}, the domain from MAIL FROM. The [[envelope]] carries that address; SPF does not read the From: header. Term {term} matches {ip}: {result}.',
      cSpfMx: 'The mx term takes two lookups: first the MX record, then the address of {host}.',
      cSpfAll: 'The SPF record is read for {domain}, the domain from MAIL FROM. No term before {term} matches {ip}, and {all} matches everything: {result}.',
      cSpfList: 'SPF passes, but for the list\'s domain, not for lab.example: the list sends from its own machine with its own bounce address.',
      cSpfOther: 'The SPF record is read for {domain}, the domain from MAIL FROM: {result}.',
      cDkimPass: 'The signature names d={d} and s={s}, so the key is read at {key}; the [[selector]] is the first part of that name. The signature matches the message: {signer} takes some responsibility for it. It says nothing about who wrote it.',
      cDkimFail: 'The key is read at {key}, but the list changed the Subject: line after signing, so the signature no longer matches the message: {result}.',
      cDkimNone: 'The message carries no DKIM-Signature, so there is nothing to verify: {result}.',
      cDkimNoKey: 'There is no key at {key}, so the signature cannot be verified: {result}.',
      cDmarc: 'The From: header says {domain}: that is the [[author domain]], the only name the reader sees, and DMARC starts from it. The record at {name} asks for p={p}.',
      cDmarcNoP: 'The record has no p tag, so it reads as p=none.',
      cDmarcNone: 'The From: header says {domain}: that is the [[author domain]]. There is no record at {name}, so DMARC does not apply to this message.',
      cAlSpfYes: 'The domain SPF authenticated, {d}, is aligned with {author} ({how}).',
      cAlSpfNo: 'SPF passed for {d}, but that domain is not aligned with {author} ({how}).',
      cAlSpfFailed: 'SPF did not pass, so its domain does not count.',
      cAlDkimYes: 'The signing domain {d} is aligned with {author} ({how}).',
      cAlDkimNo: 'DKIM passed for {d}, but that domain is not aligned with {author} ({how}).',
      cAlDkimFailed: 'DKIM did not pass, so its domain does not count.',
      cAlDkimNone: 'There is no signature.',
      cAlSpoof: 'SPF passes and DKIM passes, but both authenticated domains are {d} while the From: header says {author}. No alignment, so DMARC fails.',
      howSame: 'same name',
      howSameOrg: 'relaxed: same organizational domain',
      howStrict: 'strict: the names differ',
      howDiffOrg: 'different organizational domain',
      cPass: 'DMARC passes: one aligned pass is enough. A pass means only that the use of {author} is authorized, not that the message is safe or wanted.',
      cReport: 'DMARC fails. With p=none the domain owner states no wish: the message is delivered as usual, and the [[aggregate report]] tells the owner about the failure. This is [[monitoring mode]].',
      cQuarantine: 'DMARC fails. p=quarantine asks for the message to be treated as suspicious: it goes to the spam folder.',
      cReject: 'DMARC fails. This receiver applies p=reject literally and refuses the message in the SMTP session: {reply}.',
      cUnsub: 'The list reads the refusal as a sign that {who} no longer works and unsubscribes that reader, who did nothing wrong.',
      cNoDmarc: 'Without a DMARC record there is no result: the message is handled as if DMARC did not exist.',

      explain: '<p>Three mechanisms answer three different questions, and each reads a different zone: SPF the zone of ' +
        'the MAIL FROM domain, DKIM the signer\'s zone, DMARC the zone of the From: domain. <b>SPF</b>: may the machine at this address send for the domain in MAIL FROM? The SPF record is ' +
        'read left to right; the first term that matches decides, and the [[qualifier]] in front of it gives the result ' +
        '(+ pass, - fail, ~ softfail, ? neutral). At most ten terms may query DNS. <b>DKIM</b>: a DKIM signature says ' +
        'that domain d= takes some responsibility for the message; the key is read at s._domainkey.d, where s is the ' +
        '[[selector]].</p>' +
        '<p>Neither of them looks at From:, the name the reader sees. A domain that SPF or DKIM has verified is an ' +
        '[[authenticated identifier]]; the [[author domain]] is the domain in From:. <b>DMARC</b> asks for the two to ' +
        'match; that is [[identifier alignment]]. Relaxed means the same [[organizational domain]], strict the same name. ' +
        'DMARC passes if SPF passed and is aligned, <b>or</b> if DKIM passed and is aligned. When it fails, the ' +
        '[[domain owner assessment policy]] (p=none, quarantine, reject) says what the domain owner asks for. It is a ' +
        'request: a receiver must not refuse a message only because the record says p=reject, and without other ' +
        'knowledge it treats the message as if it said p=quarantine. The receiver in this example applies it literally.</p>' +
        '<p><b>Common mistakes.</b> "SPF checks the From: line": no, it checks the envelope. "A DKIM pass means the mail ' +
        'is from whoever From: names": no, a zlo.example signature passes on someone else\'s From: too. "p=reject is the ' +
        'safest choice": a list sends from its own machine with its own bounce address, so SPF does not help lab.example; ' +
        'without a signature the message fails and is refused, and the list unsubscribes its readers.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
