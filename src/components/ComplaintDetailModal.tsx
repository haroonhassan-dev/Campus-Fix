import { useEffect } from 'react';
import type { Complaint, ComplaintStatus } from '../types/frontend';
import StatusBadge from './StatusBadge';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  onUpvote: (id: string) => void;
}

export function ComplaintDetailModal({
  complaint,
  onClose,
  onStatusChange,
  onUpvote,
}: ComplaintDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!complaint) return null;

  const steps = [
    { key: 'submitted', label: 'Submitted', done: true },
    {
      key: 'in-progress',
      label: 'In Progress / Assigned',
      done: complaint.status === 'in-progress' || complaint.status === 'resolved',
    },
    { key: 'resolved', label: 'Resolved', done: complaint.status === 'resolved' },
  ];

  return (
    <div
      id="modal-complaint-detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detail-title"
    >
      <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Close Button */}
        <button
          id="btn-detail-close-x"
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close dialog"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded-lg">
            {complaint.id}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {complaint.category}
          </span>
          <StatusBadge status={complaint.status} size="md" showDot={true} />
        </div>

        {/* Title */}
        <h2
          id="modal-detail-title"
          className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          {complaint.title}
        </h2>

        {/* Progress Timeline */}
        <div className="my-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Ticket Resolution Progress
          </p>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
            {steps.map((step, idx) => (
              <div key={step.key} className="flex flex-col items-center z-10 text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step.done
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                  }`}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              {complaint.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <span className="font-semibold text-slate-500">Location</span>
              <p className="mt-1 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {complaint.location}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <span className="font-semibold text-slate-500">Submitted By</span>
              <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {complaint.submittedBy}
                {complaint.studentId && ` (${complaint.studentId})`}
              </p>
              {complaint.contactEmail && (
                <p className="text-[11px] text-slate-500">{complaint.contactEmail}</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <span className="font-semibold text-slate-500">Reported At</span>
              <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {new Date(complaint.createdAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <span className="font-semibold text-slate-500">Assignment</span>
              <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {complaint.assignedTo || 'Unassigned (Campus Facilities Dispatch Queue)'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Update Ticket Status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStatusChange(complaint.id, 'pending')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    complaint.status === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Mark Pending
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(complaint.id, 'in-progress')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    complaint.status === 'in-progress'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(complaint.id, 'resolved')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    complaint.status === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => onUpvote(complaint.id)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
                <span>Upvote ({complaint.upvotes ?? 0})</span>
              </button>
              <button
                id="btn-detail-close-bottom"
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetailModal;
