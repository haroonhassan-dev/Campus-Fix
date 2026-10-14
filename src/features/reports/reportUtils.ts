import type { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/frontend';

/**
 * Ordered priority keys from highest to lowest severity.
 */
export const PRIORITY_KEYS: readonly ComplaintPriority[] = ['urgent', 'high', 'medium', 'low'] as const;

/**
 * Ordered status keys representing the complaint lifecycle.
 */
export const STATUS_KEYS: readonly ComplaintStatus[] = ['pending', 'in-progress', 'resolved'] as const;

/**
 * Calculates the total number of complaints.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Total complaint count
 */
export function getTotalComplaints(complaints: Complaint[]): number {
  return complaints.length;
}

/**
 * Calculates the number of pending complaints.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Count of pending complaints
 */
export function getPendingComplaints(complaints: Complaint[]): number {
  return complaints.filter((c) => c.status === 'pending').length;
}

/**
 * Calculates the number of in-progress complaints.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Count of in-progress complaints
 */
export function getInProgressComplaints(complaints: Complaint[]): number {
  return complaints.filter((c) => c.status === 'in-progress').length;
}

/**
 * Calculates the number of resolved complaints.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Count of resolved complaints
 */
export function getResolvedComplaints(complaints: Complaint[]): number {
  return complaints.filter((c) => c.status === 'resolved').length;
}

/**
 * Calculates the resolution percentage: (resolved / total) * 100.
 * Safely returns 0 for an empty complaints array.
 * Note: Raw numeric percentage is returned without rounding; round only for display.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Resolution rate as a number between 0 and 100
 */
export function getResolutionPercentage(complaints: Complaint[]): number {
  if (complaints.length === 0) {
    return 0;
  }
  const resolved = getResolvedComplaints(complaints);
  return (resolved / complaints.length) * 100;
}

/**
 * Formats a raw numeric percentage for user-facing display.
 *
 * @param percentage - Raw percentage value
 * @param decimals - Decimal places to include (default: 0)
 * @returns Formatted percentage string (e.g. "75%" or "75.5%")
 */
export function formatResolutionPercentage(percentage: number, decimals: number = 0): string {
  if (!Number.isFinite(percentage) || percentage <= 0) {
    return '0%';
  }
  if (decimals === 0) {
    return `${Math.round(percentage)}%`;
  }
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Computes complaint counts grouped by category.
 * Uses a prototype-safe collection (Map and Object.create(null)) to ensure
 * arbitrary category values (such as '__proto__', 'constructor', 'toString')
 * cannot collide with or corrupt Object prototype properties.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Prototype-safe Record of category names to numeric counts
 */
export function getComplaintCountsByCategory(complaints: Complaint[]): Record<string, number> {
  const countsMap = new Map<string, number>();
  for (const complaint of complaints) {
    const category = complaint.category?.trim() || 'Uncategorized';
    countsMap.set(category, (countsMap.get(category) ?? 0) + 1);
  }

  const counts: Record<string, number> = Object.create(null);
  for (const [category, count] of countsMap.entries()) {
    counts[category] = count;
  }
  return counts;
}

/**
 * Computes complaint counts grouped by priority.
 * Always populates all standard priority keys ('urgent', 'high', 'medium', 'low') with 0 as minimum.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Record of priority keys to numeric counts
 */
export function getComplaintCountsByPriority(complaints: Complaint[]): Record<ComplaintPriority, number> {
  const counts: Record<ComplaintPriority, number> = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const complaint of complaints) {
    if (complaint.priority in counts) {
      counts[complaint.priority] += 1;
    }
  }
  return counts;
}

/**
 * Computes complaint counts grouped by status.
 * Always populates all standard status keys ('pending', 'in-progress', 'resolved') with 0 as minimum.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Record of status keys to numeric counts
 */
export function getComplaintCountsByStatus(complaints: Complaint[]): Record<ComplaintStatus, number> {
  const counts: Record<ComplaintStatus, number> = {
    pending: 0,
    'in-progress': 0,
    resolved: 0,
  };
  for (const complaint of complaints) {
    if (complaint.status in counts) {
      counts[complaint.status] += 1;
    }
  }
  return counts;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
}

/**
 * Computes category breakdown sorted by count in descending order.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Array of category breakdown items
 */
export function getCategoryBreakdown(complaints: Complaint[]): CategoryBreakdownItem[] {
  const counts = getComplaintCountsByCategory(complaints);
  const total = complaints.length;

  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

export interface PriorityBreakdownItem {
  priority: ComplaintPriority;
  label: string;
  count: number;
  percentage: number;
}

/**
 * Computes priority breakdown sorted in severity order (urgent -> high -> medium -> low).
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Array of priority breakdown items with labels, counts, and percentages
 */
export function getPriorityBreakdown(complaints: Complaint[]): PriorityBreakdownItem[] {
  const counts = getComplaintCountsByPriority(complaints);
  const total = complaints.length;
  const labels: Record<ComplaintPriority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return PRIORITY_KEYS.map((priority) => ({
    priority,
    label: labels[priority],
    count: counts[priority],
    percentage: total > 0 ? (counts[priority] / total) * 100 : 0,
  }));
}

export interface StatusBreakdownItem {
  status: ComplaintStatus;
  label: string;
  count: number;
  percentage: number;
}

/**
 * Computes status breakdown in lifecycle order (pending -> in-progress -> resolved).
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Array of status breakdown items with labels, counts, and percentages
 */
export function getStatusBreakdown(complaints: Complaint[]): StatusBreakdownItem[] {
  const counts = getComplaintCountsByStatus(complaints);
  const total = complaints.length;
  const labels: Record<ComplaintStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
  };

  return STATUS_KEYS.map((status) => ({
    status,
    label: labels[status],
    count: counts[status],
    percentage: total > 0 ? (counts[status] / total) * 100 : 0,
  }));
}

export interface ReportSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  resolutionPercentage: number;
  byCategory: Record<string, number>;
  byPriority: Record<ComplaintPriority, number>;
  byStatus: Record<ComplaintStatus, number>;
  categoryBreakdown: CategoryBreakdownItem[];
  priorityBreakdown: PriorityBreakdownItem[];
  statusBreakdown: StatusBreakdownItem[];
}

/**
 * Generates a complete aggregated report summary for a dataset of complaints.
 *
 * @param complaints - Array of complaints to evaluate
 * @returns Aggregated metrics and breakdown distributions
 */
export function generateReportSummary(complaints: Complaint[]): ReportSummary {
  return {
    total: getTotalComplaints(complaints),
    pending: getPendingComplaints(complaints),
    inProgress: getInProgressComplaints(complaints),
    resolved: getResolvedComplaints(complaints),
    resolutionPercentage: getResolutionPercentage(complaints),
    byCategory: getComplaintCountsByCategory(complaints),
    byPriority: getComplaintCountsByPriority(complaints),
    byStatus: getComplaintCountsByStatus(complaints),
    categoryBreakdown: getCategoryBreakdown(complaints),
    priorityBreakdown: getPriorityBreakdown(complaints),
    statusBreakdown: getStatusBreakdown(complaints),
  };
}
