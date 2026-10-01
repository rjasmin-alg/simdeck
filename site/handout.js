// Ad-hoc handout: handout.html#title=...&ids=a,b,c, built in the index's tray. Same renderer as the
// generated course pages, so what you preview here is what a course file would produce.
/* global renderHandout, escapeHtml -- inlined from core.js */

const DATA = JSON.parse(document.getElementById('simdeck-data').textContent);

function show() {
  const p = new URLSearchParams(location.hash.slice(1));
  const ids = (p.get('ids') ?? '').split(',').filter(Boolean);
  const course = { title: p.get('title') || 'Simulatori', sections: [{ sims: ids }] };
  const { html, skipped } = renderHandout(course, DATA, 0);
  document.title = course.title;
  document.getElementById('handout').innerHTML = ids.length ? html : '<p>Nema odabranih simulatora. Odaberi ih u indeksu (+).</p>';
  const box = document.getElementById('skipped');
  box.hidden = !skipped.length;
  box.innerHTML = skipped.length ? `Izostavljeno: ${skipped.map((s) => `${escapeHtml(s.id)} (${escapeHtml(s.why)})`).join(', ')}` : '';
}
addEventListener('hashchange', show);
show();
