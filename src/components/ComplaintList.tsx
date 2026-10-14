import type { Complaint, ComplaintStatus, ViewMode } from '../types/frontend';
import ComplaintCard from './ComplaintCard';

interface ComplaintListProps {
  complaints: Complaint[];
  isLoading: boolean;
  viewMode: ViewMode;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onUpvote: (id: string) => void;
  onViewDetails: (complaint: Complaint) => void;
  onResetFilters: () => void;
  onOpenSubmitModal: () => void;
}

export function ComplaintList({
  complaints,
  isLoading,
  viewMode,
  onStatusChange,
  onUpvote,
  onViewDetails,
  onResetFilters,
  onOpenSubmitModal,
}: ComplaintListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex justify-between">
              <div className="h-4 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 h-6 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-2/3 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="mt-8 border-t border-slate-100 pt-4 dark:border-slate-800 flex justify-between">
              <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div
        id="empty-complaints-state"
        className="my-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-12 text-center dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          No complaints match your criteria
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
          We couldn't find any complaints matching your active search keywords or category and status filters.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            id="btn-empty-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Clear Filters
          </button>
          <button
            id="btn-empty-submit-ticket"
            type="button"
            onClick={onOpenSubmitModal}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
          >
            Submit New Ticket
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div id="complaints-list-container" className="space-y-3.5">
        {complaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            viewMode="list"
            onStatusChange={onStatusChange}
            onUpvote={onUpvote}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      id="complaints-grid-container"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          viewMode="grid"
          onStatusChange={onStatusChange}
          onUpvote={onUpvote}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export default ComplaintList;
