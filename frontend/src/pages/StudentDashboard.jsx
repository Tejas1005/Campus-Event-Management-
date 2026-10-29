import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  BookmarkCheck,
  CheckCircle,
  Bell,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Star,
} from 'lucide-react';
import { registrationsAPI, eventsAPI, notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EventCard } from '../components/EventCard';
import { EventDetailModal } from '../components/EventDetailModal';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      registrationsAPI.getMyRegistrations(),
      eventsAPI.list({ status: 'published', limit: 3 }),
      notificationsAPI.list(),
    ])
      .then(([regRes, recRes, notifRes]) => {
        setRegistrations(regRes.data);
        setRecommendedEvents(recRes.data);
        setRecentNotifications(notifRes.data.slice(0, 4));
      })
      .catch((err) => {
        addToast('Failed to load student dashboard.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRegistrations = registrations.filter((r) => r.status === 'confirmed');
  const attendedCount = registrations.filter((r) => r.attendance?.status === 'present').length;

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Welcome Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
              Welcome back, <span className="text-gradient">{user?.full_name}</span>!
            </h1>
            <p className="text-muted text-sm">
              Student ID: {user?.student_id_number || 'N/A'} • {user?.department || 'Department'}
            </p>
          </div>
          <Link to="/events" className="btn btn-primary">
            <Compass size={18} /> Discover More Events
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card">
            <div style={{ color: '#818cf8', marginBottom: '0.4rem' }}>
              <BookmarkCheck size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{activeRegistrations.length}</div>
            <div className="text-muted text-sm">Active Registrations</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
              <CheckCircle size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{attendedCount}</div>
            <div className="text-muted text-sm">Events Attended</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#38bdf8', marginBottom: '0.4rem' }}>
              <Calendar size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{registrations.length}</div>
            <div className="text-muted text-sm">Total Registrations</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#f59e0b', marginBottom: '0.4rem' }}>
              <Bell size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {recentNotifications.filter((n) => !n.is_read).length}
            </div>
            <div className="text-muted text-sm">Unread Notifications</div>
          </div>
        </div>

        {/* Two Column Layout: Upcoming Registrations vs Notifications */}
        <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '3rem' }}>
          {/* Registered Events (2 Columns wide on desktop, 1 on mobile) */}
          <div className="dashboard-main-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Your Upcoming Events</h2>
              <Link to="/student/registrations" style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
                Manage All Registrations →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#818cf8' }}>Loading...</div>
            ) : activeRegistrations.length === 0 ? (
              <div
                className="glass-panel"
                style={{ padding: '2.5rem', textAlign: 'center' }}
              >
                <Calendar size={36} color="#6366f1" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No Active Registrations</h3>
                <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>
                  You haven't registered for any upcoming events yet.
                </p>
                <Link to="/events" className="btn btn-primary btn-sm">
                  Explore Campus Events
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeRegistrations.slice(0, 3).map((reg) => {
                  const ev = reg.event;
                  if (!ev) return null;
                  const startDate = new Date(ev.start_time);

                  return (
                    <div
                      key={reg.id}
                      className="glass-card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                            {startDate.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>
                            {startDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{ev.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            <MapPin size={14} color="#ec4899" /> {ev.venue} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="badge badge-published">Confirmed</span>
                        <button
                          onClick={() => setSelectedEventId(ev.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Notifications (1 Column wide) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Recent Notices</h2>
              <Link to="/notifications" style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
                View Inbox →
              </Link>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentNotifications.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No notifications yet.
                </div>
              ) : (
                recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.75rem',
                      background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                      borderRadius: 8,
                      borderLeft: n.is_read ? '2px solid transparent' : '2px solid #6366f1',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recommended Events */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem' }}>Discover More Events</h2>
            <Link to="/events" className="btn btn-secondary btn-sm">
              All Events
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {recommendedEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onSelect={(e) => setSelectedEventId(e.id)}
                onRegister={async (eventId) => {
                  try {
                    await registrationsAPI.register(eventId);
                    addToast('Registration confirmed!', 'success');
                    loadData();
                  } catch (err) {
                    addToast(err.response?.data?.detail || 'Failed to register', 'error');
                  }
                }}
                isRegistered={ev.is_user_registered}
              />
            ))}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEventId && (
          <EventDetailModal
            eventId={selectedEventId}
            onClose={() => setSelectedEventId(null)}
            onRegisterSuccess={() => {
              addToast('Registration confirmed!', 'success');
              loadData();
            }}
          />
        )}
      </div>
    </div>
  );
};
