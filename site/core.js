// Shared by the build (Node) and the admin app (served to the browser as a module). Pure functions
// only: no DOM, no Node APIs, no fetch. The published site gets HTML rendered from here, not this code.

export const STR = {
  classes: { stepper: 'korak po korak', explorer: 'istraživanje', reference: 'pregled', tool: 'alat' },
  levels: { intro: 'uvod', core: 'osnovno', advanced: 'napredno' },
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
 * The link to a sim. `depth` is how many folders below the site root the linking page sits
 * (home: 0, courses/<id>/: 2). Links name index.html explicitly so they work from file://.
 */
export function entryHref(e, depth = 0) {
  return `${'../'.repeat(depth)}${e.path}index.html`;
}

/** The absolute URL a student would type, for printed course pages. */
export function entryAbsUrl(e, site) {
  return `${String(site.siteUrl ?? '').replace(/\/?$/, '/')}${e.path}`;
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
    .map((c) => `location ~ ^/${c.short}/?$ { return 302 ${base}courses/${c.id}/; }  # ${c.title.replace(/\n/g, ' ')}`)
    .join('\n');
}

/** One searchable string per field, weighted in `search`. */
export function searchFields(e, vocab) {
  const tagWords = (e.tags ?? []).flatMap((t) => [t, vocab.tags?.[t]?.label ?? '', ...(vocab.tags?.[t]?.aliases ?? [])]);
  return {
    title: normalise(e.title),
    id: normalise(e.id),
    tags: normalise([...tagWords, ...(e.aliases ?? [])].join(' ')),
    topic: normalise(`${e.topic} ${vocab.topics?.[e.topic]?.label ?? ''}`),
    text: normalise(`${e.concept} ${e.summary}`),
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
    if (!e) skipped.push({ id, why: 'ne postoji' });
    else if (e.class === 'tool') skipped.push({ id, why: 'alat je samo za predavača' });
    else if (e.status !== 'ready' && !drafts) skipped.push({ id, why: 'u izradi' });
    else items.push(e);
  }
  return { items, skipped };
}

/**
 * The body of a course page, from a course file ({ title, term?, intro?, sections: [{ title?, sims }] }).
 * Returns { html, skipped }.
 */
export function renderCourse(course, ctx, depth = 0, drafts = false) {
  const byId = new Map(ctx.entries.map((e) => [e.id, e]));
  const skipped = [];
  let n = 0;
  const sections = course.sections.map((s) => {
    const r = courseItems(s.sims ?? [], byId, drafts);
    skipped.push(...r.skipped);
    const lis = r.items.map((e) => {
      n += 1;
      const lang = e.lang !== (course.lang ?? ctx.site.lang) ? ` <span class="h-lang">${escapeHtml(e.lang.toUpperCase())}</span>` : '';
      return `<li value="${n}"><a href="${escapeHtml(entryHref(e, depth))}">${escapeHtml(e.title)}</a>${lang}
<span class="h-concept">${escapeHtml(e.concept)}</span>
<span class="h-summary">${escapeHtml(e.summary)}</span>
<span class="h-url">${escapeHtml(entryAbsUrl(e, ctx.site))}</span></li>`;
    });
    if (!lis.length) return '';
    return `<section>${s.title ? `<h2>${escapeHtml(s.title)}</h2>` : ''}<ol>${lis.join('\n')}</ol></section>`;
  });
  const short = shortUrl(course, ctx.site);
  const html = `<header><h1>${escapeHtml(course.title)}</h1>${course.term ? `<p class="h-term">${escapeHtml(course.term)}</p>` : ''}${short ? `<p class="h-short">${escapeHtml(short.replace(/^https?:\/\//, ''))}</p>` : ''}${course.intro ? `<p class="h-intro">${escapeHtml(course.intro)}</p>` : ''}</header>
<main>${sections.join('\n')}</main>
<footer><p>${escapeHtml(ctx.site.title)} · ${escapeHtml(short ?? ctx.site.siteUrl ?? '')}</p></footer>`;
  return { html, skipped };
}

/**
 * The published home page's list: every public entry, grouped by topic, as static HTML. Each item
 * carries its folded search words in data-s for the page's one small filter script.
 */
export function renderIndexList(ctx) {
  const list = search(ctx.entries.filter(isPublic), ctx.vocab, '');
  return group(list, ctx.vocab)
    .map((g) => `<section><h2>${escapeHtml(g.label)}</h2><ul>${g.items.map((e) => {
      const f = searchFields(e, ctx.vocab);
      const words = [f.title, f.id, f.tags, f.topic, f.text].join(' ').replace(/\s+/g, ' ').trim();
      return `<li data-s="${escapeHtml(words)}"><a href="${escapeHtml(entryHref(e, 0))}">${escapeHtml(e.title)}</a> <span>${escapeHtml(e.concept)}</span></li>`;
    }).join('')}</ul></section>`)
    .join('\n');
}
