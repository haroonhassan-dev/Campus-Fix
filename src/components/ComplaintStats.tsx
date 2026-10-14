import type { ReactNode } from 'react';
import StatusBadge from './StatusBadge';

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
  /** Optional callback when a stat card is clicked for fast filtering */
  onSelectStatus?: (status: 'all' | 'pending' | 'in-progress' | 'resolved') => void;
  /** Active selected filter status to highlight card */
  activeStatus?: string;
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
  isSelected?: boolean;
  onClick?: () => void;
}

function StatCard({
  id,
  label,
  count,
  badgeStatus,
  icon,
  iconBg,
  iconColor,
  borderColor,
  subtext,
  isSelected,
  onClick,
}: StatCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <div
      id={id}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 dark:bg-slate-900 ${borderColor} ${
        isSelected
          ? 'ring-2 ring-blue-600 shadow-md scale-[1.01]'
          : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      } ${isInteractive ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {count.toLocaleString()}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform group-hover:scale-110 duration-200`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtext}
        </span>
        {badgeStatus && (
          <StatusBadge status={badgeStatus} size="sm" showDot={true} />
        )}
      </div>
    </div>
  );
}

/**
 * ComplaintStats renders an overview summary of campus tickets: total, pending,
 * in-progress, and resolved complaints, along with a proportional distribution bar.
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
  onSelectStatus,
  activeStatus = 'all',
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

  // If explicit total is not provided, calculate sum of parts
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
          <div>
            {title && (
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {onSelectStatus && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Click any card to filter
            </span>
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
          subtext={totalCount === 0 ? 'No tickets recorded' : 'All campus tickets'}
          accentBg="bg-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/60"
          iconColor="text-blue-600 dark:text-blue-400"
          borderColor="border-slate-200 dark:border-slate-800"
          isSelected={activeStatus === 'all'}
          onClick={onSelectStatus ? () => onSelectStatus('all') : undefined}
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
          subtext={`${pendingPct}% awaiting review`}
          accentBg="bg-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-950/60"
          iconColor="text-amber-600 dark:text-amber-400"
          borderColor="border-slate-200 dark:border-slate-800"
          isSelected={activeStatus === 'pending'}
          onClick={onSelectStatus ? () => onSelectStatus('pending') : undefined}
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
          isSelected={activeStatus === 'in-progress'}
          onClick={onSelectStatus ? () => onSelectStatus('in-progress') : undefined}
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
          isSelected={activeStatus === 'resolved'}
          onClick={onSelectStatus ? () => onSelectStatus('resolved') : undefined}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Overall Resolution Breakdown</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{resolvedPct}% Resolved</span>
          </div>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-label="Complaint distribution"
            aria-valuenow={resolvedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {resolvedPct > 0 && (
              <div
                style={{ width: `${resolvedPct}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Resolved: ${resolvedCount} (${resolvedPct}%)`}
              />
            )}
            {inProgressPct > 0 && (
              <div
                style={{ width: `${inProgressPct}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`In Progress: ${inProgressCount} (${inProgressPct}%)`}
              />
            )}
            {pendingPct > 0 && (
              <div
                style={{ width: `${pendingPct}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Pending: ${pendingCount} (${pendingPct}%)`}
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Resolved: <strong className="text-slate-800 dark:text-slate-200">{resolvedCount}</strong> ({resolvedPct}%)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                In Progress: <strong className="text-slate-800 dark:text-slate-200">{inProgressCount}</strong> ({inProgressPct}%)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Pending: <strong className="text-slate-800 dark:text-slate-200">{pendingCount}</strong> ({pendingPct}%)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Total campus workload: {totalCount} tickets
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default ComplaintStats;
