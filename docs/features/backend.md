# CampusFix — Complaint Persistence (Browser-Local Data Layer)

This document describes how CampusFix stores complaints, the public service API the frontend depends on, the error-handling rules, and the verification results for the persistence sprint.

> **Scope:** this is client-side persistence only. Complaints are saved in the browser's `localStorage`. There is **no server, database, authentication, or shared multi-user storage** in this release.

---

## 1. Storage Architecture

| Item | Value |
| :--- | :--- |
| Module | `src/services/complaintService.ts` (the only file the frontend imports for complaint data) |
| Storage | `window.localStorage` |
| Primary key | `campusfix:complaints:v1` — a JSON array of `Complaint` objects |
| Backup key | `campusfix:complaints:v1:backup` — the raw stored value, written only when stored data had to be repaired |
| Data model | `Complaint`, `AddComplaintInput`, `ComplaintStatus`, `ComplaintPriority` from `src/types/frontend.ts` (reused, not duplicated) |
| Seed data | `initialComplaints` from `src/data/mockComplaints.ts` (unchanged) |

The `v1` suffix on the key versions the stored format. A future change to the shape can use a `v2` key and migrate from `v1` instead of misreading old data.

**Read-modify-write per operation.** Every service call reads the current list from `localStorage`, applies its change, and writes the whole list back. The service does not keep a long-lived in-memory copy as the source of truth. When two tabs are used one after the other, each operation starts from the other tab's latest saved state. A tab's *screen* does not refresh by itself, though: it shows the other tab's changes after its next reload.

**No atomicity across tabs.** `localStorage` has no transactions or locks. If two tabs of the same browser write at almost the same moment, the later write replaces the whole list. The earlier tab's change (for example a new complaint) can then be lost, and both tabs may have shown the same new ID. This persistence layer gives **no** database-level concurrency guarantees. Within a single tab, operations run one at a time and are safe.

**Safe copies.** Every complaint returned by the service is a fresh object. Mutating a returned complaint in a component does not change what is stored.

---

## 2. Initialization and Seeding

On every read (`getComplaints()` and before each write):

| Stored value under `campusfix:complaints:v1` | Result |
| :--- | :--- |
| Key does not exist (first visit) | The 8 sample complaints are loaded **and saved**. Later refreshes read them back, not reseed them. |
| Valid array of complaints | Used as-is. |
| Valid empty array `[]` | Stays empty. **Not** reseeded. |
| Array where some records are invalid | Valid records are kept; invalid ones are dropped. The original raw value is saved under the backup key first, and a console warning names it. |
| Not valid JSON, or valid JSON that is not an array | Raw value saved under the backup key, then the sample data is loaded so the app is usable. |

Seeded IDs (`CF-1001` … `CF-1008`) are kept exactly as they appear in `mockComplaints.ts`.

---

## 3. Public Service API (unchanged)

The signatures and sync/async behaviour are identical to the previous in-memory service. No React component or `App.tsx` change was needed.

```ts
getComplaints(): Promise<Complaint[]>
addComplaint(input: AddComplaintInput): Promise<Complaint>
updateComplaintStatus(id: string, status: ComplaintStatus): Promise<Complaint>
toggleUpvote(id: string): Complaint | null   // synchronous
```

| Function | Behaviour |
| :--- | :--- |
| `getComplaints` | Returns the stored list (newest submissions first, as before). Keeps the existing 150 ms simulated latency used by the loading skeletons. |
| `addComplaint` | Same defaults as before: trims `title`, `description`, `location`, `submittedBy`, `studentId`, `contactEmail`; status `pending`; category falls back to `Facilities & Maintenance`, priority to `medium`, submitter to `Anonymous Campus Member`; empty optional fields become `undefined`; `createdAt` is the current ISO time; `upvotes: 1`. The new complaint is prepended and saved. |
| `updateComplaintStatus` | Sets `status` and `updatedAt` (current ISO time), saves, and returns the updated complaint. Throws `Error("Complaint with ID <id> not found.")` for an unknown ID, and an error for a status outside `pending` / `in-progress` / `resolved`. |
| `toggleUpvote` | Increments `upvotes` by 1 (a missing count is treated as 0), saves, and returns the updated complaint. Returns `null` for an unknown ID. It is a counter, not a per-user toggle, which is the behaviour the UI already shows. |

