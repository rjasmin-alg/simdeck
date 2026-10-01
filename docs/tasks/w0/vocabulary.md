# vocabulary: topics and tags every task needs, in both languages

| | |
|---|---|
| Task | `vocabulary` (wave 0) |
| Owner | coordinator |
| Size | S |
| Depends on | `bilingual` (labels in both languages) |
| Licence | AGPL-3.0-or-later |

## Goal

Tasks may only use tags that exist in `tags.json`, and they are not allowed to edit it (COMMON.md §9). Add
everything they need up front, so parallel tasks never wait on the vocabulary.

## Do

- Topics: add `windows-admin` (Administracija Windowsa / Windows administration), `internet`
  (Internet i aplikacijski protokoli / Internet and application protocols) and `theory` (Teorija računarstva /
  Theory of computation) to the existing nine; keep `classroom` last.
- Tags: add every tag listed in `docs/tasks/README.md` → "Tags used by the tasks", with Croatian and English
  labels and useful aliases (command names, the other language, abbreviations). Reuse the existing keys
  (`deduplication`, `backup`, `snapshots`, `lvm`, `filesystems`, `dhcp`, `dns`, …) rather than near-duplicates.
- Courses: the course codes the catalogue uses are not tags (courses are the third axis, `docs/site-structure.md`
  §2.3).

## Done when

`npm run check` passes with a test sim that uses every new tag; README's tag list and `tags.json` agree.
