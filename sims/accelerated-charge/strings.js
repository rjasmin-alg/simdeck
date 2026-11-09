/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of accelerated-charge, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder. The title and subtitle come from sim.json (title, concept).
   Croatian terms: 50ohm-contents-hr where it has them (silnice električnog polja, blisko polje, daleko polje, brzina
   svjetlosti, elektromagnetski val); the rest are marked (check) in NOTES.md. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Silnice električnog polja naboja na žici, dvije sonde i njihova polja kroz vrijeme',
      credit: 'Ideja: objašnjenje zračenja lomom silnica, s predavanja iz Antena na FER-u',

      motion: 'Gibanje naboja',
      m_start: 'Polazak',
      m_stop: 'Kočenje',
      m_move: 'Pomak',
      m_osc: 'Titranje',
      c: 'Brzina svjetlosti c',
      c_finite: 'konačna',
      c_inf: 'beskonačna',
      beta: 'Najveća brzina naboja',
      betaVal: '{v} c',
      tau: 'Trajanje guranja τ',
      tauOff: 'Titranje nema guranja.',
      t: 'Vrijeme t',
      tNow: 't = {v} ns',
      ns: '{v} ns',
      play: 'Pokreni',
      pause: 'Zaustavi',
      playHint: 'Vrijeme teče od 0 do 45 ns',
      playKey: 'vrijeme teče / staje',
      keyFwd: 'vrijeme +0,5 ns',
      keyBack: 'vrijeme −0,5 ns',

      preset_start: 'Naboj krene',
      preset_startHint: 'Ljuska loma između P1 i P2',
      preset_stop: 'Naboj stane',
      preset_stopHint: 'Izvana silnice idu od mjesta gdje bi naboj bio',
      preset_move: 'Krene pa stane',
      preset_moveHint: 'Dva loma suprotnog smjera',
      preset_osc: 'Naboj titra',
      preset_oscHint: 'Valovite silnice: zračenje',
      preset_oscInf: 'Titra, c beskonačna',
      preset_oscInfHint: 'Silnice se kruto njišu: samo blisko polje',
      preset_startInf: 'Krene, c beskonačna',
      preset_startInfHint: 'Nema loma ni kašnjenja',

      legendLine: 'silnica E',
      legendCharge: 'naboj +q',
      legendShell: 'ljuska loma',
      legendP1: 'P1, 4 m',
      legendP2: 'P2, 8 m',

      cInf: 'c = ∞',
      front: 'vijest: {r}',
      scale: '2 m',
      eArrow: 'E',
      plotEt: 'Poprečno polje E_θ',
      plotEr: 'Radijalno polje E_r',
      plotT: 't (ns)',
      colP1: 'P1 · 4 m',
      colP2: 'P2 · 8 m',
      colRatio: 'P2/P1',
      rowEr: 'E_r radijalno',
      rowEt: 'E_θ poprečno',
      rowCB: 'c·B',
      rowPeak: 'najveći |E_θ|',
      rowPeakOsc: 'amplituda E_θ',
      units: 'Polja u E₁ = polje naboja na 1 m. 1/r daje 0,50, 1/r² 0,25, 1/r³ 0,125.',
      dash: '—',
      m: '{v} m',

      w_start: 'pokretanju',
      w_stop: 'zaustavljanju',
      cap_before_start: 't = {t}. Naboj miruje; za {dt} bit će gurnut uz žicu. Sve silnice idu ravno od njega.',
      cap_before_stop: 't = {t}. Naboj jednoliko klizi uz žicu brzinom {v}; za {dt} počet će kočiti. Silnice idu ravno od mjesta gdje je sada: jednoliko gibanje ne lomi silnice.',
      cap_before_move: 't = {t}. Naboj miruje; za {dt} bit će gurnut, klizit će 12 ns i stati {d} dalje. Sve silnice idu ravno od njega.',
      cap_travel: 't = {t}. Vijest o {what} putuje brzinom c i stigla je do {r}. Unutar tog kruga silnice idu od mjesta gdje je naboj sada, izvan njega od mjesta gdje bi bio da se ništa nije dogodilo; u ljusci između lome se.',
      cap_push: 't = {t}. Guranje još traje: vijest o {what} stigla je do {r} i cijeli taj krug je ljuska loma. Izvan nje silnice još idu od mjesta gdje bi naboj bio da se ništa nije dogodilo.',
      cap_move: 't = {t}. Naboj je gurnut pa zaustavljen. Van putuju dvije vijesti: o pokretanju do {r1} i o zaustavljanju do {r2}. Između njih silnice idu od naboja u gibanju; svaka ljuska je jedan lom, suprotnog smjera.',
      p_wait: 'Do P1 stiže u {a1}, do P2 u {a2}.',
      p_mid: 'Lom je prošao P1; do P2 stiže u {a2}.',
      p_mid_move: 'Prvi lom je prošao P1; do P2 stiže u {a2}.',
      p_in1: 'Lom je upravo na P1: poprečno polje {et}, radijalno {er}.',
      p_in2: 'Lom je upravo na P2: poprečno polje {et}, radijalno {er}.',
      p_done: 'Obje sonde su vidjele lom: vrh poprečnog polja na P2 je {ratio} onoga na P1. Sam 1/r daje 0,50; bliže naboju dodaje se dio koji pada kao 1/r².',
      cap_osc: 't = {t}. Naboj titra ±{A} s periodom 20 ns. Svaki zamah šalje novi lom brzinom c, pa silnice nose valove razmaknute za valnu duljinu, {lambda}. Na P2 je amplituda poprečnog polja {ratio} one na P1 (1/r), a radijalno polje {ratioR} (1/r²): daleko ostaje samo poprečni dio, zračenje.',
      cap_inf_push: 't = {t}. S beskonačnom c svaka silnica ide ravno od mjesta gdje je naboj sada: slika kruto prati naboj, bez loma i bez kašnjenja. Obje sonde mijenjaju se u istom trenutku; c·B je nula prema E i ništa ne putuje van.',
      cap_inf_osc: 't = {t}. S beskonačnom c silnice se samo kruto njišu s nabojem. Poprečno polje na P2 je {ratio} onoga na P1 (1/r³): to je samo blisko polje. Nijedan dio ne pada kao 1/r, c·B je zanemariv prema E, a energija koja ode vrati se svake periode.',

      explain: '<p>Naboj u mirovanju ima ravne, radijalne silnice. Ali polje u točki udaljenoj r ne zna gdje je naboj <em>sada</em>: ' +
        'vijest o njemu putuje brzinom svjetlosti c, pa polje pokazuje gdje je naboj bio u trenutku t − r/c ' +
        '(kašnjenje, <em lang="en">retardation</em>).</p>' +
        '<p>Gurne li se naboj, vijest o tome širi se kao ljuska debljine c·τ. Unutar nje silnice idu od novog položaja, ' +
        'izvan nje od starog, a u ljusci se lome i idu gotovo poprijeko. To je J. J. Thomsonova slika: u ljusci je ' +
        '<i>E</i><sub>θ</sub> / <i>E</i><sub>r</sub> = a·r·sin θ / c², pa poprečni dio pada kao 1/r, a radijalni kao 1/r². Daleko ostaje samo poprečni dio, ' +
        'okomit na smjer prema naboju i suprotan ubrzanju: to je zračenje. Najjače je okomito na žicu, a uzduž žice ' +
        '(sin θ = 0) nema ga.</p>' +
        '<p>Jednoliko gibanje ne lomi silnice; lom radi samo ubrzanje. Naboj koji titra ubrzava stalno, pa svaki zamah ' +
        'šalje novi lom: silnice nose val valne duljine λ = c·T.</p>' +
        '<p>Gdje se silnica lomi, polje E se vrti (rot E ≠ 0), a Maxwellova jednadžba rot E = −∂B/∂t kaže da se tamo ' +
        'mijenja magnetsko polje. Zato u lomu ima i B, okomit na E, s c·B = <i>E</i><sub>θ</sub>: električno i magnetsko polje putuju ' +
        'zajedno kao elektromagnetski val.</p>' +
        '<p>Da je c beskonačna, silnice bi uvijek išle ravno od mjesta gdje je naboj sada i kruto se njihale s njim. ' +
        'Tada nema loma i ništa ne odlazi: polje titrajućeg naboja pada kao 1/r³, magnetsko polje je samo ono struje ' +
        '(Biot–Savart), c·B je zanemariv prema E, a energija koja ode vrati se svake periode. To je slika bliskog polja oko antene; daleko polje postoji samo zato što je c konačna.</p>' +
        '<p>Brzine su ovdje pretjerane (do 0,4 c) da se lom jednog naboja vidi; u žici antene vrlo mnogo sporih naboja daje ' +
        'istu sliku. Razmak silnica u ravnini ne pokazuje jakost polja. Izvori: Purcell i Morin, <em>Electricity and ' +
        'Magnetism</em>, pogl. 5 i dodatak H; Griffiths, <em>Introduction to Electrodynamics</em>, pogl. 10 i 11.</p>'
    },
    en: {
      stage: 'Electric field lines of a charge on a wire, two probes and their fields over time',
      credit: 'Idea: explaining radiation by kinking field lines, from the antenna lectures at FER',

      motion: 'Motion of the charge',
      m_start: 'Kick',
      m_stop: 'Stop',
      m_move: 'Move',
      m_osc: 'Oscillate',
      c: 'Speed of light c',
      c_finite: 'finite',
      c_inf: 'infinite',
      beta: 'Top speed of the charge',
      betaVal: '{v} c',
      tau: 'Length of the push τ',
      tauOff: 'The oscillation has no push.',
      t: 'Time t',
      tNow: 't = {v} ns',
      ns: '{v} ns',
      play: 'Play',
      pause: 'Pause',
      playHint: 'Time runs from 0 to 45 ns',
      playKey: 'time runs / stops',
      keyFwd: 'time +0.5 ns',
      keyBack: 'time −0.5 ns',

      preset_start: 'The charge starts',
      preset_startHint: 'The kink shell between P1 and P2',
      preset_stop: 'The charge stops',
      preset_stopHint: 'Outside, the lines point from where it would have been',
      preset_move: 'Starts, then stops',
      preset_moveHint: 'Two kinks of opposite sense',
      preset_osc: 'The charge oscillates',
      preset_oscHint: 'Rippled lines: radiation',
      preset_oscInf: 'Oscillates, c infinite',
      preset_oscInfHint: 'The lines swing rigidly: near field only',
      preset_startInf: 'Starts, c infinite',
      preset_startInfHint: 'No kink and no delay',

      legendLine: 'E field line',
      legendCharge: 'charge +q',
      legendShell: 'kink shell',
      legendP1: 'P1, 4 m',
      legendP2: 'P2, 8 m',

      cInf: 'c = ∞',
      front: 'news: {r}',
      scale: '2 m',
      eArrow: 'E',
      plotEt: 'Transverse field E_θ',
      plotEr: 'Radial field E_r',
      plotT: 't (ns)',
      colP1: 'P1 · 4 m',
      colP2: 'P2 · 8 m',
      colRatio: 'P2/P1',
      rowEr: 'E_r radial',
      rowEt: 'E_θ transverse',
      rowCB: 'c·B',
      rowPeak: 'largest |E_θ|',
      rowPeakOsc: 'E_θ amplitude',
      units: 'Fields in E₁ = the charge\'s field at 1 m. 1/r gives 0.50, 1/r² 0.25, 1/r³ 0.125.',
      dash: '—',
      m: '{v} m',

      w_start: 'the start',
      w_stop: 'the stop',
      cap_before_start: 't = {t}. The charge is at rest; in {dt} it will be pushed along the wire. Every line points straight from it.',
      cap_before_stop: 't = {t}. The charge glides along the wire at {v}; in {dt} it starts to brake. The lines point straight from where it is now: steady motion does not kink them.',
      cap_before_move: 't = {t}. The charge is at rest; in {dt} it will be pushed, glide for 12 ns and stop {d} further on. Every line points straight from it.',
      cap_travel: 't = {t}. The news of {what} travels at c and has reached {r}. Inside that circle the lines point from where the charge is now, outside from where it would be had nothing happened; in the shell between, they kink.',
      cap_push: 't = {t}. The push is still on: the news of {what} has reached {r}, and that whole disc is the kink shell. Outside it the lines still point from where the charge would be had nothing happened.',
      cap_move: 't = {t}. The charge was pushed, then stopped. Two pieces of news travel out: the start, at {r1}, and the stop, at {r2}. Between them the lines point from a moving charge; each shell is one kink, of opposite sense.',
      p_wait: 'It reaches P1 at {a1} and P2 at {a2}.',
      p_mid: 'The kink has passed P1; it reaches P2 at {a2}.',
      p_mid_move: 'The first kink has passed P1; it reaches P2 at {a2}.',
      p_in1: 'The kink is at P1 now: transverse field {et}, radial {er}.',
      p_in2: 'The kink is at P2 now: transverse field {et}, radial {er}.',
      p_done: 'Both probes have seen the kink: the transverse peak at P2 is {ratio} of that at P1. 1/r alone gives 0.50; closer to the charge a part that falls as 1/r² adds to it.',
      cap_osc: 't = {t}. The charge swings ±{A} with a period of 20 ns. Every swing sends a new kink out at c, so the lines carry waves one wavelength apart, {lambda}. At P2 the transverse amplitude is {ratio} of that at P1 (1/r), the radial field {ratioR} (1/r²): far away only the transverse part is left, the radiation.',
      cap_inf_push: 't = {t}. With c infinite every line points straight from where the charge is now: the picture follows the charge rigidly, with no kink and no delay. Both probes change at the same instant; c·B is nil beside E and nothing travels out.',
      cap_inf_osc: 't = {t}. With c infinite the lines only swing rigidly with the charge. The transverse field at P2 is {ratio} of that at P1 (1/r³): near field only. No part falls as 1/r, c·B is negligible beside E, and the energy that flows out comes back every period.',

      explain: '<p>A charge at rest has straight, radial field lines. But the field at a distance r does not know where the ' +
        'charge is <em>now</em>: the news travels at the speed of light c, so the field shows where the charge was at ' +
        't − r/c (retardation).</p>' +
        '<p>Push the charge and the news spreads as a shell c·τ thick. Inside it the lines point from the new position, ' +
        'outside from the old one, and in the shell they kink and run almost sideways. That is J. J. Thomson\'s picture: ' +
        'in the shell <i>E</i><sub>θ</sub> / <i>E</i><sub>r</sub> = a·r·sin θ / c², so the transverse part falls as 1/r and the radial part as 1/r². Far ' +
        'away only the transverse part is left, at right angles to the line of sight and opposite to the acceleration: ' +
        'that is radiation. It is strongest broadside to the wire and zero along it (sin θ = 0).</p>' +
        '<p>Steady motion does not kink the lines; only acceleration does. An oscillating charge accelerates all the ' +
        'time, so every swing sends a new kink: the lines carry a wave of wavelength λ = c·T.</p>' +
        '<p>Where a line kinks, E curls (curl E ≠ 0), and Maxwell\'s equation curl E = −∂B/∂t says that a magnetic field ' +
        'is changing there. So the kink carries B too, at right angles to E, with c·B = <i>E</i><sub>θ</sub>: the electric and magnetic ' +
        'fields travel together as an electromagnetic wave.</p>' +
        '<p>If c were infinite, the lines would always point straight from where the charge is now and swing rigidly ' +
        'with it. There would be no kink and nothing would leave: the oscillating charge\'s field falls as 1/r³, its ' +
        'magnetic field is only that of a current (Biot–Savart), c·B is negligible beside E, and the energy that ' +
        'flows out comes back every period. That is the near field around an antenna; the far field exists only ' +
        'because c is finite.</p>' +
        '<p>The speeds here are exaggerated (up to 0.4 c) so that one charge\'s kink shows; in an antenna wire a great ' +
        'many slow charges give the same picture. The spacing of lines in the plane does not show the field\'s ' +
        'strength. Sources: Purcell and Morin, <em>Electricity and Magnetism</em>, ch. 5 and appendix H; Griffiths, ' +
        '<em>Introduction to Electrodynamics</em>, ch. 10 and 11.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
