// simdeck admin: edit simulators, courses, topics and tags; preview; publish. Every save goes to the
// local server, which validates before writing, so a refused save shows the reason and changes nothing.
import { search, escapeHtml as h, STR, shortLinkRules, shortUrl } from './core.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
let S = null; // server state
const ui = { tab: 'sims', simId: null, simQ: '', simStatus: '', courseId: null, newSim: null, newCourse: null };

async function load() {
  S = await (await fetch('/api/state')).json();
  const e = S.errors.length, w = S.warnings.length;
  $('#health').innerHTML = `${S.entries.length} simulatora · ${S.courses.length} kolegija · ${e ? `<span class="bad">${e} grešaka</span>` : 'bez grešaka'}${w ? ` · <span class="warn">${w} upozorenja</span>` : ''}`;
  $('#health').title = [...S.errors, ...S.warnings].join('\n');
  render();
}

async function post(path, body, okText) {
  const r = await (await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  flash(r.ok ? okText : `Nije spremljeno:\n${r.errors.join('\n')}`, r.ok);
  if (r.ok) await load();
  return r;
}

function flash(text, ok) {
  const m = $('#msg');
  m.hidden = !text;
  m.className = `msg ${ok ? 'ok' : 'bad'}`;
  m.textContent = text;
  if (ok) setTimeout(() => { if (m.textContent === text) m.hidden = true; }, 2500);
}

function render() {
  $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)));
  ({ sims: renderSims, courses: renderCourses, vocab: renderVocab, publish: renderPublish })[ui.tab]();
}

const csv = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const opts = (pairs, cur) => pairs.map(([v, l]) => `<option value="${h(v)}"${v === cur ? ' selected' : ''}>${h(l)}</option>`).join('');

// ---------- Simulators ----------

function blankEntry() {
  return { id: '', class: 'stepper', status: 'wip', title: '', concept: '', summary: '', topic: Object.keys(S.vocab.topics)[0], tags: [], level: 'intro', lang: 'hr', steps: 1 };
}

function renderSims() {
  const list = search(S.entries, S.vocab, ui.simQ).filter((e) => !ui.simStatus || e.status === ui.simStatus);
  const cur = ui.newSim ?? S.entries.find((e) => e.id === ui.simId);
  $('#view').innerHTML = `<div class="split">
  <section class="pane">
    <div class="list-tools">
      <input type="search" id="sim-q" placeholder="Traži…" value="${h(ui.simQ)}">
      <select id="sim-status">${opts([['', 'svi'], ['ready', 'gotovi'], ['wip', 'u izradi']], ui.simStatus)}</select>
    </div>
    <div class="list-tools"><button type="button" id="new-sim">+ Novi simulator</button></div>
    <ul class="rows">${list.map((e) => `<li data-id="${h(e.id)}" class="${e.id === ui.simId && !ui.newSim ? 'sel' : ''}">
      <span>${h(e.title)}</span> <small>${h(e.id)}</small>${e.status !== 'ready' ? ' <span class="tag wip">u izradi</span>' : ''}</li>`).join('')}</ul>
    <p class="muted">${list.length} / ${S.entries.length}</p>
  </section>
  <section class="pane">${cur ? simForm(cur) : '<p class="muted">Odaberi simulator s popisa ili dodaj novi.</p>'}</section>
</div>`;
  $('#sim-q').addEventListener('input', (ev) => {
    ui.simQ = ev.target.value;
    renderSims();
    $('#sim-q').focus();
    $('#sim-q').setSelectionRange(ui.simQ.length, ui.simQ.length);
  });
  $('#sim-status').onchange = (ev) => { ui.simStatus = ev.target.value; renderSims(); };
  $('#new-sim').onclick = () => { ui.newSim = blankEntry(); renderSims(); };
  $$('.rows li').forEach((li) => (li.onclick = () => { ui.simId = li.dataset.id; ui.newSim = null; renderSims(); }));
  if (cur) bindSimForm(cur);
}

