// SPDX-License-Identifier: AGPL-3.0-or-later
// Loads the manifest sources (sims/*/sim.json, courses/*.json, tags.json, site.json)
// and validates them. `validate` is pure, so tests can feed it in-memory samples; `loadRepo` reads disk.
// The format is documented in docs/site-structure.md; keep the two in step.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { exceptionProblems } from './contract.mjs';
import { refMap } from '../site/core.mjs';

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
  'aliases', 'entries', 'related', 'origin', 'asset_review', 'credits'];
/** Fields of one sim.json "credits" item: third-party material in the sim, listed on the licences page. */
export const CREDIT_FIELDS = ['what', 'by', 'licence', 'url', 'changes'];
/**
 * Fields of one sim.json "entries" item: a preset of the page listed as its own line on the home page and linkable
 * from course files as "<sim>#<preset>". `query` (ossimulator pages: "scenario=<id>") replaces the kit's "preset=<id>".
 */
export const PRESET_FIELDS = ['preset', 'title', 'concept', 'summary', 'query'];
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
    // The page's own scripts and markup, where its preset ids are written (checked against sim.json "entries").
    const sources = files.filter((f) => /\.(js|html)$/.test(f) && !f.endsWith('.test.js'))
      .map((f) => readFileSync(join(abs, f), 'utf8')).join('\n');
    natives.push({ dir, json, html, sources, files, hasManifest: files.includes('sim.json') });
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

  if (e.entries !== undefined) {
    if (!Array.isArray(e.entries) || !e.entries.length) err(`${where}: "entries" must be a non-empty array of { preset, title, concept, summary?, query? }`);
    else {
      const seen = new Set();
      e.entries.forEach((x, i) => {
        const at = `${where}: entries[${i}]`;
        if (typeof x !== 'object' || x === null || Array.isArray(x)) return err(`${at} must be an object`);
        for (const k of Object.keys(x)) if (!PRESET_FIELDS.includes(k)) err(`${at}: unknown field "${k}"`);
        if (typeof x.preset !== 'string' || !ID_RE.test(x.preset)) err(`${at}: "preset" must be the preset's kebab-case id`);
        else if (seen.has(x.preset)) err(`${at}: preset "${x.preset}" is listed twice`);
        seen.add(x.preset);
        checkText(x.title, 'title', (m) => err(`${at}: ${m}`), { max: 60 });
        checkText(x.concept, 'concept', (m) => err(`${at}: ${m}`), { max: CONCEPT_MAX });
        checkText(x.summary, 'summary', (m) => err(`${at}: ${m}`), { max: SUMMARY_MAX, required: false });
        if (x.query !== undefined) {
          const q = queryProblem(x.query);
          if (q) err(`${at}: "query" ${q}`);
        }
      });
    }
  }

  if (e.class === 'stepper') {
    if (!Number.isInteger(e.steps) || e.steps < 1) err(`${where}: a stepper needs "steps" (positive integer)`);
  } else if (e.steps !== undefined) {
    err(`${where}: "steps" is only for steppers`);
  }

  if (e.asset_review !== undefined && typeof e.asset_review !== 'boolean') err(`${where}: "asset_review" must be true or false`);

  // Third-party material (fonts, vendored libraries, CC BY text or figures): the licences page lists it.
  if (e.credits !== undefined) {
    if (!Array.isArray(e.credits) || !e.credits.length) err(`${where}: "credits" must be a non-empty array of { what, by, licence, url?, changes? }`);
    else e.credits.forEach((c, i) => {
      const at = `${where}: credits[${i}]`;
      if (typeof c !== 'object' || c === null || Array.isArray(c)) return err(`${at} must be an object`);
      for (const k of Object.keys(c)) if (!CREDIT_FIELDS.includes(k)) err(`${at}: unknown field "${k}"`);
      checkText(c.what, 'what', (m) => err(`${at}: ${m}`));
      for (const k of ['by', 'licence']) if (typeof c[k] !== 'string' || !c[k].trim()) err(`${at}: "${k}" must be a non-empty string`);
      if (c.url !== undefined && (typeof c.url !== 'string' || !/^https?:\/\//.test(c.url))) err(`${at}: "url" must be an http(s) address`);
      checkText(c.changes, 'changes', (m) => err(`${at}: ${m}`), { required: false });
    });
  }

}

/** What is wrong with an entry's explicit query string ("scenario=fifo&frames=3"), or null. */
export function queryProblem(q) {
  if (typeof q !== 'string' || !q.trim()) return 'must be a non-empty string like "scenario=<id>"';
  if (/^[?&]|[#\s]/.test(q)) return 'is the part after "?": no leading "?" or "&", no "#" or spaces';
  const keys = [...new URLSearchParams(q).keys()];
  if (!keys.length || q.split('&').some((p) => !/^[^=&]+=[^=&]+$/.test(p))) return 'must be key=value pairs joined by "&"';
  if (keys.includes('lang')) return 'must not set "lang": the site adds the visitor\'s language';
  return null;
}

/**
 * The value an entry's page must contain: the kit's preset id, or the first value of its explicit query (the
 * ossimulator scenario id). It is looked for as a quoted string in the sim's own .js and .html files.
 */
export function presetKey(x) {
  if (x.query === undefined) return x.preset;
  return [...new URLSearchParams(x.query).values()][0];
}

const quoted = (src, v) => ['"', "'", '`'].some((q) => src.includes(`${q}${v}${q}`));

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

/** The #simdeck-meta block for a sim page, generated from sim.json (the kit reads id, class and steps; the browser check entries). */
export function metaFor(entry) {
  const { id, title, concept, summary, tags } = entry;
  return {
    id, title, concept, summary, tags, ...(entry.languages ? { languages: entry.languages } : {}),
    class: entry.class, ...(entry.steps ? { steps: entry.steps } : {}),
    // The browser check opens each preset entry (kit/tools/check-page.mjs); the kit itself ignores them.
    ...(entry.entries?.length ? { entries: entry.entries.filter((x) => typeof x?.preset === 'string').map((x) => ({ preset: x.preset, ...(x.query ? { query: x.query } : {}) })) } : {}),
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
        for (const p of exceptionProblems(exc, { adopted: !!n.json.origin })) err(`sims/${n.dir}/index.html: #simdeck-exceptions: ${p}`);
        if (exc.length) warnings.push(`${n.json.id}: ${exc.length} declared contract exception(s)`);
      }
      // Unbuilt, the kit reads the page's own placeholder; keep it in step so its mismatch warnings mean something.
      const pm = pageMeta(n.html);
      // A preset entry names a preset the page has (the browser check also opens each one, kit/tools/check-page.mjs).
      for (const [i, x] of (Array.isArray(n.json.entries) ? n.json.entries : []).entries()) {
        const key = typeof x?.preset === 'string' && !queryProblem(x.query ?? 'x=x') ? presetKey(x) : null;
        if (key && !quoted(n.sources ?? n.html, key)) err(`${where}: entries[${i}]: ${x.query === undefined ? `preset "${key}"` : `"${key}" (from its query)`} is not in the page's .js or .html files`);
      }
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

  // Course items: sim ids and "<sim>#<preset>" for preset entries (site/core.mjs refMap).
  const refs = refMap([...byId.values()]);
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
        const e = refs.get(id);
        const host = typeof id === 'string' && id.includes('#') ? byId.get(id.split('#')[0]) : null;
        if (!e && host) errors.push(`${where}: "${id}": ${host.id} has no preset entry "${id.slice(host.id.length + 1)}" (sim.json "entries")`);
        else if (!e) errors.push(`${where}: unknown sim id "${id}"`);
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
    // A course that lists one of the sim's preset entries ("<sim>#<preset>") lists the sim too.
    const mine = (ref) => ref === e.id || (typeof ref === 'string' && ref.startsWith(`${e.id}#`));
    e.courses = courses.filter((c) => c.sections.some((s) => (s.sims ?? []).some(mine))).map((c) => c.id);
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  courses.sort((a, b) => (a.id < b.id ? -1 : 1));
  return { entries, courses, errors, warnings };
}
