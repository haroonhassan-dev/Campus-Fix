import type { ReactNode } from 'react';
import StatusBadge from './StatusBadge.tsx';

export interface ComplaintStatsProps {
  /** Numeric count of total complaints */
  total?: number;
  /** Numeric count of pending complaints */
  pending?: number;
  /** Numeric count of in-progress complaints */
  inProgress?: number;
  /** Kebab-case alias for in-progress complaints */
  'in-progress'?: number;
  /** Snake_case alias for in-progress complaints */
  in_progress?: number;
  /** Numeric count of resolved complaints */
  resolved?: number;
  /** Optional nested counts object */
  stats?: {
    total?: number;
    pending?: number;
    inProgress?: number;
    'in-progress'?: number;
    in_progress?: number;
    resolved?: number;
  };
  /** Optional dashboard section title */
  title?: string;
  /** Optional dashboard subtitle / description */
  description?: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show proportional breakdown bar (default: true) */
  showDistributionBar?: boolean;
}

interface StatCardProps {
  id: string;
  label: string;
  count: number;
  badgeStatus?: string;
  icon: ReactNode;
  accentBg: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  subtext: string;
}

function StatCard({
  id,
  label,
  count,
  badgeStatus,
  icon,
  accentBg,
  iconBg,
  iconColor,
  borderColor,
  subtext,
}: StatCardProps) {
  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-slate-900 ${borderColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </dt>
          <dd className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {count.toLocaleString()}
          </dd>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {subtext}
        </span>
        {badgeStatus && (
          <StatusBadge status={badgeStatus} size="sm" showDot={true} />
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${accentBg}`}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * ComplaintStats displays numeric counts for total, pending, in-progress,
 * and resolved complaints across the CampusFix application.
 */
export function ComplaintStats({
  total,
  pending,
  inProgress,
  'in-progress': inProgressKebab,
  in_progress: inProgressSnake,
  resolved,
  stats,
  title,
  description,
  className = '',
  showDistributionBar = true,
}: ComplaintStatsProps) {
  // Normalize individual counts, prioritizing direct props over stats object, defaulting safely to 0
  const pendingCount = Math.max(0, pending ?? stats?.pending ?? 0);
  const inProgressCount = Math.max(
    0,
    inProgress ??
      inProgressKebab ??
      inProgressSnake ??
      stats?.inProgress ??
      stats?.['in-progress'] ??
      stats?.in_progress ??
      0
  );
  const resolvedCount = Math.max(0, resolved ?? stats?.resolved ?? 0);

  // If explicit total is not provided, calculate sum of the parts
  const computedSum = pendingCount + inProgressCount + resolvedCount;
  const totalCount = Math.max(0, total ?? stats?.total ?? computedSum);

  const pendingPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const inProgressPct = totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0;
  const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <section
      aria-label="Complaint Statistics Dashboard"
      className={`w-full space-y-4 ${className}`.trim()}
    >
      {(title || description) && (
        <div className="mb-2">
          {title && (
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Main 4-column Stats Grid */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Complaints */}
        <StatCard
          id="stat-total-complaints"
          label="Total Complaints"
          count={totalCount}
          subtext={totalCount === 0 ? 'No tickets recorded' : 'All submitted tickets'}
          accentBg="bg-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/60"
          iconColor="text-blue-600 dark:text-blue-400"
          borderColor="border-slate-200 dark:border-slate-800"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />

        {/* Pending Complaints */}
        <StatCard
          id="stat-pending-complaints"
          label="Pending Complaints"
          count={pendingCount}
          badgeStatus="pending"
          subtext={`${pendingPct}% of total complaints`}
          accentBg="bg-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-950/60"
          iconColor="text-amber-600 dark:text-amber-400"
          borderColor="border-slate-200 dark:border-slate-800"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* In-Progress Complaints */}
        <StatCard
          id="stat-inprogress-complaints"
          label="In-Progress Complaints"
          count={inProgressCount}
          badgeStatus="in-progress"
          subtext={`${inProgressPct}% being handled`}
          accentBg="bg-sky-500"
          iconBg="bg-sky-50 dark:bg-sky-950/60"
          iconColor="text-sky-600 dark:text-sky-400"
          borderColor="border-slate-200 dark:border-slate-800"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />

        {/* Resolved Complaints */}
        <StatCard
          id="stat-resolved-complaints"
          label="Resolved Complaints"
          count={resolvedCount}
          badgeStatus="resolved"
          subtext={`${resolvedPct}% resolution rate`}
          accentBg="bg-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-950/60"
          iconColor="text-emerald-600 dark:text-emerald-400"
          borderColor="border-slate-200 dark:border-slate-800"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </dl>

      {/* Distribution Progress Bar */}
      {showDistributionBar && totalCount > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Complaint Status Breakdown</span>
            <span>{resolvedPct}% Resolved</span>
          </div>
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-label="Complaint distribution"
            aria-valuenow={resolvedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {resolvedPct > 0 && (
              <div
                style={{ width: `${resolvedPct}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Resolved: ${resolvedCount} (${resolvedPct}%)`}
              />
            )}
            {inProgressPct > 0 && (
              <div
                style={{ width: `${inProgressPct}%` }}
                className="bg-sky-500 transition-all duration-300"
                title={`In Progress: ${inProgressCount} (${inProgressPct}%)`}
              />
            )}
            {pendingPct > 0 && (
              <div
                style={{ width: `${pendingPct}%` }}
                className="bg-amber-400 transition-all duration-300"
                title={`Pending: ${pendingCount} (${pendingPct}%)`}
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Resolved ({resolvedCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              In Progress ({inProgressCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Pending ({pendingCount})
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default ComplaintStats;
