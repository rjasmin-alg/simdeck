// The renderer builds SVG as strings from pure functions, so its output is
// checkable in node. That is not a stylistic preference: headless Firefox is
// broken on this machine, and this is the only way the markup gets checked at
// all.

import { CANVAS_CSS, ROLE_COLOUR, layoutDoc, paintAll, paintComponent } from '../js/render.js';
import { compile, invalidate } from '../js/compile.js';
import { SAMPLES, makeSample } from '../js/samples.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const keys = Object.keys(SAMPLES);
const expanded = (k) => { invalidate(); return compile(makeSample(k)).doc; };
const overlaps = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

check('every sample paints well-formed markup', () => {
  let bytes = 0;
  for (const k of keys) {
    const { markup } = paintAll(expanded(k));
    // Deliberately strict rather than a real parser: every tag opened is closed,
    // and attribute quoting balances.
    const opens = (markup.match(/<(g|text)\b/g) || []).length;
    const closes = (markup.match(/<\/(g|text)>/g) || []).length;
    assert(opens === closes, `${k}: ${opens} open vs ${closes} close for g/text`);
    assert((markup.match(/"/g) || []).length % 2 === 0, `${k}: unbalanced quotes`);
    bytes += markup.length;
  }
  return `${keys.length} samples, ${(bytes / 1024).toFixed(1)} KB of markup`;
});

check('no NaN or undefined reaches the markup', () => {
  for (const k of keys) {
    const { markup } = paintAll(expanded(k));
    assert(!/NaN/.test(markup), `${k}: NaN in emitted SVG`);
    assert(!/undefined/.test(markup), `${k}: undefined in emitted SVG`);
    assert(!/"\s*"/.test(markup.replace(/class="[^"]*"/g, '')), `${k}: empty attribute value`);
  }
  return 'clean across every sample';
});

check('user text is escaped, not injected', () => {
  const comp = { id: 'x', name: '<script>alert("x")</script>', role: 'service' };
  const out = paintComponent(comp, { x: 0, y: 0, w: 100, h: 40 });
  assert(!out.includes('<script>'), 'a raw script tag survived');
  assert(out.includes('&lt;script&gt;'), 'the name was not escaped');
  assert(out.includes('&quot;'), 'quotes were not escaped');
  return 'angle brackets and quotes escaped';
});

check('layout gives every component a box and none of them overlap', () => {
  for (const k of keys) {
    const doc = expanded(k);
    const { boxes } = layoutDoc(doc);
    const comps = doc.components.map((c) => ({ c, b: boxes.get(c.id) }));
    for (const { c, b } of comps) assert(b, `${k}: ${c.id} got no box`);
    for (let i = 0; i < comps.length; i++) {
      for (let j = i + 1; j < comps.length; j++) {
        assert(!overlaps(comps[i].b, comps[j].b),
          `${k}: ${comps[i].c.id} overlaps ${comps[j].c.id}`);
      }
    }
  }
  return 'no two component boxes overlap in any sample';
});

check('a child domain sits inside its parent', () => {
  for (const k of keys) {
    const doc = expanded(k);
    const { boxes } = layoutDoc(doc);
    for (const d of doc.domains) {
      if (!d.parent) continue;
      const me = boxes.get(d.id), up = boxes.get(d.parent);
      if (!me || !up) continue;
      assert(me.x >= up.x && me.y >= up.y &&
             me.x + me.w <= up.x + up.w + 0.5 && me.y + me.h <= up.y + up.h + 0.5,
        `${k}: ${d.id} escapes ${d.parent}`);
    }
  }
  return 'containment holds geometrically as well as in the model';
});

check('a component sits inside the domain it is assigned to', () => {
  // Membership is the stored field; this asserts the drawing agrees with it,
  // which is the direction that matters. The reverse — reading membership off
  // the geometry — is exactly what this project does not do.
  for (const k of keys) {
    const doc = expanded(k);
    const { boxes } = layoutDoc(doc);
    for (const c of doc.components) {
      const me = boxes.get(c.id), home = boxes.get(c.domain);
      if (!me || !home) continue;
      assert(me.x >= home.x && me.x + me.w <= home.x + home.w + 0.5,
        `${k}: ${c.id} is drawn outside ${c.domain}`);
    }
  }
  return 'the drawing follows the model, not the other way round';
});

check('implicit authorities are drawn as not-drawn', () => {
  const doc = expanded('threeZone');
  const { markup } = paintAll(doc);
  const auth = doc.components.filter((c) => c.implicit);
  assert(auth.length === 6, `expected six authorities, found ${auth.length}`);
  assert(markup.includes('not drawn'), 'authorities are not labelled as undrawn');
  assert((markup.match(/class="component implicit"/g) || []).length === 6,
    'authorities do not carry the implicit class');
  return `${auth.length} shown dashed and labelled`;
});

check('down components carry the class that colours them', () => {
  const doc = expanded('onePdu');
  const { markup } = paintAll(doc, { down: new Set(['osd1', 'osd2']) });
  assert((markup.match(/class="component down"/g) || []).length === 2, 'wrong number marked down');
  return '2 of 3 replicas marked down';
});

check('CANVAS_CSS carries no editor-only rules', () => {
  // UI_CSS is module-private precisely so it cannot reach an export. This is the
  // regression guard on that split.
  for (const banned of ['sel-ring', 'cut-lit', '.hit', 'cursor:']) {
    assert(!CANVAS_CSS.includes(banned), `CANVAS_CSS leaked "${banned}"`);
  }
  return 'selection, hit targets and cursors stay out of exports';
});

check('every role has a colour', () => {
  const roles = new Set();
  for (const k of keys) for (const c of expanded(k).components) roles.add(c.role);
  for (const r of roles) assert(ROLE_COLOUR[r], `role "${r}" has no colour`);
  return [...roles].sort().join(', ');
});
