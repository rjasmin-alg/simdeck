/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-terraform-drift, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other),
   *term* an English term the glossary lacks (the page sets it in italics, lang="en"; NOTES.md, "Term pairs").
   Addresses, IDs, attribute values, commands and the tool's own output lines are data, not language: the page puts
   them in translate="no". The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Konfiguracija, stanje i stvarna infrastruktura, s izlazom plana',

      script: 'Scenarij',
      showState: 'Stupac stanja',
      showStateHint: 'Skriven ili ne, plan ga i dalje koristi.',

      presetRevert: 'Ručna promjena',
      presetRevertHint: 'size ručno small → large, plan je vraća',
      presetDelete: 'Ručno obrisano',
      presetDeleteHint: 'DNS zapis obrisan mimo alata',
      presetCreate: 'Ručno stvoreno',
      presetCreateHint: 'pravilo rdp stvoreno mimo alata',
      presetLost: 'Izgubljen zapis',
      presetLostHint: 'state rm vm.web, pa plan i apply',
      presetAccept: 'Prihvati odmak',
      presetAcceptHint: 'apply -refresh-only, pa plan',
      presetEdit: 'Uredi konfiguraciju',
      presetEditHint: 'novi port, nova veličina, bez www',
      presetImport: 'Uvezi ručno stvoreno',
      presetImportHint: 'deklariraj rdp, plan, import, plan',

      legChanged: 'upisano u ovom koraku',
      legDiffers: 'stupci se ne slažu',
      legMissing: 'nema ga u stupcu',
      legCreate: 'stvori',
      legUpdate: 'promijeni na mjestu',
      legDelete: 'uništi',
      legReplace: 'zamijeni',
      legHand: 'ručno, mimo alata',

      colConfig: 'Konfiguracija',
      colConfigSub: 'željeno, kao kod',
      colState: 'Stanje',
      colStateSub: 'zapisano pri zadnjem apply',
      colReal: 'Stvarna infrastruktura',
      colRealSub: 'što API vraća sada',
      colPlan: 'Plan',
      stateHidden: 'Stanje je skriveno, ali i dalje postoji: plan uspoređuje upravo s njim.',

      notDeclared: 'nije deklarirano',
      notInState: 'nema ga u stanju',
      notReal: 'ne postoji',
      unmanaged: 'nitko ga ne prati',
      freshRead: 'osvježeno',
      freshGone: 'osvježavanje: nije pronađen',
      planWait: 'čeka razliku',
      planNone: 'ništa',
      actCreate: 'stvori',
      actUpdate: 'promijeni',
      actDelete: 'uništi',
      actReplace: 'zamijeni',

      outTitle: 'Izlaz',
      outEmpty: 'Još ništa nije pokrenuto.',
      phaseRefresh: 'faza 1 od 2: osvježavanje',
      phaseDiff: 'faza 2 od 2: razlika',
      phaseWrite: 'faza 2 od 2: upis u stanje',
      outsideHead: 'Napomena: objekti su promijenjeni izvan alata',
      handEdit: 'Ručno, u konzoli pružatelja: {id} {key} {from} → {to}',
      handDelete: 'Ručno, u konzoli pružatelja: obrisan {id}',
      handCreate: 'Ručno, u konzoli pružatelja: stvoren {id} ({name})',
      editHead: 'Uređena konfiguracija:',
      editSet: '{addr}: {key} {from} → {to}',
      editAdd: 'dodan blok {addr}',
      editRemove: 'uklonjen blok {addr}',

      capStartRevert: 'Konfiguracija deklarira tri resursa; stanje i stvarna infrastruktura još su prazni. Korak 1: apply ih stvara. Zatim netko ručno promijeni jedan od njih.',
      capStartDelete: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim netko ručno obriše DNS zapis.',
      capStartCreate: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim netko ručno doda još jedno pravilo vatrozida.',
      capStartLost: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim se iz stanja izbriše jedan zapis.',
      capStartAccept: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim ručnu promjenu pokušamo prihvatiti preko -refresh-only.',
      capStartEdit: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim mijenjamo samu konfiguraciju: plan pokazuje sva četiri znaka.',
      capStartImport: 'Konfiguracija deklarira tri resursa. Korak 1: apply ih stvara. Zatim netko ručno stvori pravilo, a mi ga pokušamo preuzeti.',

      capApplyCreate: 'apply je stvorio sva tri resursa i svaki zapisao u stanje: adresa → stvarni ID. Sva tri stupca se sada slažu.',
      capHandEdit: 'Netko je ručno, u konzoli pružatelja, promijenio {key} na {id} iz {from} u {to}. Alat to nije vidio: stanje i dalje kaže {from}. To je *drift* (odmak).',
      capHandDelete: 'Netko je ručno obrisao {id}. Stanje i dalje povezuje {addr} s tim ID-om.',
      capHandCreate: 'Netko je ručno stvorio pravilo {id}. Ono stvarno postoji, ali ga ne zna ni konfiguracija ni stanje.',
      capStateRm: 'state rm je natjerao alat da zaboravi {addr}. {id} i dalje radi; nestao je samo redak u stanju koji je pokazivao na njega.',
      capEdit: 'Konfiguracija sada kaže nešto drugo (označeno). Ništa stvarno se još nije promijenilo, a stanje drži ono što je upisao zadnji apply.',
      capEditAdd: 'Konfiguracija sada deklarira {addr}, s istim imenom i portom kao ručno stvoreno pravilo. Stanje o njemu ne zna ništa.',

      capRefreshChanged: 'Plan najprije osvježava: čita svaki objekt koji stanje zna, po njegovu ID-u. {addr} sada ima {key} = {to}, a stanje kaže {from}: promijenjen je izvan alata. Osvježena kopija ostaje u memoriji, ne sprema se.',
      capRefreshDeleted: 'Osvježavanje je tražilo {id} i nije ga našlo: {addr} je obrisan izvan alata i ispada iz planove kopije stanja.',
      capRefreshNone: ['Osvježavanje je pročitalo {n} objekt koji stanje zna; ništa se nije promijenilo izvan alata.', 'Osvježavanje je pročitalo {n} objekta koje stanje zna; ništa se nije promijenilo izvan alata.', 'Osvježavanje je pročitalo {n} objekata koje stanje zna; ništa se nije promijenilo izvan alata.'],
      capRefreshUnseen: 'Osvježavanje čita samo objekte iz stanja. {id} nije u stanju, pa ga plan nikad ni ne pita.',
      capROnlyRefresh: 'apply -refresh-only također počinje osvježavanjem i nalazi {key} = {to} na {addr}. Sljedeći korak: to što je pročitao upisuje u stanje, a ništa stvarno ne mijenja.',
      capROnlyWrite: 'Stanje sada kaže {key} = {to}: odmak je prihvaćen u stanje. Stvarna infrastruktura nije dirana.',

      capDiffRevert: 'Plan je najprije osvježio stanje i vidio da je {key} ručno promijenjen u {hand}. Konfiguracija i dalje kaže {want}, pa plan predlaže promjenu natrag.',
      capDiffStill: 'Stanje se sada slaže sa stvarnim ({key} = {hand}), pa osvježavanje nije našlo ništa izvana. Ali konfiguracija i dalje kaže {want}: plan i dalje predlaže vraćanje. Tek kad konfiguracija kaže {hand}, plan javlja No changes.',
      capDiffRecreate: 'Konfiguracija deklarira {addr}, a osvježeno stanje ga više nema: plan predlaže + stvaranje. apply bi napravio novi objekt s novim ID-om.',
      capDiffUnseen: 'No changes: konfiguracija i osvježeno stanje se slažu. {id} je i dalje u stvarnom stupcu, nitko ga ne prati: plan ne vidi ono što stanje ne zna. Pod upravljanje ga dovodi samo import.',
      capDiffClash: 'Plan predlaže + stvaranje {addr}: stanje nema zapis za njega, pa plan ne može znati da {id} s istim imenom već postoji. apply će pokušati stvoriti još jedan.',
      capDiffMixed: 'Plan uspoređuje uređenu konfiguraciju s osvježenim stanjem, resurs po resurs, redom adresa: adresa koja više nije deklarirana se uništava (−), novi port traži novo pravilo (−/+), a nova veličina mijenja se na mjestu (~).',
      capDiffImported: 'No changes: nakon uvoza stanje povezuje {addr} s ručno stvorenim pravilom, a njegovi atributi odgovaraju konfiguraciji. Pravilo je sada pod upravljanjem.',
      capDiffNone: 'No changes: konfiguracija i osvježeno stanje se slažu.',
      capDiffOther: 'Plan uspoređuje konfiguraciju s osvježenim stanjem i predlaže što bi stvarno uskladilo s konfiguracijom.',

      capApplyRevert: 'apply je vratio {key} na {want} na {id}, istom objektu. Ručne promjene više nema i sva tri stupca se opet slažu.',
      capApplyEdit: 'apply je uništio DNS zapis, zamijenio pravilo (novi ID {id}) i promijenio veličinu VM-a na mjestu. Stanje opet povezuje svaku adresu sa stvarnim objektom.',
      capApplyClash: 'apply nije uspio: {type} s imenom {name} već postoji ({id}). Ništa stvarno se nije promijenilo, stanje je kao prije. Pružatelj koji dopušta ista imena napravio bi duplikat.',
      capApplyOther: 'apply je proveo plan: stvarna infrastruktura i stanje sada odgovaraju konfiguraciji.',
      capImport: 'import je upisao {addr} → {id} u stanje, s atributima pročitanima iz stvarnog. Ništa stvarno se nije promijenilo.',

      explain: '<p><em lang="en">Declarative infrastructure</em> (deklarativna infrastruktura): konfiguracija opisuje što treba postojati, a alat ' +
        '(u NLA T31 Terraform ili OpenTofu) sam smisli korake. Za to drži treću stvar, <em lang="en">state</em> (stanje): ' +
        'za svaku adresu iz konfiguracije stvarni ID i atribute zapisane pri zadnjem <code>apply</code>.</p>' +
        '<p><code>plan</code> ide u dvije faze. <b>Osvježavanje</b> čita svaki objekt koji je u stanju i bilježi što je promijenjeno ' +
        'izvan alata. <b>Razlika</b> zatim uspoređuje konfiguraciju s tim osvježenim stanjem: <code>+</code> stvori, ' +
        '<code>~</code> promijeni na mjestu, <code>-</code> uništi, <code>-/+</code> zamijeni, kad atribut ne može ' +
        'promijeniti postojeći objekt. Plan ništa ne sprema; to radi <code>apply</code>.</p>' +
        '<p>Tri zablude: <b>plan ne uspoređuje konfiguraciju sa stvarnošću izravno</b>, nego sa stanjem nakon osvježavanja, pa ' +
        'ono što je ručno stvoreno ne vidi; <b>ručna promjena ne „ostaje”</b>, sljedeći <code>apply</code> je vraća ' +
        '(<code>-refresh-only</code> je samo upiše u stanje); <b>brisanje stanja nije bezopasno</b>: alat zaboravi objekte, ' +
        'plan predlaže nove, a <code>apply</code> pada na imenu ili napravi duplikat.</p>' +
        '<p>Izvan teme: dijeljeno stanje i zaključavanje, moduli, <code>ignore_changes</code>, GitOps (T35).</p>'
    },
    en: {
      stage: 'Configuration, state and real infrastructure, with the plan output',

      script: 'Scenario',
      showState: 'State column',
      showStateHint: 'Hidden or not, plan still uses it.',

      presetRevert: 'Hand change',
      presetRevertHint: 'size small → large by hand, plan reverts it',
      presetDelete: 'Deleted by hand',
      presetDeleteHint: 'the DNS record deleted outside the tool',
      presetCreate: 'Created by hand',
      presetCreateHint: 'rule rdp created outside the tool',
      presetLost: 'Lost state entry',
      presetLostHint: 'state rm vm.web, then plan and apply',
      presetAccept: 'Accept the drift',
      presetAcceptHint: 'apply -refresh-only, then plan',
      presetEdit: 'Edit the configuration',
      presetEditHint: 'new port, new size, no www',
      presetImport: 'Import a hand-made one',
      presetImportHint: 'declare rdp, plan, import, plan',

      legChanged: 'written in this step',
      legDiffers: 'columns disagree',
      legMissing: 'not in this column',
      legCreate: 'create',
      legUpdate: 'update in place',
      legDelete: 'destroy',
      legReplace: 'replace',
      legHand: 'by hand, outside the tool',

      colConfig: 'Configuration',
      colConfigSub: 'desired, as code',
      colState: 'State',
      colStateSub: 'recorded at the last apply',
      colReal: 'Real infrastructure',
      colRealSub: 'what the API returns now',
      colPlan: 'Plan',
      stateHidden: 'State is hidden, but it still exists: plan compares with exactly this.',

      notDeclared: 'not declared',
      notInState: 'not in state',
      notReal: 'does not exist',
      unmanaged: 'nobody tracks it',
      freshRead: 'refreshed',
      freshGone: 'refresh: not found',
      planWait: 'waits for the diff',
      planNone: 'nothing',
      actCreate: 'create',
      actUpdate: 'update',
      actDelete: 'destroy',
      actReplace: 'replace',

      outTitle: 'Output',
      outEmpty: 'Nothing has run yet.',
      phaseRefresh: 'phase 1 of 2: refresh',
      phaseDiff: 'phase 2 of 2: diff',
      phaseWrite: 'phase 2 of 2: write state',
      outsideHead: 'Note: Objects have changed outside of the tool',
      handEdit: 'By hand, in the provider\'s console: {id} {key} {from} → {to}',
      handDelete: 'By hand, in the provider\'s console: deleted {id}',
      handCreate: 'By hand, in the provider\'s console: created {id} ({name})',
      editHead: 'Configuration edited:',
      editSet: '{addr}: {key} {from} → {to}',
      editAdd: 'added block {addr}',
      editRemove: 'removed block {addr}',

      capStartRevert: 'The configuration declares three resources; state and real infrastructure are still empty. Step 1: apply creates them. Then someone changes one of them by hand.',
      capStartDelete: 'The configuration declares three resources. Step 1: apply creates them. Then someone deletes the DNS record by hand.',
      capStartCreate: 'The configuration declares three resources. Step 1: apply creates them. Then someone adds one more firewall rule by hand.',
      capStartLost: 'The configuration declares three resources. Step 1: apply creates them. Then one entry is removed from state.',
      capStartAccept: 'The configuration declares three resources. Step 1: apply creates them. Then we try to accept a hand change with -refresh-only.',
      capStartEdit: 'The configuration declares three resources. Step 1: apply creates them. Then we edit the configuration itself: plan shows all four symbols.',
      capStartImport: 'The configuration declares three resources. Step 1: apply creates them. Then someone creates a rule by hand, and we try to take it over.',

      capApplyCreate: 'apply created all three resources and recorded each in state: address → real ID. All three columns now agree.',
      capHandEdit: 'Someone changed {key} of {id} from {from} to {to} by hand, in the provider\'s console. The tool did not see it: state still says {from}. This is *drift*.',
      capHandDelete: 'Someone deleted {id} by hand. State still maps {addr} to that ID.',
      capHandCreate: 'Someone created the rule {id} by hand. It is real, but neither the configuration nor state knows it.',
      capStateRm: 'state rm made the tool forget {addr}. {id} still runs; only the line in state that pointed to it is gone.',
      capEdit: 'The configuration now says something else (highlighted). Nothing real has changed yet, and state holds what the last apply wrote.',
      capEditAdd: 'The configuration now declares {addr}, with the same name and port as the rule made by hand. State knows nothing of it.',

      capRefreshChanged: 'Plan first refreshes: it reads every object state knows, by its ID. {addr} now has {key} = {to}, while state says {from}: changed outside the tool. The refreshed copy stays in memory; it is not saved.',
      capRefreshDeleted: 'Refresh asked for {id} and got nothing: {addr} was deleted outside the tool and drops out of plan\'s copy of state.',
      capRefreshNone: ['Refresh read the {n} object state knows; nothing changed outside the tool.', 'Refresh read the {n} objects state knows; nothing changed outside the tool.'],
      capRefreshUnseen: 'Refresh reads only the objects in state. {id} is not in state, so plan never even asks about it.',
      capROnlyRefresh: 'apply -refresh-only also starts with a refresh, and finds {key} = {to} on {addr}. Next step: it writes what it read into state, and changes nothing real.',
      capROnlyWrite: 'State now says {key} = {to}: the drift is accepted into state. Real infrastructure was not touched.',

      capDiffRevert: 'Plan first refreshed state and saw that {key} was changed by hand to {hand}. The configuration still says {want}, so plan proposes changing it back.',
      capDiffStill: 'State now agrees with real ({key} = {hand}), so refresh found nothing outside. Yet the configuration still says {want}: plan still proposes changing it back. Only when the configuration says {hand} does plan report No changes.',
      capDiffRecreate: 'The configuration declares {addr}, but refreshed state no longer has it: plan proposes + create. apply would make a new object with a new ID.',
      capDiffUnseen: 'No changes: configuration and refreshed state agree. {id} is still in the real column, tracked by nobody: plan cannot see what state does not know. Only import brings it under management.',
      capDiffClash: 'Plan proposes + create {addr}: state has no entry for it, so plan cannot know that {id} with the same name already exists. apply will try to create another one.',
      capDiffMixed: 'Plan compares the edited configuration with refreshed state, resource by resource in address order: an address no longer declared is destroyed (−), a new port needs a new rule (−/+), and a new size changes in place (~).',
      capDiffImported: 'No changes: after import, state maps {addr} to the rule made by hand, and its attributes match the configuration. The rule is now managed.',
      capDiffNone: 'No changes: configuration and refreshed state agree.',
      capDiffOther: 'Plan compares the configuration with refreshed state and proposes what would make real match the configuration.',

      capApplyRevert: 'apply set {key} back to {want} on {id}, the same object. The hand change is gone, and all three columns agree again.',
      capApplyEdit: 'apply destroyed the DNS record, replaced the rule (new ID {id}) and resized the VM in place. State again maps every address to a real object.',
      capApplyClash: 'apply failed: a {type} named {name} already exists ({id}). Nothing real changed, and state is as before. A provider that allows equal names would have made a duplicate.',
      capApplyOther: 'apply carried out the plan: real infrastructure and state now match the configuration.',
      capImport: 'import wrote {addr} → {id} into state, with the attributes read from real. Nothing real changed.',

      explain: '<p><em lang="en">Declarative infrastructure</em>: the configuration says what should exist, and the tool (in NLA T31, ' +
        'Terraform or OpenTofu) works out the steps. For that it keeps a third thing, <em lang="en">state</em>: for every ' +
        'address in the configuration, the real ID and the attributes recorded at the last <code>apply</code>.</p>' +
        '<p><code>plan</code> runs in two phases. <b>Refresh</b> reads every object that is in state and notes what changed ' +
        'outside the tool. The <b>diff</b> then compares the configuration with that refreshed state: <code>+</code> create, ' +
        '<code>~</code> update in place, <code>-</code> destroy, <code>-/+</code> replace, when an attribute cannot change on ' +
        'an existing object. Plan saves nothing; <code>apply</code> does.</p>' +
        '<p>Three misconceptions: <b>plan does not compare configuration with reality directly</b>, but with state after the ' +
        'refresh, so it cannot see what was made by hand; <b>a hand change does not "stick"</b>, the next <code>apply</code> ' +
        'reverts it (<code>-refresh-only</code> only writes it into state); <b>deleting state is not a harmless reset</b>: ' +
        'the tool forgets the objects, plan proposes new ones, and <code>apply</code> fails on the name or makes a ' +
        'duplicate.</p>' +
        '<p>Out of scope: shared remote state and locking, modules, <code>ignore_changes</code>, GitOps (T35).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
