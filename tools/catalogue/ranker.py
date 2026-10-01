#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Catalogue ranker for docs/catalogue.md.

  ranker.py build [catalogue.md] [out.html]   parse the catalogue tables, write the ranking page
  ranker.py merge ratings.json [catalogue.md] write exported ratings into the Int column

The catalogue is the source of truth: every table row whose first cell is a backticked id is an entry.
Ratings exported from the page are {"id": 0..3}; merge writes them into the Int column in place.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_MD = HERE.parents[1] / "docs" / "catalogue.md"
DEFAULT_OUT = Path("catalogue-ranker.html")  # written to the current folder; not committed
SECTION = re.compile(r"^#{2,4} (\d+(?:\.\d+)*)\.? (.*)")
CELL_SPLIT = re.compile(r"(?<!\\)\|")


def cells(line):
    return [c.strip() for c in CELL_SPLIT.split(line.strip().strip("|"))]


def parse(md_text):
    section, header, rows = None, None, []
    for n, line in enumerate(md_text.split("\n")):
        m = SECTION.match(line)
        if m:
            section, header = (m.group(1), m.group(2)), None
            continue
        if line.startswith("| ID |"):
            header = cells(line)
            continue
        if header and line.startswith("| `"):
            row = cells(line)
            if len(row) != len(header):
                raise SystemExit(f"line {n + 1}: {len(row)} cells, header has {len(header)}")
            entry = dict(zip(header, row))
            entry["_line"], entry["_sec"], entry["_title"] = n, section[0], section[1]
            rows.append(entry)
        elif not line.startswith("|"):
            header = None
    return rows


def plain(text):
    return re.sub(r"`([^`]*)`", r"\1", text).replace("\\|", "|").replace("**", "")


def build(md_path, out_path):
    rows = parse(md_path.read_text())
    data = []
    for r in rows:
        kind = "adopt" if r["_sec"].startswith("2") else "build"
        data.append({
            "id": plain(r["ID"]),
            "kind": kind,
            "sec": r["_sec"],
            "area": r["_title"],
            "title": plain(r.get("Title") or r.get("Item") or r.get("Page") or r.get("Applet (`contents/html/…`)", "")),
            "concept": plain(r.get("Concept") or r.get("What it shows") or r.get("Shows") or ""),
            "does": plain(r.get("Student does") or r.get("Index entries (scenario ids)") or r.get("Verdict") or ""),
            "size": plain(r.get("Size", "")),
            "pri": plain(r.get("Pri", "")),
            "courses": [c.strip() for c in plain(r.get("Courses", "")).split(",") if c.strip()],
            "seed": plain(r.get("Seed / overlap") or r.get("Seed") or r.get("Where") or r.get("Where (`ugradbeno/…`)") or ""),
            "int": plain(r.get("Int", "")),
        })
    template = (HERE / "ranker-template.html").read_text()
    out_path.write_text(template.replace("/*DATA*/[]", json.dumps(data, ensure_ascii=False)))
    print(f"{out_path}: {len(data)} entries")


def merge(ratings_path, md_path):
    ratings = json.loads(Path(ratings_path).read_text())
    lines = md_path.read_text().split("\n")
    rows = parse("\n".join(lines))
    changed = 0
    for r in rows:
        rid = plain(r["ID"])
        if rid not in ratings:
            continue
        header = list(r.keys())[: list(r.keys()).index("_line")]
        idx = header.index("Int")
        row = cells(lines[r["_line"]])
        value = "" if ratings[rid] is None else str(ratings[rid])
        if row[idx] != value:
            row[idx] = value
            lines[r["_line"]] = "| " + " | ".join(row) + " |"
            changed += 1
    md_path.write_text("\n".join(lines))
    print(f"{md_path}: {changed} ratings written")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["build"]:
        build(Path(args[1]) if len(args) > 1 else DEFAULT_MD, Path(args[2]) if len(args) > 2 else DEFAULT_OUT)
    elif args[:1] == ["merge"] and len(args) > 1:
        merge(args[1], Path(args[2]) if len(args) > 2 else DEFAULT_MD)
    else:
        raise SystemExit(__doc__)
