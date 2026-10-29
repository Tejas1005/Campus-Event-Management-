import React from 'react';
import { Calendar, Heart, Shield, Code2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(7, 9, 19, 0.95)',
        padding: '3rem 0 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div className="footer-grid" style={{ marginBottom: '2.5rem' }}>
          {/* Brand Col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={18} color="#fff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                <span className="text-gradient">CEMS</span>
              </span>
            </div>
            <p className="text-muted text-sm">
              The unified campus event hub. Enabling seamless discovery, real-time seat reservations, and administrative governance for higher-education events.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Quick Navigation</h4>
            <Link to="/events" className="text-muted text-sm" style={{ transition: 'color 0.2s' }}>
              Explore Events
            </Link>
            <Link to="/login" className="text-muted text-sm">
              Student Portal
            </Link>
            <Link to="/login?role=coordinator" className="text-muted text-sm">
              Coordinator Portal
            </Link>
            <Link to="/login?role=admin" className="text-muted text-sm">
              Administration Portal
            </Link>
          </div>

          {/* Event Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Event Domains</h4>
            <span className="text-muted text-sm">Technical Hackathons</span>
            <span className="text-muted text-sm">Cultural & Arts Fests</span>
            <span className="text-muted text-sm">Academic Seminars</span>
            <span className="text-muted text-sm">Sports & Athletics</span>
          </div>

          {/* Institutional Compliance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>Campus Security</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="text-muted text-sm">
              <Shield size={16} color="#10b981" /> Strict RBAC Enforced
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="text-muted text-sm">
              <Code2 size={16} color="#38bdf8" /> REST API + SQLite Engine
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="text-muted text-sm">
              <Users size={16} color="#f472b6" /> Multi-Role Architecture
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-glass)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span className="text-muted text-xs">
            © 2026 Campus Event Management System (CEMS). Built for collegiate excellence.
          </span>
          <span className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Built with React, FastAPI & SQLAlchemy
          </span>
        </div>
      </div>
    </footer>
  );
};
