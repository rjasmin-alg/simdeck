/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-wsus-cloned-id, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). *term* marks an English term
   the page sets in italics; none of this sim's terms is in kit/glossary.js yet, so the Croatian pairs are written out
   here (NOTES.md, "Term pairs"). Names (PC-01, KB-C, WSUS), IDs, IPs and times are data, filled in by the page.
   The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Klonirana računala i WSUS-ova konzola',

      // params
      clones: 'Broj klonova',
      generalised: 'Slika generalizirana prije snimanja',
      pc02Missing: 'PC-02 nema KB-C',
      reset: 'Obriši oznaku na PC-02',
      resetHint: 'PC-02 dobiva novu oznaku klijenta u sljedećem koraku.',

      // presets
      presetOneRow: 'Jedan redak',
      presetOneRowHint: 'Tri klona, jedna oznaka: ime u retku mijenja se PC-01 → PC-02 → PC-03.',
      presetFalseGreen: 'Lažno zeleno',
      presetFalseGreenHint: 'PC-02 nema KB-C, a izvještaj nakon 09:40 kaže da je sve zakrpano.',
      presetResetOne: 'Nova oznaka za PC-02',
      presetResetOneHint: 'Nakon brisanja oznake PC-02 dobiva svoj redak; PC-01 i PC-03 i dalje dijele jedan.',
      presetGeneralised: 'Generalizirana slika',
      presetGeneralisedHint: 'Svaki klon stvara svoju oznaku: tri retka od prvih javljanja.',

      // legend
      legendId: 'oznaka klijenta (boja, uzorak, znakovi)',
      legendArrow: 'javljanje u ovom koraku',
      legendOld: 'ranije javljanje',
      legendChanged: 'promijenjeno u ovom koraku',

      // stage
      monday: 'ponedjeljak',
      clients: 'Klonirana računala',
      image: 'Slika diska',
      imageFrom: 'snimljena s računala na kojem je klijent za ažuriranje već radio',
      imageKeeps: 'nije generalizirana: oznaka ostaje u slici',
      imageGen: 'generalizirana: oznaka uklonjena',
      noId: 'bez oznake',
      notDeployed: 'još nije postavljen',
      kbOk: 'KB-C instaliran',
      kbMissing: 'KB-C nedostaje',
      reportedAt: 'javio se {t}',
      notReported: 'nije se još javio',
      hiddenBy: 'u konzoli kao {pc}',
      console: 'WSUS · konzola · računala',
      colId: 'Oznaka',
      colName: 'Računalo',
      colIp: 'IP',
      colLast: 'Zadnje javljanje',
      colKb: 'KB-C',
      stNeeded: 'potreban',
      stInstalled: 'instaliran',
      empty: 'Nijedno se računalo još nije javilo.',
      sumConsole: 'Konzola',
      sumTruth: 'Na računalima',
      sumRows: ['{n} računalo', '{n} računala', '{n} računala'],
      sumMachines: ['{n} računalo', '{n} računala', '{n} računala'],
      sumInstalled: 'KB-C instaliran: {n}',
      sumNeeded: 'KB-C potreban: {n}',
      sumMissing: 'bez KB-C: {n}',
      falseGreen: 'izvještaj laže',

      // captions
      capStart: 'Slika diska snimljena je s računala na kojem je klijent za ažuriranje već radio (javljao se WSUS-u), pa u sebi nosi njegov *client ID* (oznaku klijenta) {id}. Pritisni → i postavi klonove.',
      capStartGen: 'Slika diska je prije snimanja *generalised* (generalizirana): oznaka klijenta {id} je uklonjena. Pritisni → i postavi klonove.',
      capDeploy: 'U {t} iz slike {n}. Svi imaju istu oznaku {id}: kopirana je zajedno s diskom.',
      capDeployGen: 'U {t} iz slike {n}. Svaki pri prvom pokretanju stvara svoju oznaku: {ids}.',
      capDeployN: ['pokreće se {n} klon', 'pokreću se {n} klona', 'pokreće se {n} klonova'],
      capNew: '{pc} javlja stanje u {t}. WSUS ne poznaje oznaku {id}, pa dodaje novi redak: {pc}.',
      capOverwrite: '{pc} javlja stanje u {t}. Ima isti *client ID* (oznaku klijenta) kao {prev}, pa WSUS prepisuje isti redak — {prev} je „nestao”.',
      capOverwriteOld: '{pc} javlja stanje u {t} i prepisuje redak {id}, u kojem je bilo javljanje {prev} od prije brisanja oznake.',
      capFlip: 'Stanje KB-C u retku: {a} → {b}.',
      capFalseGreen: 'Izvještaj kaže da je sve zakrpano — ali to je stanje {pc}. {miss} zakrpu nema.',
      capHides1: 'Redak sada skriva {pcs}, iako je upaljeno i javilo se.',
      capHidesN: 'Redak sada skriva {pcs}, iako su upaljena i javila su se.',
      capReset: 'U {t} administrator na {pc} briše oznaku klijenta: {pc} dobiva novu, {id}. Redak {old} ostaje; novi redak nastaje tek kad se {pc} javi.',
      capResetEarly: 'U {t} administrator na {pc} briše oznaku klijenta: {pc} dobiva novu, {id}, i javit će se s njom.',
      capResetRejected: 'U {t} klonovi još ne postoje: na {pc} se nema što obrisati. Ništa se ne mijenja.',
      capAfterReset: '{pc} se javlja u {t} s novom oznakom {id}: u konzoli je novi redak, {pc} sa svojim stanjem.',
      capStillHas: '{pcs} i dalje ima oznaku {old}: redak će ga opet pokazati pri njegovu sljedećem javljanju.',
      capStillShare: '{pcs} i dalje dijele oznaku {old}.',
      capStale: 'Stari redak {old} s imenom {pc} ostaje dok ga netko ne obriše ili ga čišćenje ne ukloni: {pc} je u konzoli dvaput.',
      capAllRows: 'Svako računalo ima svoj redak.',
      and: ' i ',

      explain: '<p>WSUS ne prepoznaje računalo po imenu, nego po <em lang="en">client ID</em> (oznaci klijenta), koju Windows ' +
        'stvara jednom po instalaciji. Konzola ima jedan redak po oznaci; svako javljanje stanja prepisuje u tom retku ime, ' +
        'IP i stanje zakrpa.</p>' +
        '<p>Oznaka je zapisana na disku, pa se kopira s njim. <em lang="en">Clone</em> (klon) slike snimljene s računala koje se ' +
        'već javilo WSUS-u nosi istu oznaku kao i svi ostali klonovi: u konzoli se vidi samo onaj koji se zadnji javio, ' +
        'a izvještaj o zakrpama pokazuje njegovo stanje. Računala koja „nedostaju” nisu ugašena.</p>' +
        '<p>Lijek: sliku prije snimanja <em lang="en">generalise</em> (generalizirati), pa svaki klon stvori svoju oznaku pri prvom ' +
        'pokretanju. Na već postavljenim klonovima oznaku treba obrisati na svakom računalu; brisanje na jednom odvaja samo njega. ' +
        'Dvostruki lokalni SID računala ima isti uzrok, ali je zaseban problem.</p>'
    },
    en: {
      stage: 'Cloned computers and the WSUS console',

      // params
      clones: 'Number of clones',
      generalised: 'Image generalised before capture',
      pc02Missing: 'PC-02 lacks KB-C',
      reset: 'Reset the client ID on PC-02',
      resetHint: 'PC-02 gets a new client ID in the next step.',

      // presets
      presetOneRow: 'One row',
      presetOneRowHint: 'Three clones, one ID: the row\'s name goes PC-01 → PC-02 → PC-03.',
      presetFalseGreen: 'False green',
      presetFalseGreenHint: 'PC-02 lacks KB-C, and after 09:40 the report says everything is patched.',
      presetResetOne: 'A new ID for PC-02',
      presetResetOneHint: 'After the reset PC-02 gets its own row; PC-01 and PC-03 still share one.',
      presetGeneralised: 'Generalised image',
      presetGeneralisedHint: 'Each clone creates its own ID: three rows from the first reports.',

      // legend
      legendId: 'client ID (colour, pattern, characters)',
      legendArrow: 'report in this step',
      legendOld: 'earlier report',
      legendChanged: 'changed in this step',

      // stage
      monday: 'Monday',
      clients: 'Cloned computers',
      image: 'Disk image',
      imageFrom: 'captured from a computer whose update client had already run',
      imageKeeps: 'not generalised: the ID stays in the image',
      imageGen: 'generalised: the ID is removed',
      noId: 'no ID',
      notDeployed: 'not deployed yet',
      kbOk: 'KB-C installed',
      kbMissing: 'KB-C missing',
      reportedAt: 'reported {t}',
      notReported: 'has not reported yet',
      hiddenBy: 'shown as {pc} in the console',
      console: 'WSUS · console · computers',
      colId: 'ID',
      colName: 'Computer',
      colIp: 'IP',
      colLast: 'Last report',
      colKb: 'KB-C',
      stNeeded: 'needed',
      stInstalled: 'installed',
      empty: 'No computer has reported yet.',
      sumConsole: 'Console',
      sumTruth: 'On the machines',
      sumRows: ['{n} computer', '{n} computers'],
      sumMachines: ['{n} computer', '{n} computers'],
      sumInstalled: 'KB-C installed: {n}',
      sumNeeded: 'KB-C needed: {n}',
      sumMissing: 'without KB-C: {n}',
      falseGreen: 'the report is wrong',

      // captions
      capStart: 'The disk image was captured from a computer whose update client had already run (it had reported to WSUS), so it carries that computer\'s *client ID* {id}. Press → to deploy the clones.',
      capStartGen: 'The disk image was *generalised* before capture: the client ID {id} has been removed. Press → to deploy the clones.',
      capDeploy: 'At {t}, {n} from the image. They all have the same ID {id}: it was copied with the disk.',
      capDeployGen: 'At {t}, {n} from the image. Each creates its own ID at first start: {ids}.',
      capDeployN: ['{n} clone starts', '{n} clones start'],
      capNew: '{pc} reports at {t}. WSUS does not know the ID {id}, so it adds a new row: {pc}.',
      capOverwrite: '{pc} reports at {t}. It has the same client ID as {prev}, so WSUS overwrites the same row, and {prev} has "disappeared".',
      capOverwriteOld: '{pc} reports at {t} and overwrites the row {id}, which still held {prev}\'s report from before its reset.',
      capFlip: 'KB-C in the row: {a} → {b}.',
      capFalseGreen: 'The report says everything is patched, but that is {pc}\'s state. {miss} doesn\'t have the patch.',
      capHides1: 'The row now hides {pcs}, although it is switched on and has reported.',
      capHidesN: 'The row now hides {pcs}, although they are switched on and have reported.',
      capReset: 'At {t} the admin resets the client ID on {pc}: {pc} gets a new one, {id}. The row {old} stays; a new row appears only when {pc} reports.',
      capResetEarly: 'At {t} the admin resets the client ID on {pc}: {pc} gets a new one, {id}, and will report with it.',
      capResetRejected: 'At {t} the clones don\'t exist yet: there is nothing to reset on {pc}. Nothing changes.',
      capAfterReset: '{pc} reports at {t} with its new ID {id}: the console has a new row, {pc} with its own state.',
      capStillHas: '{pcs} still has the ID {old}: the row will show it again at its next report.',
      capStillShare: '{pcs} still share the ID {old}.',
      capStale: 'The old row {old} named {pc} stays until someone deletes it or cleanup removes it: {pc} is in the console twice.',
      capAllRows: 'Every computer has a row of its own.',
      and: ' and ',

      explain: '<p>WSUS does not know a computer by its name but by its <em lang="en">client ID</em>, which Windows creates once ' +
        'per installation. The console keeps one row per ID; every status report overwrites that row\'s name, IP and patch ' +
        'state.</p>' +
        '<p>The ID is stored on the disk, so it is copied with it. A <em lang="en">clone</em> of an image captured from a ' +
        'computer that has already reported to WSUS carries the same ID as every other clone: the console shows only the one ' +
        'that reported last, and the patch report shows its state. The "missing" computers are not switched off.</p>' +
        '<p>The fix: <em lang="en">generalise</em> the image before capture, so each clone creates its own ID at first start. ' +
        'On clones already deployed, the ID has to be reset on every computer; resetting one separates only that one. ' +
        'Duplicate local machine SIDs come from the same cause but are a separate issue.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
