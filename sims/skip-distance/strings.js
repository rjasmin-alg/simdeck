/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the skip-distance page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/sprungdistanz_applet.html and sections/sprungdistanz_1.md, sprungdistanz_2.md
   (CC BY 4.0, 50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck
   from it and the German original. Terms missing from kit/glossary.js (hop, skip distance, radiation angle,
   ionosphere, sky wave) are written out here: NOTES.md "Term pairs". Caption values ({angle}, {km}, …) are nodes. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Presjek Zemlje i ionosfere u mjerilu: zraka iz antene, lom na ionosferi i povratak na Zemlju; ispod toga skok-udaljenost ovisno o kutu zračenja',
      // controls
      angle: 'Kut zračenja α',
      angleHint: 'Kut između zrake iz antene i tla (horizonta). 0° je uz samo tlo, 90° ravno gore.',
      height: 'Visina lomeće regije',
      heightHint: 'Na kojoj se visini zraka lomi natrag. E-regija je na oko 110 km, F2-regija na oko 300 km.',
      deg: '{v}°',
      km: '{v} km',
      // presets
      presetOriginal: 'Izvorni aplet (0°)',
      presetOriginalHint: 'Početni prikaz izvornog apleta: zraka uz horizont, najdulji skok',
      presetFlatF2: 'Plitko, F2 (10°)',
      presetFlatF2Hint: 'Plitak kut na F2-regiji: dug skok',
      presetMediumF2: 'Srednje, F2 (30°)',
      presetMediumF2Hint: 'Strmiji kut: skok je mnogo kraći',
      presetSteepF2: 'Strmo, F2 (60°)',
      presetSteepF2Hint: 'Strm kut: signal se vraća blizu odašiljača',
      presetVertical: 'Ravno gore (90°)',
      presetVerticalHint: 'Zraka se vraća na samu antenu',
      presetFlatE: 'Plitko, E-regija (10°)',
      presetFlatEHint: 'Isti kut kao 2, ali niža regija: kraći skok',
      // legend
      legendRay: 'zraka (prostorni val)',
      legendLayer: 'lomeća regija (crtkano)',
      legendCurve: 'skok-udaljenost za ovu visinu',
      legendRefs: 'E i F2 za usporedbu (točkasto)',
      // stage
      tx: 'odašiljač',
      rx: 'povratak na Zemlju',
      earth: 'Zemlja',
      layer: 'lomeća regija, {h}',
      hopLabel: 'skok {d}',
      scale: 'u mjerilu',
      plotTitle: 'skok-udaljenost ovisno o kutu zračenja',
      axisAngle: 'kut zračenja α',
      refE: 'E (110 km)',
      refF2: 'F2 (300 km)',
      // captions
      cap_grazing: 'Kut zračenja {angle}: zraka izlazi uz sam horizont. Lomeća regija na {height} vraća je nakon {km}: to je najdulji skok koji ta visina dopušta.',
      cap_oblique: 'Kut zračenja {angle}, lomeća regija na {height}: jedan skok premošćuje oko {km}. Uz horizont (0°) bi na toj visini bilo {max}.',
      cap_vertical: 'Kut zračenja {angle}: zraka ide ravno gore do {height} i vraća se na samu antenu, skok-udaljenost je {km}. Što je kut strmiji, to je skok kraći.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p><em lang="en">Hop</em> (skok) je put <em lang="en">sky wave</em> (prostornog vala) od odašiljačke antene, kroz lom na <em lang="en">ionosphere</em> (ionosferi), do povratka na Zemljinu površinu. Premoštena udaljenost, <em lang="en">skip distance</em> (skok-udaljenost), može se odrediti čisto geometrijski.</p>' +
        '<p>Ovisi o dvije stvari: na kojoj se visini nalazi lomeća regija i pod kojim <em lang="en">radiation angle</em> (kutom zračenja), u odnosu na Zemljinu površinu, antena zrači. Što je kut ravniji, a regija viša, to je skok dulji. Na zakrivljenoj Zemlji ravna zraka uz horizont stiže najdalje: na E-regiji do oko 2000 km, na F2-regiji do oko 4000 km (model uz sam horizont daje 2350 i 3840 km). Dalje signal stiže tek u više skokova.</p>' +
        '<p>Kut zračenja dipola ovisi o njegovoj visini iznad tla: što je viši, to je kut ravniji. Snaga odašiljača na skok-udaljenost nema utjecaja.</p>' +
        '<p>Model ionosferu crta kao zrcalo na jednoj visini; prava zraka se lomi postupno, a visina regije mijenja se s dobom dana, godišnjim dobom, Sunčevom aktivnošću i frekvencijom. Prava antena gotovo ne zrači ispod nekoliko stupnjeva, pa su skokovi nešto kraći od najduljih u modelu.</p>'
    },
    en: {
      stage: 'A cross-section of the Earth and the ionosphere to scale: the ray from the antenna, its turn in the ionosphere and its return to Earth; below it, the hop distance against the radiation angle',
      angle: 'Radiation angle α',
      angleHint: 'The angle between the ray leaving the antenna and the ground (the horizon). 0° is along the ground, 90° straight up.',
      height: 'Height of the refracting region',
      heightHint: 'The height at which the ray is turned back. The E region is at about 110 km, the F2 region at about 300 km.',
      deg: '{v}°',
      km: '{v} km',
      presetOriginal: 'Original applet (0°)',
      presetOriginalHint: 'Where the original applet starts: a ray along the horizon, the longest hop',
      presetFlatF2: 'Flat, F2 (10°)',
      presetFlatF2Hint: 'A flat angle off the F2 region: a long hop',
      presetMediumF2: 'Medium, F2 (30°)',
      presetMediumF2Hint: 'A steeper angle: a much shorter hop',
      presetSteepF2: 'Steep, F2 (60°)',
      presetSteepF2Hint: 'A steep angle: the signal comes down close to the transmitter',
      presetVertical: 'Straight up (90°)',
      presetVerticalHint: 'The ray comes back down on the antenna',
      presetFlatE: 'Flat, E region (10°)',
      presetFlatEHint: 'The same angle as 2, but a lower region: a shorter hop',
      legendRay: 'ray (sky wave)',
      legendLayer: 'refracting region (dashed)',
      legendCurve: 'hop distance at this height',
      legendRefs: 'E and F2 to compare (dotted)',
      tx: 'transmitter',
      rx: 'back on Earth',
      earth: 'Earth',
      layer: 'refracting region, {h}',
      hopLabel: 'hop {d}',
      scale: 'to scale',
      plotTitle: 'hop distance against the radiation angle',
      axisAngle: 'radiation angle α',
      refE: 'E (110 km)',
      refF2: 'F2 (300 km)',
      cap_grazing: 'Radiation angle {angle}: the ray leaves along the horizon. The refracting region at {height} sends it back after {km}: the longest hop this height allows.',
      cap_oblique: 'Radiation angle {angle}, refracting region at {height}: one hop covers about {km}. Along the horizon (0°) it would be {max} at this height.',
      cap_vertical: 'Radiation angle {angle}: the ray goes straight up to {height} and comes back down on the antenna, a hop distance of {km}. The steeper the angle, the shorter the hop.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p>A <em lang="en">hop</em> is the path of a <em lang="en">sky wave</em> from the transmitting antenna, turned back by the <em lang="en">ionosphere</em>, to where it comes down on the Earth\'s surface again. The distance it covers, the <em lang="en">skip distance</em> (or hop distance), is pure geometry.</p>' +
        '<p>It depends on two things: the height of the refracting region, and the <em lang="en">radiation angle</em> at which the antenna sends the signal, measured from the Earth\'s surface. The flatter the angle and the higher the region, the longer the hop. On a curved Earth a ray along the horizon gets farthest: up to about 2000 km off the E region and about 4000 km off the F2 region (the model gives 2350 and 3840 km along the horizon). Beyond that a signal needs several hops.</p>' +
        '<p>A dipole\'s radiation angle depends on its height above the ground: the higher it hangs, the flatter the angle. The transmitter\'s power has no effect on the hop distance.</p>' +
        '<p>The model treats the ionosphere as a mirror at one height; a real ray bends gradually, and the region\'s height changes with the time of day, the season, solar activity and the frequency. A real antenna hardly radiates below a few degrees, so real hops are somewhat shorter than the model\'s longest.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
