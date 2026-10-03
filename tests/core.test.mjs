// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalise, search, group, entryHref, presetItems, refMap, entryAbsUrl, shortUrl, shortLinkRules, renderCourse, courseItems, renderIndexList, isPublic, bi, loc,
  sourceHref, licenceLine, renderLicences, LICENCE, plural, countStr, topicAccent, TOPIC_ACCENTS, parseSet, setParam, setUrl, SET_MAX, renderTile, renderChips,
  STR } from '../site/core.mjs';

const two = (hr, en = hr) => ({ hr, en });
const vocab = {
  topics: { networks: { label: two('Računalne mreže', 'Computer networks') }, storage: { label: two('Pohrana', 'Storage') } },
  tags: { dns: { label: two('DNS'), aliases: ['resolver'] }, lvm: { label: two('LVM') }, partitioning: { label: two('particioniranje', 'partitioning'), aliases: ['gpt'] } },
};
// Titles may be plain strings in these samples: loc() and bi() read a string as the same text in both languages.
const e = (id, over) => ({
  id, class: 'stepper', status: 'ready', title: id, concept: '', summary: '', topic: 'networks',
  tags: ['dns'], level: 'intro', path: `sims/${id}/`, courses: [], ...over,
});
const entries = [
  e('dns', { title: two('DNS: razlučivanje imena', 'DNS: name resolution'), concept: two('Rekurzivni resolver', 'Recursive resolver'), courses: ['linux'] }),
  e('dhcp', { title: 'DHCP: DORA', summary: 'Klijent dobiva adresu od DNS-a? ne.', courses: ['linux'] }),
  e('parts', { title: two('Particioniranje diska', 'Disk partitioning'), topic: 'storage', tags: ['partitioning'], class: 'explorer' }),
  e('lvm', { title: 'LVM', topic: 'storage', tags: ['lvm'], languages: ['en'], class: 'explorer', courses: ['linux'] }),
  e('picker', { title: 'Odabir studenta', class: 'tool', topic: 'networks' }),
  e('wip', { title: 'Nedovršen DNS', status: 'wip' }),
];
const ids = (list) => list.map((x) => x.id);
const site = { title: 'simdeck', lang: 'hr', siteUrl: 'https://m.o/simdeck/' };

test('normalise folds case and Croatian diacritics', () => {
  assert.equal(normalise('Čvor ĐAK šuma Žica ć'), 'cvor dak suma zica c');
});

test('search: empty query returns everything in title order', () => {
  assert.equal(search(entries, vocab, '').length, entries.length);
});

test('search: every word must match (AND), across fields', () => {
  assert.deepEqual(ids(search(entries, vocab, 'dns')).slice(0, 1), ['dns']);
  assert.deepEqual(ids(search(entries, vocab, 'razlucivanje')), ['dns'], 'diacritics ignored');
  assert.deepEqual(ids(search(entries, vocab, 'gpt')), ['parts'], 'tag alias');
  assert.deepEqual(ids(search(entries, vocab, 'pohrana lvm')), ['lvm'], 'topic label + title');
  assert.deepEqual(ids(search(entries, vocab, 'dns zzz')), []);
});

test('search: a title hit outranks a summary hit', () => {
  const r = ids(search(entries, vocab, 'dns'));
  assert.ok(r.indexOf('dns') < r.indexOf('dhcp'));
});

test('search: filters combine', () => {
  assert.deepEqual(ids(search(entries, vocab, '', { course: 'linux' })), ['dhcp', 'dns', 'lvm']);
  assert.deepEqual(ids(search(entries, vocab, '', { tags: ['lvm'] })), ['lvm']);
  assert.deepEqual(ids(search(entries, vocab, '', { cls: 'tool' })), ['picker']);
  assert.deepEqual(ids(search(entries, vocab, '', { lang: 'hr' })).includes('lvm'), false, 'lang: pages that exist in it');
  assert.deepEqual(ids(search(entries, vocab, '', { lang: 'en' })).length, entries.length);
  assert.deepEqual(ids(search(entries, vocab, '', { topic: 'storage', level: 'intro' })), ['lvm', 'parts']);
});

