/**
 * Frontend Type Definitions for CampusFix
 * 
 * Note: Core backend contracts for src/types/complaint.ts are managed by the backend teammate.
 * These types match the agreed data model and service contracts for seamless integration.
 */

export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string;
  submittedBy: string;
  studentId?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt?: string;
  upvotes?: number;
  assignedTo?: string;
}

export interface AddComplaintInput {
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  location: string;
  submittedBy?: string;
  contactEmail?: string;
  studentId?: string;
}

export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  status: 'all' | ComplaintStatus;
  category: string;
  priority: 'all' | ComplaintPriority;
  sortBy: 'newest' | 'oldest' | 'priority' | 'upvotes';
}
