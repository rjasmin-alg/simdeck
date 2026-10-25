<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# email-auth: specification

One concept: **three checks, alignment, and the DMARC verdict.** A receiving server checks one arriving message with
SPF, then DKIM, then reads the DMARC record of the domain in `From:`, aligns each passing identifier with it, and does
what the policy asks. The student sends a legitimate, a forwarded (mailing list) and a spoofed message.
Task: `docs/tasks/w3/email-auth.md` (catalogue `inet-email-auth`, §4.2). Class: stepper, 5 steps. No kit view fits
(the catalogue's "decision path" is not in the kit), so the page draws the path in HTML.

## Scene

The receiver is `mx.drugdje.example`, the recipient `ivan@drugdje.example` (both from `sims/email-path`). The sending
side's DNS zone (what the receiver can read):

| Name | Type | Data | Source |
|---|---|---|---|
| `lab.example` | MX | `10 posluzitelj.lab.example` | UL ch20 |
| `lab.example` | TXT | `v=spf1 a mx -all` | UL ch20 |
| `lab.example` | A/AAAA | (none: the apex has no address) | UL ch19 zone file |
| `posluzitelj.lab.example` | A | `192.168.180.1` | UL ch19 |
| `sel1._domainkey.lab.example` | TXT | `v=DKIM1; k=rsa; p=MIIBIjAN…` (cut as in the book) | UL ch20 |
| `_dmarc.lab.example` | TXT | `v=DMARC1; p=<policy>; rua=mailto:postmaster@lab.example` (+ `; aspf=s` when strict) | UL ch20 with the params |
| `news.lab.example` | A, TXT | `192.168.180.25`, `v=spf1 a -all` | invented |
| `lista.example` | A, TXT | `198.51.100.7`, `v=spf1 a -all` | invented |
| `zlo.example` | TXT | `v=spf1 ip4:203.0.113.66 -all` | invented |
| `mail._domainkey.zlo.example` | TXT | `v=DKIM1; k=ed25519; p=11qYAYKx…` | RFC 8463 App. A example key |

Messages (connection · envelope · header · signature):

| Scenario | IP, HELO | MAIL FROM | `From:` / `To:` | DKIM `d=`, `s=` |
|---|---|---|---|---|
| `legit` | `192.168.180.1`, `posluzitelj.lab.example` | `ana@lab.example` | `ana@lab.example` / `ivan@drugdje.example` | `lab.example`, `sel1` |
| `list` | `198.51.100.7`, `lista.example` | `radionica-bounces@lista.example` (the list's own) | `ana@lab.example` / `radionica@lista.example` | `lab.example`, `sel1` |
| `spoof` | `203.0.113.66`, `mail.zlo.example` | `x@zlo.example` | `ana@lab.example` / `ivan@drugdje.example` | `zlo.example`, `mail` |
| `subdomain` | `192.168.180.25`, `news.lab.example` | `bounce@news.lab.example` | `bilten@lab.example` / `ivan@drugdje.example` | `lab.example`, `sel1` |

`RCPT TO` is always `ivan@drugdje.example`. `signed` off leaves the `DKIM-Signature` out. `listModifiesSubject` (list
only) puts `[radionica] ` in front of the subject after Ana's server signed it, so the signature breaks.

State: `{ n, phase, scenario, receiver, msg: { ip, helo, mailFrom, rcptTo, from, to, subject, tagged, list, dkim: { d, s,
a, intact } | null }, dns (the zone), lookups: [{ step, check, name, type, answer[] }], spf: { domain, ip, record, terms:
[{ text, state, queries }], decided, dnsTerms, result, why }, dkim: { result, domain, selector, keyName, key }, author,
dmarc: { text, p, pGiven, aspf, adkim } | null, aligned: { spf, dkim: { domain, passed, mode, identical, sameOrg,
aligned } | null }, verdict, action, reply: { code, text }, unsubscribed, changed[] }`.

## Rules

1. **SPF checks the envelope.** The domain is the one in `MAIL FROM`, checked against the connecting IP; DMARC uses
   only this identity, never HELO, and SPF never reads `From:`. (RFC 7208 §2.4, §4; RFC 9989 §3.2.4; UL ch20 "Kako
   primatelj zna…".)
2. **Terms left to right; the first match decides** with its qualifier: `+` pass, `-` fail, `~` softfail, `?` neutral,
   default `+`. `all` always matches (so nothing after it is read); `a` matches the A **and** AAAA addresses of the
   name; `mx` takes **two** lookups (MX, then each host's addresses) and with no MX record matches nothing (no fallback
   to A, §5.4). `ip4` compares without DNS. No term matches → `neutral` (§4.7). **Tie-break:** an IP that two terms
   match gets the first term's result. (RFC 7208 §4.6.2, §4.7, §5.1–5.4, §5.6; UL ch20 on `"v=spf1 a mx -all"`.)
3. **At most 10 DNS-querying terms** (`a`, `mx`, `include`, `exists`, `ptr`, `redirect`) per check; the 11th is `permerror`.
   Terms after the deciding one are not evaluated and do not count. **Tie-break:** a match at the 10th DNS term passes,
   one at the 11th is `permerror`. No SPF record → `none`; two → `permerror`. (RFC 7208 §4.6.4, §4.5, §2.6.1; UL ch20.)
4. **DKIM:** the key is the TXT record at `s._domainkey.d`. A valid signature means `d=` takes some responsibility for
   the message; it says nothing about the author. Changed in transit → `fail`; no signature → `none`; no key →
   `permerror`. (RFC 6376 §1, §3.6.2.1, §6; UL ch20 *potpis poruke*.)
5. **DMARC passes if** SPF passes and its domain is aligned with the `From:` domain, **or** DKIM passes and its `d=` is
   aligned. **Tie-break:** only `pass` counts: `softfail`, `neutral`, `fail` or a DKIM `permerror` does not, even when
   its domain has the right name. No DMARC record →
   `none`. (RFC 9989 §3.2.10, §4.4 as cited in UL ch20; RFC 7489 §4.2.)
6. **Alignment:** relaxed = same organisational domain, strict = identical names; relaxed is the default (`aspf`/`adkim`
   missing or not `s`). Organisational domain here = the last two labels (for these names RFC 7489's public suffix
   list and RFC 9989's tree walk agree). (UL ch20 *poravnanje identiteta*, *organizacijska domena*; RFC 9989
   §3.2.10.1–2.)
7. **Policy:** a valid record without `p` reads as `p=none`. On a fail, `none` delivers (the owner sees it in the
   aggregate report), `quarantine` treats the mail as suspicious (spam folder), `reject` refuses it in the SMTP
   session with `550 5.7.1 Email rejected per DMARC policy for lab.example`. A pass is delivered whatever `p` says.
   The receiver here applies `reject` literally, to show the request; RFC 9989 §7.4 says a receiver MUST NOT reject
   on `p=reject` alone and, without other knowledge, MUST treat it as `quarantine`. The explanation and the reject
   caption say so. (UL ch20 "Šire o temi"; RFC 9989 §4.7, §7.2, §7.4.)
8. **Forwarding through a list** sends the message from the list's own server (a new connecting IP) with the list's
   own bounce address in `MAIL FROM`, so SPF passes for `lista.example` and is **not aligned** with `lab.example`
   (with Ana's envelope kept, the new IP would fail `lab.example`'s record instead: same DMARC outcome). The DKIM
   signature survives unless the list changes the message. A refusal goes back to the list's bounce address; the list
   reads it as a dead address and unsubscribes the reader. (UL ch20 Primjer 4: the message "comes from the list's
   address, not yours"; RFC 7208 §10.3; RFC 9989 §7.4.)

## Steps

Five per message, the same for every scenario: (1) `spf`, (2) `dkim`, (3) `dmarc` (author domain and its record), (4)
`align`, (5) `verdict`. Step 0 (`arrive`) shows the message with nothing checked. Each step appends the DNS queries
it made to `lookups`.

## Params

- `scenario`: `legit` | `list` | `spoof` | `subdomain` (sets the message, `resets: true`).
- `policy`: `none` (default, the lab record) | `quarantine` | `reject`.
- `aspf`: `relaxed` (default) | `strict`.
- `signed`: default on.
- `listModifiesSubject`: default off; only for `list` (disabled with a reason elsewhere).

## Presets and expected numbers

Checked with a scratch replay of the model (`node`, every preset and the variants below) before the page was written.

| Preset | Params | SPF (domain, term, DNS terms) | DKIM | aligned SPF / DKIM | DMARC | action | lookups |
|---|---|---|---|---|---|---|---|
| `legit` | defaults | `lab.example` pass via `mx`, **2** | pass `lab.example` | yes / yes | pass | deliver, 250 | **6** |
| `mailing-list-signed` | `list`, `reject` | `lista.example` pass via `a`, 1 | pass `lab.example` | **no** (other org) / yes | **pass** | deliver | 4 |
| `mailing-list-unsigned` | `list`, `reject`, unsigned | `lista.example` pass via `a`, 1 | none | no / – | **fail** | **reject 550**, list unsubscribes `ivan@drugdje.example` | 3 |
| `spoof-own-domain` | `spoof` | `zlo.example` pass via `ip4:203.0.113.66`, **0** | pass `zlo.example` | no / no | **fail** | report (p=none) | 3 |
| `subdomain-alignment` | `subdomain`, unsigned | `news.lab.example` pass via `a`, 1 | none | relaxed: **yes**; strict: **no** | pass; strict: fail | deliver; strict: report | 3 |

Variants: `list` signed with `listModifiesSubject` → DKIM **fail**, DMARC fail, reject, unsubscribed. `spoof` with
`reject` → `550`. `legit` with `reject` → still pass, delivered. `legit` unsigned → pass via SPF alone (5 lookups).

The `legit` lookups in order: `lab.example TXT`, `lab.example A/AAAA` (empty), `lab.example MX`,
`posluzitelj.lab.example A/AAAA` → `192.168.180.1`, `sel1._domainkey.lab.example TXT`, `_dmarc.lab.example TXT`.

## Legend

✓ pass (solid `--ok` border), ✕ fail (double `--danger` border), ○ none / neutral / not counted (dashed); alignment is a
line between the identifier and the `From:` domain, solid = aligned, broken = not; "changed" marks the check of this
step, the identifiers it read in the message and the DNS rows it added.

## Out of scope

ARC, aggregate report contents, BIMI, DKIM canonicalisation, key generation, `include`/`redirect`/`exists`/`ptr`
evaluation (counted for the limit, then `permerror` as unsupported), syntax errors in terms after the deciding one
(RFC 7208 §4.6 makes the whole record a `permerror`; here they are not read), the void-lookup limit, A-only lookups
for an IPv4 client (the page shows `a` as one A/AAAA query), DMARC tree walk and `sp`/`np` subdomain policies,
`pct`.
