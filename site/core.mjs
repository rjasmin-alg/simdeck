// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared by the build (Node) and the admin app (served to the browser as a module). Pure functions
// only: no DOM, no Node APIs, no fetch. The published site gets HTML rendered from here, not this code.

export const LANGS = ['hr', 'en'];

/** The published pages' own words, in both languages (the admin is Croatian and uses STR.hr). */
export const STR = {
  hr: {
    classes: { stepper: 'korak po korak', explorer: 'istraživanje', reference: 'pregled', tool: 'alat' },
    levels: { intro: 'uvod', core: 'osnovno', advanced: 'napredno' },
    noneYet: 'Još nema objavljenih simulatora.',
    courseEmpty: 'Simulatori za ovaj kolegij su u pripremi.',
    search: 'Traži simulator, pojam ili naredbu…',
    noMatch: 'Ništa ne odgovara. Pokušajte kraću riječ, ili hrvatski ili engleski naziv.',
    tagline: 'Mali simulatori za velike ideje računarstva, svaki za jedan pojam. Otvorite bilo koji: strelica → vodi dalje.',
    sims: ['simulator', 'simulatora', 'simulatora'],
    topicsN: ['područje', 'područja', 'područja'],
    stepsN: ['korak', 'koraka', 'koraka'],
    topicsNav: 'Područja',
    tray: 'Odabir',
    trayEmpty: 'Označite simulatore znakom + i složite ih za predavanje.',
    lecture: 'Predavanje',
    handout: 'Handout',
    copyLink: 'Kopiraj poveznicu',
    copied: 'Poveznica je kopirana',
    clear: 'Isprazni',
    add: 'Dodaj u odabir',
    remove: 'Makni iz odabira',
    up: 'Pomakni gore',
    down: 'Pomakni dolje',
    allSimsBack: '← Svi simulatori',
    lectureHint: '← → odabir · Enter otvara · 1–9 skok · P handout',
    enterOpens: 'Enter ↵ otvara simulator',
    openAt: 'Cijeli popis na',
    toolLeftOut: 'Alat za predavača, nije na handoutu',
    unknown: 'Nepoznato u poveznici, preskočeno',
    allSims: '← svi simulatori',
    print: 'Ispiši',
    langName: 'Hrvatski',
    onlyIn: 'samo na jeziku',
    source: 'Izvorni kod',
    licences: 'Licence',
    licencesIntro: 'simdeck je slobodan softver: smijete ga koristiti, proučavati, dijeliti i mijenjati pod uvjetima licence GNU Affero General Public License, verzija 3 ili novija. Tko ga posluži na mreži, mora ponuditi i njegov izvorni kod.',
    licenceText: 'tekst licence',
    licencesKit: 'U svim simulatorima',
    licencesSims: 'U pojedinim simulatorima',
    licencesNone: 'Simulatori zasad ne sadrže materijale trećih strana.',
    changes: 'Izmjene',
    learnAsk: 'Što želite danas naučiti?',
    learnLead: 'Odaberite područje, pa temu: na kraju puta čekaju simulatori koji je pokazuju.',
    learnRoot: 'Sve teme',
    learnFind: 'Brzo traženje',
    learnFindHint: 'Svi simulatori na jednom mjestu, s pretragom i odabirom za predavanje',
    learnSearch: 'Ili odmah potražite pojam…',
    learnUp: 'Natrag',
    learnEmpty: 'Stablo tema još nije složeno. Svi simulatori su u brzom traženju.',
    areasN: ['područje', 'područja', 'područja'],
  },
  en: {
    classes: { stepper: 'step by step', explorer: 'explorer', reference: 'reference', tool: 'tool' },
    levels: { intro: 'intro', core: 'core', advanced: 'advanced' },
    noneYet: 'No simulators published yet.',
    courseEmpty: 'The simulators for this course are in preparation.',
    search: 'Find a simulator, a concept or a command…',
    noMatch: 'Nothing matches. Try a shorter word, or the Croatian or English name.',
    tagline: 'Small simulators for the big ideas of computing, one concept each. Open any of them: the → key takes it from there.',
    sims: ['simulator', 'simulators'],
    topicsN: ['topic', 'topics'],
    stepsN: ['step', 'steps'],
    topicsNav: 'Topics',
    tray: 'Selection',
    trayEmpty: 'Mark simulators with + and line them up for a lecture.',
    lecture: 'Lecture',
    handout: 'Handout',
    copyLink: 'Copy link',
    copied: 'Link copied',
    clear: 'Clear',
    add: 'Add to the selection',
    remove: 'Remove from the selection',
    up: 'Move up',
    down: 'Move down',
    allSimsBack: '← All simulators',
    lectureHint: '← → choose · Enter opens · 1–9 jump · P handout',
    enterOpens: 'Enter ↵ opens the simulator',
    openAt: 'The whole list at',
    toolLeftOut: 'Lecturer tool, not on the handout',
    unknown: 'Unknown in the link, skipped',
    allSims: '← all simulators',
    print: 'Print',
    langName: 'English',
    onlyIn: 'only in',
    source: 'Source code',
    licences: 'Licences',
    licencesIntro: 'simdeck is free software: you may use, study, share and change it under the GNU Affero General Public License, version 3 or later. Whoever serves it over a network must offer its source code too.',
    licenceText: 'licence text',
    licencesKit: 'In every simulator',
    licencesSims: 'In single simulators',
    licencesNone: 'The simulators contain no third-party material yet.',
    changes: 'Changes',
    learnAsk: 'What do you want to learn about today?',
    learnLead: 'Pick an area, then a subject: at the end of the path are the simulators that show it.',
    learnRoot: 'All subjects',
    learnFind: 'Quick finder',
    learnFindHint: 'Every simulator in one place, with search and a selection for a lecture',
    learnSearch: 'Or look a concept up right away…',
    learnUp: 'Back',
    learnEmpty: 'The subject tree is not laid out yet. Every simulator is in the quick finder.',
    areasN: ['area', 'areas'],
  },
};

