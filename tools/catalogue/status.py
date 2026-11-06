#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Write the Status column of docs/catalogue.md from the repo and the runner's state.

  status.py [--runner DIR]   DIR holds the runner's queue.txt, queue-held.txt, current.txt and runner.log
                             (default ~/.herdr-projects/simdeck/scratch; without it, only the repo is read)

Every catalogue table that starts with "| ID |" gets a Status column right after ID (added on the first run,
rewritten after that), and the block between the status markers in §3 gets the counts. Values:

  live                  the sim is in sims/ and ready (it is on the site)
  live in `x`           built into another sim (a preset on its host, or merged into it)
  wip                   in sims/ but not ready yet
  w3 · building         the runner is on it now
  w3 · queued           in the runner's queue
  w3 · next             set aside in queue-held.txt, to go back into the queue after it
  w3 · held             waits for an owner decision (MANUAL below)
  w3                    a task file exists, not queued yet (the wave is the task folder)
  not adopted           decided against (catalogue §2)
"""
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import ranker  # noqa: E402
import tasks  # noqa: E402

REPO = HERE.parents[1]
CAT = REPO / "docs" / "catalogue.md"
BEGIN, END = "<!-- status:begin (tools/catalogue/status.py) -->", "<!-- status:end -->"

# Outcomes the repo cannot show on its own: built under another id, folded into another sim, or waiting for the owner.
MANUAL = {
    "spl-spectre-meltdown": "live as `hw-side-effects`",
    "urm-pat": "live in `nat`",
    "app-dc-sim": "not adopted", "app-dr-estate": "not adopted",
    "50ohm-maidenhead": "not adopted", "50ohm-aprs-map": "not adopted", "50ohm-hamnet-map": "not adopted",
    "spl-radio-security-slides": "w1 · held", "spl-radio-security-page": "w1 · held",
    "net-arp-spoofing": "w3 · held", "net-mac-flooding": "w3 · held", "net-dhcp-rogue": "w3 · held",
}


def runner_state(d):
    if not d or not d.is_dir():
        return {}, set()
    st = {}
    read = lambda n: (d / n).read_text().split("\n") if (d / n).exists() else []
    for line in read("queue-held.txt"):
        if line.strip():
            st[line.strip()] = "next"
    for line in read("queue.txt"):
        if line.strip():
            st[line.strip()] = "queued"
    cur = " ".join(read("current.txt")).split()
    if len(cur) >= 3:
        st[cur[2]] = "building"
    merged = set(re.findall(r"merged t-\d+ \((w\d/[a-z0-9-]+)\)", "\n".join(read("runner.log"))))
    return st, merged


def statuses(rows, runner):
    queue, merged = runner_state(runner)
    sims = {}
    for f in (REPO / "sims").glob("*/sim.json"):
        sims[f.parent.name] = json.loads(f.read_text()).get("status")
    out = {}
    for r in rows:
        cid = ranker.plain(r["ID"])
        sid = tasks.sim_id(cid)
        wave = tasks.wave_of(cid, r)
        w = f"w{wave[0]}" if wave else ""
        task = f"{w}/{sid}"
        if cid in MANUAL:
            s = MANUAL[cid]
        elif cid in tasks.PRESET_OF:
            host = tasks.sim_id(tasks.PRESET_OF[cid])
            s = f"live in `{host}`" if task in merged else f"{w} · {queue[task]}" if task in queue else w
        elif sims.get(sid) == "ready":
            s = "live"
        elif sid in sims:
            s = sims[sid] or "wip"
        elif task in queue:
            s = f"{w} · {queue[task]}"
        else:
            s = w or "–"
        out[cid] = s
    return out


def summary(rows, st):
    kind = lambda s: "live" if s.startswith("live") else s
    c = Counter(kind(s) for s in st.values())
    done = sum(v for k, v in c.items() if k == "live")
    lines = [BEGIN, "",
             f"**Status, {__import__('datetime').date.today().isoformat()}** (the Status column after each ID; "
             "`python3 tools/catalogue/status.py` rewrites it): "
             f"**{done} of {len(st)} entries are live**, "
             + ", ".join(f"{v} {k}" for k, v in sorted(c.items(), key=lambda kv: (-kv[1], kv[0])) if k != "live") + ".",
             "", "| Area | Entries | Live | To build (wave) |", "|---|---|---:|---|"]
    by_area = {}
    for r in rows:
        cid = ranker.plain(r["ID"])
        by_area.setdefault(f"§{r['_sec']} {r['_title']}", []).append(st[cid])
    for area, ss in by_area.items():
        todo = Counter(kind(s) for s in ss if not s.startswith("live") and s != "not adopted")
        rest = ", ".join(f"{v} {k}" for k, v in sorted(todo.items()))
        lines.append(f"| {area} | {len(ss)} | {sum(s.startswith('live') for s in ss)} | {rest or '–'} |")
    lines += ["", END]
    return lines


def write(text, st, rows):
    lines = text.split("\n")
    header = None
    for i, line in enumerate(lines):
        if ranker.SECTION.match(line):
            header = None
            continue
        if line.startswith("| ID |"):
            header = ranker.cells(line)
            if "Status" not in header:
                header.insert(1, "Status")
                lines[i] = "| " + " | ".join(header) + " |"
                sep = ranker.cells(lines[i + 1])
                sep.insert(1, "---")
                lines[i + 1] = "|" + "|".join(sep) + "|"
            continue
        if header and line.startswith("| `"):
            row = ranker.cells(line)
            cid = ranker.plain(row[0])
            if len(row) == len(header) - 1:
                row.insert(1, st[cid])
            else:
                row[header.index("Status")] = st[cid]
            lines[i] = "| " + " | ".join(row) + " |"
        elif not line.startswith("|"):
            header = None
    text = "\n".join(lines)
    block = "\n".join(summary(rows, st))
    if BEGIN in text:
        text = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), lambda m: block, text, flags=re.S)
    else:
        text = text.replace("### 3.1 Batch 1", block + "\n\n### 3.1 Batch 1", 1)
    return text


def main(argv):
    runner = Path(os.path.expanduser("~/.herdr-projects/simdeck/scratch"))
    if argv[:1] == ["--runner"]:
        runner = Path(argv[1])
    text = CAT.read_text()
    rows = ranker.parse(text)
    st = statuses(rows, runner)
    CAT.write_text(write(text, st, rows))
    c = Counter(st.values())
    print(f"{CAT.relative_to(REPO)}: {len(st)} entries; " + ", ".join(f"{v} {k}" for k, v in c.most_common()))


if __name__ == "__main__":
    main(sys.argv[1:])
