<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# tcp-states: notes

Task `docs/tasks/w3/tcp-states.md`, catalogue `net-tcp-states` (§4.1, overlap §5.8). A stepper over the RFC 9293 state
machine at both ends of one connection: client A and server B on the kit's K1 sequence chart, and beside it the state
diagram of RFC 9293 Figure 5 with A (circle) and B (square) marked and the transition just taken drawn thick. Rules,
tie-breaks and expected numbers: `SPEC.md`.

## Decisions

- **One step = one event** (task "One step"): a user call, a delivery (or loss) of the oldest segment in flight, or the
  2×MSL timeout. A segment is sent in one step and arrives in a later one, so the chart shows it "in flight" (dashed,
  "u letu") in between; the time column shows `sent→delivered`. State changes on receipt, as in `tcp-handshake`.
- **Model state keyed `A`/`B`**, not the task's `a`/`b`, so segment `from`/`to` index it directly. The task's fields are
  all there (`state`, `sndNxt`, `rcvNxt`, `finSent`, `finAcked`; `inFlight`, `chart`, `log`, `t`) plus `iss`, `finRcvd`,
  `passive` (for SYN-RECEIVED + RST → LISTEN), `ackOwed` (combineFinAck), `edge`/`edgeAt` (the transition taken, for the
  thick edge) and `twAt`. `last` records what the step did, for the caption.
- **"Drive both ends" is a sixth preset, `drive` (Ti upravljaš / You drive)**, added by simdeck. The catalogue's "student
  does" is "drive both ends, watch states", and rule 14 (illegal calls rejected) and rule 5 (simultaneous open) only show
  when the student can make the calls, so the page has buttons for passive/active OPEN, SEND 100 B and CLOSE at each
  end, and "deliver / lose the oldest" and "2×MSL passes" for the network. A click appends the event after the current
  step (dropping later ones) and steps to it; step back and forward replay it. The events live in the param `script`,
  which is not a control, so it is **not in the URL**: a reloaded or shared `?preset=drive&step=n` link starts empty.
  Deliver, lose and timeout are `aria-disabled` with a tooltip when nothing is in flight or nobody is in TIME-WAIT;
  user calls are always allowed, so the student sees the rejection. At most 30 events. `combineFinAck` applies to the
  scenarios only.
- **The five task presets are params, not hard-coded scripts:** `mode` (scenario / you drive), `listen` (B passive OPEN;
  off = closed port), `closer` (A / B / both), `combineFinAck`, `halfCloseData` (0–3). The scenario is built from them
  (`script()` in sim.js), so every combination steps. `halfCloseData` 3 gives 21 steps without `combineFinAck` (20 with):
  "about 20" (COMMON.md §3); every preset and the default stay at 18 or fewer, and `sim.json` `steps` is the default's 12.
  `combineFinAck` and `halfCloseData` are disabled with a reason when both ends close.
- **ISNs fixed at 4000 / 9500** (task: "fixed … from the host model"); no control.
- **Flags as `tcp-handshake` writes them:** every segment after the SYN carries the ACK field (the model's flags are the
  real bits, FIN+ACK), but the chip says FIN unless that segment is the first to acknowledge the peer's FIN
  (combineFinAck), data is a "podaci" chip with `len`, a pure ACK is K1's thin line. All numbers match
  `tcp-handshake`'s handshake and closing modes (tests).
- **RST answers** follow RFC 9293 §3.5.2 group 1: with an ACK field `<SEQ=SEG.ACK><CTL=RST>`, without one
  `<SEQ=0><ACK=SEG.SEQ+SEG.LEN><CTL=RST,ACK>` (a SYN counts 1), so preset 5 gives the task's RST+ACK seq=0 ack=4001.
- **Simultaneous open** (free mode) follows Figure 8: each end answers the other's SYN with SYN+ACK and goes
  SYN-RECEIVED; the crossing SYN+ACKs take both to ESTABLISHED with no third ACK.
- **Simplifications** (SPEC.md): a segment out of order (a gap after a loss) is dropped without the RFC's ACK reply, and
  SEND before ESTABLISHED is rejected ("connection not yet established") instead of queued. Both only reachable in the
  free mode; retransmission and queues are other concepts (`tcp-retransmit`).
- **The state diagram** is HTML boxes placed in % of their area and an SVG of the arrows drawn in px after layout (and on
  resize), so every label is 1:1 HTML text at any size (COMMON.md §3: no scaled SVG text). Layout and arrows follow
  Figure 5, including its second CLOSED box at the bottom right: an end that reached CLOSED from LAST-ACK, TIME-WAIT or
  an RST is marked there, otherwise at the top. Edge labels (rcv FIN / snd ACK) are left out for space: the caption
  names the event and the meaning of the transition. FIN-WAIT-1 → TIME-WAIT (the tie-break, in §3.10.7.4's text but
  not in the figure) is drawn as its own arrow between FIN-WAIT-2 and CLOSING. Any-state → CLOSED on a valid RST has no
  arrow (as in the figure); the box and caption still change. Long names have a soft hyphen (SYN-RE·CEIVED,
  ESTAB·LISHED) so they break on a phone.
