import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: handle global 401 ────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/me'),
  sendVerification: (data) => api.post('/auth/send-verification', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
};

// ─── Doctors ─────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  updateProfile: (data) => api.patch('/doctors/profile', data),
  getAvailableSlots: (id, date) => api.get(`/doctors/${id}/available-slots`, { params: { date } }),
};

// ─── Appointments ────────────────────────────────────────────────
export const appointmentsAPI = {
  book: (data) => api.post('/appointments', data),
  getByUserId: (userId) => api.get(`/appointments/${userId}`),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  archive: (id) => api.patch(`/appointments/${id}/archive`),
};

// ─── Prescriptions ───────────────────────────────────────────────
export const prescriptionsAPI = {
  upload: (formData) =>
    api.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getByAppointment: (appointmentId) => api.get(`/prescriptions/${appointmentId}`),
  generate: (data) => api.post('/prescriptions/generate', data),
};

// ─── Ratings ─────────────────────────────────────────────────────
export const ratingsAPI = {
  submit: (data) => api.post('/ratings', data),
  getByDoctor: (doctorId) => api.get(`/ratings/doctor/${doctorId}`),
  getMyRating: (appointmentId) => api.get(`/ratings/my-rating/${appointmentId}`),
};

// ─── Video Sessions ──────────────────────────────────────────────
export const videoSessionAPI = {
  create: (appointmentId) => api.post('/video-session', { appointment_id: appointmentId }),
};

export default api;

