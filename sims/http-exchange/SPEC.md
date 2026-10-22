<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# http-exchange: specification

One concept: **request line, headers, status codes, body**. The student sends requests and reads the responses.
Task: `docs/tasks/w2/http-exchange.md`; catalogue `inet-http-exchange` (§4.2). Model: `sim.js`; tests: `sim.test.js`.

## Scenes

Two servers, one per book. A preset picks the scene; the user's requests go to the same scene.

**`grafo`** (URM ch14): a browser and the server `www.grafo.hr`, one virtual host.

| Virtual host | Document root | Path | Kind | GET gives |
|---|---|---|---|---|
| `www.grafo.hr` (default) | `/var/www/grafo` | `/` | file | 200, `<h1>Grafo d.o.o.</h1>` |
| | | `/proizvodi` | redirect | 301, `Location: /katalog` |
| | | `/katalog` | file | 200, `<h1>Katalog proizvoda</h1>` |
| | | `/obrazac` | program (form) | 200 `<h1>Obrazac za upit</h1>`; POST: 200 `<h1>Upit primljen</h1>` |
| | | `/cjenik` | program that fails | 500 |

Host choices: `www.grafo.hr`, left out.

**`lab`** (UL ch21): a command-line HTTP client and the server `192.168.180.1`, two name-based virtual hosts.

| Virtual host | Document root | Path | Kind | GET gives |
|---|---|---|---|---|
| `www1.lab.example` (first, default) | `/var/www/www1` | `/` | file | 200, `<h1>Prvi poslužitelj</h1>` |
| | | `/nema` | no file | 404 |
| | | `/privatno` | file, may not be read | 403 |
| | | `/skriveno` | file, hidden by the server | 404 |
| `www2.lab.example` | `/var/www/www2` | `/` | file | 200, `<h1>Drugi poslužitelj</h1>` |

Host choices: `www1.lab.example`, `www2.lab.example`, `www3.lab.example` (in DNS, no virtual host: UL Primjer 3),
`192.168.180.1`, left out. The names and the page bodies are UL ch21's (Uvod); the roots, `/skriveno` and the
grafo pages are chosen here. A path missing from a virtual host's table is 404.

Responses carry `Content-Type: text/html; charset=utf-8` when they have a body, and always `Content-Length` (the body
in UTF-8 bytes: `Prvi poslužitelj` has a 2-byte `ž`, so 26). 301 has no body (`Content-Length: 0`); 4xx and 5xx have
a one-line error page `<h1>code reason</h1>`. 405 adds `Allow`. No `Date` or `Server` (noise for this concept).
A POST request carries `upit=papir` with `Content-Type: application/x-www-form-urlencoded` and `Content-Length: 10`.

## State

`{ n, scene, phase, ev, done, messages: [{ dir, method|code, target|reason, version, headers: [[name, value]], body,
host, via, marks }], server: { name, vhosts: [{ name, root, default }], resources: { key: { vhost, path, kind, status,
location, body } } }, pending, decision, shown }`. `shown` is what the client got last (code, method, body). `pending` is the request the client will send next (the
next queued one, or the follow-up it built from `Location`), `null` while one is in flight or at the end. `decision`
is how the server decided the last response: `{ hosts, host, vhost, byDefault, path, why }`.

## One step

A run is the preset's script, then the requests the user queued with S (param `sent`). Each request is one exchange,
two steps: (1) the client sends it; (2) the server parses it, checks Host, picks the virtual host by Host, looks the
path up and answers. If the answer is a 301, the client builds the follow-up request (rule 6), which is the next
exchange (two more steps). Steps = 2 × exchanges.

**Tie-breaks.** Server order: the Host check (rule 3) first, then the virtual host (rule 4), then the resource
(missing, hidden: 404; not readable: 403; redirect: 301 whatever the method), and only then the method (405), then the
program (500). Two virtual hosts with the same name: the first listed. After a 301 the client keeps the method except
POST, which it repeats as GET without the body (RFC 9110 §15.4.2 allows it; it is what clients do). At most 5
redirects are followed (none loop here). Queued requests run after the script, in the order sent.

## Rules