function simForm(e) {
  const isNew = Boolean(ui.newSim);
  const tagChecks = Object.entries(S.vocab.tags).map(([k, t]) => `<label><input type="checkbox" name="tags" value="${h(k)}"${e.tags.includes(k) ? ' checked' : ''}> ${h(t.label)}</label>`).join('');
  const used = S.courses.filter((c) => (e.courses ?? []).includes(c.id)).map((c) => c.title);
  return `<form id="sim-form" class="form" autocomplete="off">
  <h2 class="wide">${isNew ? 'Novi simulator' : h(e.title)} <small class="muted">sims/${h(e.id || '…')}/</small></h2>
  <label>id</label><input type="text" name="id" value="${h(e.id)}" ${!isNew ? 'readonly title="id je ime mape; preimenuj mapu ručno"' : ''} required pattern="[a-z0-9]+(-[a-z0-9]+)*">
  <label>naslov</label><input type="text" name="title" value="${h(e.title)}" maxlength="60" required>
  <label>koncept</label><input type="text" name="concept" value="${h(e.concept)}" maxlength="80" required>
  <label>opis</label><textarea name="summary" maxlength="160" required>${h(e.summary)}</textarea>
  <label>stanje</label><select name="status">${opts([['wip', 'u izradi (ne objavljuje se)'], ['ready', 'gotov']], e.status)}</select>
  <label>vrsta</label><select name="class">${opts(Object.entries(STR.classes), e.class)}</select>
  <label>broj koraka</label><input type="number" name="steps" min="1" value="${h(e.steps ?? '')}" title="samo za vrstu 'korak po korak'">
  <label>tema</label><select name="topic">${opts(Object.entries(S.vocab.topics).map(([k, t]) => [k, t.label]), e.topic)}</select>
  <label>oznake</label><div class="checks">${tagChecks}</div>
  <label>razina</label><select name="level">${opts(Object.entries(STR.levels), e.level)}</select>
  <label>jezik</label><select name="lang">${opts([['hr', 'hrvatski'], ['en', 'engleski']], e.lang)}</select>
  <label>sinonimi</label><input type="text" name="aliases" value="${h((e.aliases ?? []).join(', '))}" placeholder="odvojeni zarezom, za pretragu">
  <label>izvor</label><input type="text" name="origin" value="${h(e.origin ?? '')}" placeholder="npr. single-page-labs/x.html">
  <label>slike za provjeru</label><label style="text-align:left"><input type="checkbox" name="asset_review"${e.asset_review ? ' checked' : ''}> treba GPL provjeru</label>
  <div class="wide actions">
    <button type="submit" class="primary">${isNew ? 'Stvori' : 'Spremi'}</button>
    ${isNew ? '<button type="button" id="cancel">Odustani</button>' : ''}
    ${!isNew ? `<span class="muted">${used.length ? `Na kolegijima: ${h(used.join(', '))}` : 'Nije ni na jednom kolegiju'}</span>` : ''}
  </div>
</form>`;
}

function bindSimForm(e) {
  const f = $('#sim-form');
  f.onsubmit = async (ev) => {
    ev.preventDefault();
    const d = new FormData(f);
    const val = (k) => (d.get(k) ?? '').toString().trim();
    const out = {
      ...Object.fromEntries(Object.entries(e).filter(([k]) => !['courses', 'path'].includes(k))),
      id: val('id'), title: val('title'), concept: val('concept'), summary: val('summary'), status: val('status'), class: val('class'),
      topic: val('topic'), tags: d.getAll('tags'), level: val('level'), lang: val('lang'), aliases: csv(val('aliases')),
      origin: val('origin') || undefined, asset_review: d.get('asset_review') ? true : undefined,
    };
    out.steps = out.class === 'stepper' ? Number(val('steps')) || undefined : undefined;
    const isNew = Boolean(ui.newSim);
    const r = await post('/api/entry', { entry: out, oldId: isNew ? null : e.id, create: isNew }, isNew ? 'Stvoreno.' : 'Spremljeno.');
    if (r.ok) { ui.simId = out.id; ui.newSim = null; render(); }
  };
  if ($('#cancel')) $('#cancel').onclick = () => { ui.newSim = null; renderSims(); };
}

// ---------- Courses ----------

function renderCourses() {
  const c = ui.newCourse ?? S.courses.find((x) => x.id === ui.courseId);
  $('#view').innerHTML = `<div class="split">
  <section class="pane">
    <div class="list-tools"><button type="button" id="new-course">+ Novi kolegij</button></div>
    <ul class="rows">${S.courses.map((x) => `<li data-id="${h(x.id)}" class="${x.id === ui.courseId && !ui.newCourse ? 'sel' : ''}"><span>${h(x.title)}</span> <small>${x.sections.reduce((n, s) => n + s.sims.length, 0)} sim.</small></li>`).join('')}</ul>
  </section>
  <section class="pane">${c ? courseForm(c) : '<p class="muted">Kolegij je popis simulatora za studente; objavljuje se kao courses/&lt;id&gt;/.</p>'}</section>
</div>`;
  $('#new-course').onclick = () => { ui.newCourse = { id: '', title: '', lang: 'hr', sections: [{ title: '', sims: [] }] }; renderCourses(); };
  $$('.rows li').forEach((li) => (li.onclick = () => { ui.courseId = li.dataset.id; ui.newCourse = null; renderCourses(); }));
  if (c) bindCourseForm(c);
}

