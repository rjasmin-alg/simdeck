# tools/catalogue

Planning tools behind `docs/catalogue.md` and `docs/tasks/`. Python 3 standard library only.

| Command (from the repo root) | Does |
|---|---|
| `python3 tools/catalogue/tasks.py` | regenerate `docs/tasks/w1`–`w3` and `README.md` from the catalogue; a task whose spec was filled in keeps its Sources and Model sections (`--force` overwrites them) |
| `python3 tools/catalogue/w0.py` | regenerate the foundation, kit and course tasks (`docs/tasks/w0`, `w4`); run after `tasks.py` |
| `python3 tools/catalogue/ranker.py build` | write `catalogue-ranker.html` (rate entries 0–3, group, export `ratings.json`) into the current folder |
| `python3 tools/catalogue/ranker.py merge ratings.json` | write exported ratings into the catalogue's Int column |
| `python3 tools/catalogue/status.py` | rewrite the catalogue's Status column and the counts at the top of §3 from `sims/`, the task files and the runner's queue (`--runner DIR`; default `~/.herdr-projects/simdeck/scratch`) |

The wave, dependency, sim-id, topic, tag and kit-view tables are in `tasks.py`; edit them there, not in the
generated task files.
