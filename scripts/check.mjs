#!/usr/bin/env node
// Validates the manifest sources without building: node scripts/check.mjs [--root <dir>]
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepo, validate } from '../lib/manifest.mjs';

const i = process.argv.indexOf('--root');
const root = i > 0 ? resolve(process.argv[i + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const { entries, courses, errors, warnings } = validate(loadRepo(root));
for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
const native = entries.filter((e) => e.kind === 'native').length;
console.log(`${entries.length} entries (${native} native, ${entries.length - native} linked), ${courses.length} courses, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