/** simdeck's own licence (LICENSE), and the published copies of the licence texts the site ships. */
export const LICENCE = 'AGPL-3.0-or-later';
export const LICENCE_TEXT = 'licences/AGPL-3.0.txt';
export const LICENCES_PAGE = 'licences/index.html';

/** Third-party parts of the kit, inlined into every sim page. Sims list their own in sim.json "credits". */
export const KIT_CREDITS = [{
  what: { hr: 'Font Atkinson Hyperlegible', en: 'Atkinson Hyperlegible font' },
  by: 'Braille Institute of America, Inc.',
  licence: 'OFL-1.1',
  text: 'licences/OFL-1.1.txt',
}];

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** A text field { hr, en } in one language (a plain string is the same in both). */
export function loc(v, lang = 'hr') {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v);
  return v[lang] ?? v.hr ?? v.en ?? '';
}

/** The languages a sim's page has (sim.json "languages", the single-language exception, else both). */
export function languagesOf(e) {
  return Array.isArray(e?.languages) && e.languages.length ? e.languages : LANGS;
}

/**
 * A text field as HTML in both languages: one span per language, shown by html[lang] (site/lang.js and the pages'
 * CSS hide the other). Text that is the same in both languages is written once.
 */
export function bi(v, fmt = escapeHtml) {
  const hr = loc(v, 'hr'), en = loc(v, 'en');
  if (hr === en) return fmt(hr);
  return `<span data-l="hr" lang="hr">${fmt(hr)}</span><span data-l="en" lang="en">${fmt(en)}</span>`;
}

/** The site's own string in both languages: bi of STR.hr[k], STR.en[k]. */
export function biStr(k) {
  return bi({ hr: STR.hr[k], en: STR.en[k] });
}

/** A small badge for a single-language sim, shown only while the page is in a language the sim lacks. */
export function langBadge(e) {
  const has = languagesOf(e);
  return LANGS.filter((l) => !has.includes(l))
    .map((l) => ` <span class="h-lang" data-l="${l}" lang="${l}" title="${escapeHtml(STR[l].onlyIn)} ${escapeHtml(has.join(', ').toUpperCase())}">${escapeHtml(has.join('/').toUpperCase())}</span>`)
    .join('');
}

