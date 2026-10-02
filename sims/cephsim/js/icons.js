// SPDX-License-Identifier: AGPL-3.0-or-later
// Inline SVG glyphs. No sprite sheet, no font, no network — a glyph is a string
// of SVG children drawn into a 24x24 box, stroked with currentColor.

export const ICONS = {
  host: '<rect class="s" x="3" y="6" width="18" height="12" rx="2"/>'
      + '<circle class="f" cx="7" cy="12" r="1.4"/><path class="s" d="M11 12h6"/>',
  switchbox: '<rect class="s" x="2.5" y="8" width="19" height="8" rx="2"/>'
      + '<path class="s" d="M6 8V5M10 8V5M14 8V5M18 8V5"/>',
  disk: '<rect class="s" x="4" y="4" width="16" height="16" rx="2.5"/>'
      + '<circle class="s" cx="12" cy="12" r="4"/><circle class="f" cx="12" cy="12" r="1.2"/>',
  rack: '<rect class="s" x="5" y="3" width="14" height="18" rx="2"/>'
      + '<path class="s" d="M5 9h14M5 15h14"/>',
  root: '<path class="s" d="M12 4v6M6 20v-4a6 6 0 0 1 12 0v4"/><circle class="f" cx="12" cy="4" r="2"/>',
  pool: '<ellipse class="s" cx="12" cy="7" rx="7" ry="3"/>'
      + '<path class="s" d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/>',
  link: '<path class="s" d="M9 15l6-6M8.5 12.5l-2 2a3 3 0 0 0 4 4l2-2M15.5 11.5l2-2a3 3 0 0 0-4-4l-2 2"/>',
  warn: '<path class="s" d="M12 4.5 21 19H3z"/><path class="s" d="M12 10v4"/><circle class="f" cx="12" cy="16.6" r="1"/>',
};

/** `<g class="ico">…</g>` translated so the 24x24 box lands where you asked. */
export function iconFor(key, { x = 0, y = 0, size = 24 } = {}) {
  const body = ICONS[key] || ICONS.host;
  const k = size / 24;
  return `<g class="ico" transform="translate(${x} ${y}) scale(${k})">${body}</g>`;
}
