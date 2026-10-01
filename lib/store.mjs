// Write side of the manifest, used by the admin app (scripts/admin.mjs). Every change is applied to
// an in-memory copy of the repo first and validated; it reaches disk only if it adds no new error.
// The files stay the source of truth: hand edits and admin edits are interchangeable, and git
// tracks both.
import { writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadRepo, validate } from './manifest.mjs';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FILE_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.json$/;

// Field order on disk, so admin saves give small, stable diffs.
const ENTRY_ORDER = ['id', 'kind', 'class', 'status', 'title', 'concept', 'summary', 'topic', 'tags', 'level', 'lang',
  'steps', 'url', 'scenario', 'thumb', 'aliases', 'related', 'exceptions', 'origin', 'asset_review'];
const COURSE_ORDER = ['id', 'title', 'term', 'lang', 'intro', 'sections'];
const DERIVED = ['path', 'courses', 'source']; // added by validate() or adminState(), never written

function ordered(obj, order) {
  const out = {};
  for (const k of order) if (obj[k] !== undefined && obj[k] !== '' && !(Array.isArray(obj[k]) && obj[k].length === 0 && k !== 'tags')) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out) && !order.includes(k) && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

const json = (v) => `${JSON.stringify(v, null, 2)}\n`;

export function cleanEntry(e) {
  const c = { ...e };
  for (const k of DERIVED) delete c[k];
  if (c.kind === 'native') delete c.thumb; // native thumbs are files in the folder
  return ordered(c, ENTRY_ORDER);
}

/** The admin's view: validated entries plus where each one lives. */
export function adminState(root) {
  const repo = loadRepo(root);
  const v = validate(repo);
  const source = new Map();
  for (const n of repo.natives) if (n.json?.id) source.set(n.json.id, { type: 'native', file: `sims/${n.dir}/sim.json` });
  for (const l of repo.linked) for (const e of Array.isArray(l.entries) ? l.entries : []) if (e?.id) source.set(e.id, { type: 'linked', file: l.file });
  return {
    site: repo.site,
    vocab: repo.vocab,
    entries: v.entries.map((e) => ({ ...e, source: source.get(e.id) })),
    courses: v.courses,
    errors: v.errors,
    warnings: v.warnings,
    linkedFiles: repo.linked.map((l) => l.file),
  };
}

/** Applies `mutate(repo)` in memory; returns the errors it would introduce (empty = safe to write). */
function tryChange(root, mutate) {
  const repo = loadRepo(root);
  const before = new Set(validate(repo).errors);
  mutate(repo);
  return validate(repo).errors.filter((e) => !before.has(e));
}

function refuse(errors) {
  return { ok: false, errors };
}

/**
 * Saves one entry. `oldId` is the id before editing (null for a new linked entry). Native entries
 * cannot change id here (the id is the folder name; rename the folder by hand). Linked entries may
 * move between collection files via `file`.
 */
export function saveEntry(root, entry, { oldId = null, file = null } = {}) {
  const e = cleanEntry(entry);
  if (!ID_RE.test(e.id ?? '')) return refuse([`id "${e.id}" is not kebab-case`]);
  if (e.kind === 'native') {
    if (oldId !== e.id) return refuse(['a native id is its folder name: rename sims/<id>/ by hand, or create a new sim']);
    if (!existsSync(join(root, 'sims', e.id, 'sim.json'))) return refuse([`sims/${e.id}/sim.json does not exist`]);
    const errors = tryChange(root, (repo) => {
      const n = repo.natives.find((x) => x.dir === e.id);
      n.json = e;
    });
    if (errors.length) return refuse(errors);
    writeFileSync(join(root, 'sims', e.id, 'sim.json'), json(e));
    return { ok: true };
  }
  if (e.kind !== 'linked') return refuse(['"kind" must be native or linked']);
  if (!FILE_RE.test(file ?? '')) return refuse([`collection file "${file}" must be kebab-case .json`]);
  const apply = (linked) => {
    const out = linked.map((l) => ({ file: l.file, entries: Array.isArray(l.entries) ? [...l.entries] : l.entries }));
    let at = -1;
    for (const l of out) {
      if (!oldId || !Array.isArray(l.entries)) continue;
      const i = l.entries.findIndex((x) => x?.id === oldId);
      if (i >= 0) {
        l.entries.splice(i, 1);
        if (l.file === file) at = i; // same file: keep its position
      }
    }
    let target = out.find((l) => l.file === file);
    if (!target) out.push((target = { file, entries: [] }));
    if (at >= 0) target.entries.splice(at, 0, e);
    else target.entries.push(e);
    return out;
  };
  const errors = tryChange(root, (repo) => {
    repo.linked = apply(repo.linked);
  });
  if (errors.length) return refuse(errors);
  const before = loadRepo(root).linked;
  const after = apply(before);
  mkdirSync(join(root, 'linked'), { recursive: true });
  for (const l of after) {
    const old = before.find((x) => x.file === l.file);
    if (!old || JSON.stringify(old.entries) !== JSON.stringify(l.entries)) writeFileSync(join(root, 'linked', l.file), json(l.entries.map(cleanEntry)));
  }
  return { ok: true };
}

