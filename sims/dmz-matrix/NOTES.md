<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# dmz-matrix: notes

Task `docs/tasks/w3/dmz-matrix.md` (thread t-0204, 2026-10-30), catalogue `sec-dmz-matrix` (§4.3). Explorer. One
concept: which zone may open what to which. Rules and numbers: `SPEC.md`.

## Decisions

- **The matrix is drawn in the page, not with kit view K4.** The task names K4 "once it exists"; it exists (kit 0.5.0).
  K4 draws an ordered rule list with a pointer, a deciding row, unread rows hatched and an implicit last row. This
  sim's matrix is the opposite of that on purpose: a cell is a set, order inside it does not matter, and there is no
  "first match" to point at (task rule 2, the contrast with `rule-first-match`). Six zone pairs as K4 rows would also
  lose the "from → to" grid the task asks for and would not fit beside the scene and the tests. The test verdicts use
  ✓/✕ in `--ok`/`--danger`, like K4's verdict. No shared request: a 3×3 matrix of toggle chips has no second consumer
  yet.
- **Reuse of `stateful-firewall`:** not promoted to `models/`, and its functions (`judge`, `lookupState`,
  `firstMatch`) are not copied: they judge packets against an ordered rule list with a state table of
  addresses and ports. Here the same reply rule (stateful: the reply passes by state; stateless: it needs its own
  entry for the source port, URM Primjer 5) works at the zone level, in `judgeTest`. What is reused is the zone
  drawing (three zones on interfaces 1/2/3 of the book's figure, no line between DMZ and LAN) and the addresses
  (192.168.1.10, 198.51.100.10). `zoneOf`, `lookup`, `replyEntry` and `judgeTest` are pure over plain data, ready for
  `models/` if a later sim needs a zone matrix.
- **Stateless reply entries are chips of their own** (↩, dashed) in the reverse cell, offered for each service the
  opposite cell opens (every service when it lists `any`), and kept while set. A service chip `tcp/443` in internet → LAN is "the internet may open port
  443 in the LAN", not "replies from port 443 may come back"; the task's `stateless` preset says the reply needs "an
  entry for source port 443". In stateful mode only the reply entries a cell holds are shown (they change nothing then: the
  caption says so). Switching a chip off in a cell that still lists `any` says that `any` still allows it. Rejected: making the service chip count as the reply entry (it conflates the two directions,
  which is the point of Primjer 5).
- **Cells as hidden params.** Each cell is one number (bits 0–9 the services, 10–18 the reply entries), a hidden
  `range` param, so a preset, a reload, a copied link and the L switch keep the matrix (the `distance-vector` and
  `reverse-proxy-lb` pattern of hidden params). The settings' own reset button is hidden: the explorer's transport has
  the same one (R).
- **Nine tests, not eleven.** A first layout with eleven tests (one per preset outcome, plus a DMZ mail test and a DNS
  query) overflowed the stage at 1920×1080 with the stateless reply chips. Dropped: internet → DMZ mail tcp/25 (the
  same lesson as web tcp/443) and LAN → DNS udp/53 (the UDP reply is `stateful-firewall`'s question 13). The mail
  server stays in the scene (the book's figure has it) and in the attacker's tests (a5, same zone).
- **`compromised` replaces the test list** with six attempts from the DMZ web server (task: "starts tests from the
  DMZ web server"): three LAN services, the client's tcp/22, the DMZ mail server (same zone: passes, the segmentation
  point) and the internet (outbound from the DMZ, deny by default). The `web-compromised` preset turns it on; the
  attacker is tagged on the scene.
- **Tie-break "not filtered here":** a test inside one zone draws a straight arrow with no firewall and says "does
  not cross the firewall"; the matrix diagonal is hatched with "inside one zone: not filtered here". The explanation
  names internal segmentation (URM Šire o temi).
- **`any-any` preset:** the task says "every test into the LAN passes"; with an any rule internet → LAN that is every
  test *from the internet*. t8 (DMZ → LAN tcp/5432) stays dropped: CV-58's rule is internet → LAN, and SNMP from
  anywhere (CV-44) adds only udp/161 to DMZ → LAN. Recorded in SPEC.md. *(check: whether the owner wants DMZ → LAN any
  too)*
- **`rdp-forward`:** one entry internet → LAN tcp/3389 opens tcp/3389 on both LAN hosts in the tests (t3 client, t4
  file server): a cell is per zone, not per host. The page says "meant for one computer"; the matrix has no host
  column by design (task scene). *(check: this is the outcome the task calls derived)* The preset is named
  "tcp/3389 for one computer", with "remote desktop" in the hint, not the protocol's product-family name (concepts,
  not tools); its id stays `rdp-forward` as the task names it.
- **"Changed" mark:** compared with the state shown before the last param change (the `reverse-proxy-lb` pattern).
  A chip click marks its cell and chip, and every test row whose verdict changed; a preset or a toggle marks only the
  rows. Switching `compromised` (a different test list) marks nothing.
- **Captions:** after a chip click, the task's two sentences ("Internet → DMZ, tcp/443: allowed by the cell's rule." /
  "DMZ → LAN, tcp/445: no rule, deny by default."), with an `any` and a reply-entry variant, then which tests changed.
  Otherwise a summary: tests that work both ways, requests denied by default, tests inside one zone, the mode, replies
  without a rule.
