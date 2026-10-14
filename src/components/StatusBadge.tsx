import type { HTMLAttributes } from 'react';

export type StandardStatusKey =
  | 'pending'
  | 'in-progress'
  | 'resolved'
  | 'rejected'
  | 'open'
  | 'other';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The status string to display (e.g. 'pending', 'in-progress', 'resolved', etc.) */
  status: string;
  /** Size variant for badge sizing */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a colored indicator dot */
  showDot?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Normalizes any raw status string into a recognized standard category key.
 */
function normalizeStatus(rawStatus: string): StandardStatusKey {
  if (!rawStatus) return 'other';
  const cleaned = rawStatus.trim().toLowerCase().replace(/[\s_]+/g, '-');

  if (cleaned === 'pending' || cleaned === 'waiting' || cleaned === 'queued') {
    return 'pending';
  }
  if (
    cleaned === 'in-progress' ||
    cleaned === 'inprogress' ||
    cleaned === 'progress' ||
    cleaned === 'ongoing' ||
    cleaned === 'under-review' ||
    cleaned === 'in-review'
  ) {
    return 'in-progress';
  }
  if (
    cleaned === 'resolved' ||
    cleaned === 'fixed' ||
    cleaned === 'closed' ||
    cleaned === 'completed' ||
    cleaned === 'done'
  ) {
    return 'resolved';
  }
  if (
    cleaned === 'rejected' ||
    cleaned === 'declined' ||
    cleaned === 'cancelled' ||
    cleaned === 'canceled' ||
    cleaned === 'dismissed'
  ) {
    return 'rejected';
  }
  if (cleaned === 'open' || cleaned === 'new' || cleaned === 'active' || cleaned === 'submitted') {
    return 'open';
  }

  return 'other';
}

/**
 * Formats a raw status string into a clear, user-friendly presentation label.
 */
function formatStatusLabel(rawStatus: string): string {
  if (!rawStatus) return 'Unknown';
  const key = normalizeStatus(rawStatus);

  switch (key) {
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    case 'open':
      return 'Open';
    default:
      return rawStatus
        .replace(/[-_]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }
}

interface StatusTheme {
  badge: string;
  dot: string;
  dotPing?: string;
}

const statusThemes: Record<StandardStatusKey, StatusTheme> = {
  pending: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    dotPing: 'bg-amber-400',
  },
  'in-progress': {
    badge: 'bg-blue-50 text-blue-800 border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-600',
    dotPing: 'bg-blue-400',
  },
  resolved: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  rejected: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'bg-rose-500',
  },
  open: {
    badge: 'bg-sky-50 text-sky-800 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    dot: 'bg-sky-500',
  },
  other: {
    badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

const sizeStyles = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1.5',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    container: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
    dot: 'h-2 w-2',
  },
  lg: {
    container: 'px-3.5 py-1.5 text-sm gap-2',
    dot: 'h-2.5 w-2.5',
  },
};

/**
 * StatusBadge displays the status of a complaint clearly with distinct color coding,
 * accessible markup, and clean typography.
 */
export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
  ...rest
}: StatusBadgeProps) {
  const normalizedKey = normalizeStatus(status);
  const displayLabel = formatStatusLabel(status);
  const theme = statusThemes[normalizedKey];
  const sizeConfig = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      role="status"
      aria-label={`Status: ${displayLabel}`}
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${theme.badge} ${sizeConfig.container} ${className}`.trim()}
      {...rest}
    >
      {showDot && (
        <span className="relative flex shrink-0" aria-hidden="true">
          {theme.dotPing && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotPing}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full ${sizeConfig.dot} ${theme.dot}`}
          />
        </span>
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
