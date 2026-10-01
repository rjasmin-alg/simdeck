# endianness: Endianness

| | |
|---|---|
| Task | `endianness` (wave 3, Computer architecture, OS gaps and automata) |
| Catalogue entry | `arh-endianness` in `docs/catalogue.md` §4.9 |
| Kind | build a new simulator |
| Folder | `sims/endianness/` |
| Class | explorer |
| Size | S |
| Priority | P3 |
| Courses | ARH, URM |
| Topic / tags / level | `architecture` / `number-representation` / `intro` |
| Languages | Croatian and English (COMMON.md §4) |
| Licence | AGPL-3.0-or-later |
| Depends on | wave 0 (foundation) merged |

## Goal

One concept: **byte order in memory and on the wire**.

The student: write values, read them as bytes.

## Read first

1. `docs/tasks/COMMON.md`: rules for every task (layout, kit, languages, tests, ownership, done).
2. `docs/sim-ui.md` (the kit), `docs/site-structure.md` §2 (`sim.json`) and §7 (how page and build fit).
3. `kit/template/` (the proto-simulator every new sim starts from).
4. This entry and its neighbours in `docs/catalogue.md` §4.9.

## Sources

- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/08-mrezni-sloj.md`, "IPv4 adresa: adresa je broj" and **Primjer 1** "ista adresa, tri zapisa" (172.16.5.30 = 2 886 731 038): the address as one 32-bit number.
- `/home/rjasmin/projects/uvod-u-racunalne-mreze/book/chapters/14-aplikacijski-sloj.md`, DNS section (quotes "network byte order" for the AAAA record, RFC 3596).
- RFC 791 Appendix B "Data Transmission Order"; RFC 1700 (network byte order is big-endian); D. Cohen, *On Holy Wars and a Plea for Peace*, IEN 137 (1980); *Intel 64 and IA-32 Architectures Software Developer's Manual*, Vol. 1, §1.3.1 "Bit and Byte Order"; POSIX `htonl`/`ntohl` (`arpa/inet.h`). Mark every number and rule you could not check with *(check)* and list it in `NOTES.md`.

## Model and presets

- **Scene:** a value box (hex and decimal, 16- or 32-bit) above two memory strips of byte cells at addresses
  0x1000…0x1003: "big-endian" and "little-endian", each byte labelled with its address; below them "on the
  wire" (network byte order, the bytes in transmission order, first byte left) and a "reader" row that shows
  what a program gets if it loads those wire bytes as a host integer with or without `ntohl`/`ntohs`.
- **State (explorer, derived from params):** `{ width, value, bytesBE: [..], bytesLE: [..], wire: [..],
  hostOrder, readAs: {withConversion, withoutConversion}, dotted }`.
- **Params drive live:** changing the value or the host order rewrites the strips; toggling "convert"
  switches the reader row between `ntohl(x)` and a raw load.
- **Rules:**
  1. Big-endian stores the most significant byte at the lowest address; little-endian stores the least
     significant byte there (Cohen, "On Holy Wars and a Plea for Peace", IEN 137, 1980; most desktop and server
     processors are little-endian, see Sources).
  2. Internet protocol headers send multi-byte fields most significant byte first: "network byte order"
     is big-endian (RFC 1700 / RFC 791 Appendix B "Data Transmission Order").
  3. A host converts with `htonl`/`htons` before sending and `ntohl`/`ntohs` after receiving; on a
     big-endian host they do nothing (POSIX `arpa/inet.h`).
  4. A raw load of wire bytes on a little-endian host reverses the byte order of the value (never the bits
     inside a byte).
  5. Single bytes and byte strings (ASCII text) have no byte order; only multi-byte integers do.
- **Params:** `width` choice 16 / 32 (default 32); `value` select of preset values (and hex digits typed in
  a stage field, see the note); `host` choice little-endian / big-endian (default little); `convert`
  toggle (default on).
- **Presets:**
  1. `ipv4-address` (from URM ch08 Primjer 1): 172.16.5.30 = 0xAC10051E = 2 886 731 038. Wire and BE memory:
     AC 10 05 1E; LE memory: 1E 05 10 AC. Loaded raw on a little-endian host without `ntohl`: 0x1E0510AC = 503 648 428, which
     prints as 30.5.16.172.
  2. `port-443`: 16-bit 443 = 0x01BB; wire 01 BB; LE memory BB 01; read raw on a little-endian host = 0xBB01 = 47 873.
  3. `textbook`: 0x0A0B0C0D (the usual teaching value): BE 0A 0B 0C 0D, LE 0D 0C 0B 0A (derived).
  4. `text`: the string "HTTP" = 48 54 54 50 in every order (no byte order for bytes).
  5. `big-host`: host big-endian, 0xAC10051E: memory equals the wire, `ntohl` is a no-op.
- **Steps:** explorer, none.
- **Legend:** most significant byte (bold border, "MSB"), least significant ("LSB"), address labels, wire order
  arrow; a byte's colour follows the byte across strips (plus its hex text, so colour is not alone).
  "Changed" marks the reader row when the conversion toggle changes the result.
- **Captions:**
  - hr: „Na žici adresa 172.16.5.30 putuje kao AC 10 05 1E (mrežni poredak okteta). Računalo s little-endian poretkom sprema je obrnuto:
    1E 05 10 AC. Bez `ntohl` program čita 30.5.16.172.“
  - en: "On the wire 172.16.5.30 travels as AC 10 05 1E (network byte order). A little-endian host stores it reversed:
    1E 05 10 AC. Without `ntohl` the program reads 30.5.16.172."
- **Terms:** byte order (endianness) — poredak okteta (check); big-endian / little-endian — keep English,
  explain once; network byte order — mrežni poredak okteta (check); octet — oktet (URM); most significant
  byte — najznačajniji oktet; address — adresa.
- **Misconceptions:** little-endian reverses bits (only bytes); text is affected (preset 4); the network
  "converts for you" (the program must call `ntohl`/`htons`).
- **Out of scope:** bit order on the physical layer (Ethernet sends each byte LSB first), middle-endian
  formats, floating-point byte order, the AAAA record example (URM ch14 mentions network byte order there).
- **Note for the coordinator:** the kit has no text-input param type; "write values" needs either a select of
  values or a page-owned text field on the stage. A shared `text` param would serve this, `floating-point`
  and `regex-to-nfa`.

<!-- model: filled -->

## Steps

1. `kit/new-sim.sh endianness sims/endianness` (copies the template and writes a `wip` `sim.json` stub), or the admin's + Novi simulator.
2. Write `sims/<id>/SPEC.md` from "Model and presets" above: every rule, tie-break and expected number, with its source. Check the numbers with a small script before coding (playbook §2).
3. Model in `sim.js` (pure, deterministic), rule tests in `sim.test.js`: one test per rule, tie-breaks first, and break the code once to see each test fail.
4. Page in `index.html`: stage, caption, presets, params, legend, explanation, both languages.
5. `sim.json` with every required field; `status: "wip"` until done.
6. Checks and screenshots (COMMON.md §7); `NOTES.md` with decisions, sources and timing.

## Done when

- Everything in COMMON.md §8 (definition of done) holds.
- Only files under `sims/endianness/` changed.
- The report lists what you could not check, the shared requests, the tags you used, and the time from start to done.
