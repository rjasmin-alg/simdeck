/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of win-dfs, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page looks them
   up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a
   glossary term. *word* is an English term on a Croatian page (the page sets it in italics, lang="en").
   Server names, paths, file names, times and version labels are data, not strings: the page writes them with
   translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'DFS: dva sjedišta, imenski prostor i replikacija',

      // lanes
      laneAna: 'Ana',
      laneMarko: 'Marko',
      roleClient: 'klijent',
      roleNs: 'poslužitelj imenskog prostora',
      roleFs: 'datotečni poslužitelj',
      siteZG: 'sjedište Zagreb',
      siteST: 'sjedište Split',
      up: 'radi',
      down: 'ne radi',

      // chips and words on the chart
      kRefReq: 'upit',
      kReferral: 'uputa',
      kConnect: 'SMB',
      kSave: 'spremi',
      kOpen: 'otvori',
      kRepl: 'replikacija',
      reConnected: 'spojen',
      reNoAnswer: 'ne odgovara',
      reStays: 'ostaje',
      reBack: 'natrag',
      reReplace: 'zamjenjuje',
      reWins: 'pobjeđuje',
      reLoses: 'gubi',
      reSame: 'već ima',
      noteUp: '{fs} opet radi',
      noteWindow: 'prozor replikacije',
      noteBlocked: 'prozor, veza prekinuta',
      noteLog: 'sukob u dnevniku',
      chartEmpty: 'Još nema poruka.',
      earlier: ['↑ {n} ranija poruka', '↑ {n} ranije poruke', '↑ {n} ranijih poruka'],

      // referral cache box
      cacheTitle: 'Predmemorija uputa',
      cacheAt: 'u {t}',
      cacheEmpty: 'prazno: još nije pitao',
      cacheLeft: 'još {left} od {ttl}',
      cacheExpired: 'isteklo u {t}',
      ownSite: 'vlastito sjedište',
      connected: 'spojen',

      // files box
      fileBase: 'spremljeno preko {base}',
      fileOriginal: 'izvorna inačica',
      pending: 'čeka replikaciju',
      binTitle: 'ConflictAndDeleted',
      binEmpty: 'prazno',
      wanTitle: 'WAN veza',
      linkUp: 'radi',
      linkDown: 'prekinuta',
      every: ['prozor svake {n} min', 'prozor svake {n} min', 'prozor svakih {n} min'],
      everyIn: ['svake {n} min', 'svake {n} min', 'svakih {n} min'],
      nextWindow: 'sljedeći u {t}',
      noneWaiting: 'ništa ne čeka',

      // params
      part: 'Dio',
      partNs: 'Imenski prostor',
      partRepl: 'Replikacija',
      fsStUp: 'FS-ST radi na početku',
      fsStUpHint: 'Isključeno: FS-ST ne radi u 9:00, a vraća se u 9:10.',
      failback: 'Vraćanje na bliže odredište',
      failbackHint: 'Kad uputa istekne, klijent se vraća na odredište u vlastitom sjedištu.',
      linkUpLabel: 'WAN veza',
      delay: 'Markovo spremanje',
      delay2: '+2 min',
      delay20: '+20 min',
      replicateAfter: 'Prozor replikacije',
      every1: 'svake minute',
      every15: 'svakih 15 min',

      // presets
      presetReferral: 'Uputa u oba sjedišta',
      presetReferralHint: 'Svaki klijent dobiva prvo poslužitelj iz svojeg sjedišta.',
      presetFailover: 'FS-ST ne radi',
      presetFailoverHint: 'Klijent u Splitu prelazi na FS-ZG preko WAN-a i tamo ostaje.',
      presetConflict: 'Sukob: oboje mijenjaju',
      presetConflictHint: 'Ana u 10:00, Marko u 10:02, replikacija u 10:15.',
      presetNoConflict: 'Bez sukoba',
      presetNoConflictHint: 'Marko mijenja u 10:20, nakon replikacije u 10:15.',

      // legend
      legendReferral: 'uputa',
      legendSmb: 'veza na dijeljeni resurs',
      legendRepl: 'replikacija',
      legendOwn: 'odredište u vlastitom sjedištu',
      legendCard: 'inačica datoteke',
      legendLoser: 'izgubila u sukobu',
      legendChanged: 'promijenjeno u ovom koraku',

      // captions: part 1
      capStart1: 'Mapa {path} pripada imenskom prostoru (*namespace*): to nije poslužitelj, nego ime iza kojeg su dva odredišta mape (*folder target*), {a} i {b}. Pritisni → .',
      capStart1Down: '{fs} ne radi.',
      capRefReq: 'Korak {n}: {user} otvara {path}. Klijent pita poslužitelja imenskog prostora u svojem sjedištu, {ns}, za uputu (*referral*).',
      capRefReqAgain: 'Korak {n}: u {time} {user} opet otvara mapu. Uputa je istekla u {exp}, pa klijent ponovno pita {ns}.',
      capReferral: 'Korak {n}: {ns} vraća uputu: prvo {first} iz vlastitog sjedišta, zatim {second} (trošak veze između sjedišta 100). Klijent je čuva {ttl} i za to vrijeme ne pita ponovno.',
      capReferralDown: 'Na popisu je i {fs}, iako ne radi: u modelu poslužitelj imenskog prostora ne izostavlja odredište koje ne radi.',
      capConnect: 'Korak {n}: klijent se spaja izravno na prvo odredište, {fs} ({share}). Poslužitelj imenskog prostora više ne sudjeluje.',
      capConnectFail: 'Korak {n}: {fs} ne odgovara. Klijent ne traži novu uputu, nego uzima sljedeće odredište s popisa.',
      capConnectNext: 'Korak {n}: prebacivanje na rezervu (*failover*): {fs} u drugom sjedištu odgovara. Datoteke sada idu preko WAN veze.',
      capConnectStick: 'Korak {n}: nova uputa stavlja {first} na prvo mjesto, ali klijent ostaje na {fs}: ono je i dalje na popisu, a vraćanje (*failback*) je isključeno. Promet i dalje ide preko WAN-a.',
      capConnectBack: 'Korak {n}: vraćanje (*failback*) je uključeno: s novom uputom klijent se vraća na {fs} u svojem sjedištu.',
      capConnectCached: 'Korak {n}: uputa vrijedi još {left}, pa klijent ne pita ponovno i koristi {fs}.',
      capConnectNone: 'Korak {n}: nijedno odredište s popisa ne odgovara.',
      capUp: 'Korak {n}: u {time} {fs} opet radi. Klijent to ne provjerava: spojen je na {cur}, a uputa vrijedi još {left}.',

      // captions: part 2
      capStart2: 'Obje kopije datoteke {file} su iste: {v1}. Ana radi na FS-ZG, Marko na FS-ST; replikacija (*DFS Replication*) ide u prozorima {every}.',
      capStart2Down: 'WAN veza je prekinuta.',
      capSave: 'Korak {n}: u {time} {user} sprema {file} na {fs}, preko {base}. Promjena čeka replikaciju.',
      capSaveNext: 'Sljedeći prozor je u {t}.',
      capSaveDown: 'WAN veza je prekinuta.',
      capOpen: 'Korak {n}: u {time} {user} otvara {file} na {fs} i dobiva {v}.',
      capOpenStale: 'Promjena s {other} još nije stigla.',
      capOpenFresh: 'Promjena s {other} je već stigla.',
      capWindow: 'Korak {n}: u {time} otvara se prozor replikacije.',
      capWindowCount: ['Na put kreće {n} promjena.', 'Na put kreću {n} promjene.', 'Na put kreće {n} promjena.'],
      capBlocked: 'Korak {n}: u {time} je prozor replikacije, ali WAN veza je prekinuta: promjene čekaju, a kopije se razlikuju.',
      capReplReplace: 'Korak {n}: {from} šalje {v} na {to}. Ta je inačica spremljena preko {local}, koju {to} ima, pa je samo zamjenjuje. Nema sukoba.',
      capReplSame: 'Korak {n}: {from} šalje {v}, a {to} je već ima.',
      capReplLocal: 'Korak {n}: {from} šalje {v}, a {to} ima {local}. Obje su spremljene preko {base}: to je sukob (*conflict*). Pobjeđuje kasnije spremljena, {local}; {to} zadržava svoju i ne instalira pristiglu.',
      capReplIn: 'Korak {n}: {from} šalje {v}, a {to} ima {local}. Obje su promijenjene prije replikacije: pobjeđuje kasnija ({time2}), a {local} odlazi u ConflictAndDeleted na {to}. Ništa se ne spaja.',
      capReplTie: 'Korak {n}: {from} šalje {v}, a {to} ima {local}: sukob (*conflict*) s jednakim vremenom spremanja. U modelu pobjeđuje inačica s poslužitelja čije je ime prvo po abecedi, {win}.',
      capTieBin: '{local} odlazi u ConflictAndDeleted na {to}.',
      capLog: 'Korak {n}: {fs} bilježi sukob u dnevnik događaja. Izgubljena inačica {v} ostaje u ConflictAndDeleted dok je ne počisti ograničenje veličine te mape.',
      capFinal: 'Korak {n}: {user} otvara {file} na {fs} i dobiva {v}.',
      capFinalLost: 'Promjena iz {time2} nije u njoj: ta inačica je u ConflictAndDeleted.',
      capFinalKept: 'Ta je inačica spremljena preko {base}, pa sadrži i promjenu iz {time2}. Ništa nije izgubljeno.',
      capFinalOwn: 'To je njezina vlastita inačica.',
      capFinalDiffer: 'Kopije se razlikuju: na {other} je {ov}. Kad se veza vrati, pobijedit će kasnije spremljena.',

      explain: '<p><b>Imenski prostor.</b> Put <code translate="no">\\\\firma.local\\dfs\\projekti</code> mapa je imenskog prostora (<i lang="en">namespace</i>): virtualna mapa iza koje ' +
        'stoje dva odredišta mape (<i lang="en">folder target</i>), <code translate="no">\\\\FS-ZG\\projekti</code> i <code translate="no">\\\\FS-ST\\projekti</code>. ' +
        'Klijent pita poslužitelja imenskog prostora za uputu (<i lang="en">referral</i>), popis odredišta, pa se spaja izravno na odredište. ' +
        'DFS nije jedan poslužitelj koji drži podatke.</p>' +
        '<p><b>Poredak.</b> Prema najmanjem trošku: prvo odredišta u klijentovu sjedištu, zatim druga sjedišta po trošku veze. ' +
        'Odredišta s jednakim troškom dolaze nasumičnim redom; model ih slaže po imenu. Uputa za mapu vrijedi 1800 s, za korijen imenskog prostora 300 s.</p>' +
        '<p><b>Prebacivanje na rezervu (<i lang="en">failover</i>).</b> Ako prvo odredište ne odgovara, klijent uzima sljedeće s popisa. Kad se bliže odredište vrati, klijent ' +
        '<em>ne</em> prelazi natrag: ni kad uputa istekne, ako je trenutačno odredište i dalje na popisu. Natrag ide samo s uključenim vraćanjem ' +
        '(<i lang="en">failback</i>), kad uputa istekne.</p>' +
        '<p><b>Replikacija.</b> Replikacija (<i lang="en">DFS Replication</i>) ima više ravnopravnih članova (<i lang="en">multi-master</i>): svaki član prima promjene, a one putuju kad raspored i veza ' +
        'to dopuste. Ako je ista datoteka promijenjena na oba člana prije replikacije, to je sukob (<i lang="en">conflict</i>): pobjeđuje kasnije spremljena inačica, ' +
        'a druga odlazi u <code translate="no">DfsrPrivate\\ConflictAndDeleted</code>. Replikacija ne spaja dvije izmjene.</p>' +
        '<p>Model: prozori replikacije u pravilnim razmacima; jednaka vremena spremanja rješava po imenu poslužitelja. Koja kopija završi u ' +
        'ConflictAndDeleted ovisi o tome koji član razriješi sukob.</p>'
    },
    en: {
      stage: 'DFS: two sites, a namespace and replication',

      laneAna: 'Ana',
      laneMarko: 'Marko',
      roleClient: 'client',
      roleNs: 'namespace server',
      roleFs: 'file server',
      siteZG: 'Zagreb site',
      siteST: 'Split site',
      up: 'up',
      down: 'down',

      kRefReq: 'request',
      kReferral: 'referral',
      kConnect: 'SMB',
      kSave: 'save',
      kOpen: 'open',
      kRepl: 'replication',
      reConnected: 'connected',
      reNoAnswer: 'no answer',
      reStays: 'stays',
      reBack: 'back',
      reReplace: 'replaces',
      reWins: 'wins',
      reLoses: 'loses',
      reSame: 'has it',
      noteUp: '{fs} back up',
      noteWindow: 'replication window',
      noteBlocked: 'window, link down',
      noteLog: 'conflict logged',
      chartEmpty: 'No messages yet.',
      earlier: ['↑ {n} earlier message', '↑ {n} earlier messages'],

      cacheTitle: 'Referral cache',
      cacheAt: 'at {t}',
      cacheEmpty: 'empty: has not asked yet',
      cacheLeft: '{left} of {ttl} left',
      cacheExpired: 'expired at {t}',
      ownSite: 'own site',
      connected: 'connected',

      fileBase: 'saved over {base}',
      fileOriginal: 'original version',
      pending: 'waiting to replicate',
      binTitle: 'ConflictAndDeleted',
      binEmpty: 'empty',
      wanTitle: 'WAN link',
      linkUp: 'up',
      linkDown: 'down',
      every: ['a window every {n} min', 'a window every {n} min'],
      everyIn: ['every {n} min', 'every {n} min'],
      nextWindow: 'next at {t}',
      noneWaiting: 'nothing waiting',

      part: 'Part',
      partNs: 'Namespace',
      partRepl: 'Replication',
      fsStUp: 'FS-ST up at the start',
      fsStUpHint: 'Off: FS-ST is down at 9:00 and back at 9:10.',
      failback: 'Client failback',
      failbackHint: 'When the referral expires, the client goes back to the target in its own site.',
      linkUpLabel: 'WAN link',
      delay: 'Marko saves',
      delay2: '+2 min',
      delay20: '+20 min',
      replicateAfter: 'Replication window',
      every1: 'every 1 min',
      every15: 'every 15 min',

      presetReferral: 'Referral in both sites',
      presetReferralHint: 'Each client gets the server in its own site first.',
      presetFailover: 'FS-ST down',
      presetFailoverHint: 'The Split client moves to FS-ZG across the WAN and stays there.',
      presetConflict: 'Conflict: both edit',
      presetConflictHint: 'Ana at 10:00, Marko at 10:02, replication at 10:15.',
      presetNoConflict: 'No conflict',
      presetNoConflictHint: 'Marko edits at 10:20, after replication at 10:15.',

      legendReferral: 'referral',
      legendSmb: 'connection to the share',
      legendRepl: 'replication',
      legendOwn: 'target in the own site',
      legendCard: 'file version',
      legendLoser: 'lost a conflict',
      legendChanged: 'changed in this step',

      capStart1: 'The folder {path} is in a namespace: not a server but a name with two folder targets behind it, {a} and {b}. Press → .',
      capStart1Down: '{fs} is down.',
      capRefReq: 'Step {n}: {user} opens {path}. The client asks the namespace server in its own site, {ns}, for a referral.',
      capRefReqAgain: 'Step {n}: at {time} {user} opens the folder again. The referral expired at {exp}, so the client asks {ns} again.',
      capReferral: 'Step {n}: {ns} returns a referral: {first} in the client\'s own site first, then {second} (site link cost 100). The client caches it for {ttl} and does not ask again meanwhile.',
      capReferralDown: '{fs} is on the list although it is down: in the model the namespace server does not leave a down target out of the referral.',
      capConnect: 'Step {n}: the client connects directly to the first target, {fs} ({share}). The namespace server takes no further part.',
      capConnectFail: 'Step {n}: {fs} does not answer. The client does not ask for a new referral; it takes the next target on the list.',
      capConnectNext: 'Step {n}: failover: {fs} in the other site answers. Files now travel across the WAN link.',
      capConnectStick: 'Step {n}: the new referral puts {first} first, but the client stays on {fs}: it is still on the list and client failback is off. Traffic still crosses the WAN.',
      capConnectBack: 'Step {n}: client failback is on: with the new referral the client goes back to {fs} in its own site.',
      capConnectCached: 'Step {n}: the referral is good for {left} more, so the client does not ask again and uses {fs}.',
      capConnectNone: 'Step {n}: no target on the list answers.',
      capUp: 'Step {n}: at {time} {fs} is back up. The client does not check: it is connected to {cur} and its referral is good for {left} more.',

      capStart2: 'Both copies of {file} are the same: {v1}. Ana works on FS-ZG, Marko on FS-ST; DFS Replication runs in windows {every}.',
      capStart2Down: 'The WAN link is down.',
      capSave: 'Step {n}: at {time} {user} saves {file} on {fs}, over {base}. The change waits to replicate.',
      capSaveNext: 'The next window is at {t}.',
      capSaveDown: 'The WAN link is down.',
      capOpen: 'Step {n}: at {time} {user} opens {file} on {fs} and gets {v}.',
      capOpenStale: 'The change from {other} has not arrived yet.',
      capOpenFresh: 'The change from {other} has already arrived.',
      capWindow: 'Step {n}: at {time} a replication window opens.',
      capWindowCount: ['{n} change sets off.', '{n} changes set off.'],
      capBlocked: 'Step {n}: at {time} there is a replication window, but the WAN link is down: the changes wait and the copies differ.',
      capReplReplace: 'Step {n}: {from} sends {v} to {to}. That version was saved over {local}, which {to} has, so it simply replaces it. No conflict.',
      capReplSame: 'Step {n}: {from} sends {v}, and {to} already has it.',
      capReplLocal: 'Step {n}: {from} sends {v}, but {to} has {local}. Both were saved over {base}: a conflict. The later save, {local}, wins; {to} keeps its own and does not install the incoming one.',
      capReplIn: 'Step {n}: {from} sends {v}, but {to} has {local}. Both copies changed before replication: the later one ({time2}) wins, and {local} goes to ConflictAndDeleted on {to}. Nothing is merged.',
      capReplTie: 'Step {n}: {from} sends {v}, but {to} has {local}: a conflict with equal save times. In the model the version from the server whose name sorts first wins: {win}.',
      capTieBin: '{local} goes to ConflictAndDeleted on {to}.',
      capLog: 'Step {n}: {fs} logs the conflict in its event log. The losing version {v} stays in ConflictAndDeleted until the folder\'s size quota cleans it up.',
      capFinal: 'Step {n}: {user} opens {file} on {fs} and gets {v}.',
      capFinalLost: 'The change from {time2} is not in it: that version is in ConflictAndDeleted.',
      capFinalKept: 'That version was saved over {base}, so it holds the change from {time2} too. Nothing is lost.',
      capFinalOwn: 'It is her own version.',
      capFinalDiffer: 'The copies differ: {other} has {ov}. When the link comes back, the later save wins.',

      explain: '<p><b>Namespace.</b> The path <code translate="no">\\\\firma.local\\dfs\\projekti</code> is a namespace folder: a virtual folder ' +
        'with two folder targets behind it, <code translate="no">\\\\FS-ZG\\projekti</code> and <code translate="no">\\\\FS-ST\\projekti</code>. ' +
        'The client asks a namespace server for a referral, the list of targets, and then connects to a target directly. ' +
        'DFS is not one file server that holds the data.</p>' +
        '<p><b>Order.</b> Lowest cost: targets in the client\'s own site first, then other sites by site link cost. ' +
        'Targets with equal cost come in random order; the model sorts them by name. A folder referral is cached for 1800 s, a namespace root referral for 300 s.</p>' +
        '<p><b>Failover.</b> If the first target does not answer, the client takes the next one on the list. When the nearer target comes back, ' +
        'the client does <em>not</em> move back: not even when its referral expires, as long as its current target is still on the list. ' +
        'It moves back only with client failback on, when the referral expires.</p>' +
        '<p><b>Replication.</b> DFS Replication is multi-master: every member takes changes, and they travel when the schedule and the link ' +
        'allow. If the same file changed on both members before they replicated, that is a conflict: the version saved last wins and ' +
        'the other goes to <code translate="no">DfsrPrivate\\ConflictAndDeleted</code>. Replication does not merge two edits.</p>' +
        '<p>The model: replication windows at regular intervals; equal save times are decided by server name. Which copy ends up in ' +
        'ConflictAndDeleted depends on which member resolves the conflict.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
