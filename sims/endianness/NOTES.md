<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# endianness: notes

New explorer (task `docs/tasks/w3/endianness.md`, catalogue `arh-endianness`, §4.9, wave 3). Rules and expected
numbers: `SPEC.md`. No kit view is named by the task; the stage is plain HTML (a CSS grid of byte cells), no SVG.

## Decisions

- **Typing values.** The kit has no text param. The value select offers five fixed values (172.16.5.30, 443,
  0x0A0B0C0D, 1, the text "HTTP") plus "typed"; a page-owned field on the stage takes up to 8 hex digits and sets
  `{ value: 'typed', hex }` through `sim.set` (the kit accepts a param key with no control). The field is built
  once and never redrawn, so typing keeps focus; kit shortcuts are off while it has focus (kit rule). `hex` is not
  a kit param, so the kit does not keep it in the URL: the page writes `?hex=` itself (the kit's URL writer keeps
  keys it does not own) and reads it once at load, with `?value=typed`. Reset (R) and presets clear it.
- **Width cut and padding.** A value wider than the width keeps its low bytes and the value box says "cut to 16
  bits"; 443 at 32 bits is 0x000001BB (a useful contrast: raw read 0xBB010000). The task did not say; this is the
  usual integer truncation.
- **The wire is always network byte order**: the sender is assumed to call `htonl`/`htons` (the toggle is about the
  receiving program only, as the task says). The reader row reads the received bytes from 0x1000….
- **Reader row**: the read value's bytes, most significant first, each in the colour of the byte it came from (so
  a raw little-endian load shows the colours reversed), then hex = decimal (= dotted for 32 bits). The other
  setting's result is one smaller line below ("without ntohl: …" / "with ntohl: …", or "the same").
- **"Changed"** (legend, yellow + ink outline from `.sd-changed`) marks the reader block only when the last input
  flipped the convert toggle alone and the value read changed (`readerChanged` in sim.js, tested). The page keeps
  the params before the last input for this; it stays until the next input.
- **Text** ("HTTP"): four bytes at 0x1000…0x1003 in every row; width and convert are disabled with their reason
  (kit `disabled`), the cells show the character under the hex, colours `--c5…--c8` by position, no MSB/LSB tags.
- **Colours**: MSB `--c1`, LSB `--c4` at both widths (so the legend holds at 16 bits too), middle bytes `--c2`,
  `--c3`. Colour is never alone: every cell prints its hex, MSB/LSB tags, and the MSB has a thick ink border.
- **Dotted notation** is shown for every 32-bit value (value box and reader); captions name a value as an address
  in dotted form only for the 172.16.5.30 value, otherwise as hex = decimal.
- **Host strip**: the strip of the host's order gets a "★ this host" badge and an underlined label; the other strip
  stays at full contrast (both orders are part of the lesson).
- **Captions**: the task's own words for preset 1 (checked word for word in the browser, en and hr). For a
  big-endian host the third sentence says ntohl does nothing here; for text a single sentence.
