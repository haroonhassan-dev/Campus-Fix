/**
 * Request validation. The rules and messages mirror
 * src/components/ComplaintForm.tsx so the API rejects exactly what the form
 * would. If the form's rules change, change these too.
 */

import type {
  AddComplaintInput,
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
} from '../../src/types/frontend.ts';
import { CATEGORIES } from '../../src/data/mockComplaints.ts';
import { HttpError, type ErrorDetail } from './errors.ts';

export const STATUSES: readonly ComplaintStatus[] = ['pending', 'in-progress', 'resolved'];
export const PRIORITIES: readonly ComplaintPriority[] = ['low', 'medium', 'high', 'urgent'];
const FORM_CATEGORIES: readonly string[] = CATEGORIES.filter((c) => c !== 'All Categories');

// Same patterns as ComplaintForm.tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_REGEX = /^[a-zA-Z0-9\-_/ ]{3,30}$/;

// Same limits as the form's maxLength attributes for fields without a validator
const SUBMITTED_BY_MAX = 80;
const CONTACT_EMAIL_MAX = 100;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireObject(body: unknown): Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.', [
      { field: 'body', message: 'Expected a JSON object.' },
    ]);
  }
  return body;
}

interface TextRule {
  field: keyof AddComplaintInput;
  min: number;
  max: number;
  missing: string;
  tooShort: string;
  tooLong: string;
}

const REQUIRED_TEXT: TextRule[] = [
  {
    field: 'title', min: 5, max: 100,
    missing: 'Please provide an issue title.',
    tooShort: 'Title must be at least 5 characters long.',
    tooLong: 'Title must not exceed 100 characters.',
  },
  {
    field: 'location', min: 3, max: 100,
    missing: 'Please specify the exact building, floor, or room.',
    tooShort: 'Location must be at least 3 characters.',
    tooLong: 'Location must not exceed 100 characters.',
  },
  {
    field: 'description', min: 10, max: 1000,
    missing: 'Please describe the problem in detail.',
    tooShort: 'Description must be at least 10 characters long.',
    tooLong: 'Description must not exceed 1000 characters.',
  },
];

/** Returns the trimmed value, '' when absent; records a type error otherwise. */
function optionalText(body: Record<string, unknown>, field: string, details: ErrorDetail[]): string {
  const value = body[field];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    details.push({ field, message: `${field} must be a string.` });
    return '';
  }
  return value.trim();
}

/**
 * Validate a POST /api/complaints body. Server-owned fields (id, status,
 * upvotes, createdAt, ...) are not part of AddComplaintInput and are ignored.
 */
export function validateAddComplaint(body: unknown): AddComplaintInput {
  const input = requireObject(body);
  const details: ErrorDetail[] = [];
  const text: Record<string, string> = {};

  for (const rule of REQUIRED_TEXT) {
    const value = input[rule.field];
    if (value !== undefined && typeof value !== 'string') {
      details.push({ field: rule.field, message: `${rule.field} must be a string.` });
      continue;
    }
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) details.push({ field: rule.field, message: rule.missing });
    else if (trimmed.length < rule.min) details.push({ field: rule.field, message: rule.tooShort });
    else if (trimmed.length > rule.max) details.push({ field: rule.field, message: rule.tooLong });
    text[rule.field] = trimmed;
  }

  const category = input.category;
  if (typeof category !== 'string' || !FORM_CATEGORIES.includes(category)) {
    details.push({
      field: 'category',
      message: `Category must be one of: ${FORM_CATEGORIES.join(', ')}.`,
    });
  }

  const priority = input.priority;
  if (!PRIORITIES.includes(priority as ComplaintPriority)) {
    details.push({ field: 'priority', message: `Priority must be one of: ${PRIORITIES.join(', ')}.` });
  }

  const submittedBy = optionalText(input, 'submittedBy', details);
  if (submittedBy.length > SUBMITTED_BY_MAX) {
    details.push({ field: 'submittedBy', message: `Name must not exceed ${SUBMITTED_BY_MAX} characters.` });
  }

  const studentId = optionalText(input, 'studentId', details);
  if (studentId && !STUDENT_ID_REGEX.test(studentId)) {
    details.push({
      field: 'studentId',
      message: 'Student / Staff ID may contain letters, numbers, and hyphens (e.g. FA24-BSE-109).',
    });
  }

  const contactEmail = optionalText(input, 'contactEmail', details);
  if (contactEmail && (contactEmail.length > CONTACT_EMAIL_MAX || !EMAIL_REGEX.test(contactEmail))) {
    details.push({
      field: 'contactEmail',
      message: 'Please enter a valid email address (e.g. student@campus.edu.pk or name@gmail.com).',
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Complaint could not be created; check the listed fields.', details);
  }

  return {
    title: text.title,
    description: text.description,
    location: text.location,
    category: category as string,
    priority: priority as ComplaintPriority,
    submittedBy: submittedBy || undefined,
    studentId: studentId || undefined,
    contactEmail: contactEmail || undefined,
  };
}

/** Validate a PATCH /api/complaints/:id body: exactly { status }. */
export function validateStatusUpdate(body: unknown): ComplaintStatus {
  const input = requireObject(body);
  const details: ErrorDetail[] = [];

  for (const key of Object.keys(input)) {
    if (key !== 'status') details.push({ field: key, message: 'Only "status" can be updated.' });
  }
  if (input.status === undefined) {
    details.push({ field: 'status', message: 'status is required.' });
  } else if (!STATUSES.includes(input.status as ComplaintStatus)) {
    details.push({ field: 'status', message: `Status must be one of: ${STATUSES.join(', ')}.` });
  }

  if (details.length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Status could not be updated; check the listed fields.', details);
  }
  return input.status as ComplaintStatus;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

/**
 * Check one record read from the data file. Returns a clean copy with only
 * the known Complaint fields, or null if an essential field is invalid.
 */
export function parseStoredComplaint(value: unknown): Complaint | null {
  if (!isPlainObject(value)) return null;
  const r = value;

  for (const key of ['id', 'title', 'description', 'category', 'location', 'submittedBy', 'createdAt']) {
    if (typeof r[key] !== 'string') return null;
  }
  if ((r.id as string).trim() === '') return null;
  if (!STATUSES.includes(r.status as ComplaintStatus)) return null;
  if (!PRIORITIES.includes(r.priority as ComplaintPriority)) return null;
  for (const key of ['studentId', 'contactEmail', 'updatedAt', 'assignedTo']) {
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
