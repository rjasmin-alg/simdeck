/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the Nyquist page, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian adapted from
   50ohm-contents-hr/contents/html/applet_nyquist.html and sections/abtasttheorem.md (CC BY 4.0,
   50ohm.de-Autorenteam, AJW-Referat des DARC e.V.; translated and changed); English written for simdeck from it and
   the German original. Terms missing from kit/glossary.js (sampling, sampling rate, aliasing, reconstruction) are
   written out here: NOTES.md "Term pairs". {fs} is a node (f with a subscript s), filled by the page. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Uzorkovanje sinusa od 1 kHz: izvorni, uzorkovani i rekonstruirani signal',
      // controls
      fs: 'Brzina uzorkovanja fs',
      fsHint: 'Granica je 2 kHz, dvostruka frekvencija signala.',
      khz: '{v} kHz',
      // presets
      presetOversampled: 'Mnogo uzoraka (8 kHz)',
      presetOversampledHint: 'Osam uzoraka po periodi: rekonstrukcija je glatka',
      presetAbove: 'Iznad granice (3 kHz)',
      presetAboveHint: 'Tri uzorka po periodi su dovoljna',
      presetJustAbove: 'Tik iznad granice (2,2 kHz)',
      presetJustAboveHint: 'Malo više od dva uzorka po periodi: još uvijek dovoljno',
      presetBoundary: 'Točno na granici (2 kHz)',
      presetBoundaryHint: 'Uzorci padaju na prolaske kroz nulu',
      presetAlias: 'Aliasing (1,5 kHz)',
      presetAliasHint: 'Premalo uzoraka: pojavljuje se sinus od 0,5 kHz',
      presetSlowAlias: 'Aliasing (1,2 kHz)',
      presetSlowAliasHint: 'Alias je još sporiji: 0,2 kHz',
      presetEqual: 'Jednako signalu (1 kHz)',
      presetEqualHint: 'Jedan uzorak po periodi, uvijek u istoj točki',
      // legend
      legendSignal: 'izvorni signal (1 kHz)',
      legendSamples: 'uzorci',
      legendRecon: 'rekonstruirani signal',
      // stage
      panelOriginal: 'Izvorni signal: sinus od 1 kHz',
      panelSampled: 'Uzorkovani signal',
      panelRecon: 'Rekonstruirani signal',
      panelReconRef: 'crtkano: izvorni signal',
      perPeriod: '{v} uzoraka po periodi',
      ms: '{v} ms',
      axisTime: 'vrijeme',
      verdictOk: '✓ Nyquistov uvjet ispunjen',
      verdictBoundary: '= točno na granici',
      verdictAlias: '⚠ aliasing: {f}',
      // captions
      captionOk: '{fs} = {v} > 2 · 1 kHz = 2 kHz: Nyquistov uvjet je ispunjen. Rekonstruirani signal odgovara izvornom signalu.',
      captionBoundary: '{fs} = {v} = 2 · 1 kHz: točno na granici, a to nije dovoljno. Svaki uzorak pada na prolazak kroz nulu, pa je rekonstrukcija ravna crta. Teorem traži {fs} > 2 kHz.',
      captionAlias: '{fs} = {v} < 2 · 1 kHz: aliasing. Isti uzorci pripadaju i sinusu od {alias}, pa rekonstrukcija pokazuje njega. Povećaj {fs} iznad 2 kHz.',
      captionDc: '{fs} = {v} < 2 · 1 kHz: aliasing. Uzorak pada u istu točku svake periode, pa je alias istosmjerni signal (0 kHz): ravna crta. Povećaj {fs} iznad 2 kHz.',
      // attribution (CC BY 4.0)
      credit: 'Prema apletu s <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/deed.hr">CC BY 4.0</a>; preveden i prilagođen za simdeck.',
      explain:
        '<p>Pri <em lang="en">sampling</em> (uzorkovanju) signal se mjeri samo u trenucima razmaknutima 1/fs. Što se događa između dva uzorka, ostaje nezabilježeno.</p>' +
        '<p><b>Teorem uzorkovanja</b> (Nyquist-Shannonov teorem): signal s najvišom frekvencijom f<sub>max</sub> može se iz uzoraka besprijekorno rekonstruirati samo ako je brzina uzorkovanja <b>veća</b> od dvostruke: fs &gt; 2 · f<sub>max</sub> (Nyquistov uvjet). Ovdje je f = 1 kHz, pa je granica 2 kHz.</p>' +
        '<p><em lang="en">Reconstruction</em> (rekonstrukcija) zbraja funkcije sinc, po jednu oko svakog uzorka (Whittaker-Shannonova interpolacija).</p>' +
        '<p>Ispod granice nastaje <em lang="en">aliasing</em> (preklapanje spektra): isti uzorci pripadaju i sporijem sinusu frekvencije |f − k · fs|, za najbliži cijeli k, i rekonstrukcija pokazuje taj alias. Točno na granici (fs = 2 kHz) uzorci ovdje padaju na prolaske kroz nulu i rekonstrukcija je ravna crta. Zato se u praksi uzorkuje nešto iznad granice: CD sa 44,1 kHz prenosi frekvencije do oko 22 kHz.</p>'
    },
    en: {
      stage: 'Sampling a 1 kHz sine: original, sampled and reconstructed signal',
      fs: 'Sampling rate fs',
      fsHint: 'The limit is 2 kHz, twice the signal frequency.',
      khz: '{v} kHz',
      presetOversampled: 'Many samples (8 kHz)',
      presetOversampledHint: 'Eight samples per period: a smooth reconstruction',
      presetAbove: 'Above the limit (3 kHz)',
      presetAboveHint: 'Three samples per period are enough',
      presetJustAbove: 'Just above the limit (2.2 kHz)',
      presetJustAboveHint: 'A little more than two samples per period: still enough',
      presetBoundary: 'Exactly at the limit (2 kHz)',
      presetBoundaryHint: 'The samples land on the zero crossings',
      presetAlias: 'Aliasing (1.5 kHz)',
      presetAliasHint: 'Too few samples: a 0.5 kHz sine appears',
      presetSlowAlias: 'Aliasing (1.2 kHz)',
      presetSlowAliasHint: 'An even slower alias: 0.2 kHz',
      presetEqual: 'Equal to the signal (1 kHz)',
      presetEqualHint: 'One sample per period, always at the same point',
      legendSignal: 'original signal (1 kHz)',
      legendSamples: 'samples',
      legendRecon: 'reconstructed signal',
      panelOriginal: 'Original signal: a 1 kHz sine',
      panelSampled: 'Sampled signal',
      panelRecon: 'Reconstructed signal',
      panelReconRef: 'dashed: the original signal',
      perPeriod: '{v} samples per period',
      ms: '{v} ms',
      axisTime: 'time',
      verdictOk: '✓ Nyquist condition met',
      verdictBoundary: '= exactly at the limit',
      verdictAlias: '⚠ aliasing: {f}',
      captionOk: '{fs} = {v} > 2 · 1 kHz = 2 kHz: the Nyquist condition is met. The reconstructed signal matches the original.',
      captionBoundary: '{fs} = {v} = 2 · 1 kHz: exactly at the limit, and that is not enough. Every sample lands on a zero crossing, so the reconstruction is a flat line. The theorem asks for {fs} > 2 kHz.',
      captionAlias: '{fs} = {v} < 2 · 1 kHz: aliasing. The same samples also fit a sine of {alias}, so the reconstruction shows that one. Raise {fs} above 2 kHz.',
      captionDc: '{fs} = {v} < 2 · 1 kHz: aliasing. Each sample lands on the same point of every period, so the alias is a constant (0 kHz): a flat line. Raise {fs} above 2 kHz.',
      credit: 'After an applet from <a href="https://50ohm.de">50ohm.de</a>, © 50ohm.de-Autorenteam, AJW-Referat des DARC e.V., <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; translated and adapted for simdeck.',
      explain:
        '<p><em lang="en">Sampling</em> measures a signal only at instants 1/fs apart. Whatever happens between two samples is not recorded.</p>' +
        '<p><b>The sampling theorem</b> (Nyquist–Shannon): a signal whose highest frequency is f<sub>max</sub> can be rebuilt from its samples without loss only if the sampling rate is <b>greater</b> than twice that: fs &gt; 2 · f<sub>max</sub> (the Nyquist condition). Here f = 1 kHz, so the limit is 2 kHz.</p>' +
        '<p><em lang="en">Reconstruction</em> adds up one sinc function centred on each sample (Whittaker–Shannon interpolation).</p>' +
        '<p>Below the limit comes <em lang="en">aliasing</em>: the same samples also fit a slower sine of frequency |f − k · fs|, for the nearest whole k, and the reconstruction shows that alias. Exactly at the limit (fs = 2 kHz) the samples here land on the zero crossings and the reconstruction is a flat line. In practice one samples somewhat above the limit: a CD at 44.1 kHz carries frequencies up to about 22 kHz.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