test('search: either language finds a sim (titles, concepts, topic and tag labels)', () => {
  assert.deepEqual(ids(search(entries, vocab, 'name resolution')), ['dns']);
  assert.deepEqual(ids(search(entries, vocab, 'razlucivanje imena')), ['dns']);
  assert.deepEqual(ids(search(entries, vocab, 'storage partitioning')), ['parts']);
  assert.deepEqual(ids(search(entries, vocab, 'computer networks dhcp')), ['dhcp']);
  const a = e('al', { title: 'X', aliases: { hr: ['najam adrese'], en: ['lease'] } });
  assert.deepEqual(ids(search([a], vocab, 'lease')), ['al']);
  assert.deepEqual(ids(search([a], vocab, 'najam')), ['al']);
});

test('search: title order follows the given language', () => {
  const list = [e('a', { title: two('Zebra', 'Apple') }), e('b', { title: two('Avion', 'Zoo') })];
  assert.deepEqual(ids(search(list, vocab, '', {}, 'hr')), ['b', 'a']);
  assert.deepEqual(ids(search(list, vocab, '', {}, 'en')), ['a', 'b']);
});

test('bi writes both languages as [data-l] spans, once when they are the same; loc picks one', () => {
  assert.equal(bi(two('Mreža', 'Network')), '<span data-l="hr" lang="hr">Mreža</span><span data-l="en" lang="en">Network</span>');
  assert.equal(bi(two('DNS')), 'DNS');
  assert.equal(bi(two('<b>', '&')), '<span data-l="hr" lang="hr">&lt;b&gt;</span><span data-l="en" lang="en">&amp;</span>');
  assert.equal(loc(two('a', 'b'), 'en'), 'b');
  assert.equal(loc('same', 'en'), 'same');
});

test('search: natural title order', () => {
  const list = [e('a', { title: 'Sim 108' }), e('b', { title: 'Sim 24' })];
  assert.deepEqual(ids(search(list, vocab, '')), ['b', 'a']);
});

test('group by topic follows tags.json order and drops empty groups', () => {
  assert.deepEqual(group(search(entries, vocab, 'lvm'), vocab).map((x) => x.key), ['storage']);
  assert.deepEqual(group(entries, vocab).map((x) => x.key), ['networks', 'storage']);
});

test('links are relative with explicit index.html; printed URLs are absolute', () => {
  assert.equal(entryHref(entries[0], 0), 'sims/dns/index.html');
  assert.equal(entryHref(entries[0], 2), '../../sims/dns/index.html');
  assert.equal(entryHref(entries[0], 2, 'en'), '../../sims/dns/index.html?lang=en');
  assert.equal(entryAbsUrl(entries[0], site), 'https://m.o/simdeck/sims/dns/');
  assert.equal(entryAbsUrl(entries[0], site, 'hr'), 'https://m.o/simdeck/sims/dns/', 'the site default needs no ?lang=');
  assert.equal(entryAbsUrl(entries[0], site, 'en'), 'https://m.o/simdeck/sims/dns/?lang=en');
});

test('short addresses: URL and one nginx rule per course that has one', () => {
  const courses = [{ id: 'linux-essentials', title: two('Linux'), short: 'linux' }, { id: 'os', title: two('OS') }];
  assert.equal(shortUrl(courses[0], site), 'https://m.o/linux');
  assert.equal(shortUrl(courses[1], site), null);
  assert.equal(shortLinkRules(courses, site), 'location ~ ^/linux/?$ { return 302 /simdeck/courses/linux-essentials/; }  # Linux');
});

test('course pages leave out tools, unfinished and unknown ids, and say why', () => {
  const byId = new Map(entries.map((x) => [x.id, x]));
  const r = courseItems(['dns', 'picker', 'wip', 'nope'], byId);
  assert.deepEqual(ids(r.items), ['dns']);
  assert.deepEqual(r.skipped.map((s) => s.id), ['picker', 'wip', 'nope']);
});

test('renderCourse numbers items across sections, escapes text, shows the short address', () => {
  const course = { title: two('Linux <Essentials>'), short: 'linux', sections: [{ title: two('Mreža', 'Networking'), sims: ['dns', 'dhcp'] }, { title: two('Diskovi', 'Disks'), sims: ['lvm', 'picker'] }] };
  const { html, skipped } = renderCourse(course, { site, entries }, 2);
  assert.match(html, /Linux &lt;Essentials&gt;/);
  assert.match(html, /<li value="3"><a data-lang-link href="\.\.\/\.\.\/sims\/lvm\/index.html\?lang=hr">LVM<\/a>/);
  assert.match(html, /href="\.\.\/\.\.\/sims\/dns\/index.html\?lang=hr"/);
  assert.match(html, /m\.o\/linux/);
  assert.deepEqual(skipped.map((s) => s.id), ['picker']);
});

