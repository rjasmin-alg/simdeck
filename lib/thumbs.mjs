// SPDX-License-Identifier: AGPL-3.0-or-later
// Thumbnails of the sims for the home page's tiles. scripts/thumbs.mjs shoots them (Playwright) into a cache;
// scripts/build.mjs copies the ones that match the sims it builds. Both find a file by the same key: the built sim
// file's sha256 with the shooting recipe's version, so a sim is shot again only when its built file changes (a kit
// change changes every one, which is right: the kit draws part of every picture).
import { createHash } from 'node:crypto';
import { join } from 'node:path';

/** Bump when the way thumbnails are shot changes (viewport, crop, step, size, quality): every one is shot again. */
export const THUMBS_VERSION = 1;
export const THEMES = ['light'];
export const THUMB_W = 560;
export const THUMB_H = 350;

/** The cache folder under a repo root: gitignored. */
export function cacheDir(root) {
  return join(root, '.cache', 'thumbs');
}

/** The cache file name of a built sim's thumbnail. */
export function thumbKey(builtHtml, theme = 'light') {
  const h = createHash('sha256').update(`simdeck-thumbs ${THUMBS_VERSION}\n`).update(builtHtml).digest('hex');
  return `${h}-${theme}.webp`;
}
