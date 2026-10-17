# CampusFix REST API Documentation

This document defines the formal HTTP REST API contract for the **CampusFix** university complaint management system.

Backend Server Base URL: `http://localhost:3001`  
API Version Prefix: `/api`  
Full API Base URL: `http://localhost:3001/api`

---

## 1. Architectural Principles & Enveloping

All API interactions adhere to JSON REST standards with uniform enveloping.

### 1.1 Success Response Envelope
All successful requests return a top-level `data` key containing the requested entity or array of entities:
```json
{
  "data": <Complaint | Complaint[]>
}
```

### 1.2 Error Response Envelope
All client or server errors (HTTP status $\ge$ 400) return a structured `error` object:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | BAD_REQUEST | INTERNAL_SERVER_ERROR",
    "message": "Human-readable explanation of what went wrong",
    "details": {} // Optional field-level diagnostics or array of errors
  }
}
```

### 1.3 HTTP Headers
- **`Content-Type: application/json`** (required for `POST` and `PATCH` requests)
- **`Accept: application/json`**

---

## 2. Core Domain Data Models

### 2.1 Enums

- **`ComplaintStatus`**: `'pending' | 'in-progress' | 'resolved'`
- **`ComplaintPriority`**: `'low' | 'medium' | 'high' | 'urgent'`

### 2.2 Entity: `Complaint`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique identifier in format `CF-####` (e.g., `CF-1001`) |
| `title` | `string` | Yes | Brief summary of the problem (5–150 chars) |
| `description` | `string` | Yes | Comprehensive explanation of the incident |
| `category` | `string` | Yes | Department/facility category (e.g., `'IT & Wi-Fi'`) |
| `priority` | `ComplaintPriority` | Yes | Urgency rating (`low`, `medium`, `high`, `urgent`) |
| `status` | `ComplaintStatus` | Yes | Lifecycle status (`pending`, `in-progress`, `resolved`) |
| `location` | `string` | Yes | Specific campus building, floor, room |
| `submittedBy` | `string` | Yes | Name of submitter or `'Anonymous Campus Member'` |
| `studentId` | `string` | No | University Student Registration ID |
| `contactEmail` | `string` | No | Valid email address for follow-up notifications |
| `createdAt` | `string` | Yes | ISO 8601 UTC timestamp of creation |
| `updatedAt` | `string` | No | ISO 8601 UTC timestamp of last status change |
| `upvotes` | `number` | Yes | Total counter of student community endorsements (min: 0) |
| `assignedTo` | `string` | No | Facility team or technician responsible for the ticket |

### 2.3 Input Payload: `AddComplaintInput`

| Field | Type | Required | Default If Omitted |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Yes** | None (Validation error if missing) |
| `description` | `string` | **Yes** | None (Validation error if missing) |
| `location` | `string` | **Yes** | None (Validation error if missing) |
| `category` | `string` | No | `'Facilities & Maintenance'` |
| `priority` | `ComplaintPriority` | No | `'medium'` |
| `submittedBy` | `string` | No | `'Anonymous Campus Member'` |
| `studentId` | `string` | No | `undefined` |
| `contactEmail` | `string` | No | `undefined` |

---

## 3. Endpoints Specification

### 3.1 `GET /api/complaints`
Retrieve all complaints currently recorded in the system.

- **HTTP Method:** `GET`
- **Path:** `/api/complaints`
- **Headers:** `Accept: application/json`
- **Success Status:** `200 OK`
- **Response Body (`200 OK`):**
```json
{
  "data": [
    {
      "id": "CF-1002",
      "title": "High-speed Wi-Fi access point offline in Central Library 2nd Floor",
      "description": "The eduroam/campus Wi-Fi AP-LIB-2B has been dropping every 5 minutes.",
      "category": "IT & Wi-Fi",
      "priority": "high",
      "status": "pending",
      "location": "Central Library, 2nd Floor Quiet Zone",
      "submittedBy": "Devon Patel",
      "studentId": "SE-2022-118",
      "contactEmail": "d.patel@campus.edu",
      "createdAt": "2026-10-14T07:30:00.000Z",
      "upvotes": 28
    },
    {
      "id": "CF-1001",
      "title": "Ceiling water leakage in Computer Science Block - Room 302",
      "description": "Active water dripping from ceiling tile directly above student workstations near the window row.",
      "category": "Plumbing & Water",
      "priority": "urgent",
      "status": "in-progress",
      "location": "CS Department Building, 3rd Floor, Lab 302",
      "submittedBy": "Zainab Tariq",
      "studentId": "CS-2023-049",
      "contactEmail": "zainab.tariq@campus.edu",
      "createdAt": "2026-10-14T08:15:00.000Z",
      "updatedAt": "2026-10-14T09:40:00.000Z",
      "upvotes": 14,
      "assignedTo": "Campus Facilities Team (Lead: Eng. Rafiq)"
    }
  ]
}
```

---

### 3.2 `POST /api/complaints`
Submit a new maintenance or infrastructure issue ticket.

