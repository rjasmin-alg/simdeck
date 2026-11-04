/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-gpo-tattooing, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. *term* in a caption is an English term, drawn in italics (the Croatian term rule: English in
   italics, Croatian in parentheses at the first mention). Registry paths, value names, GPO, user and computer names
   are data, not words. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'GPO s pravilom i preferencom, registar računala PC07, događaji i tablica pravila',

      gpoKind: 'GPO',
      gpoLinked: 'povezan na {ou}',
      gpoUnlinked: 'odspojen od {ou}',
      gpoFor: '{user} na {pc}',
      evTime: 't = {t} min',
      evLogon: 'prijava',
      evUnlink: 'admin odspaja GPO',
      evRefresh: 'osvježavanje',
      evUnlinkRefresh: 'odspoji i osvježi',
      evEdit: '{user} mijenja vrijednost',
      evTry: '{user} pokušava oboje',

      kindPolicy: 'pravilo',
      kindPref: 'preferenca',
      polPath: 'Administrativni predlošci › Upravljačka ploča',
      polSetting: 'Zabrani pristup upravljačkoj ploči i postavkama PC-ja',
      polState: 'omogućeno',
      prefPath: 'Preference › Postavke sustava Windows › Registar',
      prefAction: 'radnja:',
      optRemove: 'Ukloni ovu stavku kad se više ne primjenjuje',
      optOnce: 'Primijeni jednom i ne primjenjuj ponovno',
      writesTo: 'upisuje u registar računala {pc}',
      noValue: 'nema vrijednosti',
      outWrite: 'upisano',
      outSame: 'upisano ponovno',
      outOverwrite: 'prepisano: {before} → {after}',
      outOnce: 'nije ponovno primijenjeno',
      outRemove: 'obrisano',
      outTattoo: 'ostaje: tetovaža',
      outNone: 'ništa za napraviti',
      outWaits: 'čeka osvježavanje',
      outBlocked: 'pokušaj odbijen',
      outOpen: 'otvara se',
      outUntouched: 'nepromijenjeno',
      outUserSet: '{user}: {before} → {after}',
      userSees: 'Što {user} vidi',
      cpBlocked: 'Upravljačka ploča se ne otvara (ograničenje)',
      cpOpen: 'Upravljačka ploča se otvara',
      proxyOn: 'Način proxyja u aplikaciji: {v}',
      proxyDefault: 'Način proxyja u aplikaciji: zadani',
      canChange: 'korisnik ga može promijeniti',
      cannotChange: 'korisnik ga ne može promijeniti',

      tableTitle: 'Što prolaz radi sa stavkom (prvo podudaranje)',
      colItem: '#',
      colApplies: 'GPO vrijedi',
      colCond: 'Uvjet',
      colAct: 'Radnja',
      yes: 'da',
      no: 'ne',
      condPolicyKey: 'u Policies',
      condOutside: 'izvan Policies (ADM)',
      condRemove: '„Ukloni…”',
      condOnce: '„Jednom”, već upisano',
      actWrite: 'upiši vrijednost',
      actDeleteDefault: 'obriši: zadano',
      actDelete: 'obriši vrijednost',
      actTattoo: 'ostavi: tetovaža',
      actKeep: 'ostavi korisnikovu',
      markPass: '{time} · {event}',
      markNone: 'U ovom koraku nema prolaza',
      markStart: 'Prolaz',
      markSkip: 'ne čita se',

      capStart: 'GPO {gpo} ima jedno *policy* (pravilo) i jednu *preference* (preferencu), obje stavke za {user} na {pc}. Još ništa nije ' +
        'primijenjeno; → pokreće prijavu.',
      capLogon: 't = {t}, prijava: obje stavke su primijenjene. Pravilo upisuje {pv} u ključ Policies, a preferenca {fv} u običan ključ {key}.',
      capLogonReplace: 'Uz „Ukloni ovu stavku…” radnja je *Replace* (zamijeni): obriši i upiši ponovno.',
      capLogonOnce: 'Uz „Primijeni jednom” ovo je jedini put da se preferenca primjenjuje.',
      capUnlink: 't = {t}: administrator odspaja GPO. Na {pc} se još ništa ne mijenja: obje vrijednosti ostaju do sljedećeg ' +
        'osvježavanja.',
      capRefreshAt: 't = {t}, osvježavanje:',
      capUnlinkRefresh: 't = {t}: administrator odspaja GPO u istoj minuti u kojoj počinje osvježavanje, pa ono već radi bez GPO-a:',
      capUnlinked: 'GPO je odspojen:',
      capTattoo: 'vrijednost pravila u ključu Policies je obrisana, ali *preference* (preferenca) {fv} ostaje — tetovaža.',
      capCpBack: 'Upravljačka ploča se opet otvara.',
      capRemoved: 'vrijednost pravila je obrisana, a zbog „Ukloni ovu stavku kad se više ne primjenjuje” obrisan je i ' +
        '{name}. Obrisan, a ne vraćen na neku raniju vrijednost: aplikacija koristi svoju zadanu vrijednost.',
      capEdit: 't = {t}: {user} u aplikaciji postavlja {fv0}. *Preference* (preferenca) to dopušta; {pv} je i dalje u ključu Policies.',
      capOverwrite: 'Korisnik je postavio 0, a ovo osvježavanje vraća 1.',
      capOverwriteWhy: 'Preferenca se ponovno primjenjuje pri svakom osvježavanju.',
      capOverwriteReplace: 'Radnja *Replace*: obrisana i upisana ponovno.',
      capOnce: '„Primijeni jednom”: {name} je primijenjen pri prijavi, pa se ne primjenjuje ponovno i korisnikova 0 ostaje.',
      capTry: 't = {t}: {user} pokušava otvoriti upravljačku ploču i dobiva poruku o ograničenju: *policy* (pravilo) je nametnuto. ' +
        'U aplikaciji postavlja {fv0}: preferenca to dopušta.',

      presetUnlink: 'Odspoji GPO',
      presetUnlinkHint: 'pravilo nestaje, preferenca ostaje',
      presetRemove: 'Uz „Ukloni…”',
      presetRemoveHint: 'briše se i preferenca',
      presetEdit: 'Korisnik mijenja',
      presetEditHint: 'osvježavanje vraća 1',
      presetOnce: 'Primijeni jednom',
      presetOnceHint: 'korisnikova 0 ostaje',
      presetLocked: 'Pravilo je zaključano',
      presetLockedHint: 'upravljačka ploča odbija, preferenca se mijenja',

      script: 'Nakon prijave',
      scrUnlink: 'odspoji, pa osvježi',
      scrUnlinkAtRefresh: 'odspoji pri osvježavanju',
      scrEdit: 'korisnik mijenja, pa osvježi',
      scrTry: 'korisnik pokušava oboje',
      removeWhenNotApplied: 'Ukloni kad se više ne primjenjuje',
      removeHint: 'radnja postaje Replace',
      applyOnce: 'Primijeni jednom',

      legPolicy: 'pravilo (ključ Policies)',
      legPref: 'preferenca (običan ključ)',
      legTattoo: 'tetovaža',
      legEmpty: 'nema vrijednosti',
      legWin: 'redak koji odlučuje',
      legChanged: 'promijenjeno',

      explain: '<p><em lang="en">Policy</em> (pravilo) iz administrativnih predložaka upisuje vrijednost u ključ <code>Policies</code> ' +
        '(<code>…\\Software\\Policies</code> ili <code>…\\CurrentVersion\\Policies</code>). Tim ključevima upravljaju pravila grupe: dok GPO vrijedi, ' +
        'vrijednost je ondje i aplikacija je poštuje (sučelje je zasivljeno ili javlja ograničenje); kad GPO više ne vrijedi, sljedeća obrada ' +
        'je briše i postavka se vraća na zadanu. Pravilo se ne „tetovira”.</p>' +
        '<p><em lang="en">Preference</em> (preferenca, ovdje stavka registra) upisuje vrijednost u običan ključ, kao da ju je postavio ' +
        'korisnik. Ne zaključava ništa: korisnik je može promijeniti, ali je svako osvježavanje upisuje ponovno. Kad GPO više ne vrijedi, ' +
        'vrijednost ostaje: <em lang="en">tattooing</em> (tetoviranje). Odspajanje GPO-a dakle ne poništava sve što je postavio.</p>' +
        '<p>Dvije opcije na kartici <em lang="en">Common</em> (zajedničko) mijenjaju to ponašanje: „Ukloni ovu stavku kad se više ne primjenjuje” briše ' +
        'vrijednost kad GPO prestane vrijediti (i postavlja radnju <em lang="en">Replace</em>); ne vraća raniju vrijednost. „Primijeni jednom ' +
        'i ne primjenjuj ponovno” upisuje vrijednost samo prvi put, pa korisnikova promjena ostaje.</p>' +
        '<p>Odlučuje mjesto, ne naziv: stari ADM predlošci koji pišu izvan ključeva <code>Policies</code> tetoviraju kao preference. ' +
        'Odspajanje djeluje tek pri sljedećem prolazu računala; ako se odspajanje i osvježavanje dogode u istoj minuti, osvježavanje već ' +
        'radi bez GPO-a.</p>'
    },

    en: {
      stage: 'A GPO with a policy and a preference, the registry of PC07, the events and the rule table',

      gpoKind: 'GPO',
      gpoLinked: 'linked to {ou}',
      gpoUnlinked: 'unlinked from {ou}',
      gpoFor: '{user} on {pc}',
      evTime: 't = {t} min',
      evLogon: 'logon',
      evUnlink: 'admin unlinks the GPO',
      evRefresh: 'refresh',
      evUnlinkRefresh: 'unlink + refresh',
      evEdit: '{user} changes the value',
      evTry: '{user} tries both',

      kindPolicy: 'policy',
      kindPref: 'preference',
      polPath: 'Administrative Templates › Control Panel',
      polSetting: 'Prohibit access to Control Panel and PC settings',
      polState: 'Enabled',
      prefPath: 'Preferences › Windows Settings › Registry',
      prefAction: 'action:',
      optRemove: 'Remove this item when it is no longer applied',
      optOnce: 'Apply once and do not reapply',
      writesTo: 'writes to the registry of {pc}',
      noValue: 'no value',
      outWrite: 'written',
      outSame: 'written again',
      outOverwrite: 'overwritten: {before} → {after}',
      outOnce: 'not reapplied',
      outRemove: 'deleted',
      outTattoo: 'stays: a tattoo',
      outNone: 'nothing to do',
      outWaits: 'waits for a refresh',
      outBlocked: 'attempt refused',
      outOpen: 'opens',
      outUntouched: 'unchanged',
      outUserSet: '{user}: {before} → {after}',
      userSees: 'What {user} sees',
      cpBlocked: 'Control Panel will not open (restriction)',
      cpOpen: 'Control Panel opens',
      proxyOn: 'Proxy mode in the app: {v}',
      proxyDefault: 'Proxy mode in the app: default',
      canChange: 'the user can change it',
      cannotChange: 'the user cannot change it',

      tableTitle: 'What a pass does with an item (first match)',
      colItem: '#',
      colApplies: 'GPO applies',
      colCond: 'Condition',
      colAct: 'Action',
      yes: 'yes',
      no: 'no',
      condPolicyKey: 'under Policies',
      condOutside: 'outside Policies (ADM)',
      condRemove: '"Remove…"',
      condOnce: '"Once", applied before',
      actWrite: 'write the value',
      actDeleteDefault: 'delete: default',
      actDelete: 'delete the value',
      actTattoo: 'leave it: tattoo',
      actKeep: 'leave the user\'s',
      markPass: '{time} · {event}',
      markNone: 'No pass in this step',
      markStart: 'Pass',
      markSkip: 'not read',

      capStart: 'GPO {gpo} holds one *policy* and one *preference*, both for {user} on {pc}. Nothing is applied yet; → starts the logon.',
      capLogon: 't = {t}, logon: both items are applied. The policy writes {pv} under a Policies key, the preference writes {fv} to an ' +
        'ordinary key, {key}.',
      capLogonReplace: 'With "Remove this item…" the action is *Replace*: delete and write again.',
      capLogonOnce: 'With "Apply once" this is the only time the preference is applied.',
      capUnlink: 't = {t}: the admin unlinks the GPO. Nothing changes on {pc} yet: both values stay until its next refresh.',
      capRefreshAt: 't = {t}, refresh:',
      capUnlinkRefresh: 't = {t}: the admin unlinks the GPO in the same minute as a refresh starts, so that refresh already runs ' +
        'without it:',
      capUnlinked: 'The GPO is unlinked:',
      capTattoo: 'the policy value under Policies is removed, but the preference {fv} stays — a *tattoo*.',
      capCpBack: 'Control Panel opens again.',
      capRemoved: 'the policy value is removed, and with "Remove this item when it is no longer applied" {name} ' +
        'is deleted too. Deleted, not set back to any earlier value: the app uses its default.',
      capEdit: 't = {t}: {user} sets {fv0} in the app. A *preference* allows that; {pv} is still under the Policies key.',
      capOverwrite: 'The user set 0; this refresh puts 1 back.',
      capOverwriteWhy: 'A preference is reapplied at every refresh.',
      capOverwriteReplace: 'Action *Replace*: deleted and written again.',
      capOnce: '"Apply once": {name} was applied at the logon, so it is not reapplied and the user\'s 0 stays.',
      capTry: 't = {t}: {user} tries to open Control Panel and gets the restriction message: the *policy* is enforced. In the app, ' +
        '{user} sets {fv0}: the preference allows that.',

      presetUnlink: 'Unlink the GPO',
      presetUnlinkHint: 'the policy goes, the preference stays',
      presetRemove: 'With "Remove…"',
      presetRemoveHint: 'the preference is deleted too',
      presetEdit: 'The user edits',
      presetEditHint: 'a refresh puts 1 back',
      presetOnce: 'Apply once',
      presetOnceHint: 'the user\'s 0 stays',
      presetLocked: 'The policy is locked',
      presetLockedHint: 'Control Panel refuses, the preference changes',

      script: 'After the logon',
      scrUnlink: 'unlink, then refresh',
      scrUnlinkAtRefresh: 'unlink at a refresh',
      scrEdit: 'user edits, then refresh',
      scrTry: 'user tries both',
      removeWhenNotApplied: 'Remove when no longer applied',
      removeHint: 'the action becomes Replace',
      applyOnce: 'Apply once',

      legPolicy: 'policy (Policies key)',
      legPref: 'preference (ordinary key)',
      legTattoo: 'tattooed',
      legEmpty: 'no value',
      legWin: 'deciding row',
      legChanged: 'changed',

      explain: '<p>An Administrative Templates <em>policy</em> writes its value under a <code>Policies</code> key ' +
        '(<code>…\\Software\\Policies</code> or <code>…\\CurrentVersion\\Policies</code>). Group Policy owns those keys: while the GPO ' +
        'applies, the value is there and the application obeys it (the setting is greyed out or a restriction message appears); when the ' +
        'GPO no longer applies, the next processing deletes it and the setting goes back to its default. A policy does not tattoo.</p>' +
        '<p>A <em>preference</em> (here a registry item) writes its value to an ordinary key, as if the user had set it. It locks ' +
        'nothing: the user can change it, but every refresh writes it again. When the GPO no longer applies, the value stays: ' +
        '<em>tattooing</em>. So removing a GPO does not undo everything it set.</p>' +
        '<p>Two options on the <em>Common</em> tab change this: "Remove this item when it is no longer applied" deletes the value when ' +
        'the GPO stops applying (and sets the action to <em>Replace</em>); it does not restore an earlier value. "Apply once and do not ' +
        'reapply" writes the value only the first time, so the user\'s change stays.</p>' +
        '<p>The location decides, not the name: old ADM templates that write outside the <code>Policies</code> keys tattoo like ' +
        'preferences. Unlinking takes effect only at the computer\'s next pass; when the unlink and a refresh fall in the same ' +
        'minute, that refresh already runs without the GPO.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
