# CampusFix — Reports & Analytics Feature Documentation

## Overview

The Reports & Analytics module provides a standalone, reusable facility intelligence dashboard for **CampusFix**. It aggregates existing complaint records across university facilities into clear, accessible metrics, category distributions, priority breakdowns, and lifecycle status progress without mutating state or modifying shared models.

In addition to visual reporting, the module includes a secure client-side CSV export engine that adheres to strict privacy (PII stripping) and spreadsheet formula-injection defenses.

---

## Architecture & File Map

The module is isolated within four authorized files:

- **`src/features/reports/ReportsPanel.tsx`**: Standalone UI component rendering executive KPI cards, category progress bars, priority distribution, lifecycle pipeline progress, empty-state banners, and CSV export triggers.
- **`src/features/reports/reportUtils.ts`**: Pure, deterministic, strongly-typed calculation functions for computing complaint totals, subtotals, and distribution breakdowns.
- **`src/features/reports/exportCsv.ts`**: Client-side RFC 4180 compliant CSV generator and browser download trigger with automated formula injection defenses and strict PII exclusion.
- **`docs/features/reports.md`**: Feature architecture, utility reference, security protections, verification records, and integration guidelines.

---

## Component Interface & Props

### `ReportsPanel`

```typescript
import type { Complaint } from '../../types/frontend';

export interface ReportsPanelProps {
  /** Array of complaints to analyze and display */
  complaints: Complaint[];
}

export function ReportsPanel({ complaints }: ReportsPanelProps): JSX.Element;

export default ReportsPanel;
```

### Key UI Capabilities

1. **Executive KPI Cards**:
   - **Total Complaints**: Full count of logged facility issues.
   - **Pending Tickets**: Workload awaiting initial triage and assignment.
   - **In-Progress Tickets**: Workload currently being serviced by technicians.
   - **Resolved Tickets**: Total successfully remediated facility issues.
   - **Resolution Rate**: Percentage calculated as `(resolved / total) * 100`, formatted cleanly for display.
2. **Category Analytics**:
   - Shows complaint volume per facility domain (e.g. *Classrooms & Labs*, *Plumbing & Water*, *Hostels*).
   - Proportional horizontal progress bars with textual count and percentage indicators.
3. **Priority Breakdown**:
   - Visual distribution across all 4 severity levels: **Urgent**, **High**, **Medium**, and **Low**.
   - Distinct semantic colors, accessible contrast, count, percentage, and severity descriptors.
4. **Lifecycle Status Analytics**:
   - Multi-segment pipeline visualization showing tickets transitioning from Pending &rarr; In-Progress &rarr; Resolved.
   - Status cards with descriptive action states.
5. **CSV Export Action**:
   - Export button triggering secure browser download.
   - Integrated user notification acknowledging the number of records exported.
6. **Empty State Guard**:
   - Informative empty-state view rendered when `complaints.length === 0`.
   - Displays 0% and 0 ticket metrics safely without throwing errors or rendering `NaN`.

---

## Calculation Utilities (`reportUtils.ts`)

All calculation functions are pure, deterministic, and safe against empty arrays:

| Function | Signature | Return Description | Empty Input Behavior |
| :--- | :--- | :--- | :--- |
| `getTotalComplaints` | `(complaints: Complaint[]) => number` | Total number of complaints | Returns `0` |
| `getPendingComplaints` | `(complaints: Complaint[]) => number` | Number of complaints with `status: 'pending'` | Returns `0` |
| `getInProgressComplaints` | `(complaints: Complaint[]) => number` | Number of complaints with `status: 'in-progress'` | Returns `0` |
| `getResolvedComplaints` | `(complaints: Complaint[]) => number` | Number of complaints with `status: 'resolved'` | Returns `0` |
| `getResolutionPercentage` | `(complaints: Complaint[]) => number` | Exact `(resolved / total) * 100` float | Returns `0` (never `NaN`) |
| `formatResolutionPercentage`| `(pct: number, decimals?: number) => string` | Formatted string (e.g. `"25%"`) | Returns `"0%"` |
| `getComplaintCountsByCategory`| `(complaints: Complaint[]) => Record<string, number>` | Prototype-safe counts mapped by category name | Returns `{}` (`Object.create(null)`) |
| `getComplaintCountsByPriority`| `(complaints: Complaint[]) => Record<ComplaintPriority, number>` | Counts for `urgent`, `high`, `medium`, `low` | All keys default to `0` |
| `getComplaintCountsByStatus`| `(complaints: Complaint[]) => Record<ComplaintStatus, number>` | Counts for `pending`, `in-progress`, `resolved` | All keys default to `0` |
| `generateReportSummary` | `(complaints: Complaint[]) => ReportSummary` | Single-pass aggregate of all metrics & distributions | Complete zeroed summary |

> [!NOTE]
> **Prototype Collision Protection**: `getComplaintCountsByCategory` aggregates counts into a `Map<string, number>` and returns a null-prototype dictionary (`Object.create(null)`). This guarantees that arbitrary category values (such as `__proto__`, `constructor`, or `toString`) cannot collide with, read, or pollute the JavaScript `Object` prototype.

---

## CSV Export & Security (`exportCsv.ts`)

### Non-Personal Field Whitelist

The CSV export strictly limits columns to non-identifying operational fields:

