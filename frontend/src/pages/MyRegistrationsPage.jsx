import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  MessageSquare,
  X,
} from 'lucide-react';
import { registrationsAPI, feedbackAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Feedback Modal State
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const { addToast } = useToast();

  const fetchRegistrations = () => {
    setLoading(true);
    registrationsAPI
      .getMyRegistrations()
      .then((res) => setRegistrations(res.data))
      .catch((err) => addToast('Failed to load registrations.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await registrationsAPI.cancel(cancelTarget.id, cancelReason);
      addToast('Registration cancelled successfully.', 'info');
      setCancelTarget(null);
      setCancelReason('');
      fetchRegistrations();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to cancel registration.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackTarget) return;
    setSubmittingFeedback(true);
    try {
      await feedbackAPI.submit(feedbackTarget.event_id, {
        rating: parseInt(rating),
        comment: comment.trim(),
      });
      addToast('Feedback submitted successfully. Thank you!', 'success');
      setFeedbackTarget(null);
      setComment('');
      fetchRegistrations();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit feedback.', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (activeTab === 'confirmed') return r.status === 'confirmed';
    if (activeTab === 'cancelled') return r.status === 'cancelled';
    if (activeTab === 'attended') return r.attendance?.status === 'present';
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
            My <span className="text-gradient">Registrations</span>
          </h1>
          <p className="text-muted">
            Track confirmed event passes, verified attendance records, and submit reviews
          </p>
        </div>

        {/* Tabs Toolbar */}
        <div
          className="scrollable-tabs"
          style={{
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { id: 'all', label: `All Records (${registrations.length})` },
            { id: 'confirmed', label: `Confirmed (${registrations.filter((r) => r.status === 'confirmed').length})` },
            { id: 'attended', label: `Attended (${registrations.filter((r) => r.attendance?.status === 'present').length})` },
            { id: 'cancelled', label: `Cancelled (${registrations.filter((r) => r.status === 'cancelled').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#818cf8' }}>
            Loading your registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <BookmarkCheck size={44} color="#6366f1" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>No Registrations Found</h3>
            <p className="text-muted text-sm">
              You do not have any registration records under this filter tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRegistrations.map((reg) => {
              const ev = reg.event;
              if (!ev) return null;

              const isConfirmed = reg.status === 'confirmed';
              const isPresent = reg.attendance?.status === 'present';
              const isAbsent = reg.attendance?.status === 'absent';
              const eventStartDate = new Date(ev.start_time);
              const hasStarted = eventStartDate <= new Date();

              return (
                <div
                  key={reg.id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 240px', minWidth: 0 }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>
                        {eventStartDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>
                        {eventStartDate.getDate()}
                      </span>
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span
                          className={`badge ${
                            isConfirmed ? 'badge-published' : 'badge-cancelled'
                          }`}
                        >
                          {reg.status}
                        </span>
                        {isPresent ? (
                          <span className="badge badge-present">Attended</span>
                        ) : isAbsent ? (
                          <span className="badge badge-absent">Absent</span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{ev.title}</h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} color="#ec4899" /> {ev.venue}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} color="#818cf8" />
                          {eventStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>Registered on {new Date(reg.registration_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Feedback button if eligible and not already submitted */}
                    {isConfirmed && !reg.has_feedback && (
                      <button
                        onClick={() => setFeedbackTarget(reg)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <MessageSquare size={15} color="#fbbf24" /> Review & Rate
                      </button>
                    )}

                    {reg.has_feedback && (
                      <span style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Star size={14} fill="#fbbf24" /> Feedback Submitted
                      </span>
                    )}

                    {/* Cancel button if confirmed and event hasn't started */}
                    {isConfirmed && !hasStarted && (
                      <button
                        onClick={() => setCancelTarget(reg)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancel Registration
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        {cancelTarget && (
          <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f43f5e' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Confirm Cancellation</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
                Are you sure you want to cancel your seat for{' '}
                <strong style={{ color: '#fff' }}>"{cancelTarget.event?.title}"</strong>? Your reserved seat will be returned to the pool for other students.
              </p>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Optional Cancellation Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule clash with lab exam"
                  className="form-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="btn btn-secondary"
                >
                  Keep Registration
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="btn btn-danger"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackTarget && (
          <div className="modal-overlay" onClick={() => setFeedbackTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Rate Event Experience</h3>
                <button onClick={() => setFeedbackTarget(null)} className="btn btn-ghost" style={{ padding: '0.3rem' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                {feedbackTarget.event?.title}
              </div>

              <form onSubmit={handleFeedbackSubmit}>
                {/* Star rating selector */}
                <div className="form-group" style={{ alignItems: 'center', marginBlock: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Star
                          size={32}
                          fill={star <= rating ? '#fbbf24' : 'transparent'}
                          color={star <= rating ? '#fbbf24' : '#64748b'}
                        />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '0.35rem', fontWeight: 600 }}>
                    {rating} of 5 Stars
                  </span>
                </div>

                {/* Comment */}
                <div className="form-group">
                  <label className="form-label">Feedback / Suggestions</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Share what you liked about the speaker, logistics, or competition format..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackTarget(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="btn btn-primary"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
