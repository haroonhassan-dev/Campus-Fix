# CampusFix — API & End-to-End QA Testing Specification

**Author:** Senior Software QA Engineer & Postman API Testing Specialist  
**Test Suite Target:** CampusFix REST API (`http://localhost:3001/api`) & React Frontend  
**Status:** Test Suite Ready & Validated | HTTP Execution: **NOT RUN** (Backend implementation in progress)

---

## 1. Executive Summary & Testing Strategy

To guarantee seamless integration between the React 19 frontend and the Node.js/Express backend, this testing package establishes:
1. **Automated Postman API Test Suite:** Tests all four REST endpoints for contract adherence, status codes, payload shapes, and negative validation paths.
2. **Comprehensive React UI E2E Checklist:** Validates end-to-end user workflows including ticket submission, live status transitions, upvoting, search/filter matrices, analytics reports, and CSV data export.
3. **Execution Readiness:** All test scripts and assertions are authored. In accordance with QA protocol, automated tests against the running server are marked **`NOT RUN`** until the backend teammate deploys the service on port 3001.

---

## 2. API Contract Test Matrix

All automated requests use the Postman collection at [`tests/CampusFix_API.postman_collection.json`](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/tests/CampusFix_API.postman_collection.json) with environment variables loaded from [`tests/CampusFix_Environment.postman_environment.json`](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/tests/CampusFix_Environment.postman_environment.json).

