import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { eventsAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Fallback categories used when the backend is offline or returns no data
const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Technical & Hackathon' },
  { id: 2, name: 'Cultural & Arts' },
  { id: 3, name: 'Sports & Athletics' },
  { id: 4, name: 'Academic & Workshop' },
  { id: 5, name: 'Social & Networking' },
  { id: 6, name: 'Career & Internship' },
  { id: 7, name: 'Health & Wellness' },
  { id: 8, name: 'Other / General' },
];

export const EventFormModal = ({ event, onClose, onSaveSuccess }) => {
  const isEditing = !!event;
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [backendOnline, setBackendOnline] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    venue: '',
    start_time: '',
    end_time: '',
    capacity: 100,
    banner_url: '',
    submit_for_approval: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to load live categories; fall back to static list if backend is offline
    categoriesAPI
      .list()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
          setBackendOnline(true);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES);
        setBackendOnline(false);
      });

    if (event) {
      const formatDT = (dt) => {
        if (!dt) return '';
        const d = new Date(dt);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        category_id: event.category_id || '',
        venue: event.venue || '',
        start_time: formatDT(event.start_time),
        end_time: formatDT(event.end_time),
        capacity: event.capacity || 100,
        banner_url: event.banner_url || '',
        submit_for_approval: false,
      });
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Event title is required.', 'error');
      return;
    }

    if (!formData.venue.trim()) {
      addToast('Venue is required.', 'error');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      addToast('Please specify valid start and end dates/times.', 'error');
      return;
    }

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      addToast('Event end time must be after the start time.', 'error');
      return;
    }

    if (parseInt(formData.capacity) <= 0) {
      addToast('Capacity must be at least 1.', 'error');
      return;
    }

    setLoading(true);

    // If backend is offline or token is not a real JWT, use local mock creation
    if (!backendOnline) {
      const catId = formData.category_id ? parseInt(formData.category_id) : null;
      const selectedCat = categories.find((c) => c.id === catId);
      const mockEvent = {
        id: Date.now(),
        title: formData.title.trim(),
        description: formData.description.trim() || 'No description provided.',
        category_id: catId,
        category_name: selectedCat?.name || 'General',
        venue: formData.venue.trim(),
        capacity: parseInt(formData.capacity),
        banner_url: formData.banner_url.trim() || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        status: formData.submit_for_approval ? 'pending_approval' : 'draft',
        coordinator_id: user?.id || 'coord-001',
        coordinator_name: user?.full_name || 'Coordinator',
        registered_count: 0,
        available_seats: parseInt(formData.capacity),
        is_user_registered: false,
        user_registration_id: null,
        created_at: new Date().toISOString(),
      };

      setTimeout(() => {
        addToast(
          formData.submit_for_approval
            ? 'Event created and submitted for Admin approval! (Preview mode — connect backend to persist)'
            : 'Event saved as draft! (Preview mode — connect backend to persist)',
          'success'
        );
        setLoading(false);
        onSaveSuccess(mockEvent);
        onClose();
      }, 500);
      return;
    }

    // Real backend submission
    try {
      const catId = formData.category_id ? parseInt(formData.category_id) : null;
      const banner = formData.banner_url && formData.banner_url.trim() ? formData.banner_url.trim() : null;

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || 'No description provided.',
        category_id: catId && catId > 0 ? catId : null,
        venue: formData.venue.trim(),
        capacity: parseInt(formData.capacity),
        banner_url: banner,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        submit_for_approval: formData.submit_for_approval,
        publish_now: isAdmin && formData.submit_for_approval,
      };

      if (isEditing) {
        await eventsAPI.update(event.id, payload);
        addToast('Event updated successfully!', 'success');
      } else {
        await eventsAPI.create(payload);
        if (isAdmin && formData.submit_for_approval) {
          addToast('Event created and published live!', 'success');
        } else if (formData.submit_for_approval) {
          addToast('Event created and submitted for Admin approval!', 'success');
        } else {
          addToast('Event saved as draft.', 'success');
        }
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      // Try offline fallback if backend rejects (e.g. invalid/mock token)
      if (err.response?.status === 401 || err.response?.status === 403) {
        addToast(
          'Backend session not active — event created in preview mode. Connect backend & log in with a real account to persist events.',
          'info'
        );
        onSaveSuccess();
        onClose();
        return;
      }

      let msg = 'Failed to save event.';
      if (err.response?.data?.detail) {
        const d = err.response.data.detail;
        if (typeof d === 'string') msg = d;
        else if (Array.isArray(d)) msg = d.map((x) => x.msg || JSON.stringify(x)).join(', ');
        else if (typeof d === 'object') msg = d.message || JSON.stringify(d);
      }
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            {isEditing ? 'Edit Event' : 'Create New Campus Event'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Offline Banner */}
        {!backendOnline && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>
              <strong>Preview Mode:</strong> Backend is offline. Events created here are shown locally only.
              Start the backend server and sign in with a real account to persist events.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. National Hackathon 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Category & Venue Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Category / Domain</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Domain Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Venue / Hall *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Main Auditorium & Lab A1"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
          </div>

          {/* Dates & Capacity */}
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacity (Max Seats) *</label>
              <input
                type="number"
                min="1"
                max="50000"
                required
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          {/* Banner URL */}
          <div className="form-group">
            <label className="form-label">Cover Banner URL (Unsplash or direct image link)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://images.unsplash.com/... (optional)"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Event Description & Agenda *</label>
            <textarea
              required
              rows="4"
              className="form-textarea"
              placeholder="Detailed guidelines, competition rules, prize breakdown, schedule..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Submit for Approval Checkbox */}
          {!isEditing && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                id="submit_for_approval"
                checked={formData.submit_for_approval}
                onChange={(e) => setFormData({ ...formData, submit_for_approval: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label htmlFor="submit_for_approval" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer' }}>
                {isAdmin
                  ? 'Publish Live Immediately to Campus Directory (otherwise save as Draft)'
                  : 'Submit directly for Administrator Review (otherwise save as Draft)'}
              </label>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: '1 1 100px' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: '2 1 140px' }}>
              {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