test('course pages: both languages, sims linked in the course language, a badge on single-language sims', () => {
  const course = { title: two('Mreže', 'Networks'), lang: 'en', intro: two('Uvod.', 'Intro.'), sections: [{ title: two('Prvo', 'First'), sims: ['dns', 'lvm'] }] };
  const { html } = renderCourse(course, { site, entries }, 2);
  for (const t of ['Mreže', 'Networks', 'Uvod.', 'Intro.', 'Prvo', 'First', 'DNS: razlučivanje imena', 'DNS: name resolution']) assert.ok(html.includes(t), t);
  assert.match(html, /sims\/dns\/index.html\?lang=en"/, 'links carry the course language');
  // lvm is English only: on the Croatian view it gets an EN badge, on the English view none.
  assert.match(html, /LVM<\/a> <span class="h-lang" data-l="hr" lang="hr"[^>]*>EN<\/span>/);
  assert.doesNotMatch(html, /data-l="en" lang="en" title/);
  assert.match(html, /https:\/\/m\.o\/simdeck\/sims\/dns\/\?lang=en/, 'printed URL in English names the language');
});

test('the home list shows finished entries only, as tiles on one shelf per topic, with folded search words', () => {
  const html = renderIndexList({ site, vocab, entries });
  assert.ok(!html.includes('Nedovršen'), 'wip left out');
  assert.match(html, /Odabir studenta/, 'tools are listed on the home page');
  assert.ok(html.indexOf('Računalne mreže') < html.indexOf('Pohrana'), 'tags.json topic order');
  assert.match(html, /<section class="topic" id="t-storage" data-topic="storage" style="--tc:var\(--c3\)"><h2><span class="dot"><\/span><span class="t-topic"><span data-l="hr" lang="hr">Pohrana<\/span><span data-l="en" lang="en">Storage<\/span><\/span> <small>2<\/small><\/h2>/, 'topic labels in both, with the count');
  assert.match(html, /data-s="[^"]*name resolution/, 'both languages are searchable');
  assert.match(html, /data-s="[^"]*razlucivanje/, 'diacritics folded in search words');
  assert.equal((html.match(/<article class="tile" /g) ?? []).length, 5);
  assert.equal(isPublic(entries[5]), false);
});

test('a tile: what the selection, the lecture view and the handout read from it, and a placeholder without a thumbnail', () => {
  const dns = entries[0];
  const t = renderTile(dns, { site, vocab }, 0);
  assert.match(t, /^<article class="tile" data-id="dns" data-class="stepper" data-topic="networks" data-url="https:\/\/m\.o\/simdeck\/sims\/dns\/" data-s="[^"]+" style="--tc:var\(--c1\)">/);
  assert.match(t, /<a class="tile-link" data-lang-link href="sims\/dns\/index.html"><span class="pic"><span class="ph" aria-hidden="true">D<\/span><\/span>/);
  assert.match(t, /<h3 class="t-title"><span data-l="hr" lang="hr">DNS: razlučivanje imena<\/span>/);
  assert.match(t, /<span class="t-concept"><span data-l="hr" lang="hr">Rekurzivni resolver/);
  assert.match(t, /<span class="t-summary" hidden>/, 'the summary is there for the handout, not shown');
  assert.match(t, /<button type="button" class="pick" data-pick="dns" aria-pressed="false">/);
  assert.doesNotMatch(t, /class="presets"/, 'no presets, no chip list');
  const withThumb = renderTile(dns, { site, vocab, thumbs: new Set(['dns']) }, 0);
  assert.match(withThumb, /<img src="thumbs\/dns-light\.webp" alt="" width="560" height="350">/, 'the first tiles load at once');
  assert.match(renderTile(dns, { site, vocab, thumbs: new Set(['dns']) }, 12), /<img [^>]*loading="lazy">/, 'the rest lazily');
  assert.match(renderTile(entries[3], { site, vocab }), /<h3 class="t-title">LVM <span class="h-lang" data-l="hr"/, 'single-language badge');
  assert.match(renderTile(entries[0], { site, vocab }), /korak po korak<\/span><span data-l="en" lang="en">step by step/);
  assert.match(renderTile({ ...entries[0], steps: 12 }, { site, vocab }), /12 koraka<\/span><span data-l="en" lang="en">12 steps/, 'a stepper says how many steps');
});

