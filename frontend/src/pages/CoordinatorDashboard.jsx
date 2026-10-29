import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Send,
  XCircle,
  Search,
  Trash2,
} from 'lucide-react';
import { eventsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { EventFormModal } from '../components/EventFormModal';
import { ParticipantAttendanceModal } from '../components/ParticipantAttendanceModal';

export const CoordinatorDashboard = () => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [attendanceTargetEvent, setAttendanceTargetEvent] = useState(null);
  const [rejectionTarget, setRejectionTarget] = useState(null);

  // Cancellation prompt
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchMyEvents = () => {
    setLoading(true);
    eventsAPI
      .getCoordinatorEvents()
      .then((res) => setEvents(res.data))
      .catch(() => {
        // Backend may be offline or session is mock — silently show empty
        setEvents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleSubmitForApproval = async (eventId) => {
    try {
      await eventsAPI.submitForApproval(eventId);
      addToast('Event submitted for administrator review.', 'success');
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to submit event.', 'error');
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await eventsAPI.cancel(cancelTarget.id, cancelReason || 'Event cancelled by coordinator');
      addToast('Event cancelled. Attendees have been notified.', 'info');
      setCancelTarget(null);
      setCancelReason('');
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to cancel event.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Delete prompt
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventsAPI.delete(deleteTarget.id);
      addToast(`Event "${deleteTarget.title}" was permanently removed.`, 'success');
      setDeleteTarget(null);
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete event.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // KPIs
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'published').length;
  const pendingApprovals = events.filter((e) => e.status === 'pending_approval').length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Top Header */}
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
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>
              Coordinator <span className="text-gradient">Hub</span>
            </h1>
            <p className="text-muted text-sm">
              Create events, track administrator approvals, manage rosters, and record attendance
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
            className="btn btn-primary"
          >
            <PlusCircle size={18} /> Create New Event
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card">
            <div style={{ color: '#818cf8', marginBottom: '0.4rem' }}>
              <Calendar size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalEvents}</div>
            <div className="text-muted text-sm">Managed Events</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{publishedEvents}</div>
            <div className="text-muted text-sm">Live Published Events</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#f59e0b', marginBottom: '0.4rem' }}>
              <Clock size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{pendingApprovals}</div>
            <div className="text-muted text-sm">Pending Admin Review</div>
          </div>

          <div className="stat-card">
            <div style={{ color: '#38bdf8', marginBottom: '0.4rem' }}>
              <Users size={24} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalRegistrations}</div>
            <div className="text-muted text-sm">Total Attendees Registered</div>
          </div>
        </div>

        {/* Event List Section */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <h2 style={{ fontSize: '1.3rem' }}>My Campus Events</h2>

            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input
                type="text"
                placeholder="Filter events..."
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingBlock: '0.45rem', width: '100%' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>
              Loading your events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No events found. Click "Create New Event" above to host an event.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cems-table">
                <thead>
                  <tr>
                    <th>Event Details</th>
                    <th>Category</th>
                    <th>Date & Time</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => {
                    const isDraft = ev.status === 'draft';
                    const isPending = ev.status === 'pending_approval';
                    const isApproved = ev.status === 'approved';
                    const isPublished = ev.status === 'published';
                    const isRejected = ev.status === 'rejected';
                    const isCancelled = ev.status === 'cancelled';

                    return (
                      <tr key={ev.id}>
                        <td style={{ maxWidth: 280 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{ev.venue}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                            {ev.category_name || 'General'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {new Date(ev.start_time).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {new Date(ev.start_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {ev.registered_count} / {ev.capacity}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {ev.available_seats} remaining
                          </div>
                        </td>
                        <td>
                          {isPublished && <span className="badge badge-published">Published</span>}
                          {isPending && <span className="badge badge-pending">Pending Review</span>}
                          {isApproved && <span className="badge badge-approved">Approved</span>}
                          {isRejected && (
                            <button
                              onClick={() => setRejectionTarget(ev)}
                              className="badge badge-rejected"
                              style={{ cursor: 'pointer', border: 'none' }}
                            >
                              Rejected (?)
                            </button>
                          )}
                          {isCancelled && <span className="badge badge-cancelled">Cancelled</span>}
                          {isDraft && <span className="badge badge-draft">Draft</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {/* Submit for approval button */}
                            {(isDraft || isRejected) && (
                              <button
                                onClick={() => handleSubmitForApproval(ev.id)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                title="Submit for Administrator Review"
                              >
                                <Send size={13} /> Submit
                              </button>
                            )}

                            {/* Roster & Attendance button */}
                            <button
                              onClick={() => setAttendanceTargetEvent(ev)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Manage Attendance and Participant Roster"
                            >
                              <Users size={13} /> Roster ({ev.registered_count})
                            </button>

                            {/* Edit button */}
                            {!isCancelled && (
                              <button
                                onClick={() => {
                                  setEditingEvent(ev);
                                  setShowEventForm(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                title="Edit Event"
                              >
                                <Edit size={13} />
                              </button>
                            )}

                            {/* Cancel button */}
                            {!isCancelled && (
                              <button
                                onClick={() => setCancelTarget(ev)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f59e0b' }}
                                title="Cancel Event"
                              >
                                <XCircle size={13} />
                              </button>
                            )}

                            {/* Permanently Remove Event */}
                            <button
                              onClick={() => setDeleteTarget(ev)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Permanently Remove Event"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        {showEventForm && (
          <EventFormModal
            event={editingEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onSaveSuccess={(mockEvent) => {
              if (mockEvent && mockEvent.id) {
                // Offline / preview mode — append mock event to local state
                setEvents((prev) => [mockEvent, ...prev]);
              } else {
                // Backend is live — refetch real data
                fetchMyEvents();
              }
            }}
          />
        )}

        {attendanceTargetEvent && (
          <ParticipantAttendanceModal
            event={attendanceTargetEvent}
            onClose={() => {
              setAttendanceTargetEvent(null);
              fetchMyEvents();
            }}
          />
        )}

        {/* Rejection Reason Modal */}
        {rejectionTarget && (
          <div className="modal-overlay" onClick={() => setRejectionTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '1rem' }}>
                <AlertCircle size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Administrator Rejection Feedback</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Event: <strong>{rejectionTarget.title}</strong>
              </p>
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 8,
                  color: '#fecdd3',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginBottom: '1.5rem',
                }}
              >
                {rejectionTarget.rejection_reason || 'No specific reason provided by administrator.'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setRejectionTarget(null)} className="btn btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = rejectionTarget;
                    setRejectionTarget(null);
                    setEditingEvent(target);
                    setShowEventForm(true);
                  }}
                  className="btn btn-primary"
                >
                  Edit and Resubmit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Event Prompt */}
        {cancelTarget && (
          <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '1rem' }}>
                <AlertCircle size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Cancel Event</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
                Are you sure you want to cancel <strong style={{ color: '#fff' }}>"{cancelTarget.title}"</strong>? All registered attendees will receive an automated cancellation notice.
              </p>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unforeseen weather / speaker emergency"
                  className="form-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setCancelTarget(null)} className="btn btn-secondary">
                  Dismiss
                </button>
                <button
                  onClick={handleCancelEvent}
                  disabled={cancelling || !cancelReason.trim()}
                  className="btn btn-danger"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Event Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '1rem' }}>
                <Trash2 size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Permanently Remove Event?</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.925rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>"{deleteTarget.title}"</strong>?
                <br />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  This will remove the event, participant rosters, attendance records, and feedback from the system. Registered attendees will be notified of the cancellation.
                </span>
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">
                  Keep Event
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  className="btn btn-danger"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