| Test ID | Method & Route | Scenario / Input | Expected Status | Expected Response Shape | Actual Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-API-01** | `GET /api/complaints` | Fetch complaint inventory | `200 OK` | `{ data: Complaint[] }` (array length $\ge 0$) | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-02** | `POST /api/complaints` | Submit valid complaint with full payload | `201 Created` | `{ data: Complaint }` with `id: "CF-####"`, `status: "pending"`, `upvotes: 1` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-03** | `PATCH /api/complaints/:id` | Transition existing ticket to `"in-progress"` | `200 OK` | `{ data: Complaint }` with updated `status` and `updatedAt` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-04** | `POST /api/complaints/:id/upvote`| Increment community upvote counter | `200 OK` | `{ data: Complaint }` with incremented `upvotes` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-05** | `POST /api/complaints` | Missing mandatory `title` field | `400 Bad Request` | `{ error: { code: "VALIDATION_ERROR", message: "...title..." } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-06** | `POST /api/complaints` | Invalid `priority: "super-critical-urgent"` | `400 Bad Request` | `{ error: { code: "VALIDATION_ERROR", message: "...priority..." } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-07** | `PATCH /api/complaints/:id` | Invalid `status: "archived_invalid"` | `400 Bad Request` | `{ error: { code: "VALIDATION_ERROR", message: "...status..." } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-08** | `PATCH /api/complaints/:id` | Non-existent ticket ID `CF-99999` | `404 Not Found` | `{ error: { code: "NOT_FOUND", message: "...CF-99999..." } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-09** | `POST /api/complaints/:id/upvote`| Non-existent ticket ID `CF-99999` | `404 Not Found` | `{ error: { code: "NOT_FOUND", message: "...CF-99999..." } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-10** | `POST /api/complaints` | Malformed JSON body syntax error | `400 Bad Request` | `{ error: { code: "BAD_REQUEST" } }` | ⏳ **NOT RUN** *(Port 3001 offline)* |
| **TC-API-11** | `GET /api/complaints` | Server process stopped / store unavailable | `503 / 500 / Refused`| Structured error or connection refusal handled | ⏳ **NOT RUN** *(Port 3001 offline)* |

---

## 3. Postman Test Execution Guide

### 3.1 Method A: Postman Desktop Application (GUI)

1. **Import Assets:**
   - Launch Postman.
   - Click **Import** in the top-left corner.
   - Drag and drop:
     - `tests/CampusFix_API.postman_collection.json`
     - `tests/CampusFix_Environment.postman_environment.json`
2. **Select Environment:**
   - In the top-right environment selector, choose **"CampusFix Local Environment"**.
   - Verify that `baseUrl` resolves to `http://localhost:3001/api`.
3. **Execute Collection Runner:**
   - Click the three dots (`...`) next to **CampusFix REST API Test Suite**.
   - Click **Run collection**.
   - Select all test requests.
   - Click **Run CampusFix REST API Test Suite**.
   - View test assertions and green/red status badges.

---

### 3.2 Method B: Headless Automated Execution via Newman CLI

To run the API regression suite automatically from the terminal (or in GitHub Actions CI):

```bash
# Verify Newman is installed or run directly via npx:
npx newman run tests/CampusFix_API.postman_collection.json \
  -e tests/CampusFix_Environment.postman_environment.json \
  --reporters cli
```

**Expected Console Output (When backend is active):**
```
CampusFix REST API Test Suite

  01 - Happy Path Endpoints
    GET /api/complaints - Fetch All Complaints
      ✓ Status code is 200 OK
      ✓ Response conforms to { data: Complaint[] } contract
      ✓ Complaints have valid schema fields
    POST /api/complaints - Create New Complaint
      ✓ Status code is 201 Created
      ✓ Response conforms to { data: Complaint } envelope
    PATCH /api/complaints/:id - Update Complaint Status
      ✓ Status code is 200 OK
      ✓ Complaint status successfully updated to in-progress
    POST /api/complaints/:id/upvote - Upvote Complaint
      ✓ Status code is 200 OK
      ✓ Upvote counter is incremented

  02 - Negative & Validation Test Cases
    POST /api/complaints - Missing Title (Validation Failure)
      ✓ Status code is 400 Bad Request
      ✓ Response conforms to { error: { code, message } } envelope
    POST /api/complaints - Invalid Priority (Validation Failure)
      ✓ Status code is 400 Bad Request
    PATCH /api/complaints/:id - Invalid Status (Validation Failure)
      ✓ Status code is 400 Bad Request
    PATCH /api/complaints/:id - Unknown Complaint ID (404 Not Found)
      ✓ Status code is 404 Not Found
    POST /api/complaints/:id/upvote - Unknown Complaint ID (404 Not Found)
      ✓ Status code is 404 Not Found
    POST /api/complaints - Malformed JSON Body (Syntax Error)
      ✓ Status code is 400 Bad Request
```

---

## 4. End-to-End React UI Integration Checklist

This manual and automated test plan verifies the integrated browser application against the live backend API.

### Pre-conditions
- Backend server running on `http://localhost:3001` with seed data (`CF-1001` through `CF-1008`).
- Frontend running via `npm run dev` at `http://localhost:5173`.
- Vite proxy configured in `vite.config.ts` mapping `/api` to `http://localhost:3001`.

---

### Checklist 1: Complaint Creation Workflow
- [ ] **Modal Launch:** Clicking **"+ New Complaint"** in Navbar or Dashboard opens the `ComplaintForm` modal with focus on the first input.
- [ ] **Client Validation:** Leaving Title, Description, or Location blank and clicking submit highlights invalid fields and blocks submission.
- [ ] **Successful Submission:**
  - Fill Title: `"Broken HVAC Fan in Seminar Hall 3"`.
  - Priority: `"High"`.
  - Category: `"Facilities & Maintenance"`.
  - Location: `"Management Block Room 102"`.
  - Submitter: `"Sarah Jenkins"`.
  - Click **"Submit Complaint"**.
- [ ] **Feedback & State Update:**
  - Submission modal closes automatically.
  - Success toast appears: `"Ticket CF-#### submitted successfully!"`.
  - Newly created ticket immediately appears at the top of the complaints list/grid.
  - KPI counter for Total Complaints increments by 1; Pending complaints increments by 1.

---

### Checklist 2: Status Transition Workflow
- [ ] **Dropdown Interaction:** On any complaint card (e.g. `CF-1002`), locate the status dropdown selector.
- [ ] **Status Mutation:** Select **"In-Progress"**.
- [ ] **Visual Feedback:**
  - `StatusBadge` immediately changes color from Amber (Pending) to Blue (In-Progress) with animated radar pulse.
  - Toast notification appears: `"Ticket CF-1002 status updated to IN-PROGRESS"`.
  - Top statistics cards update: Pending count drops by 1, In-Progress count increases by 1.
- [ ] **Detail Modal Sync:** Click card to open `ComplaintDetailModal`; verify status is displayed as "In-Progress".

---

### Checklist 3: Community Upvote Workflow
- [ ] **Initial Count Check:** Note the initial upvote count on a card (e.g., 28 upvotes on `CF-1002`).
- [ ] **Upvote Trigger:** Click the upvote button (thumbs-up icon).
- [ ] **UI Update:**
  - Upvote count instantly increments to 29.
  - Button state activates with active styling.
- [ ] **Detail Modal Reflection:** Open `ComplaintDetailModal` for the same ticket and confirm upvote count displays 29.

---

### Checklist 4: Refresh & Persistence Verification
- [ ] **Full Browser Refresh:** Press `F5` / `Ctrl+R`.
- [ ] **Data Retained:**
  - The ticket created in Checklist 1 is still present.
  - The status change made in Checklist 2 remains `"in-progress"`.
  - The upvote increment made in Checklist 3 remains 29.
- [ ] **Network Proof:** Inspect Chrome DevTools Network Tab; confirm `GET /api/complaints` returns the persisted records from the backend.

---

### Checklist 5: Filtering, Search & Sorting
- [ ] **Keyword Search:**
  - Type `"Library"` into the search box: complaints list filters to only tickets containing "Library" in title, description, or location.
  - Type a specific ID (e.g. `"CF-1004"`): only ticket `CF-1004` is displayed.
- [ ] **Status Quick Filters:** Click the "Pending" KPI card / status badge: list filters to show only pending tickets.
- [ ] **Category Filter:** Select `"IT & Wi-Fi"` in dropdown: list displays only IT issues.
- [ ] **Priority Filter:** Select `"urgent"`: list shows only urgent issues.
- [ ] **Sorting:**
  - Sort by `"Most Upvotes"`: highest upvoted tickets appear at the top.
  - Sort by `"Newest"`: most recently created tickets appear at the top.
- [ ] **Reset Filters:** Click **"Reset Filters"**: search input clears, category/priority reset, full list re-renders.

---

### Checklist 6: Reports & Analytics Dashboard
- [ ] **Navigation:** Click the **"Reports"** tab in the navigation bar.
- [ ] **Metrics Reconciliation:**
  - Total Complaints matches total tickets in system.
  - Pending, In-Progress, and Resolved counts equal the sum of tickets in those states.
  - Resolution rate percentage calculates correctly ($\frac{\text{Resolved}}{\text{Total}} \times 100\%$).
- [ ] **Visual Breakdown:**
  - Priority breakdown shows proportional bars for Urgent, High, Medium, Low.
  - Category breakdown lists distribution across facilities.

---

### Checklist 7: CSV Data Export
- [ ] **Trigger Export:** In the Reports panel, click the **"Export CSV"** button.
- [ ] **File Delivery:** Browser downloads a file named `campus-complaints-YYYY-MM-DD.csv`.
- [ ] **Integrity Inspection:** Open the CSV in a text editor or Excel:
  - Header row contains: `ID, Title, Description, Category, Priority, Status, Location, Submitted By, Student ID, Contact Email, Created At, Updated At, Upvotes, Assigned To`.
  - Records match all active tickets.
  - Multi-line descriptions and strings with commas are cleanly escaped in quotes (`"..."`).

---

## 5. Bugs & Contract Inconsistencies Discovered

During this QA audit and test suite preparation, five key architectural discrepancies were identified between the frontend codebase and the new REST API contract:

### 1. Data Response Wrapping (`{ data: ... }` vs Raw Array)
- **Agreed Backend Contract:** Returns `{ data: Complaint[] }` and `{ data: Complaint }`.
- **Existing Frontend Expectation:** [complaintService.ts](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/services/complaintService.ts) and [App.tsx](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/App.tsx) expect `getComplaints()` to return `Complaint[]` directly.
- **QA Action Required:** When refactoring [complaintService.ts](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/services/complaintService.ts) to call `fetch()`, the developer must unpack `json.data`:
  ```ts
  const res = await fetch('/api/complaints');
  const json = await res.json();
  return json.data; // Return inner array to preserve App.tsx compatibility
  ```

### 2. Error Payload Structure
- **Agreed Backend Contract:** `{ error: { code: string, message: string, details?: unknown } }`.
- **Frontend Error Handlers:** In [App.tsx](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/App.tsx), error messages are caught via `err.message`.
- **QA Action Required:** The HTTP service adapter must inspect `json.error?.message` and throw an `Error(json.error.message)` so that toast notifications display friendly, readable error descriptions.

### 3. Synchronous `toggleUpvote()` Incompatibility
- **Issue:** [complaintService.ts](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/services/complaintService.ts) defines `toggleUpvote(id: string): Complaint | null` as a synchronous function. A real HTTP `POST /api/complaints/:id/upvote` is asynchronous.
- **QA Action Required:** Update `toggleUpvote` to `async (id: string): Promise<Complaint>` and add `await` in [App.tsx](file:///c:/Users/BURRAQ%20LAPTOPS/Desktop/nescon%20dev%20practice/Campus-Fix/src/App.tsx#L153-L167). As noted in our audit, child component interfaces (`onUpvote: (id: string) => void`) are already compatible with async handlers and require zero changes.

### 4. Port Configuration Alignment
- **Contract Port:** `http://localhost:3001` (specified in the agreed contract).
- **Vite Proxy:** Must map target `http://localhost:3001`. Do not use port 5000 or port 3000.

### 5. Monotonic Upvote Counter vs Toggle
- **Naming Notice:** The function and endpoint are named `toggleUpvote` / `upvote`, but currently neither the backend schema nor localStorage tracks *which* user voted. It functions as an increment counter. For the hackathon MVP, this is acceptable, but per-student voting deduplication will require user identity in future iterations.

---

## 6. Known Limitations
1. **Single-Node Persistence:** The practice backend uses file/in-memory persistence; high-concurrency writes may face lock contention.
2. **No User Authentication:** Any user can change status or upvote any complaint without role verification.
3. **Automated Run Blocked:** Live execution results will be populated immediately once the backend teammate spins up port 3001.
