// Shared by the build (Node) and the browser pages (inlined by scripts/build.mjs, which strips the
// `export` keywords). Pure functions only: no DOM, no Node APIs, no fetch, so everything also works
// from file://.

export const STR = {
  classes: { stepper: 'korak po korak', explorer: 'istraživanje', reference: 'pregled', tool: 'alat' },
  levels: { intro: 'uvod', core: 'osnovno', advanced: 'napredno' },
  steps: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'korak' : 'koraka'}`,
  wip: 'u izradi',
  linked: 'vanjska',
  noCourse: 'Nije ni na jednom kolegiju',
  linkedNote: 'Stranice označene s ↗ nalaze se u zasebnim projektima i mogu tražiti zasebnu prijavu.',
};

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
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
 * The link to an entry. `depth` is how many folders below the site root the linking page sits
 * (index: 0, courses/x.html: 1). Native links name index.html explicitly so they work from file://.
 */
export function entryHref(e, site, depth = 0) {
  if (e.kind === 'native') return `${'../'.repeat(depth)}${e.path}index.html`;
  const base = /^https:\/\//.test(e.url) ? '' : String(site.linkedBase ?? '').replace(/\/$/, '');
  const url = base + e.url;
  return e.scenario ? `${url}${url.includes('?') ? '&' : '?'}scenario=${encodeURIComponent(e.scenario)}` : url;
}

/** The absolute URL a student would type, for printed handouts. */
export function entryAbsUrl(e, site) {
  if (e.kind === 'native') return `${String(site.siteUrl ?? '').replace(/\/?$/, '/')}${e.path}`;
  return entryHref(e, site);
}

/** One searchable string per field, weighted in `search`. */
export function searchFields(e, vocab) {
  const tagWords = (e.tags ?? []).flatMap((t) => [t, vocab.tags?.[t]?.label ?? '', ...(vocab.tags?.[t]?.aliases ?? [])]);
  return {
    title: normalise(e.title),
    id: normalise(e.id),
    tags: normalise([...tagWords, ...(e.aliases ?? [])].join(' ')),
    topic: normalise(`${e.topic} ${vocab.topics?.[e.topic]?.label ?? ''}`),
    text: normalise(`${e.concept} ${e.summary} ${e.origin ?? ''}`),
  };
}

/**
 * Filters and ranks entries. Every query word must match somewhere (AND); ranking prefers title
 * hits, then tags and aliases, then the rest. Ties keep title order, so the list is stable.
 * filters: { tags: [..] (all required), topic, level, cls, course, lang }
 */
export function search(entries, vocab, query, filters = {}) {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  const out = [];
  for (const e of entries) {
    if (filters.tags?.length && !filters.tags.every((t) => e.tags.includes(t))) continue;
    if (filters.topic && e.topic !== filters.topic) continue;
    if (filters.level && e.level !== filters.level) continue;
    if (filters.cls && e.class !== filters.cls) continue;
    if (filters.lang && e.lang !== filters.lang) continue;
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
  out.sort((a, b) => b.score - a.score || natural(a.e.title, b.e.title) || cmp(a.e.id, b.e.id));
  return out.map((x) => x.e);
}

// "Simulator 24" before "Simulator 108"; diacritics folded so the order is the same in every locale.
function natural(a, b) {
  return normalise(a).localeCompare(normalise(b), 'en', { numeric: true });
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Groups an already ranked list. by: 'topic' | 'course' | 'none'. Groups follow tags.json order
 * (topics) or course title order; an entry on several courses appears under each. Within a group
 * the ranking from `search` is kept.
 */
export function group(list, by, vocab, courses) {
  if (by === 'topic') {
    return Object.keys(vocab.topics ?? {})
      .map((t) => ({ key: t, label: vocab.topics[t].label, items: list.filter((e) => e.topic === t) }))
      .filter((g) => g.items.length);
  }
  if (by === 'course') {
    const groups = [...courses]
      .sort((a, b) => natural(a.title, b.title) || cmp(a.id, b.id))
      .map((c) => ({ key: c.id, label: c.title, items: list.filter((e) => (e.courses ?? []).includes(c.id)) }));
    groups.push({ key: '', label: STR.noCourse, items: list.filter((e) => !(e.courses ?? []).length) });
    return groups.filter((g) => g.items.length);
  }
  return [{ key: '', label: '', items: list }];
}

/** Splits requested ids into what a student handout may show, and why the rest was left out. */
export function handoutItems(ids, byId) {
  const items = [];
  const skipped = [];
  for (const id of ids) {
    const e = byId.get(id);
    if (!e) skipped.push({ id, why: 'ne postoji' });
    else if (e.class === 'tool') skipped.push({ id, why: 'alat je samo za predavača' });
    else if (e.status !== 'ready') skipped.push({ id, why: 'u izradi' });
    else items.push(e);
  }
  return { items, skipped };
}

/**
 * The body of a one-page student handout: a course file, or an ad-hoc selection shaped like one
 * ({ title, term?, intro?, sections: [{ title?, sims: [ids] }] }). Returns { html, skipped }.
 */
export function renderHandout(course, ctx, depth = 0) {
  const byId = new Map(ctx.entries.map((e) => [e.id, e]));
  const skipped = [];
  let anyLinked = false;
  let n = 0;
  const sections = course.sections.map((s) => {
    const r = handoutItems(s.sims ?? [], byId);
    skipped.push(...r.skipped);
    const lis = r.items.map((e) => {
      n += 1;
      if (e.kind === 'linked') anyLinked = true;
      const lang = e.lang !== (course.lang ?? ctx.site.lang) ? ` <span class="h-lang">${escapeHtml(e.lang.toUpperCase())}</span>` : '';
      return `<li value="${n}"><a href="${escapeHtml(entryHref(e, ctx.site, depth))}">${escapeHtml(e.title)}</a>${e.kind === 'linked' ? ' ↗' : ''}${lang}
<span class="h-concept">${escapeHtml(e.concept)}</span>
<span class="h-summary">${escapeHtml(e.summary)}</span>
<span class="h-url">${escapeHtml(entryAbsUrl(e, ctx.site))}</span></li>`;
    });
    if (!lis.length) return '';
    return `<section>${s.title ? `<h2>${escapeHtml(s.title)}</h2>` : ''}<ol>${lis.join('\n')}</ol></section>`;
  });
  const html = `<header><h1>${escapeHtml(course.title)}</h1>${course.term ? `<p class="h-term">${escapeHtml(course.term)}</p>` : ''}${course.intro ? `<p class="h-intro">${escapeHtml(course.intro)}</p>` : ''}</header>
<main>${sections.join('\n')}</main>
<footer>${anyLinked ? `<p>${escapeHtml(STR.linkedNote)}</p>` : ''}<p>${escapeHtml(ctx.site.title)} · ${escapeHtml(ctx.site.siteUrl ?? '')}</p></footer>`;
  return { html, skipped };
}
