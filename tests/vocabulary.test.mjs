// SPDX-License-Identifier: AGPL-3.0-or-later
// The vocabulary (tags.json) carries every topic and tag the task files use, and the README's list says the same,
// so parallel tasks never wait on a tag (docs/tasks/w0/vocabulary.md, COMMON.md §5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, loadRepo } from '../lib/manifest.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const vocab = JSON.parse(readFileSync(join(ROOT, 'tags.json'), 'utf8'));
const readme = readFileSync(join(ROOT, 'docs/tasks/README.md'), 'utf8');
const section = readme.slice(readme.indexOf('## Tags used by the tasks'));
const codes = (line) => [...(line ?? '').matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]).sort();
const lineAfter = (re) => section.split('\n').find((l) => re.test(l));

const readmeTags = codes(lineAfter(/^`active-directory`/));
const readmeTopics = codes(lineAfter(/^Topics:/));
const unusedTags = codes(lineAfter(/^Also in `tags.json`/)?.replace('`tags.json`', ''));

// "| Topic / tags / level | `os` / `memory`, `operating-systems` / `core` |" in every task file.
function taskUsage() {
  const topics = new Set();
  const tags = new Set();
  for (const wave of readdirSync(join(ROOT, 'docs/tasks')).filter((d) => /^w\d$/.test(d))) {
    for (const f of readdirSync(join(ROOT, 'docs/tasks', wave)).filter((x) => x.endsWith('.md'))) {
      const row = readFileSync(join(ROOT, 'docs/tasks', wave, f), 'utf8').split('\n').find((l) => l.startsWith('| Topic / tags / level'));
      if (!row) continue;
      const [topic, tagList] = row.split('|')[2].split(' / ');
      codes(topic).forEach((t) => topics.add(t));
      codes(tagList).forEach((t) => tags.add(t));
    }
  }
  return { topics: [...topics].sort(), tags: [...tags].sort() };
}

test('the README lists are found', () => {
  assert.ok(readmeTags.length > 50, 'tag list');
  assert.ok(readmeTopics.length >= 12, 'topic list');
});

test('README tag list and tags.json agree', () => {
  assert.deepEqual([...readmeTags, ...unusedTags].sort(), Object.keys(vocab.tags).sort());
  assert.deepEqual(readmeTopics, Object.keys(vocab.topics).sort());
});

test('every topic and tag a task file names is in tags.json, and the README lists exactly those', () => {
  const used = taskUsage();
  assert.ok(used.tags.length > 50);
  assert.deepEqual(used.tags.filter((t) => !(t in vocab.tags)), []);
  assert.deepEqual(used.topics.filter((t) => !(t in vocab.topics)), []);
  assert.deepEqual(used.tags, readmeTags);
  assert.deepEqual(unusedTags.filter((t) => used.tags.includes(t)), [], 'a tag a task uses is not "used by no task"');
});

test('classroom is the last topic', () => {
  assert.equal(Object.keys(vocab.topics).at(-1), 'classroom');
});

test('a sim using every tag, under every topic, passes the manifest check', () => {
  const repo = loadRepo(ROOT);
  const base = repo.natives[0];
  for (const topic of Object.keys(vocab.topics)) {
    const json = { ...base.json, id: `vocab-${topic}`, topic, tags: Object.keys(vocab.tags) };
    repo.natives.push({ ...base, dir: json.id, json });
  }
  assert.deepEqual(validate(repo).errors, []);
});

test('every label is in both languages and no alias repeats within a tag', () => {
  for (const kind of ['topics', 'tags']) {
    for (const [k, t] of Object.entries(vocab[kind])) {
      assert.ok(t.label.hr.trim() && t.label.en.trim(), `${kind}.${k}`);
      const a = (t.aliases ?? []).map((x) => x.toLowerCase());
      assert.equal(new Set(a).size, a.length, `${kind}.${k} repeats an alias`);
    }
  }
});
