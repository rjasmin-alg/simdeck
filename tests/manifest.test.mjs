// SPDX-License-Identifier: AGPL-3.0-or-later
// Every manifest rule gets a sample that must fail, so a check that silently passes is caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, loadRepo } from '../lib/manifest.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const two = (hr, en = hr) => ({ hr, en });
const vocab = {
  topics: { networks: { label: two('Mreže', 'Networks') }, storage: { label: two('Pohrana', 'Storage') } },
  tags: { dns: { label: two('DNS') }, lvm: { label: two('LVM') } },
};
const nativeJson = (over = {}) => ({
  id: 'dns-x', class: 'stepper', status: 'ready', title: two('DNS'), concept: two('Razlučivanje', 'Resolution'),
  summary: two('Kratko.', 'Short.'), topic: 'networks', tags: ['dns'], level: 'intro', steps: 4, ...over,
});
const html = (lang = 'hr') => `<!doctype html><html lang="${lang}"><head></head><body></body></html>`;

function repo({ natives, courses, site = {}, vocab: v = vocab } = {}) {
  const n = natives ?? [nativeJson(), nativeJson({ id: 'lvm-x', class: 'explorer', steps: undefined, topic: 'storage', tags: ['lvm'], languages: ['en'] })];
  return {
    site,
    vocab: v,
    natives: n.map((json) => ({ dir: json.id, json, html: html(json.languages?.[0] ?? 'hr'), files: ['sim.json', 'index.html'], hasManifest: true })),
    courses: (courses ?? []).map((json) => ({ file: `${json.id}.json`, json })),
  };
}
const errorsOf = (r) => validate(r).errors.join('\n');

test('a valid repo has no errors', () => {
  const r = validate(repo({ courses: [{ id: 'linux', title: two('Linux'), sections: [{ sims: ['dns-x', 'lvm-x'] }] }] }));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.entries.map((e) => e.id), ['dns-x', 'lvm-x']);
  assert.equal(r.entries[0].path, 'sims/dns-x/');
  assert.deepEqual(r.entries[0].courses, ['linux'], 'courses are derived from the course files');
});

test('the real repository validates', () => {
  const r = validate(loadRepo(ROOT));
  assert.deepEqual(r.errors, []);
  assert.ok(r.entries.length > 0);
});

