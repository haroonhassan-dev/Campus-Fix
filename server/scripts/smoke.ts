/**
 * Smoke test: starts the real app on a random port against a temporary data
 * file and checks every endpoint, error path and persistence rule.
 * Run with: npm run smoke   (exits 1 if any check fails)
 */

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.ts';
import { createStore } from '../src/store.ts';

const ORIGIN = 'http://localhost:5173';
let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, info?: unknown): void {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${info === undefined ? '' : `  -> ${JSON.stringify(info)}`}`);
  }
}

async function startServer(dataFile: string) {
  const store = await createStore(dataFile);
  const server = http.createServer(createApp(store, [ORIGIN]));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  const base = `http://localhost:${port}/api`;
  const close = () => new Promise<void>((resolve) => server.close(() => resolve()));
  return { base, close };
}

interface Reply {
  status: number;
  headers: Headers;
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function call(base: string, method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<Reply> {
  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] ??= 'application/json';
  }
  const res = await fetch(base + url, init);
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // leave as text
  }
  return { status: res.status, headers: res.headers, body: parsed };
}

function isErrorEnvelope(body: Reply['body'], code: string): boolean {
  return body?.error?.code === code && typeof body.error.message === 'string' && Array.isArray(body.error.details);
}

const validInput = {
  title: '  Projector not working in Room 12  ',
  description: 'The projector in Room 12 shows no signal from any HDMI port.',
  category: 'Classrooms & Labs',
  priority: 'high',
  location: 'Engineering Hall, Room 12',
};

const dir = await mkdtemp(path.join(os.tmpdir(), 'campusfix-smoke-'));
const dataFile = path.join(dir, 'complaints.json');

