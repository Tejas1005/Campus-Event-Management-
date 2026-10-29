import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Star,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { eventsAPI, feedbackAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EventDetailModal = ({ eventId, onClose, onRegisterSuccess }) => {
  const [event, setEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, isStudent, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    Promise.all([
      eventsAPI.getDetail(eventId),
      feedbackAPI.getForEvent(eventId).catch(() => ({ data: { feedbacks: [] } })),
    ])
      .then(([detailRes, fbRes]) => {
        setEvent(detailRes.data);
        setFeedbacks(fbRes.data.feedbacks || []);
      })
      .catch((err) => {
        addToast('Failed to load event details.', 'error');
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      addToast('Please log in to register for events.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (onRegisterSuccess) {
        await onRegisterSuccess(event.id);
        // Refresh event details
        const refreshed = await eventsAPI.getDetail(event.id);
        setEvent(refreshed.data);
      }
    } catch (err) {
      // Toast already triggered by caller
    } finally {
      setSubmitting(false);
    }
  };

  if (!eventId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
      >
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#818cf8' }}>
            Loading event information...
          </div>
        ) : event ? (
          <>
            {/* Header Banner */}
            <div
              style={{
                height: 'clamp(150px, 25vh, 220px)',
                position: 'relative',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              }}
            >
              {event.banner_url && (
                <img
                  src={event.banner_url}
                  alt={event.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, #0f172a 0%, transparent 80%)',
                }}
              />
              <button
                onClick={onClose}
                className="btn btn-ghost"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  padding: '0.4rem',
                  zIndex: 10,
                }}
              >
                <X size={20} color="#fff" />
              </button>

              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <span
                    style={{
                      background: 'rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid rgba(165, 180, 252, 0.4)',
                    }}
                  >
                    {event.category?.name || 'General Event'}
                  </span>
                  <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', marginTop: '0.35rem', color: '#fff' }}>
                    {event.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'clamp(1rem, 3vw, 1.75rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Event Quick Specs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.85rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={18} color="#818cf8" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Date</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {new Date(event.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={18} color="#818cf8" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Time</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MapPin size={18} color="#ec4899" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Venue</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{event.venue}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Users size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Capacity Status</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {event.registered_count} / {event.capacity} seats ({event.available_seats} remaining)
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.6rem', color: '#cbd5e1' }}>
                  About the Event
                </h4>
                <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                  {event.description}
                </p>
              </div>

              {/* Coordinator Info */}
              {event.coordinator && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {event.coordinator.full_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>
                      EVENT COORDINATOR
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {event.coordinator.full_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {event.coordinator.department || 'Campus Faculty'} • {event.coordinator.email}
                    </div>
                  </div>
                </div>
              )}

              {/* Student Feedback & Ratings */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#cbd5e1' }}>
                    Attendee Ratings & Feedback ({feedbacks.length})
                  </h4>
                  {event.average_rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24', fontWeight: 700 }}>
                      <Star size={16} fill="#fbbf24" />
                      <span>{event.average_rating} / 5.0</span>
                    </div>
                  )}
                </div>

                {feedbacks.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, color: '#64748b', fontSize: '0.85rem' }}>
                    No attendee feedback submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 200, overflowY: 'auto' }}>
                    {feedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(15, 23, 42, 0.5)',
                          borderRadius: 8,
                          border: '1px solid var(--border-glass)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fb.student?.full_name || 'Student'}</span>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                fill={s <= fb.rating ? '#fbbf24' : 'none'}
                                color={s <= fb.rating ? '#fbbf24' : '#475569'}
                              />
                            ))}
                          </div>
                        </div>
                        {fb.comment && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  borderTop: '1px solid var(--border-glass)',
                  paddingTop: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <button onClick={onClose} className="btn btn-secondary" style={{ flex: '1 1 100px' }}>
                  Close
                </button>

                {event.status === 'published' && (
                  !isAuthenticated ? (
                    <button
                      onClick={handleRegister}
                      className="btn btn-primary"
                      style={{ flex: '2 1 160px' }}
                    >
                      Log in to Register
                    </button>
                  ) : event.is_user_registered ? (
                    <button disabled className="btn btn-success" style={{ flex: '2 1 160px', opacity: 0.9, cursor: 'default' }}>
                      <CheckCircle2 size={16} /> Registered
                    </button>
                  ) : isStudent ? (
                    <button
                      onClick={handleRegister}
                      disabled={submitting || event.available_seats <= 0}
                      className="btn btn-primary"
                      style={{ flex: '2 1 160px' }}
                    >
                      {submitting ? 'Registering...' : event.available_seats <= 0 ? 'Event Full' : 'Register for Event'}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
