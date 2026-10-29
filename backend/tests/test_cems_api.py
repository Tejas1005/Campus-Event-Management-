from datetime import datetime, timedelta, timezone
from app.core.security import get_password_hash
from app.models import User, EventCategory, Event, Registration, Attendance, Feedback


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "Campus Event Management System" in data["service"]


def test_user_registration_and_login(client, db_session):
    # 1. Register a student
    reg_payload = {
        "full_name": "Test Student",
        "email": "test.student@cems.edu",
        "password": "Password123!",
        "role": "student",
        "department": "IT",
        "student_id_number": "TEST-001"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    user_data = response.json()
    assert user_data["email"] == "test.student@cems.edu"
    assert "password" not in user_data
    assert "hashed_password" not in user_data

    # Verify password was hashed in db
    db_user = db_session.query(User).filter(User.email == "test.student@cems.edu").first()
    assert db_user is not None
    assert db_user.hashed_password != "Password123!"
    assert db_user.hashed_password.startswith("$2b$")

    # 2. Login with correct credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": "test.student@cems.edu",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["role"] == "student"

    # 3. Login with wrong password
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "test.student@cems.edu",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401


def test_role_based_access_control(client, db_session):
    # Create student and coordinator and admin
    admin = User(
        full_name="Admin Test", email="admin.test@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="admin", status="active"
    )
    student = User(
        full_name="Student Test", email="student.test@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="student", status="active"
    )
    db_session.add_all([admin, student])
    db_session.commit()

    # Get student token
    s_login = client.post("/api/v1/auth/login", json={"email": "student.test@cems.edu", "password": "Pass123"})
    s_token = s_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {s_token}"}

    # Student attempts to access admin users endpoint -> MUST be 403 Forbidden
    res = client.get("/api/v1/admin/users", headers=student_headers)
    assert res.status_code == 403

    # Admin access -> MUST be 200 OK
    a_login = client.post("/api/v1/auth/login", json={"email": "admin.test@cems.edu", "password": "Pass123"})
    a_token = a_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {a_token}"}

    admin_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert admin_res.status_code == 200


def test_coordinator_cannot_approve_own_event(client, db_session):
    # Coordinator who is also given admin role for testing self-approval block
    coord_admin = User(
        full_name="Coord Admin Dual", email="coord.admin@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="admin", status="active"
    )
    db_session.add(coord_admin)
    db_session.commit()

    now = datetime.now(timezone.utc)
    event = Event(
        title="Self Approval Test Event",
        description="Testing that self approval is blocked on the backend",
        venue="Room 101",
        start_time=now + timedelta(days=2),
        end_time=now + timedelta(days=2, hours=3),
        capacity=50,
        coordinator_id=coord_admin.id,
        status="pending_approval"
    )
    db_session.add(event)
    db_session.commit()

    # Login as this coordinator-admin
    login = client.post("/api/v1/auth/login", json={"email": "coord.admin@cems.edu", "password": "Pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to approve own event -> MUST return 403 Forbidden
    res = client.post(f"/api/v1/events/{event.id}/approve", headers=headers)
    assert res.status_code == 403
    assert "cannot approve their own events" in res.json()["detail"].lower()


def test_capacity_and_duplicate_registration(client, db_session):
    coord = User(
        full_name="Organizer", email="org@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="coordinator", status="active"
    )
    student1 = User(
        full_name="Alice", email="alice@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="student", status="active"
    )
    student2 = User(
        full_name="Bob", email="bob@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="student", status="active"
    )
    db_session.add_all([coord, student1, student2])
    db_session.commit()

    # Event with capacity of exactly 1 seat
    now = datetime.now(timezone.utc)
    event = Event(
        title="Micro Seminar (Capacity 1)",
        description="Only one lucky student can attend",
        venue="Lab 10",
        start_time=now + timedelta(days=3),
        end_time=now + timedelta(days=3, hours=2),
        capacity=1,
        coordinator_id=coord.id,
        status="published"
    )
    db_session.add(event)
    db_session.commit()

    # 1. Student 1 registers -> Success (201)
    s1_token = client.post("/api/v1/auth/login", json={"email": "alice@cems.edu", "password": "Pass123"}).json()["access_token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}

    res1 = client.post("/api/v1/registrations", json={"event_id": event.id}, headers=s1_headers)
    assert res1.status_code == 201

    # 2. Student 1 attempts to register again -> Duplicate rejected (400)
    dup_res = client.post("/api/v1/registrations", json={"event_id": event.id}, headers=s1_headers)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"].lower()

    # 3. Student 2 attempts to register -> Exceeds capacity rejected (400)
    s2_token = client.post("/api/v1/auth/login", json={"email": "bob@cems.edu", "password": "Pass123"}).json()["access_token"]
    s2_headers = {"Authorization": f"Bearer {s2_token}"}

    cap_res = client.post("/api/v1/registrations", json={"event_id": event.id}, headers=s2_headers)
    assert cap_res.status_code == 400
    assert "capacity reached" in cap_res.json()["detail"].lower()

    # 4. Student 1 cancels registration
    reg_id = res1.json()["id"]
    cancel_res = client.post(f"/api/v1/registrations/{reg_id}/cancel", json={"reason": "Schedule conflict"}, headers=s1_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # 5. Now Student 2 can register -> Success (201)
    res2 = client.post("/api/v1/registrations", json={"event_id": event.id}, headers=s2_headers)
    assert res2.status_code == 201


def test_attendance_and_feedback(client, db_session):
    coord = User(
        full_name="Prof Clark", email="clark@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="coordinator", status="active"
    )
    student = User(
        full_name="Diana", email="diana@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="student", status="active"
    )
    db_session.add_all([coord, student])
    db_session.commit()

    now = datetime.now(timezone.utc)
    event = Event(
        title="Design Sprint",
        description="Interactive UX design sprint",
        venue="Design Studio",
        start_time=now + timedelta(days=1),
        end_time=now + timedelta(days=1, hours=4),
        capacity=30,
        coordinator_id=coord.id,
        status="published"
    )
    db_session.add(event)
    db_session.commit()

    # Register student
    reg = Registration(student_id=student.id, event_id=event.id, status="confirmed")
    db_session.add(reg)
    db_session.commit()

    # Coordinator marks attendance
    coord_token = client.post("/api/v1/auth/login", json={"email": "clark@cems.edu", "password": "Pass123"}).json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}"}

    att_res = client.post("/api/v1/attendance/mark", json={
        "registration_id": reg.id,
        "status": "present"
    }, headers=coord_headers)
    assert att_res.status_code == 200
    assert att_res.json()["status"] == "present"

    # Student submits feedback
    stud_token = client.post("/api/v1/auth/login", json={"email": "diana@cems.edu", "password": "Pass123"}).json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    fb_res = client.post(f"/api/v1/feedback/event/{event.id}", json={
        "rating": 5,
        "comment": "Outstanding design sprint!"
    }, headers=stud_headers)
    assert fb_res.status_code == 201
    assert fb_res.json()["rating"] == 5

    # Duplicate feedback prevented
    dup_fb = client.post(f"/api/v1/feedback/event/{event.id}", json={
        "rating": 4,
        "comment": "Trying again"
    }, headers=stud_headers)
    assert dup_fb.status_code == 400


def test_reports_and_csv_export(client, db_session):
    admin = User(
        full_name="Report Admin", email="admin.rep@cems.edu",
        hashed_password=get_password_hash("Pass123"), role="admin", status="active"
    )
    db_session.add(admin)
    db_session.commit()

    token = client.post("/api/v1/auth/login", json={"email": "admin.rep@cems.edu", "password": "Pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dashboard stats
    stats_res = client.get("/api/v1/reports/dashboard-stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_students" in stats
    assert "active_registrations" in stats

    # CSV export
    csv_res = client.get("/api/v1/reports/export/registrations-csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Registration ID" in csv_res.text
