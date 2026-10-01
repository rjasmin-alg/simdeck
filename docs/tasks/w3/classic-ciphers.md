# classic-ciphers: Caesar and Vigenère

| | |
|---|---|
| Task | `classic-ciphers` (wave 3, Security and cryptography) |
| Catalogue entry | `sec-classic-ciphers` in `docs/catalogue.md` §4.3 |
| Kind | build a new simulator |
| Folder | `sims/classic-ciphers/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | SEC |
| Topic / tags / level | `security` / `cryptography` / `core` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **why frequency analysis breaks substitution**.

The student: encrypt, then break by frequency.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.3.

## Sources

- No local course material (URM ch18 covers only modern symmetric/asymmetric encryption). Use standard textbooks (e.g. Singh, *The Code Book*; Stallings, *Cryptography and Network Security*, classical techniques chapter); mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.


## Model and presets

- **Scene:** plaintext and ciphertext in two rows of letter tiles; under them two letter-frequency histograms
  (ciphertext, and the language reference); a cipher wheel / tabula strip for the current key. A "break" panel
  shows the attacker's best guess of the key and the decrypted text, with a match score. Explorer.
- **State:** `{ cipher: 'caesar'|'vigenere', key, lang, plain, cipher, freqCipher[26], freqRef[26], guess: {key,
  plain, score}, ic }`; alphabet A–Z only (Croatian letters folded: Č/Ć → C, Š → S, Ž → Z, Đ → D; documented).
- **Params drive live:** changing key or text re-encrypts and re-runs the frequency attack; `keyLenGuess` lets the
  lecturer split a Vigenère ciphertext into columns and attack each.
- **Rules:**
  1. Caesar: c = (p + k) mod 26; decryption subtracts k; 25 useful keys (textbook).
  2. Vigenère: c_i = (p_i + k_(i mod m)) mod 26, key letters A = 0; non-letters are copied and do not advance the
     key (textbook; matches the classic example below).
  3. Frequency attack on Caesar: shift the most frequent ciphertext letter onto the language's most frequent
     letter (E in English, A in Croatian *(check: Croatian letter frequencies)*); score each of the 26 shifts by
     χ² against the reference and pick the lowest (textbook).
  4. Short texts defeat the attack: too few letters for the histogram to resemble the language (derived; see
     `freq-short`).
  5. Vigenère flattens the histogram; index of coincidence ≈ 0.066 for English text vs ≈ 0.038 for random
     letters (textbook values; Croatian *(check)*). Given the key length, each column is a Caesar cipher and
     rule 3 applies per column.
  Tie-break: equal χ² scores pick the smaller shift.
- **Params:** `cipher` choice Caesar/Vigenère (Caesar); `key` range 0…25 for Caesar (3); `vkey` select of key words
  (LEMON, KLJUC, RIJEKA) (LEMON); `text` select of sample texts (short Latin, English paragraph, Croatian
  paragraph); `keyLenGuess` range 1…8 (1); `lang` choice hr/en (follows page).
- **Presets:**
  - `veni` Caesar k=3: VENI VIDI VICI → YHQL YLGL YLFL. Textbook (Suetonius' shift of 3), checked.
  - `freq-long` Caesar, a ~400-letter Croatian paragraph, k = 7: the attack finds k = 7. Derived, unchecked
    (check with the chosen text).
  - `freq-short` Caesar on the 12-letter "VENI VIDI VICI" with the English reference: χ² ranks k = 20, 11, 18, 4,
    24 first; the true k = 3 is not in the top 5. Derived, checked by script (English frequencies, Lewand).
  - `attack` Vigenère key LEMON: ATTACKATDAWN → LXFOPVEFRNHR. Textbook example, checked.
  - `columns` Vigenère with key length 5 known: five Caesar attacks recover LEMON on a long English text.
    Derived, unchecked.
- **Steps:** explorer, 0.
- **Legend:** plaintext letter (hollow tile), ciphertext letter (filled tile), most frequent letter (kit
  highlight), reference frequency (outline bar) vs observed (filled bar).
- **Captions:** hr: "Najčešće slovo šifrata je H; pomak na A daje ključ 7." / en: "The most frequent ciphertext
  letter is H; shifting it onto A gives key 7." — hr: "Vigenère razmazuje učestalosti: histogram je gotovo ravan."
  / en: "Vigenère smears the frequencies: the histogram is almost flat."
- **Terms:** cipher — šifra; key — ključ; plaintext — razumljivi podaci / otvoreni tekst *(check)*; ciphertext —
  šifrat *(check)*; frequency analysis — analiza učestalosti; substitution cipher — supstitucijska šifra; shift —
  pomak.
- **Misconceptions:** a longer key word always means safe (key reuse is the weakness); secrecy of the method is
  security (Kerckhoffs); Vigenère is unbreakable.
- **Out of scope:** Enigma, one-time pad beyond one sentence in the explanation, Kasiski examination as a stepper.

<!-- model: filled -->

## Steps

1. `npm run admin` → + Novi simulator `classic-ciphers` (runs `kit/new-sim.sh` and writes `sim.json`), or `kit/new-sim.sh classic-ciphers sims/classic-ciphers` plus a hand-written `sim.json`.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/classic-ciphers/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
