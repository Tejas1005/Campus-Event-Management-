import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  CalendarCheck,
  ShieldAlert,
  ArrowRight,
  Mail,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tabStorage } from '../services/tabSession';

export const LoginPage = () => {
  // 1. Role Selection state (default to 'student')
  const [selectedRole, setSelectedRole] = useState('student');
  
  // 2. Auth Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'magiclink'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const {
    login,
    loginWithGoogle,
    sendMagicLink,
    isAuthenticated,
    user,
    isSupabaseConfigured,
  } = useAuth();

  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'coordinator') {
        navigate('/coordinator/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, from, navigate]);

  // Handle Google OAuth Login with Selected Role
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle(selectedRole);
    } catch (err) {
      addToast(err.message || 'Google sign in failed.', 'error');
      setGoogleLoading(false);
    }
  };

  // Handle Email + Password Submit with Selected Role
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loggedUser = await login({ email, password, role: selectedRole });
      addToast(`Welcome, ${loggedUser.full_name || 'User'}! Signed in as ${roleDetails[selectedRole].title}.`, 'success');

      if (from) {
        navigate(from, { replace: true });
      } else if (selectedRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (selectedRole === 'coordinator') {
        navigate('/coordinator/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err.message || err.response?.data?.detail || 'Invalid email or password.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Magic Link Submit with Selected Role
  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      tabStorage.setItem('cems_pending_role', selectedRole);
      await sendMagicLink(email);
      setMagicLinkSent(true);
      addToast(`Instant login link sent for ${roleDetails[selectedRole].title}! Check your inbox.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send login email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo login using real backend credentials
  const handleDemoLogin = async (email, password, role) => {
    setLoading(true);
    try {
      const loggedUser = await login({ email, password, role });
      addToast(`Logged in as ${loggedUser.full_name}!`, 'success');
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'coordinator') navigate('/coordinator/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      addToast(err.response?.data?.detail || err.message || 'Demo login failed. Ensure the backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@cems.edu', password: 'Admin@123', role: 'admin', color: '#f472b6', icon: ShieldAlert },
    { label: 'Coordinator', email: 'sarah.coord@cems.edu', password: 'Coord@123', role: 'coordinator', color: '#c084fc', icon: CalendarCheck },
    { label: 'Student', email: 'alex.student@cems.edu', password: 'Student@123', role: 'student', color: '#818cf8', icon: GraduationCap },
  ];

  const roleDetails = {
    student: {
      title: 'Student',
      description: 'Browse campus events, registrations & schedule',
      icon: GraduationCap,
      color: '#818cf8',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.08) 100%)',
      borderColor: 'rgba(99, 102, 241, 0.8)',
    },
    coordinator: {
      title: 'Event Coordinator',
      description: 'Host events, coordinate venues & track attendees',
      icon: CalendarCheck,
      color: '#c084fc',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.08) 100%)',
      borderColor: 'rgba(168, 85, 247, 0.8)',
    },
    admin: {
      title: 'Administrator',
      description: 'Full campus oversight, analytics & system controls',
      icon: ShieldAlert,
      color: '#f472b6',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(236, 72, 153, 0.08) 100%)',
      borderColor: 'rgba(236, 72, 153, 0.8)',
    },
  };

  const currentRole = roleDetails[selectedRole];
  const CurrentIcon = currentRole.icon;

  return (
    <div
      className="page-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2.5rem 1rem',
        background: 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.18) 0%, rgba(10, 14, 26, 1) 75%)',
      }}
    >
      <div className="container" style={{ maxWidth: 540 }}>
        <div
          className="glass-panel auth-panel"
          style={{
            padding: '2.25rem 1.75rem',
            borderRadius: '1.25rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 15,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={24} color="#ffffff" />
            </div>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              Sign In to <span className="text-gradient">CEMS</span>
            </h1>
            <p className="text-muted text-sm">
              Select your role, then sign in with Google or Email
            </p>

            {/* Supabase Status Pill */}
            <div style={{ marginTop: '0.65rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.2rem 0.7rem',
                  borderRadius: '9999px',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  background: isSupabaseConfigured ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                  border: `1px solid ${isSupabaseConfigured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                  color: isSupabaseConfigured ? '#4ade80' : '#facc15',
                }}
              >
                <Database size={12} />
                {isSupabaseConfigured ? (
                  <>
                    <span>Supabase Connected</span>
                    <CheckCircle2 size={12} />
                  </>
                ) : (
                  <>
                    <span>Supabase Pending</span>
                    <AlertCircle size={12} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STEP 1: Select Your Role */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginBottom: '0.65rem',
              }}
            >
              1. Select Your Role
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              {/* Student */}
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                style={{
                  padding: '0.75rem 0.3rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${selectedRole === 'student' ? '#818cf8' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedRole === 'student' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedRole === 'student' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {selectedRole === 'student' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={10} color="#000" strokeWidth={3} />
                  </div>
                )}
                <GraduationCap size={20} color={selectedRole === 'student' ? '#818cf8' : '#64748b'} />
                <span style={{ fontSize: 'clamp(0.725rem, 2.5vw, 0.825rem)', fontWeight: 700 }}>Student</span>
              </button>

              {/* Event Coordinator */}
              <button
                type="button"
                onClick={() => setSelectedRole('coordinator')}
                style={{
                  padding: '0.75rem 0.3rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${selectedRole === 'coordinator' ? '#c084fc' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedRole === 'coordinator' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedRole === 'coordinator' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {selectedRole === 'coordinator' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#c084fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={10} color="#000" strokeWidth={3} />
                  </div>
                )}
                <CalendarCheck size={20} color={selectedRole === 'coordinator' ? '#c084fc' : '#64748b'} />
                <span style={{ fontSize: 'clamp(0.725rem, 2.5vw, 0.825rem)', fontWeight: 700 }}>Coordinator</span>
              </button>

              {/* Administrator */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                style={{
                  padding: '0.75rem 0.3rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${selectedRole === 'admin' ? '#f472b6' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedRole === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedRole === 'admin' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {selectedRole === 'admin' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#f472b6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={10} color="#000" strokeWidth={3} />
                  </div>
                )}
                <ShieldAlert size={20} color={selectedRole === 'admin' ? '#f472b6' : '#64748b'} />
                <span style={{ fontSize: 'clamp(0.725rem, 2.5vw, 0.825rem)', fontWeight: 700 }}>Admin</span>
              </button>
            </div>
          </div>

          {/* Active Role Indicator Banner */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.625rem',
              background: currentRole.gradient,
              border: `1px solid ${currentRole.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <CurrentIcon size={22} color={currentRole.color} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
                Signing in as <span style={{ color: currentRole.color }}>{currentRole.title}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {currentRole.description}
              </div>
            </div>
          </div>

          {/* STEP 2: Sign In Options (Google or Mail) */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                marginBottom: '0.75rem',
              }}
            >
              2. Choose Sign In Method
            </label>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1rem',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                borderRadius: '0.625rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: 'none',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                marginBottom: '1.25rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {googleLoading ? 'Connecting to Google...' : `Sign in with Google as ${currentRole.title}`}
            </button>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                margin: '1.25rem 0',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ padding: '0 0.85rem' }}>or sign in with mail</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            {/* Mail Method Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.25rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                style={{
                  padding: '0.45rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: authMethod === 'password' ? 'var(--primary, #6366f1)' : 'transparent',
                  color: authMethod === 'password' ? '#fff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('magiclink')}
                style={{
                  padding: '0.45rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: authMethod === 'magiclink' ? 'var(--primary, #6366f1)' : 'transparent',
                  color: authMethod === 'magiclink' ? '#fff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Magic Link (OTP)
              </button>
            </div>

            {/* Method A: Email + Password */}
            {authMethod === 'password' ? (
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="email"
                      required
                      placeholder={`your-email@campus.edu`}
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {loading ? 'Authenticating...' : `Sign In as ${currentRole.title}`}
                  {!loading && <ArrowRight size={16} />}
                </button>

                {/* One-Click Demo Accounts */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ⚡ One-Click Demo Accounts
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                    {demoAccounts.map(({ label, email: demoEmail, password: demoPass, role: demoRole, color, icon: Icon }) => (
                      <button
                        key={demoRole}
                        type="button"
                        disabled={loading}
                        onClick={() => handleDemoLogin(demoEmail, demoPass, demoRole)}
                        style={{
                          padding: '0.55rem 0.4rem',
                          borderRadius: '0.6rem',
                          border: `1px solid ${color}44`,
                          background: `${color}11`,
                          color: color,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.2s ease',
                          opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}99`; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}11`; e.currentTarget.style.borderColor = `${color}44`; }}
                        title={`Login as ${demoEmail}`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', marginTop: '0.5rem' }}>
                    Logs in with real backend credentials — events & data persist
                  </p>
                </div>
              </form>
            ) : (
              /* Method B: Magic Link */
              <form onSubmit={handleMagicLinkSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="email"
                      required
                      placeholder="your-email@campus.edu"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-muted text-xs" style={{ marginTop: '0.4rem' }}>
                    We'll email you an instant sign-in link configured for {currentRole.title}.
                  </p>
                </div>

                {magicLinkSent && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#86efac',
                      fontSize: '0.8rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle2 size={16} /> Instant login link sent! Check your inbox.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Send size={15} />
                  {loading ? 'Sending link...' : `Send Magic Link as ${currentRole.title}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
