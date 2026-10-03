<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# wpa-handshake: specification

One concept: **where the PMK comes from, the 4-way handshake built on it, and why a recorded WPA2-Personal
handshake lets an observer test passphrase guesses offline while WPA3's SAE does not.**

Task: `docs/tasks/w2/wpa-handshake.md`. Catalogue: `net-wpa-handshake` (`docs/catalogue.md` §4.1).
Class: stepper. Model: `sim.js` (pure). Tests: `sim.test.js`. Words: `strings.js`.

## Sources

- **[B17]** `uvod-u-racunalne-mreze/book/chapters/17-bezicne-mreze.md`, "Sigurnost bežične mreže: od otvorenog
  pristupa do WPA3" (802.11i, PSK vs 802.1X, PMK, WPA3/SAE) and Primjer 5 "osobni naspram poslovnog Wi-Fi-ja";
  figure `assets/diagrams/ch17-pmk-porijeklo-rukovanje.svg` ("Razlika je prije rukovanja: podrijetlo PMK-a").
- **[i]** IEEE 802.11i-2004: §8.5.1.2 (pairwise key hierarchy, PRF, PTK = KCK ‖ KEK ‖ TK), §8.5.3 (4-way
  handshake), Annex H.3 (PRF test vectors), Annex H.4 (passphrase-to-PSK test vectors). Clause numbers are those of
  the 2004 amendment; in IEEE 802.11-2016 the same text is §12.7.1 and §12.7.6 *(check against the edition cited)*.
- **[W3]** Wi-Fi Alliance, *Wi-Fi Alliance® introduces Wi-Fi CERTIFIED WPA3™ security*, press release,
  26 June 2018 (cited in [B17]).
- **[T]** The task file's "Model and presets" (the passphrase-space numbers, the presets, the misconceptions).

## Scene

- K1 sequence chart (`kit/sequence.js`). Lanes: **STA** (the client), **AP**, and in WPA2-Enterprise a third lane,
  the **authentication server** (the figure's "802.1X, poslužitelj autentikacije"). The passive **observer** is the
  chart's eavesdropper column (K1 `eve`): one cell per row, what anyone in range records of that row.
- Each lane card holds that party's **key panel**: passphrase (or the user's own credentials), PMK, PTK split into
  KCK, KEK and TK, GTK. Every secret is a locked box; a secret never appears in any message (rule 5).
- With the observer on, a side panel lists what the observer has recorded so far and its verdict; in
  WPA2-Personal an explorer row shows the passphrase space and the time to try all of it.

## State

```
{ mode, ssid, passClass, passphrase, staMac, apMac,
  sta: { keys }, ap: { keys }, as: { keys } | null,         keys: { cred, pass, pmk, kck, kek, tk, gtk, installed }
  rows: [{ kind: 'msg' | 'note', step, from, to, lane, msg, what, fields: [{ name, value }], air, lock }],
  onAir: [{ msg, from, to, fields: { name: value } }],
  observer: { captured: [{ item, value, step }], canTestGuesses, note },
  last: { did, step }, changed: ['sta.pmk', …] }
```

In `compare` mode the state is `{ mode: 'compare', a: <WPA2-Personal state>, b: <WPA3-Personal state>, … }`.

## Rules

1. **Personal mode: PMK = PBKDF2-HMAC-SHA1(passphrase, SSID, 4096 iterations, 256 bits)** [i §H.4, B17 PSK
   paragraph]. The passphrase is 8–63 characters. Both sides compute the PMK themselves; it is never sent.
   Test vectors [i Annex H.4]: `password` / `IEEE` →
   `f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e`; `ThisIsAPassword` / `ThisIsASSID` →
   `0dc0d6eb90555ed6419756b9a15ec3e3209b63df707dd508d14581f8982721af` (both reproduced with Python's
   `hashlib.pbkdf2_hmac`).
2. **Enterprise mode:** the PMK comes out of a per-user 802.1X/EAP exchange between the STA and the authentication
   server, before the handshake; the server then hands it to the AP over the wired network (not over the air, and
   protected). The 4-way handshake that follows is identical: same messages, same fields [B17 PMK paragraph,
   Primjer 5, figure]. The PMK depends on the user, not on any shared passphrase.
3. **Messages** [i §8.5.3]: M1 (AP→STA): ANonce, in clear, no MIC. M2 (STA→AP): SNonce, MIC. M3 (AP→STA): ANonce,
   GTK encrypted with the KEK, MIC, "install". M4 (STA→AP): acknowledgement with MIC. Each receiver checks the MIC.
