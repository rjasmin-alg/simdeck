/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of smallest-disk-caps, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other). *word* in a caption is an English term in italics.
   The title and subtitle are not here: they come from sim.json (title, concept).
   The glossary has none of this page's terms yet: they are written out by hand (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Poslužitelji kao stupci, OSD-ovi kao stupići popunjenosti s pragovima 85, 90 i 95 %',

      // controls
      cluster: 'Grozd',
      clusterLab: 'tri poslužitelja',
      clusterHq: 'sjedište (HQ)',
      smallHostDisks: 'Diskova po malom poslužitelju',
      bigHostDisks: 'Diskova na velikom',
      diskGiB: 'Veličina svakog diska',
      storedTiB: 'Upiši više podataka',
      size: 'Broj kopija (size)',

      // presets
      pUnbalanced: 'Neuravnoteženi poslužitelji',
      pUnbalancedHint: 'Jedan poslužitelj s 12 diskova, dva s po 2; size 3, 8 TiB podataka.',
      pAddBig: 'Još 4 diska velikom',
      pAddBigHint: 'Sirovi kapacitet raste, granica ostaje.',
      pFill: 'Napuni bazen',
      pFillHint: '14 TiB podataka: najpuniji OSD prelazi pragove, a grozd je popunjen trećinom.',
      pOneSmall: 'Jedan mali disk',
      pOneSmallHint: 'Mali poslužitelji imaju po jedan disk od 447 GiB: svaki PG treba kopiju na njemu.',
      pHq: 'Sjedište: „tek 38 % puno”',
      pHqHint: 'Grozd iz materijala za vježbe: sirovo 38 %, a MAX AVAIL samo 3,4 TiB.',

      // legend
      legBar: 'OSD: obris = veličina, ispuna = zauzeto',
      legOver: 'preko praga (šrafirano)',
      legFull: 'pun, 95 % (križno)',
      legLine: 'pragovi 85 / 90 / 95 %',
      legDecide: 'najpuniji, odlučuje (▲)',
      legHost: 'poslužitelj',
      legChanged: 'upravo prešao prag',

      // numbers
      tib: '{n}\u00a0TiB',
      gib: '{n}\u00a0GiB',
      pct: '{n}\u00a0%',

      // the ceph df box
      dfRaw: 'Sirovi kapacitet',
      dfRawSub: ['{n} OSD u grozdu', '{n} OSD-a u grozdu', '{n} OSD-ova u grozdu'],
      dfUsed: 'Sirovo zauzeto',
      dfUsedSub: '{stored} podataka × {size} kopije',
      dfUsedSubHq: 'svi bazeni zajedno',
      dfNaive: 'Sirovo slobodno ÷ {size}',
      dfNaiveSub: 'što sugerira „{pct} puno”',
      dfMax: 'MAX AVAIL ({pool})',
      dfMaxSub: 'projekcija iz osd.{id}',
      dfFits: 'Stane do punog osd.{id}',
      dfFitsSub: 'po stvarnom rasporedu',
      dfFitsFull: 'ništa: bazen je pun',

      // health line
      healthOk: 'nijedan OSD nije blizu punog',
      hsOk: 'HEALTH_OK',
      hsWarn: 'HEALTH_WARN',
      hsErr: 'HEALTH_ERR',
      hNear: ['{n} OSD gotovo pun', '{n} OSD-a gotovo puna', '{n} OSD-ova gotovo punih'],
      hBackfill: ['{n} OSD preko praga backfillfull', '{n} OSD-a preko praga backfillfull', '{n} OSD-ova preko praga backfillfull'],
      hFull: ['{n} OSD pun', '{n} OSD-a puna', '{n} OSD-ova punih'],
      hPoolFull: 'bazen pun: pisanje stoji, odbijeno {refused}',

      // hosts
      hostDisks: ['{n} disk × {size}', '{n} diska × {size}', '{n} diskova × {size}'],
      hostHolds: 'drži {data}',
      hostCopy: 'drži {data} = cijela kopija',
      hostFill: 'popunjenost {lo}–{hi}',
      hostFillOne: 'popunjenost {pct}',
      decides: '▲ odlučuje osd.{id}: {pct}',
      osdOut: 'izbačen',
      osdAria: 'osd.{id}: {used} od {size}, {pct}, {level}',
      line: '{n} %',

      // levels
      lvl_ok: 'ispod praga',
      lvl_nearfull: 'gotovo pun (nearfull, 85 %)',
      lvl_backfillfull: 'preko praga backfillfull (90 %)',
      lvl_full: 'pun (95 %)',
      lvl_out: 'izbačen iz grozda',

      // captions
      cCopy: 'Grozd je popunjen {raw}, ali {osd} je na {pct}: svaki poslužitelj mora nositi cijelu kopiju podataka, a {host} je drži na samo {disks}, pa on odlučuje koliko se još može upisati (*MAX AVAIL*).',
      cEven: 'Sva tri poslužitelja imaju po {disks}: svaki mora nositi cijelu kopiju na jednako diskova, pa se pune podjednako; {osd} na {pct} odlučuje tek zato što PG-ovi nisu jednako veliki.',
      cCopyOther: 'Grozd je popunjen {raw}. Poslužitelji imaju gotovo jednako diskova, pa se pune podjednako; {osd} na {pct} odlučuje tek zato što PG-ovi nisu jednako veliki.',
      cSize2: 'S dvije kopije PG zauzima dva od tri poslužitelja, a CRUSH ih bira po težini, pa onaj s više diskova dobiva više kopija, a nijedan više ne mora nositi cijelu kopiju. {osd} na {pct} i dalje odlučuje o *MAX AVAIL*.',
      cEmpty: 'Bazen je prazan. Prvi će se napuniti {osd}: do tada stane {fits}, a sirovo slobodno ÷ {size} obećava {naive}.',
      cFull: 'Bazen je pun: {osd} je dosegao 95 % kod {stored} podataka, pa je ostatak od {refused} odbijen, a grozd je popunjen tek {raw}.',
      cHq: 'Sjedište: grozd je popunjen {raw}, ali {osd} je na {pct}, gotovo pun (*nearfull*), pa {pool} prima još samo {max} (*MAX AVAIL*).',
      nLevel: 'Grozd već upozorava: {osd} je {level}.',
      nOver: '*MAX AVAIL* obećava {max} jer pretpostavlja da se novi podaci šire po težini; s cijelom kopijom po poslužitelju do punog {osd} stane samo {fits}.',
      nAdded: ['{n} disk više na {big}: sirovi kapacitet {rawFrom} → {rawTo}, a bazen staje kod {capFrom} → {capTo}.',
        '{n} diska više na {big}: sirovi kapacitet {rawFrom} → {rawTo}, a bazen staje kod {capFrom} → {capTo}.',
        '{n} diskova više na {big}: sirovi kapacitet {rawFrom} → {rawTo}, a bazen staje kod {capFrom} → {capTo}.'],
      nHqNaive: 'Sirovo slobodno ÷ 2 bilo bi {naive}.',
      diskOn: ['{n} disku', '{n} diska', '{n} diskova'],
      diskPo: ['{n} disk', '{n} diska', '{n} diskova'],

      explain:
        '<p>Grozd nema „slobodnog prostora”: ima najpuniji <em lang="en">OSD</em> (spremišni disk s demonom). ' +
        'Kad on dosegne prag <em lang="en">full</em> (95 % svoje veličine), pisanje u svaki PG s kopijom na njemu staje, ' +
        'a kako svaki PG bazena prima podatke, staje cijeli bazen. Prije toga grozd upozorava: ' +
        '<em lang="en">nearfull</em> (gotovo pun) na 85 % i <em lang="en">backfillfull</em> na 90 %.</p>' +
        '<p><em lang="en">MAX AVAIL</em> u ispisu <code>ceph df</code> zato nije sirovo slobodno podijeljeno brojem kopija, nego ' +
        'projekcija iz OSD-a koji će se prvi napuniti: koliko još stane dok se on ne napuni, ako se novi podaci šire po ' +
        '<em lang="en">CRUSH weight</em> (težina, u TiB veličine diska).</p>' +
        '<p>S tri kopije (<em lang="en">replica</em>, kopija) i domenom kvara poslužitelj (<em lang="en">failure domain</em>) na ' +
        'tri poslužitelja svaki PG mora imati po jednu kopiju na svakom: <b>svaki poslužitelj drži cijelu kopiju bazena</b>, ' +
        'koliko god diskova imao. Poslužitelj s dva diska raspoređuje tu kopiju na dva, onaj s dvanaest na dvanaest, pa se mali ' +
        'puni šest puta brže i odlučuje. Dodavanje diskova velikom poslužitelju podiže sirovi kapacitet (<em lang="en">raw ' +
        'capacity</em>), ali ne i upotrebljivi (<em lang="en">usable capacity</em>). Ceph-ova projekcija to ne zna: ' +
        'pretpostavlja raspodjelu po težini, pa ovdje obećava više nego što stane.</p>' +
        '<p>Različite veličine diskova same po sebi ne stvaraju neravnotežu: CRUSH većem disku daje veću težinu pa on dobiva ' +
        'razmjerno više PG-ova i puni se jednako brzo. Neravnoteža dolazi od poslužitelja koji moraju nositi jednako, a imaju ' +
        'nejednako diskova. Uz vrlo neravnomjerne poslužitelje CRUSH ponekad ne nađe treći poslužitelj u 50 pokušaja i PG ostane ' +
        's kopijom manje; to ovdje nije prikazano.</p>' +
        '<p>Preset Sjedište prikazuje grozd iz materijala za vježbe: svaki broj izračunat je iz ' +
        '<code>ceph osd df</code> i težina iz <code>ceph osd tree</code>.</p>'
    },

    en: {
      stage: 'Hosts as columns, OSDs as fill bars with the 85, 90 and 95 % thresholds',

      cluster: 'Cluster',
      clusterLab: 'three hosts',
      clusterHq: 'HQ',
      smallHostDisks: 'Disks, small hosts',
      bigHostDisks: 'Disks, big host',
      diskGiB: 'Size of every disk',
      storedTiB: 'Store more data',
      size: 'Copies (size)',

      pUnbalanced: 'Unbalanced hosts',
      pUnbalancedHint: 'One host with 12 disks, two with 2 each; size 3, 8 TiB of data.',
      pAddBig: 'Four more disks on the big host',
      pAddBigHint: 'Raw capacity grows, the limit stays.',
      pFill: 'Fill the pool',
      pFillHint: '14 TiB of data: the fullest OSD crosses the thresholds while the cluster is a third full.',
      pOneSmall: 'One small disk',
      pOneSmallHint: 'The small hosts have one 447 GiB disk each: every PG needs a copy on it.',
      pHq: 'HQ: "only 38 % full"',
      pHqHint: 'The cluster from the exercise material: 38 % raw, yet MAX AVAIL only 3.4 TiB.',

      legBar: 'OSD: outline = size, fill = used',
      legOver: 'past a threshold (hatched)',
      legFull: 'full, 95 % (cross-hatched)',
      legLine: 'thresholds 85 / 90 / 95 %',
      legDecide: 'fullest, decides (▲)',
      legHost: 'host',
      legChanged: 'just crossed a threshold',

      tib: '{n}\u00a0TiB',
      gib: '{n}\u00a0GiB',
      pct: '{n}\u00a0%',

      dfRaw: 'Raw capacity',
      dfRawSub: ['{n} OSD in the cluster', '{n} OSDs in the cluster'],
      dfUsed: 'Raw used',
      dfUsedSub: '{stored} of data × {size} copies',
      dfUsedSubHq: 'all pools together',
      dfNaive: 'Raw free ÷ {size}',
      dfNaiveSub: 'what "{pct} full" suggests',
      dfMax: 'MAX AVAIL ({pool})',
      dfMaxSub: 'projected from osd.{id}',
      dfFits: 'Fits before osd.{id} is full',
      dfFitsSub: 'by the actual placement',
      dfFitsFull: 'nothing: the pool is full',

      healthOk: 'no OSD near full',
      hsOk: 'HEALTH_OK',
      hsWarn: 'HEALTH_WARN',
      hsErr: 'HEALTH_ERR',
      hNear: ['{n} OSD nearfull', '{n} OSDs nearfull'],
      hBackfill: ['{n} OSD past backfillfull', '{n} OSDs past backfillfull'],
      hFull: ['{n} OSD full', '{n} OSDs full'],
      hPoolFull: 'pool full: writes stopped, {refused} refused',

      hostDisks: ['{n} disk × {size}', '{n} disks × {size}'],
      hostHolds: 'holds {data}',
      hostCopy: 'holds {data} = a full copy',
      hostFill: 'fill {lo}–{hi}',
      hostFillOne: 'fill {pct}',
      decides: '▲ osd.{id} decides: {pct}',
      osdOut: 'out',
      osdAria: 'osd.{id}: {used} of {size}, {pct}, {level}',
      line: '{n} %',

      lvl_ok: 'below the thresholds',
      lvl_nearfull: 'nearfull (85 %)',
      lvl_backfillfull: 'past backfillfull (90 %)',
      lvl_full: 'full (95 %)',
      lvl_out: 'out of the cluster',

      cCopy: 'The cluster is {raw} full, but {osd} is at {pct}: every host has to carry a full copy of the data, and {host} keeps it on only {disks}, so that host decides how much more can be written (*MAX AVAIL*).',
      cEven: 'All three hosts have {disks} each: each has to carry a full copy on the same number of disks, so they fill evenly; {osd} at {pct} decides only because PGs differ in size.',
      cCopyOther: 'The cluster is {raw} full. The hosts have nearly the same number of disks, so they fill about evenly; {osd} at {pct} decides only because PGs differ in size.',
      cSize2: 'With two copies a PG takes two of the three hosts, and CRUSH picks them by weight, so the host with more disks gets more copies, and no host has to carry a full copy any more. {osd} at {pct} still decides *MAX AVAIL*.',
      cEmpty: 'The pool is empty. {osd} will fill first: {fits} fits until then, while raw free ÷ {size} promises {naive}.',
      cFull: 'The pool is full: {osd} reached 95 % at {stored} of data, so the remaining {refused} was refused, while the cluster is only {raw} full.',
      cHq: 'HQ: the cluster is {raw} full, but {osd} is at {pct}, nearfull, so {pool} takes only {max} more (*MAX AVAIL*).',
      nLevel: 'The cluster already warns: {osd} is {level}.',
      nOver: '*MAX AVAIL* promises {max} because it assumes new data spreads by weight; with a full copy per host only {fits} fits before {osd} is full.',
      nAdded: ['{n} more disk on {big}: raw capacity {rawFrom} → {rawTo}, and the pool stops at {capFrom} → {capTo}.',
        '{n} more disks on {big}: raw capacity {rawFrom} → {rawTo}, and the pool stops at {capFrom} → {capTo}.'],
      nHqNaive: 'Raw free ÷ 2 would be {naive}.',
      diskOn: ['{n} disk', '{n} disks'],
      diskPo: ['{n} disk', '{n} disks'],

      explain:
        '<p>A cluster has no "free space": it has a fullest OSD (a storage disk with its daemon). When that one reaches the ' +
        '<em>full</em> ratio (95 % of its size), writes to every PG with a copy on it stop, and since every PG of a pool takes ' +
        'data, the whole pool stops. Before that the cluster warns: <em>nearfull</em> at 85 % and <em>backfillfull</em> at 90 %.</p>' +
        '<p>So <em>MAX AVAIL</em> in <code>ceph df</code> is not raw free space divided by the number of copies, but a ' +
        'projection from the OSD that will fill first: how much more fits before it is full, if new data spreads by ' +
        '<em>CRUSH weight</em> (the disk\'s size in TiB).</p>' +
        '<p>With three copies (<em>replicas</em>) and failure domain host on three hosts, every PG needs one copy on each: ' +
        '<b>every host holds a full copy of the pool</b>, whatever its disk count. A host with two disks spreads that copy over ' +
        'two, one with twelve over twelve, so the small one fills six times faster and decides. Adding disks to the big host ' +
        'raises raw capacity but not usable capacity. Ceph\'s projection does not know this: it assumes the spread by weight, ' +
        'so here it promises more than fits.</p>' +
        '<p>Different disk sizes alone do not unbalance a cluster: CRUSH weights a bigger disk more, so it takes ' +
        'proportionally more PGs and fills at the same rate. The imbalance comes from hosts that must carry the same amount ' +
        'with unequal numbers of disks. With very uneven hosts CRUSH sometimes finds no third host in 50 tries and a PG ' +
        'is left a copy short; that is not drawn here.</p>' +
        '<p>The HQ preset shows the cluster from the exercise material: every number is computed from ' +
        '<code>ceph osd df</code> and the weights in <code>ceph osd tree</code>.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
