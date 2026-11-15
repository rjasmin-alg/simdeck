<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
# poe-budget: specification

Task `docs/tasks/w3/poe-budget.md`, catalogue entry `net-poe-budget` (§4.1). One concept: **class per device vs
switch budget**. The student adds devices to a 48-port PoE switch and watches what the switch reserves. Class:
explorer (no steps; the state is derived from the params, recomputed from scratch on every change).

## Sources

- **[URM]** *Uvod u računalne mreže*, ch. 02 "Građa mreže", "Šire o temi" → "Isti kabel, i podaci i struja":
  IEEE 802.3af-2003, an access point or IP phone powered over its data cable. Terms: *access point*, preklopnik
  (switch), napajanje. No class or budget numbers.
- **[af]** IEEE 802.3af-2003, clause 33: classes 0–3; PSE output ≥ 15.4 W, PD input ≤ 12.95 W. *(check: the
  standard was not opened; figures as widely quoted from it)*
- **[at]** IEEE 802.3at-2009 (PoE+, Type 2): class 4, 30 W at the PSE, 25.5 W at the PD. *(check)*
- **[bt]** IEEE 802.3bt-2018 (Types 3 and 4): classes 5–8, 45/40, 60/51, 75/62, 90/71.3 W. *(check)*
- **[V]** Switch vendors' PoE configuration guides on power management (static/class-based vs dynamic/usage-based
  allocation, port priority critical/high/low, shedding the lowest priority, highest port number first).
  Vendor-specific; the page names no vendor (COMMON.md §1). *(check)*
- Device draws (3.5, 13, 6, 40 W) and the 370 W budget are **typical examples from the task file, not from a
  source**; the page says so under the class table.

Every number below was computed by an independent script (NOTES.md, "Numbers checked") and by the tests.

## Params

| key | type | values | default |
|---|---|---|---|
| `budget` | range | 60 … 740 W, step 10 (rounded to the nearest step, halves up; not a number: 370) | 370 |
| `allocMode` | choice | `class`, `measured` | `class` |
| `phones` | range | 0 … 24 | 24 |
| `aps` | range | 0 … 8 | 4 |
| `cams` | range | 0 … 8 | 0 |
| `ptz` | range | 0 … 2 | 0 |

Counts are rounded (halves up) and clamped to their range; anything else is 0. A bad `allocMode` or `portType`
falls back to the default; `priorities` is on only when it is `true`.
| `portType` | choice | `at` (30 W per port), `bt` (90 W per port, Type 4) | `at` |
| `priorities` | toggle | on/off | off |

## Devices and ports

| kind | class | draws (example) | priority (when `priorities` on) | ports |
|---|---|---|---|---|
| IP phone (`phone`) | 2 | 3.5 W | low | 1 … 24 |
| access point (`ap`) | 4 | 13 W | critical | 25 … 32 |
| fixed camera (`cam`) | 3 | 6 W | critical | 33 … 40 |
| PTZ camera (`ptz`) | 6 | 40 W | critical | 41 … 42 |

Each kind fills its own block of ports from the first one, so changing one count never moves another kind's
devices. Ports 43–48 stay empty. Priority ranks: low 0, high 1, critical 2 (high is unused by the presets but
the allocation function takes any rank).

## State

`{ budget, allocMode, portType, priorities, cap, ports: [48 × { n, device, cls, priority, portType }],
result: [48 × { n, device, want, allocated, pd, limited, state, shedBy }], total, left, demand, draw, events }`.
Watts are numbers rounded to 0.01 W; the model sums in integer centiwatts. `state` is `empty`, `powered`,
`limited`, `denied` or `shed`. `want` is what the device would reserve, `allocated` what it got (0 unless powered
or limited). `demand` is the sum of `want` over all placed devices, `draw` the sum of their example draws.
`events` lists `{ type: 'deny', n, need, left }` and `{ type: 'shed', n, ports: [...], freed, left }` in port order
(`left` is what was free before the device; `ports` in the order they were shed).

## Rules

