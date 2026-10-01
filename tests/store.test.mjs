// The admin's write side: valid changes reach disk in the hand-edit format; invalid ones change nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminState, saveEntry, createSim, saveCourse, deleteCourse, saveVocab } from '../lib/store.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function copyRepo() {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-store-'));
  for (const p of ['site.json', 'tags.json', 'sims', 'courses', 'kit']) cpSync(join(ROOT, p), join(d, p), { recursive: true });
  return d;
}
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const two = (hr, en = hr) => ({ hr, en });
const snapshot = (d) => ['tags.json', ...['sims', 'courses'].flatMap((x) => readdirSync(join(d, x), { recursive: true }).map((f) => join(x, String(f))))]
  .filter((f) => f.endsWith('.json')).sort().map((f) => [f, readFileSync(join(d, f), 'utf8')]);

function withRepo(fn) {
  return () => {
    const d = copyRepo();
    try {
      fn(d);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  };
}

test('saving a native entry rewrites its sim.json without derived fields', withRepo((d) => {
  const e = adminState(d).entries.find((x) => x.id === 'dhcp-dora');
  const r = saveEntry(d, { ...e, title: two('DHCP: četiri poruke', 'DHCP: four messages'), aliases: { en: ['lease'] }, languages: undefined }, { oldId: 'dhcp-dora' });
  assert.ok(r.ok, r.errors?.join());
  const j = readJson(join(d, 'sims/dhcp-dora/sim.json'));
  assert.deepEqual(j.title, { hr: 'DHCP: četiri poruke', en: 'DHCP: four messages' });
  assert.deepEqual(j.aliases, { en: ['lease'] });
  assert.equal(j.languages, undefined, 'an unset exception is left out, not written as null');
  assert.match(saveEntry(d, { ...j, title: 'DHCP' }, { oldId: 'dhcp-dora' }).errors.join(), /"title" must be \{ "hr"/, 'one language is refused');
  for (const k of ['path', 'courses']) assert.equal(j[k], undefined, k);
  assert.deepEqual(Object.keys(j).slice(0, 3), ['id', 'class', 'status'], 'stable field order');
}));

test('an invalid save is refused and nothing changes on disk', withRepo((d) => {
  const before = snapshot(d);
  const e = adminState(d).entries.find((x) => x.id === 'dhcp-dora');
  assert.match(saveEntry(d, { ...e, tags: ['no-such-tag'] }, { oldId: 'dhcp-dora' }).errors.join(), /not in tags.json/);
  assert.match(saveEntry(d, { ...e, id: 'renamed' }, { oldId: 'dhcp-dora' }).errors.join(), /folder name/);
  assert.match(saveVocab(d, { ...readJson(join(d, 'tags.json')), tags: {} }).errors.join(), /not in tags.json/);
  assert.match(saveCourse(d, { id: 'x', title: 'X', sections: [{ sims: ['nope'] }] }).errors.join(), /unknown sim id/);
  assert.match(createSim(d, { id: 'dns-resolution', title: 't' }).errors.join(), /already exists/);
  assert.deepEqual(snapshot(d), before);
}));

test('createSim copies the kit template with new-sim.sh and fits it to sim.json', withRepo((d) => {
  const r = createSim(d, { id: 'raid-5', class: 'stepper', status: 'wip', title: two('RAID 5'), concept: two('Paritet', 'Parity'), summary: two('S.'), topic: 'storage', tags: ['backup'], level: 'core', steps: 5 });
  assert.ok(r.ok, r.errors?.join());
  assert.ok(existsSync(join(d, 'sims/raid-5/index.html')));
  const html = readFileSync(join(d, 'sims/raid-5/index.html'), 'utf8');
  assert.match(html, /<html lang="hr" data-sim="raid-5">/);
  assert.match(html, /<title>RAID 5 · simdeck<\/title>/);
  assert.match(html, /<h1 class="sd-title">RAID 5<\/h1>/);
  assert.match(html, /href="\.\.\/\.\.\/kit\/kit\.css"/);
  assert.match(html, /"id": "raid-5"/);
  assert.match(html, /"concept": \{\s*"hr": "Paritet",\s*"en": "Parity"/, 'the placeholder carries both languages for the kit');
  assert.doesNotMatch(html, /"kind"|"path"/);
  for (const f of ['strings.js', 'sim.js', 'sim.test.js', 'sim.json']) assert.ok(existsSync(join(d, 'sims/raid-5', f)), f);
  const st = adminState(d);
  assert.deepEqual(st.errors, []);
  assert.deepEqual(st.warnings.filter((w) => w.includes('raid-5')), [], 'placeholder and sim.json agree');
}));

test('courses: create, rename (old file removed), delete', withRepo((d) => {
  assert.ok(saveCourse(d, { id: 'os-1', title: two('OS'), sections: [{ title: { hr: '', en: '' }, sims: ['dns-resolution'] }] }).ok);
  assert.deepEqual(readJson(join(d, 'courses/os-1.json')).sections, [{ sims: ['dns-resolution'] }], 'empty title dropped');
  assert.ok(saveCourse(d, { id: 'operacijski-sustavi', title: two('OS'), sections: [{ sims: ['dns-resolution'] }], short: 'os' }, { oldId: 'os-1' }).ok);
  assert.equal(readJson(join(d, 'courses/operacijski-sustavi.json')).short, 'os');
  assert.ok(!existsSync(join(d, 'courses/os-1.json')));
  assert.match(saveCourse(d, { id: 'linux-essentials', title: two('dup'), sections: [{ sims: ['dhcp-dora'] }] }).errors.join(), /already exists/);
  assert.match(saveCourse(d, { id: 'x-2', title: { hr: 'Samo hrvatski' }, sections: [{ sims: ['dhcp-dora'] }] }).errors.join(), /"title.en"/);
  assert.ok(deleteCourse(d, 'operacijski-sustavi').ok);
  assert.match(deleteCourse(d, '../tags').errors.join(), /kebab-case/);
}));

test('vocabulary: adding a tag is fine, ids must be kebab-case', withRepo((d) => {
  const v = readJson(join(d, 'tags.json'));
  v.tags.raid = { label: two('RAID') };
  assert.ok(saveVocab(d, v).ok);
  assert.deepEqual(readJson(join(d, 'tags.json')).tags.raid.label, { hr: 'RAID', en: 'RAID' });
  v.tags.raid = { label: 'RAID' };
  assert.match(saveVocab(d, v).errors.join(), /"tags.raid.label" must be/, 'labels in both languages');
  v.tags.raid = { label: two('RAID') };
  v.tags['Bad Tag'] = { label: 'x' };
  assert.match(saveVocab(d, v).errors.join(), /kebab-case/);
}));
