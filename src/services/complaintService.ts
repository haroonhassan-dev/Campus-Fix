/**
 * CampusFix Frontend Complaint Service
 * 
 * Implements the agreed contract functions:
 * - getComplaints(): Promise<Complaint[]>
 * - addComplaint(input: AddComplaintInput): Promise<Complaint>
 * - updateComplaintStatus(id: string, status: ComplaintStatus): Promise<Complaint>
 * 
 * NOTE FOR BACKEND INTEGRATION:
 * The backend teammate is implementing src/types/complaint.ts and src/lib/complaints.ts.
 * This frontend service uses in-memory sample data for visual development and UI verification.
 * Once src/lib/complaints.ts is ready, this client service can effortlessly delegate to the
 * backend library without changing any frontend component code.
 */

import type { Complaint, AddComplaintInput, ComplaintStatus } from '../types/frontend';
import { initialComplaints } from '../data/mockComplaints';

// In-memory working store initialized with sample data
let complaintsStore: Complaint[] = [...initialComplaints];

/**
 * Fetch all complaints currently recorded.
 */
export async function getComplaints(): Promise<Complaint[]> {
  // Simulate brief network latency for realistic loading states
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [...complaintsStore];
}

/**
 * Add a new complaint to the system.
 */
export async function addComplaint(input: AddComplaintInput): Promise<Complaint> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const newIdNumber = complaintsStore.length + 1001;
  const newComplaint: Complaint = {
    id: `CF-${newIdNumber}`,
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
  complaintsStore = [newComplaint, ...complaintsStore];
  return newComplaint;
}

/**
 * Update the status of an existing complaint ('pending' | 'in-progress' | 'resolved').
 */
export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<Complaint> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const index = complaintsStore.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Complaint with ID ${id} not found.`);
  }

  const updated: Complaint = {
    ...complaintsStore[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  complaintsStore = [
    ...complaintsStore.slice(0, index),
    updated,
    ...complaintsStore.slice(index + 1),
  ];

  return updated;
}

/**
 * Toggle or increment upvote for student issues
 */
export function toggleUpvote(id: string): Complaint | null {
  const index = complaintsStore.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = complaintsStore[index];
  const updated: Complaint = {
    ...current,
    upvotes: (current.upvotes || 0) + 1,
  };

  complaintsStore = [
    ...complaintsStore.slice(0, index),
    updated,
    ...complaintsStore.slice(index + 1),
  ];

  return updated;
}
