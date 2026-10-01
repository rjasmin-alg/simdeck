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
  id: 'dns-x', kind: 'native', class: 'stepper', status: 'ready', title: 'DNS', concept: 'Razlučivanje',
  summary: 'Kratko.', topic: 'networks', tags: ['dns'], level: 'intro', lang: 'hr', steps: 4, ...over,
});
const linkedJson = (over = {}) => ({
  id: 'lvm-x', kind: 'linked', class: 'explorer', status: 'ready', title: 'LVM', concept: 'Volumeni',
  summary: 'Kratko.', topic: 'storage', tags: ['lvm'], level: 'core', lang: 'en', url: '/singles/lvm.html', ...over,
});
const html = (lang = 'hr') => `<!doctype html><html lang="${lang}"><head></head><body></body></html>`;

function repo({ natives, linked, courses } = {}) {
  const n = natives ?? [nativeJson()];
  return {
    site: {},
    vocab,
    natives: n.map((json) => ({ dir: json.id, json, html: html(json.lang), files: ['sim.json', 'index.html'], hasManifest: true })),
    linked: [{ file: 'x.json', entries: linked ?? [linkedJson()] }],
    linkedThumbs: [],
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
  assert.ok(r.entries.some((e) => e.kind === 'native'));
});

const bad = [
  ['missing field', [nativeJson({ summary: undefined })], /missing required field "summary"/],
  ['unknown field', [nativeJson({ sumary: 'x' })], /unknown field "sumary"/],
  ['linked-only field on native', [nativeJson({ url: '/x' })], /only for linked/],
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
  ['bad exceptions', [nativeJson({ exceptions: [{ rule: 'fit' }] })], /"exceptions" must be/],
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
test('rejects: two thumbnails', () => {
  const r = repo();
  r.natives[0].files.push('thumb.svg', 'thumb.png');
  assert.match(errorsOf(r), /more than one thumbnail/);
});
test('rejects: duplicate id across native and linked', () => {
  assert.match(errorsOf(repo({ linked: [linkedJson({ id: 'dns-x' })] })), /duplicate id "dns-x"/);
});
test('rejects: linked url not site-absolute or https', () => {
  assert.match(errorsOf(repo({ linked: [linkedJson({ url: 'http://x.org/' })] })), /site-absolute/);
  assert.match(errorsOf(repo({ linked: [linkedJson({ url: 'singles/x.html' })] })), /site-absolute/);
});
test('rejects: scenario inside the url', () => {
  assert.match(errorsOf(repo({ linked: [linkedJson({ url: '/ossim/x/index.html?scenario=a' })] })), /put the scenario in "scenario"/);
});
test('rejects: linked thumb that does not exist', () => {
  assert.match(errorsOf(repo({ linked: [linkedJson({ thumb: 'x.png' })] })), /thumb "x.png" not found/);
});
test('rejects: native entry with kind linked', () => {
  assert.match(errorsOf(repo({ natives: [nativeJson({ kind: 'linked', url: '/x' })] })), /must have kind "native"/);
});

const course = (over) => ({ id: 'linux', title: 'Linux', sections: [{ sims: ['dns-x'] }], ...over });
test('rejects: course with unknown sim', () => {
  assert.match(errorsOf(repo({ courses: [course({ sections: [{ sims: ['nope'] }] })] })), /unknown sim id "nope"/);
});
test('rejects: tool on a course', () => {
  const r = repo({ linked: [linkedJson({ class: 'tool' })], courses: [course({ sections: [{ sims: ['lvm-x'] }] })] });
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
test('warns, not fails: wip sim on a course', () => {
  const r = validate(repo({ natives: [nativeJson({ status: 'wip' })], courses: [course()] }));
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join('\n'), /not ready/);
});
