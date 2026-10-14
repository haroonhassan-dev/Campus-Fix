/**
 * CampusFix Complaint Service — browser-local persistence layer
 *
 * Implements the agreed contract functions:
 * - getComplaints(): Promise<Complaint[]>
 * - addComplaint(input: AddComplaintInput): Promise<Complaint>
 * - updateComplaintStatus(id: string, status: ComplaintStatus): Promise<Complaint>
 * - toggleUpvote(id: string): Complaint | null
 *
 * Complaints are stored in localStorage under STORAGE_KEY. Every operation
 * re-reads storage before writing, so a second open tab does not overwrite the
 * first tab's changes. If localStorage is unavailable (private mode, blocked
 * site data, quota), the service keeps working from an in-memory copy for the
 * rest of the session. See docs/features/backend.md for the full rules.
 */

import type {
  Complaint,
  AddComplaintInput,
  ComplaintStatus,
  ComplaintPriority,
} from '../types/frontend';
import { initialComplaints } from '../data/mockComplaints';

const STORAGE_KEY = 'campusfix:complaints:v1';
// Raw copy of any stored value that could not be fully read, kept for recovery
const BACKUP_KEY = `${STORAGE_KEY}:backup`;

const STATUSES: readonly ComplaintStatus[] = ['pending', 'in-progress', 'resolved'];
const PRIORITIES: readonly ComplaintPriority[] = ['low', 'medium', 'high', 'urgent'];

// Fallback store, used only when localStorage cannot be read or written
let memoryStore: Complaint[] | null = null;
// Set once storage has failed, so we stop touching it for this session
let storageDisabled = false;

function cloneComplaint(c: Complaint): Complaint {
  return { ...c };
}

function cloneAll(list: Complaint[]): Complaint[] {
  return list.map(cloneComplaint);
}

function getStorage(): Storage | null {
  if (storageDisabled) return null;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Accessing localStorage itself throws when site data is blocked
    return null;
  }
}

function disableStorage(reason: unknown): void {
  if (!storageDisabled) {
    console.warn('[complaintService] localStorage unavailable; changes will last for this session only.', reason);
  }
  storageDisabled = true;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

/**
 * Validate one stored record. Returns a clean copy holding only the known
 * Complaint fields, or null when an essential field is missing or invalid.
 */
function parseComplaint(value: unknown): Complaint | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;

  const requiredStrings = ['id', 'title', 'description', 'category', 'location', 'submittedBy', 'createdAt'];
  for (const key of requiredStrings) {
    if (typeof r[key] !== 'string') return null;
  }
  if ((r.id as string).trim() === '') return null;
  if (!STATUSES.includes(r.status as ComplaintStatus)) return null;
  if (!PRIORITIES.includes(r.priority as ComplaintPriority)) return null;

  const optionalStrings = ['studentId', 'contactEmail', 'updatedAt', 'assignedTo'];
  for (const key of optionalStrings) {
    if (!isOptionalString(r[key])) return null;
  }
  if (
    r.upvotes !== undefined &&
    (typeof r.upvotes !== 'number' || !Number.isFinite(r.upvotes) || r.upvotes < 0)
  ) {
    return null;
  }

  const complaint: Complaint = {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    category: r.category as string,
    priority: r.priority as ComplaintPriority,
    status: r.status as ComplaintStatus,
    location: r.location as string,
    submittedBy: r.submittedBy as string,
    createdAt: r.createdAt as string,
  };
  if (r.studentId !== undefined) complaint.studentId = r.studentId as string;
  if (r.contactEmail !== undefined) complaint.contactEmail = r.contactEmail as string;
  if (r.updatedAt !== undefined) complaint.updatedAt = r.updatedAt as string;
  if (r.upvotes !== undefined) complaint.upvotes = r.upvotes as number;
  if (r.assignedTo !== undefined) complaint.assignedTo = r.assignedTo as string;
  return complaint;
}

/**
 * Parse the raw stored string. `complete` is false when anything had to be
 * dropped (bad JSON, not an array, invalid or duplicate records).
 */
function parseStored(raw: string): { complaints: Complaint[]; complete: boolean } {
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
    const complaint = parseComplaint(item);
    if (!complaint || seen.has(complaint.id)) {
      complete = false;
      continue;
    }
    seen.add(complaint.id);
    complaints.push(complaint);
  }
  return { complaints, complete };
}

