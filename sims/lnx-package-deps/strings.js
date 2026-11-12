/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-package-deps, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term
   (first mention; [[=term]] later ones). Package names, capabilities, repository ids, versions, commands and the
   package manager's own output lines are data: the page puts them in translate="no" elements. The title and
   subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Repozitoriji, razrješavanje ovisnosti i instalirani paketi',

      // params
      request: 'Naredba',
      'req_install-htop': 'instaliraj htop',
      'req_remove-htop': 'ukloni htop',
      'req_install-tmux': 'instaliraj tmux',
      'req_install-mta-b': 'instaliraj mta-b',
      epel: 'repozitorij epel uključen',
      keepLibs: 'instaliran je i hwloc (treba hwloc-libs)',

      // presets
      'preset_htop-epel': 'Iz knjige: htop',
      'preset_htop-epel_hint': 'htop iz epel-a vuče dva paketa iz baseos-a',
      'preset_epel-off': 'epel isključen',
      'preset_epel-off_hint': 'nijedan uključeni repozitorij nema htop',
      'preset_remove-htop': 'Ukloni htop',
      'preset_remove-htop_hint': 's njim odlaze i nekorištene ovisnosti',
      'preset_remove-kept': 'Ukloni htop, hwloc ostaje',
      'preset_remove-kept_hint': 'hwloc-libs još netko treba, pa ostaje',
      'preset_already-there': 'Sve već tu: tmux',
      'preset_already-there_hint': 'knjižnice su instalirane, plan ima jedan paket',
      preset_conflict: 'Sukob',
      preset_conflict_hint: 'mta-b je u sukobu s instaliranim mta-a',

      // legend
      legRequested: 'traženi paket',
      legDep: 'ovisnost',
      legCap: 'sposobnost',
      legSatisfied: 'zadovoljeno',
      legConflict: 'u sukobu',
      legInstalled: 'instalirano',
      legErased: 'za brisanje',
      legChanged: 'promijenjeno',

      // repositories
      repos: 'Repozitoriji',
      prio: '{key} {n}',
      meta_cached: 'metapodaci: spremljeni',
      meta_new: 'metapodaci: još nisu preuzeti',
      meta_downloaded: 'metapodaci: upravo preuzeti',
      meta_off: 'isključen: ne čita se',
      cand: 'kandidat',
      chosenTag: 'izabran',

      // resolver
      resolver: 'Razrješavanje ovisnosti',
      workList: 'Još treba zadovoljiti',
      workEmpty: 'popis je prazan',
      byReq: 'zahtjev',
      action: 'Zadnji korak',
      idle: 'Još ništa: pritisni →.',
      satisfiedBy: 'zadovoljava instalirani {pkg}',
      satisfiedPlan: 'zadovoljava {pkg} iz plana',
      noProvider: 'nitko ne pruža',
      rejected: 'u sukobu s {pkg}',
      decided: 'odlučilo: {key}',
      key_installed: 'već instaliran',
      key_priority: 'niži priority',
      key_name: 'ime jednako sposobnosti',
      key_version: 'viša verzija',
      key_alpha: 'abecedno ime',
      act_remove: 'ide pod Removing:',
      act_unused: 'nitko ga više ne treba',
      act_keptNeeded: 'treba ga {pkg}: ostaje',
      act_keptUser: 'instalirao ga korisnik: ostaje',
      act_going: 'već u planu za brisanje',
      act_summary: 'plan je gotov',
      act_order: 'redoslijed',
      act_execute: 'izvedeno',
      act_aborted: 'prekinuto, ništa promijenjeno',
      plan: 'Plan transakcije',
      planEmpty: 'prazan',

      // installed
      installed: 'Instalirano (baza rpm)',
      reason_user: 'user',
      reason_dep: 'dep',
      reasonHint_user: 'instalirao korisnik',
      reasonHint_dep: 'došao kao ovisnost',

      pkgs: ['{n} paket', '{n} paketa', '{n} paketa'],
      removedCount: ['uklonjen je {n} paket', 'uklonjena su {n} paketa', 'uklonjeno je {n} paketa'],

      // captions
      capStart_install: 'Naredba: instaliraj {name}. Upravitelj paketima stavlja {name} na popis i traži paket koji to pruža: ' +
        'repozitoriji su lijevo, instalirani paketi desno.',
      capStart_remove: 'Naredba: ukloni {name}. Najprije {name} ide pod Removing:, a onda za svaku njegovu ovisnost ' +
        'slijedi pitanje treba li je još netko.',
      metaNote: 'Najprije se preuzimaju metapodaci repozitorija {repo}, jer ih još nema; za ostale se koriste spremljeni.',
      cap_chosen: 'I ime paketa je sposobnost, jer svaki paket pruža svoje ime: {pkg} iz {repo}-a ide pod Installing:.',
      cap_chosenDep: '{by} traži sposobnost {cap}; pruža je paket {pkg} iz {repo}-a, pa ide pod Installing dependencies:.',
      cap_chosenCross: '{by} traži sposobnost {cap}. Nju ne pruža {byRepo} nego paket {pkg} iz {repo}-a: ovisnosti ne ' +
        'poštuju granicu repozitorija.',
      thenReqs: 'Njegovi zahtjevi idu na popis: {reqs}.',
      thenNoReqs: 'Ne traži ništa više.',
      keyNote: 'Više paketa to pruža; odlučilo je: {key}.',
      cap_installedReq: '{pkg} je već instaliran: ✓, plan ne raste.',
      cap_installed: '{by} traži sposobnost {cap}. Već instalirani {pkg} je pruža: ✓, plan ne raste.',
      cap_planned: '{by} traži {cap}, a pruža je {pkg}, koji je već u planu: ✓, ništa se ne dodaje.',
      cap_nomatch: 'Nijedan uključeni repozitorij nema paket koji pruža {cap}, pa transakcija staje s porukom {msg}.',
      offNote: '{pkg} postoji u repozitoriju {repo}, ali on je isključen i njegovi se metapodaci ne čitaju.',
      cap_nothing: '{by} traži {cap}, a to ne pruža nijedan paket u uključenim repozitorijima: transakcija staje.',
      cap_conflictAll: 'Svi paketi koji pružaju {cap} u sukobu su s paketom {with}, koji je {where}, pa transakcija ' +
        'staje s porukom Problem.',
      cap_conflict: 'Jedini paket koji pruža {cap} je {pkg}, a on je u sukobu s paketom {with}, koji je {where}. Drugog ' +
        'kandidata nema, pa transakcija staje s porukom Problem.',
      whereInstalled: 'već instaliran',
      wherePlanned: 'već u planu',
      sharedNote: 'Oba pružaju {shared}: dva programa za isti posao.',
      cap_remove: '{pkg} ide pod Removing:. Za svaku njegovu ovisnost slijedi pitanje treba li je još netko: {reqs}.',
      cap_removeNoReq: '{pkg} ide pod Removing:. Nema ovisnosti koje bi trebalo provjeriti.',
      cap_unused: '{pkg} pruža {cap}. Došao je kao ovisnost (dep) i ništa što ostaje ne traži ga, pa ide pod Removing ' +
        'unused dependencies:.',
      cap_keptNeeded: '{pkg} pruža {cap}. Došao je kao ovisnost, ali ga {needer} još traži, pa ostaje, a zahtjevi ' +
        'paketa {pkg} ne provjeravaju se.',
      cap_keptUser: '{pkg} pruža {cap}, ali ga je instalirao korisnik (user): ostaje.',
      cap_going: '{cap} pruža {pkg}, koji je već u planu za brisanje.',
      cap_none: 'Nijedan instalirani paket ne pruža {cap}; nema što provjeriti.',
      cap_notinstalled: '{cap} nije instaliran: nema što ukloniti.',
      cap_aborted: 'Ništa nije preuzeto ni promijenjeno: instalirani paketi isti su kao prije naredbe.',
      abortedConflict: 'Da bi {pkg} ušao, {with} bi morao otići, a to je druga, veća transakcija.',
      cap_summaryInstall: 'Ovisnosti su razriješene: {count}, od toga {deps} kao ovisnosti. Još ništa nije ' +
        'instalirano: ovo je plan.',
      cap_summaryInstallOne: 'Ovisnosti su razriješene: samo {name}, bez odjeljka Installing dependencies:, jer je sve ' +
        'što traži već instalirano. Još ništa nije instalirano.',
      cap_summaryRemove: 'Plan uklanjanja: {count}, od toga {deps} kao nekorištene ovisnosti. Još ništa nije uklonjeno.',
      cap_summaryRemoveOne: 'Plan uklanjanja: samo {name}. Još ništa nije uklonjeno.',
      cap_nothingToDo: 'Sve je već tu: transakcija nema što izvesti.',
      cap_orderInstall: 'Redoslijed: paket ulazi nakon paketa koje traži, pa {first} ide prvi, a {last} zadnji.',
      cap_orderRemove: 'Redoslijed brisanja je obrnut: paket odlazi prije paketa koje traži, pa {first} ide prvi, a ' +
        '{last} zadnji.',
      cap_orderOne: 'Redoslijed: jedan paket, {name}.',
      cap_executeInstall: 'Izvedeno: {count} u bazi rpm. {name} je označen kao korisnikov (user), ostali kao ' +
        'ovisnosti (dep); po tome će ih uklanjanje jednom prepoznati.',
      cap_executeInstallOne: 'Izvedeno: {name} je u bazi rpm, označen kao korisnikov (user).',
      cap_executeRemove: 'Izvedeno: {count}. Ovisnosti nisu ostale: došle su samo kao ovisnosti i više ' +
        'ih nitko ne treba.',
      cap_executeRemoveOne: 'Izvedeno: uklonjen je samo {name}.',
      keptNoteBare: '{kept} ostaje jer ga {needer} treba.',
      keptNote: '{kept} ostaje jer ga {needer} treba; ostaje i {reqs}, koji {kept} traži.',

      explain:
        '<p>[[package manager]] ne kopira datoteke nego instalira [[package]]: datoteku sa zaglavljem u kojem piše što ' +
        'paket pruža (<code>Provides</code>), što zahtijeva (<code>Requires</code>) i s čime je u sukobu ' +
        '(<code>Conflicts</code>). Svaki [[repository]] te podatke objavljuje kao metapodatke (<i>metadata</i>), i to ' +
        'svaki svoje: za repozitorij koji je upravo uključen najprije se preuzme njegov popis.</p>' +
        '<p>[[dependency]] ne imenuje paket nego [[capability]]: ime knjižnice, datoteku ili ime paketa. ' +
        'Upravitelj paketima ih pri razrješavanju uzima jednu po jednu s popisa. Ako je instalirani ili planirani paket već pruža, to je ✓ i ništa se ne ' +
        'dodaje; inače bira pružatelja iz uključenih repozitorija i njegove zahtjeve stavlja na popis. Kad istu ' +
        '[[=capability]] pruža više paketa, odlučuje redom: niži <code>priority</code> repozitorija, ime jednako ' +
        'sposobnosti, viša verzija, abecedno ime (pojednostavljeno). Kandidat koji je u sukobu (<i>conflict</i>) s ' +
        'instaliranim ili planiranim paketom otpada; ako drugog nema, [[transaction]] staje i ništa se ne mijenja. ' +
        'Na kraju paket ulazi nakon onih koje traži, a pri uklanjanju odlazi prije njih.</p>' +
        '<p>Tri zablude. [[=dependency]] ne imenuje drugi paket: <code>htop</code> traži ' +
        '<code>libhwloc.so.15</code>, a ne <code>hwloc-libs</code>. Uklanjanje paketa ne ostavlja sve njegove ' +
        'ovisnosti: one koje su došle samo kao ovisnosti i više ih nitko ne treba odlaze s njim. Jedan repozitorij ' +
        'nije zatvoren svijet: <code>htop</code> iz <code>epel</code>-a vuče dva paketa iz <code>baseos</code>-a.</p>'
    },

    en: {
      stage: 'Repositories, the dependency resolver and the installed packages',

      request: 'Command',
      'req_install-htop': 'install htop',
      'req_remove-htop': 'remove htop',
      'req_install-tmux': 'install tmux',
      'req_install-mta-b': 'install mta-b',
      epel: 'epel repository enabled',
      keepLibs: 'hwloc is installed too (needs hwloc-libs)',

      'preset_htop-epel': 'From the book: htop',
      'preset_htop-epel_hint': 'htop from epel pulls two packages from baseos',
      'preset_epel-off': 'epel disabled',
      'preset_epel-off_hint': 'no enabled repository has htop',
      'preset_remove-htop': 'Remove htop',
      'preset_remove-htop_hint': 'its unused dependencies go with it',
      'preset_remove-kept': 'Remove htop, hwloc stays',
      'preset_remove-kept_hint': 'something still needs hwloc-libs, so it stays',
      'preset_already-there': 'All there: tmux',
      'preset_already-there_hint': 'its libraries are installed; the plan has one package',
      preset_conflict: 'Conflict',
      preset_conflict_hint: 'mta-b conflicts with the installed mta-a',

      legRequested: 'requested package',
      legDep: 'dependency',
      legCap: 'capability',
      legSatisfied: 'satisfied',
      legConflict: 'conflicting',
      legInstalled: 'installed',
      legErased: 'to be erased',
      legChanged: 'changed',

      repos: 'Repositories',
      prio: '{key} {n}',
      meta_cached: 'metadata: cached',
      meta_new: 'metadata: not downloaded yet',
      meta_downloaded: 'metadata: just downloaded',
      meta_off: 'disabled: not read',
      cand: 'candidate',
      chosenTag: 'chosen',

      resolver: 'Resolver',
      workList: 'Still to satisfy',
      workEmpty: 'the list is empty',
      byReq: 'request',
      action: 'Last step',
      idle: 'Nothing yet: press →.',
      satisfiedBy: 'satisfied by the installed {pkg}',
      satisfiedPlan: 'satisfied by {pkg} in the plan',
      noProvider: 'nothing provides it',
      rejected: 'conflicts with {pkg}',
      decided: 'decided by: {key}',
      key_installed: 'already installed',
      key_priority: 'lower priority',
      key_name: 'name equals the capability',
      key_version: 'higher version',
      key_alpha: 'alphabetical name',
      act_remove: 'goes under Removing:',
      act_unused: 'nothing needs it any more',
      act_keptNeeded: '{pkg} needs it: stays',
      act_keptUser: 'installed by the user: stays',
      act_going: 'already planned for erasing',
      act_summary: 'the plan is complete',
      act_order: 'the order',
      act_execute: 'executed',
      act_aborted: 'stopped, nothing changed',
      plan: 'Transaction plan',
      planEmpty: 'empty',

      installed: 'Installed (rpm database)',
      reason_user: 'user',
      reason_dep: 'dep',
      reasonHint_user: 'installed by the user',
      reasonHint_dep: 'came as a dependency',

      pkgs: ['{n} package', '{n} packages'],
      removedCount: ['{n} package removed', '{n} packages removed'],

      capStart_install: 'Command: install {name}. The resolver puts {name} on its list and looks for a package that ' +
        'provides it: repositories on the left, installed packages on the right.',
      capStart_remove: 'Command: remove {name}. First {name} goes under Removing:, then for each of its dependencies ' +
        'the question is whether anything still needs it.',
      metaNote: 'First the metadata of {repo} is downloaded, since there is none yet; the others use their cached copy.',
      cap_chosen: 'A package name is a capability too, since every package provides its own name: {pkg} from {repo} goes ' +
        'under Installing:.',
      cap_chosenDep: '{by} requires the capability {cap}; package {pkg} from {repo} provides it and goes under ' +
        'Installing dependencies:.',
      cap_chosenCross: '{by} requires the capability {cap}. It is provided not by {byRepo} but by {pkg} from {repo}: ' +
        'dependencies don\'t respect repository boundaries.',
      thenReqs: 'Its requirements join the list: {reqs}.',
      thenNoReqs: 'It requires nothing more.',
      keyNote: 'Several packages provide it; decided by: {key}.',
      cap_installedReq: '{pkg} is already installed: ✓, the plan does not grow.',
      cap_installed: '{by} requires the capability {cap}. The installed {pkg} already provides it: ✓, the plan does ' +
        'not grow.',
      cap_planned: '{by} requires {cap}, and {pkg}, already in the plan, provides it: ✓, nothing is added.',
      cap_nomatch: 'No enabled repository has a package that provides {cap}, so the transaction stops with {msg}.',
      offNote: '{pkg} is in the {repo} repository, but that one is disabled and its metadata is not read.',
      cap_nothing: '{by} requires {cap}, and no package in the enabled repositories provides it: the transaction stops.',
      cap_conflictAll: 'Every package that provides {cap} conflicts with {with}, which is {where}, so the ' +
        'transaction stops with a Problem.',
      cap_conflict: 'The only package that provides {cap} is {pkg}, and it conflicts with {with}, which is {where}. There ' +
        'is no other candidate, so the transaction stops with a Problem.',
      whereInstalled: 'already installed',
      wherePlanned: 'already in the plan',
      sharedNote: 'Both provide {shared}: two programs for the same job.',
      cap_remove: '{pkg} goes under Removing:. For each of its dependencies the question is whether anything still ' +
        'needs it: {reqs}.',
      cap_removeNoReq: '{pkg} goes under Removing:. It has no dependencies to check.',
      cap_unused: '{pkg} provides {cap}. It came as a dependency (dep) and nothing that stays requires it, so it goes ' +
        'under Removing unused dependencies:.',
      cap_keptNeeded: '{pkg} provides {cap}. It came as a dependency, but {needer} still requires it, so it stays, and ' +
        'its own requirements are not checked.',
      cap_keptUser: '{pkg} provides {cap}, but the user installed it (user): it stays.',
      cap_going: '{cap} is provided by {pkg}, which is already planned for erasing.',
      cap_none: 'No installed package provides {cap}; nothing to check.',
      cap_notinstalled: '{cap} is not installed: nothing to remove.',
      cap_aborted: 'Nothing was downloaded or changed: the installed packages are the same as before the command.',
      abortedConflict: 'For {pkg} to go in, {with} would have to go, and that is another, larger transaction.',
      cap_summaryInstall: 'Dependencies resolved: {count}, {deps} of them as dependencies. Nothing is installed yet: ' +
        'this is the plan.',
      cap_summaryInstallOne: 'Dependencies resolved: only {name}, with no Installing dependencies: section, because ' +
        'everything it requires is already installed. Nothing is installed yet.',
      cap_summaryRemove: 'Removal plan: {count}, {deps} of them unused dependencies. Nothing is removed yet.',
      cap_summaryRemoveOne: 'Removal plan: only {name}. Nothing is removed yet.',
      cap_nothingToDo: 'Everything is already there: the transaction has nothing to do.',
      cap_orderInstall: 'Order: a package goes in after the packages it requires, so {first} goes first and {last} last.',
      cap_orderRemove: 'The erase order is reversed: a package goes before the packages it requires, so {first} goes ' +
        'first and {last} last.',
      cap_orderOne: 'Order: one package, {name}.',
      cap_executeInstall: 'Done: {count} in the rpm database. {name} is marked as the user\'s (user), the others as ' +
        'dependencies (dep); that is how a removal will one day recognise them.',
      cap_executeInstallOne: 'Done: {name} is in the rpm database, marked as the user\'s (user).',
      cap_executeRemove: 'Done: {count}. The dependencies did not stay behind: they came only as dependencies ' +
        'and nothing needs them any more.',
      cap_executeRemoveOne: 'Done: only {name} is removed.',
      keptNoteBare: '{kept} stays because {needer} needs it.',
      keptNote: '{kept} stays because {needer} needs it, and so does {reqs}, which {kept} requires.',

      explain:
        '<p>A [[package manager]] does not copy files; it installs a [[package]]: a file with a header that says what ' +
        'the package provides (<code>Provides</code>), what it requires (<code>Requires</code>) and what it conflicts ' +
        'with (<code>Conflicts</code>). Each [[repository]] publishes this as its metadata, each its own: a repository ' +
        'that has just been enabled first has its list downloaded.</p>' +
        '<p>A [[dependency]] names not a package but a [[capability]]: a library name, a file or a package name. The ' +
        'resolver takes them off its list one at a time. If an installed or planned package already provides it, ' +
        'that is ✓ and nothing is added; otherwise it picks a provider from the enabled repositories and puts that ' +
        'one\'s requirements on the list. When several packages provide the same [[=capability]], it decides in ' +
        'order: the repository\'s lower <code>priority</code>, the name equal to the capability, the higher version, ' +
        'the alphabetical name (simplified). A candidate in conflict with an installed or planned package is out; if ' +
        'no other is left, the [[transaction]] stops and nothing changes. At the end a package goes in after the ' +
        'packages it requires, and on removal it goes before them.</p>' +
        '<p>Three misconceptions. A [[=dependency]] does not name another package: <code>htop</code> requires ' +
        '<code>libhwloc.so.15</code>, not <code>hwloc-libs</code>. Removing a package does not leave all its ' +
        'dependencies behind: those that came only as dependencies and that nothing needs any more go with it. One ' +
        'repository is not a closed world: <code>htop</code> from <code>epel</code> pulls two packages from ' +
        '<code>baseos</code>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
