/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-hearing, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). The
   title and subtitle come from sim.json (title, concept). Croatian: crews' loanwords (take, brifing) and the terms
   marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Snimateljski dan: buka i dnevna doza',
      dec: ',',
      dist: 'Agregat od mjesta rada',
      distHint: 'Blokove dana dodaješ, mijenjaš i brišeš na pozornici.',
      distOpt: '{d} m',
      lift: 'Štitnici skinuti svakog sata',
      liftHint: 'Na blokovima gdje se nose: da se čuje razgovor ili radio.',
      lift_0: 'nikad',
      liftOpt: '{m} min',
      kParam: 'Blok {n}: vrsta',
      tParam: 'Blok {n}: trajanje',
      eParam: 'Blok {n}: štitnici',
      kind_none: 'prazno',

      preset_noisy: 'Bučan dan',
      hint_noisy: 'agregat, ventilator i ćorci, bez štitnika',
      preset_blanks: 'Tihi dan i ćorci',
      hint_blanks: 'pola sata, 12 pucnjeva: gotovo cijela doza',
      preset_defenders: 'Štitnici uz buku',
      hint_defenders: '20 dB manje na uhu',
      preset_lifted: 'Skinuti 5 min na sat',
      hint_lifted: 'štitnici skinuti 5 min na sat: od 20 dB ostaje oko 10',
      preset_far: 'Agregat na 40\u00a0m',
      hint_far: 'agregat pada, ventilator ostaje',
      preset_practice: 'Daleko i najavljeno',
      hint_practice: 'agregat daleko, štitnici za vjetar i ćorke',

      kind_dialogue: 'Tiha scena dijaloga',
      kind_generator: 'Rad uz agregat',
      kind_wind: 'Ventilator za vjetar',
      kind_blanks: 'Scena s ćorcima',
      add_dialogue: '+ Dijalog',
      add_generator: '+ Agregat',
      add_wind: '+ Ventilator',
      add_blanks: '+ Ćorci',
      letter_dialogue: 'D',
      letter_generator: 'A',
      letter_wind: 'V',
      letter_blanks: 'Ć',

      totU: 'Bez štitnika',
      totE: 'Na uhu',
      doseOf: '{p} % doze',
      act_below: '80 ili manje',
      act_lower: 'preko 80: donja upozoravajuća vrijednost',
      act_upper: '85 i više: gornja upozoravajuća vrijednost',
      lim_under: 'ne preko granične vrijednosti od 87',
      lim_over: 'preko granične vrijednosti od 87',
      dayLen: '{d}, 07:00–{end}',

      axisY: 'doza',
      line80: '80 dB(A)',
      line85: '85 dB(A) = 100 %',
      line87: '87 dB(A), na uhu',

      colKind: 'Blok',
      colLen: 'Trajanje',
      colLevel: 'dB(A) → na uhu',
      colFull: 'Puna doza za',
      colShare: 'Doza na uhu',
      colEar: 'Štitnici',
      genAt: 'na {d} m',
      shotsN: ['{n} pucanj', '{n} pucnja', '{n} pucnjeva'],
      earOn: 'nose se',
      earOff: 'ne nose se',
      earLabel: '{kind}: štitnici za uši',
      removeLabel: 'Ukloni blok: {kind}',
      lenLabel: '{kind}: trajanje, {dir}',
      less: 'kraće',
      more: 'dulje',
      atMin: 'već je najkraće, 15 min',
      atMax: 'već je najdulje, 4 h',
      addHead: 'Dodaj blok',
      addLabel: 'Dodaj na kraj dana: {kind}',
      fullDay: 'dan je pun: 6 blokova',
      emptyDay: 'Dan je prazan: dodaj blok.',
      chartLabel: 'Doza kroz dan: bez štitnika {u} %, na uhu {e} %',
      laneLabel: '{kind}, {from}–{to}, {ear}',
      foot: 'Pojednostavljeno; razine su ilustrativne. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      legU: 'doza bez štitnika',
      legE: 'doza na uhu',
      legEar: 'štitnici na ušima',

      capTotals: 'Bez štitnika dan je {lex} dB(A), {dose} % pune dnevne doze; na uhu {lexE} dB(A), {doseE} %.',
      capEmpty: 'Dan je prazan: dodaj blokove i gledaj kako se doza puni.',
      capShots: '{shots} u bloku „{kind}”, svaki djelić sekunde, nose {share} % današnje doze na uhu. Oružar ih najavljuje na brifingu i prije svakog takea: tada štitnici idu na uši.',
      capLift: 'Štitnici su skinuti {lift} min svakog sata: od 20 dB ostaje oko {cut} dB, jer se u tim minutama buka čuje cijela.',
      capTop: 'Najveći dio doze na uhu: {kind}, {level} dB(A), puna doza za {allowed}; to je {share} % današnje doze. Svaka 3 dB više prepolovi to vrijeme.',
      capTopGen: 'Najveći dio doze na uhu: {kind}, {base} dB(A) na {d} m, puna doza za {allowed}; to je {share} % današnje doze. Svako udvostručenje udaljenosti oduzme oko 6 dB, četvrtinu energije.',
      capTopGenEar: 'Najveći dio doze na uhu: {kind}, {base} dB(A) na {d} m, sa štitnicima {level} dB(A) na uhu, puna doza za {allowed}; to je {share} % današnje doze. Svako udvostručenje udaljenosti oduzme oko 6 dB.',

      explain:
        '<p><b>Decibeli se ne zbrajaju kao metri.</b> Razina zvuka u decibelima je logaritamska: svaka 3 dB više znače ' +
        'dvostruko više zvučne energije, pa se vrijeme koje se smije provesti na toj razini prepolovi. Na 85 dB(A) puna ' +
        'dnevna doza stane u 8 sati, na 88 u 4, na 91 u 2, na 97 u pola sata. Ventilator od 97 dB(A) nije „malo glasniji” ' +
        'od agregata od 91: to je četiri puta više energije.</p>' +
        '<p><b>Doza se zbraja kroz dan.</b> Svaki blok dana dodaje svoju energiju; stranica je zbraja i pokazuje kao postotak ' +
        'pune dnevne doze (8 sati na 85 dB(A) = 100 %) i kao dnevnu razinu, prosjek energije kroz nazivnih 8 sati. ' +
        'Kratki glasni događaji teško vagnu: svaki pucanj ćorkom traje djelić sekunde, ali dvanaest pucnjeva nosi više ' +
        'doze nego osam sati tihog dijaloga, i to više od deset puta.</p>' +
        '<p><b>Štitnici za uši rade samo dok su na ušima.</b> Ovdje smanjuju razinu na uhu za 20 dB. Skinuti samo 5 minuta ' +
        'svakog sata, od tih 20 dB ostave oko 10: u tim minutama buka ulazi cijela. Pucnji i eksplozije su najavljeni: ' +
        'ekipa specijalnih efekata i oružar najavljuju glasne događaje na brifingu i prije svakog takea, i to je trenutak ' +
        'kad štitnici idu na uši. Buka agregata ili ventilatora traje cijelo vrijeme i ne najavljuje se.</p>' +
        '<p><b>Udaljenost pomaže.</b> Na otvorenom, dvostruko dalje od izvora razina padne za oko 6 dB, četvrtinu energije: ' +
        'agregat s 5 m na 40 m pada s 91 na oko 73 dB(A). To smanji udio agregata u dozi, ali ne i ventilatora ni pucnjeva uz kameru. ' +
        'U zatvorenom zvuk se odbija od zidova i pada sporije.</p>' +
        '<p><b>Granice.</b> Direktiva 2003/10/EZ (čl. 3) postavlja donju upozoravajuću vrijednost od 80 dB(A), gornju od 85 i ' +
        'graničnu vrijednost od 87 dB(A) dnevne izloženosti. Upozoravajuće vrijednosti računaju se bez štitnika (isprekidana ' +
        'crta), a granična vrijednost s njima, na uhu (puna crta). Direktiva postavlja i vrijednosti za vršni tlak, ' +
        'a jedan pucanj blizu može ih dosegnuti sam; ova stranica vršni tlak ne računa.</p>' +
        '<p><b>Pojednostavljeno.</b> Sve razine, trajanja i broj pucnjeva su izmišljeni ali uvjerljivi; dva izvora koja rade ' +
        'u isto vrijeme, odbijanje zvuka, vrsta i nalijeganje štitnika nisu u modelu. Konačnu riječ imaju sigurnosni brifing ' +
        'produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'A shooting day: noise and the daily dose',
      dec: '.',
      dist: 'Generator from where they work',
      distHint: 'Add, change and remove the day\'s blocks on the stage.',
      distOpt: '{d} m',
      lift: 'Defenders off every hour',
      liftHint: 'On the blocks where they are worn: to hear a word or the radio.',
      lift_0: 'never',
      liftOpt: '{m} min',
      kParam: 'Block {n}: kind',
      tParam: 'Block {n}: length',
      eParam: 'Block {n}: defenders',
      kind_none: 'empty',

      preset_noisy: 'A noisy day',
      hint_noisy: 'generator, wind machine and blanks, no defenders',
      preset_blanks: 'A quiet day and blanks',
      hint_blanks: 'half an hour, 12 shots: nearly all the dose',
      preset_defenders: 'Defenders for the noise',
      hint_defenders: '20 dB less at the ear',
      preset_lifted: 'Off 5 min an hour',
      hint_lifted: 'defenders off 5 min an hour: of 20 dB about 10 are left',
      preset_far: 'Generator at 40\u00a0m',
      hint_far: 'the generator drops, the wind machine stays',
      preset_practice: 'Far away and announced',
      hint_practice: 'generator far, defenders for wind and blanks',

      kind_dialogue: 'Quiet dialogue scene',
      kind_generator: 'Work near the generator',
      kind_wind: 'Wind machine',
      kind_blanks: 'Blank-firing scene',
      add_dialogue: '+ Dialogue',
      add_generator: '+ Generator',
      add_wind: '+ Wind machine',
      add_blanks: '+ Blanks',
      letter_dialogue: 'D',
      letter_generator: 'G',
      letter_wind: 'W',
      letter_blanks: 'B',

      totU: 'Without defenders',
      totE: 'At the ear',
      doseOf: '{p} % of the dose',
      act_below: '80 or less',
      act_lower: 'over 80: lower action value',
      act_upper: '85 or more: upper action value',
      lim_under: 'not over the 87 limit',
      lim_over: 'over the 87 limit',
      dayLen: '{d}, 07:00–{end}',

      axisY: 'dose',
      line80: '80 dB(A)',
      line85: '85 dB(A) = 100 %',
      line87: '87 dB(A), at the ear',

      colKind: 'Block',
      colLen: 'Length',
      colLevel: 'dB(A) → at the ear',
      colFull: 'Full dose in',
      colShare: 'Dose at the ear',
      colEar: 'Defenders',
      genAt: 'at {d} m',
      shotsN: ['{n} shot', '{n} shots'],
      earOn: 'worn',
      earOff: 'not worn',
      earLabel: '{kind}: ear defenders',
      removeLabel: 'Remove block: {kind}',
      lenLabel: '{kind}: length, {dir}',
      less: 'shorter',
      more: 'longer',
      atMin: 'already the shortest, 15 min',
      atMax: 'already the longest, 4 h',
      addHead: 'Add a block',
      addLabel: 'Add at the end of the day: {kind}',
      fullDay: 'the day is full: 6 blocks',
      emptyDay: 'The day is empty: add a block.',
      chartLabel: 'Dose through the day: without defenders {u} %, at the ear {e} %',
      laneLabel: '{kind}, {from}–{to}, {ear}',
      foot: 'Simplified; the levels are illustrative. The production\'s safety briefing and the head of department have the final word.',

      legU: 'dose without defenders',
      legE: 'dose at the ear',
      legEar: 'ear defenders on',

      capTotals: 'Without defenders the day is {lex} dB(A), {dose} % of a full daily dose; at the ear {lexE} dB(A), {doseE} %.',
      capEmpty: 'The day is empty: add blocks and watch the dose fill.',
      capShots: '{shots} in the "{kind}" block, each a fraction of a second, carry {share} % of today\'s dose at the ear. The armourer announces them in the briefing and before every take: that is when the defenders go on.',
      capLift: 'The defenders are off {lift} min every hour: of the 20 dB about {cut} dB are left, because in those minutes the noise gets through in full.',
      capTop: 'Most of the dose at the ear: {kind}, {level} dB(A), a full dose in {allowed}; that is {share} % of today\'s dose. Every 3 dB more halves that time.',
      capTopGen: 'Most of the dose at the ear: {kind}, {base} dB(A) at {d} m, a full dose in {allowed}; that is {share} % of today\'s dose. Each doubling of the distance takes about 6 dB, a quarter of the energy.',
      capTopGenEar: 'Most of the dose at the ear: {kind}, {base} dB(A) at {d} m, {level} dB(A) at the ear with defenders, a full dose in {allowed}; that is {share} % of today\'s dose. Each doubling of the distance takes about 6 dB.',

      explain:
        '<p><b>Decibels do not add like metres.</b> Sound level in decibels is logarithmic: every 3 dB more is twice the ' +
        'sound energy, so the time someone can spend at that level halves. At 85 dB(A) a full daily dose takes 8 hours, at ' +
        '88 it takes 4, at 91 2, at 97 half an hour. A 97 dB(A) wind machine is not "a bit louder" than a 91 dB(A) ' +
        'generator: it is four times the energy.</p>' +
        '<p><b>The dose adds up through the day.</b> Every block of the day adds its energy; the page adds it up and shows ' +
        'it as a percentage of a full daily dose (8 hours at 85 dB(A) = 100 %) and as a daily level, the energy averaged ' +
        'over a nominal 8 hours. Short loud events weigh heavily: each blank shot lasts a fraction of a second, but twelve ' +
        'of them carry more than ten times the dose of eight hours of quiet dialogue.</p>' +
        '<p><b>Ear defenders work only while they are on.</b> Here they cut the level at the ear by 20 dB. Taken off for ' +
        'just 5 minutes every hour, they leave about 10 of those 20 dB: in those minutes the noise gets through in full. ' +
        'Shots and explosions are announced: the effects crew and the armourer announce loud events in their briefing and ' +
        'before every take, and that is when the defenders go on. A generator or a wind machine is loud all the time and ' +
        'nobody announces it.</p>' +
        '<p><b>Distance helps.</b> Outdoors, twice as far from a source the level falls by about 6 dB, a quarter of the ' +
        'energy: a generator moved from 5 m to 40 m falls from 91 to about 73 dB(A). That cuts the generator\'s share of the dose, not the ' +
        'wind machine\'s or the shots\' next to the camera. Indoors, sound bounces off the walls and falls more slowly.</p>' +
        '<p><b>The values.</b> Directive 2003/10/EC (art. 3) sets a lower exposure action value of 80 dB(A), an upper one ' +
        'of 85 and an exposure limit of 87 dB(A) of daily exposure. The action values are counted without defenders (the ' +
        'dashed line), the limit with them, at the ear (the solid line). The directive also sets values for the peak ' +
        'pressure, and a single shot close by can reach them on its own; this page does not compute the peak.</p>' +
        '<p><b>Simplified.</b> Every level, length and shot count is made up but plausible; two sources running at once, ' +
        'reflections, the kind of protector and its fit are not in the model. The production\'s safety briefing and the ' +
        'head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
