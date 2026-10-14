import type { FilterState, ViewMode, ComplaintStatus, ComplaintPriority } from '../types/frontend';
import { CATEGORIES } from '../data/mockComplaints';

interface ComplaintFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  statusCounts: {
    all: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  totalFilteredCount: number;
  totalUnfilteredCount: number;
  onResetFilters: () => void;
}

export function ComplaintFilters({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  statusCounts,
  totalFilteredCount,
  totalUnfilteredCount,
  onResetFilters,
}: ComplaintFiltersProps) {
  const isFiltered =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.category !== 'All Categories' ||
    filters.priority !== 'all';

  const statusOptions: Array<{ key: 'all' | ComplaintStatus; label: string; count: number }> = [
    { key: 'all', label: 'All Issues', count: statusCounts.all },
    { key: 'pending', label: 'Pending', count: statusCounts.pending },
    { key: 'in-progress', label: 'In Progress', count: statusCounts.inProgress },
    { key: 'resolved', label: 'Resolved', count: statusCounts.resolved },
  ];

  return (
    <div
      id="complaints-filter-toolbar"
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top Row: Search Input + Sort Dropdown + View Mode */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="filter-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search complaints by title, description, room, or ticket ID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {filters.search && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Category Dropdown */}
          <div className="relative min-w-[170px] flex-1 sm:flex-initial">
            <select
              id="filter-category-select"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Priority Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              id="filter-priority-select"
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priority: e.target.value as 'all' | ComplaintPriority,
                }))
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative min-w-[140px] flex-1 sm:flex-initial">
            <select
              id="filter-sort-select"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState['sortBy'],
                }))
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="priority">Sort: Priority</option>
              <option value="upvotes">Sort: Most Upvoted</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              id="view-mode-grid-btn"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              id="view-mode-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="List View"
              aria-label="List View"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Quick Tabs + Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((opt) => {
            const isActive = filters.status === opt.key;
            return (
              <button
                key={opt.key}
                id={`filter-status-tab-${opt.key}`}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, status: opt.key }))}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? 'bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter & Clear Filters Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{totalFilteredCount}</strong> of{' '}
            {totalUnfilteredCount} complaints
          </span>

          {isFiltered && (
            <button
              id="btn-reset-filters"
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComplaintFilters;