test('topic chips: one per shelf, in its colour, with its count', () => {
  const groups = group(entries.filter(isPublic), vocab);
  const html = renderChips(groups, vocab);
  assert.equal(html, '<a class="chip" href="#t-networks" data-chip="networks" style="--tc:var(--c1)"><span class="dot"></span><span data-l="hr" lang="hr">Računalne mreže</span><span data-l="en" lang="en">Computer networks</span> <small>3</small></a>'
    + '<a class="chip" href="#t-storage" data-chip="storage" style="--tc:var(--c3)"><span class="dot"></span><span data-l="hr" lang="hr">Pohrana</span><span data-l="en" lang="en">Storage</span> <small>2</small></a>');
});

test('topic accents: the kit\'s eight series colours; an unlisted topic takes its place in tags.json', () => {
  assert.equal(topicAccent('networks', vocab), 'var(--c1)');
  assert.equal(topicAccent('classroom', vocab), 'var(--c8)');
  assert.ok(Object.values(TOPIC_ACCENTS).every((n) => n >= 1 && n <= 8));
  const v = { topics: Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'new'].map((k) => [k, {}])) };
  assert.equal(topicAccent('new', v), 'var(--c2)', 'tenth topic: round the eight');
  assert.equal(topicAccent('unknown', v), 'var(--c1)');
});

test('plural forms: Croatian 1 / 2–4 / 5+ (11–14 are "many"), English 1 / other', () => {
  const hr = ['simulator', 'simulatora', 'simulatora'];
  const f = ['one', 'few', 'many'];
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 0].map((n) => plural('hr', n, f)),
    ['one', 'few', 'few', 'many', 'many', 'many', 'many', 'one', 'few', 'many', 'one', 'many', 'many']);
  assert.deepEqual([0, 1, 2].map((n) => plural('en', n, ['one', 'other'])), ['other', 'one', 'other']);
  assert.equal(countStr('sims', 21), '<span data-l="hr" lang="hr">21 simulator</span><span data-l="en" lang="en">21 simulators</span>');
  assert.equal(plural('hr', 38, hr), 'simulatora');
  for (const l of ['hr', 'en']) for (const k of ['sims', 'topicsN', 'stepsN']) assert.equal(STR[l][k].length, l === 'hr' ? 3 : 2, `${l} ${k}`);
});

test('set links: order kept, repeats dropped, unknown ids named, at most 30; "host:preset" is a course file\'s "host#preset"', () => {
  const known = refMap([stp, ...entries]);
  assert.deepEqual(parseSet('dns,stp:broadcast-storm,lvm', known), { items: ['dns', 'stp#broadcast-storm', 'lvm'], skipped: [] });
  assert.deepEqual(parseSet('lvm,dns,lvm, dns ,,', known), { items: ['lvm', 'dns'], skipped: [] }, 'repeats and blanks dropped');
  assert.deepEqual(parseSet('nope,dns,stp:nope', known), { items: ['dns'], skipped: ['nope', 'stp#nope'] });
  assert.deepEqual(parseSet('', known), { items: [], skipped: [] });
  assert.deepEqual(parseSet(null, known), { items: [], skipped: [] });
  const many = new Set(Array.from({ length: 40 }, (_, i) => `s${i}`));
  assert.equal(parseSet([...many].join(','), many).items.length, SET_MAX);
  assert.equal(SET_MAX, 30);
  assert.equal(setParam(['dns', 'stp#broadcast-storm']), 'dns,stp:broadcast-storm');
  assert.deepEqual(parseSet(setParam(['stp#belady', 'dns']), known).items, ['stp#belady', 'dns'], 'round trip');
  assert.equal(setUrl(['dns', 'stp#belady'], site), 'https://m.o/simdeck/?set=dns,stp:belady');
  assert.equal(setUrl(['dns'], { siteUrl: 'https://m.o/simdeck' }), 'https://m.o/simdeck/?set=dns');
});

test('empty states: no finished sims on the home page, none on a course page', () => {
  const wip = entries.map((x) => ({ ...x, status: 'wip' }));
  assert.match(renderIndexList({ site, vocab, entries: wip }), /class="empty"><span data-l="hr" lang="hr">Još nema objavljenih simulatora.<\/span><span data-l="en" lang="en">No simulators published yet./);
  const course = { title: two('Linux'), sections: [{ title: two('Mreža', 'Networking'), sims: ['dns'] }] };
  const r = renderCourse(course, { site, entries: wip }, 2);
  assert.match(r.html, /<main><p class="h-empty"><span data-l="hr" lang="hr">Simulatori za ovaj kolegij su u pripremi/);
  assert.doesNotMatch(r.html, /<h2>/, 'no empty section headings');
  assert.match(renderCourse(course, { site, entries: wip }, 2, true).html, /sims\/dns\/index.html/, 'drafts preview shows them');
  assert.match(renderIndexList({ site, vocab, entries: wip }, true), /sims\/dns\/index.html/, 'on the home page too');
});

