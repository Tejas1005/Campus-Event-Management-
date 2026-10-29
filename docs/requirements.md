# Campus Event Management System (CEMS) — Requirements Specification

## 1. Project Overview & Scope
The Campus Event Management System (CEMS) is a full-stack web application designed for collegiate institutions to streamline the end-to-end lifecycle of on-campus and inter-collegiate events. It provides dedicated interfaces and capabilities for three primary user roles: Students, Event Coordinators, and Administrators.

Events managed include:
- Technical events and hackathons
- Cultural events and festivals
- Workshops, guest lectures, and seminars
- Sports tournaments and athletic meets
- Club, departmental, and community activities

---

## 2. User Roles & Capabilities

### 2.1 Student
- **Account Management:** Sign up, log in with JWT authentication, view/edit personal profile (department, year, contact, student ID).
- **Event Discovery:** Search, filter (by category, date range, status, venue), and view event details including speaker info, agenda, coordinator contacts, capacity, and remaining seats.
- **Registration Management:** One-click registration for active events with available seats; view registered events with confirmation status; cancel registrations within allowed cutoff windows.
- **Attendance & Feedback:** View attendance status (Marked/Present/Absent); submit post-event ratings (1–5 stars) and qualitative feedback.
- **Notifications:** In-app inbox for registration confirmations, reminders, schedule updates, cancellations, and announcements.

### 2.2 Event Coordinator
- **Dashboard:** Overview of hosted events, registration metrics, capacity utilization, and attendance completion.
- **Event Management:** Create and edit events (title, category, venue, dates, capacity, banner image, requirements).
- **Approval Workflow:** Submit events to administrator for approval; view approval state (`draft`, `pending_approval`, `approved`, `rejected`, `published`, `cancelled`) with admin feedback/rejection reason.
- **Participant & Attendance Management:** Real-time roster of registered students; mark single or bulk attendance (Present/Absent).
- **Communication & Feedback:** Post event announcements/updates triggering notifications to registered participants; view submitted attendee feedback and ratings.

### 2.3 Administrator
- **System Administration:** Global overview of users, total events, total registrations, active clubs, and analytics.
- **User Management:** View, search, toggle account status (activate/deactivate), and assign/change roles.
- **Event Governance:** Review event submissions; approve, reject (with mandatory reason), publish, or cancel events.
- **Category & Taxonomy Management:** Create, update, and manage event categories.
- **Auditing & Reporting:** Comprehensive tabular and graphical reports for registration velocity, attendance rates, category distributions, and CSV export capabilities.
- **System Announcements:** Broadcast institute-wide notices to all users.

---

## 3. Non-Functional Requirements
- **Security:** Argon2/Bcrypt password hashing; stateless JWT authentication with expiration; strict Role-Based Access Control (RBAC) enforced on FastAPI endpoints.
- **Data Integrity:** Database constraints preventing duplicate active registrations per student/event; transaction-safe registration avoiding race conditions overbooking capacity.
- **Responsiveness & UX:** High-aesthetic, responsive UI supporting mobile (<768px), tablet (768px-1024px), and desktop (>1024px); clean dark/light glassmorphism styling; real-time notifications.
- **Performance:** Fast response times (<100ms API responses on SQLite); efficient indexing on frequently queried columns (user IDs, event status, category, dates).
- **Maintainability:** Modular architecture adhering to clean separation of concerns: API routes, services, schemas, models, and frontend component modularity.
