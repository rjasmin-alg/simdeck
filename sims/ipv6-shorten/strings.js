/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of ipv6-shorten, in both languages (docs/sim-ui.md §9). Croatian is the original (the URM
   book's fragment skracivanje-zapisa-ipv6-adrese.html and chapter 10); English is written for simdeck. Croatian
   terms follow the book: skraćivanje zapisa IPv6 adrese, skupina, nula-skupina, vodeće nule, globalna unicast
   adresa, link-local adresa, jedinstvena lokalna adresa, multicast adresa, adresa povratne petlje, neodređena adresa.
   Terms missing from kit/glossary.js are written out in both tables; the pairs are listed in NOTES.md. Addresses,
   groups and prefixes are data, not words: the page puts them in translate="no" elements. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Puna IPv6 adresa i njezin skraćeni zapis, skupinu po skupinu',
      addr: 'Puna IPv6 adresa (svih 8 skupina)',
      presetBook: 'Primjer iz knjige',
      presetBookHint: 'Primjer 1, poglavlje 10: skrati i reci kojoj vrsti adrese pripada',
      presetLongest: 'Najdulji niz nula',
      presetLongestHint: 'Koji je skraćeni oblik, i kojoj vrsti pripada po prefiksu 2000::/3?',
      presetSingle: 'Samo jedna nula-skupina',
      presetSingleHint: 'Smije li :: ovdje zamijeniti jednu skupinu?',
      presetTie: 'Dva jednako duga niza',
      presetTieHint: 'Dva niza od po dvije nula-skupine: koji postaje ::?',
      presetUnspecified: 'Sve nule',
      presetUnspecifiedHint: 'Što ostaje kad je svih osam skupina nula?',
      presetLoopback: 'Sve nule osim zadnje jedinice',
      presetLoopbackHint: 'Po čemu se ova adresa razlikuje od one od samih nula?',
      presetUpper: 'Velika slova, bez nula',
      presetUpperHint: 'Puna adresa iz knjige: što se ovdje uopće može skratiti?',
      legendZero: 'nula-skupina',
      legendChosen: 'niz koji postaje ::',
      legendChanged: 'promijenjeno u ovom koraku',
      rowFull: 'puna adresa',
      rowLower: 'mala slova',
      rowStrip: 'bez vodećih nula',
      rowRuns: 'nizovi nula',
      rowShort: 'skraćeni oblik',
      runChosen: 'najdulji: postaje ::',
      runSingle: 'samo jedna: ostaje',
      runLater: 'jednako dug, ali drugi: ostaje',
      runShorter: 'kraći: ostaje',
      noRuns: 'nema nula-skupina',
      groupNo: 'skupina {n}',
      checkTitle: 'provjera',
      checkNote: 'preostale skupine + skupine pod ::',
      checkNoneNote: 'bez :: ostaje svih osam skupina',
      saved: ['{n} znak manje', '{n} znaka manje', '{n} znakova manje'],
      lengthTitle: 'duljina zapisa',
      typeTitle: 'vrsta adrese',
      typeGlobal: 'globalna unicast adresa',
      typeLinkLocal: 'link-local adresa',
      typeUniqueLocal: 'jedinstvena lokalna adresa',
      typeMulticast: 'multicast adresa',
      typeLoopback: 'adresa povratne petlje (loopback)',
      typeUnspecified: 'neodređena adresa',
      typeNone: 'nijedan od četiri raspona iz poglavlja',
      captionStart: 'Puna adresa {full}: osam skupina od po 16 bitova, svaka s jednom do četiri heksadekadske znamenke. ' +
        'Pritisni → za prvo pravilo.',
      captionLowerSame: 'Slova a do f pišu se malim slovima. Ova adresa ih već tako piše, pa se ništa ne mijenja.',
      captionLowerChanged: 'Slova a do f pišu se malim slovima: {lower}. Označene skupine su se promijenile.',
      captionLeading: 'Iz svake skupine izostavljaju se vodeće nule, a skupina od samih nula zadržava jednu: {stripped}.',
      captionLeadingNone: 'Iz svake skupine izostavljaju se vodeće nule. Ova adresa ih nema, pa ostaje {stripped}.',
      span: ['{n} skupinu', '{n} skupine', '{n} skupina'],
      captionRuns: 'Najdulji niz uzastopnih nula-skupina počinje na {pos}. skupini i obuhvaća {span}. Samo taj niz ' +
        'smije zamijeniti ::.',
      captionRunsOthers: 'Ostali nizovi ostaju zapisani nulom, jer se :: smije pojaviti samo jednom.',
      captionRunsTie: 'Dva niza nula-skupina jednako su duga, svaki obuhvaća {span}. Kad su jednaki, skraćuje se prvi, ' +
        'onaj na {pos}. skupini; drugi ostaje zapisan nulama.',
      captionRunsSingle: 'Nijedan niz nula-skupina nije dulji od jedne skupine. :: ne smije skratiti samo jednu skupinu, ' +
        'pa ova adresa ostaje bez ::.',
      captionRunsNone: 'U ovoj adresi nema nijedne nula-skupine, pa :: nema što zamijeniti.',
      captionCompress: ':: zamjenjuje taj niz, i samo njega: {short}.',
      captionCompressNone: 'Nema niza koji bi :: smio zamijeniti, pa je konačan oblik {short}.',
      kept: ['{n} preostala skupina', '{n} preostale skupine', '{n} preostalih skupina'],
      replaced: ['{n} koju :: nadomješta', '{n} koje :: nadomješta', '{n} koje :: nadomješta'],
      captionCheck: 'Provjera: {kept} plus {replaced} daje osam, koliko puna adresa i ima.',
      captionCheckNone: 'Bez :: u zapisu stoji svih osam skupina, kao u punoj adresi.',
      captionType: 'Prefiks je unutar {prefix}: {type}.',
      captionTypeSpecial: '{prefix} je posebna vrijednost: {type}.',
      captionTypeNone: 'Prefiks nije nijedan od četiri raspona koje poglavlje imenuje.',
      explain: '<p>Ista IPv6 adresa smije se zapisati na više načina: vodeće nule mogu stajati ili ne, slova mogu biti ' +
        'velika ili mala. Zato je propisan jedan preporučeni oblik, da ista adresa svugdje izgleda isto (RFC 5952). ' +
        'Pet pravila vrijedi zajedno:</p>' +
        '<ul><li>vodeće nule u svakoj skupini se izostavljaju;</li>' +
        '<li><code>::</code> zamjenjuje jedan niz uzastopnih nula-skupina, najviše jednom u adresi;</li>' +
        '<li>i to najdulji takav niz, a od dva jednako duga prvi;</li>' +
        '<li><code>::</code> ne skraćuje samo jednu nula-skupinu;</li>' +
        '<li>slova a do f pišu se malim slovima.</li></ul>' +
        '<p><strong>Zašto samo jednom.</strong> Kad bi se <code>::</code> pojavio dvaput, ne bi se znalo koliko nula ' +
        'pripada kojem, pa zapis ne bi bio jednoznačan. Zato vrijedi provjera: preostale skupine plus skupine pod ' +
        '<code>::</code> daju osam.</p>' +
        '<p><strong>Zašto najdulji, i zašto ne jedna skupina.</strong> Svaki kraći izbor bio bi ispravan zapis, ali ne ' +
        'i propisan: <code>2001:db8:0:1::1</code> i <code>2001:db8::1:0:0:0:1</code> ista su adresa, a propisan je ' +
        'samo prvi zapis. Jedna nula-skupina pod <code>::</code> skratila bi zapis za samo jedan znak, a ista bi adresa ' +
        'opet imala dva zapisa.</p>'
    },
    en: {
      stage: 'A full IPv6 address and its short form, group by group',
      addr: 'Full IPv6 address (all 8 groups)',
      presetBook: 'The book\'s example',
      presetBookHint: 'Example 1, chapter 10: shorten it and say what type of address it is',
      presetLongest: 'The longest zero run',
      presetLongestHint: 'What is the short form, and what type is it by the prefix 2000::/3?',
      presetSingle: 'A single zero group',
      presetSingleHint: 'May :: stand for just one group here?',
      presetTie: 'Two runs of equal length',
      presetTieHint: 'Two runs of two zero groups each: which one becomes ::?',
      presetUnspecified: 'All zeros',
      presetUnspecifiedHint: 'What is left when all eight groups are zero?',
      presetLoopback: 'All zeros but a final one',
      presetLoopbackHint: 'How does this address differ from the all-zeros one?',
      presetUpper: 'Capital letters, no zeros',
      presetUpperHint: 'The book\'s full address: what can be shortened here at all?',
      legendZero: 'zero group',
      legendChosen: 'run that becomes ::',
      legendChanged: 'changed in this step',
      rowFull: 'full address',
      rowLower: 'lowercase',
      rowStrip: 'leading zeros out',
      rowRuns: 'zero runs',
      rowShort: 'short form',
      runChosen: 'longest: becomes ::',
      runSingle: 'just one: stays',
      runLater: 'as long, but second: stays',
      runShorter: 'shorter: stays',
      noRuns: 'no zero groups',
      groupNo: 'group {n}',
      checkTitle: 'check',
      checkNote: 'groups left + groups under ::',
      checkNoneNote: 'without :: all eight groups stay',
      saved: ['{n} character fewer', '{n} characters fewer'],
      lengthTitle: 'length of the text',
      typeTitle: 'address type',
      typeGlobal: 'global unicast address',
      typeLinkLocal: 'link-local address',
      typeUniqueLocal: 'unique local address',
      typeMulticast: 'multicast address',
      typeLoopback: 'loopback address',
      typeUnspecified: 'unspecified address',
      typeNone: 'none of the chapter\'s four ranges',
      captionStart: 'Full address {full}: eight groups of 16 bits, each one to four hexadecimal digits. Press → for the ' +
        'first rule.',
      captionLowerSame: 'The letters a to f are written in lowercase. This address already writes them so, so nothing ' +
        'changes.',
      captionLowerChanged: 'The letters a to f are written in lowercase: {lower}. The marked groups changed.',
      captionLeading: 'Leading zeros go out of every group, and a group of zeros keeps one: {stripped}.',
      captionLeadingNone: 'Leading zeros go out of every group. This address has none, so it stays {stripped}.',
      span: ['{n} group', '{n} groups'],
      captionRuns: 'The longest run of consecutive zero groups starts at group {pos} and covers {span}. Only this run ' +
        'may be replaced by ::.',
      captionRunsOthers: 'The other runs stay written as zeros, because :: may appear only once.',
      captionRunsTie: 'Two runs of zero groups are equally long, {span} each. When they are equal, the first is ' +
        'shortened, the one at group {pos}; the other stays written as zeros.',
      captionRunsSingle: 'No run of zero groups is longer than one group. :: must not shorten just one group, so this ' +
        'address keeps no ::.',
      captionRunsNone: 'This address has no zero group at all, so :: has nothing to replace.',
      captionCompress: ':: replaces that run, and only it: {short}.',
      captionCompressNone: 'There is no run :: may replace, so the final form is {short}.',
      kept: ['{n} group left', '{n} groups left'],
      replaced: ['{n} that :: stands for', '{n} that :: stands for'],
      captionCheck: 'Check: {kept} plus {replaced} make eight, as many as the full address has.',
      captionCheckNone: 'Without :: the text keeps all eight groups, as in the full address.',
      captionType: 'The prefix lies within {prefix}: {type}.',
      captionTypeSpecial: '{prefix} is a special value: {type}.',
      captionTypeNone: 'The prefix is none of the four ranges the chapter names.',
      explain: '<p>The same IPv6 address may be written in several ways: leading zeros may or may not be there, letters ' +
        'may be capital or small. So one recommended form is set, for the same address to look the same everywhere ' +
        '(RFC 5952). Five rules hold together:</p>' +
        '<ul><li>leading zeros in every group are left out;</li>' +
        '<li><code>::</code> replaces one run of consecutive zero groups, at most once in the address;</li>' +
        '<li>the longest such run, and of two equally long ones the first;</li>' +
        '<li><code>::</code> never shortens just one zero group;</li>' +
        '<li>the letters a to f are written in lowercase.</li></ul>' +
        '<p><strong>Why only once.</strong> With <code>::</code> twice, nobody could tell how many zeros belong to which, ' +
        'so the text would be ambiguous. Hence the check: the groups left plus the groups under <code>::</code> make ' +
        'eight.</p>' +
        '<p><strong>Why the longest, and why not one group.</strong> Any shorter choice would be a valid text, but not ' +
        'the recommended one: <code>2001:db8:0:1::1</code> and <code>2001:db8::1:0:0:0:1</code> are the same address, ' +
        'and only the first is recommended. One zero group under <code>::</code> would save just one character, and the ' +
        'same address would again have two texts.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