test('source link (AGPL §13): the archive next to the site by default, relative to the page; a public repo as is', () => {
  assert.equal(sourceHref({}, 0), 'source.tar.gz');
  assert.equal(sourceHref({ source: 'source.tar.gz' }, 2), '../../source.tar.gz');
  assert.equal(sourceHref({ source: 'https://git.example/simdeck' }, 2), 'https://git.example/simdeck');
  const line = licenceLine(site, 2);
  assert.match(line, /href="\.\.\/\.\.\/licences\/AGPL-3\.0\.txt">AGPL-3\.0-or-later</);
  assert.match(line, /href="\.\.\/\.\.\/source\.tar\.gz"><span data-l="hr" lang="hr">Izvorni kod<\/span><span data-l="en" lang="en">Source code<\/span>/);
  assert.match(line, /data-lang-link href="\.\.\/\.\.\/licences\/index\.html"/);
  assert.equal(LICENCE, 'AGPL-3.0-or-later');
});

test('every course page carries the licence line', () => {
  const { html } = renderCourse({ title: 'L', sections: [{ sims: ['dns'] }] }, { site, vocab, entries }, 2);
  assert.match(html, /<footer>[\s\S]*class="h-licence"[\s\S]*\.\.\/\.\.\/source\.tar\.gz/);
});