4. **PTK = PRF-384(PMK, "Pairwise key expansion", min(AA, SPA) ‖ max(AA, SPA) ‖ min(ANonce, SNonce) ‖
   max(ANonce, SNonce))** [i §8.5.1.2], with PRF-n the 802.11i HMAC-SHA1 PRF (`HMAC(K, A ‖ 0x00 ‖ B ‖ i)` for
   i = 0, 1, …, truncated to n bits). PRF test vector [i Annex H.3]: key `0x0b`×20, prefix `prefix`, data
   `Hi There`, PRF-512 → `bcd4c650…8356cf5a` (reproduced in Python).
   **Tie-break:** min/max compare the values as unsigned byte strings, first byte first (lexicographic). So both
   sides get the same PTK whichever MAC or nonce is smaller, and the order never depends on who computes it.
   Equal values give min = max (no special case). The PTK splits **KCK = bytes 0–15** (computes the MIC),
   **KEK = 16–31** (wraps the GTK), **TK = 32–47** (encrypts data) (CCMP, 384 bits).
   **When:** the STA derives the PTK after M1 (it has both nonces), the AP after M2.
5. **On the air the observer records:** both MAC addresses and the SSID (from the frame headers and the beacon; the
   model records them with the first frame on the air), both nonces, every MIC, the encrypted GTK, and in the other
   modes the SAE commit/confirm values or the EAP exchange as opaque items. **Never** the passphrase, the
   credentials, the PMK, the PTK (KCK, KEK, TK) or the GTK in clear. Test: no secret value occurs in any field of
   any frame on the air, in every mode at every step.
