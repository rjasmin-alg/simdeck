// Loads the manifest sources (sims/*/sim.json, courses/*.json, tags.json, site.json)
// and validates them. `validate` is pure, so tests can feed it in-memory samples; `loadRepo` reads disk.
// The format is documented in docs/site-structure.md; keep the two in step.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { exceptionProblems } from './contract.mjs';

export const CLASSES = ['stepper', 'explorer', 'reference', 'tool'];
export const LEVELS = ['intro', 'core', 'advanced'];
export const STATUSES = ['ready', 'wip'];
/** Every page exists in both (docs/tasks/COMMON.md §4). Text fields are { "hr": …, "en": … } in this order. */
export const LANGS = ['hr', 'en'];
export const SUMMARY_MAX = 160;
export const CONCEPT_MAX = 80;

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Every field an entry may carry. Unknown fields are errors, so a typo ("tag", "sumary") never
// silently drops data from the index.
// Every simulator lives in sims/<id>/: simdeck copies and adopts what it lists, it never links out.
const FIELDS = ['id', 'class', 'status', 'title', 'concept', 'summary', 'topic', 'tags', 'level', 'languages', 'steps',
  'aliases', 'related', 'origin', 'asset_review'];
export const COURSE_FIELDS = ['id', 'title', 'term', 'lang', 'intro', 'short', 'sections'];
const REQUIRED = ['id', 'class', 'status', 'title', 'concept', 'summary', 'topic', 'tags', 'level'];

/** The languages a sim's page has: both, unless sim.json declares the single-language exception. */
export function languagesOf(e) {
  return Array.isArray(e?.languages) && e.languages.length ? e.languages : LANGS;
}

/**
 * Checks a text field that must exist in every language: { "hr": "…", "en": "…" }, each a non-empty string of at
 * most `max` characters. Reports through err; returns true when well formed.
 */
export function checkText(v, label, err, { max = 0, required = true } = {}) {
  if (v === undefined) {
    if (required) err(`missing required field "${label}"`);
    return !required;
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    err(`"${label}" must be { "hr": "…", "en": "…" } (both languages)`);
    return false;
  }
  let ok = true;
  for (const k of Object.keys(v)) if (!LANGS.includes(k)) { err(`"${label}" has unknown language "${k}"`); ok = false; }
  for (const l of LANGS) {
    if (typeof v[l] !== 'string' || v[l].trim() === '') { err(`"${label}.${l}" must be a non-empty string`); ok = false; }
    else if (max && v[l].length > max) { err(`"${label}.${l}" is ${v[l].length} chars, max ${max}`); ok = false; }
  }
  return ok;
}

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


  const courses = [];
  for (const file of listDir(join(root, 'courses'))) {
    if (!file.endsWith('.json')) continue;
    const json = tryJson(join(root, 'courses', file));
    if (json) courses.push({ file, json });
  }
  return { site, vocab, natives, courses, loadErrors: errors };
}