try {
  console.log('\n== Seeding, health, list');
  let srv = await startServer(dataFile);
  let r = await call(srv.base, 'GET', '/health');
  check('GET /health -> 200 status ok', r.status === 200 && r.body?.data?.status === 'ok', r.body);
  r = await call(srv.base, 'GET', '/complaints');
  check('GET /complaints -> 200 with 8 seeded complaints', r.status === 200 && r.body?.data?.length === 8, r.status);
  check('data file created with 8 records', JSON.parse(await readFile(dataFile, 'utf8')).length === 8);

  console.log('\n== POST /complaints');
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, status: 'resolved', upvotes: 99, id: 'HACK' });
  const created = r.body?.data;
  check('valid body -> 201', r.status === 201, r.body);
  check('Location header points at the new complaint', r.headers.get('location') === '/api/complaints/CF-1009', r.headers.get('location'));
  check('id continues sequence (CF-1009)', created?.id === 'CF-1009', created?.id);
  check('title trimmed', created?.title === 'Projector not working in Room 12', created?.title);
  check('server-owned fields ignored (status pending, upvotes 1)', created?.status === 'pending' && created?.upvotes === 1, created);
  check('submittedBy defaults to Anonymous Campus Member', created?.submittedBy === 'Anonymous Campus Member');
  check('createdAt is an ISO timestamp', typeof created?.createdAt === 'string' && !Number.isNaN(Date.parse(created.createdAt)));
  check('empty optional fields omitted', !('studentId' in created) && !('contactEmail' in created), created);

  r = await call(srv.base, 'POST', '/complaints', { ...validInput, submittedBy: ' Ali ', studentId: 'FA24-BSE-109', contactEmail: 'ali@campus.edu.pk' });
  check('optional fields accepted and trimmed', r.status === 201 && r.body.data.submittedBy === 'Ali' && r.body.data.studentId === 'FA24-BSE-109', r.body);

  r = await call(srv.base, 'POST', '/complaints', { title: 'abc', description: 'short', location: 'x', category: 'Nope', priority: 'critical' });
  const fields = (r.body?.error?.details ?? []).map((d: { field: string }) => d.field).sort();
  check('invalid body -> 400 VALIDATION_ERROR', r.status === 400 && isErrorEnvelope(r.body, 'VALIDATION_ERROR'), r.body);
  check('details name all 5 bad fields', JSON.stringify(fields) === JSON.stringify(['category', 'description', 'location', 'priority', 'title']), fields);

  r = await call(srv.base, 'POST', '/complaints', { ...validInput, title: '     ' });
  check('whitespace-only title -> "Please provide an issue title."', r.body?.error?.details?.[0]?.message === 'Please provide an issue title.', r.body);
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, title: 'x'.repeat(101) });
  check('101-char title -> 400', r.status === 400 && r.body.error.details[0].field === 'title');
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, description: 'y'.repeat(1001) });
  check('1001-char description -> 400', r.status === 400 && r.body.error.details[0].field === 'description');
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, title: 'x'.repeat(100), description: 'y'.repeat(1000), location: 'abc' });
  check('boundary lengths (100 / 1000 / 3) -> 201', r.status === 201, r.body);
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, contactEmail: 'not-an-email', studentId: '!!' });
  check('bad email + studentId -> 400 on both', r.status === 400 && r.body.error.details.length === 2, r.body);
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, title: 42 });
  check('non-string title -> 400', r.status === 400 && r.body.error.details[0].message === 'title must be a string.', r.body);
  r = await call(srv.base, 'POST', '/complaints', [validInput]);
  check('array body -> 400', r.status === 400 && isErrorEnvelope(r.body, 'VALIDATION_ERROR'), r.body);
  r = await call(srv.base, 'POST', '/complaints', '{"title": "broken', {});
  check('malformed JSON -> 400 INVALID_JSON', r.status === 400 && isErrorEnvelope(r.body, 'INVALID_JSON'), r.body);
  r = await call(srv.base, 'POST', '/complaints', 'title=hi', { 'Content-Type': 'text/plain' });
  check('text/plain body -> 415', r.status === 415 && isErrorEnvelope(r.body, 'UNSUPPORTED_MEDIA_TYPE'), r.body);
  r = await call(srv.base, 'POST', '/complaints');
  check('no body / no Content-Type -> 415', r.status === 415, r.body);
  r = await call(srv.base, 'POST', '/complaints', { ...validInput, description: 'z'.repeat(20_000) });
  check('20 KB body -> 413 PAYLOAD_TOO_LARGE', r.status === 413 && isErrorEnvelope(r.body, 'PAYLOAD_TOO_LARGE'), r.body);

  console.log('\n== PATCH /complaints/:id');
  r = await call(srv.base, 'PATCH', '/complaints/CF-1009', { status: 'in-progress' });
  check('valid status -> 200 full complaint', r.status === 200 && r.body.data.status === 'in-progress' && r.body.data.title === created.title, r.body);
  check('updatedAt set', typeof r.body?.data?.updatedAt === 'string');
  r = await call(srv.base, 'PATCH', '/complaints/CF-1009', { status: 'closed' });
  check('unknown status -> 400', r.status === 400 && isErrorEnvelope(r.body, 'VALIDATION_ERROR'), r.body);
  r = await call(srv.base, 'PATCH', '/complaints/CF-1009', { status: 'resolved', title: 'changed' });
  check('extra field -> 400 (only status may change)', r.status === 400 && r.body.error.details[0].field === 'title', r.body);
  r = await call(srv.base, 'PATCH', '/complaints/CF-1009', {});
  check('missing status -> 400', r.status === 400 && r.body.error.details[0].message === 'status is required.', r.body);
  r = await call(srv.base, 'PATCH', '/complaints/CF-0000', { status: 'resolved' });
  check('unknown id -> 404 COMPLAINT_NOT_FOUND', r.status === 404 && r.body?.error?.message === 'Complaint with ID CF-0000 not found.', r.body);

  console.log('\n== POST /complaints/:id/upvote');
  r = await call(srv.base, 'POST', '/complaints/CF-1001/upvote');
  check('upvote -> 200, 14 -> 15', r.status === 200 && r.body.data.upvotes === 15 && r.body.data.id === 'CF-1001', r.body);
  r = await call(srv.base, 'POST', '/complaints/CF-1001/upvote');
  check('second upvote -> 16 (counter, not toggle)', r.body?.data?.upvotes === 16);
  r = await call(srv.base, 'POST', '/complaints/nope/upvote');
  check('unknown id -> 404', r.status === 404 && isErrorEnvelope(r.body, 'COMPLAINT_NOT_FOUND'), r.body);

  console.log('\n== Routing and CORS');
  r = await call(srv.base, 'GET', '/nothing-here');
  check('unknown route -> 404 ROUTE_NOT_FOUND', r.status === 404 && isErrorEnvelope(r.body, 'ROUTE_NOT_FOUND'), r.body);
  r = await call(srv.base, 'GET', '/complaints', undefined, { Origin: ORIGIN });
  check('allowed origin gets Access-Control-Allow-Origin', r.headers.get('access-control-allow-origin') === ORIGIN);
  r = await call(srv.base, 'GET', '/complaints', undefined, { Origin: 'http://evil.example' });
  check('other origin gets no CORS header', r.headers.get('access-control-allow-origin') === null);
  r = await call(srv.base, 'OPTIONS', '/complaints/CF-1001', undefined, { Origin: ORIGIN, 'Access-Control-Request-Method': 'PATCH' });
  check('PATCH preflight -> 204 allowing PATCH', r.status === 204 && (r.headers.get('access-control-allow-methods') ?? '').includes('PATCH'), r.status);

  console.log('\n== Serialized writes');
  const burst = await Promise.all(
    Array.from({ length: 10 }, (_, i) => call(srv.base, 'POST', '/complaints', { ...validInput, title: `Burst complaint ${i}` }))
  );
  const burstIds = burst.map((b) => b.body?.data?.id);
  check('10 parallel POSTs -> all 201', burst.every((b) => b.status === 201));
  check('10 parallel POSTs -> 10 unique ids', new Set(burstIds).size === 10, burstIds);
  const ups = await Promise.all(Array.from({ length: 10 }, () => call(srv.base, 'POST', '/complaints/CF-1002/upvote')));
  check('10 parallel upvotes -> 28 + 10 = 38', Math.max(...ups.map((u) => u.body.data.upvotes)) === 38);
  const onDisk = JSON.parse(await readFile(dataFile, 'utf8'));
  check('file is valid JSON with every record', onDisk.length === 8 + 3 + 10, onDisk.length);
  check('no leftover temp file', !(await readdir(dir)).some((f) => f.endsWith('.tmp')));
  await srv.close();

  console.log('\n== Persistence across restart');
  srv = await startServer(dataFile);
  r = await call(srv.base, 'GET', '/complaints');
  const after = r.body.data;
  check('restart keeps all 21 complaints', after.length === 21, after.length);
  check('restart keeps status change', after.find((c: { id: string }) => c.id === 'CF-1009')?.status === 'in-progress');
  check('restart keeps upvotes', after.find((c: { id: string }) => c.id === 'CF-1001')?.upvotes === 16);
  r = await call(srv.base, 'POST', '/complaints', validInput);
  check('next id after restart is unique (CF-1022)', r.body?.data?.id === 'CF-1022', r.body?.data?.id);
  await srv.close();

  console.log('\n== Empty array is kept');
  await writeFile(dataFile, '[]');
  srv = await startServer(dataFile);
  r = await call(srv.base, 'GET', '/complaints');
  check('[] file -> GET returns []', r.status === 200 && Array.isArray(r.body.data) && r.body.data.length === 0, r.body);
  check('[] file not overwritten with seed', (await readFile(dataFile, 'utf8')).trim() === '[]');
  r = await call(srv.base, 'POST', '/complaints', validInput);
  check('first id on empty store is CF-1001', r.body?.data?.id === 'CF-1001', r.body?.data?.id);
  await srv.close();

  console.log('\n== Corrupt file is backed up, not lost');
  await writeFile(dataFile, '{not json');
  srv = await startServer(dataFile);
  r = await call(srv.base, 'GET', '/complaints');
  check('corrupt file -> server starts and serves seed', r.status === 200 && r.body.data.length === 8, r.body?.data?.length);
  let backups = (await readdir(dir)).filter((f) => f.includes('.corrupt-'));
  check('one backup holding the original bytes', backups.length === 1 && (await readFile(path.join(dir, backups[0]), 'utf8')) === '{not json', backups);
  await srv.close();
  srv = await startServer(dataFile);
  backups = (await readdir(dir)).filter((f) => f.includes('.corrupt-'));
  check('restart after recovery makes no new backup', backups.length === 1, backups);
  await srv.close();

  const valid = { id: 'CF-2001', title: 't', description: 'd', category: 'Other', priority: 'low', status: 'pending', location: 'l', submittedBy: 's', createdAt: '2026-10-17T00:00:00.000Z' };
  await writeFile(dataFile, JSON.stringify([valid, { ...valid, id: 'CF-2002', status: 'closed' }, valid]));
  srv = await startServer(dataFile);
  r = await call(srv.base, 'GET', '/complaints');
  check('partly invalid file -> keeps only valid record', r.body.data.length === 1 && r.body.data[0].id === 'CF-2001', r.body.data);
  await srv.close();
} catch (err) {
  failed++;
  console.error('Smoke test crashed:', err);
} finally {
  await rm(dir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
