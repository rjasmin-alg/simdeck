/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of digital-signature, in Croatian and English (docs/sim-ui.md §9). Same keys in both tables;
   the page looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a
   glossary term (first mention; [[=term]] later ones). The title and subtitle come from sim.json.
   The message ("Plati 100 EUR") is data: the same string in both languages, because its hash is what is signed;
   the English table glosses it. Formulas (s = 2363²⁷⁵³ mod 3233 = 1834) and numbers are data, built by the page.
   Terms missing from kit/glossary.js are written out (NOTES.md, Term pairs). */
(function (root) {
  var strings = {
    hr: {
      stage: 'Alice potpisuje poruku, Mallory je na mreži, Bob provjerava potpis',

      msg: 'Poruka',
      msg100: 'Plati 100 EUR',
      msg900: 'Plati 900 EUR',
      attack: 'Mallory',
      attackNone: 'ništa',
      attackEdit: 'mijenja',
      attackResign: 'potpisuje',
      attackSwap: 'ključ',
      attackHint: 'ništa · mijenja poruku · potpisuje svojim ključem · podmeće Bobu svoj javni ključ',
      showNumbers: 'Brojevi',

      presetHonest: 'Pošteno',
      presetHonestHint: 'Bob dobiva v = 2363 = h\': potpis je valjan',
      presetTamper: 'Izmijenjena poruka',
      presetTamperHint: 'Plati 900 EUR, a potpis ostaje 1834: h\' = 233 ≠ v',
      presetResign: 'Mallorin potpis',
      presetResignHint: 'Mallory potpiše svojim ključem, Bob provjerava Alicinim: ne prolazi',
      presetSwap: 'Podmetnut ključ',
      presetSwapHint: 'Bob ima Mallorin javni ključ pod Alicinim imenom: krivotvorina prolazi',

      legendPriv: 'privatni ključ',
      legendPub: 'javni ključ',
      legendMsg: 'poruka',
      legendSig: 'potpis',
      legendOk: 'valjan',
      legendBad: 'nevaljan',
      legendChanged: 'promijenjeno',

      alice: 'Alice',
      bob: 'Bob',
      mallory: 'Mallory',
      roleAlice: 'potpisuje',
      roleMallory: 'na mreži: čita i mijenja',
      roleBob: 'provjerava',
      privKey: 'privatni',
      pubKey: 'javni',
      bobKey: 'javni ključ „Alice”',
      reallyMallory: 'zapravo Mallorin',

      workAlice: 'Alice računa',
      workMallory: 'Mallory',
      workBob: 'Bob računa',
      rowMsg: 'poruka m',
      rowHash: 'sažetak h',
      rowSig: 'potpis s',
      rowRecv: 'stiglo m\'',
      rowHashRecv: 'sažetak h\'',
      rowRecovered: 'iz potpisa v',
      rowSees: 'vidi',
      rowDoes: 'radi',
      rowHerHash: 'njezin sažetak',
      rowHerSig: 'njezin potpis',
      quoted: '„{m}”',
      notYet: '—',
      doesNone: 'ništa, samo prosljeđuje',
      doesEdit: 'mijenja poruku, potpis ostavlja',
      doesResign: 'potpisuje svoju poruku svojim ključem',
      doesSwap: 'podmeće Bobu svoj javni ključ i potpisuje svoju poruku',
      waiting: 'čeka',

      pairTitle: 'Poruka i potpis',
      pairAtAlice: 'kod Alice',
      pairOnNet: 'na mreži',
      pairToBob: 'Mallory → Bob',
      pairAtBob: 'kod Boba',
      pairNone: 'Alice još nije napisala poruku',
      cardMsg: 'poruka',
      cardSig: 'potpis',
      wasMsg: 'bilo',
      sigFromAlice: 'Alicinim ključem',
      sigFromMallory: 'Mallorinim ključem',
      unsigned: 'još nije potpisana',
      chip: 'm + s',
      readable: 'čitljiva svima na putu',

      checkTitle: 'Bobova provjera',
      checkWait: 'Bob uspoređuje v i h\' u koraku 8',
      valid: 'valjan',
      invalid: 'nevaljan',
      canTitle: 'Bob može zaključiti',
      cannotTitle: 'Bob ne može zaključiti',
      canAuthentic1: 'poruka nije mijenjana',
      canAuthentic2: 'potpisao ju je vlasnik para ključeva koji Bob drži kao Alicin',
      canAuthentic3: 'ako je ključ zaista Alicin, ona ne može poreći potpis',
      cannotAuthentic1: 'da je poruka bila tajna: Mallory ju je pročitala',
      canReject1: 'nešto je promijenjeno: poruka ili potpis',
      canReject2: 'poruku treba odbaciti',
      cannotReject1: 'što je promijenjeno, tko je to učinio i kako je poruka glasila',
      canWrong1: 'potpisana je privatnim ključem para čiji javni ključ ima',
      cannotWrong1: 'da je to Alicin ključ: Mallorin je. Ključ s imenom veže certifikat',
      canToy1: 'ništa: ovo je slučajnost malih brojeva',
      cannotToy1: 'da je poruka Alicina, unatoč „valjan”',
      toyCollision: 'kolizija sažetka mod n, slučajnost malih brojeva, nemoguća kod pravih veličina',
      toyChance: 'slučajno podudaranje malih brojeva, nemoguće kod pravih veličina',

      capStart: 'Alice ima privatni ključ, Bob njezin javni. Poruka putuje kroz mrežu na kojoj je Mallory. Korak 1: Alice piše poruku.',
      capWrite: 'Alice piše nalog {msg}.',
      capHash: 'Alice računa sažetak poruke: {expr}. Potpisuje se sažetak, ne cijela poruka.',
      capSign: 'Alice potpisuje sažetak svojim privatnim ključem: {expr}. Taj ključ nikad ne napušta Alice.',
      capSend: 'Poruka i potpis putuju zajedno. Mallory čita poruku {msg}: potpis ne skriva sadržaj.',
      capNone: 'Mallory ništa ne mijenja i prosljeđuje poruku i potpis Bobu.',
      capEdit: 'Mallory mijenja poruku u {msg}, a potpis {sig} ostavlja: novi ne zna izračunati bez Alicinog privatnog ključa.',
      capResign: 'Mallory piše {msg} i potpisuje je svojim privatnim ključem: {expr}.',
      capSwap: 'Mallory podmeće Bobu svoj javni ključ pod Alicinim imenom, a {msg} potpisuje svojim privatnim: {expr}.',
      capBobHash: 'Bob računa sažetak poruke koju je primio: {expr}.',
      capRecover: 'Bob iz potpisa javnim ključem koji ima vraća sažetak: {expr}.',
      capRecoverMallory: 'Bob iz potpisa vraća sažetak ključem koji misli da je Alicin, a Mallorin je: {expr}.',
      capValid: 'Bob uspoređuje: {cmp}. Potpis je valjan.',
      capInvalidEdit: 'Bob dobiva {v}, a sažetak primljene poruke je {h}: poruka je mijenjana.',
      capInvalidResign: 'Bob dobiva {v}, a sažetak je {h}: potpis nije napravljen Alicinim privatnim ključem.',
      capValidWrong: 'Bob uspoređuje: {cmp}. Valjan, jer je Mallorin potpis provjeren Mallorinim ključem.',
      capValidToy: 'Bob uspoređuje: {cmp}, iako je poruka mijenjana: {why}.',
      capConcludeAuthentic: 'Bob zna da poruka nije mijenjana i da ju je potpisao vlasnik privatnog ključa za ključ koji drži kao Alicin. Poruka nije bila tajna.',
      capConcludeReject: 'Bob odbacuje poruku. Mi vidimo što se dogodilo, a Bob vidi samo v ≠ h\': ne zna je li mijenjana poruka ili potpis, ni tko je to učinio.',
      capConcludeWrong: 'Bob misli da Alice traži {msg}. Potpis dokazuje samo da potpisnik ima privatni ključ za javni ključ koji Bob ima, a ne čiji je. To rješava certifikat.',
      capConcludeToy: 'Kod pravih veličina ovo se ne događa: {why}.',

      explain: '<p><strong>Ideja.</strong> <i lang="en">Digital signature</i> (digitalni potpis) računa onaj tko ima ' +
        '[[private key]], a provjeriti ga može svatko tko ima [[public key]]. ' +
        'Potpisuje se <i lang="en">hash</i> (sažetak) poruke: s = hᵈ mod n. Bob računa h\' iz poruke koju je primio ' +
        'i v = sᵉ mod n iz potpisa; potpis je valjan ako je v = h\'.</p>' +
        '<p><strong>Što daje.</strong> <i lang="en">Integrity</i> (cjelovitost): svaka promjena poruke mijenja h\', pa v ≠ h\'. ' +
        '<i lang="en">Authenticity</i> (autentičnost): potpis bez privatnog ključa ne prolazi. ' +
        '<i lang="en">Non-repudiation</i> (neporecivost): potpisnik ne može reći da nije potpisao.</p>' +
        '<p><strong>Što ne daje.</strong> Poruka putuje otvoreno: potpis nije šifriranje i ne skriva sadržaj. ' +
        'Potpis dokazuje da potpisnik ima privatni ključ za javni ključ koji Bob ima, ali ne i čiji je to ključ. ' +
        'Vezu ključa i imena daje [[certificate]].</p>' +
        '<p><strong>Mali brojevi.</strong> Ovo je udžbenički RSA (p = 61, q = 53, n = 3233, e = 17, d = 2753), a sažetak je ' +
        'SHA-256 mod n, bez dopune (PKCS #1 je propisuje). S tako malim n dvije poruke mogu imati isti sažetak (1 prema 3233); ' +
        'pravi ključevi imaju 2048 bita i više.</p>' +
        '<p><strong>Česte zablude.</strong> „Potpisivanje je šifriranje privatnim ključem, pa je poruka tajna”: nije, svatko je čita. ' +
        '„Valjan potpis dokazuje tko je poslao poruku”: samo ako je javni ključ zaista pošiljateljev. ' +
        '„Svejedno je potpisuje li se poruka ili sažetak”: RSA može potpisati samo broj manji od n, a potpis bez sažetka ' +
        'može se krivotvoriti (odabere se s i izračuna m = sᵉ mod n). Sažetak je kratak, stalne duljine i ne da se tako namjestiti.</p>'
    },
    en: {
      stage: 'Alice signs a message, Mallory is on the network, Bob verifies the signature',

      msg: 'Message',
      msg100: 'Plati 100 EUR (pay 100 EUR)',
      msg900: 'Plati 900 EUR (pay 900 EUR)',
      attack: 'Mallory',
      attackNone: 'nothing',
      attackEdit: 'edits',
      attackResign: 're-signs',
      attackSwap: 'key',
      attackHint: 'nothing · edits the message · re-signs with her key · swaps the public key Bob holds',
      showNumbers: 'Numbers',

      presetHonest: 'Honest',
      presetHonestHint: 'Bob gets v = 2363 = h\': the signature is valid',
      presetTamper: 'Edited message',
      presetTamperHint: 'Plati 900 EUR with the old signature 1834: h\' = 233 ≠ v',
      presetResign: 'Mallory signs',
      presetResignHint: 'Mallory signs with her key, Bob verifies with Alice\'s: it fails',
      presetSwap: 'Swapped key',
      presetSwapHint: 'Bob holds Mallory\'s public key under Alice\'s name: the forgery passes',

      legendPriv: 'private key',
      legendPub: 'public key',
      legendMsg: 'message',
      legendSig: 'signature',
      legendOk: 'valid',
      legendBad: 'invalid',
      legendChanged: 'changed',

      alice: 'Alice',
      bob: 'Bob',
      mallory: 'Mallory',
      roleAlice: 'signs',
      roleMallory: 'on the network: reads and changes',
      roleBob: 'verifies',
      privKey: 'private',
      pubKey: 'public',
      bobKey: '"Alice\'s" public key',
      reallyMallory: 'really Mallory\'s',

      workAlice: 'Alice computes',
      workMallory: 'Mallory',
      workBob: 'Bob computes',
      rowMsg: 'message m',
      rowHash: 'hash h',
      rowSig: 'signature s',
      rowRecv: 'received m\'',
      rowHashRecv: 'hash h\'',
      rowRecovered: 'from signature v',
      rowSees: 'sees',
      rowDoes: 'does',
      rowHerHash: 'her hash',
      rowHerSig: 'her signature',
      quoted: '"{m}"',
      notYet: '—',
      doesNone: 'nothing, just forwards',
      doesEdit: 'edits the message, keeps the signature',
      doesResign: 'signs her message with her key',
      doesSwap: 'swaps the public key Bob holds for hers and signs her message',
      waiting: 'waits',

      pairTitle: 'Message and signature',
      pairAtAlice: 'at Alice',
      pairOnNet: 'on the network',
      pairToBob: 'Mallory → Bob',
      pairAtBob: 'at Bob',
      pairNone: 'Alice has not written the message yet',
      cardMsg: 'message',
      cardSig: 'signature',
      wasMsg: 'was',
      sigFromAlice: 'with Alice\'s key',
      sigFromMallory: 'with Mallory\'s key',
      unsigned: 'not signed yet',
      chip: 'm + s',
      readable: 'readable by anyone on the way',

      checkTitle: 'Bob\'s check',
      checkWait: 'Bob compares v and h\' in step 8',
      valid: 'valid',
      invalid: 'invalid',
      canTitle: 'Bob can conclude',
      cannotTitle: 'Bob cannot conclude',
      canAuthentic1: 'the message was not changed',
      canAuthentic2: 'it was signed by the owner of the key pair he holds as Alice\'s',
      canAuthentic3: 'if the key really is Alice\'s, she cannot deny signing',
      cannotAuthentic1: 'that the message was secret: Mallory read it',
      canReject1: 'something changed: the message or the signature',
      canReject2: 'the message must be rejected',
      cannotReject1: 'what changed, who changed it, or what the message said',
      canWrong1: 'it was signed with the private key of the pair whose public key he holds',
      cannotWrong1: 'that the key is Alice\'s: it is Mallory\'s. A certificate binds a key to a name',
      canToy1: 'nothing: this is an accident of small numbers',
      cannotToy1: 'that the message is Alice\'s, despite "valid"',
      toyCollision: 'collision of the toy hash mod n, impossible at real sizes',
      toyChance: 'chance match of the small numbers, impossible at real sizes',

      capStart: 'Alice has a private key, Bob her public key. The message crosses a network with Mallory on it. Step 1: Alice writes the message.',
      capWrite: 'Alice writes the payment order {msg}.',
      capHash: 'Alice computes the hash of the message: {expr}. The hash is signed, not the whole message.',
      capSign: 'Alice signs the hash with her private key: {expr}. That key never leaves Alice.',
      capSend: 'The message and the signature travel together. Mallory reads the message {msg}: a signature does not hide it.',
      capNone: 'Mallory changes nothing and forwards the message and the signature to Bob.',
      capEdit: 'Mallory changes the message to {msg} and keeps the signature {sig}: she cannot compute a new one without Alice\'s private key.',
      capResign: 'Mallory writes {msg} and signs it with her own private key: {expr}.',
      capSwap: 'Mallory gives Bob her public key under Alice\'s name, and signs {msg} with her private key: {expr}.',
      capBobHash: 'Bob computes the hash of the message he received: {expr}.',
      capRecover: 'Bob recovers the hash from the signature with the public key he holds: {expr}.',
      capRecoverMallory: 'Bob recovers the hash with the key he thinks is Alice\'s, but it is Mallory\'s: {expr}.',
      capValid: 'Bob compares: {cmp}. The signature is valid.',
      capInvalidEdit: 'Bob recovers {v}, but the received message hashes to {h}: the message was changed.',
      capInvalidResign: 'Bob recovers {v}, but the hash is {h}: the signature was not made with Alice\'s private key.',
      capValidWrong: 'Bob compares: {cmp}. Valid, because Mallory\'s signature was checked with Mallory\'s key.',
      capValidToy: 'Bob compares: {cmp}, although the message was changed: {why}.',
      capConcludeAuthentic: 'Bob knows the message was not changed and was signed by the holder of the private key for the key he holds as Alice\'s. It was not secret.',
      capConcludeReject: 'Bob rejects the message. We can see what happened; Bob only sees v ≠ h\': he cannot tell whether the message or the signature changed, or who did it.',
      capConcludeWrong: 'Bob thinks Alice asks for {msg}. The signature only proves the signer holds the private key for the public key Bob holds, not whose it is. That is what a certificate is for.',
      capConcludeToy: 'At real sizes this does not happen: {why}.',

      explain: '<p><strong>The idea.</strong> A digital signature is computed with the [[private key]], which only the signer ' +
        'holds, and checked with the [[public key]], which anyone may have. What is signed is the hash of the message: ' +
        's = hᵈ mod n. Bob computes h\' from the message he received and v = sᵉ mod n from the signature; the signature ' +
        'is valid when v = h\'.</p>' +
        '<p><strong>What it gives.</strong> Integrity: any change to the message changes h\', so v ≠ h\'. ' +
        'Authenticity: a signature made without the private key does not pass. ' +
        'Non-repudiation: the signer cannot say they did not sign.</p>' +
        '<p><strong>What it does not give.</strong> The message travels in the open: signing is not encryption and does not ' +
        'hide anything. A signature proves the signer holds the private key for the public key Bob has, not whose key that is. ' +
        'Binding a key to a name is the job of a [[certificate]].</p>' +
        '<p><strong>Small numbers.</strong> This is textbook RSA (p = 61, q = 53, n = 3233, e = 17, d = 2753) and the hash is ' +
        'SHA-256 mod n, without padding (PKCS #1 requires it). With n this small two messages can share a hash (1 in 3233); ' +
        'real keys have 2048 bits or more.</p>' +
        '<p><strong>Common misconceptions.</strong> "Signing is encrypting with the private key, so the message is secret": no, ' +
        'anyone can read it. "A valid signature proves who sent the message": only if the public key really is the sender\'s. ' +
        '"Signing the message or its hash makes no difference": RSA can only sign a number below n, and a signature without a hash ' +
        'can be forged (pick s, compute m = sᵉ mod n). A hash is short, of fixed length, and cannot be steered that way.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