function checkEntry(e, where, vocab, err) {
  if (typeof e !== 'object' || e === null || Array.isArray(e)) {
    err(`${where}: entry must be an object`);
    return;
  }
  for (const k of Object.keys(e)) if (!FIELDS.includes(k)) err(`${where}: unknown field "${k}"`);
  for (const k of REQUIRED) if (e[k] === undefined) err(`${where}: missing required field "${k}"`);

  const str = (k, max) => {
    if (e[k] === undefined) return;
    if (typeof e[k] !== 'string' || e[k].trim() === '') err(`${where}: "${k}" must be a non-empty string`);
    else if (max && e[k].length > max) err(`${where}: "${k}" is ${e[k].length} chars, max ${max}`);
  };
  const text = (k, max) => {
    if (e[k] !== undefined) checkText(e[k], k, (m) => err(`${where}: ${m}`), { max });
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
  oneOf('class', CLASSES);
  oneOf('status', STATUSES);
  oneOf('level', LEVELS);
  text('title', 60);
  text('concept', CONCEPT_MAX);
  text('summary', SUMMARY_MAX);
  str('origin');

  // The single-language exception: an adopted page not yet translated says which language it has.
  if (e.languages !== undefined) {
    const l = e.languages;
    if (!Array.isArray(l) || l.length !== 1 || !LANGS.includes(l[0])) {
      err(`${where}: "languages" is the single-language exception, like ["en"]; leave it out when the page has both`);
    }
  }

  if (e.topic !== undefined && !(e.topic in (vocab.topics ?? {}))) err(`${where}: topic "${e.topic}" is not in tags.json`);
  if (strList('tags')) {
    if (e.tags?.length === 0) err(`${where}: "tags" needs at least one tag`);
    for (const t of e.tags ?? []) if (!(t in (vocab.tags ?? {}))) err(`${where}: tag "${t}" is not in tags.json`);
    if (new Set(e.tags ?? []).size !== (e.tags ?? []).length) err(`${where}: duplicate tags`);
  }
  if (e.aliases !== undefined) {
    // Extra search words per language: { "hr": [...], "en": [...] }; either list may be left out.
    const a = e.aliases;
    if (typeof a !== 'object' || a === null || Array.isArray(a) || !Object.keys(a).length) err(`${where}: "aliases" must be { "hr": [...], "en": [...] }`);
    else for (const [k, v] of Object.entries(a)) {
      if (!LANGS.includes(k)) err(`${where}: "aliases" has unknown language "${k}"`);
      else if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string' || x === '')) err(`${where}: "aliases.${k}" must be an array of non-empty strings`);
    }
  }
  strList('related');

  if (e.class === 'stepper') {
    if (!Number.isInteger(e.steps) || e.steps < 1) err(`${where}: a stepper needs "steps" (positive integer)`);
  } else if (e.steps !== undefined) {
    err(`${where}: "steps" is only for steppers`);
  }

  if (e.asset_review !== undefined && typeof e.asset_review !== 'boolean') err(`${where}: "asset_review" must be true or false`);

}

const EXC_RE = /<script\b[^>]*\bid=["']simdeck-exceptions["'][^>]*>([\s\S]*?)<\/script>/i;
const META_RE = /<script\b[^>]*\bid=["']simdeck-meta["'][^>]*>([\s\S]*?)<\/script>/i;

/**
 * Contract exceptions declared in the page, as the kit does it (docs/sim-ui.md):
 * <script type="application/json" id="simdeck-exceptions">[{"rule": "...", "why": "..."}]</script>.
 * Returns the array, or null when the block is malformed.
 */
export function pageExceptions(html) {
  const m = EXC_RE.exec(html ?? '');
  if (!m) return [];
  try {
    const v = JSON.parse(m[1]);
    return Array.isArray(v) && v.every((x) => typeof x?.rule === 'string' && typeof x?.why === 'string' && x.why.trim()) ? v : null;
  } catch {
    return null;
  }
}

/** The #simdeck-meta block for a sim page, generated from sim.json (the kit reads id, class and steps). */
export function metaFor(entry) {
  const { id, title, concept, summary, tags } = entry;
  return {
    id, title, concept, summary, tags, ...(entry.languages ? { languages: entry.languages } : {}),
    class: entry.class, ...(entry.steps ? { steps: entry.steps } : {}),
  };
}

/** The page's own #simdeck-meta placeholder (the build replaces it), or null. */
export function pageMeta(html) {
  const m = META_RE.exec(html ?? '');
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return {};
  }
}

/** Extracts `<html lang="..">` from a page, or null. */
export function htmlLang(html) {
  const m = /<html\b[^>]*\blang\s*=\s*["']?([a-zA-Z-]+)/i.exec(html ?? '');
  return m ? m[1].toLowerCase() : null;
}

/**
 * Validates everything `loadRepo` returns. Returns { entries, courses, errors, warnings };
 * `entries` gain `path` and `courses`, in id order.
 */
export function validate(repo) {
  const errors = [...(repo.loadErrors ?? [])];
  const warnings = [];
  const vocab = repo.vocab ?? { topics: {}, tags: {} };
  const entries = [];

  // tags.json: every topic and tag label in both languages.
  for (const kind of ['topics', 'tags']) {
    for (const [k, t] of Object.entries(vocab[kind] ?? {})) {
      checkText(t?.label, `${kind}.${k}.label`, (m) => errors.push(`tags.json: ${m}`));
      if (t?.aliases !== undefined && (!Array.isArray(t.aliases) || t.aliases.some((x) => typeof x !== 'string' || !x))) errors.push(`tags.json: "${kind}.${k}.aliases" must be an array of non-empty strings`);
    }
  }

  for (const n of repo.natives ?? []) {
    const where = `sims/${n.dir}/sim.json`;
    const err = (m) => errors.push(m);
    if (!n.hasManifest) {
      err(`sims/${n.dir}: folder has no sim.json`);
      continue;
    }
    if (!n.json) continue; // parse error already reported
    checkEntry(n.json, where, vocab, err);
    if (n.json.id !== n.dir) err(`${where}: id "${n.json.id}" must equal the folder name "${n.dir}"`);
    if (n.html === null) {
      err(`sims/${n.dir}: missing index.html`);
    } else {
      // <html lang> is the page's default before the kit picks the visitor's language: one the page has.
      const lang = htmlLang(n.html);
      const langs = languagesOf(n.json);
      if (!langs.includes(lang)) err(`sims/${n.dir}/index.html: <html lang="${lang}"> must be one of the page's languages (${langs.join(', ')})`);
      if (n.json.languages) warnings.push(`${n.json.id}: only in ${langs.join(', ')} (single-language exception)`);
      const dataSim = /<html\b[^>]*\bdata-sim\s*=\s*["']([^"']*)["']/i.exec(n.html)?.[1];
      if (dataSim !== undefined && dataSim !== n.json.id) err(`sims/${n.dir}/index.html: <html data-sim="${dataSim}"> must equal the id "${n.json.id}"`);
      const exc = pageExceptions(n.html);
      if (exc === null) err(`sims/${n.dir}/index.html: #simdeck-exceptions must be a JSON array of { "rule": "...", "why": "..." }`);
      else {
        // Rule ids are the gate's (lib/contract.mjs RULES): a typo would waive nothing, a non-waivable rule never.
        for (const p of exceptionProblems(exc)) err(`sims/${n.dir}/index.html: #simdeck-exceptions: ${p}`);
        if (exc.length) warnings.push(`${n.json.id}: ${exc.length} declared contract exception(s)`);
      }
      // Unbuilt, the kit reads the page's own placeholder; keep it in step so its mismatch warnings mean something.
      const pm = pageMeta(n.html);
      if (pm) for (const k of ['id', 'class', 'steps', 'title', 'concept']) {
        if (pm[k] !== undefined && JSON.stringify(pm[k]) !== JSON.stringify(n.json[k])) warnings.push(`sims/${n.dir}/index.html: #simdeck-meta ${k} is ${JSON.stringify(pm[k])}, sim.json says ${JSON.stringify(n.json[k])} (the build uses sim.json)`);
      }
    }
    entries.push({ ...n.json, path: `sims/${n.dir}/` });
  }

  const byId = new Map();
  for (const e of entries) {
    if (byId.has(e.id)) errors.push(`duplicate id "${e.id}"`);
    else byId.set(e.id, e);
  }
  for (const e of entries) {
    for (const r of e.related ?? []) if (!byId.has(r)) errors.push(`${e.id}: related id "${r}" does not exist`);
  }

  const courses = [];
  const courseIds = new Set();
  const shorts = new Map();
  for (const { file, json: c } of repo.courses ?? []) {
    const where = `courses/${file}`;
    const stem = file.replace(/\.json$/, '');
    if (c.id !== stem) errors.push(`${where}: id "${c.id}" must equal the file name "${stem}"`);
    if (courseIds.has(c.id)) errors.push(`${where}: duplicate course id`);
    courseIds.add(c.id);
    for (const k of Object.keys(c)) if (!COURSE_FIELDS.includes(k)) errors.push(`${where}: unknown field "${k}"`);
    if (c.short !== undefined) {
      // A short address (materijali.online/<short>) becomes one nginx rule; see shortLinkRules().
      if (typeof c.short !== 'string' || !ID_RE.test(c.short)) errors.push(`${where}: "short" must be kebab-case, like "linux"`);
      else if ((repo.site?.reservedPaths ?? []).includes(c.short)) errors.push(`${where}: short address "/${c.short}" is already used on the server (site.json reservedPaths)`);
      else if (shorts.has(c.short)) errors.push(`${where}: short address "/${c.short}" is also used by course "${shorts.get(c.short)}"`);
      else shorts.set(c.short, c.id);
    }
    const cerr = (m) => errors.push(`${where}: ${m}`);
    checkText(c.title, 'title', cerr);
    checkText(c.term, 'term', cerr, { required: false });
    checkText(c.intro, 'intro', cerr, { required: false });
    // lang: the language the course page opens in (a visitor's own choice wins, docs/site-structure.md §3.2).
    if (c.lang !== undefined && !LANGS.includes(c.lang)) errors.push(`${where}: "lang" must be one of ${LANGS.join(', ')}`);
    if (!Array.isArray(c.sections) || c.sections.length === 0) {
      errors.push(`${where}: "sections" must be a non-empty array`);
      continue;
    }
    const seen = new Set();
    c.sections.forEach((s, i) => {
      checkText(s?.title, `sections[${i}].title`, cerr, { required: false });
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
