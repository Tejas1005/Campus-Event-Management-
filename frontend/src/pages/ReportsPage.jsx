import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  TrendingUp,
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsAPI.getStats(),
      reportsAPI.getCategoryDistribution(),
      reportsAPI.getAttendanceSummary(),
    ])
      .then(([statsRes, catRes, attRes]) => {
        setStats(statsRes.data);
        setCategories(catRes.data);
        setAttendanceSummary(attRes.data.items || []);
      })
      .catch((err) => {
        addToast('Failed to load reporting analytics.', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCSV = () => {
    const csvUrl = reportsAPI.getExportCsvUrl();
    const token = sessionStorage.getItem('cems_token') || localStorage.getItem('cems_token');

    // Fetch with authorization header and download blob
    fetch(csvUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to download CSV');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cems_registrations_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast('Registration CSV report exported successfully!', 'success');
      })
      .catch((err) => {
        addToast('Export failed. Ensure you are logged in as admin.', 'error');
      });
  };

  const totalCategoryRegs = categories.reduce((sum, c) => sum + c.registration_count, 0) || 1;

  return (
    <div className="page-wrapper">
      <div className="container">
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
              System <span className="text-gradient">Analytics & Reports</span>
            </h1>
            <p className="text-muted text-sm">
              Comprehensive operational metrics, domain participation, and turnout analysis
            </p>
          </div>

          <button onClick={handleDownloadCSV} className="btn btn-primary" style={{ flex: '1 1 auto', minHeight: 42 }}>
            <Download size={18} /> Export Registrations CSV
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#818cf8' }}>
            Generating institutional reports...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {stats && (
              <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
                <div className="stat-card">
                  <div style={{ color: '#818cf8', marginBottom: '0.4rem' }}>
                    <Users size={24} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_students}</div>
                  <div className="text-muted text-sm">Registered Students</div>
                </div>

                <div className="stat-card">
                  <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
                    <Calendar size={24} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total_events}</div>
                  <div className="text-muted text-sm">Total Campus Events</div>
                </div>

                <div className="stat-card">
                  <div style={{ color: '#38bdf8', marginBottom: '0.4rem' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    {stats.active_registrations}
                  </div>
                  <div className="text-muted text-sm">Active Seat Reservations</div>
                </div>

                <div className="stat-card">
                  <div style={{ color: '#ec4899', marginBottom: '0.4rem' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.attendance_rate}%</div>
                  <div className="text-muted text-sm">Turnout Completion Rate</div>
                </div>
              </div>
            )}

            {/* Category Breakdown & Distribution */}
            <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '2.5rem' }}>
              {/* Category Registration Share */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#f8fafc' }}>
                  Student Registrations by Category
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {categories.map((c) => {
                    const pct = Math.round((c.registration_count / totalCategoryRegs) * 100);

                    return (
                      <div key={c.category_id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600 }}>{c.category_name}</span>
                          <span style={{ color: '#94a3b8' }}>
                            {c.registration_count} registrations ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event Domain Density */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: '#f8fafc' }}>
                  Event Count by Domain
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categories.map((c) => (
                    <div
                      key={c.category_id}
                      style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.category_name}</span>
                      <span className="badge badge-published">{c.event_count} Events</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance & Participation Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Event Attendance & Seat Utilization Roster</h3>
              </div>

              <div className="table-responsive">
                <table className="cems-table">
                  <thead>
                    <tr>
                      <th>Event Title</th>
                      <th>Max Capacity</th>
                      <th>Registrations</th>
                      <th>Marked Present</th>
                      <th>Marked Absent</th>
                      <th>Turnout Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary.map((item) => (
                      <tr key={item.event_id}>
                        <td style={{ fontWeight: 600 }}>{item.event_title}</td>
                        <td>{item.capacity}</td>
                        <td>{item.registered_count}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{item.present_count}</td>
                        <td style={{ color: '#f43f5e', fontWeight: 600 }}>{item.absent_count}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 60, height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${item.attendance_rate}%`,
                                  height: '100%',
                                  background: item.attendance_rate > 70 ? '#10b981' : '#f59e0b',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              {item.attendance_rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
