import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { submitCorrectionRequestSchema } from '../validators/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

// GET /api/students/me
router.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
        department: true,
        course: true,
        enrollments: {
          include: {
            classSection: true,
          },
        },
      },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    res.json({ success: true, profile: studentProfile });
  } catch (error) {
    console.error('Fetch student profile error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving student profile.' });
  }
});

// GET /api/students/me/attendance
router.get(['/me/attendance', '/attendance'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const { subjectId, status } = req.query;

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentProfileId: studentProfile.id,
        ...(subjectId ? { attendanceSession: { subjectId: String(subjectId) } } : {}),
        ...(status ? { status: String(status) } : {}),
      },
      include: {
        attendanceSession: {
          include: {
            subject: true,
            facultyProfile: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { attendanceSession: { sessionDate: 'desc' } },
    });

    res.json({ success: true, records });
  } catch (error) {
    console.error('Fetch attendance records error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving attendance records.' });
  }
});

// GET /api/students/me/attendance-summary
router.get(['/me/attendance-summary', '/attendance-summary'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        enrollments: {
          include: {
            classSection: true,
          },
        },
      },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Configurable threshold
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'attendance_threshold_percent' },
    });
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75;

    // Get all enrolled sections
    const sectionIds = studentProfile.enrollments.map((e) => e.classSectionId);

    // Get all completed/active sessions for these sections
    const conductedSessions = await prisma.attendanceSession.findMany({
      where: {
        classSectionId: { in: sectionIds },
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        subject: true,
      },
    });

    // Get all attendance records for this student
    const studentRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentProfileId: studentProfile.id,
      },
      include: {
        attendanceSession: {
          include: { subject: true },
        },
      },
    });

    // Map records by sessionId
    const recordBySessionId = new Map(studentRecords.map((r) => [r.attendanceSessionId, r]));

    // Subject-wise grouping
    const subjectMap = new Map<string, {
      subject: any;
      conducted: number;
      attended: number;
      late: number;
      excused: number;
      absent: number;
    }>();

    let totalConducted = 0;
    let totalAttended = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalAbsent = 0;

    for (const session of conductedSessions) {
      const subId = session.subjectId;
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subject: session.subject,
          conducted: 0,
          attended: 0,
          late: 0,
          excused: 0,
          absent: 0,
        });
      }

      const subStats = subjectMap.get(subId)!;
      subStats.conducted += 1;
      totalConducted += 1;

      const record = recordBySessionId.get(session.id);
      if (record) {
        if (record.status === 'PRESENT') {
          subStats.attended += 1;
          totalAttended += 1;
        } else if (record.status === 'LATE') {
          // Late counts as attended in attendance % per college policy
          subStats.attended += 1;
          subStats.late += 1;
          totalAttended += 1;
          totalLate += 1;
        } else if (record.status === 'EXCUSED') {
          subStats.attended += 1;
          subStats.excused += 1;
          totalAttended += 1;
          totalExcused += 1;
        } else {
          subStats.absent += 1;
          totalAbsent += 1;
        }
      } else {
        // If no record exists for an enrolled student in a session, they were absent
        subStats.absent += 1;
        totalAbsent += 1;
      }
    }

    // Calculate percentages safely (avoid dividing by zero)
    const overallPercentage = totalConducted > 0
      ? Math.round((totalAttended / totalConducted) * 1000) / 10
      : 0;

    const subjectBreakdown = Array.from(subjectMap.values()).map((item) => {
      const percentage = item.conducted > 0
        ? Math.round((item.attended / item.conducted) * 1000) / 10
        : 0;

      let statusBadge: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      if (percentage < threshold) {
        statusBadge = 'CRITICAL';
      } else if (percentage < threshold + 5) {
        statusBadge = 'WARNING';
      }

      return {
        subject: item.subject,
        conducted: item.conducted,
        attended: item.attended,
        late: item.late,
        excused: item.excused,
        absent: item.absent,
        percentage,
        statusBadge,
      };
    });

    const isBelowThreshold = overallPercentage < threshold && totalConducted > 0;

    res.json({
      success: true,
      summary: {
        threshold,
        totalConducted,
        totalAttended,
        totalLate,
        totalExcused,
        totalAbsent,
        overallPercentage,
        isBelowThreshold,
        subjectBreakdown,
      },
    });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to compute attendance summary.' });
  }
});

// POST /api/students/me/correction-requests
router.post(['/me/correction-requests', '/correction-requests'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = submitCorrectionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { attendanceSessionId, requestedStatus, reason } = parseResult.data;

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Check if session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: attendanceSessionId },
      include: { subject: true },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Attendance session not found.' });
      return;
    }

    // Find if an attendance record exists
    const record = await prisma.attendanceRecord.findFirst({
      where: {
        studentProfileId: studentProfile.id,
        attendanceSessionId,
      },
    });

    // Check if duplicate pending request already exists
    const existingPending = await prisma.attendanceCorrectionRequest.findFirst({
      where: {
        studentProfileId: studentProfile.id,
        attendanceSessionId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      res.status(400).json({
        success: false,
        message: 'A correction request for this session is already pending review.',
      });
      return;
    }

    const correction = await prisma.attendanceCorrectionRequest.create({
      data: {
        studentProfileId: studentProfile.id,
        attendanceSessionId,
        attendanceRecordId: record?.id,
        requestedStatus,
        reason,
        status: 'PENDING',
      },
    });

    // Create notification for admin / faculty
    await logAuditEvent({
      userId: req.user!.id,
      action: 'CORRECTION_REQUESTED',
      entity: 'AttendanceCorrectionRequest',
      entityId: correction.id,
      details: { sessionCode: session.code, requestedStatus, reason },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance correction request submitted for administrative review.',
      correction,
    });
  } catch (error) {
    console.error('Correction request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit correction request.' });
  }
});

// GET /api/students/me/correction-requests
router.get(['/me/correction-requests', '/correction-requests'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where: { studentProfileId: studentProfile.id },
      include: {
        attendanceSession: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch student correction requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch correction requests.' });
  }
});

export default router;
