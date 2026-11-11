<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# set-chain-of-command: spec

Task `docs/tasks/w3/set-chain-of-command.md` (catalogue §4.14). One concept: **who decides what on a film set, and why
requests go through the head of department and the 1st AD instead of straight to someone else's crew.** The director
decides what the shot is; production (the producer and the production manager) decides money and schedule; the 1st AD
runs the floor (the order of work, the calls, the clock, the halt); each head of department decides how their department
does its part and speaks for it. The student sends five requests across the set either straight to whoever stands
nearest or through the chain, and watches who must say yes, the lost requests, the people with two contradicting orders,
the time to an answer and the number of possible lines.

## Scene

One fictional production, no names: fifteen people on the floor drawn left to right (production and the director, the
1st AD, the heads and the trainee and actor who report to the 1st AD, the crews). Under the chart, the five requests of
the way shown, and a scoreboard that counts **both** ways at the same minute. One step ≈ one minute (illustrative).

## State

```
{ minute,
  runs: { direct: Run, chain: Run } }          // both ways always run from the same start; `mode` only picks the view
Run = { reqs: [Req], events: [Event], two: [personId] }
Req = { id, status: idle | moving | done | unapproved | lost, at, route: [personId], how: [line | call | direct],
        hop, sent, ended, arrived, yes: [personId], direct, counterDue, counterFrom }
Event = { kind: hop | yes | done | unapproved | lost | counter | wait, req, from?, to?, at?, how?, behind? }
```

The model holds no words; the page names people, requests and events from `strings.js`.

## The crew (crew.js, the shared crew model of catalogue §5.25)

| # | Rule | Source |
|---|---|---|
| 1 | **Fifteen people, one line up each.** Departments and heads: production (head: production), direction (director), AD department (1st AD; with the trainee), camera (DoP; camera operator), electric (gaffer; electrician), grip (key grip; grip), sound (sound mixer; boom operator), props (props master; props assistant); the actor is cast, which has no head on the floor and goes through the 1st AD. Each person's `via` is the one person they pass messages through: a crew member's own head; the gaffer and the key grip go through the DoP (the DoP leads camera, lighting and grip on the look of the shot); the other heads, the director, production, the trainee and the actor go through the 1st AD; the 1st AD has none. The lines form one tree rooted at the 1st AD. | role descriptions in the film and TV guidance under Sources *(check)*; the tree is a simplification (NOTES.md) |
| 2 | **The path** from a to b runs along the lines: up from a to the first person both chains share, then down to b. Unique, because the lines form a tree. | definition |
| 3 | **Lines:** n people who may all talk to each other have n(n−1)/2 possible lines; through the heads each has one line up, n − 1 in all (a tree). 15 people: 105 and 14; 40: 780 and 39; 60: 1770 and 59. | the edges of a complete graph and of a tree (standard) |

## The requests (sim.js)

| # | Rule | Source |
|---|---|---|
| 4 | **Five requests**, in this order (the tie-break order): (1) *move a lamp*: the camera operator asks; the DoP then the gaffer say yes; the electrician does it; nearest: the electrician. (2) *thirty minutes over*: the director asks; production says yes; the 1st AD announces it; nearest: the DoP. (3) *the actor needs five minutes*: the actor asks; the 1st AD says yes and holds the call; nearest: the boom operator. (4) *the stand in the exit must go* (safety): the trainee asks; the 1st AD (who halts the work) and the key grip say yes; the grip moves it; nearest: an electrician. (5) *a new prop for the next scene*: the director asks; production (the money) then the props master say yes; the props assistant does it; nearest: the props assistant. A safety request's approvers are always the 1st AD and the head of the department that owns the hazard. | the task's five requests; who decides from the catalogue concept |
| 5 | **Through the chain:** the route walks the lines (rule 2) from the one asking to each approver in order, then to the doer. Routes: lamp op→DoP→gaffer→electrician (3 hops); overtime director→1st AD→production→1st AD (3); actor actor→1st AD (1); prop director→1st AD→production→1st AD→props master→props assistant (5). | catalogue concept: "requests go through the department head and the 1st AD" |
| 6 | **Safety skips the lines:** whoever sees it says it straight to the 1st AD, and the 1st AD's halt goes straight to the head of the owning department (out loud or on the radio, heard at once; drawn as a call, not a line); that head sends their own crew along the line. Exit: trainee→1st AD→key grip→grip (3 hops), not through the DoP. | `set-stop-for-safety` concept (catalogue §4.14): "whoever sees danger says so at once … the 1st AD runs the floor and calls the halt" |
| 7 | **Yes and done:** an approver says yes when the request reaches them (only the first time; passing through the 1st AD is not a yes unless the 1st AD is an approver). Through the chain the yeses come in the rule-4 order; after D1 (rule 8) the nearest says yes first and the others follow in their rule-4 order. The request is done (answered) when it reaches the end of its route, the doer. | definition |
| 8 | **Straight to the nearest:** the one asking tells `near` (1 hop). There: **D1** `near` is an approver: it says yes and the request goes on through the chain from there (rule 5, the approvers still to say yes, then the doer). **D2** `near` is in the doer's department but not its head: they do it at once, without the yes it needs: *done without a yes*. **D3** otherwise (`near` neither decides it nor is crew of that department; a head who is not an approver falls here too): the request is *lost* there. A head who hears it (the DoP, for overtime) would pass it on in reality; the model keeps "lost" to show what the direct way risks (NOTES.md). Checked in this order. | the task: "lost requests"; who-touches-what's "ask the department that owns it" |
| 9 | **Two orders:** one minute after D2, the crew member's own head calls them back to the job the head gave them: that person now holds two contradicting orders (counted once per person, however many). No counter-order when the one asking is that head, or when the department has no head. A counter-order does not use the head's minute. | the task: "contradictory instructions reach the same person" |
| 10 | **One message a minute per person** (sending one's own or passing one on); a message that arrives this minute moves on next minute at the earliest. **Tie-breaks** at one person: a safety request first; then the one held longest (earliest arrival; one's own unsent requests count as held from minute 0); then the request order of rule 4. So the director sends overtime in minute 1 and the prop in minute 2, and in minute 2 the 1st AD passes the safety call before overtime. | derived (a person says one thing at a time) |
| 11 | **Counts:** answered with a yes = done; time to an answer = ended − sent + 1 minutes (the minute it was sent counts); the mean is over answered requests only; lost and done-without-a-yes have no answer time. | definition |

