# Campus Event Management System (CEMS) — Architecture & System Design

## 1. High-Level Architecture Overview

The system is constructed with a decoupled Single Page Application (SPA) frontend and a RESTful service-oriented backend powered by Python FastAPI, persisting relational data via SQLAlchemy ORM into SQLite.

```
       +-------------------------------------------------------------+
       |                  Client Browser (SPA)                       |
       |  React 18 + Vite + React Router + Axios + Modern CSS Tokens |
       +-------------------------------------------------------------+
                                      |
                         REST / JSON  |  Bearer JWT
                                      v
       +-------------------------------------------------------------+
       |                     FastAPI Backend                         |
       |  - CORS Middleware & Request Validation (Pydantic v2)      |
       |  - Auth & Security Layer (JWT Bearer, Passlib/Bcrypt)       |
       |  - Role-Based Access Control (RBAC Guard Dependencies)     |
       |  - Service Layer (Event workflow, capacity, notifications)  |
       |  - SQLAlchemy 2.0 ORM Engine                                |
       +-------------------------------------------------------------+
                                      |
                              SQLAlchemy Sessions
                                      v
       +-------------------------------------------------------------+
       |                   SQLite Relational Database                |
       |  Tables: users, event_categories, events, registrations,    |
       |          attendances, notifications, feedbacks              |
       +-------------------------------------------------------------+
```

---

## 2. Component Responsibilities

### Frontend (React + Vite)
- **State & Context:** `AuthContext` handles user identity, token persistence in `localStorage`, role queries (`isStudent`, `isCoordinator`, `isAdmin`), and auto-logout on token expiration.
- **Routing & Guards:** Public routes (`/`, `/events`, `/login`, `/register`), protected routes wrapped in `<ProtectedRoute allowedRoles={[...]} />`.
- **API Services Layer:** Central Axios instance with request interceptor for JWT authorization header and response interceptor for 401 handling.
- **UI Components:** Reusable design system tokens, responsive navbar with role switcher badge, dynamic event cards, capacity indicators, modals for approval/rejection reasons, filter sidebars, data tables with pagination.

### Backend (FastAPI)
- **API Router Layer:** Modular routes grouped under `/api/v1/`:
  - `/auth`: Registration, Login, Current User profile.
  - `/users`: User listing, role assignment, account status toggle.
  - `/categories`: Category taxonomy CRUD.
  - `/events`: Event discovery, creation, editing, status workflows.
  - `/registrations`: Capacity-checked registrations, cancellations, attendee rosters.
  - `/attendance`: Mark individual/bulk attendance records.
  - `/notifications`: In-app inbox, read markers, broadcast notices.
  - `/feedback`: Post-event ratings and reviews.
  - `/reports`: Aggregated analytics, dashboard metrics, CSV downloads.
- **Business Logic Layer:**
  - Status transition state machine (draft -> pending_approval -> approved -> published -> completed/cancelled).
  - Concurrency & Capacity check before finalizing event registration.
  - Auto-dispatching notifications on critical events (approval, rejection, registration, cancellation).
- **Persistence Layer:**
  - SQLAlchemy models with declarative Base.
  - SQLite foreign key support enabled (`PRAGMA foreign_keys = ON`).

---

## 3. Directory Layout

```
campus-event-management/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Auth & Role dependency injection
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── categories.py
│   │   │       ├── events.py
│   │   │       ├── registrations.py
│   │   │       ├── attendance.py
│   │   │       ├── notifications.py
│   │   │       ├── feedback.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   └── security.py         # Passlib hashing & PyJWT tokens
│   │   ├── db/
│   │   │   ├── session.py          # SQLAlchemy engine & sessionmaker
│   │   │   ├── base.py
│   │   │   └── init_db.py          # DB tables & demo seed data
│   │   ├── models/                 # SQLAlchemy DB Entities
│   │   ├── schemas/                # Pydantic validation models
│   │   ├── services/               # Reusable business logic
│   │   └── main.py                 # FastAPI application root
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/             # Reusable UI widgets
│   │   ├── context/                # AuthContext & NotificationContext
│   │   ├── pages/                  # Landing, Auth, Student, Coord, Admin pages
│   │   ├── services/               # Axios API client modules
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Modern design tokens & styles
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docs/
├── .gitignore
└── README.md
```
