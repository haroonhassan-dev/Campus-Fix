import { useMemo, useState } from 'react';
import type { Complaint } from '../../types/frontend';
import {
  generateReportSummary,
  formatResolutionPercentage,
} from './reportUtils';
import { exportComplaintsToCsv } from './exportCsv';

export interface ReportsPanelProps {
  complaints: Complaint[];
}

export function ReportsPanel({ complaints }: ReportsPanelProps) {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Derive all reporting metrics deterministically from incoming complaints
  const summary = useMemo(() => {
    return generateReportSummary(complaints);
  }, [complaints]);

  const isEmpty = summary.total === 0;

  const handleExportCsv = () => {
    if (isEmpty) {
      setExportNotice('No records available to export.');
      return;
    }

    const success = exportComplaintsToCsv(complaints);
    if (success) {
      setExportNotice(`Exported ${summary.total} complaint record${summary.total === 1 ? '' : 's'} to CSV.`);
    } else {
      setExportNotice('Unable to generate CSV in this browser environment.');
    }
  };

  return (
    <div id="reports-panel-container" className="space-y-8">
      {/* Module Header & Export Action */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden="true" />
            Operational Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Facility Reports & Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Real-time breakdown of campus maintenance workloads, category allocations, severity distributions, and resolution velocity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            id="btn-export-reports-csv"
            type="button"
            onClick={handleExportCsv}
            disabled={isEmpty}
            aria-label="Export complaints data to CSV spreadsheet"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isEmpty
                ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export CSV Report</span>
          </button>
        </div>
      </header>

      {/* Export Feedback Banner */}
      {exportNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-200"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
              i
            </span>
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-bold px-1"
            aria-label="Dismiss export notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Empty State Banner (if no complaint data exists) */}
      {isEmpty && (
        <div
          id="reports-empty-state"
          className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60 sm:p-12"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            No Complaint Records Logged
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            There are currently no facility maintenance requests in the active dataset. As students and faculty submit issues, category distributions, priority counts, and resolution metrics will update automatically.
          </p>
        </div>
      )}

      {/* Section A: Key Summary Metrics */}
      <section aria-labelledby="summary-metrics-title" className="space-y-3">
        <h3 id="summary-metrics-title" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Executive Summary
        </h3>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Complaints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Complaints
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {summary.total.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {summary.total === 0 ? 'No tickets recorded' : 'All facility submissions'}
            </p>
          </div>

          {/* Pending Complaints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Pending Tickets
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
              {summary.pending.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {summary.total > 0
                ? `${Math.round((summary.pending / summary.total) * 100)}% awaiting review`
                : '0% awaiting review'}
            </p>
          </div>

          {/* In-Progress Complaints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              In-Progress Tickets
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-sky-600 dark:text-sky-400">
              {summary.inProgress.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {summary.total > 0
                ? `${Math.round((summary.inProgress / summary.total) * 100)}% under active repair`
                : '0% under active repair'}
            </p>
          </div>

          {/* Resolved Complaints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <dt className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Resolved Tickets
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary.resolved.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {summary.total > 0
                ? `${Math.round((summary.resolved / summary.total) * 100)}% successfully closed`
                : '0% successfully closed'}
            </p>
          </div>

          {/* Resolution Percentage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
            <dt className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Resolution Rate
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              {formatResolutionPercentage(summary.resolutionPercentage)}
            </dd>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {summary.resolved} of {summary.total} resolved
            </p>
          </div>
        </dl>
      </section>

      {/* Section B: Category Analytics */}
      <section aria-labelledby="category-analytics-title" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h3 id="category-analytics-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Complaints by Category
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Proportional distribution of campus issues across facility domains
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {summary.categoryBreakdown.length} unique {summary.categoryBreakdown.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {summary.categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No category data to display.</p>
        ) : (
          <div className="space-y-4">
            {summary.categoryBreakdown.map((item) => {
              const displayPct = Math.round(item.percentage);

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold truncate pr-2">
                      {item.category}
                    </span>
                    <span className="shrink-0 text-slate-500 dark:text-slate-400 text-xs">
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{item.count}</strong> {item.count === 1 ? 'ticket' : 'tickets'} ({displayPct}%)
                    </span>
                  </div>

                  {/* Accessible horizontal progress bar */}
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                    role="progressbar"
                    aria-label={`Category ${item.category} complaint share`}
                    aria-valuenow={displayPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Grid: Priority Analytics (Section C) & Status Analytics (Section D) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section C: Priority Analytics */}
        <section aria-labelledby="priority-analytics-title" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div>
            <h3 id="priority-analytics-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Priority Distribution
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Workload classified by operational urgency level
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.priorityBreakdown.map((item) => {
              const displayPct = Math.round(item.percentage);

              // Distinct visual themes for each priority level
              const theme = {
                urgent: {
                  card: 'border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20',
                  badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
                  bar: 'bg-rose-600 dark:bg-rose-500',
                  sub: 'Critical / emergency action',
                },
                high: {
                  card: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20',
                  badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
                  bar: 'bg-amber-500 dark:bg-amber-400',
                  sub: 'Elevated attention required',
                },
                medium: {
                  card: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20',
                  badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
                  bar: 'bg-blue-500 dark:bg-blue-400',
                  sub: 'Standard campus turnaround',
                },
                low: {
                  card: 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20',
                  badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
                  bar: 'bg-slate-400 dark:bg-slate-500',
                  sub: 'Routine cosmetic maintenance',
                },
              }[item.priority];

              return (
                <div
                  key={item.priority}
                  className={`rounded-2xl border p-4 space-y-3 ${theme.card}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.badge}`}>
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {displayPct}%
                    </span>
                  </div>

                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      {item.count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                      {item.count === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>

                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800"
                    role="progressbar"
                    aria-label={`${item.label} priority ticket share`}
                    aria-valuenow={displayPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-full ${theme.bar}`}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {theme.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section D: Status Analytics */}
        <section aria-labelledby="status-analytics-title" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div>
            <h3 id="status-analytics-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Lifecycle Status Analytics
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Ticket velocity through triage, servicing, and completion
            </p>
          </div>

          {/* Unified lifecycle progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Overall Pipeline Composition</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {formatResolutionPercentage(summary.resolutionPercentage)} Resolved
              </span>
            </div>

            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="progressbar"
              aria-label="Complaint lifecycle distribution"
              aria-valuenow={Math.round(summary.resolutionPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {summary.statusBreakdown.map((item) => {
                if (item.percentage === 0) return null;
                const barColor = {
                  resolved: 'bg-emerald-500',
                  'in-progress': 'bg-sky-500',
                  pending: 'bg-amber-400',
                }[item.status];

                return (
                  <div
                    key={item.status}
                    style={{ width: `${item.percentage}%` }}
                    className={`${barColor} transition-all duration-300`}
                    title={`${item.label}: ${item.count} (${Math.round(item.percentage)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Status Breakdown Detail Cards */}
          <div className="space-y-3">
            {summary.statusBreakdown.map((item) => {
              const displayPct = Math.round(item.percentage);

              const statusConfig = {
                pending: {
                  dot: 'bg-amber-500',
                  labelColor: 'text-amber-800 dark:text-amber-300',
                  badgeBg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60',
                  desc: 'Awaiting triage and technician dispatch',
                },
                'in-progress': {
                  dot: 'bg-sky-500',
                  labelColor: 'text-sky-800 dark:text-sky-300',
                  badgeBg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60',
                  desc: 'Active on-site servicing underway',
                },
                resolved: {
                  dot: 'bg-emerald-500',
                  labelColor: 'text-emerald-800 dark:text-emerald-300',
                  badgeBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60',
                  desc: 'Remediated and verified in full',
                },
              }[item.status];

              return (
                <div
                  key={item.status}
                  className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${statusConfig.badgeBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${statusConfig.dot}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${statusConfig.labelColor}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {statusConfig.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {item.count}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {displayPct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReportsPanel;
