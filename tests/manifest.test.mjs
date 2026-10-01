// Every manifest rule gets a sample that must fail, so a check that silently passes is caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, loadRepo } from '../lib/manifest.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const vocab = {
  topics: { networks: { label: 'Mreže' }, storage: { label: 'Pohrana' } },
  tags: { dns: { label: 'DNS' }, lvm: { label: 'LVM' } },
};
const nativeJson = (over = {}) => ({
  id: 'dns-x', class: 'stepper', status: 'ready', title: 'DNS', concept: 'Razlučivanje',
  summary: 'Kratko.', topic: 'networks', tags: ['dns'], level: 'intro', lang: 'hr', steps: 4, ...over,
});
const html = (lang = 'hr') => `<!doctype html><html lang="${lang}"><head></head><body></body></html>`;

function repo({ natives, courses, site = {} } = {}) {
  const n = natives ?? [nativeJson(), nativeJson({ id: 'lvm-x', class: 'explorer', steps: undefined, topic: 'storage', tags: ['lvm'], lang: 'en' })];
  return {
    site,
    vocab,
    natives: n.map((json) => ({ dir: json.id, json, html: html(json.lang), files: ['sim.json', 'index.html'], hasManifest: true })),
    courses: (courses ?? []).map((json) => ({ file: `${json.id}.json`, json })),
  };
}
const errorsOf = (r) => validate(r).errors.join('\n');

test('a valid repo has no errors', () => {
  const r = validate(repo({ courses: [{ id: 'linux', title: 'Linux', sections: [{ sims: ['dns-x', 'lvm-x'] }] }] }));
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
  ['bad lang', [nativeJson({ lang: 'de' })], /"lang" must be one of/],
  ['unknown topic', [nativeJson({ topic: 'cooking' })], /topic "cooking" is not in tags.json/],
  ['unknown tag', [nativeJson({ tags: ['dns', 'backups'] })], /tag "backups" is not in tags.json/],
  ['no tags', [nativeJson({ tags: [] })], /at least one tag/],
  ['duplicate tag', [nativeJson({ tags: ['dns', 'dns'] })], /duplicate tags/],
  ['summary too long', [nativeJson({ summary: 'x'.repeat(161) })], /"summary" is 161 chars/],
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
test('rejects: html lang differs from manifest', () => {
  const r = repo();
  r.natives[0].html = html('en');
  assert.match(errorsOf(r), /does not match manifest lang "hr"/);
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
  r.natives[0].html = '<html lang="hr" data-sim="dns-x"><head><script type="application/json" id="simdeck-exceptions">[{"rule":"fit","why":"poster"}]</script>'
    + '<script type="application/json" id="simdeck-meta">{"id":"dns-x","class":"stepper","steps":16}</script></head></html>';
  const v = validate(r);
  assert.deepEqual(v.errors, []);
  assert.match(v.warnings.join('\n'), /1 declared contract exception/);
  assert.match(v.warnings.join('\n'), /#simdeck-meta steps is 16, sim.json says 4/);
});

const course = (over) => ({ id: 'linux', title: 'Linux', sections: [{ sims: ['dns-x'] }], ...over });
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
