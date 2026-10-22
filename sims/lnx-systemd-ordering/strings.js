/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of the page, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks
   them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, an array is plural forms
   (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   `text` between backticks is drawn as code by the page (unit names and directives; not words to translate).
   The title and subtitle are not here: they come from sim.json (title, concept). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Graf jedinica i vremenska crta podizanja',

      // params
      appToDb: 'app → db: zahtjev',
      appAfterDb: 'app čeka db (After=)',
      appToNet: 'app → mreža: zahtjev',
      appAfterNet: 'app čeka mrežu (After=)',
      dbFails: 'db ne uspije',
      dbEnabled: 'db je uključen (enable)',
      optNone: 'ništa',
      optWants: 'Wants=',
      optRequires: 'Requires=',
      boot: 'Podigni sustav',
      bootHint: 'Odigraj vremensku crtu korak po korak.',

      // presets
      presetNet: 'Wants= + After= na mrežu',
      presetNetHint: 'Dva retka, ne jedan: app kreće korak nakon mreže.',
      presetReqNoAfter: 'Requires= bez After=',
      presetReqNoAfterHint: 'db ne uspije, a app svejedno radi.',
      presetReqAfter: 'Requires= + After=',
      presetReqAfterHint: 'db ne uspije, pa app nikad ne krene.',
      presetWantsAfter: 'Wants= + After=',
      presetWantsAfterHint: 'db ne uspije, app čeka pa ipak radi.',
      presetAfterOnly: 'Samo After=',
      presetAfterOnlyHint: 'After= ništa ne povlači.',

      // legend
      legendWants: 'Wants=: povlači, slabo',
      legendRequires: 'Requires=: povlači, jako',
      legendAfter: 'After=: čeka (redoslijed)',
      legendActive: 'aktivna',
      legendFailed: 'nije uspjela',
      legendDependency: 'ovisnost nije uspjela',
      legendNone: 'nije u transakciji',
      legendChanged: 'promijenjeno zadnjom izmjenom',

      // stage
      graphTitle: 'Jedinice i veze',
      timeTitle: 'Podizanje',
      unitFile: 'datoteka koju uređuješ',
      defaultTarget: 'zadani cilj',
      enabled: 'uključen',
      disabled: 'isključen',
      willFail: 'ne uspijeva',
      auto: 'automatski',
      lane: 'jedinica',
      slot: 'korak {n}',
      result: 'stanje',
      waiting: 'čeka…',
      stActive: 'aktivna',
      stFailed: 'nije uspjela',
      stDependency: 'ovisnost nije uspjela',
      stNone: 'nije u transakciji',
      cycleBanner: 'Ciklus u redoslijedu: raspored se ne računa.',
      unitLabel: '{unit}: {state}',

      // captions
      cOrdered: '`app` čeka `db` (`After=`): `db` kreće u koraku {db}, a `app` tek u koraku {app}, kad `db` završi.',
      cNoOrder: '`{rel}` bez `After=` ne određuje redoslijed: ništa ne tjera `app` da čeka `db` (`db`: korak {db}, `app`: korak {app}).',
      cIndependent: '`app` i `db` nisu povezani: svaki kreće kad je spreman (`db`: korak {db}, `app`: korak {app}).',
      cDbOut: 'Ništa ne povlači `db`: nije u transakciji i ne pokreće se.',
      cAfterOnly: '`After=` ništa ne povlači: `db` nije u transakciji, a `app` kreće bez njega.',
      cDepFailed: '`Requires=` i `After=`: `app` čeka `db`, `db` ne uspije u koraku {db}, pa se `app` uopće ne pokreće (ovisnost nije uspjela).',
      cReqNoAfter: '`Requires=` bez `After=`: obje jedinice kreću istodobno, pa `app` radi iako `db` nije uspio.',
      cReqNoAfterApart: '`Requires=` bez `After=`: `app` ne čeka `db`, pa radi iako `db` nije uspio.',
      cWantsAfterFailed: '`Wants=` i `After=`: `app` čeka da `db` završi (neuspjehom, u koraku {db}), pa kreće u koraku {app} i radi: slaba ovisnost ga ne zaustavlja.',
      cWantsFailed: '`Wants=`: `db` nije uspio, a `app` svejedno radi; bez `After=` ga nije ni čekao.',
      cAfterFailed: '`db` je uključen, pa ga povlači cilj; `app` ga samo čeka (`After=`) i kreće u koraku {app}, iako `db` nije uspio.',
      cUnrelatedFailed: '`db` nije uspio, ali `app` ga ne treba i ne čeka: radi.',
      cNetOrdered: 'Dva retka, ne jedan: `Wants=` povlači `network-online.target`, a `After=` tjera `app` da ga čeka (mreža: korak {net}, `app`: korak {app}).',
      cNetNoOrder: '`Wants=` bez `After=`: mreža je u transakciji, ali `app` je ne čeka (mreža: korak {net}, `app`: korak {app}).',
      cNetAfterOnly: '`After=` bez `Wants=`: ništa ne povlači `network-online.target`, pa `app` kreće bez mreže, u koraku {app}.',
      cNetNone: '`app` ne povlači mrežu i ne čeka je: `network-online.target` nije u transakciji.',
      cCycle: 'Ciklus u redoslijedu ({units}): nijedna jedinica ne može krenuti prva. Pravi systemd tada izbacuje jedan posao iz transakcije; ovdje se raspored ne računa.',
      cReplay: ['Korak {k} od {total}: kreće {units}.', 'Korak {k} od {total}: kreću {units}.', 'Korak {k} od {total}: kreću {units}.'],

      explain: '<p>Pri podizanju systemd pokreće zadani [[target]] (ovdje <code>multi-user.target</code>) i u ' +
        '[[transaction]] skuplja sve do čega se od njega dolazi zahtjevima: <code>Wants=</code> i <code>Requires=</code> ' +
        'u datotekama jedinica, te poveznicama u <code>multi-user.target.wants/</code> koje naredba ' +
        '<code>systemctl enable</code> stvara iz <code>WantedBy=</code> u odjeljku <code>[Install]</code>.</p>' +
        '<p><b>Zahtjev i redoslijed dvije su odvojene stvari.</b> <code>Wants=</code> povlači drugu [[unit]], ali ako ona ' +
        'ne uspije, jedinica koja ju je navela svejedno se pokreće. <code>Requires=</code> je jača [[dependency]]: ako ' +
        'druga jedinica ne uspije <i>i</i> postavljen je <code>After=</code> na nju, ova se ne pokreće (ovisnost nije ' +
        'uspjela). Bez <code>After=</code> nijedna ne čeka drugu. Redoslijed daju samo <code>After=</code> i ' +
        '<code>Before=</code>, a oni ništa ne povlače: ako druga jedinica nije u transakciji, redoslijed se ne gleda.</p>' +
        '<p>Jedinica koja čeka kreće tek kad druga završi s pokretanjem, uspješno ili neuspješno. Jedinice bez ' +
        'redoslijeda među sobom ne čekaju jedna drugu: svaka kreće u koraku nakon zadnje jedinice koju čeka. Svaki [[=target]] ' +
        'sam dodaje <code>After=</code> na jedinice koje povlači, pa je dosegnut tek kad one završe. Zaustavljanje ide obrnutim redoslijedom.</p>' +
        '<p>Česte zablude: da <code>Requires=</code> znači i „kreni poslije“; da <code>After=</code> pokreće drugu ' +
        'jedinicu; da neuspjeh jedinice iz <code>Wants=</code> zaustavlja onu koja ju je tražila.</p>'
    },
    en: {
      stage: 'Unit graph and boot timeline',

      appToDb: 'app → db: requirement',
      appAfterDb: 'app waits for db (After=)',
      appToNet: 'app → network: requirement',
      appAfterNet: 'app waits for the network (After=)',
      dbFails: 'db fails',
      dbEnabled: 'db is enabled',
      optNone: 'none',
      optWants: 'Wants=',
      optRequires: 'Requires=',
      boot: 'Boot',
      bootHint: 'Play the timeline slot by slot.',

      presetNet: 'Wants= + After= on the network',
      presetNetHint: 'Two lines, not one: app starts one slot after the network.',
      presetReqNoAfter: 'Requires= without After=',
      presetReqNoAfterHint: 'db fails, and app runs anyway.',
      presetReqAfter: 'Requires= + After=',
      presetReqAfterHint: 'db fails, so app never starts.',
      presetWantsAfter: 'Wants= + After=',
      presetWantsAfterHint: 'db fails; app waits, then runs anyway.',
      presetAfterOnly: 'After= only',
      presetAfterOnlyHint: 'After= pulls nothing in.',

      legendWants: 'Wants=: pulls in, weak',
      legendRequires: 'Requires=: pulls in, strong',
      legendAfter: 'After=: waits (ordering)',
      legendActive: 'active',
      legendFailed: 'failed',
      legendDependency: 'dependency failed',
      legendNone: 'not in transaction',
      legendChanged: 'changed by the last edit',

      graphTitle: 'Units and relations',
      timeTitle: 'Boot',
      unitFile: 'the file you edit',
      defaultTarget: 'default target',
      enabled: 'enabled',
      disabled: 'disabled',
      willFail: 'fails',
      auto: 'automatic',
      lane: 'unit',
      slot: 'slot {n}',
      result: 'state',
      waiting: 'waiting…',
      stActive: 'active',
      stFailed: 'failed',
      stDependency: 'dependency failed',
      stNone: 'not in transaction',
      cycleBanner: 'Ordering cycle: no schedule is computed.',
      unitLabel: '{unit}: {state}',

      cOrdered: '`app` waits for `db` (`After=`): `db` starts in slot {db}, and `app` only in slot {app}, once `db` has finished.',
      cNoOrder: '`{rel}` without `After=` sets no order: nothing makes `app` wait for `db` (`db`: slot {db}, `app`: slot {app}).',
      cIndependent: '`app` and `db` are not related: each starts when it is ready (`db`: slot {db}, `app`: slot {app}).',
      cDbOut: 'Nothing pulls `db` in: it is not in the transaction and does not start.',
      cAfterOnly: '`After=` pulls nothing in: `db` isn\'t in the transaction, and `app` starts without it.',
      cDepFailed: '`Requires=` and `After=`: `app` waits for `db`, `db` fails in slot {db}, so `app` never starts (dependency failed).',
      cReqNoAfter: '`Requires=` without `After=`: both start at once, so `app` runs although `db` failed.',
      cReqNoAfterApart: '`Requires=` without `After=`: `app` does not wait for `db`, so it runs although `db` failed.',
      cWantsAfterFailed: '`Wants=` and `After=`: `app` waits for `db` to finish (by failing, in slot {db}), then starts in slot {app} and runs: a weak dependency does not stop it.',
      cWantsFailed: '`Wants=`: `db` failed, and `app` runs anyway; without `After=` it did not even wait for it.',
      cAfterFailed: '`db` is enabled, so the target pulls it in; `app` only waits for it (`After=`) and starts in slot {app} although `db` failed.',
      cUnrelatedFailed: '`db` failed, but `app` neither needs it nor waits for it: it runs.',
      cNetOrdered: 'Two lines, not one: `Wants=` pulls `network-online.target` in, and `After=` makes `app` wait for it (network: slot {net}, `app`: slot {app}).',
      cNetNoOrder: '`Wants=` without `After=`: the network is in the transaction, but `app` does not wait for it (network: slot {net}, `app`: slot {app}).',
      cNetAfterOnly: '`After=` without `Wants=`: nothing pulls `network-online.target` in, so `app` starts without the network, in slot {app}.',
      cNetNone: '`app` neither pulls in the network nor waits for it: `network-online.target` is not in the transaction.',
      cCycle: 'Ordering cycle ({units}): no unit can go first. Real systemd then drops a job from the transaction; here no schedule is computed.',
      cReplay: ['Slot {k} of {total}: {units} starts.', 'Slot {k} of {total}: {units} start.'],

      explain: '<p>At boot, systemd starts the default [[target]] (here <code>multi-user.target</code>) and gathers into a ' +
        '[[transaction]] everything reachable from it through requirements: <code>Wants=</code> and <code>Requires=</code> ' +
        'in the unit files, and the links in <code>multi-user.target.wants/</code> that <code>systemctl enable</code> ' +
        'creates from <code>WantedBy=</code> in the <code>[Install]</code> section.</p>' +
        '<p><b>Requirement and ordering are two separate things.</b> <code>Wants=</code> pulls in another [[unit]], but if ' +
        'it fails, the unit that named it still starts. <code>Requires=</code> is a stronger [[dependency]]: if the other ' +
        'unit fails <i>and</i> <code>After=</code> on it is set, this one is not started (dependency failed). Without ' +
        '<code>After=</code> neither waits for the other. Order comes only from <code>After=</code> and <code>Before=</code>, and ' +
        'they pull nothing in: if the other unit is not in the transaction, the ordering is ignored.</p>' +
        '<p>A unit that waits starts only once the other has finished starting up, successfully or not. Units with no ' +
        'ordering between them do not wait for each other: each starts in the slot after the last unit it waits for. A ' +
        '[[=target]] by itself adds <code>After=</code> on the units it pulls in, so it is reached only once they are done. Stopping runs in the reverse order.</p>' +
        '<p>Common mistakes: that <code>Requires=</code> also means “start after”; that <code>After=</code> starts the other ' +
        'unit; that a failed <code>Wants=</code> unit stops the unit that asked for it.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