### ID generation
New IDs continue the existing `CF-####` sequence: one above the highest `CF-` number in use, never below `CF-1001`. "In use" means the stored list **plus** any `CF-` numbers that appear in the recovery backup. A record that was dropped as invalid therefore keeps its number reserved, and restoring the backup later cannot produce a clash. With the sample data the first new ticket is `CF-1009`, which is what the old service produced.

Because the number comes from the stored data rather than the list length, IDs stay unique across reloads. Several creations fired at once in one tab still get distinct IDs, because each write happens synchronously after the simulated delay. Existing IDs are never renumbered. If stored data ever contains the same ID twice, only the first record is kept and the original is backed up. The one case uniqueness cannot cover is a simultaneous write from two tabs, described in §1.

---

## 4. Validation and Error-Handling Rules

**Record validation.** A stored record is accepted only if:
- `id` (non-empty), `title`, `description`, `category`, `location`, `submittedBy`, `createdAt` are strings;
- `status` is one of `pending`, `in-progress`, `resolved`;
- `priority` is one of `low`, `medium`, `high`, `urgent`;
- `studentId`, `contactEmail`, `updatedAt`, `assignedTo` are strings when present;
- `upvotes`, when present, is a finite number ≥ 0;
- its `id` has not already appeared earlier in the list (duplicates are dropped).

Accepted records are copied field by field into a clean `Complaint`. Unknown extra fields are not carried forward, but they remain in the backup copy.

**No silent data loss.** The service never replaces stored data it could not fully read without first writing the original raw string to `campusfix:complaints:v1:backup`. If that backup write itself fails, the service leaves the original key untouched and runs from memory for the session.

**Backup is written once per problem, not on every load.** After a backup, the repaired list is saved straight away, so the next load finds clean data and does not take the recovery path again. Valid stored data is only read on load, never rewritten. There is one backup slot: if a *new*, different corruption happens later, its raw value replaces the older backup. That older backup's contents had already been repaired into the main list at that point, apart from the records that were invalid.

**Recovery is visible, not silent.** Every recovery logs a `console.warn` that says how many records were kept and names the backup key.

**Unavailable storage.** If `localStorage` cannot be accessed (blocked site data, some private-browsing modes) or a write fails (quota exceeded), the service logs one console warning. It then keeps working from an in-memory copy for the rest of the session, seeded from the sample data when nothing could be read. The UI keeps working, but changes made in that state are lost when the page is closed.

**No remote calls.** The service makes no network requests and adds no dependencies.

---

## 5. Known Limitations

- **Per browser, per device.** Data lives in one browser profile on one device. A complaint submitted on a phone is not visible on a laptop, to another student, or to staff. Clearing site data deletes it.
- **Not a shared system of record.** There is no authentication, no audit trail, and no protection against a user editing `localStorage` by hand. Statuses and upvotes can be changed by anyone with the page open.
- **No cross-tab atomicity.** Two tabs writing at the same instant can lose one tab's change (see §1). There are no locks or transactions, and no database-level concurrency safety.
- **Open tabs do not live-update.** Changes from another tab appear after a reload. A `storage` event listener could push them in, but that would need wiring in `App.tsx`, which is frontend-owned.
- **Single backup slot.** Only the most recent unreadable value is kept (see §4).
- **Upvotes are unlimited.** `toggleUpvote` increments on every click, unchanged from before. Per-user voting needs user identity, which needs a backend.
- **Storage size.** `localStorage` is typically limited to about 5 MB per origin, which is ample for text complaints but would not suit attachments.
- **Frontend notice text.** The "Frontend Development Mode" banner in `QuickNoticeBanner.tsx` still says that changes are held in memory. That is no longer accurate. The file is frontend-owned, so it was not edited here.

---

## 6. Manual Test Cases and Results

Tested on 2026-10-14 against the Vite dev server (`npm run dev`), in the browser, with storage cleared before the run.

