/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the student picker, Croatian and English (docs/sim-ui.md §9). Same keys in both tables;
   plurals are arrays (hr: 1 / 2–4 / 5+, en: 1 / other). Croatian wording kept from the original page where it had one.
   The title and subtitle come from sim.json through #simdeck-meta. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Odabir studenta',
      listTitle: 'Polaznici',
      bulkLabel: 'Popis imena',
      bulkPlaceholder: 'Zalijepi listu imena (jedno po redu ili zarezom odvojeno)…',
      bulkButton: 'Uvezi listu',
      nameLabel: 'Jedno ime',
      namePlaceholder: 'Ime polaznika…',
      addButton: '+ Dodaj',
      pick: 'Odaberi',
      newRound: 'Resetiraj odabrane',
      clearAll: 'Obriši sve',
      remove: 'Ukloni {name}',
      count: '{n} / {max}',
      statTotal: 'ukupno',
      statPicked: 'već odabrani',
      statRemain: 'preostalo',
      roll: 'Animacija izvlačenja',
      rollHint: 'Imena se kratko vrte prije odabira',
      legendLeft: 'još nije odabran',
      legendPicked: 'odabran (redni broj)',
      legendLast: 'upravo odabran',
      emptyList: 'Popis je prazan. Zalijepi imena ili dodaj jedno po jedno.',
      ready: 'Pritisni Odaberi ili tipku P.',
      rolling: 'Izvlačim…',
      allPicked: 'Svi su već odabrani — resetiraj za novi krug.',
      captionEmpty: 'Dodaj polaznike. Imena ostaju samo u ovoj kartici preglednika.',
      captionReady: ['Na popisu je {n} polaznik. Nitko još nije odabran.', 'Na popisu su {n} polaznika. Nitko još nije odabran.', 'Na popisu je {n} polaznika. Nitko još nije odabran.'],
      captionPicked: 'Odabran: {name}.',
      remain: ['Preostao je još {n}.', 'Preostala su još {n}.', 'Preostalo je još {n}.'],
      captionDone: 'Svi odabrani — resetiraj za novi krug.',
      captionAdded: ['Dodan je {n} polaznik.', 'Dodana su {n} polaznika.', 'Dodano je {n} polaznika.'],
      captionDuplicate: ['{n} ime već je na popisu.', '{n} imena već su na popisu.', '{n} imena već je na popisu.'],
      captionFull: ['{n} ime nije stalo: najviše {max} polaznika.', '{n} imena nisu stala: najviše {max} polaznika.', '{n} imena nije stalo: najviše {max} polaznika.'],
      captionNothing: 'Nema novih imena za dodati.',
      captionRemoved: 'Uklonjen: {name}.',
      captionRound: 'Novi krug: nitko nije odabran.',
      captionCleared: 'Popis je obrisan.',
      keyPick: 'Odaberi sljedećeg',
      explain: '<p>Svako izvlačenje bira jedno od imena koja još nisu odabrana, sva s jednakom vjerojatnošću: ' +
        'kad ih je preostalo pet, svako ima šansu jedan prema pet. Odabrani više ne ulaze u izvlačenje, pa nitko ne dođe ' +
        'na red dvaput prije nego što svi dođu na red jednom.</p>' +
        '<p>Kad su svi odabrani, <b>Resetiraj odabrane</b> započinje novi krug s istim popisom. Popis ima najviše 30 imena; ' +
        'ime koje je već na popisu ne dodaje se ponovno.</p>' +
        '<p>Imena ostaju samo u ovoj kartici preglednika i nikamo se ne šalju.</p>'
    },
    en: {
      stage: 'Student picker',
      listTitle: 'Students',
      bulkLabel: 'List of names',
      bulkPlaceholder: 'Paste a list of names (one per line or separated by commas)…',
      bulkButton: 'Import list',
      nameLabel: 'One name',
      namePlaceholder: 'Student name…',
      addButton: '+ Add',
      pick: 'Pick',
      newRound: 'Reset picks',
      clearAll: 'Clear all',
      remove: 'Remove {name}',
      count: '{n} / {max}',
      statTotal: 'total',
      statPicked: 'already picked',
      statRemain: 'remaining',
      roll: 'Drawing animation',
      rollHint: 'Names spin briefly before the pick',
      legendLeft: 'not picked yet',
      legendPicked: 'picked (order)',
      legendLast: 'just picked',
      emptyList: 'The list is empty. Paste names or add them one at a time.',
      ready: 'Press Pick or the P key.',
      rolling: 'Drawing…',
      allPicked: 'Everyone has been picked — reset for a new round.',
      captionEmpty: 'Add students. The names stay in this browser tab only.',
      captionReady: ['{n} student on the list. Nobody picked yet.', '{n} students on the list. Nobody picked yet.'],
      captionPicked: 'Picked: {name}.',
      remain: ['{n} left.', '{n} left.'],
      captionDone: 'Everyone picked — reset for a new round.',
      captionAdded: ['{n} student added.', '{n} students added.'],
      captionDuplicate: ['{n} name is already on the list.', '{n} names are already on the list.'],
      captionFull: ['{n} name did not fit: {max} students at most.', '{n} names did not fit: {max} students at most.'],
      captionNothing: 'No new names to add.',
      captionRemoved: 'Removed: {name}.',
      captionRound: 'New round: nobody picked.',
      captionCleared: 'The list is cleared.',
      keyPick: 'Pick the next one',
      explain: '<p>Each draw picks one of the names not picked yet, all with the same chance: when five are left, each ' +
        'has a one-in-five chance. Picked names no longer take part, so nobody gets a second turn before everyone has ' +
        'had one.</p>' +
        '<p>When everyone has been picked, <b>Reset picks</b> starts a new round with the same list. The list holds at ' +
        'most 30 names; a name already on the list is not added again.</p>' +
        '<p>The names stay in this browser tab only and are not sent anywhere.</p>'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings; else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
