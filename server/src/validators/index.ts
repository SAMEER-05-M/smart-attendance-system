import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createSessionSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  classSectionId: z.string().uuid('Invalid class section ID'),
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  lectureTopic: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(180).default(15),
});

export const qrVerifySchema = z.object({
  qrToken: z.string().min(10, 'Invalid QR token format'),
});

export const manualMarkSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  studentProfileId: z.string().uuid('Invalid student profile ID'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
});

export const correctAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  reason: z.string().min(5, 'Correction reason is mandatory (minimum 5 characters)'),
});

export const submitCorrectionRequestSchema = z.object({
  attendanceSessionId: z.string().uuid('Invalid attendance session ID'),
  requestedStatus: z.enum(['PRESENT', 'EXCUSED']),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
});

export const reviewCorrectionRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().min(3, 'Review remarks required'),
});

export const faceEnrollSchema = z.object({
  descriptor: z.array(z.number()).length(128, 'Face descriptor must be a 128-dimensional embedding'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Explicit consent is required to enroll biometric face descriptors' }),
  }),
});

export const faceVerifySchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  descriptor: z.array(z.number()).length(128, 'Face descriptor must be a 128-dimensional embedding'),
});