| # | Scenario | Steps | Expected | Actual |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Initial load | Clear storage, load app | 8 sample complaints shown and saved | ✅ CF-1001…CF-1008 shown; key created with 8 records |
| 2 | Create | Submit form (title with surrounding spaces, High priority) | Appears at top of list | ✅ `CF-1009` shown first; title stored trimmed; toast "Ticket CF-1009 submitted successfully!" |
| 3 | Create survives refresh | Reload | CF-1009 still listed | ✅ 9 complaints after reload |
| 4 | Status persists | Set CF-1009 to Resolved via card dropdown, reload | Resolved after reload, `updatedAt` set | ✅ `status: "resolved"`, `updatedAt` populated |
| 5 | Upvotes persist | Click upvote twice on CF-1009, reload | 3 upvotes after reload | ✅ `upvotes: 3` |
| 6 | Unique IDs | Three `addComplaint` calls fired concurrently | Three distinct IDs | ✅ CF-1010, CF-1011, CF-1012; 12 stored, 12 unique |
| 7 | No duplicate seeds | Reload repeatedly | Count unchanged | ✅ Total stayed 9 (then 12), no repeated IDs |
| 8 | Corrupt JSON | Store `{not json`, load | App renders; original backed up | ✅ Sample data shown; backup identical to the corrupt value |
| 9 | Wrong shape | Store `{"a":1}`, load | App renders; original backed up | ✅ Same as #8 |
| 10 | Partly invalid records | Store 1 valid, 2 with bad enums, a `null`, and a duplicate | Valid record kept, rest dropped, backup written | ✅ Only CF-2001 shown and stored; backup identical to original |
| 11 | Empty saved data | Store `[]`, load | Empty list, not reseeded | ✅ No complaints shown; key still `[]` |
| 12 | Blocked storage | Make `getItem`/`setItem` throw, call the API | No crash; works in memory | ✅ Seeded 8, created CF-1009, upvote → 2, list of 9 |
| 13 | Unknown IDs | `updateComplaintStatus('CF-0000', …)`, `toggleUpvote('nope')` | Throws / returns `null` | ✅ "Complaint with ID CF-0000 not found." / `null` |
| 14 | Safe copies | Mutate a returned complaint, read again | Store unaffected | ✅ Stored title unchanged |
| 15 | Dashboard features | Submit form, card status dropdown, upvote button, status tabs and KPI counters | Work as before | ✅ All worked; status-tab counts updated live (Pending 4→3, Resolved 2→3); no component edits; no console errors. Search, category/priority filters and sorting were not exercised separately; they operate on the same `Complaint[]` the service already returned. |

Follow-up checks (second review pass, same day):

| # | Scenario | Expected | Actual |
| :--- | :--- | :--- | :--- |
| 16 | `[]` stored, app reloaded 3 times | Stays empty, no backup | ✅ 0 complaints on page each time; key still `[]`; no backup key |
| 17 | Corrupt value, then 2 further reloads (backup key set to a marker after the first load) | Backup written once only | ✅ First load backed up `{bad json` and saved 8 sample records; marker still in place after 2 more reloads; main key unchanged by those reloads |
| 18 | Valid data, app reloaded 3 times | Stored string never rewritten | ✅ Byte-identical after 3 reloads; no backup key created |
| 19 | Partly invalid data **and** the backup write fails | Original main key must stay untouched | ✅ Valid record served; a new complaint is held in memory; main key byte-identical to the original |
| 20 | Duplicate `CF-2001` plus `CF-1500` stored | Duplicate collapsed, next ID above the highest | ✅ Loaded `CF-2001`, `CF-1500`; backup written; new ID `CF-2002` |
| 21 | Invalid `CF-2002` dropped into the backup, then a complaint added | Dropped ID not reused | ✅ New ID `CF-2003` (first run, before this rule existed, reused `CF-2002`; fixed). Fresh seed still gives `CF-1009` |

`npm run build` and `npm run lint` both pass with no errors or warnings.

---

## 7. Future Migration to Shared Storage

The four functions above are the seam. A move to a real backend can keep their signatures and change only this module:

1. **Keep the contract.** Swap the bodies for `fetch` calls to a REST/RPC API or a hosted database client. `getComplaints`, `addComplaint` and `updateComplaintStatus` are already `async`, so callers are unaffected.
2. **`toggleUpvote` is synchronous.** A network-backed vote cannot be synchronous. Options are: (a) apply an optimistic local increment and sync in the background, keeping the current signature; or (b) agree with the frontend owner to change it to `Promise<Complaint | null>`. Option (b) is a coordinated change to `App.tsx`.
3. **IDs move server-side.** Generate IDs in the database (sequence or UUID). The client-side `max + 1` rule is only safe for a single browser.
4. **Per-user voting** needs authenticated identity and a votes table keyed by (user, complaint).
5. **Importing local data.** Existing browser data can be uploaded once from `campusfix:complaints:v1` (and the backup key, if present). Then clear it or bump to a new key so it is not re-imported.
6. **Validation** in `parseComplaint` should move to (or be mirrored by) server-side validation; client checks alone are not a security boundary.
