/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of backup-window, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   The title and subtitle are not here: they come from sim.json (title, concept).
   Terms missing from the glossary are written out in both tables (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Prozor za kopiranje, noćna promjena i prva kopija',

      // controls
      sizeTB: 'Količina podataka',
      changePct: 'Dnevna stopa promjene',
      linkMbit: 'Brzina veze (prema odredištu)',
      linkHint: 'Na asimetričnoj vezi vrijedi brzina slanja (upload), ne preuzimanja.',
      efficiency: 'Iskoristivost veze',
      windowH: 'Prozor za kopiranje',
      localMBs: 'Lokalno kopiranje na diskove',
      driveH: 'Vožnja do druge lokacije',
      seedBy: 'Prva kopija',
      seedLink: 'vezom',
      seedTruck: 'kamionom',

      // presets
      pHq: 'Sjedište u oblak, 1 Gbit/s',
      pHqHint: '21,4 TB zrcala datoteka preko 1000/1000 Mbit/s: prva kopija 47,6 h, noćnih 214 GB za pola sata.',
      pBrk: 'Podružnica, slanje 50 Mbit/s',
      pBrkHint: '1 % dnevne promjene je 214 GB: manje od pola sata na 1 Gbit/s, ali 9,5 sati preko 50 Mbit/s slanja podružnice.',
      pTruck: 'Prva kopija kamionom',
      pTruckHint: 'Prva potpuna kopija od 21,4 TB preko 50 Mbit/s traje 39,6 dana. Kamionom s diskovima: manje od tri dana.',
      pDumps: 'Kopije virtualnih strojeva, 10,4 TB',
      pDumpsHint: 'Potpuna kopija traje 23,1 h: ne stane ni u jedan prozor. Svake noći može samo prirasna.',
      pNever: 'Red koji nikad ne nestane',
      pNeverHint: '5 TB uz 2 % promjene preko 20 Mbit/s slanja: noćnih 100 GB traje 11,1 h, a prozor ima 8 h.',

      // legend
      legWindow: 'prozor za kopiranje',
      legFull: 'prva potpuna kopija',
      legIncr: 'noćna promjena',
      legOver: 'preljev u radno vrijeme (!)',
      legTruck: 'kamion s diskovima',
      legCatch: 'sustizanje nakupljenih promjena',
      legChanged: 'prešlo granicu (stane ↔ ne stane)',

      // units and numbers
      secs: '{n} s',
      mins: '{n} min',
      hours: '{n} h',
      days: '{n} dana',
      tb: '{n} TB',
      gb: '{n} GB',
      pct: '{n} %',
      mbit: '{n} Mbit/s',
      gbit: '{n} Gbit/s',
      mbs: '{n} MB/s',
      nights: ['{n} noć', '{n} noći', '{n} noći'],
      dayNom: ['{n} dan', '{n} dana', '{n} dana'],
      dayGen: ['{n} dana', '{n} dana', '{n} dana'],

      // tiles
      tileFull: 'Prva potpuna kopija',
      tileIncr: 'Noćna promjena',
      tileSeed: 'Početno punjenje',
      tileCatch: 'Nakupljene promjene',
      fullSub: '1 TB preko {link}: {perTB}',
      fullOne: 'stane u jedan prozor',
      fullNot: 'ne stane u jedan prozor',
      incrSub: '{gb} dnevno ({pct})',
      fitsYes: 'stane u prozor od {win}',
      fitsNo: 'ne stane: +{over} u radno vrijeme',
      seedLinkBig: ['{n} noć', '{n} noći', '{n} noći'],
      seedLinkSub: 'vezom, u prozorima od {win}',
      seedTruckSub: 'kamionom: kopiranje, vožnja, kopiranje',
      fasterOther: '{how} brže: {t}',
      fasterThis: 'ne sporije nego {how} ({t})',
      byLink: 'vezom',
      byTruck: 'kamionom',
      catchBig: ['+{n} noć', '+{n} noći', '+{n} noći'],
      catchSub: '{days} promjena = {backlog} prijenosa',
      catchNever: 'nikad',
      catchNeverSub: 'red raste {grow} svake noći',
      catchFlatSub: 'red se ne smanjuje: noćna promjena zauzme cijeli prozor',
      catchNone: 'ništa',
      catchNoneSub: 'noćna promjena traje manje od sekunde',

      // clock
      clockTitle: 'Jedna noć, od podneva do podneva',
      rowWindow: 'Prozor',
      notChosen: 'vezom; nije odabrano',
      rowIncr: 'Noćna promjena',
      rowNight: 'noć {n}',
      rowMore: ['… još {n} noć', '… još {n} noći', '… još {n} noći'],
      overflowMark: '! +{t}',
      workHours: 'radno vrijeme',

      // lanes
      lanesTitle: 'Prva kopija na drugu lokaciju, u danima',
      laneLink: 'Vezom',
      laneTruck: 'Kamionom',
      laneChosen: 'odabrano',
      segOut: 'na diskove {t}',
      segDrive: 'vožnja {t}',
      segIn: 's diskova {t}',
      laneSeed: '{t}',
      laneCatch: '+ sustizanje {n}',
      laneNever: '+ nikad ne sustigne',
      dayTick: '{n} d',

      // captions
      cIncrOver: 'Noćna promjena od {gb} preko {link} traje {incr}, a prozor ima {win}: posao se prelije {over} u radno ' +
        'vrijeme i red promjena raste svake noći. Kopija nikad ne sustigne izvor.',
      cIncrNoDay: 'Noćna promjena od {gb} preko {link} traje {incr}: dulje od cijelog dana, pa sljedeća promjena stiže ' +
        'prije nego što prethodna završi. Red promjena raste svake noći i kopija nikad ne sustigne izvor.',
      cAllFit: 'Potpuna kopija od {size} preko {link} traje {full} i stane u jedan prozor od {win}; noćna promjena od {gb} ' +
        'traje {incr}.',
      cFewNights: 'Prva potpuna kopija od {size} traje {full}: {nights} u prozoru od {win}, pa noćna potpuna kopija ne ' +
        'dolazi u obzir. Noćna promjena od {gb} traje {incr} i stane.',
      cLongSeed: 'Prva potpuna kopija od {size} preko {link} traje {full}: {nights} u prozoru od {win}. Kamionom s ' +
        'diskovima: {truck}. Noćna promjena od {gb} traje {incr} i stane.',
      cTruck: 'Kamionom: na diskove {out}, vožnja {drive}, s diskova {in}, ukupno {truck} umjesto {linkT} preko veze ({nights}). ' +
        'Noćne promjene zatim idu vezom: {gb} za {incr}.',
      nLinkFaster: 'Ovdje je veza jednako brza ili brža, a ne treba nositi diskove.',
      nLinkStill: 'Veza je i dalje jednako brza ili brža od kamiona.',
      nCatchUp: 'Promjene iz {days} punjenja ({backlog}) traže još {k}.',
      nNeverDrains: 'Promjene iz {days} punjenja nikad se ne prenesu: noćna promjena zauzme cijeli prozor.',

      explain: '<p>Kopija mora stati u <em>backup window</em> (prozor za kopiranje): noćne sate u kojima smije opteretiti ' +
        'mrežu i diskove. Vrijeme prijenosa je količina podataka × 8 / (brzina veze × iskoristivost). 1 TB preko ' +
        '1 Gbit/s traje 2,2 sata, ne nekoliko sekundi.</p>' +
        '<p>Prva [[full backup]] prenosi sve; svake sljedeće noći [[incremental backup]] prenosi samo ono što se ' +
        'promijenilo (<em>change rate</em>, stopa promjene). To što noćna promjena stane u prozor ne znači da stane i ' +
        'prva kopija: 1 % od 21,4 TB je 214 GB.</p>' +
        '<p>Dok traje <em>seeding</em> (početno punjenje) <em>offsite</em> kopije (izmještene kopije), promjene se ' +
        'gomilaju i čekaju u redu. Ako noćna promjena zauzme cijeli prozor, red nikad ne nestane. Zato se prva kopija ' +
        'često nosi diskovima, a vezom idu samo promjene. Pazi na asimetrične veze: kopija na drugu lokaciju ide ' +
        'brzinom slanja, koja je često mnogo manja od brzine preuzimanja.</p>'
    },
    en: {
      stage: 'Backup window, nightly change and the first copy',

      sizeTB: 'Amount of data',
      changePct: 'Daily change rate',
      linkMbit: 'Link speed (towards the target)',
      linkHint: 'On an asymmetric link the upload speed counts, not the download.',
      efficiency: 'Link efficiency',
      windowH: 'Backup window',
      localMBs: 'Local copy to disks',
      driveH: 'Drive to the other site',
      seedBy: 'First copy',
      seedLink: 'by link',
      seedTruck: 'by truck',

      pHq: 'HQ to cloud, 1 Gbit/s',
      pHqHint: '21.4 TB of file mirror over 1000/1000 Mbit/s: first copy 47.6 h, the nightly 214 GB in half an hour.',
      pBrk: 'Branch, 50 Mbit/s upload',
      pBrkHint: '1 % daily change is 214 GB: under half an hour at 1 Gbit/s, but 9.5 hours over the branch\'s 50 Mbit/s upload.',
      pTruck: 'First copy by truck',
      pTruckHint: 'The first full backup of 21.4 TB over 50 Mbit/s takes 39.6 days. By truck with disks: under three days.',
      pDumps: 'VM dumps, 10.4 TB',
      pDumpsHint: 'A full set takes 23.1 h: it fits no window. Only an incremental can run every night.',
      pNever: 'A queue that never drains',
      pNeverHint: '5 TB at 2 % change over a 20 Mbit/s upload: the nightly 100 GB takes 11.1 h, the window is 8 h.',

      legWindow: 'backup window',
      legFull: 'first full copy',
      legIncr: 'nightly change',
      legOver: 'overflow into working hours (!)',
      legTruck: 'truck with disks',
      legCatch: 'catching up on queued changes',
      legChanged: 'crossed a threshold (fits ↔ does not fit)',

      secs: '{n} s',
      mins: '{n} min',
      hours: '{n} h',
      days: '{n} days',
      tb: '{n} TB',
      gb: '{n} GB',
      pct: '{n} %',
      mbit: '{n} Mbit/s',
      gbit: '{n} Gbit/s',
      mbs: '{n} MB/s',
      nights: ['{n} night', '{n} nights'],
      dayNom: ['{n} day', '{n} days'],
      dayGen: ['{n} day', '{n} days'],

      tileFull: 'First full copy',
      tileIncr: 'Nightly change',
      tileSeed: 'Seeding',
      tileCatch: 'Queued changes',
      fullSub: '1 TB over {link}: {perTB}',
      fullOne: 'fits one window',
      fullNot: 'does not fit one window',
      incrSub: '{gb} a day ({pct})',
      fitsYes: 'fits the {win} window',
      fitsNo: 'does not fit: +{over} into working hours',
      seedLinkBig: ['{n} night', '{n} nights'],
      seedLinkSub: 'by link, in {win} windows',
      seedTruckSub: 'by truck: copy, drive, copy',
      fasterOther: 'faster {how}: {t}',
      fasterThis: 'no slower than {how} ({t})',
      byLink: 'by link',
      byTruck: 'by truck',
      catchBig: ['+{n} night', '+{n} nights'],
      catchSub: '{days} of changes = {backlog} of transfer',
      catchNever: 'never',
      catchNeverSub: 'the queue grows {grow} every night',
      catchFlatSub: 'the queue never shrinks: the nightly change takes the whole window',
      catchNone: 'none',
      catchNoneSub: 'the nightly change takes under a second',

      clockTitle: 'One night, noon to noon',
      rowWindow: 'Window',
      notChosen: 'by link; not chosen',
      rowIncr: 'Nightly change',
      rowNight: 'night {n}',
      rowMore: ['… {n} more night', '… {n} more nights'],
      overflowMark: '! +{t}',
      workHours: 'working hours',

      lanesTitle: 'First offsite copy, in days',
      laneLink: 'By link',
      laneTruck: 'By truck',
      laneChosen: 'chosen',
      segOut: 'to disks {t}',
      segDrive: 'drive {t}',
      segIn: 'from disks {t}',
      laneSeed: '{t}',
      laneCatch: '+ catching up {n}',
      laneNever: '+ never catches up',
      dayTick: '{n} d',

      cIncrOver: 'The nightly change of {gb} over {link} takes {incr}, and the window is {win}: the job runs {over} into ' +
        'working hours and the queue of changes grows every night. The copy never catches up.',
      cIncrNoDay: 'The nightly change of {gb} over {link} takes {incr}: longer than a whole day, so the next change ' +
        'arrives before the last one is done. The queue of changes grows every night and the copy never catches up.',
      cAllFit: 'A full copy of {size} over {link} takes {full} and fits one window of {win}; the nightly change of {gb} takes ' +
        '{incr}.',
      cFewNights: 'The first full copy of {size} takes {full}: {nights} at {win} a night, so a nightly full is out of ' +
        'the question. The nightly change of {gb} takes {incr} and fits.',
      cLongSeed: 'The first full copy of {size} over {link} takes {full}: {nights} at {win} a night. By truck with ' +
        'disks: {truck}. The nightly change of {gb} takes {incr} and fits.',
      cTruck: 'By truck: to disks {out}, drive {drive}, from disks {in}, {truck} in all instead of {linkT} over the ' +
        'link ({nights}). The nightly changes then go over the link: {gb} in {incr}.',
      nLinkFaster: 'Here the link is as fast or faster, and nobody has to carry disks.',
      nLinkStill: 'The link is still as fast as the truck or faster.',
      nCatchUp: 'The changes from {days} of seeding ({backlog}) take {k} more.',
      nNeverDrains: 'The changes from {days} of seeding never get across: the nightly change takes the whole window.',

      explain: '<p>A copy has to fit the backup window: the night hours in which it may load the network and the disks. ' +
        'Transfer time is the amount of data × 8 / (link speed × efficiency). 1 TB over 1 Gbit/s takes 2.2 hours, not ' +
        'a few seconds.</p>' +
        '<p>The first [[full backup]] moves everything; every night after it an [[incremental backup]] moves only what ' +
        'changed (the change rate). That the nightly change fits the window does not mean the first copy does: 1 % ' +
        'of 21.4 TB is 214 GB.</p>' +
        '<p>While the offsite copy is being seeded, changes pile up in a queue. If the nightly change takes the whole ' +
        'window, the queue never drains. That is why the first copy often travels on disks and only the changes go ' +
        'over the link. Mind asymmetric links: an offsite copy goes at the upload speed, which is often far lower ' +
        'than the download.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
