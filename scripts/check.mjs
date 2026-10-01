#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Validates the manifest sources and the shared models (models/) without building: node scripts/check.mjs [--root <dir>]
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate } from '../lib/manifest.mjs';
import { checkModels } from '../lib/models.mjs';

const i = process.argv.indexOf('--root');
const root = i > 0 ? resolve(process.argv[i + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = loadRepo(root);
const { entries, courses, errors, warnings } = validate(repo);
errors.push(...checkModels(root, repo.natives));
for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`${entries.length} sims, ${courses.length} courses, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
