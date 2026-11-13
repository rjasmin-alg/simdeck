/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of set-phase-balance, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The title and subtitle come from sim.json (title, concept). Croatian: the voltage symbol is U (P = U · I); crews'
   loanwords (gaffer) as the owner listed them; the terms marked (check) in NOTES.md "For the owner". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tri faze agregata, njihove struje i nulvodič',
      hand: 'Što uključuješ (klik na utičnicu)',
      handHint: 'Klik na praznu utičnicu uključuje, na punu isključuje.',
      slotParam: 'Utičnica {id}',
      empty: 'prazno',
      unplugAll: 'Isključi sve',

      preset_plan: 'Gafferov plan',
      hint_plan: '26 / 26 / 25 A, nulvodič 0,9 A',
      preset_lopsided: 'Isti reflektori, krivo raspoređeni',
      hint_lopsided: '30 / 17 / 30 A, nulvodič 12,6 A',
      preset_pile: 'Četiri reflektora na L1',
      hint_pile: '34,8 A > 32 A, L2 i L3 prazne',
      preset_kettle: 'Kuhalo u slobodnoj utičnici na L3',
      hint_kettle: 'L3 izbaci, kamera bez struje',

      dev_l650: 'Reflektor 650 W',
      dev_l1000: 'Reflektor 1 kW',
      dev_l2000: 'Reflektor 2 kW',
      dev_kettle: 'Kuhalo za vodu',
      dev_camera: 'Kamera i monitori',
      hand_l650: '650 W',
      hand_l1000: '1 kW',
      hand_l2000: '2 kW',
      hand_kettle: 'Kuhalo',
      plan_l650: '650 W',
      plan_l1000: '1 kW',
      plan_l2000: '2 kW',
      plan_: 'slobodno',
      planIs: 'plan: {dev}',

      dept_electric: 'rasvjeta',
      dept_camera: 'kamera',
      dept_makeup: 'maska',

      phase: 'Faza {id}',
      breaker: 'Osigurač {a} A',
      ofRating: '{a} A od {r} A',
      wattsOf: '{w} W od {lim} W',
      tripped: 'IZBACIO',
      offPlan: 'nije po planu',
      fixed: 'stalno spojeno',
      plugLabel: 'Utičnica {id}: {dev}, {w} W, {a} A',
      plugEmptyLabel: 'Utičnica {id}: prazno, klik uključuje {dev}',

      neutralTitle: 'Nulvodič (N)',
      neutralNote: 'Debeo kao faza; osigurači faza ne mjere njegovu struju.',
      diagramKey: 'Strelice: struje faza, razmaknute za trećinu kruga; isprekidana: njihov zbroj, struja nulvodiča.',

      box: 'Agregat i razdjelnik',
      boxNote: 'Planiraju i spajaju ovlašteni električari. Ostali uključuju samo gdje im se kaže.',
      boxOn: 'uključen',
      boxOff: 'izbacio',
      supply: 'Agregat daje {kw} kW od {lim} kW',
      formula: 'I = P / U, U = 230 V; između faza 400 V',
      foot: 'Pojednostavljeno; brojevi su ilustrativni. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.',

      legLamp: 'reflektor (rasvjeta)',
      legMakeup: 'uređaj maske',
      legCamera: 'oprema kamere',
      legOffPlan: 'nije po planu',
      legTripped: 'izbacio, bez struje',
      legNeutral: 'nulvodič',
      legChanged: 'promijenjeno',

      capStart: 'Odaberi uređaj u postavkama i klikni na praznu utičnicu, ili učitaj gafferov plan (1). Svaki uređaj vuče I = P / U sa svoje faze.',
      capDev: '{dev}: {w} W / 230 V = {a} A.',
      capPhase: 'Faza {ph}: {sum} A od {r} A.',
      capUnplug: 'Isključeno: {dev}.',
      capUnplugAll: 'Sve je isključeno.',
      capReset: 'Manje opterećenje: električari vraćaju osigurač faze {ph}.',
      capTrip: 'Faza {ph} je izbacila: {sum} A > {r} A. Bez struje: {depts}.',
      capCamera: 'Kamera je ostala bez struje, usred kadra.',
      capSupply: 'Agregat i dalje daje {kw} od {lim} kW: granica vrijedi za svaku fazu, ne za cijeli agregat.',
      capNeutral: 'Nulvodič nosi ono što se ne poništi: {n} A (faze {a1} / {a2} / {a3} A).',
      capOffPlanN: ['{n} uređaj nije ondje gdje ga plan stavlja.', '{n} uređaja nisu ondje gdje ih plan stavlja.', '{n} uređaja nije ondje gdje ih plan stavlja.'],
      capAsPlanned: 'Sve je po planu.',
      capSpare: 'Najmanja rezerva: faza {ph}, {spare} W.',
      and: 'i',

      explain: '<p><b>Tri faze.</b> Agregat (ili veliki priključak zgrade) daje tri faze, L1, L2 i L3, i zajednički ' +
        'nulvodič (neutralni vodič). Svaki reflektor spojen je između jedne faze i nulvodiča, na 230 V, pa vuče I = P / U; ' +
        'između dviju faza je 400 V. Svaka faza ima svoj osigurač, ovdje 32 A, oko 7,4 kW. Agregat od 22 kW daje toliko ' +
        'samo kad je opterećenje raspoređeno: četiri reflektora od 2 kW na jednoj fazi izbace je kod 8 kW, a druge dvije ' +
        'stoje gotovo prazne. Kod malog preopterećenja osigurač ne izbaci odmah: može izdržati dugo, desetke minuta i više, pa izbaci usred kadra; stranica pokazuje krajnje stanje.</p>' +
        '<p><b>Nulvodič.</b> Struje triju faza kasne jedna za drugom za trećinu periode. U zajedničkom nulvodiču se ' +
        'zbrajaju, a kad su jednake, poništavaju se: po planu nulvodičem teče manje od 1 A. Kad nisu jednake, nulvodičem se ' +
        'vraća ono što se ne poništi: isti reflektori krivo raspoređeni daju 12,6 A. Kad jedna faza izbaci, preostale dvije ' +
        'poništavaju se samo djelomično i struja nulvodiča naglo naraste. Osigurači faza ne mjere struju nulvodiča. S reflektorima sa ' +
        'žarnom niti nulvodič nikad ne nosi više od najopterećenije faze; LED i izbojni reflektori vuku struju u impulsima, ' +
        'čiji se dijelovi u nulvodiču zbrajaju i kad su faze jednake, pa nulvodič može nositi više od ijedne faze i ' +
        'pregrijati se, a da ništa ne izbaci. Zato električari računaju i nulvodič.</p>' +
        '<p><b>Plan prije reflektora.</b> Raspodjelu planiraju električari s <i lang="en">gafferom</i> (šefom rasvjete) ' +
        'prije nego što se reflektori postave, a plan ostavlja slobodne utičnice s razlogom. Ostali uključuju samo gdje im ' +
        'se kaže: kuhalo u „slobodnoj” utičnici na L3 izbaci fazu na kojoj je kamera. Spajanje agregata i razdjelnika nije ' +
        'na ovoj stranici; ona pokazuje opterećenje, nikad spajanje.</p>' +
        '<p><b>Pojednostavljeno.</b> Brojevi su ilustrativni (snage, osigurači od 32 A, agregat od 22 kW), a uređaji su ' +
        'čisto djelatno opterećenje. Konačnu riječ imaju sigurnosni brifing produkcije i šef odjela.</p>'
    },
    en: {
      stage: 'A generator\'s three phases, their currents and the neutral',
      hand: 'What you plug in (click a socket)',
      handHint: 'Click an empty socket to plug in, a full one to unplug.',
      slotParam: 'Socket {id}',
      empty: 'empty',
      unplugAll: 'Unplug all',

      preset_plan: 'The gaffer\'s plan',
      hint_plan: '26 / 26 / 25 A, neutral 0.9 A',
      preset_lopsided: 'The same lamps, badly spread',
      hint_lopsided: '30 / 17 / 30 A, neutral 12.6 A',
      preset_pile: 'Four lamps on L1',
      hint_pile: '34.8 A > 32 A, L2 and L3 idle',
      preset_kettle: 'A kettle in the free socket on L3',
      hint_kettle: 'L3 trips, the camera goes dark',

      dev_l650: '650 W lamp',
      dev_l1000: '1 kW lamp',
      dev_l2000: '2 kW lamp',
      dev_kettle: 'Kettle',
      dev_camera: 'Camera and monitors',
      hand_l650: '650 W',
      hand_l1000: '1 kW',
      hand_l2000: '2 kW',
      hand_kettle: 'Kettle',
      plan_l650: '650 W',
      plan_l1000: '1 kW',
      plan_l2000: '2 kW',
      plan_: 'free',
      planIs: 'plan: {dev}',

      dept_electric: 'electric',
      dept_camera: 'camera',
      dept_makeup: 'make-up',

      phase: 'Phase {id}',
      breaker: 'Breaker {a} A',
      ofRating: '{a} A of {r} A',
      wattsOf: '{w} W of {lim} W',
      tripped: 'TRIPPED',
      offPlan: 'not in the plan',
      fixed: 'wired in',
      plugLabel: 'Socket {id}: {dev}, {w} W, {a} A',
      plugEmptyLabel: 'Socket {id}: empty, click to plug in {dev}',

      neutralTitle: 'Neutral (N)',
      neutralNote: 'As thick as a phase; the phases\' breakers do not measure its current.',
      diagramKey: 'Arrows: the phase currents, a third of a turn apart; dashed: their sum, the neutral current.',

      box: 'Generator and distribution box',
      boxNote: 'Planned and connected by licensed electricians. Everyone else plugs in only where they are told.',
      boxOn: 'on',
      boxOff: 'tripped',
      supply: 'The generator gives {kw} kW of {lim} kW',
      formula: 'I = P / V, V = 230 V; 400 V between phases',
      foot: 'Simplified; the numbers are illustrative. The production\'s safety briefing and the head of department have the final word.',

      legLamp: 'lamp (electric)',
      legMakeup: 'make-up\'s device',
      legCamera: 'camera equipment',
      legOffPlan: 'not in the plan',
      legTripped: 'tripped, no power',
      legNeutral: 'neutral',
      legChanged: 'changed',

      capStart: 'Pick a device in the settings and click an empty socket, or load the gaffer\'s plan (1). Each device draws I = P / V from its phase.',
      capDev: '{dev}: {w} W / 230 V = {a} A.',
      capPhase: 'Phase {ph}: {sum} A of {r} A.',
      capUnplug: 'Unplugged: {dev}.',
      capUnplugAll: 'Everything is unplugged.',
      capReset: 'Less load: the electricians reset phase {ph}\'s breaker.',
      capTrip: 'Phase {ph} tripped: {sum} A > {r} A. No power: {depts}.',
      capCamera: 'The camera lost power, mid-take.',
      capSupply: 'The generator still gives {kw} of {lim} kW: the limit is per phase, not for the whole generator.',
      capNeutral: 'The neutral carries what does not cancel: {n} A (phases {a1} / {a2} / {a3} A).',
      capOffPlanN: ['{n} device is not where the plan puts it.', '{n} devices are not where the plan puts them.'],
      capAsPlanned: 'Everything is as planned.',
      capSpare: 'Least to spare: phase {ph}, {spare} W.',
      and: 'and',

      explain: '<p><b>Three phases.</b> A generator (or a building\'s large supply) gives three phases, L1, L2 and L3, and ' +
        'a shared neutral conductor. Each lamp is connected between one phase and the neutral, at 230 V, so it draws ' +
        'I = P / V; between two phases there are 400 V. Each phase has its own breaker, here 32 A, about 7.4 kW. A 22 kW ' +
        'generator gives that much only when the load is spread: four 2 kW lamps on one phase trip it at 8 kW while the ' +
        'other two stand nearly idle. On a small overload the breaker does not trip at once: it can hold for a long time, tens of minutes or more, and then trip mid-take; the page shows the end state.</p>' +
        '<p><b>The neutral.</b> The three phases\' currents lag one another by a third of a period. In the shared neutral ' +
        'they add up, and when they are equal they cancel: as planned, less than 1 A flows in the neutral. When they are ' +
        'not equal, what does not cancel comes back through the neutral: the same lamps badly spread give 12.6 A. When one ' +
        'phase trips, the other two cancel each other only in part, and the neutral current jumps. The phases\' ' +
        'breakers do not measure the neutral\'s current. With tungsten lamps the neutral never carries more than the ' +
        'busiest phase; LED and discharge lamps draw current in pulses whose parts add up in the neutral even when the ' +
        'phases are equal, so the neutral can carry more than any phase and overheat with nothing tripping. That is why ' +
        'the electricians work out the neutral too.</p>' +
        '<p><b>The plan before the lamps.</b> The electricians plan the distribution with the gaffer (the head of ' +
        'electric) before the lamps are placed, and the plan leaves sockets free for a reason. Everyone else plugs in only ' +
        'where they are told: a kettle in the "free" socket on L3 trips the phase the camera is on. Connecting the ' +
        'generator and the box is not on this page; it shows the load, never the connection.</p>' +
        '<p><b>Simplified.</b> The numbers are illustrative (the powers, the 32 A breakers, the 22 kW generator), and the ' +
        'devices are purely resistive. The production\'s safety briefing and the head of department have the final word.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
