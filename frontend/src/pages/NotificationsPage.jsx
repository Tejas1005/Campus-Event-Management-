import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread

  const { addToast } = useToast();

  const fetchNotifications = () => {
    setLoading(true);
    notificationsAPI
      .list()
      .then((res) => setNotifications(res.data))
      .catch((err) => addToast('Failed to load notifications.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      addToast('Failed to mark notification as read.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      addToast('All notifications marked as read.', 'success');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      addToast('Failed to mark all as read.', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'alert':
        return <AlertCircle size={20} color="#f43f5e" />;
      default:
        return <Info size={20} color="#38bdf8" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
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
              Notifications <span className="text-gradient">Inbox</span>
            </h1>
            <p className="text-muted text-sm">
              Stay informed on event approvals, registrations, announcements, and reminders
            </p>
          </div>

          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <Bell size={40} color="#6366f1" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.3rem' }}>Inbox is Clear</h3>
            <p className="text-muted text-sm">
              You don't have any {filter === 'unread' ? 'unread ' : ''}notifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                className="glass-card"
                onClick={() => !item.is_read && handleMarkRead(item.id)}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: item.is_read ? 'default' : 'pointer',
                  borderLeft: item.is_read
                    ? '1px solid var(--border-glass)'
                    : '4px solid var(--color-primary)',
                  background: item.is_read ? 'rgba(15, 23, 42, 0.4)' : 'rgba(26, 36, 56, 0.75)',
                }}
              >
                <div style={{ marginTop: 2 }}>{getIcon(item.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: item.is_read ? 600 : 700 }}>
                      {item.title}
                    </h3>
                    <span style={{ fontSize: '0.725rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
