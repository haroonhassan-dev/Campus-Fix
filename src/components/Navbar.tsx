import { useState } from 'react';

interface NavbarProps {
  activeTab: 'dashboard' | 'list' | 'submit';
  setActiveTab: (tab: 'dashboard' | 'list' | 'submit') => void;
  onOpenSubmitModal: () => void;
  totalTicketsCount: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenSubmitModal,
  totalTicketsCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Campus<span className="text-blue-600 dark:text-blue-400">Fix</span>
                </span>
                <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 sm:inline-block">
                  University Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Facility & Complaint Management
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6 dark:border-slate-800"
          >
            <button
              id="nav-link-dashboard"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-link-complaints"
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>All Complaints</span>
              <span className="inline-flex h-5 items-center justify-center rounded-full bg-slate-200/80 px-1.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {totalTicketsCount}
              </span>
            </button>
            <button
              id="nav-link-submit-tab"
              type="button"
              onClick={() => setActiveTab('submit')}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Submit Ticket
            </button>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Quick Primary CTA */}
          <button
            id="nav-btn-report-issue"
            type="button"
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Report Issue</span>
          </button>

          {/* User profile avatar chip */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-xs font-bold text-white">
              ST
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Campus Member
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1.5">
            <button
              id="mobile-nav-dashboard"
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              id="mobile-nav-complaints"
              type="button"
              onClick={() => {
                setActiveTab('list');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'list'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Complaints List</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {totalTicketsCount}
              </span>
            </button>
            <button
              id="mobile-nav-submit"
              type="button"
              onClick={() => {
                setActiveTab('submit');
                setMobileMenuOpen(false);
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'submit'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Submit Complaint
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