| # | Rule | Source |
|---|---|---|
| 1 | Request-line = method SP request-target SP HTTP-version; status-line = HTTP-version SP status-code SP [reason-phrase]. | RFC 9112 §3, §4; UL ch21 "Šire o temi", *redak zahtjeva*, *statusni redak* |
| 2 | A message = start line, CRLF, zero or more header lines, an empty line, optional body. Header names are case-insensitive. | RFC 9112 §2.1, §5; UL ch21 *polje zaglavlja* |
| 3 | An HTTP/1.1 request without Host, or any request with more than one, gets 400; no virtual host is picked, although a default exists. | RFC 9112 §3.2; UL ch21 "Kako web-poslužitelj dolazi do odgovora" (the `Host:` 400/200 example) |
| 4 | The server picks the virtual host by the name in Host (case-insensitive); a name that matches none goes to the first (default) one and gets **200 with the wrong content**. | UL ch21 *virtualni poslužitelj*, Primjer 3 |
| 5 | The first digit is the class (1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error); an unknown code is read as x00 of its class. The reason phrase is for people: the client never interprets it. | RFC 9110 §15; UL ch21 *statusni kod*, "Šire o temi" |
| 6 | 301 carries the new URI in `Location`; the client sends a new request there (same host: the Location is a path). | RFC 9110 §15.4.2; URM ch14 Primjer 3 |
| 7 | HEAD gets the same status and header fields as GET (Content-Length included) and no body. | RFC 9110 §9.3.2; URM ch14 "HTTP i HTTPS" |
| 8 | 404 may also hide a resource the server will not reveal: `/skriveno` gets exactly the response of `/nema`. A file the server may not read gets 403. | RFC 9110 §15.5.4–15.5.5; UL ch21 "Šire o temi" (403 vs 404) |

Not in the task's rules, needed for the POST choice: a resource takes only its methods (files and the failing program
GET and HEAD, the form also POST); another method gets 405 with `Allow` (RFC 9110 §15.5.6). POST to the form is
processed by a program and answered 200 (RFC 9110 §9.3.3; UL ch21 *dinamički sadržaj*).

## Params

`script` (set by the preset; resets): which preset's requests and scene. `method` GET/HEAD/POST (default GET),
`pathG`/`pathL` (the scene's paths, default `/`), `hostG`/`hostL` (the scene's names plus left out, default the
first): the request the user composes; the controls of the other scene are hidden. Button **S** queues it (`sent`),
refused once the run would pass 20 steps or 8 queued requests. Changing the composer does not change the run.

## Presets and expected numbers

Checked with a scratch script before the page, and in `sim.test.js` (golden test: every message of every preset).

| Preset | Requests | Steps | Run |
|---|---|---|---|
| 1 `redirect` | GET /proizvodi, Host www.grafo.hr | 4 | 301 + `Location: /katalog` → client sends GET /katalog → 200, 26 bytes. Two exchanges, four messages, one page. URM ch14 Primjer 3 |
| 2 `host-missing` | GET / without Host; GET / with Host 192.168.180.1 | 4 | 400 Bad Request; then 200 from the default virtual host (`Prvi poslužitelj`). UL ch21 |
| 3 `wrong-vhost` | GET /, Host www3.lab.example | 2 | 200 OK with www1's page: no virtual host has the name, the first answers. UL ch21 Primjer 3 |
| 4 `head-vs-get` | GET /katalog; HEAD /katalog | 4 | 200 with the same two header fields (Content-Length 26) both times; HEAD has no body. URM ch14 |
| 5 `not-found-vs-forbidden` | GET /nema; GET /privatno (Host www1.lab.example) | 4 | 404 Not Found; 403 Forbidden. UL ch21 |

The presets also set the composer to a next request worth sending: `wrong-vhost` → www2 (the right page by name),
`head-vs-get` → HEAD /proizvodi (HEAD follows a redirect too), `not-found-vs-forbidden` → /skriveno (rule 8).

## Out of scope

TLS (`tls-handshake`), HTTP/2 and /3 framing (`http-versions`), caching (`http-caching`), cookies, chunked encoding,
persistent connections, 421 (misdirected request), absolute Location URIs, ports in Host.
