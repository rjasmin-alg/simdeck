/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of poe-budget, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other). The title and subtitle come from sim.json (title, concept).
   Numbers arrive already formatted for the language (15,4 / 15.4). The PoE terms are not in kit/glossary.js yet
   (NOTES.md, "Term pairs"): the explanation writes the pairs out by hand. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Preklopnik s napajanjem preko Etherneta',
      budget: 'Proračun snage',
      allocMode: 'Preklopnik rezervira',
      mode_class: 'najviše za klasu',
      mode_measured: 'izmjereno',
      phones: 'Telefoni (T)',
      aps: 'AP-ovi (A)',
      cams: 'Kamere (K)',
      ptz: 'PTZ (P)',
      portType: 'Tip priključka',
      type_at: 'at · 30 W',
      type_bt: 'bt · 90 W',
      priorities: 'Prioriteti',

      preset_office: 'Ured',
      hint_office: '24 telefona i 4 AP-a: 24 × 7 + 4 × 30 = 288 W od 370 W',
      preset_cameras: 'Šest kamera',
      hint_cameras: 'Šesta kamera više ne stane',
      preset_measured: 'Mjereno',
      hint_measured: 'Isti uređaji, rezervira se stvarna potrošnja',
      preset_priority: 'Prioriteti',
      hint_priority: 'Kamera isključuje telefone niskog prioriteta',
      preset_ptz: 'PTZ kamera',
      hint_ptz: 'Klasa 6 na priključku tipa at; prebaci na bt',

      kind_phone: 'IP-telefon',
      kind_ap: 'access point',
      kind_cam: 'kamera',
      kind_ptz: 'PTZ kamera',
      letter_phone: 'T',
      letter_ap: 'A',
      letter_cam: 'K',
      letter_ptz: 'P',
      legend_phone: 'IP-telefon (T)',
      legend_ap: 'access point (A)',
      legend_cam: 'kamera (K)',
      legend_ptz: 'PTZ kamera (P)',
      legendPowered: 'napajan',
      legendDenied: 'odbijen ✕',
      legendShed: 'isključen',
      legendLimited: 'ograničen ▲',
      legendChanged: 'promijenjen',

      prio_low: 'nizak',
      prio_high: 'visok',
      prio_critical: 'kritičan',
      prio_none: '—',
      state_powered: 'napajan',
      state_denied: 'odbijen',
      state_shed: 'isključen',
      state_limited: 'ograničen',

      switchHead: 'Preklopnik · 48 priključaka · tip {type}: najviše {cap} W po priključku',
      portLabel: 'Priključak {n}: {kind}, klasa {cls}, {state}, rezervirano {w} W',
      portEmpty: 'Priključak {n}: prazan',
      gaugeHead: 'Dodijeljeno {total} od {budget} W',
      gaugeLeft: 'slobodno {left} W',
      gaugeOver: 'traženo, a nije dodijeljeno: {w} W',
      gaugeBudget: 'proračun {budget} W',
      gaugeLabel: 'Dodijeljeno {total} od {budget} W, slobodno {left} W',

      tableHead: 'Priključci',
      thPorts: 'Priključci',
      thDevice: 'Uređaj',
      thClass: 'Klasa',
      thPrio: 'Prioritet',
      thAlloc: 'Rezervirano',
      thPd: 'Na uređaju',
      thState: 'Stanje',
      allocMany: '{count} × {w} W',
      allocOne: '{w} W',
      noDevices: 'Nema uređaja.',

      classHead: 'Klase (IEEE 802.3af / at / bt)',
      thStd: 'Norma',
      thPse: 'Priključak',
      thPdc: 'Uređaj',
      thLoss: 'Kabel',
      classCap: 'Iznad {cap} W priključak tipa {type} ograničava uređaj.',
      examples: 'Potrošnja uređaja (telefon {phone} W, AP {ap} W, kamera {cam} W, PTZ {ptz} W) i proračun od 370 W primjeri su, ne vrijednosti iz norme.',

      capEmpty: 'Na preklopniku nema uređaja. Dodaj ih klizačima desno.',
      capClass: 'Dodijeljeno {total} od {budget} W, slobodno {left} W.',
      capMeasured: 'Mjerena potrošnja: {devices} {demand} W umjesto {classDemand} W, jer svaki priključak rezervira ono što njegov uređaj troši, a ne najveću snagu klase.',
      devices: ['isti {n} uređaj rezervira', 'ista {n} uređaja rezerviraju', 'istih {n} uređaja rezervira'],
      capAllFine: 'Svi uređaji imaju napajanje, a troše tek oko {draw} W: preklopnik za svaki rezervira najveću snagu njegove klase.',
      capDeny: 'Priključak {n} ({kind}) traži {need} W (klasa {cls}), a u proračunu ima još samo {left} W — priključak ostaje bez napajanja.',
      capDenyMore: ['Bez napajanja ostaje još {n} uređaj.', 'Bez napajanja ostaju još {n} uređaja.', 'Bez napajanja ostaje još {n} uređaja.'],
      capShed: 'Priključak {n} ({kind}, kritičnog prioriteta) ne stane u ostatak proračuna ({left} W), pa preklopnik isključuje priključak niskog prioriteta {ports}: oslobođeno je {freed} W.',
      capShedMany: 'Priključak {n} ({kind}, kritičnog prioriteta) ne stane u ostatak proračuna ({left} W), pa preklopnik isključuje priključke niskog prioriteta {ports}, od najvišeg broja naniže: oslobođeno je {freed} W.',
      capLimited: 'Uređaj na priključku {n} ({kind}) je klase {cls} ({pse} W), a priključak tipa {type} daje najviše {cap} W: uređaj dobiva toliko i označen je kao ograničen, možda neće raditi punom snagom.',

      explain: '<p>Preklopnik s <i>Power over Ethernet</i> (napajanje preko Etherneta) napaja uređaje istim kabelom kojim ' +
        'prenosi podatke. Svaki priključak je <i>power sourcing equipment</i>, PSE (izvor napajanja), a uređaj je ' +
        '<i>powered device</i>, PD (napajani uređaj). Uređaj pri spajanju javi svoju klasu, a klasa kaže koliko ' +
        'snage priključak mora dati. Na uređaj stigne nešto manje: razlika je gubitak u do 100 m kabela.</p>' +
        '<p>Preklopnik ima ukupni <i>power budget</i> (proračun snage). Kad rezervira po klasi, za svaki uređaj odvoji ' +
        'najviše što ta klasa smije, bez obzira na to koliko uređaj stvarno troši: telefon klase 2 zauzme 7 W iako troši ' +
        'oko 3,5 W. Zato preklopnik od 370 W ne napaja 370 W uređaja. Kad rezervira izmjereno, odvoji samo ono što uređaj ' +
        'troši; stane više uređaja, ali ako neki kasnije zatraži više, proračun može postati pretijesan.</p>' +
        '<p>Uređaji dobivaju napajanje redom priključaka. Onaj koji više ne stane ostaje bez napajanja (podatkovna veza može ' +
        'raditi). S uključenim prioritetima uređaj višeg prioriteta isključuje priključke najnižeg prioriteta, ' +
        'od najvišeg broja priključka naniže, dok ne stane. Priključak daje najviše onoliko koliko njegov tip dopušta: uređaj ' +
        'više klase dobije toliko i možda neće raditi punom snagom.</p>'
    },
    en: {
      stage: 'Power over Ethernet switch',
      budget: 'Power budget',
      allocMode: 'The switch reserves',
      mode_class: 'class maximum',
      mode_measured: 'measured',
      phones: 'Phones (T)',
      aps: 'APs (A)',
      cams: 'Cameras (C)',
      ptz: 'PTZ (P)',
      portType: 'Port type',
      type_at: 'at · 30 W',
      type_bt: 'bt · 90 W',
      priorities: 'Priorities',

      preset_office: 'Office',
      hint_office: '24 phones and 4 APs: 24 × 7 + 4 × 30 = 288 W of 370 W',
      preset_cameras: 'Six cameras',
      hint_cameras: 'The sixth camera no longer fits',
      preset_measured: 'Measured',
      hint_measured: 'The same devices, reserving what they draw',
      preset_priority: 'Priorities',
      hint_priority: 'A camera sheds low-priority phones',
      preset_ptz: 'PTZ camera',
      hint_ptz: 'Class 6 on an at port; switch to bt',

      kind_phone: 'IP phone',
      kind_ap: 'access point',
      kind_cam: 'camera',
      kind_ptz: 'PTZ camera',
      letter_phone: 'T',
      letter_ap: 'A',
      letter_cam: 'C',
      letter_ptz: 'P',
      legend_phone: 'IP phone (T)',
      legend_ap: 'access point (A)',
      legend_cam: 'camera (C)',
      legend_ptz: 'PTZ camera (P)',
      legendPowered: 'powered',
      legendDenied: 'denied ✕',
      legendShed: 'shed',
      legendLimited: 'limited ▲',
      legendChanged: 'changed',

      prio_low: 'low',
      prio_high: 'high',
      prio_critical: 'critical',
      prio_none: '—',
      state_powered: 'powered',
      state_denied: 'denied',
      state_shed: 'shed',
      state_limited: 'limited',

      switchHead: 'Switch · 48 ports · type {type}: at most {cap} W per port',
      portLabel: 'Port {n}: {kind}, class {cls}, {state}, {w} W reserved',
      portEmpty: 'Port {n}: empty',
      gaugeHead: 'Allocated {total} of {budget} W',
      gaugeLeft: '{left} W left',
      gaugeOver: 'requested, not allocated: {w} W',
      gaugeBudget: 'budget {budget} W',
      gaugeLabel: 'Allocated {total} of {budget} W, {left} W left',

      tableHead: 'Ports',
      thPorts: 'Ports',
      thDevice: 'Device',
      thClass: 'Class',
      thPrio: 'Priority',
      thAlloc: 'Reserved',
      thPd: 'At device',
      thState: 'State',
      allocMany: '{count} × {w} W',
      allocOne: '{w} W',
      noDevices: 'No devices.',

      classHead: 'Classes (IEEE 802.3af / at / bt)',
      thStd: 'Standard',
      thPse: 'Port',
      thPdc: 'Device',
      thLoss: 'Cable',
      classCap: 'Above {cap} W, a port of type {type} limits the device.',
      examples: 'The device draws (phone {phone} W, AP {ap} W, camera {cam} W, PTZ {ptz} W) and the 370 W budget are examples, not values from the standard.',

      capEmpty: 'No devices on the switch yet. Add some with the sliders on the right.',
      capClass: 'Allocated {total} of {budget} W, {left} W left.',
      capMeasured: 'Measured mode: {devices} {demand} W instead of {classDemand} W, because each port reserves what its device draws, not its class maximum.',
      devices: ['the same {n} device reserves', 'the same {n} devices reserve'],
      capAllFine: 'Every device is powered, yet together they draw only about {draw} W: the switch reserves each one\'s class maximum.',
      capDeny: 'Port {n} ({kind}) needs {need} W (class {cls}) but only {left} W are left, so the port stays without power.',
      capDenyMore: ['{n} more device is denied too.', '{n} more devices are denied too.'],
      capShed: 'Port {n} ({kind}, critical priority) does not fit in the {left} W left, so the switch sheds low-priority port {ports}: {freed} W freed.',
      capShedMany: 'Port {n} ({kind}, critical priority) does not fit in the {left} W left, so the switch sheds low-priority ports {ports}, highest number first: {freed} W freed.',
      capLimited: 'The device on port {n} ({kind}) is class {cls} ({pse} W), but a port of type {type} gives at most {cap} W: the device gets that much and is marked limited; it may not work fully.',

      explain: '<p>A <i>Power over Ethernet</i> switch powers devices over the same cable that carries their data. Each ' +
        'port is the <i>power sourcing equipment</i> (PSE), the device the <i>powered device</i> (PD). On connecting, ' +
        'the device reports its class, and the class says how much power the port must supply. A little less reaches ' +
        'the device: the difference is the loss in up to 100 m of cable.</p>' +
        '<p>The switch has a total <i>power budget</i>. Reserving by class, it sets aside the most that class may take, ' +
        'whatever the device actually draws: a class 2 phone takes 7 W although it draws about 3.5 W. That is why a ' +
        '370 W switch does not power 370 W of devices. Reserving the measured draw, it sets aside only what each device ' +
        'uses; more devices fit, but if one later asks for more, the budget can run short.</p>' +
        '<p>Devices are powered in port order. One that no longer fits stays without power (its data link may still be ' +
        'up). With priorities on, a higher-priority device sheds the lowest-priority ports, highest port number first, ' +
        'until it fits. An older port type supplies at most its own maximum: a device of a higher class gets that much ' +
        'and may not work fully.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
