import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Key, User, Building, Phone, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    student_id_number: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      addToast('Account created successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err.message || err.response?.data?.detail || 'Failed to create account.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: 540 }}>
        <div className="glass-panel auth-panel" style={{ padding: '2.25rem 1.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
              Create Your <span className="text-gradient">CEMS</span> Account
            </h1>
            <p className="text-muted text-sm">
              Register as a student or event coordinator
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role Switcher */}
            <div className="form-group">
              <label className="form-label">Register As</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`btn ${formData.role === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.65rem 0.5rem', fontSize: '0.875rem' }}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'coordinator' })}
                  className={`btn ${formData.role === 'coordinator' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.65rem 0.5rem', fontSize: '0.875rem' }}
                >
                  Event Coordinator
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Campus Email *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="email"
                  required
                  placeholder="name@cems.edu"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password * (min 6 chars)</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Department and Student ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Department / Branch</label>
                <div style={{ position: 'relative' }}>
                  <Building size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              {formData.role === 'student' ? (
                <div className="form-group">
                  <label className="form-label">Student ID / Roll No</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="text"
                      placeholder="e.g. CS2024-042"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.student_id_number}
                      onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                    <input
                      type="tel"
                      placeholder="+1-555-0100"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