// The course being edited is kept as a draft object; inputs write into it, and Save sends it.
let draft = null;
function courseForm(c) {
  if (!draft || draft._for !== (ui.newCourse ? '' : c.id)) draft = { ...structuredClone(c), _for: ui.newCourse ? '' : c.id };
  const byId = new Map(S.entries.map((e) => [e.id, e]));
  const sections = draft.sections.map((s, si) => `<div class="section" data-si="${si}">
    <div class="list-tools"><input type="text" data-k="stitle" value="${h(s.title ?? '')}" placeholder="Naslov sekcije (neobavezno)">
      <button type="button" class="small" data-act="sup" title="Sekcija gore">↑</button><button type="button" class="small" data-act="sdown" title="Sekcija dolje">↓</button>
      <button type="button" class="small danger" data-act="sdel" title="Ukloni sekciju">✕</button></div>
    <ol>${s.sims.map((id, i) => {
      const e = byId.get(id);
      return `<li data-i="${i}">${e ? h(e.title) : `<span class="tag wip">${h(id)} ne postoji</span>`} ${e?.status === 'wip' ? '<span class="tag wip">u izradi, ne prikazuje se</span>' : ''}${e?.class === 'tool' ? '<span class="tag wip">alat, ne smije na kolegij</span>' : ''}
        <button type="button" class="small" data-act="up">↑</button><button type="button" class="small" data-act="down">↓</button><button type="button" class="small" data-act="del">✕</button></li>`;
    }).join('')}</ol>
    <div class="picker"><input type="search" data-k="add" placeholder="+ dodaj simulator (traži)…"><ul class="suggest" hidden></ul></div>
  </div>`).join('');
  return `<form id="course-form" class="form" autocomplete="off">
  <h2 class="wide">${ui.newCourse ? 'Novi kolegij' : h(c.title)}</h2>
  <label>id (adresa)</label><input type="text" name="id" value="${h(draft.id)}" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="linux-essentials">
  <label>naslov</label><input type="text" name="title" value="${h(draft.title)}" required>
  <label>kratka adresa</label><span><input type="text" name="short" value="${h(draft.short ?? '')}" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="npr. linux" size="16">
    <small class="muted" id="short-url">${draft.short ? h(shortUrl(draft, S.site) ?? '') : 'neobavezno; nginx pravilo je na kartici Objava'}</small></span>
  <label>podnaslov</label><input type="text" name="term" value="${h(draft.term ?? '')}" placeholder="npr. zimski semestar 2026.">
  <label>jezik</label><select name="lang">${opts([['hr', 'hrvatski'], ['en', 'engleski']], draft.lang ?? 'hr')}</select>
  <label>uvod</label><textarea name="intro">${h(draft.intro ?? '')}</textarea>
  <div class="wide">${sections}<button type="button" id="add-section">+ Sekcija</button></div>
  <div class="wide actions">
    <button type="submit" class="primary">${ui.newCourse ? 'Stvori' : 'Spremi'}</button>
    ${ui.newCourse ? '<button type="button" id="cancel">Odustani</button>' : `<button type="button" id="del" class="danger">Obriši</button>
    <a href="/preview/courses/${encodeURIComponent(c.id)}/index.html" target="_blank" id="preview">Pregled</a>`}
  </div>
</form>`;
}

