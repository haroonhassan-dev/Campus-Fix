import type { Complaint, ComplaintStatus } from '../types/frontend';
import ComplaintStats from './ComplaintStats';
import StatusBadge from './StatusBadge';

interface DashboardOverviewProps {
  complaints: Complaint[];
  onOpenSubmitModal: () => void;
  onSelectStatusFilter: (status: 'all' | 'pending' | 'in-progress' | 'resolved') => void;
  onViewDetails: (complaint: Complaint) => void;
  onStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  activeStatusFilter: string;
}

export function DashboardOverview({
  complaints,
  onOpenSubmitModal,
  onSelectStatusFilter,
  onViewDetails,
  activeStatusFilter,
}: DashboardOverviewProps) {
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const totalCount = complaints.length;

  const urgentComplaints = complaints.filter(
    (c) => (c.priority === 'urgent' || c.priority === 'high') && c.status !== 'resolved'
  );

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-1/3 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Live Campus Infrastructure Portal
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Report, Track, and Resolve Campus Facilities Fast
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Empowering students, faculty, and administration to keep laboratories, hostels, and academic halls in peak operational condition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-hero-submit-issue"
              type="button"
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 active:scale-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Submit Complaint</span>
            </button>
            <button
              id="btn-hero-view-all"
              type="button"
              onClick={() => onSelectStatusFilter('all')}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-all"
            >
              View All Tickets
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Section with interactive distribution bar */}
      <ComplaintStats
        total={totalCount}
        pending={pendingCount}
        inProgress={inProgressCount}
        resolved={resolvedCount}
        title="Campus Ticket Overview"
        description="Real-time breakdown of submitted facility issues and maintenance operations"
        onSelectStatus={onSelectStatusFilter}
        activeStatus={activeStatusFilter}
      />

      {/* Urgent Issues Alert Bar */}
      {urgentComplaints.length > 0 && (
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-4 sm:p-5 dark:border-rose-900/60 dark:bg-rose-950/30 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Critical Campus Tickets Requiring Immediate Action ({urgentComplaints.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              High / Urgent Priority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentComplaints.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => onViewDetails(item)}
                className="cursor-pointer flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3.5 hover:shadow-md transition-all dark:border-rose-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[11px] font-bold text-rose-600">{item.id}</span>
                    <StatusBadge status={item.status} size="sm" showDot={true} />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    📍 {item.location}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardOverview;