/** Deletes a linked entry. Refused while a course still lists it. Native sims are deleted by hand. */
export function deleteEntry(root, id) {
  const repo0 = loadRepo(root);
  const holder = repo0.linked.find((l) => Array.isArray(l.entries) && l.entries.some((x) => x?.id === id));
  if (!holder) {
    return refuse(repo0.natives.some((n) => n.dir === id) ? [`"${id}" is native: delete sims/${id}/ by hand (git keeps it)`] : [`no entry "${id}"`]);
  }
  const errors = tryChange(root, (repo) => {
    const l = repo.linked.find((x) => x.file === holder.file);
    l.entries = l.entries.filter((x) => x?.id !== id);
  });
  if (errors.length) return refuse(errors);
  writeFileSync(join(root, 'linked', holder.file), json(holder.entries.filter((x) => x?.id !== id)));
  return { ok: true };
}

/** Creates sims/<id>/ with sim.json and a bare index.html (or the template's, once it exists). */
export function createNative(root, entry, { template = null } = {}) {
  const e = cleanEntry({ ...entry, kind: 'native' });
  if (!ID_RE.test(e.id ?? '')) return refuse([`id "${e.id}" is not kebab-case`]);
  const dir = join(root, 'sims', e.id);
  if (existsSync(dir)) return refuse([`sims/${e.id}/ already exists`]);
  const html = template ?? `<!doctype html>
<html lang="${e.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e.title.replace(/[<&]/g, '')}</title>
<!-- simdeck:kit -->
</head>
<body>
<p>U izradi.</p>
</body>
</html>
`;
  const errors = tryChange(root, (repo) => {
    repo.natives.push({ dir: e.id, json: e, html, files: ['sim.json', 'index.html'], hasManifest: true });
  });
  if (errors.length) return refuse(errors);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'sim.json'), json(e));
  writeFileSync(join(dir, 'index.html'), html);
  return { ok: true };
}

/** Saves a course; `oldId` set and different means a rename (the old file is removed). */
export function saveCourse(root, course, { oldId = null } = {}) {
  const c = ordered({ ...course, sections: (course.sections ?? []).map((s) => ordered({ title: s.title || undefined, sims: s.sims ?? [] }, ['title', 'sims'])) }, COURSE_ORDER);
  if (!ID_RE.test(c.id ?? '')) return refuse([`course id "${c.id}" is not kebab-case`]);
  if (oldId !== c.id && existsSync(join(root, 'courses', `${c.id}.json`))) return refuse([`course "${c.id}" already exists`]);
  const errors = tryChange(root, (repo) => {
    repo.courses = repo.courses.filter((x) => x.json.id !== oldId && x.file !== `${c.id}.json`);
    repo.courses.push({ file: `${c.id}.json`, json: c });
  });
  if (errors.length) return refuse(errors);
  mkdirSync(join(root, 'courses'), { recursive: true });
  writeFileSync(join(root, 'courses', `${c.id}.json`), json(c));
  if (oldId && oldId !== c.id && ID_RE.test(oldId) && existsSync(join(root, 'courses', `${oldId}.json`))) unlinkSync(join(root, 'courses', `${oldId}.json`));
  return { ok: true };
}

export function deleteCourse(root, id) {
  if (!ID_RE.test(id ?? '')) return refuse([`course id "${id}" is not kebab-case`]);
  const p = join(root, 'courses', `${id}.json`);
  if (!existsSync(p)) return refuse([`no course "${id}"`]);
  unlinkSync(p);
  return { ok: true };
}

/** Replaces tags.json. Refused if any entry would lose its topic or a tag. */
export function saveVocab(root, vocab) {
  const bad = [...Object.keys(vocab.topics ?? {}), ...Object.keys(vocab.tags ?? {})].filter((k) => !ID_RE.test(k));
  if (bad.length) return refuse(bad.map((k) => `"${k}" is not kebab-case`));
  const errors = tryChange(root, (repo) => {
    repo.vocab = vocab;
  });
  if (errors.length) return refuse(errors);
  writeFileSync(join(root, 'tags.json'), json(vocab));
  return { ok: true };
}

export function listCollections(root) {
  const d = join(root, 'linked');
  return existsSync(d) ? readdirSync(d).filter((f) => FILE_RE.test(f)).sort() : [];
}
