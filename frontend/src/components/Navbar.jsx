import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Compass,
  LayoutDashboard,
  BookmarkCheck,
  Bell,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isStudent, isCoordinator, isAdmin, quickRoleLogin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitchRole = async (newRole) => {
    await quickRoleLogin(newRole);
    if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'coordinator') navigate('/coordinator/dashboard');
    else navigate('/student/dashboard');
  };

  useEffect(() => {
    if (isAuthenticated) {
      notificationsAPI
        .list()
        .then((res) => {
          const unread = res.data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="cems-header">
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Calendar size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="text-gradient">CEMS</span>
            <span style={{ fontSize: '0.75rem', marginLeft: '0.4rem', color: '#94a3b8', fontWeight: 600 }}>CAMPUS</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '1.25rem' }} className="desktop-nav">
          <Link
            to="/events"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.925rem',
              fontWeight: 600,
              color: isActive('/events') ? '#a5b4fc' : '#94a3b8',
            }}
          >
            <Compass size={16} /> Explore Events
          </Link>

          {isAuthenticated && isStudent && (
            <>
              <Link
                to="/student/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  color: isActive('/student/dashboard') ? '#a5b4fc' : '#94a3b8',
                }}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                to="/student/registrations"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  color: isActive('/student/registrations') ? '#a5b4fc' : '#94a3b8',
                }}
              >
                <BookmarkCheck size={16} /> My Registrations
              </Link>
            </>
          )}

          {isAuthenticated && isCoordinator && (
            <Link
              to="/coordinator/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.925rem',
                fontWeight: 600,
                color: isActive('/coordinator/dashboard') ? '#c084fc' : '#94a3b8',
              }}
            >
              <LayoutDashboard size={16} /> Coordinator Hub
            </Link>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <Link
                to="/admin/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  color: isActive('/admin/dashboard') ? '#f472b6' : '#94a3b8',
                }}
              >
                <ShieldAlert size={16} /> Admin Hub
              </Link>
              <Link
                to="/admin/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  color: isActive('/admin/reports') ? '#f472b6' : '#94a3b8',
                }}
              >
                <BarChart3 size={16} /> Analytics & Reports
              </Link>
            </>
          )}
        </nav>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isAuthenticated ? (
            <>
              {/* Notifications Link */}
              <Link
                to="/notifications"
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: unreadCount > 0 ? '#38bdf8' : '#94a3b8',
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      background: '#f43f5e',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(244, 63, 94, 0.7)',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Link with Role Tag */}
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'none', flexDirection: 'column' }} className="user-text">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name?.split(' ')[0]}</span>
                  <span
                    className={
                      isAdmin
                        ? 'badge-role-admin'
                        : isCoordinator
                        ? 'badge-role-coord'
                        : 'badge-role-student'
                    }
                    style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 4, textTransform: 'uppercase' }}
                  >
                    {user?.role}
                  </span>
                </div>
              </Link>

              {/* In-Tab Role Switcher (Desktop Only) */}
              <div
                className="desktop-role-switcher"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.25rem 0.5rem',
                }}
                title="Switch active role in this tab"
              >
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Role:</span>
                <select
                  value={user?.role || 'student'}
                  onChange={(e) => handleSwitchRole(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isAdmin ? '#f472b6' : isCoordinator ? '#c084fc' : '#818cf8',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    outline: 'none',
                    textTransform: 'uppercase',
                  }}
                >
                  <option value="student" style={{ background: '#0f172a', color: '#818cf8' }}>Student</option>
                  <option value="coordinator" style={{ background: '#0f172a', color: '#c084fc' }}>Coordinator</option>
                  <option value="admin" style={{ background: '#0f172a', color: '#f472b6' }}>Admin</option>
                </select>
              </div>

              {/* Logout Button (Desktop Only) */}
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm desktop-logout"
                title="Log Out"
                style={{ padding: '0.5rem', display: 'none' }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.75rem' }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.75rem' }}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost mobile-toggle"
            aria-label="Toggle Navigation Menu"
            style={{ padding: '0.45rem', display: 'none', minHeight: 38 }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: 72,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 98,
          }}
        />
      )}

      {/* Mobile Drawer Content */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 0,
            right: 0,
            background: '#090d16',
            borderBottom: '1px solid var(--border-glass-bright)',
            padding: '1.25rem 1.25rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            zIndex: 99,
            boxShadow: '0 20px 30px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* User Profile Card inside Drawer */}
          {isAuthenticated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700 }}>{user?.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
                </div>
              </div>
              <span
                className={
                  isAdmin
                    ? 'badge-role-admin'
                    : isCoordinator
                    ? 'badge-role-coord'
                    : 'badge-role-student'
                }
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 6, textTransform: 'uppercase', fontWeight: 800 }}
              >
                {user?.role}
              </span>
            </div>
          )}

          {/* Quick Role Switcher Buttons inside Drawer */}
          {isAuthenticated && (
            <div>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>
                Switch Active Role
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {[
                  { r: 'student', label: 'Student', color: '#818cf8' },
                  { r: 'coordinator', label: 'Coordinator', color: '#c084fc' },
                  { r: 'admin', label: 'Admin', color: '#f472b6' },
                ].map(({ r, label, color }) => (
                  <button
                    key={r}
                    onClick={() => {
                      handleSwitchRole(r);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${user?.role === r ? color : 'rgba(255,255,255,0.1)'}`,
                      background: user?.role === r ? `${color}22` : 'rgba(255,255,255,0.03)',
                      color: user?.role === r ? '#fff' : '#94a3b8',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.975rem',
                fontWeight: 600,
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                color: isActive('/events') ? '#a5b4fc' : '#cbd5e1',
                background: isActive('/events') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              }}
            >
              <Compass size={20} color="#818cf8" /> Explore Events
            </Link>

            {isAuthenticated && isStudent && (
              <>
                <Link
                  to="/student/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    color: isActive('/student/dashboard') ? '#a5b4fc' : '#cbd5e1',
                    background: isActive('/student/dashboard') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  }}
                >
                  <LayoutDashboard size={20} color="#818cf8" /> Student Dashboard
                </Link>
                <Link
                  to="/student/registrations"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    color: isActive('/student/registrations') ? '#a5b4fc' : '#cbd5e1',
                    background: isActive('/student/registrations') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  }}
                >
                  <BookmarkCheck size={20} color="#818cf8" /> My Registrations
                </Link>
              </>
            )}

            {isAuthenticated && isCoordinator && (
              <Link
                to="/coordinator/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.975rem',
                  fontWeight: 600,
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.5rem',
                  color: isActive('/coordinator/dashboard') ? '#c084fc' : '#cbd5e1',
                  background: isActive('/coordinator/dashboard') ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                }}
              >
                <LayoutDashboard size={20} color="#c084fc" /> Coordinator Hub
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    color: isActive('/admin/dashboard') ? '#f472b6' : '#cbd5e1',
                    background: isActive('/admin/dashboard') ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                  }}
                >
                  <ShieldAlert size={20} color="#f472b6" /> Administrator Hub
                </Link>
                <Link
                  to="/admin/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.975rem',
                    fontWeight: 600,
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    color: isActive('/admin/reports') ? '#f472b6' : '#cbd5e1',
                    background: isActive('/admin/reports') ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
                  }}
                >
                  <BarChart3 size={20} color="#f472b6" /> Reports & Analytics
                </Link>
              </>
            )}

            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.975rem',
                fontWeight: 600,
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                color: isActive('/profile') ? '#a5b4fc' : '#cbd5e1',
                background: isActive('/profile') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              }}
            >
              <UserIcon size={20} color="#94a3b8" /> Account Profile
            </Link>

            <Link
              to="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.975rem',
                fontWeight: 600,
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                color: isActive('/notifications') ? '#38bdf8' : '#cbd5e1',
                background: isActive('/notifications') ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              }}
            >
              <Bell size={20} color="#38bdf8" /> Notifications ({unreadCount})
            </Link>
          </div>

          {/* Drawer Sign Out Button */}
          {isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#fb7185',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                background: 'rgba(244, 63, 94, 0.08)',
                marginTop: '0.5rem',
              }}
            >
              <LogOut size={18} /> Sign Out of CEMS
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .user-text { display: flex !important; }
          .desktop-role-switcher { display: flex !important; }
          .desktop-logout { display: inline-flex !important; }
        }
        @media (max-width: 768px) {
          .mobile-toggle { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
};
