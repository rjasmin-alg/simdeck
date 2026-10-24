/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the greyline page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Written for simdeck in both languages; the Croatian
   terms follow 50ohm-contents-hr (sections/greyline.md: greyline, D-regija, E- i F-regija). Terms missing from
   kit/glossary.js are written out here: NOTES.md "Term pairs". Caption values ({date}, {a}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Karta svijeta s danom i noći: granica dana i noći, pojas sumraka (greyline), točka u kojoj je Sunce u zenitu i postaje',
      // controls
      day: 'Datum',
      time: 'Vrijeme (UTC)',
      nautical: 'Nautički sumrak (do 12°)',
      a: 'Postaja A',
      b: 'Postaja B',
      off: 'bez druge postaje',
      play: 'Pokreni dan',
      pause: 'Zaustavi',
      playKey: 'Pokreni ili zaustavi dan',
      playHint: 'Vrijeme teče (uz smanjeno kretanje u skokovima od pola sata); u ponoć prelazi na sljedeći dan',
      // places
      pl_zagreb: 'Zagreb',
      pl_london: 'London',
      pl_newyork: 'New York',
      pl_rio: 'Rio de Janeiro',
      pl_capetown: 'Cape Town',
      pl_tokyo: 'Tokio',
      pl_honolulu: 'Honolulu',
      pl_anchorage: 'Anchorage',
      // presets
      presetEquinox: 'Ekvinocij',
      presetEquinoxHint: '20. ožujka, 17:20 UTC: Sunce je upravo zašlo u Zagrebu; granica dana i noći ide od pola do pola',
      presetJuneSolstice: 'Ljetni solsticij',
      presetJuneSolsticeHint: '21. lipnja, 19:05 UTC: sjeverni pol je cijeli dan na suncu, južni u noći',
      presetDecSolstice: 'Zimski solsticij',
      presetDecSolsticeHint: '21. prosinca, 15:25 UTC: južni pol je cijeli dan na suncu, sjeverni u noći',
      presetNow: 'Sada',
      presetNowHint: 'Današnji datum i trenutačno vrijeme sa sata ovog računala',
      presetPathGrey: 'Zagreb – Tokio',
      presetPathGreyHint: '3. lipnja, 19:05 UTC: sumrak u Zagrebu, zora u Tokiju, cijeli put u pojasu',
      presetPathDay: 'Zagreb – New York',
      presetPathDayHint: 'Isti trenutak: u New Yorku je poslijepodne, put većinom ide po danu',
      // legend
      legendDay: 'dan',
      legendBand: 'greyline (šrafirano)',
      legendNight: 'noć',
      legendTerminator: 'granica dana i noći',
      legendSun: 'Sunce u zenitu',
      legendA: 'postaja A',
      legendB: 'B',
      // stage
      clock: '{time} UTC',
      dateFmt: '{d}. {m}',
      m1: 'siječnja', m2: 'veljače', m3: 'ožujka', m4: 'travnja', m5: 'svibnja', m6: 'lipnja',
      m7: 'srpnja', m8: 'kolovoza', m9: 'rujna', m10: 'listopada', m11: 'studenoga', m12: 'prosinca',
      latN: '{v}° s. š.', latS: '{v}° j. š.', lonE: '{v}° i. d.', lonW: '{v}° z. d.',
      deg: '{v}°',
      km: '{v} km',
      pct: '{v} %',
      above: '{v} iznad horizonta',
      onHorizon: 'na samom horizontu',
      below: '{v} ispod horizonta',
      // captions
      cap_aDay: '{date}, {clock}. Sunce je u zenitu u točki {sub}. U mjestu {a} je dan, Sunce je {elev}: D-regija guta 160 m i niže kratkovalne pojaseve.',
      cap_aDusk: '{date}, {clock}. U mjestu {a} Sunce je upravo zašlo, {elev}: postaja je na greyline. D-regija nestaje, a F-regija još lomi signal.',
      cap_aDawn: '{date}, {clock}. U mjestu {a} Sunce tek izlazi, {elev}: postaja je na greyline. F-regija je već osvijetljena, a D-regija se još nije stvorila.',
      cap_aNight: '{date}, {clock}. U mjestu {a} je noć, Sunce je {elev}. Nema D-regije, ali i F-regija slabi; greyline je drugdje na karti.',
      cap_both: '{date}, {clock}. Obje postaje, {a} i {b}, na greyline su ({km}): {band} puta je u pojasu, {day} po danu, {night} po noći. Takav put je dobar za DX na nižim pojasevima.',
      cap_one: '{date}, {clock}. Samo je jedan kraj puta {a} – {b} ({km}) na greyline. Put je {band} u pojasu, {day} po danu, {night} po noći.',
      cap_none: '{date}, {clock}. Ni {a} ni {b} nisu na greyline. Put ({km}) je {band} u pojasu, {day} po danu, {night} po noći.',
      // attribution
      credit: 'Ideja prema apletu s <a href="https://50ohm.de">50ohm.de</a> (samo zamisao, bez koda). Položaj Sunca: jednadžbe NOAA-e i Meeusa. Karta: <a href="https://www.naturalearthdata.com/">Natural Earth</a> (javno dobro).',
      explain:
        '<p><em lang="en">Grey line</em> (siva linija, <em lang="en">greyline</em>) je prsten oko cijele Zemlje u kojem je sumrak: Sunce je upravo zašlo ili će uskoro izaći. Na karti je to pojas uz <em lang="en">terminator</em> (granicu dana i noći). Ovdje je pojas <em lang="en">civil twilight</em> (građanski sumrak, Sunce do 6° ispod horizonta) ili <em lang="en">nautical twilight</em> (nautički sumrak, do 12°).</p>' +
        '<p>Zašto tu kratki valovi stižu dalje: danju Sunčevo zračenje stvara <em lang="en">D region</em> (D-regiju, oko 60 – 90 km), koja na prolazu guta signale na 160 m i nižim kratkovalnim pojasevima (80 i 40 m). Nakon zalaska D-regija brzo nestaje, a viša i rjeđa F-regija ostaje ionizirana satima i dalje lomi signal natrag na Zemlju. Pri izlasku je obrnuto: F-regija je već osvijetljena, a D-regija se još nije stvorila. Na greyline zato nema dnevnog prigušenja, a lom još radi. Najbolje je kad su obje postaje u pojasu i put ide duž njega.</p>' +
        '<p>Pojas putuje prema zapadu 15° na sat. Nagib mu se mijenja s godišnjim dobom: oko <em lang="en">equinox</em> (ekvinocija) ide od pola do pola, oko <em lang="en">solstice</em> (solsticija) nagnut je 23,4°, pa je jedan pol cijeli dan na suncu. Točka u kojoj je Sunce u zenitu (☉) kreće se između obratnica.</p>' +
        '<p>Model: položaj Sunca iz jednadžbi NOAA-ina kalkulatora (Meeus, <em>Astronomical Algorithms</em>), Sunce kao točka, bez loma svjetlosti u atmosferi (pravi izlazak je na −0,8°). Put je kraći luk velike kružnice. Pravo širenje ovisi i o frekvenciji, Sunčevoj aktivnosti i antenama. Za gotovo suprotne točke Zemlje (Europa – Novi Zeland) put duž pojasa nije kraći luk; to ovdje nije prikazano.</p>'
    },
    en: {
      stage: 'A world map with day and night: the line between them, the twilight band (grey line), the point where the Sun is overhead, and the stations',
      day: 'Date',
      time: 'Time (UTC)',
      nautical: 'Nautical twilight (to 12°)',
      a: 'Station A',
      b: 'Station B',
      off: 'no second station',
      play: 'Play the day',
      pause: 'Pause',
      playKey: 'Play or pause the day',
      playHint: 'Time runs (in half-hour jumps under reduced motion); at midnight it moves on to the next day',
      pl_zagreb: 'Zagreb',
      pl_london: 'London',
      pl_newyork: 'New York',
      pl_rio: 'Rio de Janeiro',
      pl_capetown: 'Cape Town',
      pl_tokyo: 'Tokyo',
      pl_honolulu: 'Honolulu',
      pl_anchorage: 'Anchorage',
      presetEquinox: 'Equinox',
      presetEquinoxHint: '20 March, 17:20 UTC: the Sun has just set in Zagreb; the day–night line runs from pole to pole',
      presetJuneSolstice: 'June solstice',
      presetJuneSolsticeHint: '21 June, 19:05 UTC: the North Pole is in sunlight all day, the South Pole in night',
      presetDecSolstice: 'December solstice',
      presetDecSolsticeHint: '21 December, 15:25 UTC: the South Pole is in sunlight all day, the North Pole in night',
      presetNow: 'Now',
      presetNowHint: "Today's date and the time from this computer's clock",
      presetPathGrey: 'Zagreb – Tokyo',
      presetPathGreyHint: '3 June, 19:05 UTC: dusk in Zagreb, dawn in Tokyo, the whole path in the band',
      presetPathDay: 'Zagreb – New York',
      presetPathDayHint: 'The same moment: in New York it is afternoon, most of the path runs through daylight',
      legendDay: 'day',
      legendBand: 'grey line (hatched)',
      legendNight: 'night',
      legendTerminator: 'day–night line',
      legendSun: 'Sun overhead',
      legendA: 'station A',
      legendB: 'B',
      clock: '{time} UTC',
      dateFmt: '{d} {m}',
      m1: 'January', m2: 'February', m3: 'March', m4: 'April', m5: 'May', m6: 'June',
      m7: 'July', m8: 'August', m9: 'September', m10: 'October', m11: 'November', m12: 'December',
      latN: '{v}° N', latS: '{v}° S', lonE: '{v}° E', lonW: '{v}° W',
      deg: '{v}°',
      km: '{v} km',
      pct: '{v} %',
      above: '{v} above the horizon',
      onHorizon: 'right on the horizon',
      below: '{v} below the horizon',
      cap_aDay: '{date}, {clock}. The Sun is overhead at {sub}. In {a} it is day, the Sun {elev}: the D region swallows 160 m and the lower HF bands.',
      cap_aDusk: '{date}, {clock}. In {a} the Sun has just set, {elev}: the station is on the grey line. The D region is fading while the F region still turns signals back.',
      cap_aDawn: '{date}, {clock}. In {a} the Sun is about to rise, {elev}: the station is on the grey line. The F region is already lit, the D region not yet built up.',
      cap_aNight: '{date}, {clock}. In {a} it is night, the Sun {elev}. No D region, but the F region weakens too; the grey line is elsewhere on the map.',
      cap_both: '{date}, {clock}. {a} and {b} are both on the grey line ({km}): {band} of the path in the band, {day} in daylight, {night} in night. A good path for DX on the lower bands.',
      cap_one: '{date}, {clock}. Only one end of the path {a} – {b} ({km}) is on the grey line. The path is {band} in the band, {day} in daylight, {night} in night.',
      cap_none: '{date}, {clock}. Neither {a} nor {b} is on the grey line. The path ({km}) is {band} in the band, {day} in daylight, {night} in night.',
      credit: 'Idea after an applet on <a href="https://50ohm.de">50ohm.de</a> (concept only, no code). Sun position: NOAA and Meeus equations. Map: <a href="https://www.naturalearthdata.com/">Natural Earth</a> (public domain).',
      explain:
        '<p>The <em>grey line</em> is the ring around the whole Earth where it is twilight: the Sun has just set or is about to rise. On the map it is the band along the <em>terminator</em>, the line between day and night. Here the band is <em>civil twilight</em> (the Sun up to 6° below the horizon) or <em>nautical twilight</em> (up to 12°).</p>' +
        '<p>Why HF signals get further there: in daylight the Sun\'s radiation builds the <em>D region</em> (about 60–90 km up), which absorbs signals on 160 m and the lower HF bands (80 and 40 m) as they pass through it. After sunset the D region fades quickly, while the higher, thinner F region stays ionised for hours and keeps turning signals back to Earth. At sunrise it is the other way round: the F region is already lit, the D region not yet built up. On the grey line there is no daytime loss, and refraction still works. Best of all: both stations in the band, and the path running along it.</p>' +
        '<p>The band travels west at 15° an hour. Its tilt changes with the season: near an <em>equinox</em> it runs from pole to pole; near a <em>solstice</em> it is tilted by 23.4°, so one pole is in sunlight all day. The point where the Sun stands overhead (☉) moves between the tropics.</p>' +
        '<p>The model: the Sun\'s position from the NOAA solar calculator\'s equations (Meeus, <em>Astronomical Algorithms</em>), the Sun as a point, no bending of light in the atmosphere (real sunrise is at −0.8°). The path is the short great-circle arc. Real propagation also depends on the frequency, solar activity and the antennas. For nearly opposite points on the Earth (Europe – New Zealand) the path along the band is not the short arc; that is not shown here.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