1. **Class table** (PSE at the switch port / PD guaranteed at the device): class 0 15.4 / 12.95; 1 4.0 / 3.84;
   2 7.0 / 6.49; 3 15.4 / 12.95; 4 30 / 25.5; 5 45 / 40; 6 60 / 51; 7 75 / 62; 8 90 / 71.3. The difference is the
   loss allowed for up to 100 m of cable. [af] [at] [bt] *(check)*. The task wrote 13.0 for classes 0 and 3; the
   standard's figure is 12.95 W, used here.
2. **Class-based allocation** (`allocMode = class`, default): `want` = the PSE maximum of the device's class,
   whatever it draws. [V] *(check)*
3. **Measured allocation** (`allocMode = measured`): `want` = the device's draw (the example value), as the port
   measures it. [V] *(check)*
4. **Admission in port order**: ports 1 → 48; a device is powered when `total + want ≤ budget`, else denied
   (`allocated` 0; the data link may still be up). A denied device does not block later ones: a smaller device
   after it is still powered if it fits. [V] *(check)*
5. **Priority** (`priorities` on): a device that does not fit sheds powered ports of **strictly lower** priority,
   lowest priority first, and within a priority the **highest port number first**, one at a time until it fits.
   If shedding every candidate would still not make room, nothing is shed and the device is denied. A shed port
   stays down (it is not re-admitted later in the same pass). Equal priority never sheds. With `priorities` off,
   rule 4 alone applies. [V] *(check)*
6. **Port type cap**: a port of type `at` gives at most 30 W, `bt` (Type 4) at most 90 W (af 15.4 W and bt Type 3
   60 W are in the class table's notes, not params). A device whose class PSE exceeds the cap gets
   `want = min(want, cap)`, `pd` = the PD figure at the cap (`at` 25.5 W, `bt` 71.3 W), and when powered its
   state is `limited` ("may not work fully"). [bt] *(check)*
7. **Edge**: a budget exactly equal to the total is accepted (`≤`, not `<`).

## Presets

| id | params | expected |
|---|---|---|
| `office` | defaults (24 phones, 4 APs, 370 W, class) | 24 × 7.0 + 4 × 30 = 288 W allocated, 82 W left, all 28 powered; they draw 136 W |
| `cameras` | `cams: 6` | 288 + 5 × 15.4 = 365 W; camera on port 38 needs 15.4 W with 5 W left → denied; demand 380.4 W |
| `measured` | `cams: 6, allocMode: measured` | 24 × 3.5 + 4 × 13 + 6 × 6 = 172 W; all 34 powered, 198 W left |
| `priority` | `cams: 6, priorities: on` | port 38 sheds phones on ports 24 and 23 (7 W frees 12 W in total, still short; 14 W fits): 365 − 14 + 15.4 = 366.4 W, 3.6 W left; 6 cameras and 22 phones powered |
| `ptz` | `ptz: 1` | the PTZ camera on port 41 (class 6, 60 W) on an `at` port: 30 W, limited; 288 + 30 = 318 W. With `portType: bt`: 60 W, powered, 348 W |

## Page

- Stage: the switch (48 ports in two rows of 24; each port shows its number, the device letter and the watts
  reserved (for a denied or shed port: the watts it asked for), and its state by fill, ✕, hatching or ▲), the budget gauge (powered allocations stacked in port order,
  then the denied and shed requests outlined past the budget line), a grouped port table (runs of consecutive
  ports with the same device, state and allocation: ports, device, class, priority, reserved at the switch,
  guaranteed at the device (0 W when not powered), state) and the class table with the classes in use marked and the port cap drawn.
- "Changed" marks ports whose state or allocation changed on the last param change (none on load).
- Caption: the totals (class mode: allocated of budget, what is free; measured mode: first the task's sentence,
  demand in measured vs class mode, when the two differ), then the first shed event (if any), then the first
  denial and how many more (if any); with neither, a limited port, or, when every device is powered in class mode,
  the gap between what is reserved and what the devices draw.

## Out of scope

Detection and classification signalling, 2-pair vs 4-pair, LLDP negotiation messages, PSU redundancy, heat, a
device drawing more than measured later (mentioned in one line of the explanation).
