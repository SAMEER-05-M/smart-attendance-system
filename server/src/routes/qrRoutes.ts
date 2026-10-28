import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { qrVerifySchema } from '../validators/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();

// POST /api/attendance/qr/verify
router.post('/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Enforce student role
    if (req.user!.role !== 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only enrolled students can submit QR attendance.',
      });
      return;
    }

    // 2. Validate request input
    const parseResult = qrVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid QR code token.',
      });
      return;
    }

    const { qrToken } = parseResult.data;

    // 3. Find student profile
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

    // 4. Find session by QR token
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

    // 5. Check if session is active
    if (session.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: `Attendance session is ${session.status.toLowerCase()}. Submissions are closed.`,
      });
      return;
    }

    // 6. Check if QR token has expired
    const serverNow = new Date();
    if (serverNow > new Date(session.qrTokenExpiresAt)) {
      res.status(400).json({
        success: false,
        message: 'QR Code has expired. Please ask your faculty to refresh the attendance session.',
      });
      return;
    }

    // 7. Verify student class enrollment
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

    // 8. Prevent duplicate attendance submissions
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

    // 9. Determine attendance status (PRESENT vs LATE)
    const graceSetting = await prisma.systemSetting.findUnique({
      where: { key: 'late_grace_period_mins' },
    });
    const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 10;
    const sessionStart = new Date(session.startTime).getTime();
    const minutesSinceStart = (serverNow.getTime() - sessionStart) / (1000 * 60);

    const status = minutesSinceStart > graceMinutes ? 'LATE' : 'PRESENT';

    // 10. Persist attendance record with server-generated timestamp
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

    // 11. Create in-app notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Attendance Confirmed',
        message: `Your attendance for "${session.subject.name}" (${session.title}) was marked as ${status}.`,
        type: status === 'PRESENT' ? 'SUCCESS' : 'WARNING',
      },
    });

    // 12. Create audit log
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

export default router;
