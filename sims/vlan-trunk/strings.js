/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of vlan-trunk, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json. Terms (URM ch07, ch12): access port — pristupni priključak; trunk port —
   trunk priključak; tag — oznaka; VLAN identifier (VID) — VLAN identifikator; native VLAN — nativni VLAN; allowed
   VLAN list — popis dopuštenih VLAN-ova; broadcast domain — broadcast domena. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Okviri između dva preklopnika',

      link: 'Kabel SW1 – SW2',
      linkTrunk: 'trunk',
      linkAccess10: 'pristupni 10',
      linkAccess20: 'pristupni 20',
      native1: 'Nativni VLAN na SW1 (i M1)',
      native2: 'Nativni VLAN na SW2 (i M2)',
      allow20: 'VLAN 20 dopušten na trunku',
      send: 'Što se šalje',
      sendRa: 'Ra',
      sendPr: 'Pr',
      sendBcast: 'Pr svima',
      sendM: 'M i Ra',
      sendBoth: 'Ra i Pr',

      presetTrunk: 'Trunk',
      presetAccess: 'Kabel kao pristupni',
      presetAccessHint: 'Primjer 5 (b): kabel je pogreškom pristupni, u VLAN-u 10. Što bude s VLAN-om 20?',
      presetBcast: 'Broadcast',
      presetNative: 'Nativni VLAN',
      presetMismatch: 'Različiti nativni VLAN',
      presetMismatchHint: 'SW1 ima nativni VLAN 1, SW2 nativni VLAN 99. Gdje završi okvir iz VLAN-a 1?',
      presetAllowed: 'VLAN 20 nije dopušten',
      presetAllowedHint: 'Na trunku je VLAN 20 izbačen s popisa dopuštenih.',

      legV10: 'VLAN 10',
      legV20: 'VLAN 20',
      legVn: 'VLAN 1',
      legV99: 'VLAN 99',
      legTagged: 's oznakom (VID)',
      legUntagged: 'bez oznake',
      legDrop: 'odbačen',
      legChanged: 'promijenjeno',

      // field strips
      stripIdle: 'Okviri čekaju na računalima, bez oznake.',
      atHost: 'kod {h}',
      atLink: 'na vezi {a} – {b}',
      atCable: 'na kabelu {a} – {b}',
      atSwitch: 'u {sw}, VLAN {v}',
      atDropped: 'odbačen u {sw}',
      atGot: '{h} ga je primio',
      atIgnored: '{h} ga odbacuje',
      fDst: 'odredišni MAC',
      fSrc: 'izvorišni MAC',
      fTag: '802.1Q oznaka',
      fType: 'tip',
      fLen: 'duljina',
      tagNone: 'nema oznake',
      bytes: '{n} okteta',
      bcastMac: 'svima',

      // topology and tables
      nameRa: 'računovodstvo',
      namePr: 'prodaja',
      nameM: 'nativni VLAN',
      vlanOf: 'VLAN {v}',
      bSends: 'šalje',
      bGot: '✓ primio',
      bLeak: '✓ tuđi VLAN',
      bIgnored: 'nije za njega',
      bDrops: '✕ odbacuje',
      bVlan: 'VLAN {v}',
      chipTag: 'VID {v}',
      chipUntagged: 'bez oznake',
      cfgTitle: '{sw} priključak',
      colMode: 'način',
      colVlan: 'VLAN',
      colAllowed: 'dopušteni',
      modeAccess: 'pristupni',
      modeTrunk: 'trunk',
      nativeV: 'nativni {v}',
      none: '—',

      // captions
      capStart: 'Računala šalju obične okvire bez oznake: {list}. Pritisni → za korak 1.',
      capStep: 'Korak {n}:',
      capWho: '{f}:',
      cSend: '{src} šalje okvir bez oznake ({len} okteta) na {sw} {port}.',
      cInPort: '{sw} ga prima na pristupnom {port} i stavlja u VLAN {v};',
      cInTag: '{sw} na trunku {port} čita oznaku VID {v}: VLAN {v};',
      cInNative: '{sw} na trunku {port} prima okvir bez oznake pa ga stavlja u svoj nativni VLAN {v};',
      cLeak: 'okvir iz VLAN-a {a} procurio je u VLAN {b}, a u okviru nema traga pogreške;',
      cFwdKnown: 'odredište je na {out}.',
      cFwdUnknown: '{dst} u VLAN-u {v} ne poznaje, pa ga šalje na sve ostale priključke VLAN-a {v}: {out}.',
      cFwdBcast: 'broadcast ide na sve ostale priključke VLAN-a {v}: {out}.',
      cFwdNone: 'osim {port} nema nijednog priključka u VLAN-u {v}, pa okvir staje ✕.',
      cOutTag: '{sw} ga šalje na trunk {port} i umeće oznaku VID {v} — 1518 → 1522 okteta.',
      cOutNative: '{sw} ga šalje na trunk {port} bez oznake: VLAN {v} je nativni — 1518 okteta.',
      cOutAccess: '{sw} ga šalje kroz pristupni {port} (VLAN {v}) bez oznake — 1518 okteta.',
      cDeliverUntag: '{sw} skida oznaku VID {v} — 1522 → 1518 okteta — i predaje okvir kroz {port}: {host} ga prima ✓.',
      cDeliver: '{sw} ga predaje kroz {port} bez oznake: {host} ga prima ✓.',
      cDeliverLeak: '{host} je u VLAN-u {b}, a okvir je krenuo iz VLAN-a {a}.',
      cIgnore: '{sw} ga šalje kroz {port}; odredišni MAC nije {host}-ov, pa ga {host} odbacuje.',
      cIgnoreUntag: '{sw} skida oznaku VID {v} — 1522 → 1518 okteta — i šalje okvir kroz {port}; odredišni MAC nije {host}-ov, pa ga {host} odbacuje.',
      cDropOut: '{sw} ne šalje okvir VLAN-a {v} na trunk {port}: VLAN {v} nije na popisu dopuštenih ✕.',
      cDropIn: '{sw} odbacuje okvir VLAN-a {v} na trunku {port}: nije na popisu dopuštenih ✕.',
      cDropInNative: '{sw} na trunku {port} prima okvir bez oznake, dakle u svom nativnom VLAN-u {v}, a VLAN {v} nije na popisu dopuštenih: odbacuje ga ✕.',
      cDropTagged: '{sw} odbacuje okvir s oznakom na pristupnom {port} ✕.',
      cDropOther: '{sw} ne šalje okvir VLAN-a {v} kroz {port} ✕.',

      explain: '<p>Računalo šalje obični okvir bez oznake na <b>pristupni priključak</b> (<i>access port</i>), koji ' +
        'okvir stavlja u svoj VLAN. Kad okvir treba prijeći na drugi preklopnik vezom koja nosi više VLAN-ova, ' +
        '<b><i>trunk</i> priključak</b> mu odmah iza izvorišne MAC adrese umeće <b>802.1Q oznaku</b> od 4 okteta: ' +
        'TPID 0x8100, prioritet (PCP), DEI i 12-bitni <b>VLAN identifikator</b> (VID, 1–4094). Okvir naraste s 1518 na ' +
        '1522 okteta. Preklopnik na drugom kraju po oznaci zna VLAN, skida je i predaje okvir bez oznake. Računala ' +
        'oznaku nikad ne vide.</p>' +
        '<p><b>Nativni VLAN</b> (<i>native VLAN</i>) je iznimka: njegov promet ide <i>trunkom</i> bez oznake, a okvir ' +
        'koji stigne bez oznake ide u nativni VLAN priključka koji ga je primio. Ako se nativni VLAN-ovi na dva kraja ' +
        'razlikuju, okvir tiho prelazi iz jednog VLAN-a u drugi. Preklopnici koji razmjenjuju protokol za otkrivanje ' +
        'susjeda mogu na to upozoriti, a neki takav priključak i blokiraju; sam okvir to ne može pokazati.</p>' +
        '<p><b>Popis dopuštenih VLAN-ova</b>: <i>trunk</i> po zadanome nosi sve, ali VLAN izbačen s popisa ne prolazi. ' +
        'Kabel postavljen kao pristupni nosi samo jedan VLAN, bez oznake.</p>' +
        '<p>Česte zablude: računala ne označavaju svoje okvire; nije svaki okvir na <i>trunku</i> označen (nativni ' +
        'nije); jedan kabel između preklopnika sam od sebe ne nosi sve VLAN-ove.</p>'
    },
    en: {
      stage: 'Frames between two switches',

      link: 'Cable SW1 – SW2',
      linkTrunk: 'trunk',
      linkAccess10: 'access 10',
      linkAccess20: 'access 20',
      native1: 'Native VLAN on SW1 (and M1)',
      native2: 'Native VLAN on SW2 (and M2)',
      allow20: 'VLAN 20 allowed on the trunk',
      send: 'What is sent',
      sendRa: 'Ra',
      sendPr: 'Pr',
      sendBcast: 'Pr to all',
      sendM: 'M and Ra',
      sendBoth: 'Ra and Pr',

      presetTrunk: 'Trunk',
      presetAccess: 'Cable as access',
      presetAccessHint: 'Example 5 (b): the cable is set as access in VLAN 10 by mistake. What happens to VLAN 20?',
      presetBcast: 'Broadcast',
      presetNative: 'Native VLAN',
      presetMismatch: 'Native VLAN mismatch',
      presetMismatchHint: 'SW1 has native VLAN 1, SW2 native VLAN 99. Where does the VLAN 1 frame end up?',
      presetAllowed: 'VLAN 20 not allowed',
      presetAllowedHint: 'VLAN 20 has been removed from the trunk\'s allowed list.',

      legV10: 'VLAN 10',
      legV20: 'VLAN 20',
      legVn: 'VLAN 1',
      legV99: 'VLAN 99',
      legTagged: 'tagged (VID)',
      legUntagged: 'untagged',
      legDrop: 'dropped',
      legChanged: 'changed',

      stripIdle: 'The frames wait at the hosts, untagged.',
      atHost: 'at {h}',
      atLink: 'on the link {a} – {b}',
      atCable: 'on the cable {a} – {b}',
      atSwitch: 'in {sw}, VLAN {v}',
      atDropped: 'dropped in {sw}',
      atGot: '{h} received it',
      atIgnored: '{h} discards it',
      fDst: 'destination MAC',
      fSrc: 'source MAC',
      fTag: '802.1Q tag',
      fType: 'type',
      fLen: 'length',
      tagNone: 'no tag',
      bytes: '{n} bytes',
      bcastMac: 'everyone',

      nameRa: 'accounting',
      namePr: 'sales',
      nameM: 'native VLAN',
      vlanOf: 'VLAN {v}',
      bSends: 'sends',
      bGot: '✓ received',
      bLeak: '✓ wrong VLAN',
      bIgnored: 'not for it',
      bDrops: '✕ drops',
      bVlan: 'VLAN {v}',
      chipTag: 'VID {v}',
      chipUntagged: 'untagged',
      cfgTitle: '{sw} port',
      colMode: 'mode',
      colVlan: 'VLAN',
      colAllowed: 'allowed',
      modeAccess: 'access',
      modeTrunk: 'trunk',
      nativeV: 'native {v}',
      none: '—',

      capStart: 'The hosts send plain, untagged frames: {list}. Press → for step 1.',
      capStep: 'Step {n}:',
      capWho: '{f}:',
      cSend: '{src} sends an untagged frame ({len} bytes) to {sw} {port}.',
      cInPort: '{sw} takes it on access port {port} and puts it in VLAN {v};',
      cInTag: '{sw} reads the tag VID {v} on trunk {port}: VLAN {v};',
      cInNative: '{sw} receives an untagged frame on trunk {port}, so it puts it in its native VLAN {v};',
      cLeak: 'the frame from VLAN {a} has leaked into VLAN {b}, and nothing in the frame shows the error;',
      cFwdKnown: 'the destination is on {out}.',
      cFwdUnknown: 'it does not know {dst} in VLAN {v}, so it sends it to every other port of VLAN {v}: {out}.',
      cFwdBcast: 'a broadcast goes to every other port of VLAN {v}: {out}.',
      cFwdNone: 'apart from {port} there is no port in VLAN {v}, so the frame stops ✕.',
      cOutTag: '{sw} sends it onto trunk {port} and inserts the tag VID {v} — 1518 → 1522 bytes.',
      cOutNative: '{sw} sends it onto trunk {port} untagged: VLAN {v} is the native VLAN — 1518 bytes.',
      cOutAccess: '{sw} sends it through access port {port} (VLAN {v}) untagged — 1518 bytes.',
      cDeliverUntag: '{sw} removes the tag VID {v} — 1522 → 1518 bytes — and hands the frame out on {port}: {host} receives it ✓.',
      cDeliver: '{sw} hands it out on {port} untagged: {host} receives it ✓.',
      cDeliverLeak: '{host} is in VLAN {b}, but the frame started in VLAN {a}.',
      cIgnore: '{sw} sends it out on {port}; the destination MAC is not {host}\'s, so {host} discards it.',
      cIgnoreUntag: '{sw} removes the tag VID {v} — 1522 → 1518 bytes — and sends the frame out on {port}; the destination MAC is not {host}\'s, so {host} discards it.',
      cDropOut: '{sw} does not send the VLAN {v} frame onto trunk {port}: VLAN {v} is not in the allowed list ✕.',
      cDropIn: '{sw} drops the VLAN {v} frame on trunk {port}: not in the allowed list ✕.',
      cDropInNative: '{sw} receives an untagged frame on trunk {port}, so in its native VLAN {v}, and VLAN {v} is not in the allowed list: it drops it ✕.',
      cDropTagged: '{sw} drops a tagged frame on access port {port} ✕.',
      cDropOther: '{sw} does not send the VLAN {v} frame out of {port} ✕.',

      explain: '<p>A host sends a plain, untagged frame to an <b>access port</b>, which puts the frame in its VLAN. When ' +
        'the frame has to cross to another switch over a link that carries several VLANs, the <b><i>trunk</i> port</b> ' +
        'inserts a 4-byte <b>802.1Q tag</b> right after the source MAC address: TPID 0x8100, priority (PCP), DEI and ' +
        'the 12-bit <b>VLAN identifier</b> (VID, 1–4094). The frame grows from 1518 to 1522 bytes. The switch at the ' +
        'other end reads the VLAN from the tag, removes it and hands the frame out untagged. Hosts never see the tag.</p>' +
        '<p>The <b>native VLAN</b> is the exception: its traffic crosses the <i>trunk</i> untagged, and an untagged ' +
        'frame that arrives goes into the native VLAN of the port that received it. If the two ends have different ' +
        'native VLANs, the frame silently moves from one VLAN to another. Switches that exchange a neighbour discovery ' +
        'protocol can warn about it, and some block such a port; the frame itself cannot show it.</p>' +
        '<p>The <b>allowed VLAN list</b>: a <i>trunk</i> carries every VLAN by default, but a VLAN removed from the list ' +
        'does not cross. A cable set as an access port carries one VLAN only, untagged.</p>' +
        '<p>Common misconceptions: hosts do not tag their own frames; not every frame on a <i>trunk</i> is tagged (the ' +
        'native VLAN is not); one cable between switches does not carry every VLAN by itself.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