- **HTTP Method:** `POST`
- **Path:** `/api/complaints`
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Request Body:**
```json
{
  "title": "Broken window pane in study hall",
  "description": "Lower glass pane cracked and rattling dangerously in the wind.",
  "category": "Facilities & Maintenance",
  "priority": "high",
  "location": "Block B, 1st Floor Study Hall",
  "submittedBy": "Bilal Ahmed",
  "studentId": "EE-2024-007",
  "contactEmail": "b.ahmed@campus.edu"
}
```
- **Success Status:** `201 Created`
- **Response Body (`201 Created`):**
```json
{
  "data": {
    "id": "CF-1009",
    "title": "Broken window pane in study hall",
    "description": "Lower glass pane cracked and rattling dangerously in the wind.",
    "category": "Facilities & Maintenance",
    "priority": "high",
    "status": "pending",
    "location": "Block B, 1st Floor Study Hall",
    "submittedBy": "Bilal Ahmed",
    "studentId": "EE-2024-007",
    "contactEmail": "b.ahmed@campus.edu",
    "createdAt": "2026-10-17T10:30:00.000Z",
    "upvotes": 1
  }
}
```
- **Validation Rules:**
  - `title`: Required non-empty string.
  - `description`: Required non-empty string.
  - `location`: Required non-empty string.
  - `priority`: Must be one of `['low', 'medium', 'high', 'urgent']`.
- **Error Response (`400 Bad Request`):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must not be empty",
    "details": {
      "field": "title"
    }
  }
}
```

---

### 3.3 `PATCH /api/complaints/:id`
Update the status of an existing complaint.

- **HTTP Method:** `PATCH`
- **Path:** `/api/complaints/:id` (e.g. `/api/complaints/CF-1002`)
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Request Body:**
```json
{
  "status": "resolved"
}
```
- **Success Status:** `200 OK`
- **Response Body (`200 OK`):**
```json
{
  "data": {
    "id": "CF-1002",
    "title": "High-speed Wi-Fi access point offline in Central Library 2nd Floor",
    "description": "The eduroam/campus Wi-Fi AP-LIB-2B has been dropping every 5 minutes.",
    "category": "IT & Wi-Fi",
    "priority": "high",
    "status": "resolved",
    "location": "Central Library, 2nd Floor Quiet Zone",
    "submittedBy": "Devon Patel",
    "studentId": "SE-2022-118",
    "contactEmail": "d.patel@campus.edu",
    "createdAt": "2026-10-14T07:30:00.000Z",
    "updatedAt": "2026-10-17T10:35:00.000Z",
    "upvotes": 28
  }
}
```
- **Validation Rules:**
  - `status`: Required, must be one of `['pending', 'in-progress', 'resolved']`.
- **Error Response (`400 Bad Request`):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status 'cancelled'. Allowed: pending, in-progress, resolved"
  }
}
```
- **Error Response (`404 Not Found`):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Complaint with ID CF-99999 not found"
  }
}
```

---

### 3.4 `POST /api/complaints/:id/upvote`
Increment the student endorsement/upvote tally for a complaint.

- **HTTP Method:** `POST`
- **Path:** `/api/complaints/:id/upvote` (e.g. `/api/complaints/CF-1002/upvote`)
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Request Body:** `{}` (empty JSON object)
- **Success Status:** `200 OK`
- **Response Body (`200 OK`):**
```json
{
  "data": {
    "id": "CF-1002",
    "title": "High-speed Wi-Fi access point offline in Central Library 2nd Floor",
    "description": "The eduroam/campus Wi-Fi AP-LIB-2B has been dropping every 5 minutes.",
    "category": "IT & Wi-Fi",
    "priority": "high",
    "status": "pending",
    "location": "Central Library, 2nd Floor Quiet Zone",
    "submittedBy": "Devon Patel",
    "studentId": "SE-2022-118",
    "contactEmail": "d.patel@campus.edu",
    "createdAt": "2026-10-14T07:30:00.000Z",
    "upvotes": 29
  }
}
```
- **Error Response (`404 Not Found`):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Complaint with ID CF-99999 not found"
  }
}
```

---

## 4. Local Setup Guidance

### 4.1 Backend Environment Prerequisites
- Node.js (version 20+ or 24 LTS)
- Port 3001 must be free and available on `localhost`

### 4.2 Starting the Backend Server
Once the backend teammate finishes the server implementation in the `server/` workspace:
```bash
# In the backend workspace (e.g. server/ or root script):
npm run server:dev
# Server starts listening on http://localhost:3001
```

### 4.3 Verifying Backend Health via cURL
```bash
# Check complaint list
curl -i http://localhost:3001/api/complaints

# Test creating a ticket
curl -i -X POST http://localhost:3001/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Ticket","description":"Checking server health","location":"Hall A"}'
```

### 4.4 Vite Frontend Proxy Configuration
To allow the React application (`http://localhost:5173`) to communicate with the backend (`http://localhost:3001`) without browser CORS warnings, ensure `vite.config.ts` includes:
```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // plugins...
});
```
With this proxy in place, frontend calls simply use `fetch('/api/complaints')`.
