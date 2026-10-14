# CampusFix — Frontend Reliability & Feature Documentation

This document describes the implemented frontend architecture, user interaction workflows, validation rules, accessibility features, and verification results for CampusFix.

---

## 1. Architecture Overview

CampusFix is built using React 19, TypeScript, and Tailwind CSS. The frontend is organized into modular, decoupled components coordinating state via modern React hooks.

### Component Map
- **`App.tsx`**: Main application shell managing global state, active tab navigation (*Dashboard*, *All Complaints*, *Submit Ticket*), filter synchronization, toast notifications, and modal triggers. Includes top-level skip-to-content navigation and error recovery handling.
- **`Navbar.tsx`**: Header navigation featuring campus branding, ticket counters, primary "Report Issue" action button, accessible tab links, and a mobile drawer with backdrop overlay and keyboard dismiss.
- **`DashboardOverview.tsx`**: Campus announcement hero card, complaint metrics breakdown, and urgent tickets alert queue.
- **`ComplaintFilters.tsx`**: Toolbar providing real-time search, category dropdown, priority filtering, sorting options, status tabs with counters, view mode switcher (Grid vs. List), and reset triggers.
- **`ComplaintList.tsx`**: Container handling complaints display in Grid or List layout, animated skeleton loading placeholders, and empty filter states.
- **`ComplaintCard.tsx`**: Card representation of individual complaints displaying ticket ID, priority chips, status badge, location, relative timestamps, and inline quick status transition selectors.
- **`ComplaintForm.tsx`**: Submission form with on-blur field validation, field-level error messages linked via ARIA attributes, live character counting, submission lock, and ticket confirmation reference card.
- **`ComplaintDetailModal.tsx`**: Deep inspection modal showing ticket progress timeline, location, submitter details, upvotes, and status update actions.
- **`StatusBadge.tsx`**: Visual status indicators (*Pending*, *In Progress*, *Resolved*) with animated pulse dots.
- **`ComplaintStats.tsx`**: Four-column KPI metrics with proportional progress distribution bar.

---

## 2. Implemented Frontend Improvements

### A. Form Validation & Error Messaging
The complaint submission form enforces validation before submission and provides inline feedback on blur or when editing:

| Field | Validation Rules | Error Message / Behavior |
| :--- | :--- | :--- |
| **Title** | Required, 5–100 characters (trimmed) | *"Please provide an issue title."* / *"Title must be at least 5 characters long."* |
| **Location** | Required, 3–100 characters (trimmed) | *"Please specify the exact building, floor, or room."* / *"Location must be at least 3 characters."* |
| **Category** | Required | Selected from predefined campus categories (defaults to Facilities & Maintenance). |
| **Priority** | Required | Selected from Low, Medium, High, Urgent (defaults to Medium). |
| **Description** | Required, 10–1000 characters | *"Please describe the problem in detail."* / *"Description must be at least 10 characters long."* Displays real-time `{length} / 1000` counter. |
| **Contact Email** | Optional | If provided, validates standard email format `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Fully supports `.edu.pk`, `.com`, `.org`, Gmail, etc. |
| **Student / Staff ID** | Optional | If provided, supports standard university formats including hyphenated strings such as `FA24-BSE-109` (`/^[a-zA-Z0-9\-_/ ]{3,30}$/`). |

- **Field Association**: Inputs feature `aria-invalid="true"` when errors are present and `aria-describedby` pointing to the error message container (`role="alert"`).
- **Error Recovery**: Errors are cleared dynamically as the user types a valid value.

### B. Loading & Submission States
- **Double Submission Prevention**: The entire form is disabled via `<fieldset disabled={isSubmitting}>` during active submission.
- **Submission Feedback**: The submit button displays an animated spinner and announces *"Submitting Ticket..."* with `aria-live="polite"`.
- **Skeleton Loaders**: `ComplaintList` renders layout-aware loading skeletons (both grid cards and list rows) with pulsing animations and `aria-busy="true"` status announcements while data is loading.

### C. Mobile Responsiveness
- **Touch Targets**: All interactive elements (buttons, inputs, select dropdowns, priority selector buttons, and suggestion chips) have minimum touch targets of 40–44px.
- **Mobile Navigation Drawer**: Features an auto-closing backdrop overlay when tapped outside, an ESC key handler, and touch-optimized list items.
- **Responsive Layout**: Filter controls automatically adjust from desktop horizontal bars to wrapped mobile layouts without clipping or overflow.
- **Modal Dialog**: Structured with `max-h-[92vh]` and scrollable content bodies so inputs remain accessible on smaller screens and virtual keyboards.

### D. Accessibility (a11y) & Keyboard Navigation
- **Skip Navigation**: Added hidden "Skip to main content" link accessible via keyboard `Tab` focusing directly onto `#main-content`.
- **Visible Focus Outlines**: Global `:focus-visible` styling (`outline: 2px solid #2563eb; outline-offset: 2px`) configured in `index.css`.
- **Keyboard Dismissal**: Modals and the mobile navigation drawer close on `Escape`.
- **ARIA Semantics**:
  - `role="dialog"` and `aria-modal="true"` for overlay dialogs.
  - `role="search"` and `type="search"` on search filters.
  - `role="status"` and `role="alert"` on feedback toasts and error alerts.
  - `aria-pressed` on filter tabs and view mode switchers.

### E. User Feedback for Failed Operations
- **Data Load Recovery**: If the initial data retrieval fails, an accessible alert banner displays the error reason and provides a **"Retry Loading"** action button.
- **Operation Feedback**: Toast system handles `'success'`, `'error'`, and `'info'` states with distinct visual indicators and manual dismiss buttons.
- **Submission Error Alert**: If submission fails, an inline alert banner displays the failure reason and allows the user to correct or retry without losing entered form data.

---

## 3. Data Layer & Integration Contract

The application integrates with the asynchronous in-memory service in `src/services/complaintService.ts` and models in `src/types/frontend.ts`:
- `getComplaints(): Promise<Complaint[]>`
- `addComplaint(input: AddComplaintInput): Promise<Complaint>`
- `updateComplaintStatus(id: string, status: ComplaintStatus): Promise<Complaint>`
- `toggleUpvote(id: string): Complaint | null`

No modifications were made to shared types, mock data, or backend-owned files, preserving complete compatibility for future persistent storage integration.

---

## 4. Verification & Testing Results

- **Production Build**: Executed `npm run build` (`tsc -b && vite build`) successfully with 0 errors.
- **Linter**: Executed `npm run lint` (`eslint .`) with 0 errors and 0 warnings.
- **Browser Interaction Tests**:
  - Validated on-blur error messages for short titles, invalid email formats, and character counts.
  - Verified valid submissions containing hyphenated Student ID (`FA24-BSE-109`) and `.edu.pk` email addresses.
  - Confirmed submission button disables during processing and displays ticket confirmation screen upon completion.
  - Tested mobile drawer open/close behavior, outside backdrop click dismiss, and ESC key listener.
  - Tested keyboard tab navigation through skip link, filter buttons, and dialogs.