function writeStore(complaints: Complaint[]): void {
  memoryStore = cloneAll(complaints);
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    // Quota exceeded or storage blocked mid-session: keep going in memory
    disableStorage(err);
  }
}

/**
 * Load the current complaint list. Seeds the sample data only when the key
 * has never been written; a stored empty array stays empty.
 */
function readStore(): Complaint[] {
  const storage = getStorage();
  if (!storage) {
    if (!memoryStore) memoryStore = cloneAll(initialComplaints);
    return cloneAll(memoryStore);
  }

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch (err) {
    disableStorage(err);
    return readStore();
  }

  if (raw === null) {
    const seeded = cloneAll(initialComplaints);
    writeStore(seeded);
    return seeded;
  }

  const { complaints, complete } = parseStored(raw);
  if (complete) {
    memoryStore = cloneAll(complaints);
    return complaints;
  }

  // Some or all stored data was unreadable. Keep the raw value before
  // replacing anything, so nothing the user saved is lost without a copy.
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch (err) {
    // Without a backup we must not overwrite the original; stay in memory
    disableStorage(err);
    memoryStore = complaints.length > 0 ? complaints : cloneAll(initialComplaints);
    return cloneAll(memoryStore);
  }

  const recovered = complaints.length > 0 ? complaints : cloneAll(initialComplaints);
  console.warn(
    `[complaintService] Stored complaints were partly invalid; kept ${complaints.length} valid record(s). ` +
      `The original value was saved under "${BACKUP_KEY}".`
  );
  writeStore(recovered);
  return cloneAll(recovered);
}

/**
 * Next ID in the existing CF-#### sequence: one above the highest number in
 * use, never below the original CF-1001 start. IDs that survive only in the
 * recovery backup are counted too, so restoring it can never collide.
 */
function nextComplaintId(complaints: Complaint[]): string {
  let max = 1000;
  for (const c of complaints) {
    const match = /^CF-(\d+)$/.exec(c.id);
    if (match) max = Math.max(max, Number(match[1]));
  }

  let backup: string | null = null;
  try {
    backup = getStorage()?.getItem(BACKUP_KEY) ?? null;
  } catch {
    // No backup readable; the stored list alone decides
  }
  if (backup) {
    for (const match of backup.matchAll(/"CF-(\d+)"/g)) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `CF-${max + 1}`;
}

/**
 * Fetch all complaints currently recorded.
 */
export async function getComplaints(): Promise<Complaint[]> {
  // Simulate brief network latency for realistic loading states
  await new Promise((resolve) => setTimeout(resolve, 150));
  return readStore();
}

/**
 * Add a new complaint to the system.
 */
export async function addComplaint(input: AddComplaintInput): Promise<Complaint> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const complaints = readStore();
  const newComplaint: Complaint = {
    id: nextComplaintId(complaints),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category || 'Facilities & Maintenance',
    priority: input.priority || 'medium',
    status: 'pending',
    location: input.location.trim(),
    submittedBy: input.submittedBy?.trim() || 'Anonymous Campus Member',
    studentId: input.studentId?.trim() || undefined,
    contactEmail: input.contactEmail?.trim() || undefined,
    createdAt: new Date().toISOString(),
    upvotes: 1,
  };

  // Prepend to store so newly added tickets appear at the top
  writeStore([newComplaint, ...complaints]);
  return cloneComplaint(newComplaint);
}

/**
 * Update the status of an existing complaint ('pending' | 'in-progress' | 'resolved').
 */
export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<Complaint> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!STATUSES.includes(status)) {
    throw new Error(`Invalid complaint status: ${String(status)}.`);
  }

  const complaints = readStore();
  const index = complaints.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Complaint with ID ${id} not found.`);
  }

  const updated: Complaint = {
    ...complaints[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  complaints[index] = updated;
  writeStore(complaints);

  return cloneComplaint(updated);
}

/**
 * Toggle or increment upvote for student issues
 */
export function toggleUpvote(id: string): Complaint | null {
  const complaints = readStore();
  const index = complaints.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = complaints[index];
  const updated: Complaint = {
    ...current,
    upvotes: (current.upvotes || 0) + 1,
  };
  complaints[index] = updated;
  writeStore(complaints);

  return cloneComplaint(updated);
}
