const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sams_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('sams_token');
    localStorage.removeItem('sams_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=1';
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then((res) => handleResponse<{ success: boolean; token: string; user: any }>(res)),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() }).then((res) => handleResponse<{ success: boolean; user: any }>(res)),

  logout: () =>
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  // Student
  getStudentProfile: () =>
    fetch(`${API_BASE}/students/me`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  getStudentAttendance: (subjectId?: string) => {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return fetch(`${API_BASE}/students/me/attendance${query}`, { headers: getAuthHeaders() }).then((res) => handleResponse(res));
  },

  getStudentSummary: () =>
    fetch(`${API_BASE}/students/me/attendance-summary`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  submitCorrectionRequest: (payload: { attendanceSessionId: string; requestedStatus: string; reason: string }) =>
    fetch(`${API_BASE}/students/me/correction-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  getStudentCorrections: () =>
    fetch(`${API_BASE}/students/me/correction-requests`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  // QR Attendance
  verifyQrToken: (qrToken: string) =>
    fetch(`${API_BASE}/attendance/qr/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qrToken }),
    }).then((res) => handleResponse<{ success: boolean; message: string; record: any }>(res)),

  // Face Recognition Module
  enrollFace: (descriptor: number[]) =>
    fetch(`${API_BASE}/face/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ descriptor, consent: true }),
    }).then((res) => handleResponse(res)),

  verifyFace: (sessionId: string, descriptor: number[]) =>
    fetch(`${API_BASE}/face/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, descriptor }),
    }).then((res) => handleResponse(res)),

  // Faculty
  getFacultySubjects: () =>
    fetch(`${API_BASE}/faculty/me/subjects`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  getFacultySessions: () =>
    fetch(`${API_BASE}/faculty/me/sessions`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  createSession: (payload: { subjectId: string; classSectionId: string; title: string; lectureTopic?: string; durationMinutes: number }) =>
    fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  getSessionDetails: (id: string) =>
    fetch(`${API_BASE}/sessions/${id}`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  closeSession: (id: string) =>
    fetch(`${API_BASE}/sessions/${id}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then((res) => handleResponse(res)),

  markAttendanceManual: (payload: { sessionId: string; studentProfileId: string; status: string; remarks?: string }) =>
    fetch(`${API_BASE}/attendance/manual-mark`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  correctAttendance: (id: string, payload: { status: string; reason: string }) =>
    fetch(`${API_BASE}/attendance/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  // Admin
  getAdminStats: () =>
    fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  getUsers: (role?: string) => {
    const query = role ? `?role=${role}` : '';
    return fetch(`${API_BASE}/admin/users${query}`, { headers: getAuthHeaders() }).then((res) => handleResponse(res));
  },

  createUser: (payload: any) =>
    fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  toggleUserStatus: (id: string, isActive: boolean) =>
    fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    }).then((res) => handleResponse(res)),

  getAcademicsData: async () => {
    const [departments, courses, subjects, sections] = await Promise.all([
      fetch(`${API_BASE}/admin/departments`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r)),
      fetch(`${API_BASE}/admin/courses`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r)),
      fetch(`${API_BASE}/admin/subjects`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r)),
      fetch(`${API_BASE}/admin/sections`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r)),
    ]);
    return { departments, courses, subjects, sections };
  },

  getAllCorrections: () =>
    fetch(`${API_BASE}/admin/correction-requests`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  reviewCorrection: (id: string, payload: { status: 'APPROVED' | 'REJECTED'; reviewNotes: string }) =>
    fetch(`${API_BASE}/admin/correction-requests/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((res) => handleResponse(res)),

  getAuditLogs: () =>
    fetch(`${API_BASE}/admin/audit-logs`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  getSettings: () =>
    fetch(`${API_BASE}/admin/settings`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  updateSetting: (key: string, value: string) =>
    fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    }).then((res) => handleResponse(res)),

  // Reports
  getAttendanceReport: (filters: { subjectId?: string; classSectionId?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams(filters as any).toString();
    return fetch(`${API_BASE}/reports/attendance?${params}`, { headers: getAuthHeaders() }).then((res) => handleResponse(res));
  },

  getShortageReport: () =>
    fetch(`${API_BASE}/reports/shortage`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  downloadAttendanceCsv: (subjectId?: string, classSectionId?: string) => {
    const params = new URLSearchParams({
      ...(subjectId ? { subjectId } : {}),
      ...(classSectionId ? { classSectionId } : {}),
    }).toString();
    const token = localStorage.getItem('sams_token');
    window.open(`${API_BASE}/reports/attendance/export?${params}&token=${token}`, '_blank');
  },

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  markNotificationRead: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH', headers: getAuthHeaders() }).then((res) => handleResponse(res)),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST', headers: getAuthHeaders() }).then((res) => handleResponse(res)),
};
