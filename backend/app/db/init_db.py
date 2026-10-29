from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import engine, Base, SessionLocal
from app.models import (
    User, EventCategory, Event, Registration, Attendance, Notification, Feedback
)
from app.core.security import get_password_hash


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already seeded
        if db.query(User).count() > 0:
            print("Database already initialized with data.")
            return

        print("Seeding initial database data...")

        # 1. Categories
        categories_data = [
            ("Technical & Hackathons", "Coding competitions, robot wars, webathons, and tech sprints", "Code"),
            ("Cultural & Festivals", "Music nights, dance battles, drama, and fine arts exhibitions", "Music"),
            ("Workshops & Seminars", "Expert guest lectures, AI masterclasses, and hands-on bootcamps", "BookOpen"),
            ("Sports & Athletics", "Inter-department cricket, football leagues, chess, and badminton", "Trophy"),
            ("Club & Departmental", "Literature clubs, robotics society, entrepreneurship summits", "Users"),
        ]

        cat_objs = {}
        for name, desc, icon in categories_data:
            cat = EventCategory(name=name, description=desc, icon=icon)
            db.add(cat)
            db.flush()
            cat_objs[name] = cat

        # 2. Users
        admin = User(
            full_name="Dean Dr. Robert Vance",
            email="admin@cems.edu",
            hashed_password=get_password_hash("Admin@123"),
            role="admin",
            status="active",
            department="Academic Administration",
            phone="+1-555-0100"
        )
        coord1 = User(
            full_name="Prof. Sarah Jenkins",
            email="sarah.coord@cems.edu",
            hashed_password=get_password_hash("Coord@123"),
            role="coordinator",
            status="active",
            department="Computer Science & Engineering",
            phone="+1-555-0101"
        )
        coord2 = User(
            full_name="Prof. David Kim",
            email="david.coord@cems.edu",
            hashed_password=get_password_hash("Coord@123"),
            role="coordinator",
            status="active",
            department="Mechanical Engineering & Robotics",
            phone="+1-555-0102"
        )
        student1 = User(
            full_name="Alex Rivera",
            email="alex.student@cems.edu",
            hashed_password=get_password_hash("Student@123"),
            role="student",
            status="active",
            department="Computer Science",
            student_id_number="CS2024-042",
            phone="+1-555-0201"
        )
        student2 = User(
            full_name="Priya Sharma",
            email="priya.student@cems.edu",
            hashed_password=get_password_hash("Student@123"),
            role="student",
            status="active",
            department="Information Technology",
            student_id_number="IT2024-089",
            phone="+1-555-0202"
        )
        student3 = User(
            full_name="Marcus Chen",
            email="marcus.student@cems.edu",
            hashed_password=get_password_hash("Student@123"),
            role="student",
            status="active",
            department="Electrical Engineering",
            student_id_number="EE2024-015",
            phone="+1-555-0203"
        )

        db.add_all([admin, coord1, coord2, student1, student2, student3])
        db.flush()

        # 3. Events
        now = datetime.now(timezone.utc)

        # Event 1: Hackathon (Published, ongoing/future)
        e1 = Event(
            title="HackCampus 2026: 36-Hour National Hackathon",
            description="The flagship college hackathon welcoming 500+ builders. Tracks include Generative AI, Web3, Smart Campus IoT, and Climate Tech. Grand prize pool of $10,000 + mentorship.",
            category_id=cat_objs["Technical & Hackathons"].id,
            venue="Main Campus Auditorium & Labs A1-A4",
            start_time=now + timedelta(days=5, hours=9),
            end_time=now + timedelta(days=6, hours=21),
            capacity=150,
            coordinator_id=coord1.id,
            status="published",
            banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
        )

        # Event 2: Cultural Fest (Published)
        e2 = Event(
            title="Vibrance 2026: Annual Cultural Gala & Battle of Bands",
            description="Celebrate art, music, and dance! Featuring live band competition, fashion runway, beatboxing showdown, and night star concert. Food trucks and art stalls on the north lawn.",
            category_id=cat_objs["Cultural & Festivals"].id,
            venue="Open Air Amphitheatre",
            start_time=now + timedelta(days=12, hours=17),
            end_time=now + timedelta(days=12, hours=23),
            capacity=300,
            coordinator_id=coord1.id,
            status="published",
            banner_url="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
        )

        # Event 3: AI Workshop (Approved, ready to publish)
        e3 = Event(
            title="Hands-on Deep Learning & LLM Deployment Masterclass",
            description="Build and deploy production-ready LLM agents using PyTorch, FastAPI, and Docker. Industry engineers walk through fine-tuning, prompt engineering, and evaluation benchmarks.",
            category_id=cat_objs["Workshops & Seminars"].id,
            venue="Seminar Hall B, Science Block",
            start_time=now + timedelta(days=18, hours=10),
            end_time=now + timedelta(days=18, hours=16),
            capacity=60,
            coordinator_id=coord2.id,
            status="approved",
            banner_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80"
        )

        # Event 4: Robotics Showcase (Pending Approval)
        e4 = Event(
            title="RoboClash: Autonomous Robot Sumo & Maze Navigators",
            description="Annual inter-departmental autonomous robotics tournament. High-octane arena battles and micro-mouse precision navigation challenges.",
            category_id=cat_objs["Technical & Hackathons"].id,
            venue="Indoor Sports Complex Arena",
            start_time=now + timedelta(days=25, hours=9),
            end_time=now + timedelta(days=25, hours=18),
            capacity=80,
            coordinator_id=coord2.id,
            status="pending_approval",
            banner_url="https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80"
        )

        # Event 5: Sports Tournament (Published)
        e5 = Event(
            title="Inter-Department T20 Cricket & Futsal Trophy",
            description="Showcase your athletic prowess in our week-long tournament. League matches followed by floodlit knockout semifinals and grand finals.",
            category_id=cat_objs["Sports & Athletics"].id,
            venue="University Sports Grounds",
            start_time=now + timedelta(days=8, hours=8),
            end_time=now + timedelta(days=10, hours=19),
            capacity=120,
            coordinator_id=coord2.id,
            status="published",
            banner_url="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80"
        )

        # Event 6: Past Workshop (Completed for Feedback demo)
        e6 = Event(
            title="Cloud Architecture & DevOps Fundamentals",
            description="Introductory seminar on cloud design principles, CI/CD pipelines, and Kubernetes orchestration.",
            category_id=cat_objs["Workshops & Seminars"].id,
            venue="Computer Science Lab 3",
            start_time=now - timedelta(days=7, hours=4),
            end_time=now - timedelta(days=7, hours=1),
            capacity=50,
            coordinator_id=coord1.id,
            status="published",
            banner_url="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
        )

        db.add_all([e1, e2, e3, e4, e5, e6])
        db.flush()

        # 4. Registrations
        r1 = Registration(student_id=student1.id, event_id=e1.id, status="confirmed")
        r2 = Registration(student_id=student2.id, event_id=e1.id, status="confirmed")
        r3 = Registration(student_id=student3.id, event_id=e1.id, status="confirmed")

        r4 = Registration(student_id=student1.id, event_id=e2.id, status="confirmed")
        r5 = Registration(student_id=student2.id, event_id=e5.id, status="confirmed")

        # Past event registrations
        r6 = Registration(student_id=student1.id, event_id=e6.id, status="confirmed")
        r7 = Registration(student_id=student2.id, event_id=e6.id, status="confirmed")

        db.add_all([r1, r2, r3, r4, r5, r6, r7])
        db.flush()

        # 5. Attendance for past event
        att1 = Attendance(
            registration_id=r6.id,
            status="present",
            marked_at=now - timedelta(days=7, hours=2),
            marked_by_id=coord1.id
        )
        att2 = Attendance(
            registration_id=r7.id,
            status="present",
            marked_at=now - timedelta(days=7, hours=2),
            marked_by_id=coord1.id
        )
        db.add_all([att1, att2])
        db.flush()

        # 6. Feedback for past event
        fb1 = Feedback(
            student_id=student1.id,
            event_id=e6.id,
            rating=5,
            comment="Incredible workshop! The hands-on Kubernetes demo helped clear up key concepts for my project.",
            submitted_at=now - timedelta(days=6)
        )
        fb2 = Feedback(
            student_id=student2.id,
            event_id=e6.id,
            rating=4,
            comment="Very informative session. Would love more practical time for CI/CD pipeline troubleshooting.",
            submitted_at=now - timedelta(days=6, hours=12)
        )
        db.add_all([fb1, fb2])

        # 7. Initial Notifications
        notif1 = Notification(
            recipient_id=student1.id,
            title="Welcome to CEMS!",
            message="Your student profile is active. Browse published campus events and reserve your seats.",
            type="info"
        )
        notif2 = Notification(
            recipient_id=student1.id,
            title="Registration Confirmed: HackCampus 2026",
            message="You are confirmed for HackCampus 2026! Bring your laptop and student ID on day 1.",
            type="success"
        )
        notif3 = Notification(
            recipient_id=admin.id,
            title="Event Pending Approval: RoboClash",
            message="Prof. David Kim submitted 'RoboClash: Autonomous Robot Sumo' for administrator review.",
            type="info"
        )
        db.add_all([notif1, notif2, notif3])

        db.commit()
        print("Database successfully initialized and seeded with safe demo data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
