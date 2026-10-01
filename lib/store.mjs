// SPDX-License-Identifier: AGPL-3.0-or-later
// Write side of the manifest, used by the admin app (scripts/admin.mjs). Every change is applied to
// an in-memory copy of the repo first and validated; it reaches disk only if it adds no new error.
// The files stay the source of truth: hand edits and admin edits are interchangeable, and git
// tracks both.
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { loadRepo, validate, metaFor, languagesOf, COURSE_FIELDS } from './manifest.mjs';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Field order on disk, so admin saves give small, stable diffs.
const ENTRY_ORDER = ['id', 'class', 'status', 'title', 'concept', 'summary', 'topic', 'tags', 'level', 'languages',
  'steps', 'aliases', 'related', 'origin', 'asset_review', 'credits'];
const DERIVED = ['path', 'courses']; // added by validate(), never written

const isEmpty = (v) => v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
  || (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every(isEmpty));

function ordered(obj, order) {
  const out = {};
  for (const k of order) if (!isEmpty(obj[k]) || (k === 'tags' && Array.isArray(obj[k]))) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out) && !order.includes(k) && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

const json = (v) => `${JSON.stringify(v, null, 2)}\n`;

export function cleanEntry(e) {
  const c = { ...e };
  for (const k of DERIVED) delete c[k];
  return ordered(c, ENTRY_ORDER);
}

/** The admin's view of the repo: validated sims and courses, plus every error and warning. */
export function adminState(root) {
  const repo = loadRepo(root);
  const v = validate(repo);
  return { site: repo.site, vocab: repo.vocab, entries: v.entries, courses: v.courses, errors: v.errors, warnings: v.warnings };
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

/** Saves an existing sim's sim.json. The id is the folder name, so it cannot change here. */
export function saveEntry(root, entry, { oldId = null } = {}) {
  const e = cleanEntry(entry);
  if (oldId !== e.id) return refuse(['the id is the folder name: rename sims/<id>/ by hand']);
  if (!ID_RE.test(e.id ?? '') || !existsSync(join(root, 'sims', e.id, 'sim.json'))) return refuse([`sims/${e.id}/sim.json does not exist`]);
  const errors = tryChange(root, (repo) => {
    repo.natives.find((x) => x.dir === e.id).json = e;
  });
  if (errors.length) return refuse(errors);
  writeFileSync(join(root, 'sims', e.id, 'sim.json'), json(e));
  return { ok: true };
}

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Fits a page copied from kit/template to its sim.json: <html lang> (the default language), <title>, the visible
 * title and subtitle (in that language, for a reader without script), and the #simdeck-meta placeholder, from which
 * the kit shows them in the visitor's language. The model and the rest of the page stay the template's.
 */
export function fitTemplate(html, e) {
  const lang = languagesOf(e)[0];
  const text = (v) => (v && typeof v === 'object' ? v[lang] : v) ?? '';
  return html
    .replace(/(<html\b[^>]*\blang=")[^"]*(")/i, `$1${lang}$2`)
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(text(e.title))} · simdeck</title>`)
    .replace(/(<h1 class="sd-title">)[\s\S]*?(<\/h1>)/i, (m, a, b) => `${a}${esc(text(e.title))}${b}`)
    .replace(/(<p class="sd-subtitle">)[\s\S]*?(<\/p>)/i, (m, a, b) => `${a}${esc(text(e.concept))}${b}`)
    .replace(/(<script type="application\/json" id="simdeck-meta">)[\s\S]*?(<\/script>)/i,
      (m, a, b) => `${a}\n${JSON.stringify(metaFor(e), null, 2)}\n${b}`);
}

/**
 * Creates sims/<id>/: copies the kit's proto-simulator with kit/new-sim.sh (the kit owns how a copy
 * is made), fits it to the sim.json, and writes the sim.json. Without the kit, a bare page is written.
 */
export function createSim(root, entry) {
  const e = cleanEntry(entry);
  if (!ID_RE.test(e.id ?? '')) return refuse([`id "${e.id}" is not kebab-case`]);
  const dir = join(root, 'sims', e.id);
  if (existsSync(dir)) return refuse([`sims/${e.id}/ already exists`]);
  const lang = languagesOf(e)[0];
  const stub = `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n<title>${esc(e.title?.[lang])}</title>\n</head>\n<body>\n<p>${lang === 'hr' ? 'U izradi.' : 'In progress.'}</p>\n</body>\n</html>\n`;
  const errors = tryChange(root, (repo) => {
    repo.natives.push({ dir: e.id, json: e, html: stub, files: ['sim.json', 'index.html'], hasManifest: true });
  });
  if (errors.length) return refuse(errors);
  const newSim = join(root, 'kit', 'new-sim.sh');
  if (existsSync(newSim)) {
    try {
      execFileSync('bash', [newSim, e.id, join('sims', e.id)], { cwd: root, stdio: 'pipe' });
    } catch (err) {
      rmSync(dir, { recursive: true, force: true });
      return refuse([`kit/new-sim.sh failed: ${String(err.stderr || err.message).trim()}`]);
    }
    writeFileSync(join(dir, 'index.html'), fitTemplate(readFileSync(join(dir, 'index.html'), 'utf8'), e));
  } else {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), stub);
  }
  writeFileSync(join(dir, 'sim.json'), json(e));
  return { ok: true };
}

/** Saves a course; `oldId` set and different means a rename (the old file is removed). */
export function saveCourse(root, course, { oldId = null } = {}) {
  const sections = (course.sections ?? []).map((s) => ordered({ title: s.title || undefined, sims: s.sims ?? [] }, ['title', 'sims']));
  const c = ordered({ ...course, sections }, COURSE_FIELDS);
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

/** Replaces tags.json. Refused if any sim would lose its topic or a tag. */
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
