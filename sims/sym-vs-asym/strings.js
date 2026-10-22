/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of sym-vs-asym, in Croatian and English (docs/sim-ui.md §9). Same keys in both tables; the page
   looks them up with t(key) from Simdeck.useStrings(window.SimStrings). {name} is a placeholder, [[term]] a glossary
   term (first mention; [[=term]] later ones). Plural forms: Croatian 1 / 2-4 / 5+, English 1 / other.
   The title and subtitle come from sim.json. Ciphertexts and key letters are data (translate="no"), not words. */
(function (root) {
  var strings = {
    hr: {
      stage: 'Dvije sheme šifriranja: ključevi grupe i jedna poruka od Alice do Boba',

      n: 'Broj osoba',
      nHint: 'Svatko razgovara sa svakim.',
      scheme: 'Shema',
      schemeBoth: 'Obje',
      schemeSym: 'Simetrično',
      schemeAsym: 'Asimetrično',
      schemeHybrid: 'Hibridno (TLS)',
      eve: 'Eve je ukrala zajednički ključ',
      eveHint: 'Kopirala ga je dok je putovao do Boba.',
      eveOff: 'Samo kod simetričnog šifriranja.',

      presetBook: 'Slika iz knjige',
      presetBookHint: 'Alice i Bob: simetrično jedan tajni prijenos, asimetrično nijedan',
      presetOffice: 'Ured, 4 osobe',
      presetOfficeHint: '6 zajedničkih ključeva prema 4 para',
      presetClass: 'Razred, 30 osoba',
      presetClassHint: '435 zajedničkih ključeva prema 30 parova',
      presetNewcomer: 'Novi član, 10 → 11',
      presetNewcomerHint: 'Simetrično +10, asimetrično +1 par',
      presetStolen: 'Ukraden ključ',
      presetStolenHint: 'Eve kopira zajednički ključ u prijenosu',
      presetHybrid: 'Hibridno, redoslijed TLS-a',
      presetHybridHint: 'Prvo asimetrično za ključ, zatim svi podaci simetrično',

      legendShared: 'zajednički ključ',
      legendPublic: 'javni ključ',
      legendPrivate: 'privatni ključ',
      legendCipher: 'šifrat',
      legendEve: 'Eve',
      legendGhost: 'još ne postoji',
      legendChanged: 'promijenjeno',

      symSub: 'jedan zajednički ključ po paru',
      asymSub: 'jedan par ključeva po osobi',
      ringSym: 'Simetrično: zajednički ključevi grupe, {people}',
      ringAsym: 'Asimetrično: parovi ključeva grupe, {people}',
      sharedKeysN: ['zajednički ključ', 'zajednička ključa', 'zajedničkih ključeva'],
      pairsN: ['par', 'para', 'parova'],
      keysN: ['ključ', 'ključa', 'ključeva'],
      secretN: ['mora tajno putovati', 'moraju tajno putovati', 'mora tajno putovati'],
      secretNone: 'nijedan ne putuje tajno',
      addedN: ['+{n} ključ', '+{n} ključa', '+{n} ključeva'],
      addedPair: '+1 par',
      moreAsym: 'Više ključeva traži asimetrično ({a} prema {s}), ali nijedan ne putuje tajno.',
      moreSym: 'Više ključeva traži simetrično ({s} prema {a}), i svaki mora tajno putovati.',
      moreEqual: 'Jednako ključeva ({s} i {a}), ali tajno putuju samo simetrični.',

      colFrom: 'šalje',
      colWire: 'mreža',
      colTo: 'prima',
      colEve: 'Eve kopira',
      alice: 'Alice',
      bob: 'Bob',
      msgText: 'Sastanak u 10',
      replyText: 'Može, vidimo se',
      wantsTo: 'želi poslati',
      secureChannel: 'tajnim kanalom',
      stolenChannel: 'Eve ga je kopirala',
      published: 'objavljen svima',
      nothing: 'ništa',
      eveCannot: 'ne može pročitati',
      eveReads: 'čita',
      hybData: ['{n} poruka', '{n} poruke', '{n} poruka'],
      hybOps: '1 × javnim ključem, {n} × ključem S',

      capStart: '{people}, svatko razgovara sa svakim. Simetrično treba {sym}, asimetrično {pairs} = {asym}. {more} Korak 1: Alice piše Bobu.',
      capStartOne: '{people}, svatko razgovara sa svakim: {bill}. Korak 1: Alice piše Bobu.',
      people: ['{n} osoba', '{n} osobe', '{n} osoba'],
      capWant: 'Alice želi Bobu poslati poruku „{text}”. Eve sjedi na mreži između njih i kopira sve što prođe.',
      capCarry: 'Simetrično: prije prve poruke ključ mora doći do Boba — netko ga mora prenijeti. To je tajni prijenos: kanal koji Eve ne može prisluškivati.',
      capCarryStolen: 'Simetrično: prije prve poruke ključ mora doći do Boba — netko ga mora prenijeti. Ovaj put kanal nije bio tajan: Eve je kopirala ključ.',
      capSymEnc: 'Alice šifrira poruku zajedničkim ključem AB. Na mrežu ide samo šifrat.',
      capSymEve: 'Eve kopira šifrat, ali bez ključa AB ne može ga pročitati.',
      capSymEveStolen: 'Eve kopira šifrat i ima ukradeni ključ AB: pročitala je poruku. Ključ koji je šifrirao poruku i dešifrira je, a Eve ima kopiju.',
      capSymDec: 'Bob dešifrira istim ključem AB. Zato su ga oboje morali imati prije prve poruke.',
      capSymReply: 'Bob odgovara istim ključem AB: jedan ključ služi za oba smjera. Eve opet ima samo šifrat.',
      capSymReplyStolen: 'Bob odgovara istim ključem, a Eve čita i odgovor: s ukradenim ključem čita svaku sljedeću poruku dok se ključ ne zamijeni.',
      capPublish: 'Asimetrično: Bob napravi par ključeva i objavi javni ključ. Ništa tajno ne putuje: javni ključ smije uzeti svatko, i Eve. Privatni ostaje kod Boba.',
      capAsymEnc: 'Alice šifrira Bobovim javnim ključem. Taj šifrat više ne može dešifrirati ni ona sama.',
      capAsymEve: 'Eve ima Bobov javni ključ i šifrat, ali bez privatnog ključa ne može pročitati poruku.',
      capAsymDec: 'Bob dešifrira svojim privatnim ključem, jedinim koji to može. Privatni ključ nije nikamo putovao.',
      capAsymReply: 'Za odgovor Bob treba Alicin javni ključ, pa Alice objavi svoj. Svaki smjer šifrira se ključem primatelja. Eve ne može pročitati ni ovo.',
      capJoin: 'Dolazi nova osoba. Simetrično: {symAdd}, jedan sa svakim od {old}, ukupno {sym}. Asimetrično: +1 par, ukupno {pairs} = {asym}. {more}',
      capHybrid: 'Hibridno, redoslijedom kao TLS: prvo asimetrično, Alice šifrira novi simetrični ključ S Bobovim javnim ključem; zatim sve podatke simetrično, ključem S. Eve ima sve šifrate, ali ne i S.',

      explain: '<p><strong>Problem raspodjele ključa.</strong> Kod <i lang="en">symmetric encryption</i> (simetrično šifriranje) isti ključ šifrira i dešifrira, ' +
        'pa ga obje strane moraju imati <em>prije</em> prve poruke: netko ga mora prenijeti kanalom koji nitko ne može prisluškivati. ' +
        'Ta <i lang="en">key exchange</i> (razmjena ključa) je problem: na mreži putuje samo <i lang="en">ciphertext</i> (šifrat), ali ' +
        'tko kopira ključ, čita svaku poruku šifriranu njime.</p>' +
        '<p><strong>Javni ključ.</strong> Kod <i lang="en">asymmetric encryption</i> (asimetrično šifriranje, šifriranje javnim ključem) svatko ima [[key pair]]. [[public key]] smije vidjeti svatko, i Eve: ' +
        'za tajnost se šifrira javnim ključem primatelja. Dešifrirati može samo vlasnik pripadnog ključa, [[private key]], a on nikamo ne putuje. ' +
        'Za odgovor se šifrira javnim ključem druge strane. Potpis je nešto drugo: potpisuje se privatnim, a provjerava javnim ključem; to dokazuje tko je pisao i ništa ne skriva.</p>' +
        '<p><strong>Brojanje.</strong> Kad n osoba razgovara svaka sa svakom, simetrično treba n(n−1)/2 ključeva, i svaki mora tajno putovati; ' +
        'asimetrično n parova, 2n ključeva, i nijedan ne putuje tajno. Novi član donosi n novih zajedničkih ključeva, ali samo jedan par. ' +
        'Do 4 osobe asimetrično ima više ključeva, kod 5 jednako, a od 6 naviše simetrično brzo raste (30 osoba: 435 prema 60).</p>' +
        '<p><strong>Oboje, ne jedno umjesto drugoga.</strong> Asimetrično je sporije za velike količine podataka. ' +
        'Zato TLS koristi oba: asimetrično za dogovor ključa, simetrično za prijenos podataka; to je <i lang="en">encryption in transit</i> (šifriranje u prijenosu). ' +
        'Korak 11 pokazuje najjednostavniji oblik, ključ S šifriran Bobovim javnim ključem; današnji TLS ključ ne šalje nego ga dogovara, a redoslijed je isti. Kako se ključ dogovara bez ' +
        'slanja (Diffie–Hellman), potpisi i certifikati imaju svoje simulatore.</p>',

      keyShared: 'zajednički ključ {who}',
      keyPublic: 'javni ključ, {who}',
      keyPrivate: 'privatni ključ, {who}',
      keySession: 'ključ sesije S',
      ghost: 'još ne postoji'
    },
    en: {
      stage: 'Two encryption schemes: the group\'s keys and one message from Alice to Bob',

      n: 'People',
      nHint: 'Everyone talks to everyone.',
      scheme: 'Scheme',
      schemeBoth: 'Both',
      schemeSym: 'Symmetric',
      schemeAsym: 'Asymmetric',
      schemeHybrid: 'Hybrid (TLS)',
      eve: 'Eve stole the shared key',
      eveHint: 'She copied it on its way to Bob.',
      eveOff: 'Symmetric encryption only.',

      presetBook: 'The book\'s figure',
      presetBookHint: 'Alice and Bob: symmetric needs one secret transfer, asymmetric none',
      presetOffice: 'Office of 4',
      presetOfficeHint: '6 shared keys against 4 pairs',
      presetClass: 'Class of 30',
      presetClassHint: '435 shared keys against 30 pairs',
      presetNewcomer: 'Newcomer, 10 → 11',
      presetNewcomerHint: 'Symmetric +10, asymmetric +1 pair',
      presetStolen: 'Stolen key',
      presetStolenHint: 'Eve copies the shared key in transit',
      presetHybrid: 'Hybrid, TLS order',
      presetHybridHint: 'Asymmetric first for the key, then all data symmetric',

      legendShared: 'shared key',
      legendPublic: 'public key',
      legendPrivate: 'private key',
      legendCipher: 'ciphertext',
      legendEve: 'Eve',
      legendGhost: 'not made yet',
      legendChanged: 'changed',

      symSub: 'one shared key per pair',
      asymSub: 'one key pair per person',
      ringSym: 'Symmetric: the shared keys of a group, {people}',
      ringAsym: 'Asymmetric: the key pairs of a group, {people}',
      sharedKeysN: ['shared key', 'shared keys'],
      pairsN: ['pair', 'pairs'],
      keysN: ['key', 'keys'],
      secretN: ['must travel secretly', 'must travel secretly'],
      secretNone: 'none travels secretly',
      addedN: ['+{n} key', '+{n} keys'],
      addedPair: '+1 pair',
      moreAsym: 'Asymmetric needs more keys ({a} against {s}), but none of them travels secretly.',
      moreSym: 'Symmetric needs more keys ({s} against {a}), and every one must travel secretly.',
      moreEqual: 'The same number of keys ({s} and {a}), but only the symmetric ones travel secretly.',

      colFrom: 'sends',
      colWire: 'network',
      colTo: 'receives',
      colEve: 'Eve copies',
      alice: 'Alice',
      bob: 'Bob',
      msgText: 'Meeting at 10',
      replyText: 'OK, see you',
      wantsTo: 'wants to send',
      secureChannel: 'over a secret channel',
      stolenChannel: 'Eve copied it',
      published: 'published to all',
      nothing: 'nothing',
      eveCannot: 'cannot read it',
      eveReads: 'reads',
      hybData: ['{n} message', '{n} messages'],
      hybOps: '1 × public key, {n} × key S',

      capStart: '{people}, everyone talks to everyone. Symmetric needs {sym}, asymmetric {pairs} = {asym}. {more} Step 1: Alice writes to Bob.',
      capStartOne: '{people}, everyone talks to everyone: {bill}. Step 1: Alice writes to Bob.',
      people: ['{n} person', '{n} people'],
      capWant: 'Alice wants to send Bob the message “{text}”. Eve sits on the network between them and copies everything that passes.',
      capCarry: 'Symmetric: before the first message the key must reach Bob — someone has to carry it. That is a secret transfer: a channel Eve cannot read.',
      capCarryStolen: 'Symmetric: before the first message the key must reach Bob — someone has to carry it. This time the channel was not secret: Eve copied the key.',
      capSymEnc: 'Alice encrypts the message with the shared key AB. Only the ciphertext goes onto the network.',
      capSymEve: 'Eve copies the ciphertext, but without key AB she cannot read it.',
      capSymEveStolen: 'Eve copies the ciphertext and has the stolen key AB: she has read the message. The key that encrypted it also decrypts it, and she has a copy.',
      capSymDec: 'Bob decrypts with the same key AB. That is why both had to have it before the first message.',
      capSymReply: 'Bob replies with the same key AB: one key serves both directions. Again Eve has only the ciphertext.',
      capSymReplyStolen: 'Bob replies with the same key, and Eve reads the reply too: with the stolen key she reads every later message until the key is replaced.',
      capPublish: 'Asymmetric: Bob makes a key pair and publishes the public key. Nothing secret travels: anyone may take the public key, Eve too. The private one stays with Bob.',
      capAsymEnc: 'Alice encrypts with Bob\'s public key. Not even she can decrypt this ciphertext now.',
      capAsymEve: 'Eve has Bob\'s public key and the ciphertext, but without the private key she cannot read the message.',
      capAsymDec: 'Bob decrypts with his private key, the only one that can. The private key never went anywhere.',
      capAsymReply: 'To reply, Bob needs Alice\'s public key, so Alice publishes hers. Each direction is encrypted with the receiver\'s key. Eve cannot read this one either.',
      capJoin: 'A new person joins. Symmetric: {symAdd}, one with each of {old}, {sym} in all. Asymmetric: +1 pair, {pairs} = {asym} in all. {more}',
      capHybrid: 'Hybrid, in TLS order: asymmetric first, Alice encrypts a fresh symmetric key S with Bob\'s public key; then all the data symmetric, with key S. Eve has every ciphertext, but not S.',

      explain: '<p><strong>The key distribution problem.</strong> In symmetric encryption the same key encrypts and decrypts, ' +
        'so both sides must have it <em>before</em> the first message: someone has to carry it over a channel nobody can eavesdrop on. ' +
        'That key exchange is the problem: only the ciphertext travels on the network, but whoever copies the key reads every message encrypted with it.</p>' +
        '<p><strong>The public key.</strong> In asymmetric (public-key) encryption everyone has a [[key pair]]. Anyone may see the [[public key]], ' +
        'Eve too: for secrecy you encrypt with the receiver\'s public key. Only the holder of the matching [[private key]] can decrypt, and it never travels. ' +
        'A reply is encrypted with the other side\'s public key. A signature is something else: you sign with the private key and check with the public one; it proves who wrote it and hides nothing.</p>' +
        '<p><strong>Counting.</strong> When n people all talk to each other, symmetric needs n(n−1)/2 keys, each of which must travel secretly; ' +
        'asymmetric needs n pairs, 2n keys, and none travels secretly. A newcomer brings n new shared keys but only one pair. ' +
        'Up to 4 people asymmetric has more keys, at 5 the same, and from 6 on symmetric grows fast (30 people: 435 against 60).</p>' +
        '<p><strong>Both, not one instead of the other.</strong> Asymmetric is slower for large amounts of data. ' +
        'So TLS uses both: asymmetric to agree on a key, symmetric to carry the data; that is encryption in transit. ' +
        'Step 11 shows the simplest form, key S encrypted with Bob\'s public key; today\'s TLS does not send the key but agrees on it, in the same order. How a key is agreed without sending it ' +
        '(Diffie–Hellman), signatures and certificates have simulators of their own.</p>',

      keyShared: 'shared key {who}',
      keyPublic: 'public key, {who}',
      keyPrivate: 'private key, {who}',
      keySession: 'session key S',
      ghost: 'not made yet'
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