function bindCourseForm(c) {
  const f = $('#course-form');
  for (const k of ['id', 'title', 'term', 'lang', 'intro', 'short']) f.elements[k].addEventListener('input', (ev) => (draft[k] = ev.target.value || undefined));
  f.elements.short.addEventListener('input', () => ($('#short-url').textContent = draft.short ? shortUrl(draft, S.site) ?? '' : ''));
  const rerender = () => { renderCourses(); };
  const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  $$('.section', f).forEach((sec) => {
    const si = Number(sec.dataset.si);
    const s = draft.sections[si];
    $('[data-k=stitle]', sec).addEventListener('input', (ev) => (s.title = ev.target.value));
    sec.addEventListener('click', (ev) => {
      const act = ev.target.dataset?.act;
      if (!act) return;
      const i = Number(ev.target.closest('li')?.dataset.i);
      if (act === 'up') move(s.sims, i, -1);
      else if (act === 'down') move(s.sims, i, 1);
      else if (act === 'del') s.sims.splice(i, 1);
      else if (act === 'sup') move(draft.sections, si, -1);
      else if (act === 'sdown') move(draft.sections, si, 1);
      else if (act === 'sdel') { if (s.sims.length && !confirm('Ukloniti sekciju sa svim simulatorima?')) return; draft.sections.splice(si, 1); }
      rerender();
    });
    const input = $('[data-k=add]', sec);
    const box = $('.suggest', sec);
    const inCourse = new Set(draft.sections.flatMap((x) => x.sims));
    input.addEventListener('input', () => {
      const hits = input.value.trim() ? search(S.entries, S.vocab, input.value).filter((e) => !inCourse.has(e.id) && e.class !== 'tool').slice(0, 12) : [];
      box.hidden = !hits.length;
      box.innerHTML = hits.map((e) => `<li data-id="${h(e.id)}">${h(e.title)} <small class="muted">${h(e.id)}${e.status === 'wip' ? ' · u izradi' : ''}</small></li>`).join('');
    });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); box.querySelector('li')?.click(); }
    });
    box.addEventListener('click', (ev) => {
      const id = ev.target.closest('li')?.dataset.id;
      if (!id) return;
      s.sims.push(id);
      rerender();
      $(`.section[data-si="${si}"] [data-k=add]`)?.focus();
    });
  });
  $('#add-section').onclick = () => { draft.sections.push({ title: '', sims: [] }); rerender(); };
  f.onsubmit = async (ev) => {
    ev.preventDefault();
    const { _for, ...course } = draft;
    course.sections = course.sections.filter((s) => s.sims.length || s.title);
    const r = await post('/api/course', { course, oldId: ui.newCourse ? null : c.id }, 'Spremljeno.');
    if (r.ok) { ui.courseId = course.id; ui.newCourse = null; draft = null; render(); }
  };
  if ($('#cancel')) $('#cancel').onclick = () => { ui.newCourse = null; draft = null; renderCourses(); };
  if ($('#del')) $('#del').onclick = async () => {
    if (!confirm(`Obrisati kolegij "${c.title}"?`)) return;
    const r = await post('/api/course/delete', { id: c.id }, 'Obrisano.');
    if (r.ok) { ui.courseId = null; draft = null; render(); }
  };
  if ($('#preview')) $('#preview').onclick = async (ev) => {
    ev.preventDefault();
    const w = window.open('about:blank', '_blank');
    const r = await (await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    if (!r.ok) { w?.close(); flash(`Pregled nije izgrađen:\n${r.errors.join('\n')}`, false); return; }
    if (w) w.location = ev.target.href;
  };
}

// ---------- Topics and tags ----------

function renderVocab() {
  const use = (k, field) => S.entries.filter((e) => (field === 'topic' ? e.topic === k : e.tags.includes(k))).length;
  const v = structuredClone(S.vocab);
  const row = (kind, k, t) => `<tr data-kind="${kind}" data-k="${h(k)}"><td><code>${h(k)}</code></td><td><input type="text" data-f="label" value="${h(t.label)}"></td>
    ${kind === 'tags' ? `<td><input type="text" data-f="aliases" value="${h((t.aliases ?? []).join(', '))}"></td>` : ''}
    <td>${use(k, kind === 'topics' ? 'topic' : 'tag')}</td><td><button type="button" class="small danger" data-del>✕</button></td></tr>`;
  $('#view').innerHTML = `<div class="split">
  <section class="pane"><h2>Teme</h2><p class="muted">Jedna po simulatoru; po njima se grupira naslovnica. Redoslijed ovdje je redoslijed na stranici.</p>
    <table><tr><th>id</th><th>naziv</th><th>sim.</th><th></th></tr>${Object.entries(v.topics).map(([k, t]) => row('topics', k, t)).join('')}</table>
    <div class="actions"><input type="text" id="new-topic" placeholder="nova-tema"><button type="button" data-add="topics">Dodaj</button></div></section>
  <section class="pane"><h2>Oznake</h2><p class="muted">Pojmovi; simulator ih može imati više. Sinonimi služe pretrazi.</p>
    <table><tr><th>id</th><th>naziv</th><th>sinonimi</th><th>sim.</th><th></th></tr>${Object.entries(v.tags).map(([k, t]) => row('tags', k, t)).join('')}</table>
    <div class="actions"><input type="text" id="new-tags" placeholder="nova-oznaka"><button type="button" data-add="tags">Dodaj</button></div></section>
</div>
<div class="actions"><button type="button" class="primary" id="save-vocab">Spremi teme i oznake</button><span class="muted">Brisanje teme ili oznake koju netko koristi bit će odbijeno.</span></div>`;
  $$('[data-add]').forEach((b) => (b.onclick = () => {
    const kind = b.dataset.add;
    const k = $(kind === 'topics' ? '#new-topic' : '#new-tags').value.trim();
    if (!k) return;
    S.vocab[kind][k] = { label: k };
    renderVocab();
  }));
  $$('[data-del]').forEach((b) => (b.onclick = () => {
    const tr = b.closest('tr');
    delete S.vocab[tr.dataset.kind][tr.dataset.k];
    renderVocab();
  }));
  $$('tr[data-k] input').forEach((inp) => inp.addEventListener('input', () => {
    const tr = inp.closest('tr');
    const t = S.vocab[tr.dataset.kind][tr.dataset.k];
    if (inp.dataset.f === 'label') t.label = inp.value;
    else { const a = csv(inp.value); if (a.length) t.aliases = a; else delete t.aliases; }
  }));
  $('#save-vocab').onclick = () => post('/api/vocab', { vocab: S.vocab }, 'Spremljeno.');
}