- **Default state**: 172.16.5.30, 32 bits, little-endian, convert **on** (the task's default). Preset 1 is the same
  with convert off; toggling it on is the demo's moment and shows the "changed" mark.
- **Explanation** says "most desktop and server processors today are little-endian" without naming a vendor
  (COMMON §1, concepts not tools). `htonl`/`ntohl` are named because they are the subject (the task's rule 3).
- **One equivalent mutant**: deleting `if (a.convert === b.convert) return false;` in `readerChanged` changes no
  result (with equal toggles and equal other params the reads are equal). Kept as an explicit short-circuit.

- **Short stages** (below the 1920×1080 target): a container query on the stage's height tightens the cells and
  hides the row subtitles, so the reader row stays on screen down to 1280×800 (1280×720 is 7 px over, 1024×768 is
  not a target and still clips).
- **A palindrome on a little-endian host** (0xABAB, 0) gets its own store sentence ("… and the bytes read the
  same both ways") instead of a bare "reversed".

## Review (playbook §7.4)

A fresh reviewer read the code against this SPEC, recomputed the numbers and mutated `sim.js`. Fixed from it: the
typed field went stale when a preset was clicked while it had focus; a rejected character moved the caret to the
end; the hr text caption's grammar ("čine"), "16 bitova" in a preset hint; quote marks and the MSB/LSB tags moved
into `strings.js` („HTTP” in hr); the reader row clipped below 1440 px wide (see Decisions). Eleven surviving
mutants (cut, wire colours, dotted reads, the "changed" rule's other params, text colours, preset params, defaults,
the base address, fallbacks) now each fail a test; `sigHost` (unused) was dropped. Equivalent mutants left: the
`0x` → `X` in `cleanHex`, `% 256` → `& 255`, and the `convert` guard in `readerChanged`. Not done: the "changed"
mark is lost when `L` reloads the page in the other language (it compares with the previous input, which a reload
forgets).

## Deviations from the task

- **Added a value "1" (0x00000001)** to the select: the shortest demonstration that little-endian puts 01 at the
  lowest address. Not a preset.
- **Preset 1 has convert off** so it opens on the task's caption ("Without `ntohl` the program reads
  30.5.16.172"); the task lists no params for it.
- **`port-443` has convert off** too, so the 47 873 of the task is on the stage.
- **State fields** are a superset of the task's (`full`, `cut`, `text`, `sig*`, `readBytes`, `differs`, `fn`, …).

## Sources

- URM book, `chapters/08-mrezni-sloj.md`, "IPv4 adresa: adresa je broj" and Primjer 1 "ista adresa, tri zapisa":
  172.16.5.30 = 2 886 731 038 (read and matched).
- URM book, `chapters/14-aplikacijski-sloj.md` l. 687: the RFC 3596 quote "in network byte order" (read; out of
  scope on the page).
- RFC 791 Appendix B "Data Transmission Order"; RFC 1700 "Data Notations" (network order: most significant octet
  first) *(check: not reread for this task; the rule is standard)*.
- D. Cohen, "On Holy Wars and a Plea for Peace", IEN 137, 1980 (the terms big-endian / little-endian)
  *(check: not reread)*.
- Intel 64 and IA-32 SDM Vol. 1 §1.3.1 "Bit and Byte Order" (little-endian) *(check: section number not
  reverified)*. On the page only as "most desktop and server processors".
- POSIX `arpa/inet.h`: `htonl`, `htons`, `ntohl`, `ntohs` convert between host and network byte order. That they
  are identity functions on a big-endian host is how implementations behave; the standard's text only says
  "convert" *(check)*.
- Numbers checked with Python `struct` (2026-11-13): 0xAC10051E = 2 886 731 038; LE 1E 05 10 AC; raw 0x1E0510AC =
  503 648 428 = 30.5.16.172; 443 = 0x01BB, raw 0xBB01 = 47 873; 0x0A0B0C0D = 168 496 141, raw 0x0D0C0B0A =
  218 893 066; "HTTP" = 48 54 54 50.

## Term pairs

The glossary has none of these yet; written out in both tables (Croatian page: English in italics, Croatian in
parentheses at first mention, in the explanation). Proposed glossary entries (`"src": "simdeck"`):

| en | hr |
|---|---|
| endianness / byte order | poredak okteta *(check)* |
| network byte order | mrežni poredak okteta *(check)* |
| big-endian | big-endian (kept in English) |
| little-endian | little-endian (kept in English) |
| most significant byte (MSB) | najznačajniji oktet |
| least significant byte (LSB) | najmanje značajni oktet |
| octet / byte | oktet (URM) |

## Shared requests

- **A `text` param type in the kit** (a short text field in the panel, kept in the URL like other params, with an
  optional `pattern` / `maxlength` / `clean(v)`), as the task notes. This page works around it with a stage field
  and its own `?hex=`; `floating-point` and `regex-to-nfa` need the same.

## Time

Started 03:27 (2026-11-13, brief written), SPEC 03:31, first gate pass about 03:38, review fixes, final gate pass and
commit 03:45: about 20 minutes by the system clock.
