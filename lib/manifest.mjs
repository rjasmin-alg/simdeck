// Loads the manifest sources (sims/*/sim.json, linked/*.json, courses/*.json, tags.json, site.json)
// and validates them. `validate` is pure, so tests can feed it in-memory samples; `loadRepo` reads disk.
// The format is documented in docs/site-structure.md; keep the two in step.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const KINDS = ['native', 'linked'];
export const CLASSES = ['stepper', 'explorer', 'reference', 'tool'];
export const LEVELS = ['intro', 'core', 'advanced'];
export const STATUSES = ['ready', 'wip'];
export const LANGS = ['hr', 'en'];
export const THUMB_NAMES = ['thumb.svg', 'thumb.png', 'thumb.webp'];
export const SUMMARY_MAX = 160;
export const CONCEPT_MAX = 80;

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Every field an entry may carry. Unknown fields are errors, so a typo ("tag", "sumary") never
// silently drops data from the index.
const FIELDS = {
  id: 'all', kind: 'all', class: 'all', status: 'all', title: 'all', concept: 'all', summary: 'all',
  topic: 'all', tags: 'all', level: 'all', lang: 'all', steps: 'all', aliases: 'all', related: 'all',
  exceptions: 'all', origin: 'all', asset_review: 'all',
  url: 'linked', scenario: 'linked', thumb: 'linked',
};
const REQUIRED = ['id', 'kind', 'class', 'status', 'title', 'concept', 'summary', 'topic', 'tags', 'level', 'lang'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listDir(path) {
  return existsSync(path) ? readdirSync(path).sort() : [];
}

/** Reads every manifest source under `root`. JSON parse errors are reported, not thrown. */
export function loadRepo(root) {
  const errors = [];
  const tryJson = (path) => {
    try {
      return readJson(path);
    } catch (e) {
      errors.push(`${path}: ${e.message}`);
      return null;
    }
  };
  const site = tryJson(join(root, 'site.json')) ?? {};
  const vocab = tryJson(join(root, 'tags.json')) ?? { topics: {}, tags: {} };

  const natives = [];
  for (const dir of listDir(join(root, 'sims'))) {
    const abs = join(root, 'sims', dir);
    if (!statSync(abs).isDirectory()) continue;
    const files = readdirSync(abs);
    const json = files.includes('sim.json') ? tryJson(join(abs, 'sim.json')) : null;
    const html = files.includes('index.html') ? readFileSync(join(abs, 'index.html'), 'utf8') : null;
    natives.push({ dir, json, html, files, hasManifest: files.includes('sim.json') });
  }

  const linked = [];
  for (const file of listDir(join(root, 'linked'))) {
    if (!file.endsWith('.json')) continue;
    linked.push({ file, entries: tryJson(join(root, 'linked', file)) ?? [] });
  }
  const linkedThumbs = listDir(join(root, 'linked', 'thumbs'));

  const courses = [];
  for (const file of listDir(join(root, 'courses'))) {
    if (!file.endsWith('.json')) continue;
    const json = tryJson(join(root, 'courses', file));
    if (json) courses.push({ file, json });
  }
  return { site, vocab, natives, linked, linkedThumbs, courses, loadErrors: errors };
}

function checkEntry(e, where, vocab, err) {
  if (typeof e !== 'object' || e === null || Array.isArray(e)) {
    err(`${where}: entry must be an object`);
    return;
  }
  for (const k of Object.keys(e)) {
    if (!(k in FIELDS)) err(`${where}: unknown field "${k}"`);
    else if (FIELDS[k] === 'linked' && e.kind !== 'linked') err(`${where}: field "${k}" is only for linked entries`);
  }
  for (const k of REQUIRED) if (e[k] === undefined) err(`${where}: missing required field "${k}"`);

  const str = (k, max) => {
    if (e[k] === undefined) return;
    if (typeof e[k] !== 'string' || e[k].trim() === '') err(`${where}: "${k}" must be a non-empty string`);
    else if (max && e[k].length > max) err(`${where}: "${k}" is ${e[k].length} chars, max ${max}`);
  };
  const oneOf = (k, list) => {
    if (e[k] !== undefined && !list.includes(e[k])) err(`${where}: "${k}" must be one of ${list.join(', ')}`);
  };
  const strList = (k) => {
    if (e[k] === undefined) return true;
    if (!Array.isArray(e[k]) || e[k].some((x) => typeof x !== 'string' || x === '')) {
      err(`${where}: "${k}" must be an array of non-empty strings`);
      return false;
    }
    return true;
  };

  if (e.id !== undefined && (typeof e.id !== 'string' || !ID_RE.test(e.id))) err(`${where}: id "${e.id}" is not kebab-case`);
  oneOf('kind', KINDS);
  oneOf('class', CLASSES);
  oneOf('status', STATUSES);
  oneOf('level', LEVELS);
  oneOf('lang', LANGS);
  str('title', 60);
  str('concept', CONCEPT_MAX);
  str('summary', SUMMARY_MAX);
  str('origin');

  if (e.topic !== undefined && !(e.topic in (vocab.topics ?? {}))) err(`${where}: topic "${e.topic}" is not in tags.json`);
  if (strList('tags')) {
    if (e.tags?.length === 0) err(`${where}: "tags" needs at least one tag`);
    for (const t of e.tags ?? []) if (!(t in (vocab.tags ?? {}))) err(`${where}: tag "${t}" is not in tags.json`);
    if (new Set(e.tags ?? []).size !== (e.tags ?? []).length) err(`${where}: duplicate tags`);
  }
  strList('aliases');
  strList('related');

  if (e.class === 'stepper' && e.kind === 'native') {
    if (!Number.isInteger(e.steps) || e.steps < 1) err(`${where}: a native stepper needs "steps" (positive integer)`);
  } else if (e.steps !== undefined && e.kind === 'native') {
    err(`${where}: "steps" is only for steppers`);
  }
  if (e.steps !== undefined && (!Number.isInteger(e.steps) || e.steps < 1)) err(`${where}: "steps" must be a positive integer`);

  if (e.exceptions !== undefined) {
    if (!Array.isArray(e.exceptions) || e.exceptions.some((x) => typeof x?.rule !== 'string' || typeof x?.why !== 'string' || !x.why.trim())) {
      err(`${where}: "exceptions" must be [{ "rule": "...", "why": "..." }]`);
    }
  }
  if (e.asset_review !== undefined && typeof e.asset_review !== 'boolean') err(`${where}: "asset_review" must be true or false`);

  if (e.kind === 'linked') {
    if (typeof e.url !== 'string' || !(e.url.startsWith('/') || /^https:\/\//.test(e.url))) {
      err(`${where}: linked "url" must be site-absolute ("/ossim/...") or https://`);
    }
    if (e.scenario !== undefined && (typeof e.scenario !== 'string' || !ID_RE.test(e.scenario))) err(`${where}: "scenario" must be a kebab-case id`);
    if (typeof e.url === 'string' && /[?&]scenario=/.test(e.url)) err(`${where}: put the scenario in "scenario", not in the url`);
  }
}

/** Extracts `<html lang="..">` from a page, or null. */
export function htmlLang(html) {
  const m = /<html\b[^>]*\blang\s*=\s*["']?([a-zA-Z-]+)/i.exec(html ?? '');
  return m ? m[1].toLowerCase() : null;
}

/**
 * Validates everything `loadRepo` returns. Returns { entries, courses, errors, warnings };
 * `entries` are normalised (native ones gain `path` and `thumb`), in id order.
 */
export function validate(repo) {
  const errors = [...(repo.loadErrors ?? [])];
  const warnings = [];
  const vocab = repo.vocab ?? { topics: {}, tags: {} };
  const entries = [];

  for (const n of repo.natives ?? []) {
    const where = `sims/${n.dir}/sim.json`;
    const err = (m) => errors.push(m);
    if (!n.hasManifest) {
      err(`sims/${n.dir}: folder has no sim.json`);
      continue;
    }
    if (!n.json) continue; // parse error already reported
    checkEntry(n.json, where, vocab, err);
    if (n.json.kind !== 'native') err(`${where}: entries under sims/ must have kind "native"`);
    if (n.json.id !== n.dir) err(`${where}: id "${n.json.id}" must equal the folder name "${n.dir}"`);
    if (n.html === null) {
      err(`sims/${n.dir}: missing index.html`);
    } else {
      const lang = htmlLang(n.html);
      if (lang !== n.json.lang) err(`sims/${n.dir}/index.html: <html lang="${lang}"> does not match manifest lang "${n.json.lang}"`);
    }
    const thumbs = THUMB_NAMES.filter((t) => n.files.includes(t));
    if (thumbs.length > 1) err(`sims/${n.dir}: more than one thumbnail (${thumbs.join(', ')})`);
    entries.push({ ...n.json, path: `sims/${n.dir}/`, thumb: thumbs[0] ? `sims/${n.dir}/${thumbs[0]}` : undefined });
  }

  for (const { file, entries: list } of repo.linked ?? []) {
    if (!Array.isArray(list)) {
      errors.push(`linked/${file}: must be a JSON array of entries`);
      continue;
    }
    list.forEach((e, i) => {
      const where = `linked/${file}[${i}${e?.id ? ` ${e.id}` : ''}]`;
      checkEntry(e, where, vocab, (m) => errors.push(m));
      if (e?.kind !== 'linked') errors.push(`${where}: entries under linked/ must have kind "linked"`);
      if (e?.thumb !== undefined && !(repo.linkedThumbs ?? []).includes(e.thumb)) errors.push(`${where}: thumb "${e.thumb}" not found in linked/thumbs/`);
      entries.push({ ...e, thumb: e?.thumb ? `linked/thumbs/${e.thumb}` : undefined });
    });
  }

  const byId = new Map();
  for (const e of entries) {
    if (byId.has(e.id)) errors.push(`duplicate id "${e.id}"`);
    else byId.set(e.id, e);
  }
  for (const e of entries) {
    for (const r of e.related ?? []) if (!byId.has(r)) errors.push(`${e.id}: related id "${r}" does not exist`);
    if ((e.exceptions ?? []).length) warnings.push(`${e.id}: ${e.exceptions.length} declared contract exception(s)`);
  }

  const courses = [];
  const courseIds = new Set();
  for (const { file, json: c } of repo.courses ?? []) {
    const where = `courses/${file}`;
    const stem = file.replace(/\.json$/, '');
    if (c.id !== stem) errors.push(`${where}: id "${c.id}" must equal the file name "${stem}"`);
    if (courseIds.has(c.id)) errors.push(`${where}: duplicate course id`);
    courseIds.add(c.id);
    for (const k of Object.keys(c)) if (!['id', 'title', 'term', 'lang', 'intro', 'sections'].includes(k)) errors.push(`${where}: unknown field "${k}"`);
    if (typeof c.title !== 'string' || !c.title.trim()) errors.push(`${where}: missing "title"`);
    if (c.lang !== undefined && !LANGS.includes(c.lang)) errors.push(`${where}: "lang" must be one of ${LANGS.join(', ')}`);
    if (!Array.isArray(c.sections) || c.sections.length === 0) {
      errors.push(`${where}: "sections" must be a non-empty array`);
      continue;
    }
    const seen = new Set();
    c.sections.forEach((s, i) => {
      if (!Array.isArray(s?.sims) || s.sims.length === 0) errors.push(`${where}: sections[${i}].sims must be a non-empty array`);
      for (const id of s?.sims ?? []) {
        const e = byId.get(id);
        if (!e) errors.push(`${where}: unknown sim id "${id}"`);
        else if (e.class === 'tool') errors.push(`${where}: "${id}" is a tool; tools are lecturer-only and never go on course pages`);
        else if (e.status !== 'ready') warnings.push(`${where}: "${id}" is not ready; it is left off the generated page`);
        if (seen.has(id)) errors.push(`${where}: "${id}" is listed twice`);
        seen.add(id);
      }
    });
    courses.push(c);
  }

  // Derived: which courses each entry is on (the course files are the single source of truth).
  for (const e of entries) {
    e.courses = courses.filter((c) => c.sections.some((s) => (s.sims ?? []).includes(e.id))).map((c) => c.id);
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  courses.sort((a, b) => (a.id < b.id ? -1 : 1));
  return { entries, courses, errors, warnings };
}