6. **WPA2-Personal, after M2:** everything the PTK depends on except the PMK is on the air, and the PMK depends only
   on the passphrase and the SSID. So with M1 + M2 recorded an observer can **test a guessed passphrase offline**:
   guess → PMK → PTK → MIC, compare with the recorded MIC. `canTestGuesses` turns true exactly at M2 (it needs ANonce,
   SNonce, both MACs, the SSID and M2's MIC). Nothing limits the rate but computing power; the defence is a long
   random passphrase. (The model's test checks the chain works from the recorded values; the page only states it.)
7. **Enterprise:** the PMK is per user and not derived from a shared password: `canTestGuesses` stays false; the
   observer's note is "no shared password to test" from the EAP exchange on. The inner EAP method's strength is a
   separate topic (`aaa-8021x`).
8. **WPA3-Personal (SAE):** before the handshake STA and AP run SAE, shown as two opaque exchanges (commit, confirm;
   each both ways, since SAE is symmetric). The PMK comes out of SAE, from the password **and fresh random values
   of both sides that never go on the air**, not from PBKDF2 of the passphrase. The recorded SAE values do not let a
   guess be checked, so a recording gives no offline test: each guess needs a live
   SAE exchange with the AP, which can refuse or slow it down. Forward secrecy: a new session gives a new PMK even
   with the same password, so learning the password later does not open earlier recordings [W3, B17]. The model
   stands in for SAE's output with `PMK = PRF-256(password, "SAE session", rS ‖ rA)` over two fixed per-session
   random values: it shows *what the PMK depends on*, not how Dragonfly computes it (out of scope, as in [B17]).
   `canTestGuesses` stays false; the note is "each guess needs the AP, online" from the first SAE commit.

### Simplifications (stated on purpose)

- **MIC value:** computed with the real KCK, as HMAC-SHA1 truncated to 128 bits (key descriptor version 2), but over
  a short stand-in for the frame (`"M<n>"` ‖ the frame's nonce: SNonce for M2, ANonce for M3, nothing for M4), not over the full
  EAPOL-Key frame. The value changes with every key it depends on, which is the point; it is not a real frame's MIC.
- **Encrypted GTK** is shown as `{GTK}KEK`, never as made-up ciphertext (AES key wrap is not modelled).
- **Nonces, GTK, the EAP PMK and the SAE randoms** are fixed pseudo-random values (PRF of fixed labels), so every
  run is the same and the tests can name them.
- **MAC addresses** are locally administered (`02:…`), so no vendor is implied. SSIDs: `HomeNet` (personal),
  `Campus` (enterprise).
- **Example passphrases**, one per class, fixed: `qhzkrmto` (8 lowercase letters), `x7Qp2mKa` (8 mixed letters and
  digits), `kava-most-oblak-sedam` (4 random words), `T4v9qLm2Zr8w` (12 random characters),
  `p8Ku3nWq7ZxR2mTb9yLe` (20 random characters). Changing the class changes the PMK, PTK and MICs at the same step.

## Steps

One step = one message (or one exchange) or one local derivation. The STA's PTK derivation after M1 is a step of
its own; the AP's comes with M2 (it needs M2's SNonce), and both installations come with M4.

| Mode | Steps | Sequence |
|---|---|---|
| WPA2-Personal (`psk`) | 6 | PMK on both sides · M1 · STA derives PTK · M2 + AP derives PTK · M3 · M4 + install |
| WPA2-Enterprise (`eap`) | 7 | 802.1X/EAP (STA and server get the PMK) · server → AP: PMK (wired) · M1 · STA PTK · M2 + AP PTK · M3 · M4 |
| WPA3-Personal (`sae`) | 8 | SAE commit · SAE confirm · PMK on both sides · M1 · STA PTK · M2 + AP PTK · M3 · M4 |
| compare (`compare`) | 8 | WPA2 and WPA3 in lockstep, **ends aligned**: WPA2 has nothing before its handshake, so it waits during SAE (steps 1–2), then both compute their PMK at step 3 and run the same four messages, M2 at step 6, ending at step 8 on both verdicts |

Ending aligned makes the identical part (everything after the PMK) sit at the same steps side by side; WPA2's
waiting steps say why (no exchange before the handshake). No variant stops early.

## Params

| Key | Type | Values | Default | Effect |
|---|---|---|---|---|
| `mode` | choice, resets | `psk`, `eap`, `sae`, `compare` | `psk` | which run; `compare` added for the compare preset (deviation, NOTES.md) |
| `observer` | toggle | | `false` | shows the observer column, the observer panel and the explorer row; the model records either way |
| `passClass` | select | `lower8`, `mixed8`, `words4`, `rand12`, `rand20` | `lower8` | the example passphrase; the explorer's highlighted row. Disabled in enterprise (no shared passphrase) |
| `guessRate` | range | 10^3 … 10^10 guesses/s, log scale (exponent 3–10, step 1) | 10^6 | explorer only. Disabled unless the explorer shows (WPA2-Personal with the observer on); elsewhere there is no offline guessing or nothing to show |

## Explorer numbers (derived; the arithmetic is exact, the rate is a slider, not a claim about hardware)

Space = alphabet^length; time to try all = space / rate; a year = 365.25 days.

| Class | Space | At 10^6 /s |
|---|---|---|
| 8 lowercase letters | 26^8 = 208,827,064,576 ≈ 2.1 × 10^11 | 2.09 × 10^5 s ≈ **2.4 days** |
| 8 mixed letters and digits | 62^8 = 218,340,105,584,896 ≈ 2.2 × 10^14 | ≈ **6.9 years** |
| 4 words from a 7,776-word list | 7776^4 = 3,656,158,440,062,976 ≈ 3.7 × 10^15 | ≈ **116 years** (115.86) |
| 12 random characters from 62 | 62^12 ≈ 3.2 × 10^21 | ≈ **1.0 × 10^8 years** |
| 20 random characters from 62 | 62^20 ≈ 7.0 × 10^35 | ≈ **2.2 × 10^22 years** |

The task file says "117 years" for the 4-word row; the exact figure is 115.9 years (Julian or 365-day year alike),
so the page shows 116. Checked with Python (NOTES.md, "Checks").

## Presets

| # | id | Params | Steps | What it shows |
|---|---|---|---|---|
| 1 | `home` | psk, observer off | 6 | the four messages and both key panels [B17] |
| 2 | `observer` | psk, observer on | 6 | after M2 the observer panel turns to "a guess can now be tested offline"; explorer row |
| 3 | `faculty` | eap, observer on | 7 | 802.1X/EAP as one grouped step, per-user PMK, the same four messages; "no shared password to test" [B17 Primjer 5] |
| 4 | `wpa3` | sae, observer on | 8 | SAE commit and confirm, then the four messages; "each guess needs the AP, online" |
| 5 | `compare` | compare, observer on | 8 | WPA2-Personal and WPA3-Personal side by side, ending on the two verdicts |

`sim.json` `steps` is 6 (the defaults are the `home` run).

## Observer notes (the verdict line)

| Mode | Before | From |
|---|---|---|
| psk | `nothing` (nothing on the air yet), then `waiting` (M1 recorded, not enough yet) | `testable` at M2 |
| eap | `nothing` | `noShared` from the EAP exchange |
| sae | `nothing` | `online` from the first SAE commit |

## Legend

In clear (solid arrow) · protected (double line and lock: the server → AP PMK) · `{GTK}KEK` encrypted (hatched) ·
secret held locally (locked box) · recorded by the observer (eye mark) · changed in this step (highlight).

## Misconceptions it targets [T]

- "WPA2 sends the password, or a hash of it." Neither: rule 5's test.
- "A recorded handshake reveals the password." It allows offline testing of guesses (rule 6); strength decides.
- "Enterprise uses a different handshake." Same four messages (rule 2's test compares them).
- "WPA3 is WPA2 with a longer key." Offline guessing stops working (rule 8).

## Out of scope [T]

Guessing in practice (tools, hardware, capture), deauthentication, PMKID, KRACK, TKIP vs CCMP internals, the
mathematics of SAE (Dragonfly), the group key handshake.
