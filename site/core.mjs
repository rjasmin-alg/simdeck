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
    courses: 'Kolegiji',
    search: 'Traži simulator… ( / )',
    noMatch: 'Ništa ne odgovara.',
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
  },
  en: {
    classes: { stepper: 'step by step', explorer: 'explorer', reference: 'reference', tool: 'tool' },
    levels: { intro: 'intro', core: 'core', advanced: 'advanced' },
    noneYet: 'No simulators published yet.',
    courseEmpty: 'The simulators for this course are in preparation.',
    courses: 'Courses',
    search: 'Find a simulator… ( / )',
    noMatch: 'Nothing matches.',
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
 * The link to a sim. `depth` is how many folders below the site root the linking page sits
 * (home: 0, courses/<id>/: 2). Links name index.html explicitly so they work from file://.
 */
export function entryHref(e, depth = 0, lang = null) {
  return `${'../'.repeat(depth)}${e.path}index.html${lang ? `?lang=${lang}` : ''}`;
}

/** The absolute URL a student would type, for printed course pages; ?lang= only when it is not the site's default. */
export function entryAbsUrl(e, site, lang = null) {
  return `${String(site.siteUrl ?? '').replace(/\/?$/, '/')}${e.path}${lang && lang !== (site.lang ?? 'hr') ? `?lang=${lang}` : ''}`;
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
 * both languages. Sim links carry ?lang= in the course's language; site/lang.js rewrites them when the visitor
 * switches. Returns { html, skipped }.
 */
export function renderCourse(course, ctx, depth = 0, drafts = false) {
  const byId = new Map(ctx.entries.map((e) => [e.id, e]));
  const lang = course.lang ?? ctx.site.lang ?? 'hr';
  const skipped = [];
  let n = 0;
  const sections = course.sections.map((s) => {
    const r = courseItems(s.sims ?? [], byId, drafts);
    skipped.push(...r.skipped);
    const lis = r.items.map((e) => {
      n += 1;
      const urls = LANGS.map((l) => ({ l, url: entryAbsUrl(e, ctx.site, l) }));
      return `<li value="${n}"><a data-lang-link href="${escapeHtml(entryHref(e, depth, lang))}">${bi(e.title)}</a>${langBadge(e)}
<span class="h-concept">${bi(e.concept)}</span>
<span class="h-summary">${bi(e.summary)}</span>
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

/**
 * The published home page's list: every public entry, grouped by topic, as static HTML. Each item
 * carries its folded search words in data-s for the page's one small filter script.
 */
export function renderIndexList(ctx, drafts = false) {
  const list = search(drafts ? ctx.entries : ctx.entries.filter(isPublic), ctx.vocab, '', {}, ctx.site?.lang ?? 'hr');
  if (!list.length) return `<p class="empty">${biStr('noneYet')}</p>`;
  return group(list, ctx.vocab)
    .map((g) => `<section><h2>${bi(g.label)}</h2><ul>${g.items.map((e) => {
      const f = searchFields(e, ctx.vocab);
      const words = [f.title, f.id, f.tags, f.topic, f.text].join(' ').replace(/\s+/g, ' ').trim();
      return `<li data-s="${escapeHtml(words)}"><a data-lang-link href="${escapeHtml(entryHref(e, 0))}">${bi(e.title)}</a>${langBadge(e)} <span>${bi(e.concept)}</span></li>`;
    }).join('')}</ul></section>`)
    .join('\n');
}