Out of scope: the creative conversation between the director and the DoP (direct all day on a real set), the 2nd AD,
radio channels (`set-radio-discipline`), refusals (every approver says yes), what happens after a request is lost (the
hazard itself is `set-stop-for-safety`), who may touch which equipment (`set-who-touches-what`).

## Params

- `mode` (choice: direct, chain; default chain; key M switches): which way the chart and the request table show. Both
  ways always run; the scoreboard counts both.
- `lamp`, `overtime`, `actor`, `exit`, `prop` (toggles, default on): which requests are sent.
- `crew` (range 10–60, default 40): people on set, for the line count only (rule 3).

## Steps

7 (one per minute). The slowest case is all five through the chain, which ends in minute 7; every subset of requests
ends by minute 7 in both ways (tested over all 32 subsets).

## Expected numbers (checked by an independent replay script, NOTES.md)

| Case | Result |
|---|---|
| All five, through the chain (preset `chain`) | sent 1,1,1,1,2; done in minutes 3, 4, 1, 3, 7; times 3, 4, 1, 3, 6 min; 5 of 5 answered, mean 3.4 min; 0 lost, 0 without a yes, 0 people with two orders. Minute 2: the 1st AD passes the safety call (4) and overtime (2) waits a minute. |
| All five, to the nearest (preset `direct`) | minute 1: lamp done without a yes by the electrician, overtime lost with the DoP, actor lost with the boom operator, exit lost with the electrician; minute 2: the gaffer calls the electrician back (two orders), the props assistant does the prop without a yes; minute 3: the props master calls the props assistant back. 0 of 5 answered, 2 without a yes, 3 lost, 2 people with two orders; nothing happens after minute 3. |
| Exit alone, through the chain (preset `exit`) | trainee→1st AD (call), 1st AD→key grip (call), key grip→grip: answered in 3 min. Direct: lost with the electrician. |
| Overtime alone, through the chain (preset `overtime`) | director→1st AD→production→1st AD: answered in 3 min (no wait when alone). |
| Lines (rule 3) | n = 40: 780 against 39; n = 60: 1770 against 59; the 15 drawn: 105 against 14. |

## Legend and captions

Legend: a line of the chain; a safety call (dashed); a lost request (dotted ring with ✕); no yes, two orders (double
red border, "!"). On the chart each request is a numbered chip in its series colour (number + shape + colour): round
while held, square with ✓ when answered, dashed square with ! when done without a yes, dotted ring with ✕ when lost;
a person with two orders gets a double red border and "2 orders". The caption gives the minute and up to three
events: counter-orders, lost requests, done without a yes, safety calls, waits, answers, yeses.

## Terms (owner's list, catalogue §4.14; everything else *(check)*, NOTES.md)

1st AD, gaffer, key grip, grip, boom operator as loanwords; DoP, *Produkcija*, *Redatelj*, *Operater kamere*,
*Električar*, *Snimatelj zvuka*, *Rekviziter*, *Pomoćni rekviziter*, *Pripravnik*, *Glumica*; glosses given once in the
explanation: *prvi asistent režije* (1st AD), *direktor filma* (production manager).

## Misconceptions targeted

"Direct is faster, so better" (it arrives sooner, but without a yes, or not at all); "the 1st AD only slows things
down" (one minute of waiting, and nobody gets two orders); "safety has to wait for the chain" (it goes straight to the
1st AD, ahead of everything).

## Sources

- Council Directive 89/391/EEC of 12 June 1989 (the framework directive on safety and health at work), EUR-Lex: the
  employer organises the work, informs and instructs the workers, and workers report danger to the employer or the
  responsible person *(check the articles; not cited on the page)*.
- Zakon o zaštiti na radu, Narodne novine: the employer's organisation of work and the worker's duty to report danger
  apply to everyone on set *(check the current consolidated text and amendments; no article numbers on the page)*.
- Published film and TV safety guidance on the roles of the producer, the 1st AD and heads of department; found by
  a web search, not read in full by the builder, so what each says about the 1st AD is *(check)* (NOTES.md):
  - Health and Safety Executive (UK), "Film, TV and broadcasting",
    <https://www.hse.gov.uk/entertainment/theatre-tv/film.htm> (defined responsibilities and duties, a system for
    managing safety; the production company as employer).
  - Government of Ontario, "Safety guidelines for the film and television industry: safety responsibilities and
    duties", <https://www.ontario.ca/document/safety-guidelines-film-and-television-industry/safety-responsibilities-and-duties>.
  - ScreenSkills, national occupational standard PSA3 "Manage health and safety for productions",
    <https://www.screenskills.com/media/hxilacf1/psa3-manage-health-and-safety-for-productions-final.pdf> (people who
    oversee safe working in their department, area or team).
- Graph theory (standard): a complete graph on n vertices has n(n−1)/2 edges; a tree on n vertices has n − 1.
