/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of lnx-overlayfs-layers, in both languages (docs/sim-ui.md §9). Same keys in hr and en.
   {name} is a placeholder (in captions a node: paths, file names, sizes and layer names are data), an array is plural
   forms (hr: 1 / 2–4 / 5+, en: 1 / other), [[term]] a glossary term (first mention; [[=term]] later ones).
   In captions *word* is an English term in italics (the Croatian term rule, for terms the glossary lacks) and `x` is
   code. The title and subtitle come from sim.json. */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Slojevi slike i gornji sloj kontejnera, stupac po datoteci',
      // panel
      scene: 'Primjer',
      container: 'Tko mijenja datoteku',
      containerHint: 'Drugi kontejner najprije samo čita, a na kraju i sam piše.',
      showSizes: 'Veličine',
      pEdit: 'Uredi konfiguraciju',
      pEditHint: 'Prvo pisanje kopira cijelu datoteku naviše.',
      pBig: 'Velika datoteka',
      pBigHint: 'Jedan redak na datoteku od 200 MB.',
      pDelete: 'Brisanje',
      pDeleteHint: 'Oznaka brisanja ili obično brisanje.',
      pTwo: 'Dva kontejnera',
      pTwoHint: 'Ista slika, svaki svoj gornji sloj.',
      pBuild: 'Gradnja: RUN rm',
      pBuildHint: 'Brisanje u kasnijem sloju ne smanjuje sliku.',
      pOpaque: 'Neprozirni direktorij',
      pOpaqueHint: 'rm -rf pa mkdir nad direktorijem iz slike.',
      // legend
      legChanged: 'promijenjeno u ovom koraku',
      legRO: 'sloj slike, samo za čitanje',
      legUpper: 'gornji sloj, za pisanje',
      legCopied: 'kopirano naviše',
      legWh: 'oznaka brisanja',
      legOpq: 'neprozirni direktorij',
      // grid
      gridTitle: 'Što koji sloj sadrži',
      rowSees: '{c} vidi',
      rowUpper: '{c} gornji',
      rowBuild: 'RUN',
      rowNone: 'nema kontejnera',
      notYet: 'još ne postoji',
      dir: 'direktorij',
      opaque: 'neprozirni',
      cntUpper: 'gornji {c}: {size}',
      cntImage: 'slika: {size}',
      metaImage: 'slika {size}',
      metaUpper: 'gornji RUN: {size}',
      outRead: '{size}, iz sloja {from}',
      outReadUp: '{size}, iz gornjeg sloja kontejnera {c}',
      outEmpty: '(prazno)',
      outSaved: 'spremljeno kao {layer}',
      // captions: start
      capStart_edit: 'Slika ima dva sloja samo za čitanje: L1 s {conf}, L2 s {index}. Kontejner A počinje s praznim gornjim slojem; ono što A vidi spojeno je iz svih slojeva.',
      capStart_big: 'L2 sadrži dnevnik {log} od 200 MB. Kontejner A još nije ništa zapisao: gornji sloj je prazan.',
      capStart_delete: 'Slika ima jedan sloj, L1, s tri datoteke. Kontejner A će stvoriti jednu datoteku i obrisati dvije.',
      capStart_two: 'Kontejneri A i B pokrenuti su iz iste slike: dijele L1 i L2, a svaki ima svoj prazni gornji sloj.',
      capStart_build: 'Gradnja slike počinje od osnovnog sloja L1 ({img}). Svaka naredba RUN koja mijenja datoteke dodat će jedan sloj.',
      capStart_opaque: 'Direktorij {dir} postoji u L1 (dvije datoteke) i u L2 (jedna). Kontejner A ga briše i stvara ponovno.',
      // captions: reads and lookup
      capReadLower: 'Traženje ide odozgo: gornji sloj kontejnera {c} nema {name}, a {from} ima, pa se čita iz sloja {from}. Ništa se ne kopira: gornji sloj ostaje {up}.',
      capReadUpper: 'Traženje staje već u gornjem sloju kontejnera {c}: ondje je njegova kopija datoteke {name}, pa čitanje ne stiže do sloja {from}, koji i dalje čuva izvornik.',
      capReadOther: 'Gornji sloj kontejnera {c} nema {name}: {c} i dalje čita izvornik iz sloja {from}. Kopija kontejnera {e} postoji samo u gornjem sloju kontejnera {e}.',
      capReadShared: 'I {c} čita {name} iz sloja {from}: oba kontejnera čitaju istu datoteku slike, koja na disku postoji samo jednom.',
      // captions: writes
      capCopyUp: 'Prvo pisanje u {name} kopira cijelu datoteku u gornji sloj (*copy-up*, kopiranje naviše); donji sloj slike ostaje netaknut.',
      capCopied: 'Kopirano {copied}, dopisano {added}: gornji sloj sada ima {up}.',
      capWhole: 'Kopira se cijela datoteka, a ne blok: dopisanih {added} stajalo je {copied}.',
      capChmod: '`chmod` mijenja samo metapodatke, a ipak se najprije kopira cijela datoteka {name} ({copied}) u gornji sloj. {from} zadržava stara prava.',
      capWrite: '{name} je već u gornjem sloju: obično pisanje od {added}, ništa se ne kopira ponovno. Gornji sloj sada ima {up}.',
      capNew: 'Nijedan sloj ispod nema {name}: nova datoteka ({added}) piše se ravno u gornji sloj, bez kopiranja.',
      capOwn: '{c} dobiva vlastitu kopiju u svom gornjem sloju; kopija kontejnera {e} i datoteka u sloju {from} ostaju kakve su bile.',
      // captions: deletes
      capRm: '`rm` ne briše ništa iz slike: u gornjem sloju nastaje *whiteout* (oznaka brisanja) koja skriva datoteku.',
      capRmStill: '{from} i dalje sadrži {name} ({size}).',
      capRmDropped: 'Pritom nestaje i kopija od {dropped} iz gornjeg sloja, a {from} i dalje sadrži svojih {size}.',
      capRemoved: '{name} je postojala samo u gornjem sloju: jednostavno se briše, bez oznake brisanja, jer ispod nema ničega što bi trebalo skriti.',
      capMissWh: 'Traženje staje na oznaci brisanja u gornjem sloju: `No such file or directory`. {from} i dalje sadrži {name}, samo skrivenu.',
      capMissNone: 'Nijedan sloj nema {name}: traženje stiže do dna i ne nalazi ništa. Ispod nikad nije bilo te datoteke, pa `rm` nije ostavio oznaku brisanja.',
      // captions: directories
      capLsMerge: '{dir} postoji i u L1 i u L2: spojeni direktorij navodi uniju, {n} unosa ({list}).',
      capLsHidden: '`ls` spaja direktorij {dir} iz svih slojeva: {list}. Datoteku {hidden} skriva oznaka brisanja, iako je {from} još sadrži.',
      capRmrf: '`rm -rf` {dir}: direktorij je u donjim slojevima, pa gornji sloj dobiva jedan *whiteout* (oznaku brisanja) za {dir}. On skriva direktorij i sve unose ispod njega.',
      capOpaque: '`mkdir` {dir} nad oznakom brisanja stvara *opaque directory* (neprozirni direktorij, `trusted.overlay.opaque=y`): novi {dir} je prazan, a unosi iz donjih slojeva ostaju skriveni.',
      capLsOpaque: '`ls` {dir} ne ispisuje ništa: neprozirni direktorij u gornjem sloju zaustavlja traženje, iako L1 i L2 i dalje čuvaju {n} datoteke.',
      // captions: image build
      capRunInstall: 'Gradnja slike: RUN se izvodi u privremenom kontejneru nad dosadašnjom slikom; sve što zapiše ({bytes}) završava u gornjem sloju tog kontejnera.',
      capCommit: 'Gornji sloj sprema se kao novi sloj {layer}, samo za čitanje: slika sada ima {img}.',
      capRunRm: 'RUN `rm -rf` {dir}: datoteke su u sloju L2, koji se više ne mijenja, pa gornji sloj dobiva samo *whiteout* (oznaku brisanja, 0 B).',
      capCommitWh: 'L3 sadrži samo oznaku brisanja, bez podataka datoteka (`.wh.dnf` u arhivi sloja). Slika se ne smanjuje: i dalje ima {img}.',
      capBuildLs: 'Kontejner iz gotove slike: `ls` {dir} javlja da ga nema, jer ga skriva oznaka brisanja u L3. Kontejner vidi {seen}, a slika i dalje zauzima {img}.',
      explain:
        '<p>Datoteke kontejnera nisu zasebna kopija slike (<em lang="en">image</em>): one su [[file system]] složen od <em lang="en">layers</em> (slojeva). ' +
        'Slojevi slike su samo za čitanje i dijele ih svi kontejneri pokrenuti iz nje. Svaki kontejner dobiva vlastiti prazni gornji sloj za pisanje, a ono što vidi spojeno je iz svih slojeva.</p>' +
        '<p><b>Traženje</b> ide odozgo: gornji sloj, pa slojevi slike od najvišeg do osnovnog. Prvi sloj koji ima ime pobjeđuje; ' +
        'isti [[directory]] u više slojeva spaja se u uniju unosa. Čitanje se poslužuje iz sloja u kojem je datoteka; ništa se ne kopira.</p>' +
        '<p><b>Prvo pisanje</b> (ili promjena prava) datoteke iz slike kopira <em>cijelu</em> datoteku u gornji sloj (<em lang="en">copy-up</em>, kopiranje naviše) i mijenja je ondje. ' +
        'Kopira se po datoteci, a ne po bloku: jedan redak dopisan datoteci od 200 MB stavlja 200 MB u gornji sloj.</p>' +
        '<p><b>Brisanje</b> imena iz slike ostavlja u gornjem sloju <em lang="en">whiteout</em> (oznaku brisanja) koja ga skriva; sloj slike ostaje isti. ' +
        'Ime koje postoji samo u gornjem sloju jednostavno se briše. Direktorij iz slike koji obrišeš i ponovno stvoriš postaje <em lang="en">opaque directory</em> (neprozirni direktorij): unosi ispod njega ostaju skriveni.</p>' +
        '<p><b>Gradnja slike:</b> svaka naredba RUN koja mijenja datoteke sprema se kao novi sloj. <code>rm</code> u kasnijem sloju dodaje samo oznaku brisanja, pa se slika ne smanjuje.</p>' +
        '<p><b>Česte zablude:</b> brisanje u kasnijem sloju smanjuje sliku (ne smanjuje); slojevi pamte razlike po blokovima (kopira se cijela datoteka); ' +
        'izmjena u jednom kontejneru mijenja sliku koju koriste drugi (ne mijenja: slojevi slike se nikad ne pišu).</p>'
    },
    en: {
      stage: 'The image layers and the container\'s upper layer, one column per file',
      // panel
      scene: 'Example',
      container: 'Who edits the file',
      containerHint: 'The other container reads first and writes only at the end.',
      showSizes: 'Sizes',
      pEdit: 'Edit a config file',
      pEditHint: 'The first write copies the whole file up.',
      pBig: 'A big file',
      pBigHint: 'One line appended to a 200 MB file.',
      pDelete: 'Deleting',
      pDeleteHint: 'A whiteout, or a plain removal.',
      pTwo: 'Two containers',
      pTwoHint: 'One image, an upper layer each.',
      pBuild: 'Build: RUN rm',
      pBuildHint: 'Deleting in a later layer does not shrink the image.',
      pOpaque: 'Opaque directory',
      pOpaqueHint: 'rm -rf, then mkdir, over a directory from the image.',
      // legend
      legChanged: 'changed in this step',
      legRO: 'image layer, read-only',
      legUpper: 'upper layer, writable',
      legCopied: 'copied up',
      legWh: 'whiteout',
      legOpq: 'opaque directory',
      // grid
      gridTitle: 'What each layer holds',
      rowSees: '{c} sees',
      rowUpper: '{c} upper',
      rowBuild: 'RUN',
      rowNone: 'no container',
      notYet: 'not there yet',
      dir: 'directory',
      opaque: 'opaque',
      cntUpper: 'upper {c}: {size}',
      cntImage: 'image: {size}',
      metaImage: 'image {size}',
      metaUpper: 'RUN upper: {size}',
      outRead: '{size}, from {from}',
      outReadUp: '{size}, from {c}\'s upper layer',
      outEmpty: '(empty)',
      outSaved: 'saved as {layer}',
      // captions: start
      capStart_edit: 'The image has two read-only layers: L1 with {conf}, L2 with {index}. Container A starts with an empty upper layer; what A sees is merged from all the layers.',
      capStart_big: 'L2 holds the 200 MB log {log}. Container A has written nothing yet: its upper layer is empty.',
      capStart_delete: 'The image has one layer, L1, with three files. Container A will create one file and delete two.',
      capStart_two: 'Containers A and B were started from the same image: they share L1 and L2, and each has its own empty upper layer.',
      capStart_build: 'The image build starts from the base layer L1 ({img}). Every RUN that changes files will add one layer.',
      capStart_opaque: 'The directory {dir} is in L1 (two files) and in L2 (one). Container A deletes it and creates it again.',
      // captions: reads and lookup
      capReadLower: 'Lookup goes top-down: {c}\'s upper layer has no {name}, {from} does, so the read is served from {from}. Nothing is copied: the upper layer stays {up}.',
      capReadUpper: 'Lookup stops at once in {c}\'s upper layer: its own copy of {name} is there, so the read never reaches {from}, which still holds the original.',
      capReadOther: '{c}\'s upper layer has no {name}: {c} still reads the original from {from}. {e}\'s copy is in {e}\'s upper layer only.',
      capReadShared: '{c} reads {name} from {from} too: both containers read the same image file, stored once on disk.',
      // captions: writes
      capCopyUp: 'The first write to {name} copies the whole file into the upper layer (*copy-up*); the image\'s lower layer is untouched.',
      capCopied: '{copied} copied, {added} appended: the upper layer now holds {up}.',
      capWhole: 'Copy-up is per file, not per block: appending {added} cost {copied}.',
      capChmod: '`chmod` changes only metadata, yet the whole {name} ({copied}) is copied up first. {from} keeps the old mode.',
      capWrite: '{name} is in the upper layer already: a plain write of {added}, nothing is copied again. The upper layer now holds {up}.',
      capNew: 'No layer below has {name}: the new file ({added}) is written straight into the upper layer, no copy-up.',
      capOwn: '{c} gets its own copy in its own upper layer; {e}\'s copy and the file in {from} stay as they were.',
      // captions: deletes
      capRm: '`rm` deletes nothing from the image: a *whiteout* appears in the upper layer and hides the file.',
      capRmStill: '{from} still holds {name} ({size}).',
      capRmDropped: 'The {dropped} copy in the upper layer goes with it, and {from} still holds its {size}.',
      capRemoved: '{name} was only in the upper layer: it is simply removed, with no whiteout, since nothing below needs hiding.',
      capMissWh: 'Lookup stops at the whiteout in the upper layer: `No such file or directory`. {from} still holds {name}, hidden.',
      capMissNone: 'No layer has {name}: the lookup reaches the bottom and finds nothing. Nothing was ever below, so `rm` left no whiteout.',
      // captions: directories
      capLsMerge: '{dir} is in L1 and in L2: the merged directory lists the union, {n} entries ({list}).',
      capLsHidden: '`ls` merges {dir} over all the layers: {list}. {hidden} is hidden by the whiteout, though {from} still holds it.',
      capRmrf: '`rm -rf` {dir}: the directory is in the lower layers, so the upper layer gets one whiteout for {dir}. It hides the directory and every entry under it.',
      capOpaque: '`mkdir` {dir} over the whiteout makes an *opaque directory* (`trusted.overlay.opaque=y`): the new {dir} is empty, and the lower entries stay hidden.',
      capLsOpaque: '`ls` {dir} lists nothing: the opaque directory in the upper layer stops the lookup, though L1 and L2 still hold {n} files.',
      // captions: image build
      capRunInstall: 'Image build: RUN runs in a temporary container over the image so far; everything it writes ({bytes}) lands in that container\'s upper layer.',
      capCommit: 'The upper layer is saved as a new read-only layer {layer}: the image now holds {img}.',
      capRunRm: 'RUN `rm -rf` {dir}: the files are in L2, which never changes again, so the upper layer gets only a whiteout (0 B).',
      capCommitWh: 'L3 holds only a whiteout, no file data (`.wh.dnf` in the layer archive). The image does not shrink: still {img}.',
      capBuildLs: 'A container from the finished image: `ls` {dir} says there is no such directory, hidden by the whiteout in L3. The container sees {seen}; the image still takes {img}.',
      explain:
        '<p>A container\'s files are not a separate copy of the image: they are a [[file system]] stacked from layers. ' +
        'The image\'s layers are read-only and shared by every container started from it. Each container gets its own empty, writable upper layer, and what it sees is merged from all the layers.</p>' +
        '<p><b>Lookup</b> goes top-down: the upper layer, then the image layers from the topmost to the base. The first layer that has the name wins; ' +
        'the same [[directory]] in several layers merges into the union of its entries. A read is served from the layer that holds the file; nothing is copied.</p>' +
        '<p><b>The first write</b> (or a mode change) to a file from the image copies the <em>whole</em> file into the upper layer (copy-up) and changes it there. ' +
        'It is per file, not per block: one line appended to a 200 MB file puts 200 MB in the upper layer.</p>' +
        '<p><b>Deleting</b> a name from the image leaves a whiteout in the upper layer that hides it; the image layer stays the same. ' +
        'A name that exists only in the upper layer is simply removed. A directory from the image that you delete and create again becomes opaque: the entries below stay hidden.</p>' +
        '<p><b>Image build:</b> each RUN that changes files is saved as a new layer. An <code>rm</code> in a later layer adds only a whiteout, so the image does not shrink.</p>' +
        '<p><b>Common mistakes:</b> deleting in a later layer shrinks the image (it does not); layers store block differences (whole files are copied); ' +
        'an edit in one container changes the image the others use (it does not: image layers are never written).</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
