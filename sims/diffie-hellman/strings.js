/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of diffie-hellman, in Croatian and English (docs/sim-ui.md §9). Same keys in both tables; the
   page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a
   glossary term (first mention; [[=term]] later ones). The title and subtitle come from sim.json.
   Formulas (5⁶ mod 23 = 8), symbols (p, g, a, A, s, m, M) and numbers are data (translate="no"), built by the page. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Alice i Bob dogovaraju zajedničku tajnu preko javnog kanala koji Eve prisluškuje',

      mode: 'Prikaz',
      modeNumbers: 'Brojevi',
      modeBoth: 'Oboje',
      modePaint: 'Boje',
      p: 'Prost broj p',
      g: 'Baza g',
      a: 'Alicina tajna a',
      b: 'Bobova tajna b',
      malloryParam: 'Mallory u sredini',

      presetTextbook: 'Primjer iz udžbenika',
      presetTextbookHint: 'p = 23, g = 5, a = 6, b = 15: oboje dobiju s = 2',
      presetPaint: 'Miješanje boja',
      presetPaintHint: 'Žuta zajednička, crvena i tirkizna tajne',
      presetSmall: 'Mali brojevi',
      presetSmallHint: 'a = 4: Eve ga nađe u 4 pokušaja',
      presetBadG: 'Loš g',
      presetBadGHint: 'g = 22 ima red 2: tajna može biti samo 1 ili 22',
      presetBigger: 'Veći p = 97',
      presetBiggerHint: 'Evina potraga raste s p: 36 od 95 pokušaja',
      presetMallory: 'Mallory u sredini',
      presetMalloryHint: 'Svaka strana dijeli ključ s Mallory, nitko to ne primijeti',

      legendPublic: 'javna vrijednost',
      legendSecret: 'tajna',
      legendShared: 'zajednička tajna',
      legendSent: 'poslano kanalom',
      legendEve: 'Evina kopija',
      legendChanged: 'promijenjeno',

      alice: 'Alice',
      bob: 'Bob',
      eve: 'Eve',
      mallory: 'Mallory',
      eveRole: 'prisluškuje i bilježi',
      malloryRole: 'presreće i podmeće',
      channel: 'javni kanal',
      knows: 'zna',
      empty: 'još ništa',

      cardPub: 'javno',
      cardSecret: 'tajno',
      cardMine: 'šalje',
      cardTheirs: 'stiglo',
      cardShared: 'zajednička tajna',
      cardCopy: 'kopija',
      cardCaught: 'presretnuto',
      cardForged: 'šalje na obje strane',
      cardKeyAlice: 'ključ s Alicom',
      cardKeyBob: 'ključ s Bobom',
      cardProduct: 'Evin prečac',
      cardSearch: 'Evina potraga',
      reallyM: 'zapravo M od Mallory',

      paintY: 'žuta',
      paintR: 'crvena',
      paintT: 'tirkizna',
      paintV: 'ljubičasta',
      paintCommon: 'zajednička boja',

      notS: '≠ s',
      isSByChance: '= s, slučajno',
      tries: '{tries} od {space} pokušaja',
      notA: 'x ≠ a, a daje isti s',
      orderLine: 's je jedna od {n} vrijednosti',
      realSize: 'pravi p: 2048 bita, 617 znamenki',
      unmix: 'boja se ne može razdvojiti',
      caught: 'presretnuto',
      asA: 'umjesto A',
      asB: 'umjesto B',
      bothWays: 'objema stranama',
      equal: 'jednako',
      different: 'različito',

      capStart: 'Alice i Bob žele zajedničku tajnu, a sve što pošalju ide javnim kanalom koji Eve prisluškuje. Korak 1: javni brojevi.',
      capStartMallory: 'Alice i Bob žele zajedničku tajnu, ali na kanalu sjedi Mallory: ona ne samo da čita, nego i mijenja poruke. Korak 1: javni brojevi.',
      capAgree: 'Javno dogovore {pub}: p je prost broj, g baza. {who} ih bilježi, oni nisu tajna.',
      capAlicePick: 'Alice tajno odabere {val}. Taj broj nikad ne napušta njezinu stranu.',
      capBobPick: 'Bob tajno odabere {val}. Ni on ga nikome ne šalje.',
      capAliceCompute: 'Alice računa {expr}. Za stvarno velik p iz A se a ne može izračunati, pa A smije poslati.',
      capBobCompute: 'Bob računa {expr}.',
      capSendA: 'Alice šalje {val} javnim kanalom; Eve ga bilježi.',
      capSendB: 'Bob šalje {val} Alici; Eve bilježi i njega. Eve sada ima p, g, A i B.',
      capAliceShared: 'Alice računa {expr}: Bobov B na svoju tajnu a.',
      capBobShared: 'Bob računa {expr}: Alicin A na svoju tajnu b.',
      capCompare: 'Oboje imaju s = {s}, a tajna nikad nije prošla kanalom: {why}.',
      capEveView: 'Eve ima p, g, A i B. Prečac A·B mod p = {prod} daje gᵃ⁺ᵇ, ne gᵃᵇ. Da nađe a, proba eksponente: ovdje {tries}, a pravi p ima 617 znamenki.{note}',
      capEveViewChance: 'Eve ima p, g, A i B. Prečac A·B mod p = {prod} ovdje slučajno jest s, ali Eve to ne zna jer s nema. Da nađe a, proba eksponente: {tries}.{note}',
      noteOrder: ' Ovaj g ima red {n}, pa s može biti samo jedna od {n} vrijednosti.',
      noteX: ' Evin x = {x} nije a, a daje isti s.',
      compareTitle: 'usporedba: s nije poslan',
      capCatchA: 'Alice šalje A = {A}, ali Mallory ga presretne: do Boba ne stigne ništa.',
      capForgeToBob: 'Mallory odabere svoju tajnu m = {m}, izračuna {expr} i pošalje ga Bobu kao da je to Alicin A.',
      capCatchB: 'Bob šalje B = {B}; Mallory presretne i njega.',
      capForgeToAlice: 'Mallory šalje isti M = {M} Alici, kao da je to Bobov B.',
      capAliceSharedM: 'Alice računa {expr}. Misli da je stigao Bobov B, a stigao je Mallorin M.',
      capBobSharedM: 'Bob računa {expr}. Misli da je stigao Alicin A, a stigao je Mallorin M.',
      capCompareM: 'Alice ima {sa}, Bob {sb}: različiti ključevi, a oboje misle da su uspjeli. Nitko ne vidi tuđi ključ, pa nitko ništa ne primijeti.',
      capCompareMSame: 'Alice i Bob slučajno imaju isti broj {sa}, ali ga ima i Mallory. Nitko ne zna da je netko u sredini.',
      capMalloryView: 'Mallory računa {ka} (ključ s Alicom) i {kb} (ključ s Bobom): drži oba, čita i ponovno šifrira sve. Obični DH ne provjerava tko je poslao A i B; TLS 1.3 zato potpisuje razmjenu.',

      capPaintStart: 'Analogija s bojom: miješanje je lako, a razdvajanje nemoguće. Alice i Bob žele istu boju, a sve što pošalju vidi Eve.',
      capPaintStartMallory: 'Analogija s bojom, a na kanalu Mallory: ona čita i mijenja ono što prolazi.',
      capPaintAgree: 'Javno dogovore zajedničku boju, žutu. {who} je vidi.',
      capPaintAlicePick: 'Alice tajno odabere crvenu.',
      capPaintBobPick: 'Bob tajno odabere tirkiznu.',
      capPaintAliceCompute: 'Alice umiješa svoju crvenu u žutu.',
      capPaintBobCompute: 'Bob umiješa svoju tirkiznu u žutu.',
      capPaintSendA: 'Alice šalje svoju mješavinu, žutu i crvenu; Eve je bilježi. Iz nje ne može izdvojiti crvenu.',
      capPaintSendB: 'Bob šalje svoju mješavinu, žutu i tirkiznu; Eve bilježi i nju.',
      capPaintAliceShared: 'Alice u Bobovu mješavinu doda svoju crvenu: žuta + tirkizna + crvena.',
      capPaintBobShared: 'Bob u Alicinu mješavinu doda svoju tirkiznu: žuta + crvena + tirkizna.',
      capPaintCompare: 'Oboje imaju istu boju, žuta + crvena + tirkizna: redoslijed miješanja nije važan, a tajne boje nisu prošle kanalom.',
      capPaintEveView: 'Eve pomiješa obje mješavine: 2 × žuta + crvena + tirkizna. Žute je previše, pa je nijansa drukčija, a boju ne može razdvojiti da izdvoji crvenu.',
      capPaintCatchA: 'Alice šalje svoju mješavinu, ali Mallory je presretne.',
      capPaintForgeToBob: 'Mallory umiješa svoju ljubičastu u žutu i pošalje to Bobu kao da je od Alice.',
      capPaintCatchB: 'Bob šalje svoju mješavinu; Mallory presretne i nju.',
      capPaintForgeToAlice: 'Mallory šalje istu mješavinu, žutu i ljubičastu, Alici.',
      capPaintAliceSharedM: 'Alice doda crvenu u ono što je stiglo: žuta + ljubičasta + crvena.',
      capPaintBobSharedM: 'Bob doda tirkiznu u ono što je stiglo: žuta + ljubičasta + tirkizna.',
      capPaintCompareM: 'Alice i Bob imaju različite boje, a oboje misle da su uspjeli.',
      capPaintMalloryView: 'Mallory doda ljubičastu u Alicinu i u Bobovu mješavinu: ima obje boje, Alicinu i Bobovu.',

      explain: '<p><strong>Problem.</strong> Dvije strane koje se nikad nisu srele žele <i lang="en">shared secret</i> (zajednička tajna), ' +
        'a imaju samo kanal koji netko prisluškuje. Diffie–Hellman je <i lang="en">key exchange</i> (razmjena ključa): ne šifrira poruku, ' +
        'nego dogovara ključ kojim će se poruke zatim šifrirati, i to tako da sam ključ nikad ne putuje.</p>' +
        '<p><strong>Boje.</strong> Pomiješati boje je lako, razdvojiti ih nemoguće. Svaka strana umiješa svoju tajnu boju u zajedničku i pošalje mješavinu; ' +
        'zatim u tuđu mješavinu doda svoju tajnu. Obje dobiju žutu + crvenu + tirkiznu, jer redoslijed miješanja nije važan.</p>' +
        '<p><strong>Brojevi.</strong> Javni su p, prost broj i <i lang="en">modulus</i> (modul), i baza g. Alice odabere a, svoj [[private key]], i pošalje ' +
        'A = gᵃ mod p, svoj [[public key]]; Bob isto s b. Alice računa Bᵃ, Bob Aᵇ, a oboje je ' +
        'gᵃᵇ mod p, jer (gᵇ)ᵃ = (gᵃ)ᵇ.</p>' +
        '<p><strong>Eve.</strong> <i lang="en">Eavesdropper</i> (prisluškivač) ima p, g, A i B. Umnožak A·B daje gᵃ⁺ᵇ, ne gᵃᵇ. ' +
        'Treba joj a, a do njega vodi <i lang="en">discrete logarithm</i> (diskretni logaritam): s p = 23 dovoljno je probati 21 eksponent. ' +
        'Pravi p ima 2048 bita i više (617 znamenki), a danas se najčešće koriste eliptičke krivulje (X25519), koje ovdje nisu prikazane.</p>' +
        '<p><strong>Mallory.</strong> DH sam ne provjerava tko je poslao A i B. Zato napadač, [[man in the middle]], u knjizi „čovjek u sredini”, ' +
        'dogovori jedan ključ s Alicom, drugi s Bobom, i čita sve. TLS 1.3 potpisuje razmjenu, a certifikat kaže čiji je ključ za potpis.</p>' +
        '<p><strong>Česte zablude.</strong> DH ne šifrira poruku, samo dogovara ključ. Zajednički ključ ni u jednom trenutku ne putuje. ' +
        'Sam DH ne zaustavlja aktivnog napadača.</p>'
    },
    en: {
      stage: 'Alice and Bob agree on a shared secret over a public channel that Eve listens to',

      mode: 'Show',
      modeNumbers: 'Numbers',
      modeBoth: 'Both',
      modePaint: 'Paint',
      p: 'Prime p',
      g: 'Base g',
      a: 'Alice\'s secret a',
      b: 'Bob\'s secret b',
      malloryParam: 'Mallory in the middle',

      presetTextbook: 'Textbook example',
      presetTextbookHint: 'p = 23, g = 5, a = 6, b = 15: both get s = 2',
      presetPaint: 'Paint mixing',
      presetPaintHint: 'Common yellow, secret red and teal',
      presetSmall: 'Small numbers',
      presetSmallHint: 'a = 4: Eve finds it in 4 tries',
      presetBadG: 'Bad g',
      presetBadGHint: 'g = 22 has order 2: the secret can only be 1 or 22',
      presetBigger: 'Bigger p = 97',
      presetBiggerHint: 'Eve\'s search grows with p: 36 of 95 tries',
      presetMallory: 'Mallory in the middle',
      presetMalloryHint: 'Each side shares a key with Mallory, and nobody notices',

      legendPublic: 'public value',
      legendSecret: 'secret',
      legendShared: 'shared secret',
      legendSent: 'sent over the channel',
      legendEve: 'Eve\'s copy',
      legendChanged: 'changed',

      alice: 'Alice',
      bob: 'Bob',
      eve: 'Eve',
      mallory: 'Mallory',
      eveRole: 'listens and records',
      malloryRole: 'intercepts and substitutes',
      channel: 'public channel',
      knows: 'knows',
      empty: 'nothing yet',

      cardPub: 'public',
      cardSecret: 'secret',
      cardMine: 'sends',
      cardTheirs: 'arrived',
      cardShared: 'shared secret',
      cardCopy: 'copy',
      cardCaught: 'intercepted',
      cardForged: 'sends to both',
      cardKeyAlice: 'key with Alice',
      cardKeyBob: 'key with Bob',
      cardProduct: 'Eve\'s shortcut',
      cardSearch: 'Eve\'s search',
      reallyM: 'really Mallory\'s M',

      paintY: 'yellow',
      paintR: 'red',
      paintT: 'teal',
      paintV: 'violet',
      paintCommon: 'common paint',

      notS: '≠ s',
      isSByChance: '= s, by chance',
      tries: '{tries} of {space} tries',
      notA: 'x ≠ a, yet the same s',
      orderLine: 's is one of {n} values',
      realSize: 'real p: 2048 bits, 617 digits',
      unmix: 'paint cannot be un-mixed',
      caught: 'intercepted',
      asA: 'in place of A',
      asB: 'in place of B',
      bothWays: 'to both sides',
      equal: 'equal',
      different: 'different',

      capStart: 'Alice and Bob want a shared secret, and everything they send goes over a public channel that Eve listens to. Step 1: the public numbers.',
      capStartMallory: 'Alice and Bob want a shared secret, but Mallory sits on the channel: she does not just read messages, she changes them. Step 1: the public numbers.',
      capAgree: 'They agree in the open on {pub}: p is a prime, g the base. {who} records them; they are not secret.',
      capAlicePick: 'Alice secretly picks {val}. This number never leaves her side.',
      capBobPick: 'Bob secretly picks {val}. He sends it to nobody either.',
      capAliceCompute: 'Alice computes {expr}. For a real-size p, a cannot be worked back out of A, so she may send A.',
      capBobCompute: 'Bob computes {expr}.',
      capSendA: 'Alice sends {val} over the public channel; Eve records it.',
      capSendB: 'Bob sends {val} to Alice; Eve records it too. Eve now has p, g, A and B.',
      capAliceShared: 'Alice computes {expr}: Bob\'s B to the power of her secret a.',
      capBobShared: 'Bob computes {expr}: Alice\'s A to the power of his secret b.',
      capCompare: 'Both now hold s = {s}, and the secret never crossed the channel: {why}.',
      capEveView: 'Eve has p, g, A and B. Her shortcut A·B mod p = {prod} gives gᵃ⁺ᵇ, not gᵃᵇ. To find a she tries exponents: here {tries}, but a real p has 617 digits.{note}',
      capEveViewChance: 'Eve has p, g, A and B. Her shortcut A·B mod p = {prod} happens to equal s here, but Eve cannot know, since she does not have s. To find a she tries exponents: {tries}.{note}',
      noteOrder: ' This g has order {n}, so s can only be one of {n} values.',
      noteX: ' Eve\'s x = {x} is not a, yet gives the same s.',
      compareTitle: 'comparison: s is not sent',
      capCatchA: 'Alice sends A = {A}, but Mallory intercepts it: nothing reaches Bob.',
      capForgeToBob: 'Mallory picks her own secret m = {m}, computes {expr} and sends it to Bob as if it were Alice\'s A.',
      capCatchB: 'Bob sends B = {B}; Mallory intercepts it too.',
      capForgeToAlice: 'Mallory sends the same M = {M} to Alice, as if it were Bob\'s B.',
      capAliceSharedM: 'Alice computes {expr}. She thinks Bob\'s B arrived; Mallory\'s M did.',
      capBobSharedM: 'Bob computes {expr}. He thinks Alice\'s A arrived; Mallory\'s M did.',
      capCompareM: 'Alice holds {sa}, Bob {sb}: different keys, yet both think they succeeded. Neither sees the other\'s key, so nobody notices.',
      capCompareMSame: 'Alice and Bob happen to hold the same number {sa}, but Mallory holds it too. Nobody knows someone is in the middle.',
      capMalloryView: 'Mallory computes {ka} (key with Alice) and {kb} (key with Bob): she holds both, reads and re-encrypts everything. Plain DH does not check who sent A and B; that is why TLS 1.3 signs the exchange.',

      capPaintStart: 'The paint analogy: mixing is easy, un-mixing impossible. Alice and Bob want the same colour, and Eve sees everything they send.',
      capPaintStartMallory: 'The paint analogy, with Mallory on the channel: she reads and changes what passes.',
      capPaintAgree: 'They agree in the open on a common paint, yellow. {who} sees it.',
      capPaintAlicePick: 'Alice secretly picks red.',
      capPaintBobPick: 'Bob secretly picks teal.',
      capPaintAliceCompute: 'Alice mixes her red into the yellow.',
      capPaintBobCompute: 'Bob mixes his teal into the yellow.',
      capPaintSendA: 'Alice sends her mixture, yellow and red; Eve records it. She cannot get the red back out of it.',
      capPaintSendB: 'Bob sends his mixture, yellow and teal; Eve records it too.',
      capPaintAliceShared: 'Alice adds her red to Bob\'s mixture: yellow + teal + red.',
      capPaintBobShared: 'Bob adds his teal to Alice\'s mixture: yellow + red + teal.',
      capPaintCompare: 'Both hold the same colour, yellow + red + teal: the order of mixing does not matter, and the secret paints never crossed the channel.',
      capPaintEveView: 'Eve mixes the two mixtures: 2 × yellow + red + teal. Too much yellow, so the shade differs, and she cannot un-mix it to get the red out.',
      capPaintCatchA: 'Alice sends her mixture, but Mallory intercepts it.',
      capPaintForgeToBob: 'Mallory mixes her violet into the yellow and sends it to Bob as if it came from Alice.',
      capPaintCatchB: 'Bob sends his mixture; Mallory intercepts it too.',
      capPaintForgeToAlice: 'Mallory sends the same mixture, yellow and violet, to Alice.',
      capPaintAliceSharedM: 'Alice adds red to what arrived: yellow + violet + red.',
      capPaintBobSharedM: 'Bob adds teal to what arrived: yellow + violet + teal.',
      capPaintCompareM: 'Alice and Bob hold different colours, yet both think they succeeded.',
      capPaintMalloryView: 'Mallory adds her violet to Alice\'s mixture and to Bob\'s: she holds both colours, Alice\'s and Bob\'s.',

      explain: '<p><strong>The problem.</strong> Two parties who have never met want a shared secret, ' +
        'and all they have is a channel someone is listening to. Diffie–Hellman is a key exchange: it does not encrypt the message, ' +
        'it agrees on the key the messages will then be encrypted with, and the key itself never travels.</p>' +
        '<p><strong>Paint.</strong> Mixing paint is easy, un-mixing it impossible. Each side mixes its secret paint into the common one and sends the mixture; ' +
        'then it adds its secret to the other side\'s mixture. Both end with yellow + red + teal, because the order of mixing does not matter.</p>' +
        '<p><strong>Numbers.</strong> Public are p, a prime and the modulus, and the base g. Alice picks a, her [[private key]], and sends ' +
        'A = gᵃ mod p, her [[public key]]; Bob does the same with b. Alice computes Bᵃ, Bob Aᵇ, and both are ' +
        'gᵃᵇ mod p, because (gᵇ)ᵃ = (gᵃ)ᵇ.</p>' +
        '<p><strong>Eve.</strong> The eavesdropper has p, g, A and B. The product A·B gives gᵃ⁺ᵇ, not gᵃᵇ. ' +
        'She needs a, and the way to it is a discrete logarithm: with p = 23 trying 21 exponents is enough. ' +
        'A real p has 2048 bits or more (617 digits), and today elliptic curves (X25519) are used most, which are not shown here.</p>' +
        '<p><strong>Mallory.</strong> DH on its own does not check who sent A and B. A [[man in the middle]] therefore ' +
        'agrees one key with Alice and another with Bob, and reads everything. TLS 1.3 signs the exchange, and a certificate says whose signing key it is.</p>' +
        '<p><strong>Common misconceptions.</strong> DH does not encrypt the message; it only agrees a key. The shared key never travels at any point. ' +
        'DH on its own does not stop an active attacker.</p>'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
