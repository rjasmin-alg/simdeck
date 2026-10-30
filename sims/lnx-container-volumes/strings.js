/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-container-volumes, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: paths, file names, container ids and volume names are data), an array is
   plural forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   In captions *word* is an English term in italics (the Croatian term rule, for terms the glossary lacks) and `x` is
   code. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Što kontejner vidi i gdje na disku domaćina leži svaka datoteka',
      // panel
      scene: 'Primjer',
      kind: 'Gdje živi /data',
      kindHint: 'Isti koraci, drugo mjesto za podatke.',
      kLayer: 'sloj',
      kNamed: 'imenovani',
      kAnon: 'anonimni',
      kBind: 'vezano',
      rmV: 'rm -v (briše i anonimne sveske)',
      pLost: 'Ponovno stvori kontejner',
      pLostHint: 'Piši, zaustavi, pokreni, rm, pa run iznova.',
      pNamed: 'Imenovani svezak ostaje',
      pNamedHint: '-v dbdata:/data preživljava rm.',
      pAnon: 'VOLUME u slici',
      pAnonHint: 'Svaki run dobije novi anonimni svezak.',
      pBind: 'Vezano montiranje zaklanja',
      pBindHint: 'Direktorij domaćina preko datoteka slike.',
      pFlags: 'rm ili rm -v',
      pFlagsHint: 'Anonimni svezak nestaje, imenovani ostaje.',
      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legImage: 'slika, samo za čitanje',
      legLayer: 'sloj za pisanje, nestaje s kontejnerom',
      legVol: 'svezak, imenovani ili anonimni',
      legBind: 'direktorij domaćina',
      legLost: 'izgubljeno u ovom koraku',
      // grid
      gridTitle: 'Gdje leži koja datoteka',
      metaStorage: '<storage> = spremište sustava za kontejnere',
      cntVols: ['{n} svezak na disku', '{n} sveska na disku', '{n} svezaka na disku'],
      rowSees: '{c} vidi',
      rowNone: 'nema kontejnera',
      rowLayer: 'sloj kontejnera {id}',
      rowImage: 'slika {img}',
      rowNamed: 'svezak {name}',
      rowAnon: 'anonimni {name}',
      rowHost: 'direktorij domaćina',
      running: 'radi',
      stopped: 'zaustavljen',
      unused: 'nitko ga ne koristi',
      notYet: 'još ne postoji',
      deleted: 'obrisan',
      removed: 'kontejner obrisan',
      srcImage: 'slika',
      srcLayer: 'sloj',
      hidden: 'zaklonjeno',
      empty: '(prazno)',
      mountsAt: '{target} = {src}',
      timeline: 'Koraci primjera',
      // command output
      outRefusedRun: 'odbijeno: kontejner nije stvoren',
      outRefusedRm: 'odbijeno: kontejner radi',
      outPruned: 'obrisano: {list}',
      outNone: 'ništa za brisanje',
      // captions: start
      capStartLost_layer: 'Slika {img} ima {conf} i {schema}. Kontejnera još nema. Ovaj put bez -v: sve što kontejner zapiše u /data završit će u njegovu *writable layer* (sloju za pisanje).',
      capStartLost_named: 'Slika {img} ima {conf} i {schema}. Kontejnera još nema. Ovaj put -v dbdata:/data: /data će biti imenovani *volume* (svezak) dbdata.',
      capStartLost_anon: 'Slika {img} ima {conf} i {schema}. Kontejnera još nema. Ovaj put -v /data, bez imena: /data će biti novi anonimni *volume* (svezak).',
      capStartLost_bind: 'Slika {img} ima {conf} i {schema}. Kontejnera još nema. Ovaj put -v /srv/db:/data: /data će biti direktorij domaćina, *bind mount* (vezano montiranje).',
      capStartNamed: 'Slika {img} ima {conf} i {schema}. Kontejner će dobiti imenovani *volume* (svezak) dbdata na /data, pa ga obrisati i stvoriti iznova.',
      capStartAnon: 'Slika {img} u svojem opisu ima VOLUME /data. Kontejner se pokreće bez -v: što će dobiti na /data?',
      capStartBind: 'Slika {img} ima {index}. Direktorij domaćina {dir} je prazan i bit će montiran preko /var/www/html: *bind mount* (vezano montiranje).',
      capStartFlags: 'Kontejner {id} radi, a montirana su mu dva sveska. *Volume* (svezak) dblogs je imenovani, na /var/log/db; {anon} je anonimni, na /data, jer slika ima VOLUME /data. Oba su na disku domaćina, izvan kontejnera.',
      // captions: run
      capRunLayer: 'run stvara kontejner {id} s praznim slojem za pisanje, na disku domaćina u {path}. Za /data nema montiranja, pa će sve zapisano ondje ići u taj sloj.',
      capRunLayerAgain: 'Novi kontejner {id} dobiva novi, prazan sloj za pisanje. /data opet sadrži samo ono što ima slika.',
      capRunNamedNew: 'Svezak {vol} nije postojao: run ga stvara prazan i najprije u njega kopira datoteke slike iz /data ({files}). Kontejner na /data sada vidi svezak, ne sliku.',
      capRunNamedOld: 'Svezak {vol} već postoji i nije prazan, pa se ništa ne kopira: novi kontejner {id} na /data vidi isti {rows} koji je zapisao stari.',
      capRunAnonImage: 'Slika ima VOLUME /data, a run nema -v za /data: kontejner {id} dobiva novi anonimni *volume* (svezak) s nasumičnim heksadekadskim imenom {vol}, popunjen datotekama slike ({files}).',
      capRunAnonAgain: 'Slika ima VOLUME, pa je novi kontejner {id} dobio novi anonimni svezak {vol}; stari {old} s podacima i dalje leži na disku.',
      capRunAnonAgainGone: 'Slika ima VOLUME, pa je novi kontejner {id} dobio novi anonimni svezak {vol}, popunjen datotekama slike ({files}). Stari {old} obrisao je rm -v, a s njim i podatke.',
      capRunAnonFlag: '-v /data ne imenuje svezak: run stvara novi anonimni *volume* (svezak) {vol} i popunjava ga datotekama slike ({files}).',
      capRunAnonFlagAgain: 'Isti -v /data opet stvara novi anonimni svezak {vol}: novi kontejner {id} ne dobiva stari {old}, iako on i dalje leži na disku.',
      capRunAnonFlagAgainGone: 'Isti -v /data opet stvara novi anonimni svezak {vol}, popunjen datotekama slike ({files}). Stari {old} obrisao je rm -v, a s njim i podatke.',
      capRunBind: '{dir} je montiran preko {target}: ništa se ne kopira, a {file} iz slike više se ne vidi. Datoteka nije obrisana, nego zaklonjena: montiranje zaklanja ono što je prije bilo u direktoriju, koji je sada [[mount point]].',
      capRunBindAgain: '{dir} je opet montiran na {target}: {rows} je ondje, jer nikad nije ni bio u kontejneru. Datoteka slike {file} opet je zaklonjena.',
      // captions: writes
      capWriteLayer: '/data ovdje nije [[mount point]], pa {name} ide u sloj za pisanje kontejnera {id}, na disku domaćina u {path}.',
      capWriteVol: '{name} je ispod točke montiranja {target}: datoteka ide u svezak {vol}, na disku domaćina u {path}. Sloj kontejnera ostaje prazan.',
      capWriteBind: '{name} je ispod točke montiranja {target}: datoteka ide ravno u direktorij domaćina {dir}.',
      capWriteBindBack: 'Kontejner dopisuje u {name}: promjena je istog trena u {host} na domaćinu. To je ista datoteka, ne kopija.',
      capHostWrite: 'Domaćin zapisuje {host}, a kontejner je odmah vidi kao {inside}: vezano montiranje pokazuje isti direktorij, bez kopiranja i bez čekanja.',
      // captions: stop / start
      capStopLayer: 'stop zaustavlja procese, ali kontejner {id} i njegov sloj za pisanje ostaju: {rows} je i dalje u {path}.',
      capStopMount: 'stop zaustavlja procese; kontejner {id} ostaje, a podaci su ionako izvan njega, u {where}.',
      whereVol: 'svesku {x}',
      whereBind: 'direktoriju domaćina {x}',
      and: ' i ',
      capStarted: 'start pokreće isti kontejner {id}: isti sloj za pisanje, isti montirani izvori. {rows} je još tu.',
      capStartedLayer: 'start pokreće isti kontejner {id} nad istim slojem za pisanje: {rows} je još tu.',
      // captions: rm
      capRmLost: '`rm` je obrisao kontejner i njegov sloj za pisanje; {files} je bio ondje, pa ga više nema.',
      capRmForce: '`rm` odbija kontejner koji radi, pa ga -f najprije prisilno zaustavi.',
      capRmEmpty: '`rm` je obrisao kontejner {id} i njegov sloj za pisanje, koji je ionako bio prazan.',
      capRmKeepNamed: 'Svezak {vol} nije dio kontejnera: ostaje na disku, sa svime što je u njemu.',
      capRmKeepAnon: 'Bez -v ostaje i anonimni svezak {vol}, sada bez kontejnera koji ga koristi.',
      capRmGoneAnon: 'S -v briše se i anonimni svezak {vol}, a s njim i njegove datoteke ({files}).',
      capRmKeepNamedV: '-v briše samo anonimne sveske: imenovani {vol} ostaje.',
      capRmKeepBind: 'Direktorij domaćina {dir} nije dio kontejnera i ostaje kakav jest.',
      // captions: commands that read
      capLsHidden: '`ls` {dir} ne ispisuje ništa: {file} iz slike leži ispod točke montiranja, a {host} je prazan.',
      capLsData: '`ls` {dir}: samo {list}, kopija iz slike. {rows} je ostao u starom svesku {old}.',
      capLsDataV: '`ls` {dir}: samo {list}, kopija iz slike. {rows} je otišao sa starim sveskom.',
      capCatGoneLayer: '`cat` ne nalazi {name}: datoteka je bila u sloju starog kontejnera, a taj je sloj obrisan s njim.',
      capCatGoneAnon: '`cat` ne nalazi {name}: datoteka je u starom anonimnom svesku {old}, a novi kontejner ima novi.',
      capCatGoneAnonV: '`cat` ne nalazi {name}: datoteka je bila u anonimnom svesku {old}, koji je rm -v obrisao.',
      capCatBack: '`cat` čita {name} iz {where}: podaci su preživjeli rm jer nikad nisu bili u kontejneru.',
      capVolLsNamed: '`volume ls` navodi {vol}: svezak je nadživio kontejner za koji je stvoren, a novi ga opet koristi.',
      capVolLsOrphan: '`volume ls` navodi dva sveska s nasumičnim imenima: {old} drži {rows}, a ne koristi ga nijedan kontejner; {now} pripada kontejneru koji radi.',
      capVolLsOne: '`volume ls` navodi samo {now}: rm -v obrisao je stari svezak zajedno s kontejnerom.',
      capPrune: '`volume prune` briše sveske koje ne koristi nijedan kontejner, ni pokrenut ni zaustavljen: {gone} odlazi, a s njim i {rows}. {kept} ostaje, njega koristi kontejner {id}. (Neki sustavi imenovane sveske brišu tek uz --all.)',
      capPruneNone: '`volume prune` nema što obrisati: jedini svezak, {kept}, koristi kontejner {id}.',
      capRefused: 'Naredba je odbijena i ništa se nije promijenilo.',
      explain:
        '<p>Kontejner vidi <em lang="en">image</em> (sliku) ispod svojeg <em lang="en">writable layer</em> (sloja za pisanje), a preko toga sve što je montirano. ' +
        '[[mount point]] je direktorij preko kojeg je nešto montirano. Za svaku zapisanu stazu vrijedi isto pravilo: ako je ispod točke montiranja, datoteka ide u izvor tog montiranja (pobjeđuje najdulja odgovarajuća), a inače u sloj kontejnera.</p>' +
        '<p><b>Tri mjesta na disku domaćina.</b> Sloj kontejnera je direktorij u spremištu sustava za kontejnere (<code>&lt;storage&gt;/overlay/&lt;id&gt;/diff</code>, negdje pod <code>/var/lib/</code>; &lt;id&gt; je oznaka sloja) i nestaje s kontejnerom. ' +
        '<em lang="en">Volume</em> (svezak) je u istom spremištu (<code>&lt;storage&gt;/volumes/&lt;ime&gt;/_data</code>), ali nije dio kontejnera. ' +
        '<em lang="en">Bind mount</em> (vezano montiranje) pokazuje običan direktorij domaćina, npr. <code>/srv/site</code>.</p>' +
        '<p><b>Životni ciklus.</b> <code>stop</code> i <code>start</code> čuvaju kontejner i njegov sloj. <code>rm</code> briše kontejner i njegov sloj, ali ne i sveske ni direktorije domaćina. ' +
        '<code>rm -v</code> i <code>run --rm</code> (pri izlasku) brišu i anonimne sveske kontejnera; imenovani ostaju. <code>volume prune</code> briše sveske koje ne koristi nijedan kontejner, ni zaustavljen (neki sustavi imenovane sveske brišu tek uz <code>--all</code>).</p>' +
        '<p><b>VOLUME u slici</b> svakom novom <code>run</code> bez <code>-v</code> za tu stazu daje novi anonimni svezak: novi kontejner počinje s „praznim” podacima, a stari svezak ostaje na disku bez vlasnika. ' +
        'Prazan svezak montiran preko staze iz slike najprije se popuni datotekama slike s te staze (osim uz opciju <code>nocopy</code>); vezano montiranje nikad se ne puni i samo zaklanja datoteke slike. ' +
        'Dva montiranja na istu stazu odbijaju se već pri <code>run</code>.</p>' +
        '<p><b>Česte zablude:</b> <code>stop</code> gubi podatke (ne gubi; gubi ih <code>rm</code>); „koristim svezak, dakle podaci ostaju”, a slika svakim <code>run</code> stvara novi anonimni; ' +
        'vezano montiranje dodaje datoteke u direktorij slike (ne dodaje, zaklanja ih).</p>' +
        '<p>Naredbe su prikazane bez imena sustava za kontejnere; kod uobičajenih sustava gotovo su iste (razlike su navedene uz <code>volume prune</code>). Izvan teme: <em lang="en">tmpfs</em>, upravljački programi svezaka, mrežni svesci, putanje spremišta pri radu bez <code>root</code> ovlasti (u korisnikovu domu) i SELinux oznake <code>:z</code>/<code>:Z</code>, koje vezano montiranje traži na domaćinu s uključenim SELinuxom (npr. RHEL).</p>'
    },
    en: {
      stage: 'What the container sees, and where each file lives on the host disk',
      // panel
      scene: 'Example',
      kind: 'Where /data lives',
      kindHint: 'The same steps, another place for the data.',
      kLayer: 'layer',
      kNamed: 'named',
      kAnon: 'anonymous',
      kBind: 'bind',
      rmV: 'rm -v (also deletes anonymous volumes)',
      pLost: 'Recreate the container',
      pLostHint: 'Write, stop, start, rm, then run again.',
      pNamed: 'A named volume stays',
      pNamedHint: '-v dbdata:/data outlives rm.',
      pAnon: 'VOLUME in the image',
      pAnonHint: 'Every run gets a new anonymous volume.',
      pBind: 'A bind mount hides',
      pBindHint: 'A host directory over the image\'s files.',
      pFlags: 'rm or rm -v',
      pFlagsHint: 'The anonymous volume goes, the named one stays.',
      // legend
      legChanged: 'changed in this step',
      legImage: 'image, read-only',
      legLayer: 'writable layer, dies with the container',
      legVol: 'volume, named or anonymous',
      legBind: 'host directory',
      legLost: 'lost in this step',
      // grid
      gridTitle: 'Where each file lives',
      metaStorage: '<storage> = the container engine\'s storage area',
      cntVols: ['{n} volume on disk', '{n} volumes on disk'],
      rowSees: '{c} sees',
      rowNone: 'no container',
      rowLayer: 'layer of container {id}',
      rowImage: 'image {img}',
      rowNamed: 'volume {name}',
      rowAnon: 'anonymous {name}',
      rowHost: 'host directory',
      running: 'running',
      stopped: 'stopped',
      unused: 'used by no container',
      notYet: 'not there yet',
      deleted: 'deleted',
      removed: 'container removed',
      srcImage: 'image',
      srcLayer: 'layer',
      hidden: 'hidden',
      empty: '(empty)',
      mountsAt: '{target} = {src}',
      timeline: 'The example\'s steps',
      // command output
      outRefusedRun: 'refused: no container was made',
      outRefusedRm: 'refused: the container is running',
      outPruned: 'deleted: {list}',
      outNone: 'nothing to delete',
      // captions: start
      capStartLost_layer: 'Image {img} has {conf} and {schema}. No container yet. This time without -v: whatever the container writes to /data will land in its writable layer.',
      capStartLost_named: 'Image {img} has {conf} and {schema}. No container yet. This time -v dbdata:/data: /data will be the named volume dbdata.',
      capStartLost_anon: 'Image {img} has {conf} and {schema}. No container yet. This time -v /data, with no name: /data will be a new anonymous volume.',
      capStartLost_bind: 'Image {img} has {conf} and {schema}. No container yet. This time -v /srv/db:/data: /data will be a host directory, a bind mount.',
      capStartNamed: 'Image {img} has {conf} and {schema}. The container gets the named volume dbdata on /data, and is then removed and made again.',
      capStartAnon: 'Image {img} declares VOLUME /data. The container runs without -v: what does it get on /data?',
      capStartBind: 'Image {img} has {index}. The host directory {dir} is empty and will be mounted over /var/www/html: a bind mount.',
      capStartFlags: 'Container {id} runs with the named volume dblogs on /var/log/db and the anonymous volume {anon} on /data, because the image declares VOLUME /data. Both are on the host disk, outside the container.',
      // captions: run
      capRunLayer: 'run makes container {id} with an empty writable layer, on the host disk at {path}. Nothing is mounted on /data, so whatever is written there goes into that layer.',
      capRunLayerAgain: 'The new container {id} gets a new, empty writable layer. /data again holds only what the image has.',
      capRunNamedNew: 'Volume {vol} did not exist: run makes it empty and first copies the image\'s files at /data into it ({files}). On /data the container now sees the volume, not the image.',
      capRunNamedOld: 'Volume {vol} exists and is not empty, so nothing is copied: the new container {id} sees on /data the same {rows} the old one wrote.',
      capRunAnonImage: 'The image declares VOLUME /data and run has no -v for /data: container {id} gets a new anonymous volume named by a random hex string, {vol}, filled with the image\'s files ({files}).',
      capRunAnonAgain: 'The image declares VOLUME, so the new container {id} got a new anonymous volume {vol}; the old one, {old}, with the data still sits on disk.',
      capRunAnonAgainGone: 'The image declares VOLUME, so the new container {id} got a new anonymous volume {vol}, filled with the image\'s files ({files}). rm -v deleted the old {old}, and the data with it.',
      capRunAnonFlag: '-v /data names no volume: run makes a new anonymous volume {vol} and fills it with the image\'s files ({files}).',
      capRunAnonFlagAgain: 'The same -v /data makes another new anonymous volume, {vol}: the new container {id} does not get the old {old}, though it still sits on disk.',
      capRunAnonFlagAgainGone: 'The same -v /data makes another new anonymous volume, {vol}, filled with the image\'s files ({files}). rm -v deleted the old {old}, and the data with it.',
      capRunBind: '{dir} is mounted over {target}: nothing is copied, and the image\'s {file} is no longer seen. It is not deleted, only hidden: the mount hides what the directory held before; the directory is now a [[mount point]].',
      capRunBindAgain: '{dir} is mounted on {target} again: {rows} is there, because it was never in the container. The image\'s {file} is hidden again.',
      // captions: writes
      capWriteLayer: '/data is no [[mount point]] here, so {name} goes into the writable layer of container {id}, on the host disk at {path}.',
      capWriteVol: '{name} is under the mount at {target}: the file goes into volume {vol}, on the host disk at {path}. The container\'s layer stays empty.',
      capWriteBind: '{name} is under the mount at {target}: the file goes straight into the host directory {dir}.',
      capWriteBindBack: 'The container appends to {name}: the change is in {host} on the host at once. It is the same file, not a copy.',
      capHostWrite: 'The host writes {host}, and the container sees it at once as {inside}: a bind mount shows the same directory, with no copy and no delay.',
      // captions: stop / start
      capStopLayer: 'stop ends the processes, but container {id} and its writable layer stay: {rows} is still at {path}.',
      capStopMount: 'stop ends the processes; container {id} stays, and the data is outside it anyway, in {where}.',
      whereVol: 'volume {x}',
      whereBind: 'host directory {x}',
      and: ' and ',
      capStarted: 'start runs the same container {id} again: the same writable layer, the same mounts. {rows} is still there.',
      capStartedLayer: 'start runs the same container {id} again, over the same writable layer: {rows} is still there.',
      // captions: rm
      capRmLost: '`rm` deleted the container and its writable layer; {files} lived there, so it is gone.',
      capRmForce: '`rm` refuses a running container, so -f forcibly stops it first.',
      capRmEmpty: '`rm` deleted container {id} and its writable layer, which was empty anyway.',
      capRmKeepNamed: 'Volume {vol} is not part of the container: it stays on disk with everything in it.',
      capRmKeepAnon: 'Without -v the anonymous volume {vol} stays too, now used by no container.',
      capRmGoneAnon: 'With -v the anonymous volume {vol} is deleted as well, and its files ({files}) with it.',
      capRmKeepNamedV: '-v deletes only anonymous volumes: the named {vol} stays.',
      capRmKeepBind: 'The host directory {dir} is not part of the container and stays as it is.',
      // captions: commands that read
      capLsHidden: '`ls` {dir} lists nothing: the image\'s {file} lies under the mount point, and {host} is empty.',
      capLsData: '`ls` {dir}: only {list}, the copy from the image. {rows} stayed in the old volume {old}.',
      capLsDataV: '`ls` {dir}: only {list}, the copy from the image. {rows} went with the old volume.',
      capCatGoneLayer: '`cat` finds no {name}: the file was in the old container\'s layer, and that layer was deleted with it.',
      capCatGoneAnon: '`cat` finds no {name}: it is in the old anonymous volume {old}, and the new container has a new one.',
      capCatGoneAnonV: '`cat` finds no {name}: it was in the anonymous volume {old}, which rm -v deleted.',
      capCatBack: '`cat` reads {name} from {where}: the data outlived rm because it was never in the container.',
      capVolLsNamed: '`volume ls` lists {vol}: the volume outlived the container it was made for, and the new one uses it again.',
      capVolLsOrphan: '`volume ls` lists two volumes with random hex names: {old} holds {rows} and no container uses it; {now} belongs to the running container.',
      capVolLsOne: '`volume ls` lists only {now}: rm -v deleted the old volume together with the container.',
      capPrune: '`volume prune` deletes the volumes no container uses, running or stopped: {gone} goes, and {rows} with it. {kept} stays; container {id} uses it. (Some engines delete unused named volumes only with --all.)',
      capPruneNone: '`volume prune` has nothing to delete: the only volume, {kept}, is used by container {id}.',
      capRefused: 'The command was refused and nothing changed.',
      explain:
        '<p>A container sees its image under its writable layer, and over that whatever is mounted. ' +
        'A [[mount point]] is the directory something is mounted over. Every path written follows one rule: if it is under a mount point, the file goes to that mount\'s source (the longest matching one wins); otherwise it goes into the container\'s layer.</p>' +
        '<p><b>Three places on the host disk.</b> The container\'s layer is a directory in the container engine\'s storage area (<code>&lt;storage&gt;/overlay/&lt;id&gt;/diff</code>, somewhere under <code>/var/lib/</code>; &lt;id&gt; is the layer\'s id) and dies with the container. ' +
        'A volume lives in the same storage area (<code>&lt;storage&gt;/volumes/&lt;name&gt;/_data</code>) but is not part of the container. ' +
        'A bind mount shows a plain host directory, e.g. <code>/srv/site</code>.</p>' +
        '<p><b>Lifecycle.</b> <code>stop</code> and <code>start</code> keep the container and its layer. <code>rm</code> deletes the container and its layer, but not volumes or host directories. ' +
        '<code>rm -v</code> and <code>run --rm</code> (on exit) also delete the container\'s anonymous volumes; named ones stay. <code>volume prune</code> deletes the volumes no container uses, stopped ones included (some engines delete named ones only with <code>--all</code>).</p>' +
        '<p><b>VOLUME in the image</b> gives every new <code>run</code> without <code>-v</code> for that path a new anonymous volume: the new container starts with "empty" data while the old volume stays on disk with no owner. ' +
        'An empty volume mounted over a path from the image is first filled with the image\'s files there (unless the <code>nocopy</code> option is set); a bind mount is never filled and only hides the image\'s files. ' +
        'Two mounts on the same path are refused at <code>run</code>.</p>' +
        '<p><b>Common mistakes:</b> <code>stop</code> loses data (it does not; <code>rm</code> does); "I used a volume, so the data persists", when the image makes a new anonymous one on every <code>run</code>; ' +
        'a bind mount adds files to the image\'s directory (it does not, it hides them).</p>' +
        '<p>Commands are shown without the container engine\'s name; the common engines differ little (the difference is noted at <code>volume prune</code>). Out of scope: tmpfs, volume drivers, network volumes, rootless storage paths (in the user\'s home) and the SELinux labels <code>:z</code>/<code>:Z</code> that a bind mount needs on a host with SELinux enforcing (e.g. RHEL).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
