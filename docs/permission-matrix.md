# Campus Event Management System (CEMS) — Role & Permission Matrix

| Feature / Operation | Guest (Unauth) | Student | Event Coordinator | Administrator | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **View Published Events List** | ✅ | ✅ | ✅ | ✅ | Backend filter (`status='published'`) |
| **View Event Details** | ✅ | ✅ | ✅ | ✅ | Public endpoint |
| **User Sign Up / Login** | ✅ | ✅ | ✅ | ✅ | Auth routes (`/auth/register`, `/auth/login`) |
| **Manage Own Profile** | ❌ | ✅ | ✅ | ✅ | `/users/me` (Authenticated user) |
| **Register for Event** | ❌ | ✅ | ❌ | ❌ | Role == `student`, checks active capacity |
| **Cancel Own Registration** | ❌ | ✅ | ❌ | ❌ | Student ownership + event status check |
| **View My Registrations** | ❌ | ✅ | ❌ | ❌ | Filter by `student_id == current_user.id` |
| **Submit Feedback** | ❌ | ✅ | ❌ | ❌ | Student must have attended or registered |
| **View In-App Notifications** | ❌ | ✅ | ✅ | ✅ | Recipient filter (`recipient_id == current_user.id`) |
| **Create New Event** | ❌ | ❌ | ✅ | ✅ | Role in [`coordinator`, `admin`] |
| **Edit Event (Draft/Pending)** | ❌ | ❌ | ✅ (Owned) | ✅ (All) | Ownership verification in service layer |
| **Submit Event for Approval** | ❌ | ❌ | ✅ (Owned) | ✅ | Status transition validation |
| **Approve / Reject Event** | ❌ | ❌ | ❌ | ✅ | **Admin only**. Self-approval blocked! |
| **Publish Event** | ❌ | ❌ | ❌ | ✅ | Admin only |
| **Mark Event Attendance** | ❌ | ❌ | ✅ (Owned) | ✅ (All) | Coordinator ownership or Admin role |
| **Send Event Announcement** | ❌ | ❌ | ✅ (Owned) | ✅ (All) | Dispatches notification records |
| **Manage Users & Status** | ❌ | ❌ | ❌ | ✅ | Admin only (`/admin/users`) |
| **Manage Event Categories** | ❌ | ❌ | ❌ | ✅ | Admin only (`/categories`) |
| **Access System Reports** | ❌ | ❌ | ❌ | ✅ | Admin only (`/reports`) |
| **Send Broadcast Announcement**| ❌ | ❌ | ❌ | ✅ | Admin only (`/admin/announcements`) |

### Critical Enforcement Rules
1. **No Coordinator Self-Approval:** An event coordinator can NEVER approve their own event. The approval endpoint verifies `role == 'admin'` and raises `403 Forbidden` for any other role.
2. **Server-Side Authorization:** Every protected route uses FastAPI dependency `get_current_user` and role check guards (`require_role(...)`). The frontend navigation hides buttons based on token role, but backend enforcement is the source of truth.
3. **Data Isolation:** Students can only view their own registrations and notifications; coordinators can only mutate events and rosters for events assigned to their ID.
