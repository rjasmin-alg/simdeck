/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the LVM topology page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). English text adapted from
   single-page-labs/lvm-topology-lab-v2.html; Croatian written for simdeck, with the terms of the UL book (ch. 12).
   Device, VG and LV names and the commands are data, not words: the page shows them with translate="no".
   Terms missing from kit/glossary.js (striping, thin pool, thin LV, physical and logical extent) are written out
   here: NOTES.md "Term pairs". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'LVM: karta fizičkih ekstenata, slojevi blokovnih uređaja i naredbe',
      // presets
      presetBasic: 'Osnovni LVM',
      presetBasicHint: 'Jedan disk, jedna grupa, jedan linearni LV',
      presetSpan: 'Dva diska',
      presetSpanHint: 'VG na dva diska: linearni LV veći od jednog diska prelazi na drugi',
      presetStriped: 'Vrpčanje',
      presetStripedHint: 'Vrpčanje, kao RAID0: logički ekstenti naizmjence na tri diska',
      presetRaid1: 'RAID1 zrcalo',
      presetRaid1Hint: 'Svaki logički ekstent na oba diska: logička veličina naspram potrošenih fizičkih ekstenata',
      presetRaid5: 'RAID5',
      presetRaid5Hint: 'Četiri diska, paritet se seli iz reda u red',
      presetLuksBelow: 'LUKS → LVM',
      presetLuksBelowHint: 'Šifriranje ispod LVM-a: diskovi su šifrirani prije nego što postanu PV-ovi',
      presetLuksAbove: 'LVM → LUKS',
      presetLuksAboveHint: 'Šifriranje iznad LVM-a: šifriran je samo jedan LV',
      presetThin: 'Tanki bazen',
      presetThinHint: 'Dva tanka LV-a obećavaju više nego što bazen ima',
      // controls
      layout: 'Raspored (vrsta segmenta)',
      layoutLinear: 'Linearni',
      layoutStriped: 'Vrpčanje (kao RAID0)',
      layoutRaid1: 'RAID1',
      layoutRaid5: 'RAID5',
      layoutThin: 'Tanki bazen i tanki LV-ovi',
      crypt: 'Gdje je šifriranje (LUKS)',
      cryptNone: 'Nema',
      cryptBelow: 'Ispod LVM-a',
      cryptAbove: 'Iznad LV-a',
      disks: 'Broj diskova',
      diskPE: 'Veličina diska (nastavni PE)',
      size: 'Veličina LV-a (logički ekstenti)',
      width: 'Trake / kopije / članovi',
      lv2: 'Drugi LV, bez LUKS-a (ekstenti)',
      virt: 'Virtualna veličina svakog tankog LV-a',
      // legend
      legendFree: 'slobodan PE',
      legendLv: 'PE logičkog volumena (broj = LE)',
      legendLv2: 'drugi LV',
      legendParity: 'paritet (P)',
      // counters
      kpiRaw: 'PE na diskovima',
      kpiAlloc: 'zauzetih fizičkih PE',
      kpiLogical: 'logičkih ekstenata za datotečne sustave',
      kpiRatio: 'omjer fizičko / logičko',
      none: '—',
      // the extent map
      mapTitle: 'Diskovi i zauzeće fizičkih ekstenata',
      diskSub: '{n} PE · {mib} MiB',
      inVg: 'VG {vg} · zauzeto {used}/{n}',
      peTitleFree: '{disk}, PE {pe}: slobodan',
      peTitleData: '{disk}, PE {pe}: LV {lv}, LE {le}',
      peTitleCopy: '{disk}, PE {pe}: LV {lv}, LE {le}, kopija {copy}',
      peTitleParity: '{disk}, PE {pe}: LV {lv}, paritet reda {row}',
      // the layers
      topoTitle: 'Slojevi blokovnih uređaja, odozgo prema dolje',
      layerDisks: 'Diskovi',
      layerLuks: 'LUKS',
      layerPV: 'Fizički volumeni',
      layerVG: 'Grupa volumena',
      layerMembers: 'Članovi RAID-a',
      layerLV: 'Logički volumeni',
      layerFS: 'Datotečni sustav',
      nodeLuks: 'šifrirani {disk}',
      nodePV: '{n} PE',
      nodeVG: '{pvs} PV · slobodno {free} PE',
      memberStripe: 'traka {i}',
      memberRaid1: 'kopija {i}',
      memberRaid5: 'član {i}: podaci i paritet',
      typeLinear: 'linearni',
      typeStriped: 'vrpčani',
      typeRaid1: 'RAID1',
      typeRaid5: 'RAID5',
      typeThinpool: 'tanki bazen',
      typeThin: 'tanki',
      nodeLV: '{type} · {le} LE · {mib} MiB',
      nodeThin: '{type} · {le} LE virtualno',
      nodeFailed: 'nije alociran',
      nodeLuksAbove: 'LUKS iznad {lv}',
      fsExample: 'ext4 (primjer)',
      // the commands
      cmdTitle: 'Približan slijed naredbi',
      cmdNote: '# Nastavni prijevod: odabir uređaja i točne opcije u stvarnom sustavu mogu se razlikovati.',
      cmdFailed: '# ne uspijeva',
      // caption
      le: ['{n} logički ekstent', '{n} logička ekstenta', '{n} logičkih ekstenata'],
      pe: ['{n} fizički ekstent', '{n} fizička ekstenta', '{n} fizičkih ekstenata'],
      ruleLinear: 'Linearni LV uzima slobodne fizičke ekstente redom, disk za diskom.',
      ruleStriped: 'Vrpčanje izmjenjuje logičke ekstente na {n} PV-a: LE 0 na prvom, LE 1 na drugom i tako redom.',
      ruleRaid1: 'RAID1 sprema svaki logički ekstent na {n} PV-a, u {n} primjerka.',
      ruleRaid5: 'RAID5 na {n} PV-a: svaki red nosi {d} podatkovna ekstenta i jedan paritetni, a paritet se iz reda u red seli na sljedeći PV.',
      ruleThin: 'Tanki bazen uzima fizičke ekstente odmah; tanki LV-ovi iz njega dobivaju blokove tek kad se na njih piše.',
      resultLv: 'LV {lv}: {le} na {pe}.',
      resultThinOver: 'Tanki LV-ovi obećavaju {le}, više nego što bazen ima.',
      resultThinFits: 'Tanki LV-ovi obećavaju {le}, koliko bazen može pokriti.',
      rounded: 'Veličina je zaokružena naviše: {from} → {to} LE, cijeli broj redova.',
      luksBelow: 'LUKS je ispod LVM-a: PV-ovi su otvoreni LUKS uređaji, pa su metapodaci grupe i svi LV-ovi šifrirani.',
      luksAbove: 'LUKS je iznad LVM-a: šifriran je samo {lv}, a LVM i dalje vidi raspored svakog LV-a.',
      freeInVg: 'Slobodno u grupi: {pe}.',
      errNoSpace: 'LV {lv} se ne može alocirati: treba {need} ekstenata, a slobodno ih je {free}.',
      errNeedPVs: 'LV {lv} se ne može alocirati: potrebna su barem {n} PV-a sa slobodnim prostorom.',
      errRowSpace: 'LV {lv} se ne može alocirati: na svakom od {n} PV-a mora biti slobodno barem {rows} PE.',
      errRaid1Space: 'LV {lv} se ne može alocirati: RAID1 s {n} kopije treba {n} PV-a, na svakom slobodno barem {size} PE.',
      notCreated: 'Karta ostaje kakva je bila.',
      // the explanation
      explain:
        '<h3>Slojevi</h3>' +
        '<p>Disk ili particija je sirovi blokovni uređaj. [[Logical Volume Manager]] (LVM) od njega napravi ' +
        '[[physical volume]] (PV) i izreže ga na fizičke ekstente (PE). [[extent]] je najmanji komad koji grupa dodjeljuje. ' +
        'Svaki kvadratić na karti je jedan simulirani PE od 4 MiB, koliko je i zadano u LVM-u. Mali simulirani disk pokazuje svaki PE; ' +
        'pravi LVM može imati milijune ekstenata.</p>' +
        '<p>[[volume group]] (VG) je spremnik od jednog ili više PV-ova: slobodni PE-ovi svih njegovih PV-ova postaju ' +
        'prostor koji se može dodijeliti. [[logical volume]] (LV) je blokovni uređaj sastavljen od ekstenata grupe; ' +
        'na njemu je [[file system]].</p>' +
        '<h3>Logički i fizički ekstenti</h3>' +
        '<p>Logički ekstenti (LE) običnog LV-a preslikavaju se na fizičke ekstente grupe. Vrpčanje (<em lang="en">striping</em>) ' +
        'ih izmjenjuje na više PV-ova. RAID dodaje kopije ili [[parity]], pa jedan logički ekstent troši više fizičkih.</p>' +
        '<ul>' +
        '<li><b>RAID1</b>, [[mirroring]]: svaki logički ekstent ima kopiju na drugom PV-u, pa je upotrebljivi prostor manji od sirovog.</li>' +
        '<li><b>RAID5</b>: podaci i [[=parity]] raspoređeni su na barem tri uređaja; u svakom redu jedan uređaj nosi paritet.</li>' +
        '</ul>' +
        '<h3>Šifriranje ispod ili iznad</h3>' +
        '<ul>' +
        '<li><b>LUKS ispod LVM-a</b>: disk → LUKS → PV → VG → LV. Metapodaci LVM-a i svi LV-ovi su unutar šifriranog sloja.</li>' +
        '<li><b>LUKS iznad LVM-a</b>: disk → PV → VG → LV → LUKS. LVM vidi raspored LV-ova, a šifriran je sadržaj samo odabranih.</li>' +
        '</ul>' +
        '<h3>Tanki bazen</h3>' +
        '<p>Tanki bazen (<em lang="en">thin pool</em>) je posebni LV iz kojega tanki LV-ovi (<em lang="en">thin LV</em>) dobivaju ' +
        'blokove tek kad se na njih piše. Zbroj njihovih virtualnih veličina smije biti veći od bazena.</p>' +
        '<h3>Za predavanje</h3>' +
        '<p>Kreni od <i>Osnovni LVM</i>, pa povećaj broj diskova i LV. Prebaci na RAID1 i usporedi logičku veličinu s ' +
        'potrošenim fizičkim ekstentima. Na kraju usporedi oba redoslijeda LUKS-a.</p>' +
        '<p>Naredbe su nastavni prijevod modela: odabir uređaja i točne opcije u stvarnom sustavu mogu se razlikovati.</p>'
    },
    en: {
      stage: 'LVM: physical extent map, block-device layers and commands',
      // presets
      presetBasic: 'Basic LVM',
      presetBasicHint: 'One disk, one group, one linear LV',
      presetSpan: 'Spanned VG',
      presetSpanHint: 'A linear LV larger than one disk continues on the next',
      presetStriped: 'Striped',
      presetStripedHint: 'Striping, RAID0-like: logical extents alternate across three disks',
      presetRaid1: 'RAID1 mirror',
      presetRaid1Hint: 'Every logical extent on both disks: logical size against physical extents consumed',
      presetRaid5: 'RAID5',
      presetRaid5Hint: 'Four disks, the parity moves from row to row',
      presetLuksBelow: 'LUKS → LVM',
      presetLuksBelowHint: 'Encryption below LVM: the disks are encrypted before they become PVs',
      presetLuksAbove: 'LVM → LUKS',
      presetLuksAboveHint: 'Encryption above LVM: only one LV is encrypted',
      presetThin: 'Thin pool',
      presetThinHint: 'Two thin LVs promise more than the pool holds',
      // controls
      layout: 'Layout / segment type',
      layoutLinear: 'Linear',
      layoutStriped: 'Striped (RAID0-like)',
      layoutRaid1: 'RAID1',
      layoutRaid5: 'RAID5',
      layoutThin: 'Thin pool and thin LVs',
      crypt: 'Encryption placement (LUKS)',
      cryptNone: 'None',
      cryptBelow: 'Below LVM',
      cryptAbove: 'Above the LV',
      disks: 'Number of disks',
      diskPE: 'Disk size, in teaching PEs',
      size: 'LV size (logical extents)',
      width: 'Stripes / copies / members',
      lv2: 'Second LV, without LUKS (extents)',
      virt: 'Virtual size of each thin LV',
      // legend
      legendFree: 'free PE',
      legendLv: 'PE of a logical volume (number = LE)',
      legendLv2: 'second LV',
      legendParity: 'parity (P)',
      // counters
      kpiRaw: 'raw PEs',
      kpiAlloc: 'allocated physical PEs',
      kpiLogical: 'logical extents for filesystems',
      kpiRatio: 'physical / logical ratio',
      none: '—',
      // the extent map
      mapTitle: 'Disk and PE allocation map',
      diskSub: '{n} PEs · {mib} MiB',
      inVg: 'VG {vg} · {used}/{n} used',
      peTitleFree: '{disk}, PE {pe}: free',
      peTitleData: '{disk}, PE {pe}: LV {lv}, LE {le}',
      peTitleCopy: '{disk}, PE {pe}: LV {lv}, LE {le}, copy {copy}',
      peTitleParity: '{disk}, PE {pe}: LV {lv}, parity of row {row}',
      // the layers
      topoTitle: 'Block-device layers, read top to bottom',
      layerDisks: 'Disks',
      layerLuks: 'LUKS',
      layerPV: 'Physical volumes',
      layerVG: 'Volume group',
      layerMembers: 'RAID members',
      layerLV: 'Logical volumes',
      layerFS: 'Filesystem',
      nodeLuks: 'encrypted {disk}',
      nodePV: '{n} PEs',
      nodeVG: '{pvs} PV · {free} PEs free',
      memberStripe: 'stripe lane {i}',
      memberRaid1: 'copy {i}',
      memberRaid5: 'data/parity member {i}',
      typeLinear: 'linear',
      typeStriped: 'striped',
      typeRaid1: 'RAID1',
      typeRaid5: 'RAID5',
      typeThinpool: 'thin pool',
      typeThin: 'thin',
      nodeLV: '{type} · {le} LE · {mib} MiB',
      nodeThin: '{type} · {le} LE virtual',
      nodeFailed: 'not allocated',
      nodeLuksAbove: 'LUKS above {lv}',
      fsExample: 'ext4 (example)',
      // the commands
      cmdTitle: 'Approximate command sequence',
      cmdNote: '# A teaching translation: device selection and exact options may differ in production.',
      cmdFailed: '# fails',
      // caption
      le: ['{n} logical extent', '{n} logical extents'],
      pe: ['{n} physical extent', '{n} physical extents'],
      ruleLinear: 'A linear LV takes free physical extents in order, one disk after the other.',
      ruleStriped: 'Striping alternates logical extents across {n} PVs: LE 0 on the first, LE 1 on the second, and so on.',
      ruleRaid1: 'RAID1 stores every logical extent on {n} PVs, {n} copies of each.',
      ruleRaid5: 'RAID5 on {n} PVs: each row holds {d} data extents and one parity extent, and the parity moves to the next PV in each row.',
      ruleThin: 'A thin pool takes physical extents now; thin LVs get blocks from it only when data is written.',
      resultLv: 'LV {lv}: {le} on {pe}.',
      resultThinOver: 'The thin LVs promise {le}, more than the pool holds.',
      resultThinFits: 'The thin LVs promise {le}, which the pool can cover.',
      rounded: 'Size rounded up: {from} → {to} LE, a whole number of rows.',
      luksBelow: 'LUKS is below LVM: the PVs are the opened LUKS devices, so the VG metadata and every LV are encrypted.',
      luksAbove: 'LUKS is above LVM: only {lv} is encrypted, and LVM still sees the layout of every LV.',
      freeInVg: 'Free in the VG: {pe}.',
      errNoSpace: 'LV {lv} cannot be allocated: it needs {need} extents and {free} are free.',
      errNeedPVs: 'LV {lv} cannot be allocated: it needs at least {n} PVs with free space.',
      errRowSpace: 'LV {lv} cannot be allocated: each of the {n} PVs needs at least {rows} free PEs.',
      errRaid1Space: 'LV {lv} cannot be allocated: RAID1 with {n} copies needs {n} PVs, each with at least {size} free PEs.',
      notCreated: 'The map stays as it was.',
      // the explanation
      explain:
        '<h3>Layers</h3>' +
        '<p>A disk or partition is the raw block device. The [[Logical Volume Manager]] (LVM) initialises it as a ' +
        '[[physical volume]] (PV) and cuts it into physical extents (PEs). An [[extent]] is the smallest chunk the group allocates. ' +
        'Every square in the map is one simulated PE of 4 MiB, LVM\'s default. A small simulated disk makes each PE visible; ' +
        'real LVM can contain millions of extents.</p>' +
        '<p>A [[volume group]] (VG) is a storage pool made from one or more PVs: the free PEs of all its PVs become ' +
        'allocatable capacity. A [[logical volume]] (LV) is a block device assembled from the group\'s extents; ' +
        'it carries a [[file system]].</p>' +
        '<h3>Logical and physical extents</h3>' +
        '<p>The logical extents (LEs) of a normal LV map onto physical extents of the group. Striping alternates them ' +
        'across several PVs. RAID adds copies or [[parity]], so one logical extent uses more than one physical extent.</p>' +
        '<ul>' +
        '<li><b>RAID1</b>, [[mirroring]]: every logical extent has a copy on another PV, so usable capacity is lower than raw capacity.</li>' +
        '<li><b>RAID5</b>: data and [[=parity]] are striped across at least three devices; in each row one device holds the parity.</li>' +
        '</ul>' +
        '<h3>Encryption below or above</h3>' +
        '<ul>' +
        '<li><b>LUKS below LVM</b>: disk → LUKS → PV → VG → LV. The LVM metadata and every LV are inside the encrypted layer.</li>' +
        '<li><b>LUKS above LVM</b>: disk → PV → VG → LV → LUKS. LVM sees the LV layout, while only selected LV contents are encrypted.</li>' +
        '</ul>' +
        '<h3>Thin pool</h3>' +
        '<p>A thin pool is a special LV from which thin LVs receive blocks on demand. The sum of their virtual sizes ' +
        'may exceed the pool.</p>' +
        '<h3>In the lecture</h3>' +
        '<p>Start with <i>Basic LVM</i>, then add disks and grow the LV. Switch to RAID1 and compare the logical size with ' +
        'the physical extents consumed. Finally compare both LUKS stacking orders.</p>' +
        '<p>The commands are a teaching translation of the model: device selection and exact options may differ in production.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
