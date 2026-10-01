// The only script on the published site: filter the list as you type; Enter opens the first match.
// Each item carries its search words in data-s (lower case, no diacritics), written by the build.
const q = document.getElementById('q');
const fold = (s) => s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '');
function filter() {
  if (!document.querySelector('li[data-s]')) return; // nothing published yet: the page says so itself
  const words = fold(q.value).split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const li of document.querySelectorAll('li[data-s]')) {
    const hit = words.every((w) => li.dataset.s.includes(w));
    li.hidden = !hit;
    shown += hit;
  }
  for (const s of document.querySelectorAll('main section')) s.hidden = !s.querySelector('li:not([hidden])');
  document.getElementById('none').hidden = shown > 0;
}
q.addEventListener('input', filter);
q.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.querySelector('li[data-s]:not([hidden]) a')?.click();
  if (e.key === 'Escape') { q.value = ''; filter(); }
});
addEventListener('keydown', (e) => {
  if (e.key === '/' && e.target !== q) { e.preventDefault(); q.focus(); q.select(); }
});
filter();