const bad = [
  ['missing field', [nativeJson({ summary: undefined })], /missing required field "summary"/],
  ['unknown field', [nativeJson({ sumary: 'x' })], /unknown field "sumary"/],
  ['a field from the old linked kind (simdeck copies, never links out)', [nativeJson({ url: '/x' })], /unknown field "url"/],
  ['id not kebab', [nativeJson({ id: 'Dns_X' })], /not kebab-case/],
  ['bad class', [nativeJson({ class: 'game' })], /"class" must be one of/],
  ['bad level', [nativeJson({ level: 'hard' })], /"level" must be one of/],
  ['bad status', [nativeJson({ status: 'done' })], /"status" must be one of/],
  ['lang is gone: a page has both languages, or declares "languages"', [nativeJson({ lang: 'hr' })], /unknown field "lang"/],
  ['title in one language only', [nativeJson({ title: 'DNS' })], /"title" must be \{ "hr"/],
  ['concept missing its English', [nativeJson({ concept: { hr: 'Razlučivanje' } })], /"concept.en" must be a non-empty string/],
  ['summary with an empty Croatian', [nativeJson({ summary: { hr: ' ', en: 'Short.' } })], /"summary.hr" must be a non-empty string/],
  ['a third language', [nativeJson({ title: { hr: 'DNS', en: 'DNS', de: 'DNS' } })], /"title" has unknown language "de"/],
  ['languages listing both (leave it out)', [nativeJson({ languages: ['hr', 'en'] })], /single-language exception/],
  ['languages with an unknown language', [nativeJson({ languages: ['de'] })], /single-language exception/],
  ['aliases as a flat list', [nativeJson({ aliases: ['lease'] })], /"aliases" must be \{ "hr": \[\.\.\.\], "en": \[\.\.\.\] \}/],
  ['aliases in an unknown language', [nativeJson({ aliases: { de: ['x'] } })], /"aliases" has unknown language "de"/],
  ['aliases with an empty word', [nativeJson({ aliases: { en: [''] } })], /"aliases.en" must be an array/],
  ['unknown topic', [nativeJson({ topic: 'cooking' })], /topic "cooking" is not in tags.json/],
  ['unknown tag', [nativeJson({ tags: ['dns', 'backups'] })], /tag "backups" is not in tags.json/],
  ['no tags', [nativeJson({ tags: [] })], /at least one tag/],
  ['duplicate tag', [nativeJson({ tags: ['dns', 'dns'] })], /duplicate tags/],
  ['summary too long in one language', [nativeJson({ summary: { hr: 'Kratko.', en: 'x'.repeat(161) } })], /"summary.en" is 161 chars/],
  ['title too long in Croatian (it runs longer)', [nativeJson({ title: { hr: 'x'.repeat(61), en: 'DNS' } })], /"title.hr" is 61 chars, max 60/],
  ['stepper without steps', [nativeJson({ steps: undefined })], /needs "steps"/],
  ['steps on an explorer', [nativeJson({ class: 'explorer' })], /only for steppers/],
  ['exceptions in sim.json (they live in the page, as the kit declares them)', [nativeJson({ exceptions: [] })], /unknown field "exceptions"/],
  ['related id missing', [nativeJson({ related: ['nope'] })], /related id "nope" does not exist/],
];
for (const [name, natives, re] of bad) {
  test(`rejects: ${name}`, () => assert.match(errorsOf(repo({ natives })), re));
}

test('rejects: native id differs from folder', () => {
  const r = repo();
  r.natives[0].dir = 'other';
  assert.match(errorsOf(r), /must equal the folder name "other"/);
});
test('rejects: folder without sim.json', () => {
  const r = repo();
  r.natives[0].hasManifest = false;
  assert.match(errorsOf(r), /folder has no sim.json/);
});
test('rejects: missing index.html', () => {
  const r = repo();
  r.natives[0].html = null;
  assert.match(errorsOf(r), /missing index.html/);
});
test('html lang: any of the page\'s languages; a single-language page must say its own', () => {
  const r = repo();
  r.natives[0].html = html('en');
  assert.deepEqual(validate(r).errors, [], 'a bilingual page may default to English');
  r.natives[1].html = html('hr');
  assert.match(errorsOf(r), /<html lang="hr"> must be one of the page's languages \(en\)/);
});
test('the single-language exception is counted as a warning', () => {
  assert.match(validate(repo()).warnings.join('\n'), /lvm-x: only in en \(single-language exception\)/);
});
test('rejects: tags.json labels in one language', () => {
  const v = { ...vocab, tags: { ...vocab.tags, dns: { label: 'DNS' } } };
  assert.match(errorsOf(repo({ vocab: v })), /tags.json: "tags.dns.label" must be \{ "hr"/);
  const t = { ...vocab, topics: { ...vocab.topics, storage: { label: { hr: 'Pohrana' } } } };
  assert.match(errorsOf(repo({ vocab: t })), /tags.json: "topics.storage.label.en" must be a non-empty string/);
});
test('rejects: duplicate id', () => {
  const r = repo();
  r.natives[1].json = { ...r.natives[0].json };
  assert.match(errorsOf(r), /duplicate id "dns-x"/);
});

test('page checks: data-sim must equal the id; exceptions block well formed and counted; stale meta warned', () => {
  const r = repo();
  r.natives[0].html = '<html lang="hr" data-sim="proto"><head></head></html>';
  assert.match(errorsOf(r), /data-sim="proto"> must equal the id "dns-x"/);
  r.natives[0].html = '<html lang="hr"><head><script type="application/json" id="simdeck-exceptions">[{"rule":"fit"}]</script></head></html>';
  assert.match(errorsOf(r), /#simdeck-exceptions must be/);
  r.natives[0].html = '<html lang="hr" data-sim="dns-x"><head><script type="application/json" id="simdeck-exceptions">[{"rule":"one-screen","why":"poster"}]</script>'
    + '<script type="application/json" id="simdeck-meta">{"id":"dns-x","class":"stepper","steps":16,"title":{"hr":"DNS","en":"Old"}}</script></head></html>';
  const v = validate(r);
  assert.deepEqual(v.errors, []);
  assert.match(v.warnings.join('\n'), /1 declared contract exception/);
  assert.match(v.warnings.join('\n'), /#simdeck-meta steps is 16, sim.json says 4/);
  assert.match(v.warnings.join('\n'), /#simdeck-meta title is .*Old/);
  for (const [rule, msg] of [['fit', /unknown rule "fit"/], ['scope', /rule "scope" cannot be waived/]]) {
    r.natives[0].html = `<html lang="hr"><head><script type="application/json" id="simdeck-exceptions">[{"rule":"${rule}","why":"x"}]</script></head></html>`;
    assert.match(errorsOf(r), msg);
  }
});

const course = (over) => ({ id: 'linux', title: two('Linux'), sections: [{ sims: ['dns-x'] }], ...over });
test('rejects: course text in one language', () => {
  assert.match(errorsOf(repo({ courses: [course({ title: 'Linux' })] })), /"title" must be \{ "hr"/);
  assert.match(errorsOf(repo({ courses: [course({ intro: { hr: 'Uvod.' } })] })), /"intro.en" must be a non-empty string/);
  assert.match(errorsOf(repo({ courses: [course({ term: 'Zima' })] })), /"term" must be/);
  assert.match(errorsOf(repo({ courses: [course({ sections: [{ title: 'Mreža', sims: ['dns-x'] }] })] })), /"sections\[0\].title" must be/);
  assert.match(errorsOf(repo({ courses: [course({ lang: 'de' })] })), /"lang" must be one of hr, en/);
  assert.deepEqual(validate(repo({ courses: [course({ lang: 'en', term: two('Zima', 'Winter'), sections: [{ title: two('Mreža', 'Networks'), sims: ['dns-x'] }] })] })).errors, []);
});
test('rejects: course with unknown sim', () => {
  assert.match(errorsOf(repo({ courses: [course({ sections: [{ sims: ['nope'] }] })] })), /unknown sim id "nope"/);
});
test('rejects: tool on a course', () => {
  const r = repo({ natives: [nativeJson({ class: 'tool', steps: undefined })], courses: [course()] });
  assert.match(errorsOf(r), /is a tool/);
});
test('rejects: course id differs from file name', () => {
  const r = repo({ courses: [course()] });
  r.courses[0].file = 'other.json';
  assert.match(errorsOf(r), /must equal the file name "other"/);
});
test('rejects: sim listed twice in a course', () => {
  assert.match(errorsOf(repo({ courses: [course({ sections: [{ sims: ['dns-x'] }, { sims: ['dns-x'] }] })] })), /listed twice/);
});
test('rejects: empty sections and unknown course fields', () => {
  assert.match(errorsOf(repo({ courses: [course({ sections: [] })] })), /non-empty array/);
  assert.match(errorsOf(repo({ courses: [course({ sims: [] })] })), /unknown field "sims"/);
});
test('course short addresses: kebab-case, unique, not a reserved server path', () => {
  assert.deepEqual(validate(repo({ courses: [course({ short: 'linux' })] })).errors, []);
  assert.match(errorsOf(repo({ courses: [course({ short: '/Linux' })] })), /kebab-case/);
  assert.match(errorsOf(repo({ site: { reservedPaths: ['ossim'] }, courses: [course({ short: 'ossim' })] })), /already used on the server/);
  const two = repo({ courses: [course({ short: 'linux' }), course({ id: 'other', short: 'linux' })] });
  assert.match(errorsOf(two), /also used by course/);
});
test('warns, not fails: wip sim on a course', () => {
  const r = validate(repo({ natives: [nativeJson({ status: 'wip' })], courses: [course()] }));
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join('\n'), /not ready/);
});

test('credits: { what (both languages), by, licence, url?, changes? }; anything else is an error', () => {
  const ok = { what: two('Slika', 'Figure'), by: 'DARC e.V.', licence: 'CC BY 4.0', url: 'https://50ohm.de/', changes: two('Prevedeno.', 'Translated.') };
  assert.equal(errorsOf(repo({ natives: [nativeJson({ credits: [ok] })] })), '');
  const bad = (credits, re) => assert.match(errorsOf(repo({ natives: [nativeJson({ credits })] })), re);
  bad([], /"credits" must be a non-empty array/);
  bad([{ ...ok, what: 'Slika' }], /credits\[0\]: "what" must be/);
  bad([{ ...ok, by: '' }], /credits\[0\]: "by" must be a non-empty string/);
  bad([{ ...ok, licence: undefined }], /"licence" must be a non-empty string/);
  bad([{ ...ok, url: 'ftp://x' }], /"url" must be an http\(s\) address/);
  bad([{ ...ok, changes: two('', 'x') }], /"changes\.hr" must be a non-empty string/);
  bad([{ ...ok, licence_url: 'x' }], /unknown field "licence_url"/);
});

// ── preset entries (sim.json "entries"), linked from course files as "<sim>#<preset>" ──
const withPage = (r, id, page) => { r.natives.find((n) => n.dir === id).html = page; return r; };
const presetPage = `<!doctype html><html lang="hr"><head></head><body><script>presets: [{ id: 'loop' }, { id: "storm" }]; scenario = 'fifo-belady';</script></body></html>`;
const entry = (over = {}) => ({ preset: 'storm', title: two('Oluja', 'Storm'), concept: two('Petlja bez STP-a', 'A loop without STP'), ...over });
const presetRepo = (entries, courses) => withPage(repo({ natives: [nativeJson({ entries }), nativeJson({ id: 'lvm-x', topic: 'storage', tags: ['lvm'] })], courses }), 'dns-x', presetPage);

test('entries: a valid preset entry, and one with an explicit query, pass; a course links them as <sim>#<preset>', () => {
  const r = validate(presetRepo([entry(), entry({ preset: 'belady', query: 'scenario=fifo-belady&frames=3', summary: two('Više okvira, više promašaja.', 'More frames, more faults.') })],
    [{ id: 'net', title: two('Mreže'), sections: [{ sims: ['dns-x#storm', 'dns-x#belady', 'dns-x', 'lvm-x'] }] }]));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.entries.find((e) => e.id === 'dns-x').courses, ['net']);
});

test('entries: a course listing only a preset entry puts its sim on the course', () => {
  const r = validate(presetRepo([entry()], [{ id: 'net', title: two('Mreže'), sections: [{ sims: ['dns-x#storm'] }] }]));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.entries.find((e) => e.id === 'dns-x').courses, ['net']);
  assert.deepEqual(r.entries.find((e) => e.id === 'lvm-x').courses, []);
});

test('entries: shape errors', () => {
  const bad = (entries, re) => assert.match(errorsOf(presetRepo(entries)), re);
  bad([], /"entries" must be a non-empty array/);
  bad({ preset: 'storm' }, /"entries" must be a non-empty array/);
  bad(['storm'], /entries\[0\] must be an object/);
  bad([entry({ name: 'x' })], /entries\[0\]: unknown field "name"/);
  bad([entry({ preset: 'Storm' })], /entries\[0\]: "preset" must be the preset's kebab-case id/);
  bad([entry({ preset: undefined })], /entries\[0\]: "preset" must be/);
  bad([entry(), entry()], /entries\[1\]: preset "storm" is listed twice/);
  bad([entry({ title: { hr: 'Oluja' } })], /entries\[0\]: "title.en" must be a non-empty string/);
  bad([entry({ concept: undefined })], /entries\[0\]: missing required field "concept"/);
  bad([entry({ title: two('x'.repeat(61)) })], /entries\[0\]: "title.hr" is 61 chars, max 60/);
  bad([entry({ summary: two('Kratko.', '') })], /entries\[0\]: "summary.en" must be a non-empty string/);
});

test('entries: an explicit query is the part after "?", key=value pairs, without lang', () => {
  const bad = (query, re) => assert.match(errorsOf(presetRepo([entry({ preset: 'belady', query })])), re);
  bad('', /"query" must be a non-empty string/);
  bad('?scenario=fifo-belady', /no leading "\?"/);
  bad('scenario=fifo-belady#x', /no "#"/);
  bad('scenario', /key=value pairs/);
  bad('scenario=fifo-belady&', /key=value pairs/);
  bad('scenario=fifo-belady&lang=en', /must not set "lang"/);
});

test('entries: the preset id (or the query\'s first value) must be in the page', () => {
  assert.match(errorsOf(presetRepo([entry({ preset: 'flood' })])), /entries\[0\]: preset "flood" is not in the page's \.js or \.html files/);
  assert.match(errorsOf(presetRepo([entry({ preset: 'belady', query: 'scenario=lru-belady' })])), /entries\[0\]: "lru-belady" \(from its query\) is not in the page/);
  // Found in the sim's own scripts as loadRepo reads them (sources), not only in index.html.
  const r = presetRepo([entry({ preset: 'flood' })]);
  r.natives.find((n) => n.dir === 'dns-x').sources = `${presetPage}\npresets.push({ id: 'flood' });`;
  assert.deepEqual(validate(r).errors, []);
});

test('entries: course items naming a preset entry are checked', () => {
  const course = (sims) => [{ id: 'net', title: two('Mreže'), sections: [{ sims }] }];
  assert.match(errorsOf(presetRepo([entry()], course(['dns-x#flood']))), /"dns-x#flood": dns-x has no preset entry "flood"/);
  assert.match(errorsOf(presetRepo([entry()], course(['nope#storm']))), /unknown sim id "nope#storm"/);
  assert.match(errorsOf(presetRepo([entry()], course(['dns-x#storm', 'dns-x#storm']))), /"dns-x#storm" is listed twice/);
  const tool = withPage(repo({ natives: [nativeJson({ class: 'tool', steps: undefined, entries: [entry()] })], courses: course(['dns-x#storm']) }), 'dns-x', presetPage);
  assert.match(errorsOf(tool), /"dns-x#storm" is a tool/);
  const wip = withPage(repo({ natives: [nativeJson({ status: 'wip', entries: [entry()] })], courses: course(['dns-x#storm']) }), 'dns-x', presetPage);
  assert.match(validate(wip).warnings.join('\n'), /"dns-x#storm" is not ready/);
});

// ── learn.json: the home page's tree ──

const leaf = (id, sims) => ({ id, title: two(`List ${id}`), sims });
const learnOf = (...leaves) => ({ nodes: [{ id: 'area', title: two('Područje', 'Area'), blurb: two('Kratko.', 'Short.'), children: [{ id: 'subject', title: two('Tema', 'Subject'), children: leaves }] }] });
const withLearn = (learn, over = {}) => ({ ...repo(over), learn });

test('learn.json: a valid tree passes; one sim may sit in many leaves; no learn.json is no check', () => {
  assert.equal(errorsOf(withLearn(learnOf(leaf('a', ['dns-x', 'lvm-x']), leaf('b', ['dns-x'])))), '');
  assert.equal(errorsOf(repo()), '');
});

test('learn.json: a finished sim in no leaf (itself or a preset) is warned about, for the coordinator to place', () => {
  const missing = validate(withLearn(learnOf(leaf('a', ['dns-x']))));
  assert.deepEqual(missing.errors, [], 'tasks change only their own folder, so this cannot fail their gate');
  assert.match(missing.warnings.join('\n'), /lvm-x is in no leaf yet/);
  const natives = [nativeJson({ entries: [{ preset: 'p', title: two('P'), concept: two('P') }] }), nativeJson({ id: 'wip-x', status: 'wip' })];
  const r = withLearn(learnOf(leaf('a', ['dns-x#p'])), { natives });
  r.natives[0].sources = "'p'";
  assert.equal(errorsOf(r), '');
  assert.doesNotMatch(validate(r).warnings.join('\n'), /dns-x is in no leaf/, 'a preset places its sim');
  const w = validate(withLearn(learnOf(leaf('a', ['dns-x#p', 'wip-x'])), { natives }));
  assert.match(w.warnings.join('\n'), /"wip-x" is not ready/);
});

test('learn.json: rejects unknown ids, an unknown preset, a repeat in a leaf', () => {
  const e = errorsOf(withLearn(learnOf(leaf('a', ['dns-x', 'lvm-x', 'nope', 'dns-x#none', 'dns-x']))));
  assert.match(e, /unknown sim id "nope"/);
  assert.match(e, /dns-x has no preset entry "none"/);
  assert.match(e, /"dns-x" is listed twice in this leaf/);
});

test('learn.json: three levels exactly, sims only in leaves, kebab-case ids unique per level, both languages', () => {
  const ok = ['dns-x', 'lvm-x'];
  // sims above the leaves, and a fourth level
  let t = learnOf(leaf('a', ok));
  t.nodes[0].sims = ok;
  assert.match(errorsOf(withLearn(t)), /only the 3rd level lists sims/);
  t = learnOf({ id: 'a', title: two('A'), children: [leaf('deep', ok)] });
  assert.match(errorsOf(withLearn(t)), /a leaf has "sims", not "children"/);
  // a subject without children, an empty leaf
  t = learnOf(leaf('a', ok));
  t.nodes[0].children.push({ id: 'empty', title: two('E') });
  assert.match(errorsOf(withLearn(t)), /area\/empty: "children" must be a non-empty array/);
  assert.match(errorsOf(withLearn(learnOf(leaf('a', ok), leaf('b', [])))), /area\/subject\/b: "sims" must be a non-empty array/);
  // ids, titles, unknown fields, the top level
  assert.match(errorsOf(withLearn(learnOf(leaf('Bad Id', ok)))), /"id" must be kebab-case/);
  assert.match(errorsOf(withLearn(learnOf(leaf('a', ok), leaf('a', ok)))), /id is used twice at this level/);
  assert.match(errorsOf(withLearn(learnOf({ id: 'a', title: { hr: 'Samo hrvatski' }, sims: ok }))), /"title.en" must be a non-empty string/);
  assert.match(errorsOf(withLearn(learnOf({ ...leaf('a', ok), icon: 'x' }))), /unknown field "icon"/);
  assert.match(errorsOf(withLearn({ nodes: [] })), /must be \{ "nodes": \[ … \] \}/);
  assert.match(errorsOf(withLearn({ ...learnOf(leaf('a', ok)), title: two('x') })), /learn.json: unknown field "title"/);
});