test('licences page: simdeck, the kit fonts, then each sim\'s credits in both languages', () => {
  const credited = e('cc', {
    title: two('Antene', 'Antennas'),
    credits: [{ what: two('Slika dipola', 'Dipole figure'), by: 'DARC e.V.', licence: 'CC BY 4.0', url: 'https://50ohm.de/', changes: two('Prevedeno.', 'Translated.') }],
  });
  const html = renderLicences({ site, vocab, entries: [...entries, credited] }, 1);
  assert.match(html, /href="\.\.\/licences\/AGPL-3\.0\.txt">AGPL-3\.0-or-later/);
  assert.match(html, /href="\.\.\/source\.tar\.gz"/);
  assert.match(html, /Atkinson Hyperlegible[\s\S]*OFL-1\.1 \(<a href="\.\.\/licences\/OFL-1\.1\.txt">/);
  assert.match(html, /href="\.\.\/sims\/cc\/index\.html"><span data-l="hr" lang="hr">Antene/);
  assert.match(html, /<a href="https:\/\/50ohm\.de\/"><span data-l="hr" lang="hr">Slika dipola<\/span><span data-l="en" lang="en">Dipole figure<\/span><\/a> · DARC e\.V\. · CC BY 4\.0/);
  assert.match(html, /Translated\./);
  assert.match(renderLicences({ site, vocab, entries }, 1), /class="h-empty"/, 'no credits: says so');
});

// ── preset entries (sim.json "entries"): their own line on the home page, "<sim>#<preset>" on course pages ──
const stp = e('stp', {
  title: 'STP', concept: two('Stablo bez petlji', 'A loop-free tree'), summary: two('Sklopke biraju korijen.', 'Switches elect a root.'),
  entries: [
    { preset: 'broadcast-storm', title: two('Oluja razašiljanja', 'Broadcast storm'), concept: two('Petlja bez STP-a', 'A loop without STP') },
    { preset: 'belady', query: 'scenario=fifo-belady', title: 'Belady', concept: 'FIFO', summary: two('Više okvira.', 'More frames.') },
  ],
});

test('preset entries: links open the preset (kit ?preset=, or the entry\'s own query), with ?lang= after it', () => {
  const [storm, belady] = presetItems(stp);
  assert.equal(storm.id, 'stp#broadcast-storm');
  assert.equal(storm.host, stp);
  assert.equal(entryHref(storm, 0), 'sims/stp/index.html?preset=broadcast-storm');
  assert.equal(entryHref(storm, 2, 'en'), '../../sims/stp/index.html?preset=broadcast-storm&lang=en');
  assert.equal(entryHref(belady, 0), 'sims/stp/index.html?scenario=fifo-belady');
  assert.equal(entryAbsUrl(storm, site, 'hr'), 'https://m.o/simdeck/sims/stp/?preset=broadcast-storm');
  assert.equal(entryAbsUrl(belady, site, 'en'), 'https://m.o/simdeck/sims/stp/?scenario=fifo-belady&lang=en');
  assert.deepEqual([...refMap([stp, entries[0]]).keys()], ['stp', 'stp#broadcast-storm', 'stp#belady', 'dns']);
  assert.deepEqual(presetItems({ ...stp, entries: [null, { title: 'x' }] }), [], 'malformed items are left to the manifest check');
});

test('preset entries: chips on their sim\'s tile, two shown and "+N" for the rest, each with its link, words and +', () => {
  const four = { ...stp, entries: [...stp.entries, { preset: 'p3', title: 'Treći', concept: 'c' }, { preset: 'p4', title: 'Četvrti', concept: 'c' }] };
  const html = renderIndexList({ site, vocab, entries: [four, entries[0]] });
  const tile = html.match(/<article class="tile" data-id="stp"[^]*?<\/article>/)[0];
  const chips = tile.match(/<li class="preset[^"]*"[^>]*>.*?<\/li>/g);
  assert.equal(chips.length, 4);
  assert.match(chips[0], /^<li class="preset" data-id="stp#broadcast-storm" data-class="stepper" data-topic="networks" data-url="https:\/\/m\.o\/simdeck\/sims\/stp\/\?preset=broadcast-storm" data-s="[^"]*oluja razasiljanja[^"]*broadcast storm/);
  assert.match(chips[0], /data-s="[^"]*petlja bez stp-a/, 'its concept');
  assert.match(chips[0], /<a data-lang-link href="sims\/stp\/index.html\?preset=broadcast-storm" class="t-title">/);
  assert.match(chips[0], /<button type="button" class="pick pick-sm" data-pick="stp#broadcast-storm"/);
  assert.match(chips[1], /href="sims\/stp\/index.html\?scenario=fifo-belady"/, 'the entry\'s own query');
  assert.match(chips[1], /<span class="t-summary" hidden><span data-l="hr" lang="hr">Više okvira\./);
  assert.match(chips[2], /^<li class="preset more"/, 'the third and later are behind "+N"');
  assert.match(tile, /<li class="more-btn"><button type="button" data-more>\+2<\/button><\/li>/);
  assert.doesNotMatch(renderIndexList({ site, vocab, entries: [stp] }), /more-btn/, 'two presets: no "+N"');
  // The tile's own words are its own: the page script matches a chip by its words with the tile's.
  assert.doesNotMatch(tile.match(/^<article[^>]*>/)[0], /oluja/);
  const wip = renderIndexList({ site, vocab, entries: [{ ...stp, status: 'wip' }] });
  assert.doesNotMatch(wip, /preset=/, 'an unfinished sim\'s entries are not published either');
});

test('preset entries on a course page: linked at the preset in the course language, the sim named first', () => {
  const course = { title: two('Mreže'), lang: 'en', sections: [{ sims: ['stp#broadcast-storm', 'stp', 'stp#belady'] }] };
  const { html, skipped } = renderCourse(course, { site, entries: [stp] }, 2);
  assert.deepEqual(skipped, []);
  assert.match(html, /<li value="1" class="h-preset"><span class="h-host">STP ›<\/span> <a data-lang-link href="\.\.\/\.\.\/sims\/stp\/index.html\?preset=broadcast-storm&amp;lang=en">/);
  assert.match(html, /<li value="2"><a data-lang-link href="\.\.\/\.\.\/sims\/stp\/index.html\?lang=en">STP<\/a>/);
  assert.match(html, /sims\/stp\/index.html\?scenario=fifo-belady&amp;lang=en/);
  assert.match(html, /https:\/\/m\.o\/simdeck\/sims\/stp\/\?preset=broadcast-storm&amp;lang=en/, 'printed URL opens the preset');
  // An entry without a summary has no summary line; one with a summary shows it.
  const one = html.split('<li ').find((l) => l.includes('preset=broadcast-storm'));
  assert.doesNotMatch(one, /h-summary/);
  assert.match(html, /More frames\./);
  assert.deepEqual(renderCourse({ ...course, sections: [{ sims: ['stp#nope'] }] }, { site, entries: [stp] }, 2).skipped, [{ id: 'stp#nope', why: 'unknown' }]);
});
