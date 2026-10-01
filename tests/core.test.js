import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalise, search, group, entryHref, entryAbsUrl, shortUrl, shortLinkRules, renderCourse, courseItems, renderIndexList, isPublic } from '../site/core.js';

const vocab = {
  topics: { networks: { label: 'Računalne mreže' }, storage: { label: 'Pohrana' } },
  tags: { dns: { label: 'DNS', aliases: ['resolver'] }, lvm: { label: 'LVM' }, partitioning: { label: 'particioniranje', aliases: ['gpt'] } },
};
const e = (id, over) => ({
  id, class: 'stepper', status: 'ready', title: id, concept: '', summary: '', topic: 'networks',
  tags: ['dns'], level: 'intro', lang: 'hr', path: `sims/${id}/`, courses: [], ...over,
});
const entries = [
  e('dns', { title: 'DNS: razlučivanje imena', concept: 'Rekurzivni resolver', courses: ['linux'] }),
  e('dhcp', { title: 'DHCP: DORA', summary: 'Klijent dobiva adresu od DNS-a? ne.', courses: ['linux'] }),
  e('parts', { title: 'Particioniranje diska', topic: 'storage', tags: ['partitioning'], class: 'explorer' }),
  e('lvm', { title: 'LVM', topic: 'storage', tags: ['lvm'], lang: 'en', class: 'explorer', courses: ['linux'] }),
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
  assert.deepEqual(ids(search(entries, vocab, '', { lang: 'en' })), ['lvm']);
  assert.deepEqual(ids(search(entries, vocab, '', { topic: 'storage', level: 'intro' })), ['lvm', 'parts']);
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
  assert.equal(entryAbsUrl(entries[0], site), 'https://m.o/simdeck/sims/dns/');
});

test('short addresses: URL and one nginx rule per course that has one', () => {
  const courses = [{ id: 'linux-essentials', title: 'Linux', short: 'linux' }, { id: 'os', title: 'OS' }];
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
  const course = { title: 'Linux <Essentials>', short: 'linux', sections: [{ title: 'Mreža', sims: ['dns', 'dhcp'] }, { title: 'Diskovi', sims: ['lvm', 'picker'] }] };
  const { html, skipped } = renderCourse(course, { site, entries }, 2);
  assert.match(html, /Linux &lt;Essentials&gt;/);
  assert.match(html, /<li value="3"><a href="\.\.\/\.\.\/sims\/lvm\/index.html">LVM<\/a>/);
  assert.match(html, /href="\.\.\/\.\.\/sims\/dns\/index.html"/);
  assert.match(html, /m\.o\/linux/);
  assert.match(html, /<span class="h-lang">EN<\/span>/);
  assert.deepEqual(skipped.map((s) => s.id), ['picker']);
});

test('the home list shows finished entries only, by topic, with folded search words', () => {
  const html = renderIndexList({ site, vocab, entries });
  assert.ok(!html.includes('Nedovršen'), 'wip left out');
  assert.match(html, /Odabir studenta/, 'tools are listed on the home page');
  assert.ok(html.indexOf('Računalne mreže') < html.indexOf('Pohrana'), 'tags.json topic order');
  assert.match(html, /data-s="[^"]*razlucivanje/, 'diacritics folded in search words');
  assert.equal(isPublic(entries[5]), false);
});
