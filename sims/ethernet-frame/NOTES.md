<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# ethernet-frame: notes

New explorer (task `docs/tasks/w3/ethernet-frame.md`, catalogue `net-ethernet-frame`, §4.1, wave 3). No kit view: the
task names none, and a field strip is not one of K1–K4. Rules and expected numbers: `SPEC.md`.

## Decisions

- **Scene.** Three bands: a length meter (0–1600 octets, linear, marks at 64 and 1518, the frame's header, data, pad
  and FCS as segments); the field strip (preamble 7 and SFD 1 dotted and muted under a dotted "not counted"
  bracket, then destination to FCS under the "frame: n octets" bracket, with header / data (+ padding) / trailer
  brackets and the running octet count at each boundary); and the FCS check (sender → on the wire → receiver, with
  ✓ / ✗ and the words, never colour alone).
- **Strip widths** as in `encapsulation`: a CSS grid, `minmax(<min>rem, <octets>fr)` per field, so the 1500-octet
  data takes the room while a 2-octet type stays readable. The MAC addresses are split over two lines (first three
  and last three octets) so the address blocks stay narrow.
- **Reuse from `encapsulation`:** its strip technique (grid columns, brackets with `::after`, hatching, the `*word*` →
  `<em lang="en">` helper). Its model is not in `models/` and nothing of it is needed here (sizes are constants, the
  frame is not built by layers), so no model code was copied.
- **Data content** is a fixed pattern of the length (octet i = (29·i + 7) mod 256), so the FCS depends only on the
  params and every preset's FCS is reproducible (SPEC.md table). The data block shows what the type says it carries
  ("IPv4 packet", "ARP message"), not its bytes.
- **Source address** fixed at AC-DE-48-00-00-80 (AC-DE-48 is the IEEE's example OUI, like the task's
  AC-DE-48-23-45-67), so no real vendor's OUI appears.
- **Bit flip.** `flip` is a model param (−1 or the bit index, 0 = most significant bit of the first destination
  octet). In the page it is a hidden range so the URL and the language switch keep it; "Flip one bit in transit" (E)
  picks a covered bit with `Simdeck.rng` (a different one each press), "Clear the error" (X) sets −1. A flip past the
  end of a shorter frame takes the last covered bit (SPEC rule 10). The flipped field carries "⚡ bit k" and a red
  frame; the wire box names the field.
- **Refused actions:** kit buttons have no `disabled`, so E on a refused frame and X with no error do nothing and add
  the reason to the caption (highlighted) until the next change; focus stays on the button.
- **Data over 1500:** the slider goes to 1600 (SPEC rule 5) so the refusal can be reached by hand; the strip still
  draws the would-be frame with the data block framed in red and "✗ too long", the meter shows the length in red
  with "not sent", the FCS is "—" and the check band is replaced by the refusal.
- **"Changed"** compares with the state before the last input (`changed()` in the model, tested): the fields whose
  size or value changed, the sender box when the FCS changed, the wire and receiver boxes when the check changed. A
  first load or a URL with a preset marks nothing.
- **Presets in two columns** with short names (the hints carry the numbers), so the panel fits at 1920×1080.
- **Length/type options are EtherTypes only** (as the task lists). The rule's other side (≤ 1500 is a length, and the
  gap 1501–1535) is in the model and its tests and in the explanation, not a control.

## Deviations from the task

- **Payload slider 0–1600**, not 0–1500, so `too-big` (1501) is on the slider's scale and the refusal can be shown
  by dragging (task rule 5 needs a value over 1500).
- **State:** `payloadBytes` is not stored (1500 numbers per render); the state carries the derived fields the page
  draws (`fields` with offsets, `coveredBits`, `flipField`, `typeHex`, `dstKind`, `wireLen`). Otherwise as the task's.
- **`flip` and `fix` buttons** write a hidden `flip` param (see above) instead of a separate state field.
- **Rule 6 tie-break 1501–1535** (neither length nor type) is not in the task; the model returns `'undefined'`
  *(check IEEE 802.3 §3.2.6)*.
- **Captions:** the task's hr caption for `arp-request` and en caption for `bit-flip` are used word for word with the
  numbers filled in. The others follow the same pattern.

## Sources

- Task file, model and presets.
- URM `book/chapters/07-podatkovni-sloj.md`: "Građa Ethernet okvira i MAC adresa" (field order and sizes, 64/1518,
  padding, preamble and SFD not counted, I/G bit, FF-FF-FF-FF-FF-FF; footnotes ieee-frame-format = IEEE 802.3-2002
  Figure 3-1 via the 802.3as slides, ieee-frame-sizes), "Okviri veći od 1500 okteta" (footnote ieee-jumbo), the
  CSMA/CD paragraph on the 64-octet minimum (footnote emory-slottime), Primjer 1 (01-00-5E-00-00-01 is multicast).