- **Addresses:** the task's 203.0.113.10 for the DMZ web server; DMZ and internet in documentation blocks, the LAN
  private, no NAT (rule 6). The LAN would need NAT to reach the internet in reality; the explanation says why NAT is
  not in the matrix. *(check: whether the owner wants a line about it on the stage)*
- **Instructor material:** CV-44, CV-58 and CV-59 only shaped two presets (an any rule, udp/161 to every zone, one
  tcp/3389 entry); nothing of their text, hosts, dates or answers is on the page, and the hints are worded as kinds of
  mistake, not after the caveats' headings. *(check: the coordinator may want them more generic still)*
- **Colour is not the only carrier:** allowed chips are filled and start with ✓; reply entries are dashed with ↩; a
  dropped arrow ends in ✕ at the firewall bar with a dotted rest; the reply is dashed; verdicts have ✓/✕ and words;
  zones are named everywhere and carry a colour bar. Checked in the grayscale screenshots.

## Sources

- URM ch. 18 (`book/chapters/18-kiberneticka-sigurnost.md`): „Vatrozid: filtriranje, segmentacija i ono što nije
  sigurnosna mjera" — Što treba znati (DMZ, deny by default, NAT not a security function; footnotes `nist80041-*`
  quoting NIST SP 800-41 r1 §2.1.1–2.1.2, §3.1–3.2, §4), Šire o temi (internal segmentation), Primjer 5 (stateful vs
  stateless), figure `ch18-dmz-vatrozid.svg` (interfaces 1, 2, 3; "nema izravne veze"; drawn in HTML, not copied).
- `uvod-u-racunalne-mreze/output/interaktivno/ugradbeno/vatrozid.html`: the DMZ explanation and question 3 ("DMZ is
  not a hole").
- `dr-lecture-estate/instructor/caveats.md` CV-44, CV-58, CV-59: kinds of mistake only (see above).
- `sims/stateful-firewall/` (zones, addresses, the reply rule) and its NOTES.md.

## Term pairs (missing from `kit/glossary.js`; written out in the explanation)

| en | hr (URM book) |
|---|---|
| demilitarized zone (DMZ) | demilitarizirana zona |
| protected network | zaštićena mreža |
| deny by default | odbij po zadanome |
| stateful inspection | filtriranje sa stanjem |
| stateless | bez stanja |
| segmentation (network) | segmentacija |

`firewall` = vatrozid is in the glossary and used as `[[firewall]]` (the page links `glossary.js`). The glossary's
`segmentation` is the ossimulator (memory) sense, so the page does not link it. The other terms follow the term rule
by hand (`<em lang="en">`, the Croatian in parentheses).

## Shared requests

- **Glossary:** add the pairs above with `"src": "simdeck"` (network segmentation as its own entry, apart from
  ossimulator's memory segmentation).

## Checks

- Tests: 20 (six tie-breaks first, rules 1–6, the presets' numbers, the changed list, the param ranges, then the
  template's generic block). Mutation run on the model: 14 mutants (same zone ignored, `any` ignored, default allow,
  the reverse cell read, stateful ignored, a stateless reply passing without a rule, a service chip counting as a
  reply entry, `any` not covering replies, the reply entry looked up in the request's own cell, a reply for a dropped
  request, reply bits allowing a request, the attacker's tests not used, `ok` ignoring the reply, `changed` ignoring
  replies): all killed.
- Gate: pass (46 browser checks, tokens, scope). Screenshots reviewed: the gate's 1920×1080 light, dark, grayscale,
  help and panel hidden, 375×812, in both languages; my own of `stateless` (en, hr), `web-compromised` (hr, en), a
  reply-chip click and a DMZ → LAN click, and the phone page in full. Fixed on the way: the tests overflowing the
  stage (four-line cells beside the scene → the matrix across the top, a test table under it, nine tests), the
  header wrapping to two lines in English (shorter legend words), the interface 2 link drawn behind the stage, the
  attacker tag, a phone label overlapping the DMZ box, arrows losing contrast on the highlighter in dark mode, and the
  reply captions naming the wrong direction.
- Fresh review (a separate agent, playbook §7.4): recomputed every preset and hand check (all match SPEC.md), ran 47
  mutants (five reachable survivors: the test tables and two presets' cells were not pinned; now they are), and read
  the page. Fixed from it: a caption saying "no rule, deny by default" for a chip switched off in a cell that still
  lists `any`; no reply chips offered when the reverse cell opens everything with `any`; keyboard focus lost on every
  chip press (the stage is rebuilt; the pressed chip now gets focus back); the summary's verb following the total
  instead of the count ("4 od 9 … prolaze", "1 of 9 … works"; the kit picks the plural by `{n}`); "Internet"
  overflowing its box on the phone; reply chips in stateful mode showing every offer once one was set; the legend
  calling every dashed reply "by state"; `[[firewall]]` from the glossary; "demilitarised" in both languages; the
  Croatian closing quote; the preset names nearest the caveat headings. Also fixed: rows marked "changed" on a link
  that opens with params (the kit renders the preset, then the link's params, while mounting).
- Unchecked: a real projector and a lecturer; a matrix with many reply entries in stateless mode can need more room
  than the screen has (the test rows then scroll inside their box; no preset does this).

## Time

Start 2026-10-30 13:18, done 13:47 (about 30 minutes, one session, with the fresh review and its fixes).
