import { Request } from 'express';

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type VerificationMethod = 'QR_SCAN' | 'FACE_VERIFIED' | 'MANUAL_FACULTY' | 'MANUAL_ADMIN';

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type CorrectionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  studentProfileId?: string;
  facultyProfileId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