- URM `assets/diagrams/ch04-enkapsulacija-dekapsulacija.svg` (frame with header and trailer).
- IEEE 802.3 clause 3: §3.2.6 Length/Type, §3.2.8 Pad, §3.2.9 FCS *(check clause numbers; not read here)*.
- RFC 826 (ARP packet; 28 octets for IPv4 over Ethernet) *(check)*. EtherType values 0x0800, 0x0806, 0x86DD from the
  IEEE registry *(check)*.
- CRC-32: the standard reflected CRC (as zlib), test vector "123456789" → 0xCBF43926 (tested).

## Checks

- Numbers: an independent Python script (zlib.crc32) before the model; the model agrees (SPEC.md table, `sim.test.js`
  "expected numbers of every preset").
- Rule tests broken on purpose, 26 mutations one at a time, every one caught: preamble 8, destination 4, type 4,
  FCS 2, minimum data 40, maximum data 1518, pad one too many, pad to a 64-octet packet, preamble counted on the wire
  only / in the frame, refusal at ≥ 1500, a refused frame that still gets an FCS, type at > 0x0600, length at < 1500,
  no "undefined" gap, wrong CRC polynomial, no final XOR, pad not covered by the FCS, pad of ones, FCS without the
  destination, a flip that changes the sent FCS, a flip that wraps instead of clamping, broadcast read as
  multicast, I/G read from the high bit, `changed` missing the pad, the flipped field from the bit instead of the
  octet.
- Fresh review (a separate agent read the diff against `SPEC.md` and the task, recomputed every number with
  zlib.crc32, broke the model 39 ways in a scratch copy, 36 caught and 3 equivalent mutants, and read every caption
  and label in both languages at the edge params). Fixed from it: the meter's scale was 1600 while the slider makes
  frames up to 1618 (the bar overflowed past payload 1583); the hr explanation began a sentence with a lowercase
  *header* and used zaglavlje/podnožje before their first-mention terms; the hr multicast tag "skupni" → "skupini";
  "Clear the error" now also clears a flip kept under a refused frame; SPEC said the buttons are aria-disabled
  (they cannot be) and cited the ch07 FCS bullet for the silent discard (it is not there; now *(check)* in IEEE
  802.3); hr wording ("najviše dopuštenih 1500 okteta", "u tih 64 okteta", preset "Pogrešan bit"); dead
  conditions in `changed()` removed. Numbers, rules and the English text: no findings.
- `npm run gate -- ethernet-frame`: all checks pass (manifest, 23 model tests, build, 46 browser checks, tokens,
  scope), 0 exceptions declared.
- Screenshots reviewed at 1920×1080 (light, dark, grayscale) and 375×812, hr and en, plus `arp-request` (hr),
  `bit-flip` (en), `too-big` (hr), `full-frame` (en), E on `too-big`, E and X on `tcp-ack`. Grayscale: every block
  carries its name, the pad is hatched and dashed, the preamble dotted, the bad block and box framed, the verdict has
  ✓ / ✗. On a phone the strip scrolls inside its own box (the page does not scroll sideways).

## Term pairs (not in `kit/glossary.js`; written out in both tables)

| English | Croatian | Source |
|---|---|---|
| padding | nadopuna | URM ch07 ("okvir se nadopunjuje") *(check term)* |
| frame check sequence (FCS) | provjera ispravnosti okvira | URM ch07 |
| preamble | preambula | URM ch07 |
| start frame delimiter (SFD) | graničnik početka okvira | URM ch07 |
| destination / source address | odredišna / izvorišna adresa | URM ch07 |

Used from the glossary: `frame` (okvir), `header` (zaglavlje), `trailer` (podnožje). The same pairs are listed in
`sims/encapsulation/NOTES.md`; one glossary entry each would serve both.

## Shared requests

- **kit: `.sd-ctl[hidden]`** — `kit.css` gives `.sd-ctl` `display: flex`, which beats the `hidden` attribute that a
  param's `visible()` sets, so a hidden control still shows. Smallest change: `.sd-ctl[hidden] { display: none; }` in
  `kit.css`. Worked around in the page CSS (as `sims/amdahl` does); drop the line once the kit has it.
- **kit: `disabled` for button params** — a button param cannot be refused (`aria-disabled` with a reason) the way
  other controls can; the page puts the reason in the caption instead.

## Tags

Topic `networks`, tag `ethernet` (both in `tags.json`).

## Time

Start to done: one session, 16:59–17:21 on 2026-11-08 by the wall clock (about 22 minutes), including the review.
