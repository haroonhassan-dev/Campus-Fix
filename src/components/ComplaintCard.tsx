import { useState } from 'react';
import type { Complaint, ComplaintStatus, ViewMode } from '../types/frontend';
import StatusBadge from './StatusBadge';

interface ComplaintCardProps {
  complaint: Complaint;
  viewMode: ViewMode;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onUpvote: (id: string) => void;
  onViewDetails: (complaint: Complaint) => void;
}

const priorityStyles = {
  urgent: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    indicator: 'bg-rose-500',
    label: 'Urgent',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    indicator: 'bg-amber-500',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/60',
    indicator: 'bg-yellow-500',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    indicator: 'bg-slate-400',
    label: 'Low',
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function ComplaintCard({
  complaint,
  viewMode,
  onStatusChange,
  onUpvote,
  onViewDetails,
}: ComplaintCardProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const priorityInfo = priorityStyles[complaint.priority] || priorityStyles.medium;

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ComplaintStatus;
    if (newStatus === complaint.status) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(complaint.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <article
        id={`complaint-card-${complaint.id}`}
        className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
              {complaint.id}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              {complaint.category}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityInfo.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${priorityInfo.indicator}`} />
              {priorityInfo.label}
            </span>
            <StatusBadge status={complaint.status} size="sm" showDot={true} />
          </div>

          <h3
            onClick={() => onViewDetails(complaint)}
            className="cursor-pointer text-base font-bold text-slate-900 hover:text-blue-600 transition-colors dark:text-slate-100 dark:hover:text-blue-400 line-clamp-1"
          >
            {complaint.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
            {complaint.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {complaint.location}
            </span>
            <span>By {complaint.submittedBy}</span>
            <span>{formatRelativeTime(complaint.createdAt)}</span>
          </div>
        </div>

        {/* List Actions */}
        <div className="flex items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
          {/* Quick Status Select */}
          <div className="relative">
            <select
              id={`select-status-${complaint.id}`}
              value={complaint.status}
              disabled={isUpdatingStatus}
              onChange={handleStatusSelect}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Upvote button */}
          <button
            id={`btn-upvote-${complaint.id}`}
            type="button"
            onClick={() => onUpvote(complaint.id)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Upvote / Me Too"
          >
            <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
            <span>{complaint.upvotes ?? 0}</span>
          </button>

          {/* Details CTA */}
          <button
            id={`btn-view-details-${complaint.id}`}
            type="button"
            onClick={() => onViewDetails(complaint)}
            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Details
          </button>
        </div>
      </article>
    );
  }

  // Grid Card View
  return (
    <article
      id={`complaint-card-${complaint.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-slate-400">
              {complaint.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityInfo.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${priorityInfo.indicator}`} />
              {priorityInfo.label}
            </span>
          </div>

          <StatusBadge status={complaint.status} size="sm" showDot={true} />
        </div>

        {/* Category Chip */}
        <div className="mt-3">
          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {complaint.category}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetails(complaint)}
          className="mt-2.5 cursor-pointer text-base font-bold tracking-tight text-slate-900 hover:text-blue-600 transition-colors dark:text-slate-100 dark:hover:text-blue-400 line-clamp-2"
        >
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
          {complaint.description}
        </p>

        {/* Location Pin */}
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{complaint.location}</span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <span className="truncate">By {complaint.submittedBy}</span>
          <span>{formatRelativeTime(complaint.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Quick Status Updater */}
          <div className="relative flex-1">
            <select
              id={`select-status-grid-${complaint.id}`}
              value={complaint.status}
              disabled={isUpdatingStatus}
              onChange={handleStatusSelect}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-6 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="pending">Status: Pending</option>
              <option value="in-progress">Status: In Progress</option>
              <option value="resolved">Status: Resolved</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Upvote button */}
          <button
            id={`btn-upvote-grid-${complaint.id}`}
            type="button"
            onClick={() => onUpvote(complaint.id)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Upvote / Me Too"
          >
            <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
            <span>{complaint.upvotes ?? 0}</span>
          </button>

          {/* Details CTA */}
          <button
            id={`btn-details-grid-${complaint.id}`}
            type="button"
            onClick={() => onViewDetails(complaint)}
            className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default ComplaintCard;
