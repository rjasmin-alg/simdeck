#!/usr/bin/env node
// The editorial side: a small local web app for editing simulators, tags and courses, previewing,
// and publishing the static site. It writes the same files you could edit by hand (sim.json,
// courses/*.json, tags.json); git tracks the changes. It is never published.
//
// Usage: node scripts/admin.mjs [--port 5300] [--host 127.0.0.1] [--root <repo>]
// Then open http://127.0.0.1:5300/. From another machine, use an SSH tunnel rather than --host.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve, normalize, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { adminState, saveEntry, createSim, saveCourse, deleteCourse, saveVocab } from '../lib/store.mjs';
import { build } from './build.mjs';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(arg('--root', APP)); // the content being edited; the app's own files stay in APP
const PORT = Number(arg('--port', 5300));
const HOST = arg('--host', '127.0.0.1');
const PREVIEW = mkdtempSync(join(tmpdir(), 'simdeck-preview-'));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
const STATIC = {
  '/': join(APP, 'admin', 'index.html'),
  '/admin.js': join(APP, 'admin', 'admin.js'),
  '/admin.css': join(APP, 'admin', 'admin.css'),
  '/core.js': join(APP, 'site', 'core.mjs'),
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function sendFile(res, path) {
  if (!existsSync(path) || !statSync(path).isFile()) return send(res, 404, 'not found', 'text/plain');
  send(res, 200, readFileSync(path), TYPES[extname(path)] ?? 'application/octet-stream');
}

/** Serves a file from `base` without letting "../" escape it. Folders get index.html. */
function serveFrom(res, base, rel) {
  let p = normalize(join(base, decodeURIComponent(rel)));
  if (p !== base && !p.startsWith(base + sep)) return send(res, 403, 'forbidden', 'text/plain');
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  sendFile(res, p);
}

const API = {
  'GET /api/state': () => ({ ...adminState(ROOT), defaultOut: join(ROOT, 'dist') }),
  'POST /api/entry': (b) => (b.create ? createSim(ROOT, b.entry) : saveEntry(ROOT, b.entry, { oldId: b.oldId ?? null })),
  'POST /api/course': (b) => saveCourse(ROOT, b.course, { oldId: b.oldId ?? null }),
  'POST /api/course/delete': (b) => deleteCourse(ROOT, b.id),
  'POST /api/vocab': (b) => saveVocab(ROOT, b.vocab),
  'POST /api/preview': () => build({ root: ROOT, out: PREVIEW, drafts: true, log: () => {} }),
  'POST /api/publish': (b) => {
    const out = resolve(ROOT, String(b.out || join(ROOT, 'dist')));
    const r = build({ root: ROOT, out, log: () => {} });
    return { ok: r.ok, errors: r.errors, warnings: r.warnings, out };
  },
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const key = `${req.method} ${url.pathname}`;
  if (req.method === 'GET' && STATIC[url.pathname]) return sendFile(res, STATIC[url.pathname]);
  if (req.method === 'GET' && url.pathname.startsWith('/preview/')) return serveFrom(res, PREVIEW, url.pathname.slice('/preview/'.length));
  const handler = API[key];
  if (!handler) return send(res, 404, { ok: false, errors: [`no route ${key}`] });
  if (req.method === 'GET') return send(res, 200, handler());
  // Writes come only from this app's own page: JSON bodies, same origin.
  const origin = req.headers.origin;
  if (req.headers['content-type'] !== 'application/json' || (origin && origin !== `http://${req.headers.host}`)) {
    return send(res, 403, { ok: false, errors: ['writes are accepted only from the admin page'] });
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      send(res, 200, handler(body ? JSON.parse(body) : {}));
    } catch (e) {
      send(res, 500, { ok: false, errors: [String(e.message ?? e)] });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`simdeck admin: http://${HOST}:${PORT}/  (editing ${ROOT})`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost') console.warn('warning: listening beyond this machine, and the admin has no login');
});
