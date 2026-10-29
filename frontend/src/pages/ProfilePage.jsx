import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Hash, Phone, Key, Shield, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    department: user?.department || '',
    student_id_number: user?.student_id_number || '',
    phone: user?.phone || '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        department: user.department || '',
        student_id_number: user.student_id_number || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await authAPI.updateMe(profileForm);
      updateUser(res.data);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      addToast('Password changed successfully!', 'success');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to change password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>
            Account <span className="text-gradient">Profile</span>
          </h1>
          <p className="text-muted text-sm">
            Manage your campus credentials, personal information, and password security
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Profile Info Form */}
          <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                {user?.full_name ? user.full_name[0] : 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{user?.full_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span
                    className={
                      user?.role === 'admin'
                        ? 'badge badge-role-admin'
                        : user?.role === 'coordinator'
                        ? 'badge badge-role-coord'
                        : 'badge badge-role-student'
                    }
                  >
                    {user?.role}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981' }}>● Active</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Campus Email (Read-Only)</label>
                <input
                  type="email"
                  disabled
                  className="form-input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  value={user?.email || ''}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  className="form-input"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </div>

              {user?.role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Student ID / Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CS2024-042"
                    className="form-input"
                    value={profileForm.student_id_number}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, student_id_number: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  placeholder="+1-555-0100"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {updatingProfile ? 'Saving...' : 'Update Profile Information'}
              </button>
            </form>
          </div>

          {/* Right: Security & Password Update */}
          <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#38bdf8' }}>
              <Key size={22} />
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Password & Security</h3>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, current_password: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="form-input"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new_password: e.target.value })
                  }
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="form-input"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                {updatingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
