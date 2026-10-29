import axios from 'axios';
import { tabStorage } from './tabSession';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = tabStorage.getItem('cems_token') || sessionStorage.getItem('cems_token') || localStorage.getItem('cems_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect if user had an active session token that has now expired
      const token = tabStorage.getItem('cems_token') || sessionStorage.getItem('cems_token') || localStorage.getItem('cems_token');
      if (token) {
        tabStorage.removeItem('cems_token');
        tabStorage.removeItem('cems_user');
        sessionStorage.removeItem('cems_token');
        sessionStorage.removeItem('cems_user');
        localStorage.removeItem('cems_token');
        localStorage.removeItem('cems_user');
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth APIs ---
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  updateMe: (data) => apiClient.put('/auth/me', data),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
  // Syncs the authenticated user's role in the backend DB (called after Supabase login)
  ensureRole: (role) => apiClient.post('/auth/ensure-role', { role }),
  // Exchange Supabase OAuth token for a real CEMS backend JWT
  googleExchange: (supabaseAccessToken, role) =>
    apiClient.post('/auth/google-exchange', {
      supabase_access_token: supabaseAccessToken,
      role: role || 'student',
    }),
};

// --- Events APIs ---
export const eventsAPI = {
  list: (params) => apiClient.get('/events', { params }),
  getDetail: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  submitForApproval: (id) => apiClient.post(`/events/${id}/submit`),
  approve: (id) => apiClient.post(`/events/${id}/approve`),
  reject: (id, reason) => apiClient.post(`/events/${id}/reject`, { reason }),
  publish: (id) => apiClient.post(`/events/${id}/publish`),
  cancel: (id, reason) => apiClient.post(`/events/${id}/cancel`, { reason }),
  delete: (id) => apiClient.delete(`/events/${id}`),
  getCoordinatorEvents: () => apiClient.get('/events/coordinator/my-events'),
  getPendingEvents: () => apiClient.get('/events/admin/pending'),
  getAllEvents: () => apiClient.get('/events/admin/all'),
};

// --- Registrations APIs ---
export const registrationsAPI = {
  register: (eventId) => apiClient.post('/registrations', { event_id: eventId }),
  cancel: (regId, reason) => apiClient.post(`/registrations/${regId}/cancel`, { reason }),
  getMyRegistrations: () => apiClient.get('/registrations/my-registrations'),
  getParticipants: (eventId) => apiClient.get(`/registrations/events/${eventId}/participants`),
};

// --- Attendance APIs ---
export const attendanceAPI = {
  mark: (registrationId, status) =>
    apiClient.post('/attendance/mark', { registration_id: registrationId, status }),
  bulkMark: (records) => apiClient.post('/attendance/bulk', { records }),
  getEventAttendance: (eventId) => apiClient.get(`/attendance/event/${eventId}`),
};

// --- Notifications APIs ---
export const notificationsAPI = {
  list: () => apiClient.get('/notifications'),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
  sendEventAnnouncement: (eventId, announcement) =>
    apiClient.post(`/notifications/announcement/event/${eventId}`, announcement),
  sendSystemAnnouncement: (announcement) =>
    apiClient.post('/notifications/announcement/system', announcement),
};

// --- Feedback APIs ---
export const feedbackAPI = {
  submit: (eventId, data) => apiClient.post(`/feedback/event/${eventId}`, data),
  getForEvent: (eventId) => apiClient.get(`/feedback/event/${eventId}`),
};

// --- Reports & Analytics APIs ---
export const reportsAPI = {
  getStats: () => apiClient.get('/reports/dashboard-stats'),
  getCategoryDistribution: () => apiClient.get('/reports/category-distribution'),
  getAttendanceSummary: () => apiClient.get('/reports/attendance-summary'),
  getExportCsvUrl: () => `${API_BASE}/reports/export/registrations-csv`,
};

// --- Categories APIs ---
export const categoriesAPI = {
  list: () => apiClient.get('/categories'),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

// --- Admin Users APIs ---
export const usersAPI = {
  list: (params) => apiClient.get('/admin/users', { params }),
  updateStatus: (id, status) => apiClient.put(`/admin/users/${id}/status`, { status }),
  updateRole: (id, role) => apiClient.put(`/admin/users/${id}/role`, { role }),
};

export default apiClient;
