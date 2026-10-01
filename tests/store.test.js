// The admin's write side: valid changes reach disk in the hand-edit format; invalid ones change nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminState, saveEntry, deleteEntry, createNative, saveCourse, deleteCourse, saveVocab } from '../lib/store.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function copyRepo() {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-store-'));
  for (const p of ['site.json', 'tags.json', 'sims', 'linked', 'courses']) cpSync(join(ROOT, p), join(d, p), { recursive: true });
  return d;
}
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const snapshot = (d) => ['tags.json', ...['sims', 'linked', 'courses'].flatMap((x) => readdirSync(join(d, x), { recursive: true }).map((f) => join(x, String(f))))]
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

test('adminState says where each entry lives', withRepo((d) => {
  const s = adminState(d);
  assert.deepEqual(s.errors, []);
  assert.equal(s.entries.find((e) => e.id === 'dhcp-dora').source.file, 'sims/dhcp-dora/sim.json');
  assert.equal(s.entries.find((e) => e.id === 'cephsim').source.file, 'apps.json');
}));

test('saving a native entry rewrites its sim.json without derived fields', withRepo((d) => {
  const e = adminState(d).entries.find((x) => x.id === 'dhcp-dora');
  const r = saveEntry(d, { ...e, title: 'DHCP: četiri poruke' }, { oldId: 'dhcp-dora' });
  assert.ok(r.ok, r.errors?.join());
  const j = readJson(join(d, 'sims/dhcp-dora/sim.json'));
  assert.equal(j.title, 'DHCP: četiri poruke');
  for (const k of ['path', 'courses', 'source', 'thumb']) assert.equal(j[k], undefined, k);
  assert.deepEqual(Object.keys(j).slice(0, 3), ['id', 'kind', 'class'], 'stable field order');
}));

test('an invalid save is refused and nothing changes on disk', withRepo((d) => {
  const before = snapshot(d);
  const e = adminState(d).entries.find((x) => x.id === 'dhcp-dora');
  assert.match(saveEntry(d, { ...e, tags: ['no-such-tag'] }, { oldId: 'dhcp-dora' }).errors.join(), /not in tags.json/);
  assert.match(saveEntry(d, { ...e, id: 'renamed' }, { oldId: 'dhcp-dora' }).errors.join(), /folder name/);
  assert.match(deleteEntry(d, 'lvm-topology-lab').errors.join(), /unknown sim id/, 'still on a course');
  assert.match(deleteEntry(d, 'dns-resolution').errors.join(), /by hand/);
  assert.match(saveVocab(d, { ...readJson(join(d, 'tags.json')), tags: {} }).errors.join(), /not in tags.json/);
  assert.match(saveCourse(d, { id: 'x', title: 'X', sections: [{ sims: ['random-student-picker'] }] }).errors.join(), /is a tool/);
  assert.match(createNative(d, { id: 'dns-resolution', title: 't' }).errors.join(), /already exists/);
  assert.deepEqual(snapshot(d), before);
}));

test('linked entries: add, edit in place, move between files, delete', withRepo((d) => {
  const base = { kind: 'linked', class: 'explorer', status: 'ready', title: 'Faultline', concept: 'Kvarovi', summary: 'S.', topic: 'distributed', tags: ['fault-tolerance'], level: 'core', lang: 'hr', url: '/faultline/' };
  assert.ok(saveEntry(d, { id: 'faultline', ...base }, { file: 'apps.json' }).ok);
  assert.deepEqual(readJson(join(d, 'linked/apps.json')).map((x) => x.id), ['cephsim', 'faultline']);
  assert.ok(saveEntry(d, { id: 'cephsim', ...base, title: 'Ceph' }, { oldId: 'cephsim', file: 'apps.json' }).ok);
  assert.deepEqual(readJson(join(d, 'linked/apps.json')).map((x) => x.id), ['cephsim', 'faultline'], 'position kept');
  assert.ok(saveEntry(d, { id: 'faultline', ...base }, { oldId: 'faultline', file: 'more.json' }).ok);
  assert.deepEqual(readJson(join(d, 'linked/apps.json')).map((x) => x.id), ['cephsim']);
  assert.deepEqual(readJson(join(d, 'linked/more.json')).map((x) => x.id), ['faultline']);
  assert.ok(deleteEntry(d, 'faultline').ok);
  assert.deepEqual(readJson(join(d, 'linked/more.json')), []);
}));

test('createNative scaffolds a folder that validates', withRepo((d) => {
  const r = createNative(d, { id: 'raid-5', class: 'stepper', status: 'wip', title: 'RAID 5', concept: 'Paritet', summary: 'S.', topic: 'storage', tags: ['backup'], level: 'core', lang: 'hr', steps: 5 });
  assert.ok(r.ok, r.errors?.join());
  assert.ok(existsSync(join(d, 'sims/raid-5/index.html')));
  assert.match(readFileSync(join(d, 'sims/raid-5/index.html'), 'utf8'), /<html lang="hr">[\s\S]*simdeck:kit/);
  assert.deepEqual(adminState(d).errors, []);
}));

test('courses: create, rename (old file removed), delete', withRepo((d) => {
  assert.ok(saveCourse(d, { id: 'os-1', title: 'OS', sections: [{ title: '', sims: ['os-scheduling'] }] }).ok);
  assert.deepEqual(readJson(join(d, 'courses/os-1.json')).sections, [{ sims: ['os-scheduling'] }], 'empty title dropped');
  assert.ok(saveCourse(d, { id: 'operacijski-sustavi', title: 'OS', sections: [{ sims: ['os-scheduling'] }] }, { oldId: 'os-1' }).ok);
  assert.ok(!existsSync(join(d, 'courses/os-1.json')));
  assert.match(saveCourse(d, { id: 'linux-essentials', title: 'dup', sections: [{ sims: ['cephsim'] }] }).errors.join(), /already exists/);
  assert.ok(deleteCourse(d, 'operacijski-sustavi').ok);
  assert.match(deleteCourse(d, '../tags').errors.join(), /kebab-case/);
}));

test('vocabulary: adding a tag is fine, ids must be kebab-case', withRepo((d) => {
  const v = readJson(join(d, 'tags.json'));
  v.tags.raid = { label: 'RAID' };
  assert.ok(saveVocab(d, v).ok);
  assert.equal(readJson(join(d, 'tags.json')).tags.raid.label, 'RAID');
  v.tags['Bad Tag'] = { label: 'x' };
  assert.match(saveVocab(d, v).errors.join(), /kebab-case/);
}));
