/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-who-touches-what, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   Roles and equipment use the English loanwords crews say (owner, 2026-11-08); the Croatian forms marked (check) in
   NOTES.md wait for the colleague who trains film crews. Sentences avoid declining a department or role name:
   "Vlasnik: {dept}", "{via}: …". The second person in Croatian stays in the present tense, so it needs no gender.
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Dvanaest malih problema na setu i tko ih rješava',

      // departments and their heads (departments.js ids)
      dept_electric: 'Rasvjeta',
      dept_grip: 'Grip',
      dept_camera: 'Kamera',
      dept_sound: 'Ton',
      dept_art: 'Scenografija',
      dept_props: 'Rekvizita',
      dept_costume: 'Kostim',
      dept_makeup: 'Maska',
      dept_locations: 'Lokacije',
      dept_production: 'Produkcija',
      head_electric: 'gaffer',
      head_grip: 'key grip',
      head_camera: 'DoP',
      head_sound: 'snimatelj zvuka',
      head_art: 'scenograf',
      head_props: 'rekviziter',
      head_costume: 'kostimograf',
      head_makeup: 'šef maske',
      head_locations: 'location manager',
      head_production: 'direktor filma',

      // who you are (crew.js ids)
      you: 'Ti si',
      youHint: 'Isti potez je dobar kad je stvar tvog odjela.',
      you_trainee: 'Pripravnik',
      you_gr: 'Grip',
      you_el: 'Električar',
      you_prop: 'Pomoćni rekviziter',
      you_boom: 'Boom operator',

      // choices
      pickFor: 'Tko to rješava?',
      choice_self: 'Ja ću to riješiti',
      choice_ad: 'Pitam 1st AD-a',
      choiceLabel: '{problem}: {choice}',

      // the problems: short title, what you see, what you could not see, what the owner does, what your own fix breaks
      short_flag: 'Sjena na glumici',
      see_flag: 'Flag na stativu baca sjenu preko glumičina lica.',
      hidden_flag: 'Vreća s pijeskom leži upravo na nozi stativa koja bi se pomaknula.',
      fix_flag: 'Grip zakrene flag za širinu dlana; vreća ostaje na stativu.',
      harm_flag: 'Pomakneš stativ, a vreća ostane iza. Kasnije ga netko okrzne i stativ padne na stand-in.',

      short_cup: 'Šalica se pomaknula',
      see_cup: 'Šalica na stolu nije tamo gdje je pamtiš.',
      hidden_cup: 'Rekvizita ju je tamo stavila prema fotografiji, da odgovara zadnjem snimanju.',
      fix_cup: 'Rekvizita provjeri fotografiju: šalica je na pravom mjestu i ostaje.',
      harm_cup: 'Vratiš ju gdje ju pamtiš. Idući kadrovi više ne odgovaraju prethodnima: greška kontinuiteta, kadrovi se ponavljaju.',

      short_cable: 'Kabel preko prolaza',
      see_cable: 'Kabel za struju prelazi preko prolaza do reflektora.',
      hidden_cable: 'Kabel napaja glavno svjetlo i pod naponom je.',
      fix_cable: 'Električar ga provede uz zid, a prijelaz pokrije prijelaznim mostom za kabele.',
      harm_cable: 'Povučeš ga u stranu; na drugom kraju utikač ispadne i glavno svjetlo se ugasi usred snimanja.',

      short_curtain: 'Reflektor uz zavjesu',
      see_curtain: 'Reflektor stoji blizu zavjese.',
      hidden_curtain: 'Reflektor gori već sat vremena; kućište je prevruće za dodir.',
      fix_curtain: 'Rasvjeta ga ugasi, pusti da se ohladi i odmakne ga u rukavicama.',
      harm_curtain: 'Uhvatiš reflektor da ga odgurneš i opečeš ruku: prva pomoć, a reflektor je izbačen iz položaja.',

      short_coat: 'Mokar kaput',
      see_coat: 'Glumčev kaput mokar je od scene na kiši.',
      hidden_coat: 'Kostim ima suhi duplikat kaputa, a ova tkanina ne podnosi toplinu.',
      fix_coat: 'Kostim donese suhi duplikat i odnese mokri kaput.',
      harm_coat: 'Objesiš kaput uz vrući reflektor da se osuši: tkanina se sprži. Scena čeka kostim.',

      short_monitor: 'Slika je tamna',
      see_monitor: 'Na monitoru slika izgleda pretamno.',
      hidden_monitor: 'Kamera je namještena za noćni izgled scene; tamno pokazuje samo monitor.',
      fix_monitor: 'Kamera provjeri: snimka je dobra, ispravi se monitor.',
      harm_monitor: 'Promijeniš postavku na kameri. Svi idući kadrovi snimljeni su krivo, a to se vidi tek kad se snimka pregleda na kraju dana.',

      short_pack: 'Vidi se odašiljač',
      see_pack: 'Odašiljač bežičnog mikrofona vidi se ispod glumčeve košulje.',
      hidden_pack: 'Kabel mikrofona zalijepljen je tako da ne struže o tkaninu.',
      fix_pack: 'Boom operator premjesti odašiljač i ponovno zalijepi kabel.',
      harm_pack: 'Gurneš odašiljač niže; kabel se odlijepi i struže o košulju. Idući kadrovi nemaju upotrebljiv ton.',

      short_vase: 'Vaza kod vrata',
      see_vase: 'Vaza na komodi napola skriva vrata kroz koja glumica ulazi.',
      hidden_vase: 'U širokom kadru, koji je već snimljen, vaza stoji upravo tamo.',
      fix_vase: 'Scenografija i kamera se dogovore: vaza se miče samo za ovaj kut, a scenografija zapiše kamo se vraća.',
      harm_vase: 'Preneseš vazu na prozor. Krupni kadrovi više ne odgovaraju širokom: greška kontinuiteta, kadrovi se ponavljaju.',

      short_shine: 'Čelo se sjaji',
      see_shine: 'Glumčevo čelo sjaji se pod reflektorima.',
      hidden_shine: 'Modrica na sljepoočnici je šminka i vidi se u svakom kadru scene.',
      fix_shine: 'Maska ga napudra, oko naslikane modrice.',
      harm_shine: 'Dodaš glumcu papirnatu maramicu; naslikana modrica se razmaže. Natrag u masku, a zadnji kadrovi se ponavljaju.',

      short_armchair: 'Vlasnikova fotelja',
      see_armchair: 'Fotelja vlasnika kuće stoji u kadru.',
      hidden_armchair: 'Lokacije su s vlasnikom dogovorile da se bez njega ništa ne miče, a pod je stari parket.',
      fix_armchair: 'Lokacije nazovu vlasnika, i fotelja se pomakne na filcanim podlošcima, kako je dogovoreno.',
      harm_armchair: 'Povučeš fotelju i ogrebeš parket. Vlasnik zaustavi snimanje dok ne dođe produkcija.',

      short_van: 'Kombi pred vratima',
      see_van: 'Kombi ekipe blokira susjedova dvorišna vrata.',
      hidden_van: 'Samo vozači produkcije osigurani su za vožnju tog kombija.',
      fix_van: 'Produkcija pošalje vozača da ga parkira na dopušteno mjesto.',
      harm_van: 'Odvezeš ga i ogrebeš vrata. Bez osiguranja: produkcija rješava susjeda i štetu.',

      short_track: 'Tračnice se ljuljaju',
      see_track: 'Dolly tračnice ljuljaju se na jednom spoju.',
      hidden_track: 'Tračnice su klinovima izravnane za cijelu vožnju kamere.',
      fix_track: 'Gripovi ponovno izravnaju spoj i provezu dolly da provjere.',
      harm_track: 'Podmetneš knjigu pod spoj; tračnice više nisu ravne i vožnja kamere trza kroz iduće kadrove.',

      // outcomes
      out_open: 'Otvoreno',
      out_fixed: 'Riješio njegov odjel',
      out_own: 'Tvoj odjel',
      out_routed: 'Preko 1st AD-a',
      out_passed: 'Proslijeđeno',
      out_harm: 'Nešto je pokvareno',
      harmk_injury: 'ozljeda',
      harmk_continuity: 'kontinuitet',
      harmk_spoiled: 'pokvareni kadrovi',
      harmk_damage: 'šteta',
      tileNow: '{n} min',
      tileHarm: '{n} + {later} min',
      tileLabel: '{n}. {problem}: {outcome}',

      // detail of the selected problem
      ownerLabel: 'Odjel: {dept} ({head})',
      hiddenLabel: 'Što se nije vidjelo:',
      notYet: 'Odaberi tko to rješava. Čije je to i što se ne vidi pokazat će se nakon odabira.',

      // scoreboard
      thNow: 'do rješenja',
      thLater: 'kasnije',
      thTotal: 'ukupno',
      minN: '{n} min',
      cntFixed: 'riješio odjel',
      cntPassed: 'proslijeđeno',
      cntHarm: 'pokvareno',
      cntOpen: 'otvoreno',
      cntInjury: ['{n} ozljeda', '{n} ozljede', '{n} ozljeda'],
      compareHead: 'Isti dan za tebe:',
      cmpOwner: 'sve vlasniku',
      cmpAd: 'sve 1st AD-u',
      cmpSelf: 'sve na svoju ruku',

      foot: 'Pojednostavljeno; minute su ilustrativne, a produkcija izmišljena. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      // captions
      capOpen: '{n}. {problem}: još nije odlučeno. Odaberi odjel, 1st AD-a ili „Ja ću to riješiti”.',
      capFixed: '{n}. {problem}. Odjel: {dept}. {fix} Riješeno za {now} min, ništa drugo nije pokvareno.',
      capOwn: '{n}. {problem}. Posao tvog odjela ({dept}): znaš što se ne vidi. {fix} Riješeno za {now} min.',
      capRouted: '{n}. {problem}. 1st AD zna čije je to i zove: {head}. {fix} Riješeno za {now} min.',
      capPassed: '{n}. {problem}. {via}: „To nije naše, to je {dept}.” Ne diraju ništa i proslijede. Riješeno za {now} min.',
      capHarm: '{n}. {problem}: nestane za {now} min. {harm} To kasnije košta {later} min.',
      capTotals: 'Dan: {now} min do rješenja + {later} min kasnije.',

      // presets
      preset_start: 'Dvanaest problema',
      hint_start: 'Sve je otvoreno: odaberi tko rješava svaki problem',
      preset_self: 'Sve na svoju ruku',
      hint_self: 'Pripravnik sve popravi na svoju ruku: brzo, a 300 min kasnije',
      preset_owner: 'Sve vlasniku',
      hint_owner: 'Svaki problem odjelu kojemu pripada: 36 min, ništa pokvareno',
      preset_look: 'Po izgledu',
      hint_look: 'Odjel pogođen po izgledu: šest proslijeđeno, 54 min',
      preset_ad: 'Sve 1st AD-u',
      hint_ad: 'Kad ne znaš čije je: 1st AD zove vlasnika, 60 min',
      preset_grip: 'Grip na svoju ruku',
      hint_grip: 'Grip popravi svoja dva kako treba, ostalih deset pokvari',

      // legend
      legFixed: 'riješio odjel',
      legPassed: 'proslijeđeno',
      legHarm: 'nešto pokvareno',
      legOpen: 'otvoreno',

      // params
      selParam: 'Odabrani problem',
      choiceParam: '{problem}',

      explain: '<p><b>Svaki odjel ima svoje.</b> Reflektori, struja i kabeli pripadaju rasvjeti (gaffer); stativi, ' +
        'flagovi, dolly tračnice i rigging gripu (key grip); kamera i njezine kartice kameri; mikrofoni i odašiljači na ' +
        'glumcima tonu; uređeni set scenografiji; sve što glumci drže u rukama rekviziti; odjeća kostimu; lice i kosa ' +
        'maski; pravila lokacije i njezin vlasnik lokacijama; papiri, prijevoz i catering produkciji.</p>' +
        '<p><b>Zašto ne dirati tuđe.</b> Dobronamjeran potez nekoga iz drugog odjela pokvari nešto što on ne može vidjeti: ' +
        'stativ ostane bez vreće s pijeskom, šalica više ne odgovara zadnjem snimanju, reflektor je vruć, postavka kamere ' +
        'je promijenjena. Problem nestane za minutu, a šteta stigne kasnije i košta više.</p>' +
        '<p><b>Što učiniti.</b> Pitaj odjel kojemu stvar pripada, njegovog šefa ili nekoga iz njega. Kad ne znaš čije je, ' +
        'pitaj 1st AD-a (prvi asistent režije): on zna i zove pravi odjel. Krivi odjel neće dirati, nego proslijedi, ' +
        'pa se samo izgubi koja minuta. Isti potez je dobar kad je stvar tvog odjela: grip smije pomaknuti svoj flag, ' +
        'jer zna gdje je vreća.</p>' +
        '<p><b>Kad je opasno odmah.</b> Ako se zavjesa upravo zapalila ili stativ upravo pada, ne čeka se vlasnik: ' +
        'tko vidi opasnost, viče „Stop!”, a odjel popravlja nakon zaustavljanja.</p>' +
        '<p>Stranica pojednostavljuje; minute su ilustrativne, a produkcija i ekipa izmišljene. Konačnu riječ imaju ' +
        'sigurnosni brifing produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'Twelve small problems on set and who sorts them out',

      dept_electric: 'Electric',
      dept_grip: 'Grip',
      dept_camera: 'Camera',
      dept_sound: 'Sound',
      dept_art: 'Art',
      dept_props: 'Props',
      dept_costume: 'Costume',
      dept_makeup: 'Make-up',
      dept_locations: 'Locations',
      dept_production: 'Production',
      head_electric: 'gaffer',
      head_grip: 'key grip',
      head_camera: 'DoP',
      head_sound: 'sound mixer',
      head_art: 'art director',
      head_props: 'props master',
      head_costume: 'costume supervisor',
      head_makeup: 'make-up head',
      head_locations: 'location manager',
      head_production: 'production manager',

      you: 'You are',
      youHint: 'The same move is fine when the thing is your department\'s.',
      you_trainee: 'AD trainee',
      you_gr: 'Grip',
      you_el: 'Electrician',
      you_prop: 'Props assistant',
      you_boom: 'Boom operator',

      pickFor: 'Who sorts it out?',
      choice_self: 'I\'ll fix it myself',
      choice_ad: 'Ask the 1st AD',
      choiceLabel: '{problem}: {choice}',

      short_flag: 'A shadow on the actor',
      see_flag: 'A flag on a stand throws a shadow across the actor\'s face.',
      hidden_flag: 'The stand\'s sandbag sits on the very leg you would move.',
      fix_flag: 'A grip turns the flag a hand\'s width; the bag stays on the stand.',
      harm_flag: 'You slide the stand over and its sandbag stays behind. Later someone brushes it and the stand tips onto the stand-in.',

      short_cup: 'The cup has moved',
      see_cup: 'The cup on the table is not where you remember it.',
      hidden_cup: 'Props put it there from their photo, to match the last take.',
      fix_cup: 'Props checks the photo: the cup is in the right place and stays.',
      harm_cup: 'You put it back where you remember it. The next takes no longer match the earlier ones: a continuity error, and the shots are done again.',

      short_cable: 'A cable across the walkway',
      see_cable: 'A power cable runs across the walkway to a lamp.',
      hidden_cable: 'It feeds the key light, and it is live.',
      fix_cable: 'An electrician runs it along the wall and covers the crossing with a cable ramp.',
      harm_cable: 'You tug it aside; at the far end the plug pulls out and the key light goes dark in the middle of a take.',

      short_curtain: 'A lamp by the curtain',
      see_curtain: 'A lamp stands close to a curtain.',
      hidden_curtain: 'The lamp has been on for an hour; its housing is far too hot to touch.',
      fix_curtain: 'Electric switches it off, lets it cool and moves it away, wearing gloves.',
      harm_curtain: 'You grab the lamp to push it away and burn your hand: first aid, and the lamp is knocked out of position.',

      short_coat: 'A wet coat',
      see_coat: 'The actor\'s coat is wet from the rain scene.',
      hidden_coat: 'Costume has a dry double of the coat, and this fabric does not take heat.',
      fix_coat: 'Costume brings the dry double and takes the wet coat away.',
      harm_coat: 'You hang the coat by a hot lamp to dry it: the fabric scorches. The scene waits for costume.',

      short_monitor: 'The picture looks dark',
      see_monitor: 'On the monitor the picture looks too dark.',
      hidden_monitor: 'The camera is set for the scene\'s night look; only the monitor shows it dark.',
      fix_monitor: 'Camera checks: the recording is fine, and the monitor is corrected.',
      harm_monitor: 'You change a setting on the camera. Every take after it is recorded wrong, and nobody sees it until the footage is checked at the end of the day.',

      short_pack: 'A transmitter shows',
      see_pack: 'The radio microphone\'s transmitter shows under the actor\'s shirt.',
      hidden_pack: 'The microphone\'s cable is taped so it does not rub on the fabric.',
      fix_pack: 'The boom operator moves the transmitter and tapes the cable again.',
      harm_pack: 'You push the transmitter lower; the cable comes loose and rubs on the shirt. The next takes have no usable sound.',

      short_vase: 'A vase by the door',
      see_vase: 'A vase on the dresser half hides the door the actor comes through.',
      hidden_vase: 'In the wide shot, already filmed, the vase stands exactly there.',
      fix_vase: 'Art and camera agree: the vase moves for this angle only, and art notes where it goes back.',
      harm_vase: 'You carry the vase to the window. The close-ups no longer match the wide shot: a continuity error, and the shots are done again.',

      short_shine: 'A shiny forehead',
      see_shine: 'The actor\'s forehead shines under the lamps.',
      hidden_shine: 'The bruise on the actor\'s temple is make-up, and it is in every shot of the scene.',
      fix_shine: 'Make-up powders it down, around the painted bruise.',
      harm_shine: 'You hand the actor a tissue and the painted bruise smears. Back to the make-up chair, and the last takes are done again.',

      short_armchair: 'The owner\'s armchair',
      see_armchair: 'The house owner\'s armchair stands in the frame.',
      hidden_armchair: 'Locations agreed with the owner that nothing moves without them, and the floor is old parquet.',
      fix_armchair: 'Locations calls the owner, and the armchair moves on felt pads, as agreed.',
      harm_armchair: 'You drag the armchair and scratch the parquet. The owner stops the shoot until production arrives.',

      short_van: 'A van blocks a gate',
      see_van: 'A crew van blocks a neighbour\'s gate.',
      hidden_van: 'Only the production\'s drivers are insured to drive it.',
      fix_van: 'Production sends the driver to park it where parking is allowed.',
      harm_van: 'You drive it away yourself and scrape the gate. Not insured: production deals with the neighbour and the damage.',

      short_track: 'The dolly track rocks',
      see_track: 'The dolly track rocks at one joint.',
      hidden_track: 'The track was levelled with wedges for the whole camera move.',
      fix_track: 'The grips level the joint again and run the dolly along the track to check.',
      harm_track: 'You wedge a book under the joint; the track is no longer level and the camera move judders through the next takes.',

      out_open: 'Open',
      out_fixed: 'Its department',
      out_own: 'Your department',
      out_routed: 'Via the 1st AD',
      out_passed: 'Passed on',
      out_harm: 'Something broke',
      harmk_injury: 'injury',
      harmk_continuity: 'continuity',
      harmk_spoiled: 'spoiled takes',
      harmk_damage: 'damage',
      tileNow: '{n} min',
      tileHarm: '{n} + {later} min',
      tileLabel: '{n}. {problem}: {outcome}',

      ownerLabel: 'Department: {dept} ({head})',
      hiddenLabel: 'What could not be seen:',
      notYet: 'Pick who sorts it out. Whose it is and what could not be seen show after you pick.',

      thNow: 'until sorted',
      thLater: 'later',
      thTotal: 'total',
      minN: '{n} min',
      cntFixed: 'by its department',
      cntPassed: 'passed on',
      cntHarm: 'broken',
      cntOpen: 'open',
      cntInjury: ['{n} injury', '{n} injuries'],
      compareHead: 'The same day for you:',
      cmpOwner: 'all to the owner',
      cmpAd: 'all to the 1st AD',
      cmpSelf: 'all yourself',

      foot: 'Simplified; the minutes are illustrative and the production is made up. The production\'s safety briefing and the head of department have the final word.',

      capOpen: '{n}. {problem}: not decided yet. Pick a department, the 1st AD, or “I\'ll fix it myself”.',
      capFixed: '{n}. {problem}. Department: {dept}. {fix} Sorted in {now} min, nothing else broken.',
      capOwn: '{n}. {problem}. Your department\'s work ({dept}): you know what cannot be seen. {fix} Sorted in {now} min.',
      capRouted: '{n}. {problem}. The 1st AD knows whose it is and calls the {head}. {fix} Sorted in {now} min.',
      capPassed: '{n}. {problem}. {via}: “Not ours, that\'s {dept}.” They touch nothing and pass it on. Sorted in {now} min.',
      capHarm: '{n}. {problem}: gone in {now} min. {harm} That costs {later} min later.',
      capTotals: 'The day: {now} min until sorted + {later} min later.',

      preset_start: 'Twelve problems',
      hint_start: 'Everything open: pick who sorts out each problem',
      preset_self: 'All yourself',
      hint_self: 'The trainee fixes everything alone: quick, then 300 min later',
      preset_owner: 'All to the owner',
      hint_owner: 'Each problem to the department that owns it: 36 min, nothing broken',
      preset_look: 'By the look',
      hint_look: 'The department guessed from the look: six passed on, 54 min',
      preset_ad: 'All to the 1st AD',
      hint_ad: 'When you don\'t know whose it is: the 1st AD calls the owner, 60 min',
      preset_grip: 'A grip on their own',
      hint_grip: 'A grip fixes their own two right and breaks the other ten',

      legFixed: 'its department sorted it',
      legPassed: 'passed on',
      legHarm: 'something broke',
      legOpen: 'open',

      selParam: 'Selected problem',
      choiceParam: '{problem}',

      explain: '<p><b>Each department owns its things.</b> Lamps, power and cables belong to electric (the gaffer); ' +
        'stands, flags, dolly track and rigging to grip (the key grip); the camera and its cards to camera; microphones and ' +
        'the transmitters on actors to sound; the dressed set to art; whatever actors handle to props; clothing to ' +
        'costume; faces and hair to make-up; the location\'s rules and its owner to locations; paperwork, transport and ' +
        'catering to production.</p>' +
        '<p><b>Why not touch someone else\'s.</b> A well-meant move by someone from another department breaks something ' +
        'they cannot see: a stand left without its sandbag, a cup that no longer matches the last take, a hot lamp, a ' +
        'camera setting changed. The problem is gone in a minute; the damage comes later and costs more.</p>' +
        '<p><b>What to do.</b> Ask the department that owns it, its head or one of its crew. When you don\'t know whose it ' +
        'is, ask the 1st AD (first assistant director), who knows and calls the right department. A wrong department ' +
        'will not touch it but passes it on, so only a few minutes are lost. The same move is fine when the thing is your ' +
        'department\'s: a grip may turn their own flag, because they know where the bag is.</p>' +
        '<p><b>When it is dangerous right now.</b> If the curtain is catching fire or the stand is falling, nobody waits ' +
        'for the owner: whoever sees the danger calls “Stop!”, and the department fixes it once the work has stopped.</p>' +
        '<p>The page simplifies; the minutes are illustrative, and the production and its crew are made up. The ' +
        'production\'s safety briefing and the head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
