/**
 * Complaint store backed by one local JSON file (an array of Complaint).
 *
 * - The committed list lives in memory; reads never touch the disk.
 * - Every mutation runs inside one queue: it builds the next list, writes it
 *   to disk (temp file + rename), and only then replaces the in-memory list.
 *   Writes never overlap, IDs cannot race, and a failed write changes nothing.
 * - A missing file is seeded with the sample complaints. A valid empty array
 *   stays empty. An unreadable file is copied aside before it is repaired.
 */

import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AddComplaintInput, Complaint, ComplaintStatus } from '../../src/types/frontend.ts';
import { initialComplaints } from '../../src/data/mockComplaints.ts';
import { parseStoredComplaint } from './validation.ts';

export interface ComplaintStore {
  list(): Complaint[];
  count(): number;
  create(input: AddComplaintInput): Promise<Complaint>;
  updateStatus(id: string, status: ComplaintStatus): Promise<Complaint | null>;
  upvote(id: string): Promise<Complaint | null>;
}

function cloneAll(list: Complaint[]): Complaint[] {
  return list.map((c) => ({ ...c }));
}

function parseFile(raw: string): { complaints: Complaint[]; complete: boolean } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { complaints: [], complete: false };
  }
  if (!Array.isArray(data)) return { complaints: [], complete: false };

  const complaints: Complaint[] = [];
  const seen = new Set<string>();
  let complete = true;
  for (const item of data) {
    const complaint = parseStoredComplaint(item);
    if (!complaint || seen.has(complaint.id)) {
      complete = false;
      continue;
    }
    seen.add(complaint.id);
    complaints.push(complaint);
  }
  return { complaints, complete };
}

/** Next CF-#### number: one above the highest in use, never below CF-1001. */
function nextComplaintId(complaints: Complaint[]): string {
  let max = 1000;
  for (const c of complaints) {
    const match = /^CF-(\d+)$/.exec(c.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `CF-${max + 1}`;
}

async function writeAtomic(filePath: string, complaints: Complaint[]): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, `${JSON.stringify(complaints, null, 2)}\n`, 'utf8');
  // On Windows the rename can briefly fail while another process (editor,
  // antivirus) has the file open; retry a few times before giving up.
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(tmp, filePath);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) throw err;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }
}

async function loadInitial(filePath: string): Promise<Complaint[]> {
  let raw: string | null = null;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  if (raw === null) {
    const seeded = cloneAll(initialComplaints);
    await writeAtomic(filePath, seeded);
    console.log(`[campusfix-api] Seeded ${seeded.length} sample complaints into ${filePath}`);
    return seeded;
  }

  const { complaints, complete } = parseFile(raw);
  if (complete) return complaints;

  // Keep the original before replacing anything
  const backupPath = `${filePath}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await copyFile(filePath, backupPath);
  const recovered = complaints.length > 0 ? complaints : cloneAll(initialComplaints);
  await writeAtomic(filePath, recovered);
  console.warn(
    `[campusfix-api] ${filePath} was partly unreadable; kept ${complaints.length} valid record(s)` +
      `${complaints.length === 0 ? ' and re-seeded the sample data' : ''}. Original saved as ${backupPath}`
  );
  return recovered;
}

export async function createStore(filePath: string): Promise<ComplaintStore> {
  await mkdir(path.dirname(filePath), { recursive: true });
  let complaints = await loadInitial(filePath);

  // One queue for every mutation
  let queue: Promise<unknown> = Promise.resolve();
  function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function commit(next: Complaint[]): Promise<void> {
    await writeAtomic(filePath, next);
    complaints = next;
  }

  function updateOne(id: string, change: (c: Complaint) => Complaint): Promise<Complaint | null> {
    return exclusive(async () => {
      const index = complaints.findIndex((c) => c.id === id);
      if (index === -1) return null;
      const updated = change(complaints[index]);
      const next = [...complaints];
      next[index] = updated;
      await commit(next);
      return { ...updated };
    });
  }

  return {
    list: () => cloneAll(complaints),
    count: () => complaints.length,

    create: (input) =>
      exclusive(async () => {
        const complaint: Complaint = {
          id: nextComplaintId(complaints),
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
          status: 'pending',
          location: input.location,
          submittedBy: input.submittedBy || 'Anonymous Campus Member',
          createdAt: new Date().toISOString(),
          upvotes: 1,
        };
        if (input.studentId) complaint.studentId = input.studentId;
        if (input.contactEmail) complaint.contactEmail = input.contactEmail;

        // Newest first, matching the frontend service
        await commit([complaint, ...complaints]);
        return { ...complaint };
      }),

    updateStatus: (id, status) =>
      updateOne(id, (c) => ({ ...c, status, updatedAt: new Date().toISOString() })),

    upvote: (id) => updateOne(id, (c) => ({ ...c, upvotes: (c.upvotes ?? 0) + 1 })),
  };
}
