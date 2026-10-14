import { useState } from 'react';

/**
 * Notice banner explaining browser-local storage persistence.
 * Data is saved locally in the user's browser and is not shared across devices.
 */
export function QuickNoticeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      id="dev-mode-notice-banner"
      role="region"
      aria-label="Local storage persistence notice"
      className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-purple-50/80 px-4 py-3 text-xs sm:text-sm text-indigo-950 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <p className="leading-snug">
            <strong className="font-semibold text-indigo-900">
              Local Storage Mode:
            </strong>{' '}
            Complaints and status updates are saved locally in your browser and persist across page reloads. Data is stored on this device and is not shared across other devices or browsers.
          </p>
        </div>

        <button
          id="btn-dismiss-dev-notice"
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-indigo-600 hover:bg-indigo-100/70 transition-colors"
          aria-label="Dismiss notice"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default QuickNoticeBanner;
