/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-multipath, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other). Disk names, ports, policies
   and multipath output are data: the page puts them in translate="no" elements. The title and subtitle come from
   sim.json. Term pairs not in the glossary yet are written out (NOTES.md, "Term pairs"). */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Jedan LUN, četiri puta: kvar puta dok U/I teče',

      // params
      grouping: 'path_grouping_policy',
      failback: 'failback',
      noPathRetry: 'no_path_retry',
      useMultipath: 'Multipath',
      fault: 'Što pada',
      faultSdb: 'put sdb',
      faultH0: 'port h0',
      faultCtrlA: 'kontroler A',
      faultAll: 'sve',
      failAt: 'Kvar u intervalu',
      downFor: 'Trajanje kvara (intervala)',
      ticks: 'Intervala',
      optFailover: 'failover',
      optMultibus: 'multibus',
      optGroupByPrio: 'group_by_prio',
      optImmediate: 'immediate',
      optManual: 'manual',
      optQueue: 'queue',
      optFail: 'fail',
      opt3: '3',

      // presets
      'preset_alua-failover': 'ALUA, pada A',
      'preset_alua-failover_hint': 'group_by_prio: U/I samo prema kontroleru A; on pada, preuzima grupa kontrolera B',
      'preset_multibus-rr': 'multibus, sdb',
      'preset_multibus-rr_hint': 'U/I po sva četiri puta, zatim po tri; jedan zahtjev ponovljen, nijedna greška',
      'preset_all-down-queue': 'Sve, queue',
      'preset_all-down-queue_hint': 'sva četiri puta padaju: zahtjevi čekaju u redu i odlaze kad se putovi vrate',
      'preset_all-down-fail': 'Sve, fail',
      'preset_all-down-fail_hint': 'sva četiri puta padaju: greške odmah, datotečni sustav samo za čitanje',
      'preset_no-multipath': 'Samo sdb',
      'preset_no-multipath_hint': 'datotečni sustav na sdb: greške odmah, iako tri zdrava puta postoje',

      // legend
      legActive: 'aktivan put',
      legStandby: 'put u pričuvi',
      legFailed: 'put failed',
      legGroup: 'aktivna grupa',
      legIo: 'U/I zahtjev',
      legQueued: 'zahtjev čeka',
      legError: 'greška',
      legChanged: 'promijenjeno',

      // stage
      appLabel: 'aplikacija',
      appIo: '4 U/I zahtjeva po intervalu',
      fsLabel: 'datotečni sustav {mnt}',
      fsRw: 'čitanje i pisanje',
      fsRo: 'samo za čitanje',
      fsOn: 'na',
      queuedHere: 'u redu čekanja: {n}',
      errorsHere: 'greške u ovom intervalu: {n}',
      hostTitle: 'računalo',
      portDown: 'pao',
      switchTitle: 'preklopnik',
      arrayTitle: 'diskovno polje',
      ctrlTitle: 'kontroler {c}',
      ownsLun: 'vlasnik LUN-a',
      ioN: ['{n} U/I', '{n} U/I', '{n} U/I'],
      failedHere: '✕ zahtjev pao',
      drainedHere: ['+{n} iz reda', '+{n} iz reda', '+{n} iz reda'],
      groupTag: 'grupa {g}',
      unusedTag: 'ne koristi se',

      // listing and counters
      intervalLabel: 'Interval {n} · t = {t} s',
      noMap: 'nema mape: multipath je isključen',
      disksTitle: 'Diskovi koje jezgra vidi',
      sameWwid: 'Isti WWID: to je jedan LUN, a ne četiri diska.',
      fsHere: 'datotečni sustav',
      cDone: 'obavljeno',
      cRetried: 'ponovljeno na drugom putu',
      cQueued: 'u redu čekanja',
      cErrors: 'greške datotečnom sustavu',
      cFs: 'datotečni sustav',
      cNpr: 'no_path_retry',
      plusTick: '+{n} sada',
      nprLeft: ['još {n} interval', 'još {n} intervala', 'još {n} intervala'],
      nprOut: 'isteklo: greške odmah',
      nprWaiting: 'čeka put',

      // captions: events
      'evFail_sdb': 'Put {dev} je pao (veza je prekinuta).',
      'evFail_h0': 'Port {port} je pao: prekinuti su putovi {devs}.',
      'evFail_ctrl-A': 'Kontroler A je pao.',
      'evFail_all': 'Sva četiri puta su pala.',
      'evBack_sdb': 'Veza puta {dev} se vratila.',
      'evBack_h0': 'Port {port} se vratio.',
      'evBack_ctrl-A': 'Kontroler A se vratio.',
      'evBack_all': 'Sve veze su se vratile.',

      // captions: what happened
      capStart: 'Jedan LUN, četiri puta ({devs}), koje multipath spaja u {map}; aktivna je grupa {g}. Svaki korak je jedan interval provjere putova (5 s) s 4 U/I zahtjeva aplikacije; pritisni →.',
      capStartPlain: 'Bez multipatha jezgra vidi jedan LUN kao četiri diska ({devs}) iste veličine i istog WWID-a, a datotečni sustav je na {dev}. Pritisni →.',
      capCtrlAFailover: 'Kontroler A je pao: oba puta u aktivnoj grupi su {failed}. Multipath prelazi na grupu kontrolera B; zahtjev koji je pao ponovljen je, a datotečni sustav nije vidio grešku.',
      capSwitch: ['Put {devs} je {failed} i aktivna grupa nema ispravan put, pa multipath prelazi na {group}; zahtjev koji je pao ponovljen je, a datotečni sustav nije vidio grešku.', 'Putovi {devs} su {failed} i aktivna grupa nema ispravan put, pa multipath prelazi na {group}; zahtjev koji je pao ponovljen je, a datotečni sustav nije vidio grešku.', 'Putovi {devs} su {failed} i aktivna grupa nema ispravan put, pa multipath prelazi na {group}; zahtjev koji je pao ponovljen je, a datotečni sustav nije vidio grešku.'],
      capRetry: ['U/I poslan na {devs} je pao: put je označen kao {failed}, a U/I ponovljen na {to}; datotečni sustav nije vidio grešku.', 'U/I poslan na {devs} je pao: putovi su označeni kao {failed}, a U/I ponovljen na {to}; datotečni sustav nije vidio grešku.', 'U/I poslan na {devs} je pao: putovi su označeni kao {failed}, a U/I ponovljen na {to}; datotečni sustav nije vidio grešku.'],
      capQueued: 'Nijedan put nije upotrebljiv: zahtjevi čekaju u redu (sada {n}) i aplikacija stoji, ali ništa se ne gubi.',
      capRetryLeft: ['{npr} {max}: red čeka još {n} interval, a zatim zahtjevi vraćaju grešku.', '{npr} {max}: red čeka još {n} intervala, a zatim zahtjevi vraćaju grešku.', '{npr} {max}: red čeka još {n} intervala, a zatim zahtjevi vraćaju grešku.'],
      capFlushed: '{npr} {max} je istekao: zahtjevi iz reda ({n}) vraćaju grešku datotečnom sustavu.',
      capErrors: 'Nijedan put nije upotrebljiv, a {npr} ne čeka: zahtjevi ovog intervala ({n}) odmah vraćaju grešku datotečnom sustavu.',
      capErrorsOut: 'Nijedan put nije upotrebljiv, a {npr} je istekao: zahtjevi ovog intervala ({n}) odmah vraćaju grešku datotečnom sustavu.',
      capStillNoPath: 'Zahtjevi ovog intervala ipak nisu našli put i čekaju u redu: za povratak multipath saznaje tek od provjere putova na kraju intervala.',
      capStillErrors: 'Zahtjevi ovog intervala ({n}) ipak nisu našli put i vratili su grešku: za povratak multipath saznaje tek od provjere putova na kraju intervala.',
      capDrained: 'Provjera putova našla je putove ispravnima i vratila ih u uporabu, a zahtjevi iz reda ({n}) su poslani: ništa nije izgubljeno.',
      capReinstated: ['Provjera putova vratila je put {devs} u uporabu; U/I ga može koristiti od sljedećeg intervala.', 'Provjera putova vratila je putove {devs} u uporabu; U/I ih može koristiti od sljedećeg intervala.', 'Provjera putova vratila je putove {devs} u uporabu; U/I ih može koristiti od sljedećeg intervala.'],
      capCheckerFailed: ['Na put {devs} nije išao U/I, pa ga je kao {failed} označila tek provjera putova.', 'Na putove {devs} nije išao U/I, pa ih je kao {failed} označila tek provjera putova.', 'Na putove {devs} nije išao U/I, pa ih je kao {failed} označila tek provjera putova.'],
      capFailback: '{fb}: {group} je opet najbolja grupa, pa se U/I od sljedećeg intervala vraća na nju.',
      capManual: '{fb}: U/I ostaje na grupi {g}, iako je {group} opet upotrebljiva i ima veći prioritet.',
      capFsRo: 'Datotečni sustav dobio je grešku i prelazi u način samo za čitanje.',
      capFsStillRo: 'Datotečni sustav ostaje samo za čitanje: povratak puta to ne popravlja.',
      capSpread: ['U/I ide samo putem {devs}.', 'U/I ide putovima {devs}.', 'U/I ide putovima {devs}.'],
      capStandby: ['Put {devs} je u pričuvi ({enabled}).', 'Putovi {devs} su u pričuvi ({enabled}).', 'Putovi {devs} su u pričuvi ({enabled}).'],
      capStillFailed: ['Put {devs} je i dalje {failed}.', 'Putovi {devs} su i dalje {failed}.', 'Putovi {devs} su i dalje {failed}.'],
      capPlainOk: 'Sav U/I ide na {dev}; {others} nitko ne koristi, iako su to putovi do istog LUN-a.',
      capPlainErrors: 'Put diska {dev} je prekinut: zahtjevi ({n}) odmah vraćaju grešku, iako postoje zdravi putovi do istog LUN-a, jer ih bez multipatha ništa ne ponavlja na drugom putu.',
      capPlainErrorsAll: 'Put diska {dev} je prekinut: zahtjevi ({n}) odmah vraćaju grešku.',
      groupCtrl: 'grupa kontrolera {ctrl}',
      groupCtrlAcc: 'grupu kontrolera {ctrl}',
      groupN: 'grupa {g} ({devs})',
      groupNAcc: 'grupu {g} ({devs})',

      explain:
        '<p><i>Network storage</i> (mrežno spremište) do računala često dolazi s više strana: dva porta računala, dvije ' +
        'mreže s preklopnicima i dva kontrolera diskovnog polja. Na računalu je <i>initiator</i> (inicijator), ' +
        'a na polju <i>target</i> (cilj); svaka kombinacija između njih je jedan <i>path</i> (put). Jezgra svaki put vidi kao zaseban disk: ' +
        '<code>sda</code>, <code>sdb</code>, <code>sdc</code> i <code>sdd</code> su jedan isti LUN, s istim WWID-om. ' +
        'Datotečni sustav izravno na <code>sdb</code> pada čim padne taj jedan put.</p>' +
        '<p>Device-mapper multipath spaja ih u jedan uređaj, <code>/dev/mapper/mpatha</code>, i slaže ih u ' +
        '<i>path group</i> (grupa putova). <i>I/O request</i> (U/I zahtjev) ide samo kroz aktivnu grupu; unutar nje ga birač ' +
        'puta (<code>round-robin 0</code>) šalje redom na sljedeći ispravan put. Zadani birač u distribucijama je ' +
        '<code>service-time 0</code>; uz jednako opterećene putove ponaša se kao <code>round-robin</code>.</p>' +
        '<p><code>path_grouping_policy</code>: <b>failover</b> stavlja svaki put u svoju grupu, <b>multibus</b> sve u ' +
        'jednu, a <b>group_by_prio</b> grupira po prioritetu. Uz ALUA su putovi do kontrolera koji posjeduje LUN optimizirani ' +
        '(prio 50), a ostali nisu (prio 10): multipath tada nije raspodjela opterećenja, nego uglavnom <i>failover</i> ' +
        '(preuzimanje).</p>' +
        '<p>Zahtjev koji padne na mrtvom putu multipath označi kao <code>failed</code> i ponovi na drugom putu; datotečni sustav ' +
        'greške ne vidi. Kad aktivna grupa ostane bez putova, aktivna postaje sljedeća po prioritetu. Put koji nije nosio U/I, ' +
        'a i put koji se vratio, primijeti tek provjera putova, svakih 5 s (<code>polling_interval</code>). ' +
        'Povratak na bolju grupu je <i>failback</i> (povratak na prvotni put): <code>failback immediate</code> vraća U/I ' +
        'čim se ta grupa vrati, a <code>manual</code> ga ostavlja gdje jest.</p>' +
        '<p>Kad nijedan put ne radi, odlučuje <code>no_path_retry</code>: <b>queue</b> drži zahtjeve dok se put ne vrati ' +
        '(ništa se ne gubi, ali aplikacije stoje, možda satima), <b>fail</b> odmah vraća grešku, a broj N čeka N intervala pa ' +
        'vraća grešku. Greška koja stigne do datotečnog sustava obično ga prebaci u način samo za čitanje, a to povratak ' +
        'puta ne popravlja.</p>'
    },

    en: {
      stage: 'One LUN, four paths: a path fails while I/O runs',

      // params
      grouping: 'path_grouping_policy',
      failback: 'failback',
      noPathRetry: 'no_path_retry',
      useMultipath: 'Multipath',
      fault: 'What fails',
      faultSdb: 'path sdb',
      faultH0: 'port h0',
      faultCtrlA: 'controller A',
      faultAll: 'all',
      failAt: 'Fault at interval',
      downFor: 'Fault lasts (intervals)',
      ticks: 'Intervals',
      optFailover: 'failover',
      optMultibus: 'multibus',
      optGroupByPrio: 'group_by_prio',
      optImmediate: 'immediate',
      optManual: 'manual',
      optQueue: 'queue',
      optFail: 'fail',
      opt3: '3',

      // presets
      'preset_alua-failover': 'ALUA, A fails',
      'preset_alua-failover_hint': 'group_by_prio: I/O only to controller A; it fails, controller B\'s group takes over',
      'preset_multibus-rr': 'multibus, sdb',
      'preset_multibus-rr_hint': 'I/O over all four paths, then three; one request resent, no errors',
      'preset_all-down-queue': 'All, queue',
      'preset_all-down-queue_hint': 'all four paths fail: requests wait in the queue and go when the paths return',
      'preset_all-down-fail': 'All, fail',
      'preset_all-down-fail_hint': 'all four paths fail: errors at once, the filesystem goes read-only',
      'preset_no-multipath': 'sdb only',
      'preset_no-multipath_hint': 'the filesystem on sdb: errors at once although three healthy paths exist',

      // legend
      legActive: 'active path',
      legStandby: 'standby path',
      legFailed: 'failed path',
      legGroup: 'active group',
      legIo: 'I/O request',
      legQueued: 'request waits',
      legError: 'error',
      legChanged: 'changed',

      // stage
      appLabel: 'application',
      appIo: '4 I/O requests per interval',
      fsLabel: 'filesystem {mnt}',
      fsRw: 'read-write',
      fsRo: 'read-only',
      fsOn: 'on',
      queuedHere: 'waiting in the queue: {n}',
      errorsHere: 'errors this interval: {n}',
      hostTitle: 'host',
      portDown: 'down',
      switchTitle: 'switch',
      arrayTitle: 'storage array',
      ctrlTitle: 'controller {c}',
      ownsLun: 'owns the LUN',
      ioN: ['{n} I/O', '{n} I/O'],
      failedHere: '✕ request failed',
      drainedHere: ['+{n} from the queue', '+{n} from the queue'],
      groupTag: 'group {g}',
      unusedTag: 'unused',

      // listing and counters
      intervalLabel: 'Interval {n} · t = {t} s',
      noMap: 'no map: multipath is off',
      disksTitle: 'Disks the kernel sees',
      sameWwid: 'Same WWID: this is one LUN, not four disks.',
      fsHere: 'filesystem',
      cDone: 'done',
      cRetried: 'resent on another path',
      cQueued: 'waiting in the queue',
      cErrors: 'errors to the filesystem',
      cFs: 'filesystem',
      cNpr: 'no_path_retry',
      plusTick: '+{n} now',
      nprLeft: ['{n} interval left', '{n} intervals left'],
      nprOut: 'run out: errors at once',
      nprWaiting: 'waits for a path',

      // captions: events
      'evFail_sdb': 'Path {dev} has failed (its link is down).',
      'evFail_h0': 'Port {port} has failed: paths {devs} are down.',
      'evFail_ctrl-A': 'Controller A has failed.',
      'evFail_all': 'All four paths have failed.',
      'evBack_sdb': 'Path {dev}\'s link is back.',
      'evBack_h0': 'Port {port} is back.',
      'evBack_ctrl-A': 'Controller A is back.',
      'evBack_all': 'All links are back.',

      // captions: what happened
      capStart: 'One LUN, four paths ({devs}), which multipath joins into {map}; group {g} is active. Each step is one path-checker interval (5 s) with 4 I/O requests from the application; press →.',
      capStartPlain: 'Without multipath the kernel sees the one LUN as four disks ({devs}) of the same size and WWID, and the filesystem is on {dev}. Press →.',
      capCtrlAFailover: 'Controller A has failed: both paths in the active group are {failed}. Multipath switches to controller B\'s group; the failed I/O was retried and the filesystem saw no error.',
      capSwitch: ['Path {devs} is {failed} and the active group has no working path, so multipath switches to {group}; the failed I/O was retried and the filesystem saw no error.', 'Paths {devs} are {failed} and the active group has no working path, so multipath switches to {group}; the failed I/O was retried and the filesystem saw no error.'],
      capRetry: ['I/O sent to {devs} failed: the path is marked {failed} and the I/O resent on {to}; the filesystem saw no error.', 'I/O sent to {devs} failed: the paths are marked {failed} and the I/O resent on {to}; the filesystem saw no error.'],
      capQueued: 'No path is usable: the requests wait in the queue (now {n}) and the application hangs, but nothing is lost.',
      capRetryLeft: ['{npr} {max}: the queue waits {n} more interval, then the requests fail.', '{npr} {max}: the queue waits {n} more intervals, then the requests fail.'],
      capFlushed: '{npr} {max} has run out: the queued requests ({n}) return errors to the filesystem.',
      capErrors: 'No path is usable and {npr} does not wait: this interval\'s requests ({n}) return errors to the filesystem at once.',
      capErrorsOut: 'No path is usable and {npr} has run out: this interval\'s requests ({n}) return errors to the filesystem at once.',
      capStillNoPath: 'This interval\'s requests still found no path and wait in the queue: multipath learns of the return only from the path checker at the end of the interval.',
      capStillErrors: 'This interval\'s requests ({n}) still found no path and returned errors: multipath learns of the return only from the path checker at the end of the interval.',
      capDrained: 'The path checker found the paths working and reinstated them, and the queued requests ({n}) were sent: nothing was lost.',
      capReinstated: ['The path checker reinstated path {devs}; I/O can use it from the next interval.', 'The path checker reinstated paths {devs}; I/O can use them from the next interval.'],
      capCheckerFailed: ['No I/O went to {devs}, so only the path checker marked it {failed}.', 'No I/O went to {devs}, so only the path checker marked them {failed}.'],
      capFailback: '{fb}: {group} is the best group again, so I/O returns to it from the next interval.',
      capManual: '{fb}: I/O stays on group {g}, although {group} is usable again and has the higher priority.',
      capFsRo: 'The filesystem got an error and goes read-only.',
      capFsStillRo: 'The filesystem stays read-only: a returning path does not undo that.',
      capSpread: ['I/O goes over {devs} only.', 'I/O goes over {devs}.'],
      capStandby: ['Path {devs} stands by ({enabled}).', 'Paths {devs} stand by ({enabled}).'],
      capStillFailed: ['Path {devs} is still {failed}.', 'Paths {devs} are still {failed}.'],
      capPlainOk: 'All I/O goes to {dev}; nobody uses {others}, although they are paths to the same LUN.',
      capPlainErrors: 'The path to disk {dev} is down: the requests ({n}) return errors at once, although healthy paths to the same LUN exist, because without multipath nothing resends them on another path.',
      capPlainErrorsAll: 'The path to disk {dev} is down: the requests ({n}) return errors at once.',
      groupCtrl: 'controller {ctrl}\'s group',
      groupCtrlAcc: 'controller {ctrl}\'s group',
      groupN: 'group {g} ({devs})',
      groupNAcc: 'group {g} ({devs})',

      explain:
        '<p>Network storage often reaches a host from more than one side: two host ports, two fabrics with switches and two ' +
        'controllers in the storage array. Each combination is one path, from the initiator on the host to the target on ' +
        'the array. The kernel sees every path as a disk of its own: <code>sda</code>, <code>sdb</code>, <code>sdc</code> and ' +
        '<code>sdd</code> are one and the same LUN, with the same WWID. A filesystem put directly on <code>sdb</code> fails as ' +
        'soon as that one path does.</p>' +
        '<p>Device-mapper multipath joins them into one device, <code>/dev/mapper/mpatha</code>, and sorts them into path ' +
        'groups. An I/O request goes only through the active group; inside it the path selector (<code>round-robin 0</code>) ' +
        'sends it to the next working path in turn. The distribution default selector is <code>service-time 0</code>; with ' +
        'equally loaded paths it behaves like <code>round-robin</code>.</p>' +
        '<p><code>path_grouping_policy</code>: <b>failover</b> puts each path in a group of its own, <b>multibus</b> all of them ' +
        'in one, and <b>group_by_prio</b> groups them by priority. With ALUA the paths to the controller that owns the LUN are ' +
        'optimized (prio 50) and the others are not (prio 10): multipath is then not load balancing but mostly ' +
        'failover.</p>' +
        '<p>A request that fails on a dead path is marked <code>failed</code> by multipath and resent on another path; the ' +
        'filesystem sees no error. When the active group has no path left, the next one by priority becomes active. A path ' +
        'that carried no I/O, and a path that has come back, is noticed only by the path checker, every 5 s ' +
        '(<code>polling_interval</code>). <code>failback immediate</code> returns I/O to the better group as soon as it is ' +
        'back (failback), <code>manual</code> leaves it where it is.</p>' +
        '<p>When no path works, <code>no_path_retry</code> decides: <b>queue</b> holds the requests until a path returns ' +
        '(nothing is lost, but applications hang, perhaps for hours), <b>fail</b> returns an error at once, and a number N ' +
        'waits N intervals and then returns an error. An error that reaches the filesystem usually makes it read-only, and ' +
        'a returning path does not undo that.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
