import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { eventsAPI, categoriesAPI, registrationsAPI } from '../services/api';
import { EventCard } from '../components/EventCard';
import { EventDetailModal } from '../components/EventDetailModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState('published');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedEventId, setSelectedEventId] = useState(null);

  const { isAuthenticated, isStudent } = useAuth();
  const { addToast } = useToast();

  const fetchEvents = () => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedStatus) params.status = selectedStatus;
    if (startDate) params.start_date = new Date(startDate).toISOString();
    if (endDate) params.end_date = new Date(endDate).toISOString();

    eventsAPI
      .list(params)
      .then((res) => {
        setEvents(res.data);
      })
      .catch((err) => {
        addToast('Failed to load events.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesAPI.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleRegister = async (eventId) => {
    if (!isAuthenticated) {
      addToast('Please login to register for events.', 'warning');
      return;
    }

    try {
      await registrationsAPI.register(eventId);
      addToast('Registration confirmed successfully!', 'success');
      fetchEvents();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to register.', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('published');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
            Explore <span className="text-gradient">Campus Events</span>
          </h1>
          <p className="text-muted">
            Find technical hackathons, cultural fests, academic workshops, and competitions
          </p>
        </div>

        {/* Filter Toolbar */}
        <div
          className="glass-panel"
          style={{ padding: '1.25rem', marginBottom: '2.5rem' }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top row: search + submit */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
                <Search size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: 12 }} />
                <input
                  type="text"
                  placeholder="Search events by title, venue, or keyword..."
                  className="form-input"
                  style={{ paddingLeft: '2.6rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Search
                </button>
                {(search || selectedCategory || startDate || endDate) && (
                  <button type="button" onClick={clearFilters} className="btn btn-ghost">
                    <X size={16} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Bottom row: Category chip filters & dates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
              {/* Category Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 200px', minWidth: 0 }}>
                <Filter size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <select
                  className="form-select"
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', width: '100%' }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: '1 1 240px', minWidth: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                <Calendar size={16} color="#818cf8" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 110px', minWidth: 0 }}>
                  <span style={{ fontSize: '0.775rem' }}>From:</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem', width: '100%', minWidth: 0 }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 110px', minWidth: 0 }}>
                  <span style={{ fontSize: '0.775rem' }}>To:</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem', width: '100%', minWidth: 0 }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Event Grid */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#818cf8' }}>
            Loading campus events...
          </div>
        ) : events.length === 0 ? (
          <div
            className="glass-panel"
            style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}
          >
            <Calendar size={48} color="#6366f1" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Events Match Your Filters</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
              Try broadening your search term or resetting category filters.
            </p>
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {events.map((event) => (
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

        {/* Event Detail Modal */}
        {selectedEventId && (
          <EventDetailModal
            eventId={selectedEventId}
            onClose={() => setSelectedEventId(null)}
            onRegisterSuccess={() => {
              addToast('Registration confirmed successfully!', 'success');
              fetchEvents();
            }}
          />
        )}
      </div>
    </div>
  );
};
