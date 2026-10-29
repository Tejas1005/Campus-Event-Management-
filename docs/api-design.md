# Campus Event Management System (CEMS) — REST API Specification

All API endpoints are prefixed with `/api/v1`.

## 1. Authentication & User Profile
- `POST /auth/register` — Register student or coordinator account. Returns user info.
- `POST /auth/login` — OAuth2 Password Request Form (or JSON) returning `{ access_token, token_type, user }`.
- `GET /auth/me` — Return currently authenticated user profile.
- `PUT /auth/me` — Update user profile (name, department, phone, etc.).
- `PUT /auth/change-password` — Change password requiring old password verification.

## 2. Admin User Management
- `GET /admin/users` — List users with pagination, role filter (`student`, `coordinator`, `admin`), search query.
- `PUT /admin/users/{user_id}/status` — Toggle user status (`active` / `inactive`).
- `PUT /admin/users/{user_id}/role` — Update user role (e.g. promote to coordinator or admin).

## 3. Event Categories
- `GET /categories` — List all categories (Public).
- `POST /categories` — Create category (Admin only).
- `PUT /categories/{cat_id}` — Update category (Admin only).
- `DELETE /categories/{cat_id}` — Delete category (Admin only).

## 4. Events
- `GET /events` — List published events (Public). Supports `category_id`, `search`, `start_date`, `end_date`, `status`, pagination (`page`, `limit`).
- `GET /events/{event_id}` — Get single event detail with current active registration count and user registration state.
- `GET /events/coordinator/my-events` — List coordinator's own events (Coordinator / Admin).
- `GET /events/admin/pending` — List events pending admin review (Admin only).
- `POST /events` — Create new event as `draft` or `pending_approval` (Coordinator / Admin).
- `PUT /events/{event_id}` — Edit event details (Owner coordinator or Admin).
- `POST /events/{event_id}/submit` — Submit draft event for admin approval (Owner coordinator).
- `POST /events/{event_id}/approve` — Approve event (Admin only. Self-approval blocked!).
- `POST /events/{event_id}/reject` — Reject event with `{ reason }` (Admin only).
- `POST /events/{event_id}/publish` — Publish approved event (Admin only).
- `POST /events/{event_id}/cancel` — Cancel event with reason (Admin or Owner coordinator).

## 5. Event Registrations
- `POST /events/{event_id}/register` — Register current student for event. Validates capacity and uniqueness.
- `POST /registrations/{reg_id}/cancel` — Cancel active registration (Student owner or Admin).
- `GET /registrations/my-registrations` — List current student's registrations with event details and attendance state.
- `GET /events/{event_id}/participants` — List registered participants for an event (Coordinator of event or Admin).

## 6. Attendance Tracking
- `POST /events/{event_id}/attendance` — Mark attendance for a registration (`{ registration_id, status: "present"|"absent" }`). (Coordinator/Admin).
- `POST /events/{event_id}/attendance/bulk` — Bulk mark attendance for list of registrations.
- `GET /events/{event_id}/attendance` — Retrieve attendance records for the event.

## 7. In-App Notifications & Announcements
- `GET /notifications` — List current user's notifications.
- `PUT /notifications/{notif_id}/read` — Mark notification as read.
- `PUT /notifications/read-all` — Mark all user notifications as read.
- `POST /events/{event_id}/announcements` — Broadcast announcement to all registered attendees of the event (Coordinator/Admin).
- `POST /admin/announcements` — Institute-wide broadcast to all users (Admin only).

## 8. Feedback & Ratings
- `POST /events/{event_id}/feedback` — Submit rating (1-5) and comment (Registered student only).
- `GET /events/{event_id}/feedback` — Retrieve feedback comments and aggregate average rating.

## 9. Analytics & Reporting (Admin & Coordinator)
- `GET /reports/dashboard-stats` — System KPIs (total users, active events, total registrations, attendance rate).
- `GET /reports/category-distribution` — Event & registration breakdown by category.
- `GET /reports/attendance-summary` — Summary of event turnout percentages.
- `GET /reports/export/registrations.csv` — CSV download of registration records for audit.