- **Lane cards** show the state (dashed and grey when CLOSED: no socket), the next number the end sends and the one it
  expects ("–" before the handshake). The "→ STATE" receiver words of K1 were tried and dropped: on a two-lane chart
  beside the diagram they collide with the `seq= ack=` fields. The receiver words kept are short: "u letu", "odbačen",
  "ACK čeka". A lost segment is K1's `drop` (✕ half way), without a word for the same reason.
- **Captions** are composed: "Korak n:" + the event sentence + "X prelazi u STATE:" + the meaning of that transition
  (one string per edge, `m-<edge>`), so free-mode steps get captions too. The task's two sample captions come out as
  "Korak 6: A poziva CLOSE i šalje FIN seq=4001 ack=9501. A prelazi u FIN-WAIT-1: više ne šalje, ali i dalje prima." and
  "Korak 10: A prima FIN seq=9501 ack=4002. Odgovara s ACK seq=4002 ack=9502. A prelazi u TIME-WAIT: potvrdio je FIN od
  B i čeka 2×MSL da zakašnjeli segmenti nestanu iz mreže."
- **Misconceptions** on the page: (1) closing is two independent FINs (explanation, `m-estab-fin`, half-close preset);
  (2) TIME-WAIT belongs to whoever closes first (`server-closes`, the timeout caption, explanation); (3) each end has its
  own state (the two lane cards, two markers, `m-synsent-synack`: "for A the connection is established, although B does
  not know it yet").
- **TIME-WAIT length:** 2×MSL = 4 min by the standard and "60 s on many systems"; no operating system is named
  (concepts, not tools; as `tcp-handshake`).
- **No `entries`** in sim.json: `tcp-handshake` already lists the closing presets (close-server, simultaneous) on the
  home page; this page is the union (catalogue §5.8). `related`: tcp-handshake, tcp-retransmit, syn-outcomes.
- **K1 view** exists, so the chart uses it (no own drawing). The model functions `seqAdd` and `seqLen` are copied from
  `sims/tcp-handshake/sim.js @ 1ec6cfd` (no TCP model in `models/` yet).
- Six presets in two columns and a 26rem panel (as `tcp-handshake`): one column overflowed the panel by 30 px at
  1920×1080.

## Numbers

Checked before coding with an independent arithmetic script (SYN/FIN take one number, data its length): handshake
4000 / 9500 4001 / 4001 9501; close 4001 9501 → 9501 4002 → 9501 4002 → 4002 9502; half close 9501, 9601 (acks 9601,
9701), FIN 9701, ack 9702; simultaneous FINs 4001/9501 and 9501/4001, ACKs 9502/4002 and 4002/9502; RST+ACK 0 / 4001.
All in `sim.test.js`.

## Rules checked by breaking them

37 mutations of `sim.js`, each made its rule's test fail (the last 12 added after the fresh review): passive OPEN does nothing; SYN takes no number; SYN+ACK acks
SEG.SEQ; no ACK after SYN+ACK; simultaneous open ignored; SYN-RECEIVED stays; FIN in ESTABLISHED keeps ESTABLISHED;
tie-break goes to CLOSING; FIN-WAIT-1 + FIN goes to TIME-WAIT; no FIN-WAIT-2; CLOSING stays; LAST-ACK → TIME-WAIT;
CLOSE in CLOSE-WAIT → FIN-WAIT-1; timeout does nothing; FIN takes no number; CLOSED stays silent; RST ack = SEG.SEQ;
SYN-SENT ignores the RST; synchronized states ignore a valid RST; a lost segment is delivered; CLOSE allowed in CLOSED;
SEND allowed after CLOSE; combineFinAck ignored; LIFO delivery; FIN-WAIT-2 cannot receive; CLOSED answers an RST;
LISTEN answers an RST; LISTEN + ACK gets no RST; an active SYN-RECEIVED + RST goes to LISTEN; LISTEN after an RST keeps
the old numbers; OPEN keeps `passive`; OPEN keeps the old TCB; SEND allowed in SYN-RECEIVED; SYN-RECEIVED + FIN without
`via`; no notes for calls; no timeout note; no `became` on delivered rows.

## Fresh review

A fresh reviewer (a subagent with no part in the build) read the code against SPEC.md, ran the presets, 200k random
free-mode walks (no crash) and its own mutations. Fixed from its findings:

- **A second connection never closed** (free mode): OPEN did not clear the FIN flags of the first connection, so the
  second FIN was ignored. OPEN now starts a fresh TCB (SPEC.md).
- **SYN-RECEIVED + FIN** (the handshake's ACK lost) reported the edge `synrcvd-ack` while the end went to CLOSE-WAIT;
  now `estab-fin` via `synrcvd-ack`, both arrows thick, and the caption says the FIN also acked the SYN.
- **`evHeld` was false with combineFinAck and half-close data**: the held ACK rides on the next segment (data), not
  always on the FIN. Reworded.
- Test gaps it found (RST never answered, LISTEN + RST/ACK, active SYN-RECEIVED + RST, fresh numbers, SEND in
  SYN-RECEIVED, chart notes and outcomes) now have tests.
- Nits taken: SPEC's FIN+ACK label wording; active OPEN in LISTEN noted as a simplification; "established for {e}
  too" lost its "too"; the TIME-WAIT caption now says the end that sent its FIN before receiving the other's (true in a
  simultaneous close too); a both-CLOSE caption that could not find its segments no longer throws.
- Left as is (documented): no arrow for any-state → CLOSED on an RST (Figure 5 has none); a crossed SYN+ACK lost in a
  simultaneous open leaves the end in SYN-RECEIVED (no retransmission); strict `seq = rcvNxt` acceptance.

## Sources

- URM ch. 13 (`book/chapters/13-transportni-sloj.md`): "TCP: uspostava veze i trostruko rukovanje", "TCP: zatvaranje
  veze" (half close, "Zatvaranje, drugim riječima, nije otvaranje unatrag"), Primjer 3 (X = 4000, Y = 9500).
- URM ch. 15 "Tri ishoda jednog TCP SYN paketa" (CLOSED answers every segment but an RST with an RST).
- RFC 9293 §3.3.2 Figure 5, §3.4.2 (MSL 2 min), §3.5 Figure 8 (simultaneous open), §3.5.2 (reset generation), §3.6 and
  Figure 13 (simultaneous close), §3.10.1–3.10.4 (user calls and their errors), §3.10.7 (segment arrives; §3.10.7.4
  order ACK, text, FIN; FIN-WAIT-1 + FIN with our FIN acked → TIME-WAIT).
- Linux kernel headers 6.8, `include/net/tcp.h`: `TCP_TIMEWAIT_LEN (60*HZ)`, checked. Note: the task file cites
  `tcp(7)` `tcp_fin_timeout`, which is the FIN-WAIT-2 timeout, not TIME-WAIT; the 60 s on the page is TIME-WAIT's.
- `sims/tcp-handshake` (numbers and conventions of the closing modes).

## Term pairs (missing from kit/glossary.js; written out in strings.js)

| en | hr (URM book) |
|---|---|
| connection state | stanje veze |
| three-way handshake | trostruko rukovanje |
| sequence number | redni broj |
| acknowledgment number | broj potvrde |
| half-closed connection | poluzatvorena veza |
| socket | *socket* (kept in English, as the task says) |
| listen | osluškivati |
| flag | zastavica (not used on the page) |

State names, flags and the user calls OPEN, SEND and CLOSE stay in English as data (`translate="no"`), as RFC 9293 names
them.

## Shared requests

- **Kit, `t.parts`:** a node passed as a placeholder value that occurs twice in a string lands only in its last place
  (already reported by `tcp-handshake`). The page clones repeats (`parts()` in index.html).
- **Kit, controls:** a control with `visible: () => false` stays on screen (`.sd-ctl { display: flex }` beats `[hidden]`;
  reported by `tcp-handshake`). Page CSS `.sd-ctl[hidden] { display: none; }`.
- **Kit, button params:** a `type: 'button'` param has no `visible` or `disabled`, so the free mode's buttons are the
  page's own group (built with `Simdeck.h`, focus kept off on click as the kit does). A `visible`/`disabled` on button
  params would let pages use the kit's group.
- **Kit, URL state:** params without a control are not written to the URL, so the free mode's events are lost on reload
  and the L switch (which reloads). An opt-in `url: true` on a hidden param, or a `hidden` param type, would keep them.
- **Kit, K1:** a receiver word (`re`) and a long `fields` line collide on a short arrow; an option to put the word under
  the arrow (as on a phone) would let a page keep "→ STATE" at the tip.
- **models/:** a shared TCP model (catalogue §5.8): `seqAdd`, `seqLen` (from `tcp-handshake`) and this page's
  `apply`/`receive`/`call` are pure and string-free, ready to promote.

## Checks not done here

- A real projector and a lecturer with a clicker.
- The free mode with a screen reader.

## Time

Start 2026-11-08 20:22, done 20:59 (one session; about 12 minutes of it waiting on the fresh reviewer).
