import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
  Send,
  AlertTriangle,
  Search,
  PlusCircle,
  Clock,
  Sparkles,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  eventsAPI,
  usersAPI,
  categoriesAPI,
  reportsAPI,
  notificationsAPI,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EventDetailModal } from '../components/EventDetailModal';
import { EventFormModal } from '../components/EventFormModal';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('approvals'); // approvals | all_events | users | categories | broadcast
  const [stats, setStats] = useState(null);

  // Event Creation, Editing & Deletion State
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingAdminEvent, setEditingAdminEvent] = useState(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Cancel event from admin
  const [cancelAdminTarget, setCancelAdminTarget] = useState(null);
  const [cancelAdminReason, setCancelAdminReason] = useState('');
  const [cancellingAdmin, setCancellingAdmin] = useState(false);

  // Approvals State
  const [pendingEvents, setPendingEvents] = useState([]);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // All Events State
  const [allEvents, setAllEvents] = useState([]);
  const [eventsSearch, setEventsSearch] = useState('');

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Categories State
  const [categories, setCategories] = useState([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: 'Calendar' });

  // Broadcast Announcement State
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'alert' });
  const [broadcasting, setBroadcasting] = useState(false);

  // Event Detail Modal
  const [detailEventId, setDetailEventId] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      reportsAPI.getStats(),
      eventsAPI.getPendingEvents(),
      eventsAPI.getAllEvents(),
      usersAPI.list(),
      categoriesAPI.list(),
    ])
      .then(([statsRes, pendingRes, allRes, usersRes, catRes]) => {
        setStats(statsRes.data);
        setPendingEvents(pendingRes.data);
        setAllEvents(allRes.data);
        setUsersList(usersRes.data);
        setCategories(catRes.data);
      })
      .catch((err) => {
        addToast('Failed to load administrator records.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- Handlers for Event Approvals ---
  const handleApproveEvent = async (eventId, coordinatorId) => {
    if (user.id === coordinatorId) {
      addToast(
        'Self-Approval Blocked: Event coordinators cannot approve their own events. Another administrator must review this.',
        'error'
      );
      return;
    }

    try {
      await eventsAPI.approve(eventId);
      addToast('Event approved successfully! It can now be published.', 'success');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Approval failed.', 'error');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionTarget || !rejectionReason.trim()) return;
    setRejecting(true);
    try {
      await eventsAPI.reject(rejectionTarget.id, rejectionReason.trim());
      addToast('Event rejected and feedback returned to coordinator.', 'info');
      setRejectionTarget(null);
      setRejectionReason('');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Rejection failed.', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      await eventsAPI.publish(eventId);
      addToast('Event published live to campus catalog!', 'success');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Publish failed.', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    setDeletingEvent(true);
    try {
      await eventsAPI.delete(deleteEventTarget.id);
      addToast(`Event "${deleteEventTarget.title}" was permanently removed.`, 'success');
      setDeleteEventTarget(null);
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete event.', 'error');
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleCancelAdminEvent = async () => {
    if (!cancelAdminTarget) return;
    setCancellingAdmin(true);
    try {
      await eventsAPI.cancel(cancelAdminTarget.id, cancelAdminReason || 'Cancelled by administrator');
      addToast('Event cancelled. All registered attendees have been notified.', 'info');
      setCancelAdminTarget(null);
      setCancelAdminReason('');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to cancel event.', 'error');
    } finally {
      setCancellingAdmin(false);
    }
  };

  // --- Handlers for User Management ---
  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await usersAPI.updateStatus(targetUser.id, newStatus);
      addToast(`User account status updated to ${newStatus}.`, 'success');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update user status.', 'error');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      addToast(`User role updated to ${newRole}.`, 'success');
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update role.', 'error');
    }
  };

  // --- Handlers for Categories ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, catForm);
        addToast('Category updated.', 'success');
      } else {
        await categoriesAPI.create(catForm);
        addToast('Category created.', 'success');
      }
      setCatModalOpen(false);
      setEditingCategory(null);
      setCatForm({ name: '', description: '', icon: 'Calendar' });
      loadAllData();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Category operation failed.', 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category? Associated events will be moved to General.')) return;
    try {
      await categoriesAPI.delete(catId);
      addToast('Category removed.', 'info');
      loadAllData();
    } catch (err) {
      addToast('Failed to delete category.', 'error');
    }
  };

  // --- Handlers for Broadcast Announcement ---
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return;

    setBroadcasting(true);
    try {
      const res = await notificationsAPI.sendSystemAnnouncement(broadcast);
      addToast(res.data?.message || 'Announcement broadcast to all users!', 'success');
      setBroadcast({ title: '', message: '', type: 'alert' });
    } catch (err) {
      addToast('Failed to broadcast notice.', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

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
              Administrator <span className="text-gradient">Control Center</span>
            </h1>
            <p className="text-muted text-sm">
              Event governance, approval workflows, user permissions, and institutional broadcasts
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAdminEvent(null);
              setShowEventForm(true);
            }}
            className="btn btn-primary"
          >
            <PlusCircle size={18} /> Create New Event
          </button>
        </div>

        {/* Global KPIs */}
        {loading && !stats ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8', marginBottom: '2rem' }}>
            Loading administrator records...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
            <div className="stat-card">
              <div style={{ color: '#f59e0b', marginBottom: '0.4rem' }}>
                <Clock size={24} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{pendingEvents.length}</div>
              <div className="text-muted text-sm">Pending Review Queue</div>
            </div>

            <div className="stat-card">
              <div style={{ color: '#818cf8', marginBottom: '0.4rem' }}>
                <Calendar size={24} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_events}</div>
              <div className="text-muted text-sm">Total Campus Events</div>
            </div>

            <div className="stat-card">
              <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
                <Users size={24} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {stats.total_students + stats.total_coordinators}
              </div>
              <div className="text-muted text-sm">Active Campus Accounts</div>
            </div>

            <div className="stat-card">
              <div style={{ color: '#ec4899', marginBottom: '0.4rem' }}>
                <BarChart3 size={24} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.attendance_rate}%</div>
              <div className="text-muted text-sm">Overall Turnout Rate</div>
            </div>
          </div>
        ) : null}

        {/* Main Tabbed Interface */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Tabs bar */}
          <div
            className="scrollable-tabs"
            style={{
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <button
              onClick={() => setActiveTab('approvals')}
              className={`btn btn-sm ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              Approval Queue ({pendingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('all_events')}
              className={`btn btn-sm ${activeTab === 'all_events' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              All Events ({allEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              User Management ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`btn btn-sm ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              Category Taxonomy ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`btn btn-sm ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              Campus Broadcast
            </button>
          </div>

          {/* TAB 1: APPROVALS QUEUE */}
          {activeTab === 'approvals' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                  Events Pending Review
                </h3>
                <p className="text-muted text-xs">
                  Review submitted proposals. Note: Coordinators cannot approve their own events.
                </p>
              </div>

              {pendingEvents.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: '#10b981' }}>
                  <CheckCircle2 size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>All Caught Up!</div>
                  <div className="text-muted text-sm">No events currently awaiting review.</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="cems-table">
                    <thead>
                      <tr>
                        <th>Event Title</th>
                        <th>Coordinator</th>
                        <th>Category</th>
                        <th>Proposed Date & Venue</th>
                        <th>Capacity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEvents.map((ev) => {
                        const isOwnEvent = user.id === ev.coordinator_id;

                        return (
                          <tr key={ev.id}>
                            <td style={{ maxWidth: 260 }}>
                              <div style={{ fontWeight: 700 }}>{ev.title}</div>
                              <button
                                onClick={() => setDetailEventId(ev.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#818cf8',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                }}
                              >
                                View full details & description
                              </button>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {ev.coordinator_name}
                              </div>
                              {isOwnEvent && (
                                <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700 }}>
                                  (Your Event - Self Approval Prohibited)
                                </span>
                              )}
                            </td>
                            <td>{ev.category_name || 'General'}</td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                {new Date(ev.start_time).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ev.venue}</div>
                            </td>
                            <td>{ev.capacity} seats</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleApproveEvent(ev.id, ev.coordinator_id)}
                                  disabled={isOwnEvent}
                                  className="btn btn-success btn-sm"
                                  title={
                                    isOwnEvent
                                      ? 'Coordinators cannot approve their own events'
                                      : 'Approve Event'
                                  }
                                >
                                  <CheckCircle2 size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectionTarget(ev)}
                                  disabled={isOwnEvent}
                                  className="btn btn-danger btn-sm"
                                  title="Reject with Reason"
                                >
                                  <XCircle size={14} /> Reject
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
          )}

          {/* TAB 2: ALL EVENTS */}
          {activeTab === 'all_events' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <h3 style={{ fontSize: '1.2rem' }}>All Campus Events Directory</h3>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', paddingBlock: '0.45rem', width: '100%' }}
                    value={eventsSearch}
                    onChange={(e) => setEventsSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="cems-table">
                  <thead>
                    <tr>
                      <th>Title & Venue</th>
                      <th>Category</th>
                      <th>Coordinator</th>
                      <th>Registrations</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEvents
                      .filter(
                        (e) =>
                          e.title.toLowerCase().includes(eventsSearch.toLowerCase()) ||
                          e.venue.toLowerCase().includes(eventsSearch.toLowerCase())
                      )
                      .map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{ev.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {ev.venue} • {new Date(ev.start_time).toLocaleDateString()}
                            </div>
                          </td>
                          <td>{ev.category_name}</td>
                          <td>{ev.coordinator_name}</td>
                          <td>
                            {ev.registered_count} / {ev.capacity}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                ev.status === 'published'
                                  ? 'badge-published'
                                  : ev.status === 'approved'
                                  ? 'badge-approved'
                                  : ev.status === 'pending_approval'
                                  ? 'badge-pending'
                                  : 'badge-cancelled'
                              }`}
                            >
                              {ev.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {ev.status === 'approved' && (
                                <button
                                  onClick={() => handlePublishEvent(ev.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Publish Event Live"
                                >
                                  <Sparkles size={13} /> Publish
                                </button>
                              )}
                              <button
                                onClick={() => setDetailEventId(ev.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="View Event Details"
                              >
                                View
                              </button>
                              {ev.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    setEditingAdminEvent(ev);
                                    setShowEventForm(true);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title="Edit Event"
                                >
                                  <Edit size={13} />
                                </button>
                              )}
                              {ev.status !== 'cancelled' && (
                                <button
                                  onClick={() => setCancelAdminTarget(ev)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}
                                  title="Cancel Event"
                                >
                                  <XCircle size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteEventTarget(ev)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                title="Permanently Delete Event"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '1.2rem' }}>User Accounts & Roles</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: '1 1 280px', justifyContent: 'flex-end' }}>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '0.45rem 0.8rem', fontSize: '0.85rem', flex: '1 1 120px' }}
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
                    <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 11 }} />
                    <input
                      type="text"
                      placeholder="Search name/email..."
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', paddingBlock: '0.45rem', width: '100%' }}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="cems-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Roll / ID Number</th>
                      <th>Department</th>
                      <th>Current Role</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList
                      .filter((u) => {
                        const matchesRole = !userRoleFilter || u.role === userRoleFilter;
                        const matchesSearch =
                          u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
                        return matchesRole && matchesSearch;
                      })
                      .map((u) => {
                        const isSelf = u.id === user.id;

                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                              <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>{u.email}</div>
                            </td>
                            <td>{u.student_id_number || 'N/A'}</td>
                            <td>{u.department || 'General'}</td>
                            <td>
                              <select
                                className="form-select"
                                disabled={isSelf}
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.8rem',
                                  width: 'auto',
                                  background: 'rgba(15, 23, 42, 0.9)',
                                }}
                              >
                                <option value="student">Student</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  u.status === 'active' ? 'badge-published' : 'badge-rejected'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td>
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`btn btn-sm ${
                                    u.status === 'active' ? 'btn-danger' : 'btn-success'
                                  }`}
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  {u.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORY TAXONOMY */}
          {activeTab === 'categories' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '1.2rem' }}>Event Category Domains</h3>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCatForm({ name: '', description: '', icon: 'Calendar' });
                    setCatModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <PlusCircle size={15} /> Add Category
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card"
                    style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '1.05rem', color: '#f8fafc' }}>{c.name}</h4>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCatForm({
                              name: c.name,
                              description: c.description || '',
                              icon: c.icon || 'Calendar',
                            });
                            setCatModalOpen(true);
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '0.2rem' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="btn btn-ghost"
                          style={{ padding: '0.2rem', color: '#f43f5e' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{c.description}</p>
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: 'auto' }}>
                      {c.event_count || 0} Events linked
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BROADCAST */}
          {activeTab === 'broadcast' && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>
                  System-Wide Institutional Broadcast
                </h3>
                <p className="text-muted text-sm">
                  Send high-priority notifications instantly to all active student and coordinator accounts
                </p>
              </div>

              <form onSubmit={handleSendBroadcast}>
                <div className="form-group">
                  <label className="form-label">Broadcast Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Spring Break Schedule / Hackathon Extended"
                    className="form-input"
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Type</label>
                  <select
                    className="form-select"
                    value={broadcast.type}
                    onChange={(e) => setBroadcast({ ...broadcast, type: e.target.value })}
                  >
                    <option value="alert">Alert (High Priority)</option>
                    <option value="info">Informational</option>
                    <option value="warning">Warning / Reminder</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Message Content *</label>
                  <textarea
                    required
                    rows="4"
                    className="form-textarea"
                    placeholder="Enter official institutional statement..."
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Send size={16} />
                  {broadcasting ? 'Broadcasting...' : 'Broadcast to All Users'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Rejection Reason Modal */}
        {rejectionTarget && (
          <div className="modal-overlay" onClick={() => setRejectionTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '1rem' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Provide Rejection Reason</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Specify mandatory constructive feedback for{' '}
                <strong style={{ color: '#fff' }}>"{rejectionTarget.title}"</strong>. The coordinator will be notified to revise and resubmit.
              </p>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <textarea
                  required
                  rows="3"
                  className="form-textarea"
                  placeholder="e.g. Venue clashes with Convocation Gala; please reschedule to Lab A or next weekend."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectionTarget(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={rejecting || !rejectionReason.trim()}
                  className="btn btn-danger"
                >
                  {rejecting ? 'Submitting...' : 'Reject Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Create/Edit Modal */}
        {catModalOpen && (
          <div className="modal-overlay" onClick={() => setCatModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <form onSubmit={handleSaveCategory}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics & Hardware"
                    className="form-input"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="Domain scope..."
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Detail Modal */}
        {detailEventId && (
          <EventDetailModal
            eventId={detailEventId}
            onClose={() => setDetailEventId(null)}
          />
        )}

        {/* Event Create / Edit Modal */}
        {showEventForm && (
          <EventFormModal
            event={editingAdminEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingAdminEvent(null);
            }}
            onSaveSuccess={() => {
              setShowEventForm(false);
              setEditingAdminEvent(null);
              loadAllData();
            }}
          />
        )}

        {/* Admin Delete Event Confirmation */}
        {deleteEventTarget && (
          <div className="modal-overlay" onClick={() => setDeleteEventTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e', marginBottom: '1rem' }}>
                <Trash2 size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Permanently Remove Event?</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.925rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete{' '}
                <strong style={{ color: '#fff' }}>"{deleteEventTarget.title}"</strong>?
                <br />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  This action is irreversible and will remove all participant rosters, attendance data, and feedback.
                  Registered students will be notified.
                </span>
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setDeleteEventTarget(null)} className="btn btn-secondary">
                  Keep Event
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deletingEvent}
                  className="btn btn-danger"
                >
                  {deletingEvent ? 'Deleting...' : 'Yes, Delete Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Cancel Event Prompt */}
        {cancelAdminTarget && (
          <div className="modal-overlay" onClick={() => setCancelAdminTarget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f59e0b', marginBottom: '1rem' }}>
                <XCircle size={24} />
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Cancel Event</h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
                Cancel <strong style={{ color: '#fff' }}>"{cancelAdminTarget.title}"</strong>? All registered attendees will receive an automated cancellation notice.
              </p>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue unavailable / scheduling conflict"
                  className="form-input"
                  value={cancelAdminReason}
                  onChange={(e) => setCancelAdminReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setCancelAdminTarget(null)} className="btn btn-secondary">
                  Dismiss
                </button>
                <button
                  onClick={handleCancelAdminEvent}
                  disabled={cancellingAdmin || !cancelAdminReason.trim()}
                  className="btn btn-danger"
                >
                  {cancellingAdmin ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
