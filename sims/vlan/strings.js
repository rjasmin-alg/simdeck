/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of vlan, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM book's
   fragment vlan.html and chapter 7); English is written for simdeck. Croatian terms follow the book: preklopnik,
   priključak, pristupni priključak, trunk priključak (trunk stays in italics, the book has no Croatian word for it),
   okvir, VLAN oznaka, 802.1Q oznaka, VLAN identifikator (VID), označiti, skinuti oznaku. Terms missing from
   kit/glossary.js are written out in both tables; the pairs are listed in NOTES.md. Host names (Ra1, Pr2), switch
   names (SW1, SW2) and VLAN numbers are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dva preklopnika, svaki s računalom u VLAN-u 10 i u VLAN-u 20, spojena jednim kabelom',
      vlanName10: 'računovodstvo',
      vlanName20: 'prodaja',
      vlanLine: 'VLAN {v} · {name}',
      portAccess: 'pristupni · VLAN {v}',
      portTrunk: 'trunk · VLAN 10 i 20',
      wireUntagged: 'okvir, neoznačen',
      wireTagged: 'okvir s oznakom VID {v}',
      wireHeld: '✕ VLAN {v} ne prolazi',
      frameNone: 'Još nijedan okvir nije poslan.',
      frameLine: 'Okvir {k} od 2: {src} šalje {dst}, VLAN {v}',
      fDst: 'odredište',
      fSrc: 'izvor',
      fTag: '802.1Q oznaka',
      fTagValue: 'VID {v}',
      fTagRemoved: 'oznaka skinuta',
      fType: 'duljina/tip',
      fData: 'podaci',
      stateUntagged: 'neoznačen',
      stateTagged: 'označen',
      whereSw1: 'u preklopniku SW1',
      whereLink: 'na vezi SW1 → SW2',
      whereHeld: 'ostaje u SW1',
      whereHost: 'predan računalu {host}',
      whereNowhere: 'nije stigao',
      roleSends: 'šalje',
      roleGets: 'prima okvir',
      roleNothing: 'ne prima ništa',
      resultsTitle: 'Ishod',
      resultPending: '{a} ↔ {b}: još nije poslano',
      resultOk: '✓ {a} ↔ {b} radi',
      resultCut: '✕ {a} ↔ {b} ne radi',
      link: 'Veza između preklopnika',
      optTrunk: 'Trunk',
      optAccess10: 'Pristupni, VLAN 10',
      optAccess20: 'Pristupni, VLAN 20',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Poglavlje 7, Primjer 5 (b): veza je pogreškom pristupni priključak u VLAN-u 10. Što se ' +
        'dogodi s prometom VLAN-a 20 između preklopnika, i vide li računala ikad VLAN oznaku?',
      presetTrunk: 'Trunk',
      presetTrunkHint: 'Veza je trunk. Rade li Ra1 ↔ Ra2 i Pr1 ↔ Pr2 istovremeno? Zašto to jedan jedini kabel ' +
        'uopće može?',
      presetWrong: 'Pristupni, VLAN 20',
      presetWrongHint: 'Poglavlje 7, Primjer 6: priključak prema drugoj strani ostao je pristupni. Koji promet još ' +
        'prolazi, nosi li ijedan okvir oznaku, i bi li uređaj koji na drugom kraju očekuje oznake prepoznao ' +
        'promet drugog VLAN-a?',
      legend10: 'VLAN 10 (računovodstvo)',
      legend20: 'VLAN 20 (prodaja)',
      legendChanged: 'oznaka umetnuta ili skinuta',
      linkTrunk: 'trunk',
      linkAccess: 'pristupni priključak u VLAN-u {v}',
      captionIdle: 'Dva preklopnika, svaki s računalom u VLAN-u 10 (računovodstvo) i u VLAN-u 20 (prodaja), ' +
        'spojena su jednim kabelom. Veza je {link}. Prvo Ra1 šalje okvir Ra2, zatim Pr1 šalje Pr2. Pritisni →.',
      captionEnter: '{src} šalje običan, neoznačen okvir za {dst}. Stiže na pristupni priključak preklopnika SW1 ' +
        'dodijeljen VLAN-u {v}, pa ga preklopnik smješta u VLAN {v}. Računalo o VLAN-u ništa ne zna.',
      captionLinkTrunk: 'Veza je trunk: SW1 okviru umeće 802.1Q oznaku s VID {v}, odmah iza izvorišne adrese, i ' +
        'šalje ga kabelom. Po toj oznaci drugi preklopnik zna kojem VLAN-u okvir pripada.',
      captionLinkAccess: 'Veza je pristupni priključak u VLAN-u {v}, istom kao okvir: okvir ide kabelom ' +
        'neoznačen. Pristupni priključak ništa ne označava.',
      captionLinkHeld: 'Veza je pristupni priključak u VLAN-u {lv}, a okvir je u VLAN-u {v}: SW1 nema nijedan ' +
        'priključak VLAN-a {v} prema SW2. Okvir ne napušta SW1.',
      captionExitTrunk: 'SW2 čita oznaku: VID {v}. Skida je i predaje okvir, opet neoznačen, na pristupni ' +
        'priključak VLAN-a {v}. {dst} prima okvir i oznaku nikad ne vidi.',
      captionExitAccess: 'SW2 prima neoznačen okvir na priključku u VLAN-u {v} i predaje ga na pristupni ' +
        'priključak istog VLAN-a. {dst} prima okvir.',
      captionExitHeld: 'Do SW2 ne stiže ništa, pa {dst} ne prima ništa. Računala VLAN-a {v} na jednom ' +
        'preklopniku odsječena su od onih na drugom, kao da veze između preklopnika uopće nema.',
      captionDoneTrunk: 'Jedan kabel nosi oba VLAN-a: to može samo trunk, jer svaki okvir na njemu nosi oznaku ' +
        'svog VLAN-a.',
      captionDoneAccess: 'Pristupna veza nosi točno jedan VLAN: VLAN {cut} tiho je odsječen.',
      explain: '<p>VLAN dijeli jednu preklopljenu mrežu na više logičkih mreža. Svaki <em lang="en">access ' +
        'port</em> (pristupni priključak) dodijeljen je točno jednom VLAN-u: okvir koji na njega stigne ide u taj ' +
        'VLAN, bez iznimke, i na njemu se ništa ne označava. Krajnja računala ne znaju čitati oznaku i ne znaju ni ' +
        'da VLAN-ovi postoje.</p>' +
        '<p>Kad promet dvaju VLAN-ova mora proći istim fizičkim kabelom, kabel mora nekako reći kojem VLAN-u ' +
        'pripada svaki okvir. To radi <em>trunk</em> priključak: preklopnik okviru umeće 802.1Q oznaku od 4 okteta ' +
        'odmah iza izvorišne adrese, a u njoj VLAN identifikator (VID). Preklopnik na drugom kraju po oznaci zna ' +
        'kojem VLAN-u okvir pripada i skida je prije nego ga preda pristupnom priključku. Oznaku umeće i skida ' +
        'preklopnik, nikad računalo koje okvir šalje ili prima.</p>' +
        '<p>Postavi li se veza između preklopnika kao pristupni priključak, ona nosi samo svoj jedan VLAN. Promet ' +
        'svakog drugog VLAN-a nema kuda izaći prema drugom preklopniku i tiho nestaje, bez ikakve poruke o ' +
        'pogrešci.</p>'
    },
    en: {
      stage: 'Two switches, each with a host in VLAN 10 and one in VLAN 20, joined by one cable',
      vlanName10: 'accounting',
      vlanName20: 'sales',
      vlanLine: 'VLAN {v} · {name}',
      portAccess: 'access · VLAN {v}',
      portTrunk: 'trunk · VLAN 10 and 20',
      wireUntagged: 'frame, untagged',
      wireTagged: 'frame tagged VID {v}',
      wireHeld: '✕ VLAN {v} does not pass',
      frameNone: 'No frame has been sent yet.',
      frameLine: 'Frame {k} of 2: {src} sends to {dst}, VLAN {v}',
      fDst: 'destination',
      fSrc: 'source',
      fTag: '802.1Q tag',
      fTagValue: 'VID {v}',
      fTagRemoved: 'tag removed',
      fType: 'length/type',
      fData: 'data',
      stateUntagged: 'untagged',
      stateTagged: 'tagged',
      whereSw1: 'in switch SW1',
      whereLink: 'on the link SW1 → SW2',
      whereHeld: 'stays in SW1',
      whereHost: 'handed to {host}',
      whereNowhere: 'did not arrive',
      roleSends: 'sends',
      roleGets: 'gets the frame',
      roleNothing: 'gets nothing',
      resultsTitle: 'Outcome',
      resultPending: '{a} ↔ {b}: not sent yet',
      resultOk: '✓ {a} ↔ {b} works',
      resultCut: '✕ {a} ↔ {b} does not work',
      link: 'Link between the switches',
      optTrunk: 'Trunk',
      optAccess10: 'Access, VLAN 10',
      optAccess20: 'Access, VLAN 20',
      presetBook: 'The book\'s example',
      presetBookHint: 'Chapter 7, Example 5 (b): the link is set by mistake as an access port in VLAN 10. What ' +
        'happens to VLAN 20 traffic between the switches, and do the hosts ever see a VLAN tag?',
      presetTrunk: 'Trunk',
      presetTrunkHint: 'The link is a trunk. Do Ra1 ↔ Ra2 and Pr1 ↔ Pr2 both work at the same time? Why can one ' +
        'single cable do that at all?',
      presetWrong: 'Access, VLAN 20',
      presetWrongHint: 'Chapter 7, Example 6: the port towards the other side was left as an access port. Which ' +
        'traffic still passes, does any frame carry a tag, and would a device at the other end that expects tags ' +
        'recognise the other VLAN\'s traffic?',
      legend10: 'VLAN 10 (accounting)',
      legend20: 'VLAN 20 (sales)',
      legendChanged: 'tag added or removed',
      linkTrunk: 'a trunk',
      linkAccess: 'an access port in VLAN {v}',
      captionIdle: 'Two switches, each with a host in VLAN 10 (accounting) and one in VLAN 20 (sales), are joined ' +
        'by one cable. The link is {link}. First Ra1 sends a frame to Ra2, then Pr1 sends to Pr2. Press →.',
      captionEnter: '{src} sends a plain, untagged frame for {dst}. It arrives on SW1\'s access port in VLAN {v}, ' +
        'so the switch puts it in VLAN {v}. The host knows nothing about VLANs.',
      captionLinkTrunk: 'The link is a trunk: SW1 inserts an 802.1Q tag with VID {v} into the frame, right after ' +
        'the source address, and sends it down the cable. The tag tells the other switch which VLAN the frame ' +
        'belongs to.',
      captionLinkAccess: 'The link is an access port in VLAN {v}, the frame\'s own VLAN: the frame goes down the ' +
        'cable untagged. An access port tags nothing.',
      captionLinkHeld: 'The link is an access port in VLAN {lv}, and the frame is in VLAN {v}: SW1 has no VLAN {v} ' +
        'port towards SW2. The frame never leaves SW1.',
      captionExitTrunk: 'SW2 reads the tag: VID {v}. It removes the tag and hands the frame, untagged again, to the ' +
        'access port in VLAN {v}. {dst} gets the frame and never sees the tag.',
      captionExitAccess: 'SW2 gets an untagged frame on its port in VLAN {v} and hands it to the access port of the ' +
        'same VLAN. {dst} gets the frame.',
      captionExitHeld: 'Nothing reaches SW2, so {dst} gets nothing. The VLAN {v} hosts on one switch are cut off ' +
        'from those on the other, as if there were no link between the switches at all.',
      captionDoneTrunk: 'One cable carries both VLANs: only a trunk can do that, because every frame on it wears ' +
        'its VLAN\'s tag.',
      captionDoneAccess: 'An access link carries exactly one VLAN: VLAN {cut} is silently cut off.',
      explain: '<p>A VLAN splits one switched network into several logical networks. Every access port belongs to ' +
        'exactly one VLAN: a frame that arrives on it goes into that VLAN, without exception, and nothing on it is ' +
        'tagged. End hosts cannot read a tag and do not even know VLANs exist.</p>' +
        '<p>When the traffic of two VLANs has to cross the same physical cable, the cable must somehow say which ' +
        'VLAN each frame belongs to. A trunk port does that: the switch inserts a 4-byte 802.1Q tag right after the ' +
        'source address, carrying the VLAN identifier (VID). The switch at the other end reads the VLAN from the ' +
        'tag and removes it before handing the frame to an access port. The switch adds and removes the tag, never ' +
        'the host that sends or receives the frame.</p>' +
        '<p>If the link between the switches is set as an access port, it carries its one VLAN only. Every other ' +
        'VLAN\'s traffic has no way out towards the other switch and silently disappears, with no error message ' +
        'at all.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