1. `Complaint ID` (`complaint.id`)
2. `Title` (`complaint.title`)
3. `Category` (`complaint.category`)
4. `Priority` (`complaint.priority`)
5. `Status` (`complaint.status`)
6. `Location` (`complaint.location`)
7. `Description` (`complaint.description`)
8. `Created Date` (`complaint.createdAt`)
9. `Updated Date` (`complaint.updatedAt`)
10. `Upvote Count` (`complaint.upvotes`)

### Strict Privacy Protections (PII Exclusion)

To protect student and personnel privacy under university policy, the following fields are **never** exported:

- **`submittedBy`** (Submitter name)
- **`studentId`** (Student / staff registration ID)
- **`contactEmail`** (Submitter email address)
- **`assignedTo`** (Internal technician identifier)

### Spreadsheet Formula Injection Defenses

In spreadsheet programs (Excel, LibreOffice, Google Sheets), cell values starting with `=, +, -, @`, tab, or carriage return can trigger automated formula execution or dynamic data exchange (DDE) vulnerabilities.

- The utility runs `sanitizeForFormulaInjection(value)` on every cell.
- Any string starting with `=, +, -, @, \t, \r` (even after leading whitespace) is prepended with a single apostrophe (`'`).
- The cell is wrapped in quotes according to RFC 4180 rules, forcing spreadsheets to treat the entry strictly as text.

### International Character & Format Compatibility

- Prepend UTF-8 Byte Order Mark (`\uFEFF`) to preserve special characters and accented text in Microsoft Excel.
- Escapes internal double quotes by doubling them (`""`).
- Safely handles multiline descriptions and embedded commas.
- Uses native browser `Blob`, `URL.createObjectURL`, and temporary anchor click download; zero third-party dependencies.
- **Robust Download Lifecycle & DOM Cleanup**: Temporary `<a>` download elements are inserted and cleaned up within a `finally` block to guarantee DOM hygiene even if exceptions occur. Revocation of the created blob URL via `URL.revokeObjectURL` is safely deferred with `setTimeout` to give asynchronous browser download engines sufficient time to stream the file payload before invalidation.

---

## Empty-State Behavior

When the `complaints` array is empty (`complaints = []`):

- **Executive Summary**: All metrics display `0` and Resolution Rate displays `0%`.
- **Division-by-Zero Safety**: `getResolutionPercentage` checks `complaints.length === 0` and returns `0` directly.
- **Visual Alert**: Renders an accessible `#reports-empty-state` dashed container indicating that no records are present yet.
- **Export Guard**: The "Export CSV Report" button is automatically disabled to prevent exporting empty datasets.

---

## Verification & Testing Performed

Independent verification was conducted with zero modifications to existing production code:

1. **Initial Mock Dataset Verification (8 items in `mockComplaints.ts`)**:
   - Total complaints: `8`
   - Status distribution: `pending: 3`, `in-progress: 3`, `resolved: 2` (Sum = 8)
   - Resolution rate: `2 / 8 * 100 = 25.0%` (formatted: `"25%"`)
   - Priority distribution: `urgent: 2`, `high: 3`, `medium: 2`, `low: 1` (Sum = 8)
   - Category distribution: 7 unique campus facility categories (Sum = 8)
2. **Empty Dataset Checks**:
   - Passed with zero errors; returned `0%` and zeroed breakdown objects without `NaN`.
3. **Formula Injection Sanitization Suite**:
   - Verified that `=SUM(...)`, `+cmd...`, `-1+2`, `@hyperlink...`, `   =cmd`, and `\t=1+1` are properly neutralized with leading apostrophe `'`.
   - Verified that interior dashes (e.g. `"CS Block - Room 302"`) are untouched.
4. **CSV RFC 4180 Escaping**:
   - Commas, double quotation marks (`"Urgent"` &rarr; `""Urgent""`), and multiline strings verified.
5. **PII Exclusion Checks**:
   - Verified with test complaint containing secret submitter name, student ID, and email. Confirmed none of these values appeared anywhere in the generated CSV string.
6. **TypeScript & Linter Checks**:
   - `npm.cmd run build`: Passed cleanly (`tsc -b && vite build` &mdash; 0 errors).
   - `npm.cmd run lint`: Passed cleanly (`eslint .` &mdash; 0 warnings, 0 errors).
   - Targeted TS verification: `ReportsPanel` element creation tested with `Complaint[]` props without errors.

---

## Limitations & Boundaries

1. **Standalone Module**: This module is not currently imported into `App.tsx` or linked to the main navigation bar. Integration is reserved for the frontend lead.
2. **Read-Only Scope**: The module analyzes the array passed to it via props; it does not trigger API requests or update ticket status directly.
3. **Unstructured Free-Text Privacy Limitation**: While structured personal fields (`submittedBy`, `studentId`, `contactEmail`) are strictly excluded from the CSV export, this mechanism does not parse or sanitize free-form text entered by users in complaint titles, locations, or descriptions. Consequently, if a user manually inputs names, phone numbers, or private details into those text areas, they may still appear in exported files. Campus administration should ensure submitter guidelines advise against including unnecessary personal info in free-text fields.

---

## Integration Guide (For Frontend Lead)

To integrate the Reports & Analytics view into the main application, follow these steps in your integration branch:

### Step 1: Import the Component

```tsx
import ReportsPanel from './features/reports/ReportsPanel';
```

### Step 2: Add Navigation Tab in `App.tsx` / `Navbar.tsx`

Add `'reports'` to the active tab state:

```tsx
const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'submit' | 'reports'>('dashboard');
```

### Step 3: Render in the Main Shell

```tsx
{activeTab === 'reports' && (
  <ReportsPanel complaints={complaints} />
)}
```
