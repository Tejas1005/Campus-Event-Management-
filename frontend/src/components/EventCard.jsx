import React from 'react';
import { Calendar, MapPin, Users, CheckCircle, Clock } from 'lucide-react';

export const EventCard = ({ event, onSelect, onRegister, isRegistered }) => {
  const startDate = new Date(event.start_time);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const percentFilled = Math.min(
    100,
    Math.round(((event.registered_count || 0) / event.capacity) * 100)
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-published">Published</span>;
      case 'pending_approval':
        return <span className="badge badge-pending">Pending Review</span>;
      case 'approved':
        return <span className="badge badge-approved">Approved</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge badge-draft">Draft</span>;
    }
  };

  const isFull = event.available_seats <= 0;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Banner */}
      <div
        style={{
          height: 170,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        }}
      >
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
            }}
          >
            <Calendar size={48} opacity={0.3} />
          </div>
        )}

        {/* Top Floating Tags */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {event.category_name || 'Campus Event'}
          </span>
          {getStatusBadge(event.status)}
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#f8fafc',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8rem',
          }}
        >
          {event.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#94a3b8' }}>
            <Calendar size={15} color="#818cf8" />
            <span>{formattedDate}</span>
            <span style={{ color: '#475569' }}>•</span>
            <Clock size={15} color="#818cf8" />
            <span>{formattedTime}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#94a3b8' }}>
            <MapPin size={15} color="#ec4899" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.venue}
            </span>
          </div>
        </div>

        {/* Capacity Meter */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.35rem' }}>
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={14} /> Capacity
            </span>
            <span style={{ fontWeight: 600, color: isFull ? '#f43f5e' : '#cbd5e1' }}>
              {event.registered_count || 0} / {event.capacity} seats ({event.available_seats} left)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${percentFilled}%`,
                height: '100%',
                background: isFull
                  ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                  : percentFilled > 80
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #6366f1, #38bdf8)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => onSelect(event)}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            Details
          </button>

          {onRegister && (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isRegistered || isFull || event.status !== 'published'}
              className={`btn btn-sm ${isRegistered ? 'btn-success' : 'btn-primary'}`}
              style={{ flex: 1.2 }}
            >
              {isRegistered ? (
                <>
                  <CheckCircle size={15} /> Registered
                </>
              ) : isFull ? (
                'Full'
              ) : (
                'Register'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
