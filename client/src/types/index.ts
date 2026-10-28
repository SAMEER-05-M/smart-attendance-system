export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNMARKED';

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  avatarUrl?: string;
  studentProfile?: {
    id: string;
    rollNumber: string;
    department?: { name: string; code: string };
    course?: { name: string; code: string };
    currentSemester: number;
    faceEnrolled: boolean;
  };
  facultyProfile?: {
    id: string;
    employeeId: string;
    designation: string;
    department?: { name: string; code: string };
  };
}

export interface AttendanceRecord {
  id: string;
  status: AttendanceStatus;
  verificationMethod: 'QR_SCAN' | 'FACE_VERIFIED' | 'MANUAL_FACULTY' | 'MANUAL_ADMIN';
  markedAt: string;
  remarks?: string;
  correctedAt?: string;
  correctionReason?: string;
  attendanceSession: {
    id: string;
    code: string;
    title: string;
    sessionDate: string;
    subject: { code: string; name: string };
    facultyProfile?: { user: { fullName: string } };
  };
}

export interface SubjectSummary {
  subject: { id: string; code: string; name: string; credits: number };
  conducted: number;
  attended: number;
  late: number;
  excused: number;
  absent: number;
  percentage: number;
  statusBadge: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface StudentAttendanceSummary {
  threshold: number;
  totalConducted: number;
  totalAttended: number;
  totalLate: number;
  totalExcused: number;
  totalAbsent: number;
  overallPercentage: number;
  isBelowThreshold: boolean;
  subjectBreakdown: SubjectSummary[];
}

export interface AttendanceSession {
  id: string;
  code: string;
  title: string;
  lectureTopic?: string;
  sessionDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  qrToken: string;
  qrTokenExpiresAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isTokenExpired?: boolean;
  subject: { id: string; code: string; name: string };
  classSection: { id: string; name: string; academicYear: string };
}

export interface RosterItem {
  studentProfileId: string;
  rollNumber: string;
  fullName: string;
  email: string;
  faceEnrolled: boolean;
  attendanceRecordId: string | null;
  status: AttendanceStatus;
  verificationMethod: string | null;
  markedAt: string | null;
  remarks: string | null;
  isCorrected: boolean;
}

export interface CorrectionRequest {
  id: string;
  requestedStatus: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
  studentProfile?: {
    rollNumber: string;
    user: { fullName: string; email: string };
  };
  attendanceSession: {
    code: string;
    title: string;
    subject: { code: string; name: string };
    classSection?: { name: string };
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}
