/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-risk-controls, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian: crews' loanwords (grip, brifing) and the
   terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Četiri scene, pet razina mjera zaštite i rizik koji ostaje',
      dec: ',',
      scene: 'Scena',
      sceneHint: 'Mjere uključuješ i isključuješ na pozornici.',
      newSeries: 'Nova serija ponavljanja',
      newSeriesHint: 'Isti izbor mjera, drugih 200 ponavljanja (tipka N).',
      seedParam: 'Serija',
      ctlParam: '{scene}: {level}',

      preset_none: 'Bez mjera',
      hint_none: 'četiri scene kako su napisane',
      preset_lower: 'Samo brifing i oprema',
      hint_lower: 'organizacija i osobna zaštita: rizik većinom ostaje',
      preset_operator: 'Vrata: pazi operater',
      hint_operator: 'samo operater na znak: ostaje 80 %',
      preset_guard: 'Vrata: senzor',
      hint_guard: 'senzor zaustavlja vrata: ostaje 31 %',
      preset_upper: 'Sve osim uklanjanja',
      hint_upper: 'zamjena, odvajanje, organizacija i oprema',
      preset_remove: 'Ukloniti opasnost',
      hint_remove: 'u svakoj sceni: ništa ne ostaje',

      scene_stairs: 'Mokre stepenice',
      scene_lamp: 'Reflektor na visini',
      scene_car: 'Auto uz kameru',
      scene_door: 'Vrata na pogon',
      long_stairs: 'Glumac trči niz mokre stepenice',
      long_lamp: 'Težak reflektor na visokom stativu iznad ekipe',
      long_car: 'Automobil prolazi blizu kamere',
      long_door: 'Vrata na pogon na setu zatvaraju se na znak',

      level_remove: 'Ukloniti opasnost',
      level_replace: 'Zamijeniti manje opasnim',
      level_separate: 'Odvojiti ljude od opasnosti',
      level_organise: 'Organizirati rad',
      level_protect: 'Osobna zaštitna oprema',
      fail_remove: 'opasnosti nema: ništa se ne može zaboraviti',
      fail_replace: 'ugrađeno: drži u svakom ponavljanju',
      fail_separate: 'ugrađeno: sklonjeno 1 put od 50',
      fail_organise: 'netko se mora sjetiti: zaboravi se 1 put od 5',
      fail_protect: 'netko se mora sjetiti: zaboravi se 3 puta od 10',

      c_stairs_remove: 'Snimati na suhim stepenicama',
      c_stairs_replace: 'Trk izvodi kaskader',
      c_stairs_separate: 'Ograda na otvorenoj strani, strunjače u dnu',
      c_stairs_organise: 'Proba hodanjem, promatrač u dnu',
      c_stairs_protect: 'Štitnici za koljena i laktove ispod kostima',
      c_lamp_remove: 'Nijedan reflektor iznad ljudi: svjetlo izvana',
      c_lamp_replace: 'Lakši, hladniji reflektor',
      c_lamp_separate: 'Ograđena zona: nitko ispod stativa',
      c_lamp_organise: 'Brifing; grip provjeri stativ nakon svakog pomaka',
      c_lamp_protect: 'Zaštitne kacige ispod stativa',
      c_car_remove: 'Bez bliskog prolaza: snima se širi kadar',
      c_car_replace: 'Sporiji prolaz, ubrzan u montaži',
      c_car_separate: 'Barijera; kamera na daljinskoj glavi, ekipa iza',
      c_car_organise: 'Proba brzinom hoda, manje ljudi uz cestu',
      c_car_protect: 'Reflektirajući prsluci',
      c_door_remove: 'Vrata ostaju otvorena; zatvaraju se u montaži',
      c_door_replace: 'Lagana, spora vrata koja ruka zaustavi',
      c_door_separate: 'Senzor zaustavi vrata ako je netko na putu',
      c_door_organise: 'Operater zatvara na znak i gleda prag',
      c_door_protect: 'Zaštitne cipele',

      effGone: 'opasnost nestaje',
      effL: 'vjerojatnost −{n}',
      effI: 'posljedica −{n}',
      effNone: 'ne pomiče nijednu razinu',
      ctlLabel: '{level}: {control}',

      head_ladder: 'Mjere zaštite, od najjače',
      head_risk: 'Rizik: vjerojatnost × posljedica',
      head_runs: 'Scena ponovljena {n} puta (probe i takeovi), serija {seed}',
      row_inh: 'Bez mjera',
      row_paper: 'Na papiru: sve na mjestu',
      row_day: 'Na dan: uz zaboravljanje',
      scoreLI: '{l} × {i} = {s}',
      removed: '0: opasnost uklonjena',
      dayVal: '≈ {s}',
      kept: 'ostaje {p} % rizika',
      lik: 'vjerojatnost {l}: ozljeda u {p} % ponavljanja',
      sev: 'posljedica {i}: {name}',
      sev_1: 'modrica',
      sev_2: 'prva pomoć',
      sev_3: 'bolovanje',
      sev_4: 'teška ozljeda, bolnica',
      sev_5: 'trajne posljedice ili smrt',
      hurtN: ['{n} ozljeda', '{n} ozljede', '{n} ozljeda'],
      seriousN: ['od toga {n} teška', 'od toga {n} teške', 'od toga {n} teških'],
      forgotN: ['nešto zaboravljeno u {n} ponavljanju', 'nešto zaboravljeno u {n} ponavljanja', 'nešto zaboravljeno u {n} ponavljanja'],
      expect: 'očekivano ozljeda: {e}, bez mjera {e0}',
      tabKept: '{s0} → ≈ {d}',
      tabHurt: ['{n} ozljeda', '{n} ozljede', '{n} ozljeda'],
      runOk: 'ponavljanje {k}: bez ozljede',
      runHurt: 'ponavljanje {k}: ozljeda, posljedica {i}',
      runMiss: 'zaboravljeno: {what}',
      gridLabel: '{n} ponavljanja: {hurt}, {serious}',

      legHurt: 'ozljeda (broj = posljedica)',
      legSerious: 'teška ozljeda (4–5)',
      legMiss: 'nešto zaboravljeno',
      legPaper: 'na papiru',
      legDay: 'na dan',

      capNone: '{scene}, bez mjera: {l} × {i} = {s}. U {runs} ponavljanja {hurt}, {serious}.',
      capRemoved: '{scene}: opasnost je uklonjena, nema se što zaboraviti ni pokvariti: 0 ozljeda u {runs} ponavljanja.',
      capLower: '{scene}, samo mjere koje se netko mora sjetiti: na papiru {s1}, na dan ≈ {day}, ostaje {kept} % rizika. ' +
        '{hurt}, {serious}; {forgot}.',
      capUpper: '{scene}, najjača razina „{top}”: na papiru {s1}, na dan ≈ {day}, ostaje {kept} % rizika. ' +
        'Ugrađena mjera drži (skoro) svaki put: {hurt}, {serious}.',
      capNoEffect: '„{control}” ne pomiče nijednu razinu: ne štiti od ove ozljede.',

      foot: 'Pojednostavljeno; razine i postoci su ilustrativni, a produkcija je izmišljena. Konačnu riječ imaju ' +
        'sigurnosni brifing produkcije i šef odjela.',

      explain:
        '<p><b>Rizik je vjerojatnost puta posljedica.</b> Svaka scena ima opasnost i dvije ocjene od 1 do 5: koliko je ' +
        'vjerojatno da će netko biti ozlijeđen i koliko bi ta ozljeda bila teška. Umnožak je ocjena rizika, kao u ' +
        'registru rizika (do 25). Ovdje vjerojatnost znači udio ponavljanja scene u kojima dođe do ozljede: 1 % na ' +
        'razini 1, pa dvostruko više sa svakom razinom, do 16 % na razini 5.</p>' +
        '<p><b>Mjere imaju redoslijed jačine.</b> Najjača je <i>ukloniti opasnost</i>: stepenice snimiti suhe, izbaciti ' +
        'bliski prolaz automobila. Kad to ne ide, <i>zamijeniti</i> opasno manje opasnim: kaskader umjesto glumca, lakši ' +
        'reflektor, sporiji prolaz. Zatim <i>odvojiti ljude</i> od opasnosti: ograda, barijera, zona u koju nitko ne ' +
        'ulazi, senzor koji zaustavi vrata. Tek onda <i>organizirati rad</i>: proba, brifing, promatrač, manje ljudi uz ' +
        'opasnost. Zadnja je <i>osobna zaštitna oprema</i>: štitnici, kacige, prsluci.</p>' +
        '<p><b>Zašto baš taj redoslijed.</b> Uklonjena opasnost ne može nikoga ozlijediti. Zamjena i odvajanje ugrađeni su ' +
        'u scenu: zamjena drži u svakom ponavljanju, odvajanje gotovo u svakom (ogradu netko ponekad skloni). Organizacija i oprema ovise o tome da se netko sjeti, svaki put: ovdje se ' +
        'organizacija zaboravi u jednom ponavljanju od pet, oprema u tri od deset. Na papiru izgledaju dobro, a na dan ' +
        'scena zaštićena samo njima zadrži većinu rizika. Oprema k tome štiti samo od nekih ozljeda: prsluk ne zaustavlja ' +
        'automobil, cipele ne zaustavljaju vrata.</p>' +
        '<p><b>Ponavljanja.</b> Svaka scena ide 200 puta. U svakom ponavljanju stranica izvuče koje su mjere zaboravljene ' +
        'i je li netko ozlijeđen; ista serija s drugim mjerama izvlači iste brojeve, pa se vidi točno što je koja mjera ' +
        'promijenila. „Nova serija” izvlači druge. Zakon o zaštiti na radu traži isti redoslijed: opasnost najprije ' +
        'izbjeći, opasno zamijeniti manje opasnim, a skupnu zaštitu staviti ispred osobne; to vrijedi za svakoga na ' +
        'setu, bez obzira na ugovor.</p>' +
        '<p><b>Pojednostavljeno.</b> Scene, razine, učinci mjera i postoci zaboravljanja su izmišljeni, ali uvjerljivi; ' +
        'kaskaderske scene, vozila i rigging vode stručnjaci, a stranica pokazuje samo zašto. Konačnu riječ imaju sigurnosni brifing ' +
        'produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'Four scenes, five levels of control and the risk that remains',
      dec: '.',
      scene: 'Scene',
      sceneHint: 'Switch the controls on and off on the stage.',
      newSeries: 'New series of runs',
      newSeriesHint: 'The same controls, another 200 runs (key N).',
      seedParam: 'Series',
      ctlParam: '{scene}: {level}',

      preset_none: 'No controls',
      hint_none: 'the four scenes as written',
      preset_lower: 'Only briefing and PPE',
      hint_lower: 'organising and personal protection: most of the risk stays',
      preset_operator: 'Door: the operator watches',
      hint_operator: 'only the operator on a cue: 80 % stays',
      preset_guard: 'Door: a sensor',
      hint_guard: 'a sensor stops the door: 31 % stays',
      preset_upper: 'All but removal',
      hint_upper: 'replace, separate, organise and protect',
      preset_remove: 'Remove the hazard',
      hint_remove: 'in every scene: nothing stays',

      scene_stairs: 'Wet stairs',
      scene_lamp: 'Lamp up high',
      scene_car: 'Car by the camera',
      scene_door: 'Powered door',
      long_stairs: 'An actor runs down wet stairs',
      long_lamp: 'A heavy lamp on a high stand over the crew',
      long_car: 'A car passes close to the camera',
      long_door: 'A powered door on the set closes on a cue',

      level_remove: 'Remove the hazard',
      level_replace: 'Replace it with something less dangerous',
      level_separate: 'Separate people from it',
      level_organise: 'Organise the work',
      level_protect: 'Personal protective equipment',
      fail_remove: 'no hazard: nothing to forget',
      fail_replace: 'built in: holds on every run',
      fail_separate: 'built in: moved aside 1 run in 50',
      fail_organise: 'someone must remember: forgotten 1 run in 5',
      fail_protect: 'someone must remember: forgotten 3 runs in 10',

      c_stairs_remove: 'Shoot the stairs dry',
      c_stairs_replace: 'A stunt performer does the run',
      c_stairs_separate: 'A rail on the open side, mats at the foot',
      c_stairs_organise: 'Rehearse at walking pace, a spotter at the foot',
      c_stairs_protect: 'Knee and elbow pads under the costume',
      c_lamp_remove: 'No lamp over people: light from outside',
      c_lamp_replace: 'A lighter, cooler lamp',
      c_lamp_separate: 'A cordoned zone: nobody under the stand',
      c_lamp_organise: 'A briefing; grips check the stand after each move',
      c_lamp_protect: 'Hard hats under the stand',
      c_car_remove: 'No close pass: shoot it wide',
      c_car_replace: 'A slower pass, sped up in the edit',
      c_car_separate: 'A barrier; the camera on a remote head, crew behind',
      c_car_organise: 'Rehearse at walking speed, fewer people by the road',
      c_car_protect: 'High-visibility vests',
      c_door_remove: 'The door stays open; it closes in the edit',
      c_door_replace: 'A light, slow door a hand can stop',
      c_door_separate: 'A sensor stops the door if anyone is in the way',
      c_door_organise: 'The operator closes it on a cue, eyes on the doorway',
      c_door_protect: 'Safety boots',

      effGone: 'the hazard is gone',
      effL: 'likelihood −{n}',
      effI: 'severity −{n}',
      effNone: 'moves no level',
      ctlLabel: '{level}: {control}',

      head_ladder: 'Controls, strongest first',
      head_risk: 'Risk: likelihood × severity',
      head_runs: 'The scene run {n} times (rehearsals and takes), series {seed}',
      row_inh: 'No controls',
      row_paper: 'On paper: all in place',
      row_day: 'On the day: with forgetting',
      scoreLI: '{l} × {i} = {s}',
      removed: '0: hazard removed',
      dayVal: '≈ {s}',
      kept: '{p} % of the risk stays',
      lik: 'likelihood {l}: an injury in {p} % of runs',
      sev: 'severity {i}: {name}',
      sev_1: 'a bruise',
      sev_2: 'first aid',
      sev_3: 'days off work',
      sev_4: 'serious, hospital',
      sev_5: 'life-changing or fatal',
      hurtN: ['{n} injury', '{n} injuries'],
      seriousN: ['{n} of them serious', '{n} of them serious'],
      forgotN: ['something forgotten in {n} run', 'something forgotten in {n} runs'],
      expect: 'expected injuries: {e}, without controls {e0}',
      tabKept: '{s0} → ≈ {d}',
      tabHurt: ['{n} injury', '{n} injuries'],
      runOk: 'run {k}: no injury',
      runHurt: 'run {k}: injury, severity {i}',
      runMiss: 'forgotten: {what}',
      gridLabel: '{n} runs: {hurt}, {serious}',

      legHurt: 'injury (number = severity)',
      legSerious: 'serious injury (4–5)',
      legMiss: 'something forgotten',
      legPaper: 'on paper',
      legDay: 'on the day',

      capNone: '{scene}, no controls: {l} × {i} = {s}. In {runs} runs, {hurt}, {serious}.',
      capRemoved: '{scene}: the hazard is removed, so there is nothing to forget or break: no injuries in {runs} runs.',
      capLower: '{scene}, only controls someone must remember: {s1} on paper, ≈ {day} on the day, {kept} % of the risk stays. ' +
        '{hurt}, {serious}; {forgot}.',
      capUpper: '{scene}, strongest level "{top}": {s1} on paper, ≈ {day} on the day, {kept} % of the risk stays. ' +
        'A built-in control holds on (nearly) every run: {hurt}, {serious}.',
      capNoEffect: '"{control}" moves no level: it does not protect against this injury.',

      foot: 'Simplified; the levels and percentages are illustrative and the production is made up. The production\'s ' +
        'safety briefing and the head of department have the final word.',

      explain:
        '<p><b>Risk is likelihood times severity.</b> Each scene has a hazard and two ratings from 1 to 5: how likely it ' +
        'is that someone gets hurt, and how bad that injury would be. Their product is the risk score, as in a risk ' +
        'register (up to 25). Here likelihood means the share of the scene\'s runs that end in an injury: 1 % at ' +
        'level 1, doubling with each level, up to 16 % at level 5.</p>' +
        '<p><b>Controls come in an order of strength.</b> The strongest is to <i>remove the hazard</i>: shoot the stairs ' +
        'dry, cut the car\'s close pass. When that is not possible, <i>replace</i> the dangerous with something less ' +
        'dangerous: a stunt performer instead of the actor, a lighter lamp, a slower pass. Then <i>separate people</i> ' +
        'from it: a rail, a barrier, a zone nobody enters, a sensor that stops the door. Only then <i>organise the ' +
        'work</i>: a rehearsal, a briefing, a spotter, fewer people near the hazard. Last comes <i>personal protective ' +
        'equipment</i>: pads, hard hats, vests.</p>' +
        '<p><b>Why that order.</b> A removed hazard cannot hurt anyone. Replacing and separating are built into the scene: ' +
        'a replacement holds on every run, a separation on nearly every run (a barrier is sometimes moved aside). Organising and protective equipment depend on someone remembering, every time: here the ' +
        'organising is forgotten on one run in five and the equipment on three in ten. On paper they look fine; on the ' +
        'day a scene protected only by them keeps most of its risk. Equipment also protects against some injuries only: ' +
        'a vest does not stop a car, boots do not stop a door.</p>' +
        '<p><b>The runs.</b> Each scene runs 200 times. On every run the page draws which controls were forgotten and ' +
        'whether someone was hurt; the same series with other controls draws the same numbers, so you see exactly what ' +
        'each control changed. "New series" draws others. Croatian law on safety at work asks for the same order: avoid ' +
        'the hazard first, replace the dangerous with the less dangerous, and put collective protection before personal; ' +
        'it applies to everyone on set, whatever their contract.</p>' +
        '<p><b>Simplified.</b> The scenes, levels, effects of the controls and the rates of forgetting are made up but ' +
        'plausible; stunts, vehicles and rigging are run by their specialists, and the page shows only why. The ' +
        'production\'s safety briefing and the head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