// ---------- Publish ----------

function renderPublish() {
  const rules = shortLinkRules(S.courses, S.site);
  $('#view').innerHTML = `<section class="pane">
  <h2>Objava</h2>
  <p>Gradi statičnu stranicu iz radne kopije: naslovnicu, stranice kolegija i gotove simulatore. Simulatori u izradi se ne objavljuju.
  Mapa radi na bilo kojem web poslužitelju ili s USB-a (otvori <code>index.html</code>). Na materijali.online ide samo grana main, naredbom <code>npm run deploy</code>.</p>
  <div class="actions"><button type="button" id="preview-all">Pregled (s nedovršenima)</button></div>
  <div class="actions"><label>Mapa: <input type="text" id="out" size="60" value="${h(S.defaultOut)}"></label>
    <button type="button" class="primary" id="publish">Objavi</button></div>
  <p class="muted">Postojeća mapa se zamjenjuje samo ako ju je ranije izgradio simdeck; inače odaberi praznu ili novu mapu (npr. <code>/media/usb/simdeck</code>).</p>
  <h3>Kratke adrese (nginx)</h3>
  ${rules ? `<p class="muted">Jedno pravilo po kolegiju s kratkom adresom. <code>npm run deploy</code> ih postavlja na poslužitelj (nakon spajanja u main); ovdje su za pregled.</p>
  <textarea id="rules" readonly rows="${Math.min(12, rules.split('\n').length + 1)}">${h(rules)}</textarea>
  <div class="actions"><button type="button" id="copy-rules">Kopiraj</button></div>` : '<p class="muted">Nijedan kolegij još nema kratku adresu (Kolegiji → kratka adresa).</p>'}
  ${S.errors.length ? `<h3>Greške (objava neće proći)</h3><ul>${S.errors.map((e) => `<li>${h(e)}</li>`).join('')}</ul>` : ''}
  ${S.warnings.length ? `<h3>Upozorenja</h3><ul>${S.warnings.map((e) => `<li>${h(e)}</li>`).join('')}</ul>` : ''}
  <div id="result"></div>
</section>`;
  $('#publish').onclick = async () => {
    const r = await (await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ out: $('#out').value }) })).json();
    $('#result').innerHTML = r.ok ? `<p class="msg ok">Objavljeno u ${h(r.out)}.</p>` : `<p class="msg bad">Nije objavljeno:\n${h(r.errors.join('\n'))}</p>`;
  };
  if ($('#copy-rules')) $('#copy-rules').onclick = async () => {
    try { await navigator.clipboard.writeText(rules); flash('Kopirano.', true); } catch { $('#rules').select(); }
  };
  $('#preview-all').onclick = async () => {
    const w = window.open('about:blank', '_blank');
    const r = await (await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    if (r.ok && w) w.location = '/preview/index.html';
    else { w?.close(); flash(`Pregled nije izgrađen:\n${r.errors.join('\n')}`, false); }
  };
}

$$('[data-tab]').forEach((b) => (b.onclick = () => { ui.tab = b.dataset.tab; flash(''); render(); }));
load();
