# Campus Event Management System (CEMS) — Database Design

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ EVENT : "coordinates"
    USER ||--o{ REGISTRATION : "registers"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ FEEDBACK : "submits"
    USER ||--o{ ATTENDANCE : "marked_by"

    EVENT_CATEGORY ||--o{ EVENT : "categorizes"

    EVENT ||--o{ REGISTRATION : "has"
    EVENT ||--o{ FEEDBACK : "evaluates"

    REGISTRATION ||--o| ATTENDANCE : "tracks"

    USER {
        int id PK
        string full_name
        string email UK
        string hashed_password
        string role "student | coordinator | admin"
        string status "active | inactive"
        string department
        string student_id_number
        datetime created_at
        datetime updated_at
    }

    EVENT_CATEGORY {
        int id PK
        string name UK
        string description
        string icon
    }

    EVENT {
        int id PK
        string title
        string description
        int category_id FK
        string venue
        datetime start_time
        datetime end_time
        int capacity
        int coordinator_id FK
        string status "draft | pending_approval | approved | rejected | published | cancelled"
        string rejection_reason
        string banner_url
        datetime created_at
        datetime updated_at
    }

    REGISTRATION {
        int id PK
        int student_id FK
        int event_id FK
        datetime registration_date
        string status "confirmed | cancelled"
        string cancellation_reason
    }

    ATTENDANCE {
        int id PK
        int registration_id FK, UK
        string status "present | absent"
        datetime marked_at
        int marked_by_id FK
    }

    NOTIFICATION {
        int id PK
        int recipient_id FK
        string title
        string message
        string type "info | success | warning | alert"
        boolean is_read
        datetime created_at
    }

    FEEDBACK {
        int id PK
        int student_id FK
        int event_id FK
        int rating "1 to 5"
        string comment
        datetime submitted_at
    }
```

---

## 2. Integrity Constraints & Business Invariants

1. **Unique Active Registration:**
   - A student cannot have multiple active (`status = 'confirmed'`) registrations for the same event.
   - Enforced by unique constraint and transaction validation checking current active registrations.
2. **Capacity Enforcement:**
   - Total `confirmed` registrations for an event must not exceed `event.capacity`.
   - Evaluated inside an isolated database transaction before inserting a registration record.
3. **Registration Cancellation Rule:**
   - Cancellations can only be initiated before the event `start_time`.
   - Once cancelled, registration slot freed up for other students.
4. **Attendance Uniqueness:**
   - Exactly one attendance record per registration (`registration_id` is unique in `ATTENDANCE`).
5. **Feedback Restriction:**
   - Feedback submission is only allowed for users who have a registration record for that event.
   - Unique constraint on `(student_id, event_id)` prevents duplicate feedback submissions.
6. **Coordinator Separation:**
   - Event `coordinator_id` points to a User with role `coordinator` or `admin`.
