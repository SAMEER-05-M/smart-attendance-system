import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { createSessionSchema } from '../validators/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();

router.use(authenticate);

// POST /api/sessions (Faculty/Admin starts attendance session)
router.post('/', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { subjectId, classSectionId, title, lectureTopic, durationMinutes } = parseResult.data;

    let facultyProfileId = req.user!.facultyProfileId;
    if (!facultyProfileId) {
      const fp = await prisma.facultyProfile.findFirst({ where: { userId: req.user!.id } });
      facultyProfileId = fp?.id;
    }

    if (!facultyProfileId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Only faculty members can initiate attendance sessions.' });
      return;
    }

    if (req.user!.role === 'FACULTY') {
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyProfileId,
          subjectId,
          classSectionId,
        },
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'You are not assigned to this subject and class section.',
        });
        return;
      }
    }

    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const sessionCode = `SAMS-${randomHex}`;
    const qrToken = `sams_token_${crypto.randomBytes(16).toString('hex')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session = await prisma.attendanceSession.create({
      data: {
        code: sessionCode,
        subjectId,
        classSectionId,
        facultyProfileId: facultyProfileId!,
        title,
        lectureTopic,
        sessionDate: now,
        startTime: now,
        durationMinutes,
        qrToken,
        qrTokenExpiresAt: expiresAt,
        status: 'ACTIVE',
      },
      include: {
        subject: true,
        classSection: true,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'SESSION_STARTED',
      entity: 'AttendanceSession',
      entityId: session.id,
      details: {
        sessionCode: session.code,
        subject: session.subject.name,
        section: session.classSection.name,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session initiated successfully.',
      session,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create attendance session.' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        subject: true,
        classSection: {
          include: {
            enrollments: {
              include: {
                studentProfile: {
                  include: {
                    user: { select: { fullName: true, email: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
        attendanceRecords: {
          include: {
            studentProfile: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Attendance session not found.' });
      return;
    }

    const recordMap = new Map(session.attendanceRecords.map((r) => [r.studentProfileId, r]));

    const roster = session.classSection.enrollments.map((enr) => {
      const student = enr.studentProfile;
      const record = recordMap.get(student.id);

      return {
        studentProfileId: student.id,
        rollNumber: student.rollNumber,
        fullName: student.user.fullName,
        email: student.user.email,
        faceEnrolled: student.faceEnrolled,
        attendanceRecordId: record?.id || null,
        status: record ? record.status : (session.status === 'COMPLETED' ? 'ABSENT' : 'UNMARKED'),
        verificationMethod: record?.verificationMethod || null,
        markedAt: record?.markedAt || null,
        remarks: record?.remarks || null,
        isCorrected: !!record?.correctedAt,
      };
    });

    const isTokenExpired = new Date() > new Date(session.qrTokenExpiresAt);

    res.json({
      success: true,
      session: {
        id: session.id,
        code: session.code,
        title: session.title,
        lectureTopic: session.lectureTopic,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        qrToken: session.qrToken,
        qrTokenExpiresAt: session.qrTokenExpiresAt,
        status: session.status,
        isTokenExpired,
        subject: session.subject,
        classSection: {
          id: session.classSection.id,
          name: session.classSection.name,
          academicYear: session.classSection.academicYear,
        },
      },
      roster,
      stats: {
        totalEnrolled: roster.length,
        present: roster.filter((r) => r.status === 'PRESENT').length,
        late: roster.filter((r) => r.status === 'LATE').length,
        excused: roster.filter((r) => r.status === 'EXCUSED').length,
        absent: roster.filter((r) => r.status === 'ABSENT').length,
        unmarked: roster.filter((r) => r.status === 'UNMARKED').length,
      },
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve session details.' });
  }
});

// GET /api/sessions/:id/attendance
router.get('/:id/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const records = await prisma.attendanceRecord.findMany({
      where: { attendanceSessionId: id },
      include: {
        studentProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { markedAt: 'asc' },
    });
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve session attendance.' });
  }
});

// POST /api/sessions/:id/close
router.post('/:id/close', authorize('FACULTY', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await prisma.attendanceSession.findUnique({
      where: { id },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found.' });
      return;
    }

    if (session.status === 'COMPLETED') {
      res.status(400).json({ success: false, message: 'Session is already closed.' });
      return;
    }

    const updated = await prisma.attendanceSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'SESSION_CLOSED',
      entity: 'AttendanceSession',
      entityId: id,
      details: { sessionCode: session.code },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Attendance session successfully closed.',
      session: updated,
    });
  } catch (error) {
    console.error('Close session error:', error);
    res.status(500).json({ success: false, message: 'Failed to close attendance session.' });
  }
});

export default router;
