/* SPDX-License-Identifier: AGPL-3.0-or-later
   Every visible string of password-storage, in both languages (docs/sim-ui.md §9). Same keys in hr and en; the page
   looks them up with t(key). {name} is a placeholder, an array is plural forms (hr: 1 / 2–4 / 5+, en: 1 / other).
   The plural of a duration with decimals takes the "many" form (the page passes n = 5 for 6,1).
   Terms missing from kit/glossary.js are written out (NOTES.md, Term pairs). The title and subtitle come from sim.json.
   User names, passwords, salts, stored values and numbers are data, shown with translate="no". */
(function (root) {
  'use strict';

  var strings = {
    hr: {
      stage: 'Tablica lozinki na poslužitelju i napadač s ukradenom kopijom',
      and: ' i ',
      listSep: ', ',

      tableTitle: 'Tablica na poslužitelju: ista 4 korisnika, spremljena na četiri načina',
      colUser: 'Korisnik',
      schemePlain: 'Bez zaštite',
      schemeHash: 'Brzi sažetak',
      schemeSalted: 'Brzi sažetak sa soli',
      schemeSlow: 'Spori sažetak sa soli',
      subPlain: 'sama lozinka',
      subHash: 'SHA-256(lozinka)',
      subSalted: 'sol · SHA-256(sol + lozinka)',
      subSlow: 'sol · spori sažetak (sol + lozinka)',
      cut: 'od sažetka je prikazano prvih 16 od 64 znaka',
      stolen: 'napadačeva kopija',
      lukaInput: 'Lukina lozinka',
      lukaHint: 'Upiši Lukinu lozinku; duljina i abeceda napada slijede je',
      saltTitle: 'sol: nasumična, javna, spremljena uz zapis',
      sameLane: 'Korisnici s istim zapisom u stupcu napadačeve kopije',
      sameTag: 'isti zapis',
      sameLine: '{mark} isti zapis: {names}',

      rainbowTitle: 'Prethodno izračunata tablica',
      rainbowSub: '{term} (dugina tablica): sažeci čestih lozinki, izračunati unaprijed',
      rainbowTerm: 'rainbow table',
      rainbowHash: 'sažetak (bez soli)',
      rainbowPassword: 'lozinka',
      rainbowSize: 'Ovdje 8 redaka; prava tablica ima milijune.',
      rbPlain: 'Ne treba: lozinke se čitaju izravno.',
      rbHits: ['{n} zapis nađen u tablici: lozinka se samo pročita.', '{n} zapisa nađena u tablici: lozinke se samo pročitaju.', '{n} zapisa nađeno u tablici: lozinke se samo pročitaju.'],
      rbNone: 'Nijedan zapis nije u tablici: ostaje pogađanje.',
      rbSalted: 'Nijedan zapis nije u tablici: sol mijenja ulaz, pa unaprijed izračunati sažeci ne vrijede.',

      timeTitle: 'Pogađanje jedne lozinke',
      timeSpace: '{len}: {calc} mogućnosti',
      timeBreach: 'Na popisu kompromitiranih: najviše {list} pokušaja, ma koliko bila duga.',
      timeAvg: 'Najgori slučaj; u prosjeku pola.',
      rowRate: '{rate} pokušaja/s',
      rowRead: 'čita se, ne pogađa',
      rowTableSame: 'cijela tablica: isto, jedan prolaz za sve',
      rowTableEach: 'cijela tablica: ×4 = {time}',
      over: 'izvan ljestvice',
      axisLabel: 'Vrijeme na logaritamskoj ljestvici',

      t_us: '1 µs', t_ms: '1 ms', t_s: '1 s', t_h: '1 h', t_y: '1 god.',
      t_ky: '10³ god.', t_My: '10⁶ god.', t_Gy: '10⁹ god.',

      u_now: 'odmah',
      u_us: '{v} µs',
      u_ms: '{v} ms',
      u_s: '{v} s',
      u_min: '{v} min',
      u_h: '{v} h',
      u_d: ['{v} dan', '{v} dana', '{v} dana'],
      u_y: ['{v} godina', '{v} godine', '{v} godina'],
      l_now: 'nimalo',
      l_us: ['{v} mikrosekundu', '{v} mikrosekunde', '{v} mikrosekundi'],
      l_ms: ['{v} milisekundu', '{v} milisekunde', '{v} milisekundi'],
      l_s: ['{v} sekundu', '{v} sekunde', '{v} sekundi'],
      l_min: ['{v} minutu', '{v} minute', '{v} minuta'],
      l_h: ['{v} sat', '{v} sata', '{v} sati'],
      l_d: ['{v} dan', '{v} dana', '{v} dana'],
      l_y: ['{v} godinu', '{v} godine', '{v} godina'],

      len10: ['{n} znamenka', '{n} znamenke', '{n} znamenki'],
      len26: ['{n} malo slovo', '{n} mala slova', '{n} malih slova'],
      len62: ['{n} znak (slova i znamenke)', '{n} znaka (slova i znamenke)', '{n} znakova (slova i znamenke)'],
      len95: ['{n} znak s tipkovnice', '{n} znaka s tipkovnice', '{n} znakova s tipkovnice'],
      lenOf10: ['{n} znamenke', '{n} znamenke', '{n} znamenki'],
      lenOf26: ['{n} malog slova', '{n} mala slova', '{n} malih slova'],
      lenOf62: ['{n} znaka (slova i znamenke)', '{n} znaka (slova i znamenke)', '{n} znakova (slova i znamenke)'],
      lenOf95: ['{n} znaka s tipkovnice', '{n} znaka s tipkovnice', '{n} znakova s tipkovnice'],

      scheme: 'Kako poslužitelj sprema',
      optPlain: 'Lozinka',
      optHash: 'Sažetak',
      optSalted: '+ sol',
      optSlow: 'Spori',
      length: 'Duljina lozinke',
      alphabet: 'Abeceda',
      alphabetHint: 'aA0: slova i znamenke (62) · sve: i ostali znakovi (95)',
      alpha10: '0–9',
      alpha26: 'a–z',
      alpha62: 'aA0',
      alpha95: 'sve 95',
      inBreachList: 'Na popisu kompromitiranih',
      fastRate: 'Brzi sažetak: pokušaja/s',
      slowRate: 'Spori sažetak: pokušaja/s',

      presetFour: '4 mala slova',
      presetFourHint: '26⁴ = 456 976 pokušaja',
      presetSame: 'Ista lozinka',
      presetSameHint: 'Ana i Marko: ljeto2026',
      presetEight: '8 znakova aA0',
      presetEightHint: '62⁸ ≈ 2,18 · 10¹⁴ pokušaja',
      presetPass15: '15 malih slova',
      presetPass15Hint: 'najmanja duljina za lozinku bez drugog faktora',
      presetBreached: 'Procurjela',
      presetBreachedHint: '15 znakova s popisa kompromitiranih',

      legendStored: 'spremljeni zapis',
      legendSalt: 'sol',
      legendSame: 'isti zapis kao drugi korisnik',
      legendBar: 'vrijeme pogađanja',
      legendChanged: 'promijenjeno',

      capPlain: 'Bez sažetka ukradena tablica su same lozinke: napadač ih ne pogađa, samo pročita.',
      capSame2: 'Bez soli {names} imaju isti zapis — tko razbije jednoga, ima oba.',
      capSameMore: 'Bez soli {names} imaju isti zapis — tko razbije jednoga, ima sve.',
      capHashOnly: 'Bez soli ista lozinka uvijek daje isti zapis.',
      capHits: ['Prethodno izračunata tablica obrće {count} zapis samo traženjem.', 'Prethodno izračunata tablica obrće {count} zapisa samo traženjem.', 'Prethodno izračunata tablica obrće {count} zapisa samo traženjem.'],
      capNoHits: 'Nijedan zapis nije u prethodno izračunatoj tablici: ostaje pogađanje.',
      capSalted: 'Sa soli svaki korisnik ima svoj zapis: {names} imaju istu lozinku, a različit zapis. Prethodno izračunata tablica ne pogađa ništa; svakoga se napada zasebno.',
      capSaltedNone: 'Sa soli svaki zapis je drukčiji i prethodno izračunata tablica ne pogađa ništa; svakoga se napada zasebno.',
      capSlow: 'Spori sažetak sa soli: svaki pokušaj napadača stoji {ratio} puta više rada nego brzi sažetak, a sol i dalje razdvaja zapise.',
      capTime: 'Lozinka od {len}: {space} pokušaja, {scheme} izdrži {time}.',
      capTimeBreach: 'Lozinka je na popisu kompromitiranih: nađe se nakon najviše {list} pokušaja, ma koliko bila duga; {scheme} izdrži {time}.',
      capTimePlain: 'Bez sažetka nema što pogađati: lozinka od {len} pročita se odmah.',
      capHashName: 'brzi sažetak',
      capSaltedName: 'brzi sažetak sa soli',
      capSlowName: 'spori sažetak',

      explain: '<p>Poslužitelj ne bi smio spremati samu lozinku: tko ukrade tablicu, ima sve lozinke. Zato sprema ' +
        '<i lang="en">hash</i> (sažetak) lozinke i pri prijavi uspoređuje sažetak upisane lozinke sa spremljenim.</p>' +
        '<p>Bez soli ista lozinka uvijek daje isti sažetak. Dva korisnika s istom lozinkom imaju isti zapis, a sažeci ' +
        'čestih lozinki mogu se izračunati unaprijed: <i lang="en">rainbow table</i> (dugina tablica) obrne takav zapis ' +
        'samo traženjem.</p>' +
        '<p><i lang="en">Salt</i> (sol) je nasumična vrijednost, različita za svakog korisnika, spremljena odmah uz ' +
        'sažetak. Nije tajna: njezin posao je da isti ulaz da različit zapis. Unaprijed izračunate tablice tada ne vrijede, ' +
        'a svakog korisnika napadač mora pogađati zasebno.</p>' +
        '<p>Brzi sažetak napravljen je da bude brz, pa i napadač brzo pogađa. Spori sažetak, ' +
        '<i lang="en">key derivation function</i> (funkcija izvođenja ključa), namjerno stoji puno rada po pokušaju; ' +
        'koliko, podešava se parametrom cijene. Ovdje to predstavlja broj pokušaja u sekundi.</p>' +
        '<p><i lang="en">Brute force</i> (napad grubom silom) isprobava sve: abeceda na potenciju duljine, toliko je mogućnosti; ' +
        'najgori slučaj je taj broj podijeljen brzinom, a u prosjeku pola. Duljina raste u eksponentu, abeceda u bazi: ' +
        'zato norma traži najmanje 15 znakova za lozinku bez drugog faktora i zabranjuje nametnuta pravila sastava. ' +
        'Lozinka s popisa kompromitiranih pada nakon onoliko pokušaja koliko popis ima redaka, ma koliko bila duga, ' +
        'pa je poslužitelj mora odbiti.</p>' +
        '<p>Linux sprema posoljene spore sažetke u <code>/etc/shadow</code>, koju smije čitati samo root; ' +
        '<code>/etc/passwd</code> čitljiva je svima i lozinke nema.</p>'
    },

    en: {
      stage: 'A password table on a server, and an attacker with a stolen copy',
      and: ' and ',
      listSep: ', ',

      tableTitle: 'The table on the server: the same 4 users, stored four ways',
      colUser: 'User',
      schemePlain: 'Plain text',
      schemeHash: 'Fast hash',
      schemeSalted: 'Salted fast hash',
      schemeSlow: 'Slow salted hash',
      subPlain: 'the password itself',
      subHash: 'SHA-256(password)',
      subSalted: 'salt · SHA-256(salt + password)',
      subSlow: 'salt · slow hash (salt + password)',
      cut: 'hashes show their first 16 of 64 characters',
      stolen: 'attacker\'s copy',
      lukaInput: 'Luka\'s password',
      lukaHint: 'Type Luka\'s password; the attack\'s length and alphabet follow it',
      saltTitle: 'salt: random, public, stored next to the value',
      sameLane: 'Users with the same stored value in the attacker\'s column',
      sameTag: 'same hash',
      sameLine: '{mark} same hash: {names}',

      rainbowTitle: 'Precomputed table',
      rainbowSub: 'a {term}: hashes of common passwords, computed in advance',
      rainbowTerm: 'rainbow table',
      rainbowHash: 'hash (no salt)',
      rainbowPassword: 'password',
      rainbowSize: 'Eight rows here; a real one has millions.',
      rbPlain: 'Not needed: the passwords are read directly.',
      rbHits: ['{n} stored value found in the table: its password is simply read off.', '{n} stored values found in the table: their passwords are simply read off.'],
      rbNone: 'No stored value is in the table: guessing remains.',
      rbSalted: 'No stored value is in the table: the salt changes the input, so precomputed hashes are useless.',

      timeTitle: 'Guessing one password',
      timeSpace: '{len}: {calc} possibilities',
      timeBreach: 'In a breach list: at most {list} guesses, however long it is.',
      timeAvg: 'Worst case; half that on average.',
      rowRate: '{rate} guesses/s',
      rowRead: 'read, not guessed',
      rowTableSame: 'whole table: the same, one pass for all',
      rowTableEach: 'whole table: ×4 = {time}',
      over: 'off the scale',
      axisLabel: 'Time on a logarithmic scale',

      t_us: '1 µs', t_ms: '1 ms', t_s: '1 s', t_h: '1 h', t_y: '1 yr',
      t_ky: '10³ yr', t_My: '10⁶ yr', t_Gy: '10⁹ yr',

      u_now: 'at once',
      u_us: '{v} µs',
      u_ms: '{v} ms',
      u_s: '{v} s',
      u_min: '{v} min',
      u_h: '{v} h',
      u_d: ['{v} day', '{v} days'],
      u_y: ['{v} year', '{v} years'],
      l_now: 'not at all',
      l_us: ['{v} microsecond', '{v} microseconds'],
      l_ms: ['{v} millisecond', '{v} milliseconds'],
      l_s: ['{v} second', '{v} seconds'],
      l_min: ['{v} minute', '{v} minutes'],
      l_h: ['{v} hour', '{v} hours'],
      l_d: ['{v} day', '{v} days'],
      l_y: ['{v} year', '{v} years'],

      len10: ['{n} digit', '{n} digits'],
      len26: ['{n} lowercase letter', '{n} lowercase letters'],
      len62: ['{n} letter or digit', '{n} letters and digits'],
      len95: ['{n} keyboard character', '{n} keyboard characters'],
      lenOf10: ['{n} digit', '{n} digits'],
      lenOf26: ['{n} lowercase letter', '{n} lowercase letters'],
      lenOf62: ['{n} letter or digit', '{n} letters and digits'],
      lenOf95: ['{n} keyboard character', '{n} keyboard characters'],

      scheme: 'How the server stores it',
      optPlain: 'Plain',
      optHash: 'Hash',
      optSalted: '+ salt',
      optSlow: 'Slow',
      length: 'Password length',
      alphabet: 'Alphabet',
      alphabetHint: 'aA0: letters and digits (62) · all: every key (95)',
      alpha10: '0–9',
      alpha26: 'a–z',
      alpha62: 'aA0',
      alpha95: 'all 95',
      inBreachList: 'In a breach list',
      fastRate: 'Fast hash: guesses/s',
      slowRate: 'Slow hash: guesses/s',

      presetFour: '4 lowercase',
      presetFourHint: '26⁴ = 456,976 guesses',
      presetSame: 'Same password',
      presetSameHint: 'Ana and Marko: ljeto2026',
      presetEight: '8 chars aA0',
      presetEightHint: '62⁸ ≈ 2.18 · 10¹⁴ guesses',
      presetPass15: '15 lowercase',
      presetPass15Hint: 'the minimum length for a password with no second factor',
      presetBreached: 'Breached',
      presetBreachedHint: '15 characters from a breach list',

      legendStored: 'stored value',
      legendSalt: 'salt',
      legendSame: 'same stored value as another user',
      legendBar: 'time to guess',
      legendChanged: 'changed',

      capPlain: 'Without a hash the stolen table is the passwords themselves: the attacker does not guess, just reads.',
      capSame2: 'Without a salt {names} have the same stored value — crack one and you have both.',
      capSameMore: 'Without a salt {names} have the same stored value — crack one and you have them all.',
      capHashOnly: 'Without a salt the same password always gives the same stored value.',
      capHits: ['A precomputed table reverses {count} stored value by lookup alone.', 'A precomputed table reverses {count} stored values by lookup alone.'],
      capNoHits: 'No stored value is in the precomputed table: guessing remains.',
      capSalted: 'With a salt every user has their own stored value: {names} share a password but not a stored value. The precomputed table finds nothing; each user is attacked separately.',
      capSaltedNone: 'With a salt every stored value differs and the precomputed table finds nothing; each user is attacked separately.',
      capSlow: 'Slow salted hash: each guess costs the attacker {ratio} times the work of a fast hash, and the salt still keeps the stored values apart.',
      capTime: '{len}: {space} guesses; {scheme} holds out for {time}.',
      capTimeBreach: 'The password is in a breach list: it falls within {list} guesses, however long it is; {scheme} holds out for {time}.',
      capTimePlain: 'Without a hash there is nothing to guess: a password of {len} is read at once.',
      capHashName: 'a fast hash',
      capSaltedName: 'a salted fast hash',
      capSlowName: 'a slow hash',

      explain: '<p>A server should not store the password itself: whoever steals the table has every password. So it stores ' +
        'a <i>hash</i> of the password, and at login compares the hash of the typed password with the stored one.</p>' +
        '<p>Without a salt the same password always gives the same hash. Two users with the same password have the same ' +
        'stored value, and the hashes of common passwords can be computed in advance: a <i>rainbow table</i> reverses ' +
        'such a value by lookup alone.</p>' +
        '<p>A <i>salt</i> is a random value, different for every user, stored right next to the hash. It is not a ' +
        'secret: its job is to make the same input give a different stored value. Precomputed tables are then useless, ' +
        'and the attacker must guess each user separately.</p>' +
        '<p>A fast hash is built to be fast, so the attacker guesses fast too. A slow hash, a <i>key derivation ' +
        'function</i>, deliberately costs a lot of work per guess; how much is set by a cost parameter. Here that is the ' +
        'number of guesses per second.</p>' +
        '<p><i>Brute force</i> tries everything: the alphabet to the power of the length; the worst case is that number ' +
        'divided by the rate, and half of it on average. Length sits in the exponent, the alphabet in the base: that is ' +
        'why the standard asks for at least 15 characters for a password with no second factor and forbids imposed ' +
        'composition rules. A password from a breach list falls within as many guesses as the list has rows, however ' +
        'long it is, so the server must refuse it.</p>' +
        '<p>Linux stores salted slow hashes in <code>/etc/shadow</code>, readable by root only; <code>/etc/passwd</code> ' +
        'is readable by everyone and holds no passwords.</p>'
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = strings;
  else root.SimStrings = strings;
})(typeof globalThis !== 'undefined' ? globalThis : this);
