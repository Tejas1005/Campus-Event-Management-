import React, { useState, useEffect } from 'react';
import { X, Check, CheckCheck, Send, UserCheck, UserX, AlertCircle, Search } from 'lucide-react';
import { registrationsAPI, attendanceAPI, notificationsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ParticipantAttendanceModal = ({ event, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAnnouncementBox, setShowAnnouncementBox] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  const { addToast } = useToast();

  const loadParticipants = () => {
    if (!event) return;
    setLoading(true);
    registrationsAPI
      .getParticipants(event.id)
      .then((res) => {
        setParticipants(res.data);
      })
      .catch((err) => {
        addToast('Failed to load participant roster.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadParticipants();
  }, [event]);

  const handleMarkAttendance = async (registrationId, status) => {
    try {
      await attendanceAPI.mark(registrationId, status);
      addToast(`Attendance marked as ${status}.`, 'success');
      loadParticipants();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to mark attendance.', 'error');
    }
  };

  const handleBulkMark = async (status) => {
    const activeParticipants = participants.filter((p) => p.status === 'confirmed');
    if (activeParticipants.length === 0) return;

    try {
      const records = activeParticipants.map((p) => ({
        registration_id: p.registration_id,
        status,
      }));
      await attendanceAPI.bulkMark(records);
      addToast(`All confirmed attendees marked as ${status}.`, 'success');
      loadParticipants();
    } catch (err) {
      addToast('Bulk update failed.', 'error');
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.message) return;

    setSendingAnnounce(true);
    try {
      const res = await notificationsAPI.sendEventAnnouncement(event.id, announcement);
      addToast(res.data?.message || 'Announcement broadcast successfully!', 'success');
      setShowAnnouncementBox(false);
      setAnnouncement({ title: '', message: '' });
    } catch (err) {
      addToast('Failed to dispatch announcement.', 'error');
    } finally {
      setSendingAnnounce(false);
    }
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.student?.full_name && p.student.full_name.toLowerCase().includes(q)) ||
      (p.student?.student_id_number && p.student.student_id_number.toLowerCase().includes(q)) ||
      (p.student?.department && p.student.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 950 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>{event.title}</h2>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Participant Roster & Attendance Tracking • Capacity: {event.registered_count} / {event.capacity}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
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
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              placeholder="Search student or ID..."
              className="form-input"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.8rem', paddingBlock: '0.5rem', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: '1 1 280px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleBulkMark('present')}
              className="btn btn-secondary btn-sm"
              title="Mark all as Present"
              style={{ flex: '1 1 auto' }}
            >
              <UserCheck size={15} color="#10b981" /> Mark All Present
            </button>
            <button
              onClick={() => handleBulkMark('absent')}
              className="btn btn-secondary btn-sm"
              title="Mark all as Absent"
              style={{ flex: '1 1 auto' }}
            >
              <UserX size={15} color="#f43f5e" /> Mark All Absent
            </button>
            <button
              onClick={() => setShowAnnouncementBox(!showAnnouncementBox)}
              className="btn btn-primary btn-sm"
              style={{ flex: '1 1 auto' }}
            >
              <Send size={15} /> Send Announcement
            </button>
          </div>
        </div>

        {/* Announcement Box if open */}
        {showAnnouncementBox && (
          <form
            onSubmit={handleSendAnnouncement}
            style={{
              padding: '1.25rem',
              background: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              marginBottom: '1.25rem',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#a5b4fc' }}>
              Broadcast Announcement to Registered Attendees
            </h4>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Announcement Title (e.g. Venue Change to Lab B)"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <textarea
                required
                rows="2"
                className="form-textarea"
                placeholder="Message instructions..."
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowAnnouncementBox(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingAnnounce}
                className="btn btn-primary btn-sm"
              >
                {sendingAnnounce ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>
            Loading roster...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No registered attendees found.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: 420 }}>
            <table className="cems-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll / ID</th>
                  <th>Department</th>
                  <th>Registration</th>
                  <th>Attendance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isPresent = item.attendance_status === 'present';
                  const isAbsent = item.attendance_status === 'absent';

                  return (
                    <tr key={item.registration_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.student.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {item.student.email}
                        </div>
                      </td>
                      <td>{item.student.student_id_number || 'N/A'}</td>
                      <td>{item.student.department || 'General'}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === 'confirmed' ? 'badge-published' : 'badge-cancelled'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {isPresent ? (
                          <span className="badge badge-present">Present</span>
                        ) : isAbsent ? (
                          <span className="badge badge-absent">Absent</span>
                        ) : (
                          <span className="badge badge-draft">Unmarked</span>
                        )}
                      </td>
                      <td>
                        {item.status === 'confirmed' ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleMarkAttendance(item.registration_id, 'present')}
                              className={`btn btn-sm ${isPresent ? 'btn-success' : 'btn-secondary'}`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(item.registration_id, 'absent')}
                              className={`btn btn-sm ${isAbsent ? 'btn-danger' : 'btn-secondary'}`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Absent
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cancelled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