/** Lower-case, strip diacritics (č→c, đ→d), so "deduplikacija" matches "DEDUPLIKACIJA" and "cvor" matches "čvor". */
export function normalise(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * A sim's preset entries (sim.json "entries") as list items of their own: the host's fields (path, class, status,
 * topic, tags, languages, courses), the entry's own title, concept and summary, and the query that opens the page at
 * the preset. A course file names one as "<sim>#<preset>", which is its id.
 */
export function presetItems(e) {
  // Malformed items are left out here; lib/manifest.mjs reports them.
  return (Array.isArray(e.entries) ? e.entries : []).filter((x) => typeof x?.preset === 'string').map((x) => ({
    id: `${e.id}#${x.preset}`, preset: x.preset, host: e,
    title: x.title, concept: x.concept, summary: x.summary, query: entryQuery(x),
    path: e.path, class: e.class, status: e.status, topic: e.topic, tags: e.tags, level: e.level,
    ...(e.languages ? { languages: e.languages } : {}), courses: e.courses,
  }));
}

/** The query string of a preset entry: the one it gives (ossimulator's "scenario=…"), else the kit's "preset=<id>". */
export function entryQuery(x) {
  return x.query ?? `preset=${encodeURIComponent(x.preset)}`;
}

/** Every id a course file may name: each sim's id, and "<sim>#<preset>" for each of its preset entries. */
export function refMap(entries) {
  const m = new Map();
  for (const e of entries) {
    m.set(e.id, e);
    for (const p of presetItems(e)) m.set(p.id, p);
  }
  return m;
}

const withQuery = (base, query, lang) => {
  const q = [query, lang ? `lang=${lang}` : ''].filter(Boolean).join('&');
  return q ? `${base}?${q}` : base;
};

/**
 * The link to a sim, or to a preset entry (its query opens the preset). `depth` is how many folders below the site
 * root the linking page sits (home: 0, courses/<id>/: 2). Links name index.html explicitly so they work from file://.
 */
export function entryHref(e, depth = 0, lang = null) {
  return withQuery(`${'../'.repeat(depth)}${e.path}index.html`, e.query, lang);
}

/** The absolute URL a student would type, for printed course pages; ?lang= only when it is not the site's default. */
export function entryAbsUrl(e, site, lang = null) {
  return withQuery(`${String(site.siteUrl ?? '').replace(/\/?$/, '/')}${e.path}`, e.query, lang && lang !== (site.lang ?? 'hr') ? lang : null);
}

/** materijali.online/<short> for a course with a short address, or null. */
export function shortUrl(course, site) {
  if (!course.short || !site.siteUrl) return null;
  return `${new URL(site.siteUrl).origin}/${course.short}`;
}

/**
 * One nginx rule per course with a short address, redirecting /<short> to its course page under
 * siteUrl. Paste into the server block (or include it); it is regenerated, never hand-edited.
 */
export function shortLinkRules(courses, site) {
  const base = new URL(site.siteUrl ?? 'https://example.org/').pathname.replace(/\/?$/, '/');
  return courses
    .filter((c) => c.short)
    .map((c) => `location ~ ^/${c.short}/?$ { return 302 ${base}courses/${c.id}/; }  # ${loc(c.title, c.lang ?? site.lang ?? 'hr').replace(/\n/g, ' ')}`)
    .join('\n');
}

const isUrl = (s) => /^[a-z][a-z0-9+.-]*:/i.test(s);

/**
 * Where the source of the published site is (AGPL §13), seen from a page `depth` folders below the site root:
 * site.json "source", an address relative to the site root (default: the archive the deploy writes next to the
 * site) or an absolute URL (a public repo).
 */
export function sourceHref(site, depth = 0) {
  const src = site?.source ?? 'source.tar.gz';
  return isUrl(src) ? src : `${'../'.repeat(depth)}${src}`;
}

/** The licence line every published page carries: licence name, source code, the licences page. `lead` is plain text. */
export function licenceLine(site, depth = 0, lead = site?.title ?? 'simdeck') {
  const up = '../'.repeat(depth);
  return `<p class="h-licence">${escapeHtml(lead)} · <a href="${up}${LICENCE_TEXT}">${LICENCE}</a> · <a href="${escapeHtml(sourceHref(site, depth))}">${biStr('source')}</a> · <a data-lang-link href="${up}${LICENCES_PAGE}">${biStr('licences')}</a></p>`;
}

function creditItem(c, depth) {
  const text = c.text ? ` (<a href="${'../'.repeat(depth)}${escapeHtml(c.text)}">${biStr('licenceText')}</a>)` : '';
  const what = c.url ? `<a href="${escapeHtml(c.url)}">${bi(c.what)}</a>` : bi(c.what);
  const changes = c.changes ? `<span class="h-summary">${biStr('changes')}: ${bi(c.changes)}</span>` : '';
  return `<li>${what} · ${escapeHtml(c.by)} · ${escapeHtml(c.licence)}${text}${changes}</li>`;
}

/**
 * The body of the licences page (licences/index.html): simdeck's own licence and source, the kit's third-party
 * parts, then every listed sim's sim.json "credits".
 */
export function renderLicences(ctx, depth = 1) {
  const up = '../'.repeat(depth);
  const sims = search(ctx.entries, ctx.vocab, '', {}, ctx.site?.lang ?? 'hr').filter((e) => e.credits?.length);
  const simList = sims.length
    ? sims.map((e) => `<section><h3><a data-lang-link href="${escapeHtml(entryHref(e, depth))}">${bi(e.title)}</a></h3><ul>${e.credits.map((c) => creditItem(c, depth)).join('\n')}</ul></section>`).join('\n')
    : `<p class="h-empty">${biStr('licencesNone')}</p>`;
  return `<header><h1>${biStr('licences')}</h1></header>
<main>
<section><h2>${escapeHtml(ctx.site?.title ?? 'simdeck')}</h2>
<p class="h-intro">${biStr('licencesIntro')}</p>
<ul><li><a href="${up}${LICENCE_TEXT}">${LICENCE}</a> · <a href="${escapeHtml(sourceHref(ctx.site, depth))}">${biStr('source')}</a></li></ul></section>
<section><h2>${biStr('licencesKit')}</h2><ul>${KIT_CREDITS.map((c) => creditItem(c, depth)).join('\n')}</ul></section>
<section><h2>${biStr('licencesSims')}</h2>${simList}</section>
</main>`;
}

const both = (v) => LANGS.map((l) => loc(v, l)).filter((x, i, a) => a.indexOf(x) === i).join(' ');

/** One searchable string per field, weighted in `search`. Both languages: a visitor may type either. */
export function searchFields(e, vocab) {
  const tagWords = (e.tags ?? []).flatMap((t) => [t, both(vocab.tags?.[t]?.label), ...(vocab.tags?.[t]?.aliases ?? [])]);
  const aliases = Object.values(e.aliases ?? {}).flat();
  return {
    title: normalise(both(e.title)),
    id: normalise(e.id),
    tags: normalise([...tagWords, ...aliases].join(' ')),
    topic: normalise(`${e.topic} ${both(vocab.topics?.[e.topic]?.label)}`),
    text: normalise(`${both(e.concept)} ${both(e.summary)}`),
  };
}

/**
 * Filters and ranks entries. Every query word must match somewhere (AND); ranking prefers title
 * hits, then tags and aliases, then the rest. Ties keep title order, so the list is stable.
 * filters: { tags: [..] (all required), topic, level, cls, course, lang (the page exists in it) }.
 * `lang` orders titles as they read in that language.
 */
export function search(entries, vocab, query, filters = {}, lang = 'hr') {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  const out = [];
  for (const e of entries) {
    if (filters.tags?.length && !filters.tags.every((t) => e.tags.includes(t))) continue;
    if (filters.topic && e.topic !== filters.topic) continue;
    if (filters.level && e.level !== filters.level) continue;
    if (filters.cls && e.class !== filters.cls) continue;
    if (filters.lang && !languagesOf(e).includes(filters.lang)) continue;
    if (filters.course && !(e.courses ?? []).includes(filters.course)) continue;
    const f = searchFields(e, vocab);
    let score = 0;
    let ok = true;
    for (const w of words) {
      let s = 0;
      if (f.title.split(/[\s\-–:/,()]+/).some((t) => t.startsWith(w))) s = 10;
      else if (f.title.includes(w)) s = 6;
      else if (f.id.includes(w)) s = 5;
      else if (f.tags.includes(w)) s = 4;
      else if (f.topic.includes(w)) s = 3;
      else if (f.text.includes(w)) s = 1;
      if (!s) {
        ok = false;
        break;
      }
      score += s;
    }
    if (ok) out.push({ e, score });
  }
  out.sort((a, b) => b.score - a.score || natural(loc(a.e.title, lang), loc(b.e.title, lang)) || cmp(a.e.id, b.e.id));
  return out.map((x) => x.e);
}

// "Simulator 24" before "Simulator 108"; diacritics folded so the order is the same in every locale.
function natural(a, b) {
  return normalise(a).localeCompare(normalise(b), 'en', { numeric: true });
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Groups an already ranked list by topic, in tags.json order, dropping empty topics. */
export function group(list, vocab) {
  return Object.keys(vocab.topics ?? {})
    .map((t) => ({ key: t, label: vocab.topics[t].label, items: list.filter((e) => e.topic === t) }))
    .filter((g) => g.items.length);
}

/** What the published site carries: finished entries. Tools are listed on the home page (the
 * lecturer opens them in class) but never on course pages. */
export function isPublic(e) {
  return e.status === 'ready';
}

/** Splits requested ids into what a course page may show, and why the rest was left out. */
export function courseItems(ids, byId, drafts = false) {
  const items = [];
  const skipped = [];
  for (const id of ids) {
    const e = byId.get(id);
    if (!e) skipped.push({ id, why: 'unknown' });
    else if (e.class === 'tool') skipped.push({ id, why: 'tool' });
    else if (e.status !== 'ready' && !drafts) skipped.push({ id, why: 'wip' });
    else items.push(e);
  }
  return { items, skipped };
}

/**
 * The body of a course page, from a course file ({ title, term?, intro?, lang?, sections: [{ title?, sims }] }), in
 * both languages. An item is a sim id or "<sim>#<preset>" (a preset entry, linked to open at that preset). Sim links carry ?lang= in the course's language; site/lang.js rewrites them when the visitor
 * switches. Returns { html, skipped }.
 */
export function renderCourse(course, ctx, depth = 0, drafts = false) {
  const byId = refMap(ctx.entries);
  const lang = course.lang ?? ctx.site.lang ?? 'hr';
  const skipped = [];
  let n = 0;
  const sections = course.sections.map((s) => {
    const r = courseItems(s.sims ?? [], byId, drafts);
    skipped.push(...r.skipped);
    const lis = r.items.map((e) => {
      n += 1;
      const urls = LANGS.map((l) => ({ l, url: entryAbsUrl(e, ctx.site, l) }));
      return `<li value="${n}"${e.host ? ' class="h-preset"' : ''}>${hostLabel(e)}<a data-lang-link href="${escapeHtml(entryHref(e, depth, lang))}">${bi(e.title)}</a>${langBadge(e)}
<span class="h-concept">${bi(e.concept)}</span>
${e.summary ? `<span class="h-summary">${bi(e.summary)}</span>` : ''}
<span class="h-url">${bi(Object.fromEntries(urls.map((u) => [u.l, u.url])))}</span></li>`;
    });
    if (!lis.length) return '';
    return `<section>${s.title ? `<h2>${bi(s.title)}</h2>` : ''}<ol>${lis.join('\n')}</ol></section>`;
  });
  const short = shortUrl(course, ctx.site);
  const html = `<header><h1>${bi(course.title)}</h1>${course.term ? `<p class="h-term">${bi(course.term)}</p>` : ''}${short ? `<p class="h-short">${escapeHtml(short.replace(/^https?:\/\//, ''))}</p>` : ''}${course.intro ? `<p class="h-intro">${bi(course.intro)}</p>` : ''}</header>
<main>${n ? sections.join('\n') : `<p class="h-empty">${biStr('courseEmpty')}</p>`}</main>
<footer>${licenceLine(ctx.site, depth, [ctx.site.title, short ?? ctx.site.siteUrl].filter(Boolean).join(' · '))}</footer>`;
  return { html, skipped };
}

/** A preset entry's line starts with its host sim's title, so it reads on its own when a search hides the host. */
function hostLabel(e) {
  return e.host ? `<span class="h-host">${bi(e.host.title)} ›</span> ` : '';
}

/**
 * The plural form of a count: forms are [one, few, many] in Croatian (1 / 2–4 / 5+, but 11–14 take "many") and
 * [one, other] in English.
 */
export function plural(lang, n, forms) {
  if (lang === 'en') return n === 1 ? forms[0] : forms[1];
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

/** "38 simulatora" / "38 simulators": a count with the site's plural forms STR[lang][key], in both languages. */
export function countStr(key, n) {
  return bi(Object.fromEntries(LANGS.map((l) => [l, `${n} ${plural(l, n, STR[l][key])}`])));
}

/**
 * Each topic's colour: one of the kit's series colours --c1…--c8. tags.json has more topics than the kit has
 * colours, so some share one; the topic's label always goes with it. A topic not listed here takes its place in
 * tags.json, round the eight.
 */
export const TOPIC_ACCENTS = {
  networks: 1, os: 2, storage: 3, architecture: 4, distributed: 5, radio: 6, theory: 7, classroom: 8,
  'linux-admin': 3, security: 2, 'windows-admin': 1, internet: 6,
};

export function topicAccent(key, vocab) {
  const n = TOPIC_ACCENTS[key] ?? (Math.max(0, Object.keys(vocab?.topics ?? {}).indexOf(key)) % 8) + 1;
  return `var(--c${n})`;
}

/** Where the build puts a sim's thumbnail (scripts/thumbs.mjs makes them; light only for now). */
export function thumbHref(id) {
  return `thumbs/${id}-light.webp`;
}

/** The most sims a ?set= link carries. */
export const SET_MAX = 30;

/**
 * Reads a ?set= value ("vlan,cephsim:three-racks"): ids in order, without repeats, at most `max`. A preset is written
 * "<sim>:<preset>" in the link ("#" would end the query) and means a course file's "<sim>#<preset>". `known` has
 * .has(id) (a Map or a Set). Returns { items: [ids], skipped: [what the link named but the site lacks] }.
 * Written without anything from outside the function: the build inlines it into the page script as it is.
 */
export function parseSet(str, known, max = 30) {
  const items = [];
  const skipped = [];
  const seen = new Set();
  for (const raw of String(str ?? '').split(',')) {
    const id = raw.trim().replace(':', '#');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!known.has(id)) skipped.push(id);
    else if (items.length < max) items.push(id);
  }
  return { items, skipped };
}

/** The ?set= value for a list of ids: "<sim>#<preset>" is written "<sim>:<preset>". Inlined into the page script too. */
export function setParam(ids) {
  return ids.map((id) => String(id).replace('#', ':')).join(',');
}

/** The finder's folder: the search-and-shelves page, with the selection and the lecture view (?set=). */
export const FINDER = 'find/';

/** The address of a set (a lecture) on the published site, for a link to share. */
export function setUrl(ids, site) {
  return `${String(site.siteUrl ?? '').replace(/\/?$/, '/')}${FINDER}?set=${setParam(ids)}`;
}

/** The words a list item is found by, folded, in one string. */
function wordsOf(e, vocab) {
  const f = searchFields(e, vocab);
  return [f.title, f.id, f.tags, f.topic, f.text];
}
const flat = (words) => escapeHtml(words.join(' ').replace(/\s+/g, ' ').trim());

/**
 * What the page script needs to show an item in the selection, the lecture view and the handout, as attributes and
 * hidden spans, so the page carries no data blob: id, class, topic, the absolute address, the link, and the title,
 * concept and summary in both languages.
 */
function itemData(e, ctx) {
  return `data-id="${escapeHtml(e.id)}" data-class="${escapeHtml(e.class)}" data-topic="${escapeHtml(e.topic)}" data-url="${escapeHtml(entryAbsUrl(e, ctx.site))}"`;
}

/**
 * One tile on the home page: the screenshot (or a placeholder in the topic's colour), title and concept, class and
 * steps, up to two preset chips and "+N" for the rest, and + to add it to the selection. The summary is in the page
 * for the lecture view and the handout, hidden on the tile. `i` is the tile's place on the page: the first ones load
 * their picture at once, the rest lazily.
 */
export function renderTile(e, ctx, i = 0) {
  const vocab = ctx.vocab;
  const depth = ctx.depth ?? 0;
  const up = '../'.repeat(depth);
  const presets = presetItems(e);
  const pic = ctx.thumbs?.has(e.id)
    ? `<img src="${escapeHtml(up + thumbHref(e.id))}" alt="" width="560" height="350"${i < 10 ? '' : ' loading="lazy"'}>`
    : `<span class="ph" aria-hidden="true">${escapeHtml(loc(e.title, 'hr').slice(0, 1))}</span>`;
  const steps = e.class === 'stepper' && e.steps ? ` · ${countStr('stepsN', e.steps)}` : '';
  const chips = presets.map((p, k) => `<li class="preset${k >= 2 ? ' more' : ''}" ${itemData(p, ctx)} data-s="${flat([...wordsOf(p, vocab), normalise(p.preset)])}"><a data-lang-link href="${escapeHtml(entryHref(p, depth))}" class="t-title">${bi(p.title)}</a>`
    + `<span class="t-concept" hidden>${bi(p.concept)}</span>${p.summary ? `<span class="t-summary" hidden>${bi(p.summary)}</span>` : ''}`
    + `<button type="button" class="pick pick-sm" data-pick="${escapeHtml(p.id)}" aria-pressed="false"><span aria-hidden="true"></span></button></li>`).join('');
  const more = presets.length > 2 ? `<li class="more-btn"><button type="button" data-more>+${presets.length - 2}</button></li>` : '';
  return `<article class="tile" ${itemData(e, ctx)} data-s="${flat(wordsOf(e, vocab))}" style="--tc:${topicAccent(e.topic, vocab)}">`
    + `<a class="tile-link" data-lang-link href="${escapeHtml(entryHref(e, depth))}"><span class="pic">${pic}</span>`
    + `<span class="tile-text"><h3 class="t-title">${bi(e.title)}${langBadge(e)}</h3><span class="t-concept">${bi(e.concept)}</span>`
    + `<span class="t-summary" hidden>${bi(e.summary)}</span></span></a>`
    + `<p class="tile-meta">${bi(STR.hr.classes[e.class] ? { hr: STR.hr.classes[e.class], en: STR.en.classes[e.class] } : e.class)}${steps}</p>`
    + (chips ? `<ul class="presets">${chips}${more}</ul>` : '')
    + `<button type="button" class="pick" data-pick="${escapeHtml(e.id)}" aria-pressed="false"><span aria-hidden="true"></span></button></article>`;
}

/** The topics that have public entries, in tags.json order, with their counts: the home page's chips. */
export function renderChips(groups, vocab) {
  return groups.map((g) => `<a class="chip" href="#t-${escapeHtml(g.key)}" data-chip="${escapeHtml(g.key)}" style="--tc:${topicAccent(g.key, vocab)}"><span class="dot"></span>${bi(g.label)} <small>${g.items.length}</small></a>`).join('');
}

/** The entries the home page lists: finished ones (every one with drafts), in title order. */
export function homeEntries(ctx, drafts = false) {
  return search(drafts ? ctx.entries : ctx.entries.filter(isPublic), ctx.vocab, '', {}, ctx.site?.lang ?? 'hr');
}

/**
 * The published home page's list: every public sim as a tile, on one shelf per topic (tags.json order), as static
 * HTML. A sim's preset entries (sim.json "entries") are chips on its tile, each with its own link and +. The tile and
 * each chip carry their folded search words in data-s for the page script, which shows a tile when its own words or
 * a chip's (with the tile's) match, so "storm" finds the STP tile and its broadcast-storm chip. ctx.thumbs is the set
 * of ids that have a thumbnail.
 */
export function renderIndexList(ctx, drafts = false) {
  const list = homeEntries(ctx, drafts);
  if (!list.length) return `<p class="empty">${biStr('noneYet')}</p>`;
  let i = 0;
  return group(list, ctx.vocab)
    .map((g) => `<section class="topic" id="t-${escapeHtml(g.key)}" data-topic="${escapeHtml(g.key)}" style="--tc:${topicAccent(g.key, ctx.vocab)}"><h2><span class="dot"></span><span class="t-topic">${bi(g.label)}</span> <small>${g.items.length}</small></h2>`
      + `<div class="grid">${g.items.map((e) => renderTile(e, ctx, i++)).join('')}</div></section>`)
    .join('\n');
}

// ── the home page's tree (learn.json) ──

/** The tree's ready items under a node, each once, in tree order: what its count and its peek pictures are from. */
export function learnItems(node, byId) {
  const out = new Map();
  const visit = (n) => {
    for (const id of n.sims ?? []) {
      const e = byId.get(id);
      if (e && isPublic(e) && !out.has(id)) out.set(id, e);
    }
    for (const c of n.children ?? []) visit(c);
  };
  visit(node);
  return [...out.values()];
}

/** Each area's colour: the kit's series colours in turn (an area spans topics, so it has none of its own). */
export const areaAccent = (i) => `var(--c${(i % 8) + 1})`;

/**
 * The tree as nodes with their path ("networks/addresses/subnets", also the deep link #networks/addresses/subnets),
 * parents, area colour and ready items, depth first; nodes left with no ready item are dropped.
 */
export function learnNodes(learn, byId) {
  const out = [];
  const visit = (n, parents, accent) => {
    const path = [...parents.map((p) => p.id), n.id].join('/');
    const items = learnItems(n, byId);
    if (!items.length) return null;
    const node = { ...n, path, parents, accent, items, kids: [] };
    out.push(node);
    for (const c of n.children ?? []) {
      const k = visit(c, [...parents, node], accent);
      if (k) node.kids.push(k);
    }
    return node;
  };
  const areas = (learn?.nodes ?? []).map((n, i) => visit(n, [], areaAccent(i))).filter(Boolean);
  return { areas, all: out };
}

function learnPic(e, ctx, up) {
  const id = (e.host ?? e).id;
  return ctx.thumbs?.has(id)
    ? `<img src="${escapeHtml(up + thumbHref(id))}" alt="" width="560" height="350" loading="lazy">`
    : `<span class="ph" aria-hidden="true">${escapeHtml(loc((e.host ?? e).title, 'hr').slice(0, 1))}</span>`;
}

/** A card that opens a node: title, blurb, count, and a peek at what is inside (its children, or a leaf's sims). */
function learnCard(n, ctx, up) {
  const peek = n.kids.length
    ? `<span class="c-peek">${n.kids.map((k) => bi(k.title)).join('<span class="sep" aria-hidden="true"> · </span>')}</span>`
    : `<span class="c-pics" aria-hidden="true">${n.items.slice(0, 3).map((e) => `<span class="pic">${learnPic(e, ctx, up)}</span>`).join('')}</span>`;
  return `<a class="card" href="#${escapeHtml(n.path)}" style="--tc:${n.accent}"><span class="c-title">${bi(n.title)}</span>`
    + (n.blurb ? `<span class="c-blurb">${bi(n.blurb)}</span>` : '')
    + `<span class="c-count">${countStr('sims', n.items.length)}</span>${peek}</a>`;
}

/** A sim (or a preset) in a leaf: its picture, title and concept, linked to the page (at the preset). */
function learnSim(e, ctx, up) {
  const steps = e.class === 'stepper' && (e.host ?? e).steps ? ` · ${countStr('stepsN', (e.host ?? e).steps)}` : '';
  const cls = STR.hr.classes[e.class] ? bi({ hr: STR.hr.classes[e.class], en: STR.en.classes[e.class] }) : escapeHtml(e.class);
  return `<a class="sim" data-lang-link href="${escapeHtml(entryHref(e, ctx.depth ?? 0))}" style="--tc:${topicAccent(e.topic, ctx.vocab)}">`
    + `<span class="pic">${learnPic(e, ctx, up)}</span><span class="s-text">${hostLabel(e)}<strong class="s-title">${bi(e.title)}${langBadge(e)}</strong>`
    + `<span class="s-concept">${bi(e.concept)}</span><span class="s-meta">${cls}${steps}</span></span></a>`;
}

/**
 * The home page's tree, as static HTML: one <section> per node, its id the node's path, so #networks/addresses opens
 * it by CSS :target alone (site/learn.css) and works without script, from file:// and as a link to share. The root
 * section shows the areas when no node is targeted. Each section carries its own breadcrumbs. ctx: { entries, vocab,
 * thumbs, depth }.
 */
export function renderLearn(learn, ctx) {
  const up = '../'.repeat(ctx.depth ?? 0);
  const byId = refMap(ctx.entries);
  const { areas, all } = learnNodes(learn, byId);
  if (!areas.length) return `<p class="empty">${biStr('learnEmpty')}</p>`;
  const crumbs = (n) => `<nav class="crumbs" aria-label="${escapeHtml(`${STR.hr.learnRoot} / ${STR.en.learnRoot}`)}"><a href="#">${biStr('learnRoot')}</a>`
    + n.parents.map((p) => ` <span aria-hidden="true">›</span> <a href="#${escapeHtml(p.path)}">${bi(p.title)}</a>`).join('')
    + ` <span aria-hidden="true">›</span> <span aria-current="page">${bi(n.title)}</span></nav>`;
  const root = `<section class="node root" data-path=""><div class="cards areas">${areas.map((n) => learnCard(n, ctx, up)).join('')}</div></section>`;
  const nodes = all.map((n) => `<section class="node${n.kids.length ? '' : ' leaf'}" id="${escapeHtml(n.path)}" data-path="${escapeHtml(n.path)}" data-up="${escapeHtml(n.parents.at(-1)?.path ?? '')}" style="--tc:${n.accent}">`
    + `${crumbs(n)}<h2 tabindex="-1">${bi(n.title)} <small>${countStr('sims', n.items.length)}</small></h2>${n.blurb ? `<p class="n-blurb">${bi(n.blurb)}</p>` : ''}`
    + (n.kids.length
      ? `<div class="cards">${n.kids.map((k) => learnCard(k, ctx, up)).join('')}</div>`
      : `<div class="sims">${n.items.map((e) => learnSim(e, ctx, up)).join('')}</div>`)
    + '</section>');
  return [root, ...nodes].join('\n');
}
