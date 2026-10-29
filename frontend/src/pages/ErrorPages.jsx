import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export const AccessDeniedPage = () => {
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#f43f5e',
            }}
          >
            <ShieldX size={36} />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Access Denied (403)</h1>
          <p className="text-muted text-sm" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
            You do not have the required institutional permissions to access this administrative portal or resource.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/" className="btn btn-secondary">
              <Home size={16} /> Campus Home
            </Link>
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, marginBottom: '1rem' }} className="text-gradient">
            404
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Page Not Found</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
            The campus URL or event link you were looking for doesn't exist or has been relocated.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/" className="btn btn-primary">
              <Home size={16} /> Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
