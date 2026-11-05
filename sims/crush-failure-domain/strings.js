/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of crush-failure-domain, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). In captions *word* is an English term in italics and `word` is rule text in
   code (the page renders both): the glossary has no failure domain, placement group, rack or bucket yet (NOTES.md
   "Term pairs"). The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'CRUSH stablo, pravilo smještaja i kopije grupa smještaja',
      thsep: '.',
      dec: ',',

      // controls
      pool: 'Bazen',
      poolRbd: 'rbd · 3/2',
      poolEc: 'EC 4+2',
      rule: 'Domena kvara',
      lostRack: 'Gubi se ormar',
      lostNone: 'nijedan',
      compare: 'Zatim drugo pravilo',
      showAll: 'Svi PG-ovi umjesto uzorka',

      // presets
      pHost: 'host · ormar 1',
      pHostHint: 'type host, gubi se ormar 1: 453 od 2048 PG-ova staje.',
      pRack: 'rack · ormar 1',
      pRackHint: 'type rack, isti gubitak: svih 2048 degradirano, nijedan ne staje.',
      pBefore: 'Prije kvara',
      pBeforeHint: 'Oba pravila bez kvara: isti HEALTH_OK, različit rizik.',
      pEc: 'EC 4+2 · host',
      pEcHint: 'cephfs_data, EC 4+2 po domaćinima, gubi se ormar 1: 271 od 1024 staje.',
      pBoth: 'host, pa rack',
      pBothHint: 'Isti gubitak ormara uz oba pravila redom, pa zbroj.',

      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legCopy: 'kopija ili dio na domaćinu r1-3 (boja = ormar)',
      legRisk: '! previše u istom ormaru',
      legLostCopy: 'u izgubljenom ormaru; PG bez ičega',
      legHole: 'rupa (NONE): nema mjesta',
      legClean: 'čist',
      legDegraded: 'degradiran: radi',
      legInactive: 'neaktivan: U/I staje',

      // stage
      poolWord: 'bazen',
      pgCount: ['{c} PG', '{c} PG-a', '{c} PG-ova'],
      ruleTitle: 'Pravilo smještaja',
      treeTitle: 'CRUSH stablo',
      rackWord: 'ormar',
      rackLost: '✕ izgubljen',
      hostOsds: '12 OSD-ova',
      stripTitle: 'Prvih {k} PG-ova: gdje su im kopije',
      stripTitleEc: 'Prvih {k} PG-ova: gdje su im dijelovi',
      stripMeta: 'redak = PG, ćelija = domaćin s kopijom, poredano po ormaru',
      stripMetaEc: 'redak = PG, ćelija = domaćin s dijelom, poredano po ormaru',
      allTitle: 'Svih {n} PG-ova',
      allMeta: 'kvadrat = PG; crta ispod: jedan ormar bi ga zaustavio',
      notPlaced: 'još nije smješteno',
      totalsTitle: 'Svi PG-ovi bazena',
      g_clean: 'čist',
      g_degraded: 'degradiran',
      g_inactive: 'neaktivan',
      g_stale: 'bez kopije',
      cnt_clean: ['{c} čist', '{c} čista', '{c} čistih'],
      cnt_degraded: ['{c} degradiran', '{c} degradirana', '{c} degradiranih'],
      cnt_inactive: ['{c} neaktivan', '{c} neaktivna', '{c} neaktivnih'],
      cnt_stale: ['{c} bez kopije', '{c} bez kopije', '{c} bez kopije'],
      riskLine: '! {n} od {all} PG-ova ima dvije ili tri kopije u istom ormaru',
      riskLineEc: '! {n} od {all} PG-ova ima tri ili više dijelova u istom ormaru',
      riskUnknown: '! u istom ormaru: korak 2',
      riskNone: '✓ nijedan PG nema dvije kopije u istom ormaru',
      riskNoneEc: '✓ nijedan ormar nema više od jednog dijela PG-a',
      holesLine: '{n} od {all} PG-ova ima rupe (NONE)',
      totTitle: 'Isti podaci, isti gubitak, dva pravila',
      totTitleNone: 'Prije kvara, dva pravila',
      totRule: 'pravilo',
      totRisk: '! u ormaru',
      totBefore: 'prije',
      totStop: 'staje',
      totDegraded: 'degr.',
      totClean: 'čisto',
      totAfter: 'nakon gubitka ormara {r}:',
      totNow: 'ovdje',

      // captions
      capStart: 'Bazen {pool} dijeli se na {n} *placement group* (grupa smještaja, PG), svaki spremljen u tri kopije; ostane li mu manje od min_size 2, PG staje. Ispod je CRUSH stablo: tri *rack* (ormar) s po tri domaćina. *Placement rule* (pravilo smještaja) odlučuje kamo idu kopije, a zadnja riječ u njemu je *failure domain* (domena kvara). Pritisni →.',
      capStartEc: 'Bazen {pool} s kodovima za ispravljanje (EC 4+2) dijeli se na {n} *placement group* (grupa smještaja, PG): svaki je šest dijelova, a podaci se vraćaju iz bilo koja četiri (min_size 4). Ispod je CRUSH stablo: tri *rack* (ormar) s po tri domaćina. Zadnja riječ *placement rule* (pravilo smještaja) je *failure domain* (domena kvara). Pritisni →.',
      capSwitch: 'Jedna riječ u pravilu: `{a}` → `{b}`. CRUSH iznova raspoređuje iste podatke.',
      capSwitchBack: 'Jedna riječ u pravilu: `{a}` → `{b}`, a ormar {r} opet radi. CRUSH iznova raspoređuje iste podatke.',
      capPlaceHost: 'Pravilo kaže `type host`: CRUSH stavlja tri kopije svakog PG-a na tri različita domaćina. Na ormare ne gleda, pa dvije kopije mogu završiti u istom ormaru.',
      capPlaceRack: 'Pravilo kaže `type rack`: svaka kopija ide u drugi ormar. Tri ormara, tri kopije: u svakom po jedna, pa i na različitim domaćinima.',
      capPlaceEcHost: 'Pravilo kaže `type host`: šest dijelova na šest različitih domaćina, od devet u tri ormara. U nekom ormaru uvijek su barem dva.',
      capPlaceEcRack: 'Pravilo kaže `type rack` i traži šest različitih ormara, a ima ih tri: CRUSH smjesti tri dijela, a tri mjesta ostaju prazna (NONE). Svaki PG ima 3 od 6 dijelova, manje od min_size 4: neaktivan je od početka, bez ikakvog kvara.',
      capHealthOk: 'Svih {n} PG-ova je active+clean: HEALTH_OK.',
      capRiskHost: '{n} od {all} PG-ova ({p}) ima dvije ili tri kopije u istom ormaru (uokvireno, !): bez tog ormara ostaje im manje od dvije. Stanje i dalje kaže HEALTH_OK: slabost pravila ne vidi se dok ormar ne otkaže.',
      capRiskRack: 'Nijedan PG nema dvije kopije u istom ormaru: koji god ormar otkaže, svakom PG-u ostaju dvije kopije. Stanje: HEALTH_OK.',
      capRiskEcHost: '{n} od {all} PG-ova ({p}) ima tri ili više dijelova u istom ormaru (!): bez tog ormara ostaje im manje od četiri, ispod min_size. Ni EC bazen raspoređen po domaćinima nije otporan na gubitak ormara.',
      capRiskEcRack: 'Nijedan ormar nema više od jednog dijela, ali to ne pomaže: tri dijela od šest već su ispod min_size. Pravilo ne može smjestiti više dijelova nego što u stablu ima *bucket* (spremnik) tog tipa, a ormara je tri.',
      capLose: ['Ormar {r} je izgubljen, a {c} PG imao je podatke u njemu.', 'Ormar {r} je izgubljen, a {c} PG-a imala su podatke u njemu.', 'Ormar {r} je izgubljen, a {c} PG-ova imalo je podatke u njemu.'],
      capLoseStop: ['{c} PG staje: ostaje mu manje od min_size {m}.', '{c} PG-a staju: ostaje im manje od min_size {m}.', '{c} PG-ova staje: ostaje im manje od min_size {m}.'],
      capLoseStale: ['Od toga {c} nema nijednu kopiju: da je ormar uništen, a ne ugašen, ti bi podaci nestali.', 'Od toga {c} nemaju nijednu kopiju: da je ormar uništen, a ne ugašen, ti bi podaci nestali.', 'Od toga {c} nema nijednu kopiju: da je ormar uništen, a ne ugašen, ti bi podaci nestali.'],
      capLoseDegraded: ['{c} je degradiran, ali radi.', '{c} su degradirana, ali rade.', '{c} je degradirano, ali radi.'],
      capLoseClean: ['{c} ostaje čist.', '{c} ostaju čista.', '{c} ostaje čisto.'],
      capLoseHost: 'Pravilo kaže `type host`: tri kopije na tri različita domaćina, ali dvije od njih mogu biti u istom ormaru.',
      capLoseRack: 'Jedna riječ drukčije, `host` → `rack`: isti gubitak ormara ostavlja svaki PG degradiranim, a nijedan ne staje.',
      capLoseRackPlain: 'Pravilo kaže `type rack`: u svakom ormaru po jedna kopija, pa gubitak ormara svakom PG-u uzima samo jednu i nijedan ne staje.',
      capLoseEcAlt: 'Uz min_size {m} stalo bi ih {n}.',
      capLoseWasDown: 'Ti PG-ovi bili su neaktivni i prije kvara.',
      capTotals: 'Isti strojevi, isti podaci, isti kvar. Zaustavljenih PG-ova: uz `type host` {a}, uz `type rack` {b}.',
      capTotalsEcRack: 'Uz `type rack` svi su bili neaktivni i prije kvara: tri ormara za šest dijelova.',
      capTotalsOk: 'Prije kvara oba su pokazivala HEALTH_OK.',
      capTotalsNone: 'Oba pravila: svih {n} PG-ova active+clean, HEALTH_OK. Isto stanje, različit rizik. PG-ova s dvije ili tri kopije u istom ormaru: uz `type host` {a}, uz `type rack` {b}.',
      capTotalsNoneEc: 'Uz `type host` svih {n} PG-ova je active+clean, ali {a} ih ima tri ili više dijelova u istom ormaru. Uz `type rack` svi su neaktivni i prije kvara: tri ormara za šest dijelova.',

      explain: '<p><em lang="en">Placement rule</em> (pravilo smještaja) govori CRUSH-u kako da za svaki PG izabere ' +
        'OSD-ove. Korak <code>chooseleaf firstn 0 type host</code> znači: idi niz stablo i za svaku kopiju uzmi ' +
        'OSD ispod drugog spremnika tipa <code>host</code>. Taj tip je <em lang="en">failure domain</em> (domena ' +
        'kvara): dvije kopije nikad ne dijele jedan spremnik tog tipa, a o većim spremnicima pravilo ne zna ništa.</p>' +
        '<p>Uz <code>type host</code> tri kopije su na tri domaćina, ali dva domaćina mogu biti u istom ormaru. ' +
        'Uz <code>type rack</code> svaka kopija je u drugom ormaru. Pravilo ne može smjestiti više kopija nego što ' +
        'ima spremnika tog tipa: tri ormara drže najviše tri kopije, a ostalo su rupe (<code>NONE</code>).</p>' +
        '<p>Stanja PG-ova su ista kao kod size i min_size: barem <code>min_size</code> živih kopija i PG radi ' +
        '(degradiran ako ih je manje od <code>size</code>), manje i PG staje, nijedna i nema ga tko poslužiti.</p>' +
        '<p>Tri zablude. „Tri kopije na tri domaćina preživjet će sve osim tri kvara”: ne ako dva od njih dijele ' +
        'ormar, napajanje ili preklopnik. „HEALTH_OK znači da je raspored siguran”: oba pravila prije kvara ' +
        'pokazuju isto. „Više ormara to popravlja”: uz <code>type host</code> dvije kopije i dalje mogu u isti ' +
        'ormar; mijenja se pravilo, ne broj ormara.</p>' +
        '<p>Ovdje nema klasa uređaja, težina i kapaciteta, unutrašnjosti algoritma CRUSH ni matematike kodova za ' +
        'ispravljanje: to su druge stranice. Promjena pravila na živom grozdu premješta podatke, a ovdje se samo ' +
        'iznova računa raspored.</p>'
    },
    en: {
      stage: 'The CRUSH tree, the placement rule and the copies of placement groups',
      thsep: ',',
      dec: '.',

      pool: 'Pool',
      poolRbd: 'rbd · 3/2',
      poolEc: 'EC 4+2',
      rule: 'Failure domain',
      lostRack: 'Rack lost',
      lostNone: 'none',
      compare: 'Then the other rule',
      showAll: 'Every PG instead of the sample',

      pHost: 'host · rack 1',
      pHostHint: 'type host, rack 1 lost: 453 of 2048 PGs stop.',
      pRack: 'rack · rack 1',
      pRackHint: 'type rack, the same loss: all 2048 degraded, none stops.',
      pBefore: 'Before the loss',
      pBeforeHint: 'Both rules, nothing lost: the same HEALTH_OK, a different risk.',
      pEc: 'EC 4+2 · host',
      pEcHint: 'cephfs_data, EC 4+2 by host, rack 1 lost: 271 of 1024 stop.',
      pBoth: 'host, then rack',
      pBothHint: 'The same rack loss under both rules in turn, then the totals.',

      legChanged: 'changed in this step',
      legCopy: 'copy or shard on host r1-3 (colour = rack)',
      legRisk: '! too many in one rack',
      legLostCopy: 'in the lost rack; a PG with nothing left',
      legHole: 'hole (NONE): no place',
      legClean: 'clean',
      legDegraded: 'degraded: serving',
      legInactive: 'inactive: I/O stops',

      poolWord: 'pool',
      pgCount: ['{c} PG', '{c} PGs'],
      ruleTitle: 'Placement rule',
      treeTitle: 'CRUSH tree',
      rackWord: 'rack',
      rackLost: '✕ lost',
      hostOsds: '12 OSDs',
      stripTitle: 'The first {k} PGs: where their copies are',
      stripTitleEc: 'The first {k} PGs: where their shards are',
      stripMeta: 'row = PG, cell = the host with a copy, in rack order',
      stripMetaEc: 'row = PG, cell = the host with a shard, in rack order',
      allTitle: 'All {n} PGs',
      allMeta: 'square = PG; a bar under it: one rack would stop it',
      notPlaced: 'not placed yet',
      totalsTitle: 'Every PG of the pool',
      g_clean: 'clean',
      g_degraded: 'degraded',
      g_inactive: 'inactive',
      g_stale: 'no copy',
      cnt_clean: ['{c} clean', '{c} clean'],
      cnt_degraded: ['{c} degraded', '{c} degraded'],
      cnt_inactive: ['{c} inactive', '{c} inactive'],
      cnt_stale: ['{c} with no copy', '{c} with no copy'],
      riskLine: '! {n} of {all} PGs have two or three copies in one rack',
      riskLineEc: '! {n} of {all} PGs have three or more shards in one rack',
      riskUnknown: '! in one rack: step 2',
      riskNone: '✓ no PG has two copies in one rack',
      riskNoneEc: '✓ no rack holds more than one shard of a PG',
      holesLine: '{n} of {all} PGs have holes (NONE)',
      totTitle: 'Same data, same loss, two rules',
      totTitleNone: 'Before the loss, two rules',
      totRule: 'rule',
      totRisk: '! in a rack',
      totBefore: 'before',
      totStop: 'stop',
      totDegraded: 'degr.',
      totClean: 'clean',
      totAfter: 'after losing rack {r}:',
      totNow: 'here',

      capStart: 'Pool {pool} is split into {n} placement groups (PGs), each stored as three copies; with fewer than min_size 2 left, a PG stops. Below is the CRUSH tree: three racks of three hosts. The placement rule decides where the copies go, and its last word is the failure domain. Press →.',
      capStartEc: 'Erasure-coded pool {pool} (4+2) is split into {n} placement groups (PGs): each is six shards, and any four rebuild the data (min_size 4). Below is the CRUSH tree: three racks of three hosts. The last word of the placement rule is the failure domain. Press →.',
      capSwitch: 'One word in the rule: `{a}` → `{b}`. CRUSH places the same data afresh.',
      capSwitchBack: 'One word in the rule: `{a}` → `{b}`, and rack {r} is back up. CRUSH places the same data afresh.',
      capPlaceHost: 'The rule says `type host`: CRUSH puts the three copies of every PG on three different hosts. It does not look at racks, so two copies can end up in the same rack.',
      capPlaceRack: 'The rule says `type rack`: each copy goes into a different rack. Three racks, three copies: one in each, and so on different hosts too.',
      capPlaceEcHost: 'The rule says `type host`: six shards on six different hosts, out of nine in three racks. Some rack always gets at least two.',
      capPlaceEcRack: 'The rule says `type rack` and asks for six different racks, but there are three: CRUSH places three shards and leaves three holes (NONE). Every PG has 3 of 6 shards, fewer than min_size 4: inactive from the start, before anything fails.',
      capHealthOk: 'All {n} PGs are active+clean: HEALTH_OK.',
      capRiskHost: '{n} of {all} PGs ({p}) have two or three copies in the same rack (outlined, !): without that rack fewer than two remain. Health still says HEALTH_OK: the rule\'s weakness does not show until a rack fails.',
      capRiskRack: 'No PG has two copies in the same rack: whichever rack fails, every PG keeps two copies. Health: HEALTH_OK.',
      capRiskEcHost: '{n} of {all} PGs ({p}) have three or more shards in the same rack (!): without that rack fewer than four remain, below min_size. An EC pool spread by host is not rack-tolerant either.',
      capRiskEcRack: 'No rack holds more than one shard, but that does not help: three shards of six are already below min_size. A rule cannot place more shards than there are buckets of its type in the tree, and there are three racks.',
      capLose: ['Rack {r} is lost, and {c} PG had data in it.', 'Rack {r} is lost, and {c} PGs had data in it.'],
      capLoseStop: ['{c} PG stops: fewer than min_size {m} remain.', '{c} PGs stop: fewer than min_size {m} remain.'],
      capLoseStale: ['{c} of them has no copy left: had the rack been destroyed rather than powered off, that data would be gone.', '{c} of them have no copy left: had the rack been destroyed rather than powered off, that data would be gone.'],
      capLoseDegraded: ['{c} is degraded but serving.', '{c} are degraded but serving.'],
      capLoseClean: ['{c} stays clean.', '{c} stay clean.'],
      capLoseHost: 'The rule said `type host`: three copies on three different hosts, but two of them can share a rack.',
      capLoseRack: 'One word changed, `host` → `rack`: the same rack loss leaves every PG degraded and none stopped.',
      capLoseRackPlain: 'The rule says `type rack`: one copy in each rack, so losing a rack takes one copy from every PG and none stops.',
      capLoseEcAlt: 'With min_size {m} it would be {n}.',
      capLoseWasDown: 'Those PGs were inactive before the loss too.',
      capTotals: 'Same machines, same data, same loss. PGs stopped: with `type host` {a}, with `type rack` {b}.',
      capTotalsEcRack: 'With `type rack` they were all inactive before the loss too: three racks for six shards.',
      capTotalsOk: 'Before the loss both said HEALTH_OK.',
      capTotalsNone: 'Both rules: all {n} PGs active+clean, HEALTH_OK. Same health, different risk. PGs with two or three copies in one rack: with `type host` {a}, with `type rack` {b}.',
      capTotalsNoneEc: 'With `type host` all {n} PGs are active+clean, but {a} of them have three or more shards in one rack. With `type rack` all are inactive before anything fails: three racks for six shards.',

      explain: '<p>A placement rule tells CRUSH how to pick the OSDs of each PG. The step ' +
        '<code>chooseleaf firstn 0 type host</code> means: walk down the tree and, for each copy, take an OSD under a ' +
        'different bucket of type <code>host</code>. That type is the failure domain: no two copies share a bucket of ' +
        'that type, and the rule knows nothing about the larger buckets above it.</p>' +
        '<p>With <code>type host</code> three copies are on three hosts, but two hosts can be in the same rack. With ' +
        '<code>type rack</code> each copy is in a different rack. A rule cannot place more copies than there are ' +
        'buckets of its type: three racks hold at most three copies, and the rest are holes (<code>NONE</code>).</p>' +
        '<p>The PG states are those of size and min_size: at least <code>min_size</code> live copies and the PG serves ' +
        '(degraded with fewer than <code>size</code>), fewer and it stops, none and nobody can serve it.</p>' +
        '<p>Three misconceptions. “Three copies on three hosts survive anything short of three failures”: not when two ' +
        'of them share a rack, its power or its switch. “HEALTH_OK means the layout is safe”: both rules show the same ' +
        'before the loss. “More racks fix it”: with <code>type host</code> two copies can still land in one rack; ' +
        'what changes it is the rule, not the number of racks.</p>' +
        '<p>Not here: device classes, weights and capacity, the inside of the CRUSH algorithm, and erasure-coding ' +
        'maths: those are other pages. Changing the rule of a live cluster moves data; here the placement is simply ' +
        'computed again.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
