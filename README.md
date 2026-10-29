# Campus Event Management System (CEMS)

> A modern, secure, full-stack college web application for managing campus hackathons, cultural festivals, technical workshops, sports tournaments, and club events. Built with **FastAPI**, **SQLAlchemy ORM**, **SQLite**, **React 18**, **Vite**, and **JWT Authentication**.

---

## 🌟 Key Features & Role-Based Workflows

### 🎓 1. Student Portal
- **Account Registration & Login:** JWT-authenticated student accounts with profile fields (Student ID / Roll number, Department, Phone).
- **Event Discovery & Filtering:** Real-time search across event titles, venues, and descriptions. Filter by domain categories (Technical, Cultural, Workshops, Sports) and date range.
- **Seat Reservations:** One-click registration with live capacity meters and prevention of race conditions/overbooking.
- **My Registrations:** Tabbed overview of confirmed, past, and cancelled passes. Ability to cancel active registrations before event commencement.
- **Attendance & Feedback:** View verified attendance status (`Present` / `Absent`). Submit 1–5 star ratings and reviews post-event.
- **In-App Notification Center:** Unread alerts for registration confirmations, organizer announcements, and cancellations.

### 👔 2. Event Coordinator Hub
- **Event Creation & Editing:** Draft events with custom venues, banner graphics, dates, and seat capacities.
- **Approval Lifecycle:** Submit draft proposals to Administration for review. View approval states (`draft`, `pending_approval`, `approved`, `published`, `rejected`).
- **Constructive Rejection Feedback:** View administrator reasons if an event is rejected, enabling seamless revision and re-submission.
- **Participant Roster & Attendance:** Real-time roster table with search. Single-click or bulk attendance marking (`Present` / `Absent`).
- **Broadcast Announcements:** Send targeted notifications to all registered students of an event.
- **Self-Approval Guard:** Strict backend constraint preventing coordinators from approving their own events.

### 🛡️ 3. Administrator Control Center
- **System-Wide Analytics:** Live KPIs tracking total students, coordinators, events, registration counts, and turnout percentage.
- **Approval Queue:** Review pending events, approve with one click, or reject with a required constructive feedback message.
- **Event Lifecycle Governance:** Publish approved events live to the public campus directory or cancel events if necessary.
- **User & Role Management:** View all accounts, filter by role, toggle account status (`active` / `inactive`), or promote users.
- **Category Taxonomy Management:** Create, update, or remove event domain categories.
- **Campus Broadcast:** Broadcast institutional notices to all active campus accounts.
- **CSV Data Export:** Stream and download full registration audits in CSV format.

---

## 🏗️ System Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v7, Axios, Lucide Icons, Custom CSS Glassmorphism Design System |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, Python-Jose (JWT), Passlib / Bcrypt |
| **Database** | SQLite 3, SQLAlchemy 2.0 ORM with Foreign Key Pragma Enforcement (`PRAGMA foreign_keys = ON`) |
| **Testing** | Pytest, FastAPI TestClient, Browser Subagent Automation |

```
campus-event-management/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, events, registrations, attendance, etc.)
│   │   ├── core/            # Config settings and security helpers (JWT, Bcrypt)
│   │   ├── db/              # SQLAlchemy session, engine & init_db seed data script
│   │   ├── models/          # Relational database models (User, Event, Registration, etc.)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   └── main.py          # FastAPI app entrypoint, CORS, health check
│   ├── tests/               # Automated test suite (Pytest)
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, EventCard, Modals (Detail, Form, Roster)
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/           # Landing, Events, Dashboards (Student, Coord, Admin), Reports
│   │   ├── services/        # Axios API client with Bearer token interceptor
│   │   ├── App.jsx          # Route definitions and RBAC guards
│   │   └── index.css        # Modern dark glassmorphic design system
│   ├── package.json
│   └── .env.example
├── docs/                    # Architecture, Database ER, API specs & Development plan
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start & Run Instructions

### Prerequisites
- **Python 3.10+** (tested on Python 3.11)
- **Node.js 18+** and **npm**

---

### Step 1: Run the Backend (FastAPI)

1. Open a terminal in the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the backend server (automatically initializes the SQLite database and safe demo seed data):
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Health Check: `http://127.0.0.1:8000/api/health`
   - Interactive Swagger API Documentation: `http://127.0.0.1:8000/api/v1/docs`

---

### Step 2: Run the Frontend (React + Vite)

1. Open a second terminal in the `frontend/` directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the development server:
   ```powershell
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173
   ```

---

## 🔑 Pre-Seeded Demo Test Accounts

The system automatically initializes safe development seed data. You can log in using the credentials below, or click the **One-Click Demo Test Accounts** buttons on the `/login` page:

| Role | Email | Password | Name / Department |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cems.edu` | `Admin@123` | Dean Dr. Robert Vance (Academic Admin) |
| **Event Coordinator** | `sarah.coord@cems.edu` | `Coord@123` | Prof. Sarah Jenkins (Computer Science) |
| **Event Coordinator** | `david.coord@cems.edu` | `Coord@123` | Prof. David Kim (Robotics & Mechanical) |
| **Student** | `alex.student@cems.edu` | `Student@123` | Alex Rivera (CS2024-042) |
| **Student** | `priya.student@cems.edu` | `Student@123` | Priya Sharma (IT2024-089) |
| **Student** | `marcus.student@cems.edu` | `Student@123` | Marcus Chen (EE2024-015) |

---

## 🧪 Running Automated Tests

Run the backend Pytest test suite:
```powershell
cd backend
.\venv\Scripts\pytest -v
```

### Verified Test Cases:
- `test_health_check`: Validates API status and database connectivity.
- `test_user_registration_and_login`: Validates Bcrypt password hashing and JWT issuance.
- `test_role_based_access_control`: Asserts that Students cannot access administrative routes (403 Forbidden).
- `test_coordinator_cannot_approve_own_event`: Enforces that coordinators cannot approve their own events.
- `test_capacity_and_duplicate_registration`: Enforces capacity limits and prevents duplicate active student registrations.
- `test_attendance_and_feedback`: Validates coordinator attendance marking and attendee feedback submission.
- `test_reports_and_csv_export`: Asserts real statistical computation and streaming CSV report generation.

**Result: 7/7 Tests Passed (100% Success Rate).**

---

## 📑 Detailed Documentation Files

Refer to the `docs/` folder for complete specifications:
- [Requirements Specification](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/requirements.md)
- [RBAC Role & Permission Matrix](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/permission-matrix.md)
- [System Architecture](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/architecture.md)
- [Database Design & ER Diagram](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/database-design.md)
- [REST API Design & OpenAPI Contracts](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/api-design.md)
- [Phased Development Plan & Checklist](file:///c:/Users/tejas/OneDrive/Desktop/Campus%20event%20management/docs/development-plan.md)

---

## 🛡️ Security Best Practices Implemented
1. **Password Hashing:** Passwords are never stored in plaintext; hashed with salted Bcrypt.
2. **Stateless JWT Authorization:** Access tokens are verified on every protected API endpoint.
3. **Strict Server-Side Enforcement:** Permissions are enforced in FastAPI dependencies, not merely by hiding UI buttons.
4. **Anti-Race Condition & Capacity Control:** Event registration validates remaining capacity within database transactions.
5. **No Coordinator Self-Approval:** Hardcoded backend guard blocks coordinators from approving their own event submissions.
