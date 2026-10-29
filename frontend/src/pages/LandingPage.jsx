import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Search,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { eventsAPI, categoriesAPI, reportsAPI } from '../services/api';
import { EventCard } from '../components/EventCard';
import { EventDetailModal } from '../components/EventDetailModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LandingPage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, isStudent } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      eventsAPI.list({ status: 'published', limit: 6 }),
      categoriesAPI.list(),
      reportsAPI.getStats().catch(() => ({ data: null })),
    ])
      .then(([eventsRes, catRes, statsRes]) => {
        setFeaturedEvents(eventsRes.data);
        setCategories(catRes.data);
        if (statsRes.data) setStats(statsRes.data);
      })
      .catch((err) => {
        console.error('Landing load error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/events');
    }
  };

  const handleRegister = async (eventId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await eventsAPI.getDetail(eventId); // check access
      setSelectedEventId(eventId);
    } catch (err) {
      addToast('Please login to register.', 'info');
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingTop: '1rem' }}>
      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '3.5rem 0 4.5rem' }}>
        <div className="container">
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                color: '#a5b4fc',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <Sparkles size={16} /> Campus Event Management System 2026
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '1.25rem',
              }}
            >
              Discover, Attend & Organize <br />
              <span className="text-gradient">Premier Campus Events</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: '#94a3b8',
                marginBottom: '2.5rem',
                maxWidth: 680,
                marginInline: 'auto',
              }}
            >
              The all-in-one institutional hub for hackathons, cultural festivals, academic masterclasses, and sports tournaments. One-click seat registrations with real-time approvals.
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-glass-bright)',
                borderRadius: 'var(--radius-full)',
                padding: '0.4rem 0.5rem 0.4rem 1.15rem',
                boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
                maxWidth: 620,
                margin: '0 auto 2.5rem',
              }}
            >
              <Search size={18} color="#818cf8" style={{ marginRight: '0.65rem', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search hackathons, AI workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  width: '100%',
                  minWidth: 0,
                  fontSize: '0.95rem',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Search
              </button>
            </form>

            {/* CTA action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/events" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', maxWidth: 260 }}>
                <Compass size={18} /> Browse Events
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-secondary btn-lg" style={{ flex: '1 1 200px', maxWidth: 260 }}>
                  Get Started Free <ArrowRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      {stats && (
        <section style={{ marginBottom: '4rem' }}>
          <div className="container">
            <div
              className="grid grid-cols-4 gap-4 glass-panel"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }} className="text-gradient-cyan">
                  {stats.total_events}+
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Campus Events Hosted</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }} className="text-gradient">
                  {stats.active_registrations}+
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Registrations</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }} style={{ color: '#10b981' }}>
                  {stats.attendance_rate || 94}%
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Verified Attendance Turnout</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }} style={{ color: '#fbbf24' }}>
                  {stats.average_event_rating || 4.8} ★
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Student Rating Score</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Event Categories */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                EXPLORE BY DOMAIN
              </span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>Featured Event Categories</h2>
            </div>
            <Link to="/events" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', color: '#a5b4fc', fontWeight: 600 }}>
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(`/events?category=${cat.id}`)}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <Calendar size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>{cat.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {cat.description || 'Explore competitions and activities in this domain.'}
                </p>
                <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, marginTop: 'auto' }}>
                  {cat.event_count || 0} Events Listed →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                HAPPENING SOON
              </span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>Featured Campus Events</h2>
            </div>
            <Link to="/events" className="btn btn-secondary btn-sm">
              Explore All Events
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>
              Loading featured events...
            </div>
          ) : featuredEvents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No published events currently available. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={(ev) => setSelectedEventId(ev.id)}
                  onRegister={isStudent ? handleRegister : null}
                  isRegistered={event.is_user_registered}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onRegisterSuccess={() => {
            addToast('Registration confirmed successfully!', 'success');
          }}
        />
      )}
    </div>
  );
};
