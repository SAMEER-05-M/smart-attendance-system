import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { qrVerifySchema, manualMarkSchema, correctAttendanceSchema } from '../validators/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();

router.use(authenticate);

// POST /api/attendance/qr/verify
router.post('/qr/verify', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only enrolled students can submit QR attendance.',
      });
      return;
    }

    const parseResult = qrVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid QR code token.',
      });
      return;
    }

    const { qrToken } = parseResult.data;

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
      include: { user: true },
    });

    if (!studentProfile) {
      res.status(404).json({
        success: false,
        message: 'Student profile record not found.',
      });
      return;
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { qrToken },
      include: {
        subject: true,
        classSection: true,
        facultyProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Invalid QR Code: No active attendance session found for this token.',
      });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: `Attendance session is ${session.status.toLowerCase()}. Submissions are closed.`,
      });
      return;
    }

    const serverNow = new Date();
    if (serverNow > new Date(session.qrTokenExpiresAt)) {
      res.status(400).json({
        success: false,
        message: 'QR Code has expired. Please ask your faculty to refresh the attendance session.',
      });
      return;
    }

    const isEnrolled = await prisma.enrollment.findFirst({
      where: {
        studentProfileId: studentProfile.id,
        classSectionId: session.classSectionId,
      },
    });

    if (!isEnrolled) {
      res.status(403).json({
        success: false,
        message: `You are not enrolled in ${session.classSection.name} for ${session.subject.name}. Attendance rejected.`,
      });
      return;
    }

    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        attendanceSessionId_studentProfileId: {
          attendanceSessionId: session.id,
          studentProfileId: studentProfile.id,
        },
      },
    });

    if (existingRecord) {
      res.status(409).json({
        success: false,
        message: `Attendance already marked as ${existingRecord.status} for this session at ${existingRecord.markedAt.toLocaleTimeString()}.`,
        record: existingRecord,
      });
      return;
    }

    const graceSetting = await prisma.systemSetting.findUnique({
      where: { key: 'late_grace_period_mins' },
    });
    const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 10;
    const sessionStart = new Date(session.startTime).getTime();
    const minutesSinceStart = (serverNow.getTime() - sessionStart) / (1000 * 60);

    const status = minutesSinceStart > graceMinutes ? 'LATE' : 'PRESENT';

    const record = await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session.id,
        studentProfileId: studentProfile.id,
        status,
        verificationMethod: 'QR_SCAN',
        markedAt: serverNow,
        remarks: status === 'LATE' ? `Marked ${Math.round(minutesSinceStart)} mins after session start` : 'Verified via QR Scan',
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Attendance Confirmed',
        message: `Your attendance for "${session.subject.name}" (${session.title}) was marked as ${status}.`,
        type: status === 'PRESENT' ? 'SUCCESS' : 'WARNING',
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'QR_ATTENDANCE_MARKED',
      entity: 'AttendanceRecord',
      entityId: record.id,
      details: {
        sessionCode: session.code,
        subject: session.subject.name,
        rollNumber: studentProfile.rollNumber,
        status,
        markedAt: serverNow.toISOString(),
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully as ${status}!`,
      record: {
        id: record.id,
        status: record.status,
        markedAt: record.markedAt,
        verificationMethod: record.verificationMethod,
        subject: session.subject.name,
        sessionTitle: session.title,
        faculty: session.facultyProfile.user.fullName,
      },
    });
  } catch (error: any) {
    console.error('QR verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing QR attendance.',
    });
  }
});

// POST /api/attendance/manual-mark
router.post('/manual-mark', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = manualMarkSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { sessionId, studentProfileId, status, remarks } = parseResult.data;

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found.' });
      return;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentProfileId,
        classSectionId: session.classSectionId,
      },
    });

    if (!enrollment) {
      res.status(400).json({
        success: false,
        message: 'Student is not enrolled in the class section for this session.',
      });
      return;
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        attendanceSessionId_studentProfileId: {
          attendanceSessionId: sessionId,
          studentProfileId,
        },
      },
      update: {
        status,
        remarks: remarks || 'Manually updated by faculty',
        correctedAt: new Date(),
        correctedByUserId: req.user!.id,
      },
      create: {
        attendanceSessionId: sessionId,
        studentProfileId,
        status,
        verificationMethod: req.user!.role === 'ADMIN' ? 'MANUAL_ADMIN' : 'MANUAL_FACULTY',
        remarks,
        markedAt: new Date(),
      },
      include: {
        studentProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'MANUAL_ATTENDANCE_MARKED',
      entity: 'AttendanceRecord',
      entityId: record.id,
      details: {
        sessionCode: session.code,
        student: record.studentProfile.user.fullName,
        status,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Attendance marked as ${status} for ${record.studentProfile.user.fullName}.`,
      record,
    });
  } catch (error) {
    console.error('Manual mark error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark manual attendance.' });
  }
});

// PATCH /api/attendance/:id (Faculty/Admin corrects attendance with mandatory reason)
router.patch('/:id', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = correctAttendanceSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { status, reason } = parseResult.data;

    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        attendanceSession: true,
        studentProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (!existingRecord) {
      res.status(404).json({ success: false, message: 'Attendance record not found.' });
      return;
    }

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        status,
        correctedAt: new Date(),
        correctedByUserId: req.user!.id,
        correctionReason: reason,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ATTENDANCE_CORRECTED',
      entity: 'AttendanceRecord',
      entityId: id,
      details: {
        previousStatus: existingRecord.status,
        newStatus: status,
        reason,
        student: existingRecord.studentProfile.user.fullName,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Attendance record updated successfully with audit trail.',
      record: updatedRecord,
    });
  } catch (error) {
    console.error('Attendance correction error:', error);
    res.status(500).json({ success: false, message: 'Failed to correct attendance record.' });
  }
});

export default router;
