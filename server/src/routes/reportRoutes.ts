import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'FACULTY'));

// GET /api/reports/attendance
router.get('/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, classSectionId, startDate, endDate, status } = req.query;

    const whereClause: any = {};

    if (subjectId) {
      whereClause.attendanceSession = { ...whereClause.attendanceSession, subjectId: String(subjectId) };
    }

    if (classSectionId) {
      whereClause.attendanceSession = { ...whereClause.attendanceSession, classSectionId: String(classSectionId) };
    }

    if (startDate || endDate) {
      whereClause.attendanceSession = {
        ...whereClause.attendanceSession,
        sessionDate: {
          ...(startDate ? { gte: new Date(String(startDate)) } : {}),
          ...(endDate ? { lte: new Date(String(endDate)) } : {}),
        },
      };
    }

    if (status) {
      whereClause.status = String(status);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: {
            user: { select: { fullName: true, email: true } },
            department: true,
          },
        },
        attendanceSession: {
          include: {
            subject: true,
            classSection: true,
            facultyProfile: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { attendanceSession: { sessionDate: 'desc' } },
    });

    const totalRecords = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;

    res.json({
      success: true,
      records,
      summary: {
        totalRecords,
        present,
        late,
        excused,
        absent,
        effectivePresentRate: totalRecords > 0
          ? Math.round(((present + late + excused) / totalRecords) * 1000) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate attendance report.' });
  }
});

// GET /api/reports/attendance/export (CSV generation based on real database records)
router.get('/attendance/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, classSectionId } = req.query;

    const whereClause: any = {};
    if (subjectId) {
      whereClause.attendanceSession = { ...whereClause.attendanceSession, subjectId: String(subjectId) };
    }
    if (classSectionId) {
      whereClause.attendanceSession = { ...whereClause.attendanceSession, classSectionId: String(classSectionId) };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        attendanceSession: {
          include: {
            subject: true,
            classSection: true,
            facultyProfile: { include: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { attendanceSession: { sessionDate: 'desc' } },
    });

    // Generate CSV Header & rows
    const csvRows: string[] = [];
    csvRows.push('Student Name,Roll Number,Email,Subject Code,Subject Name,Section,Session Title,Date,Status,Verification Method,Marked Time,Faculty');

    for (const r of records) {
      const row = [
        `"${r.studentProfile.user.fullName}"`,
        `"${r.studentProfile.rollNumber}"`,
        `"${r.studentProfile.user.email}"`,
        `"${r.attendanceSession.subject.code}"`,
        `"${r.attendanceSession.subject.name.replace(/"/g, '""')}"`,
        `"${r.attendanceSession.classSection.name}"`,
        `"${r.attendanceSession.title.replace(/"/g, '""')}"`,
        `"${r.attendanceSession.sessionDate.toISOString().split('T')[0]}"`,
        `"${r.status}"`,
        `"${r.verificationMethod}"`,
        `"${r.markedAt.toISOString()}"`,
        `"${r.attendanceSession.facultyProfile.user.fullName}"`,
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SAMS_Attendance_Report_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export attendance CSV.' });
  }
});

// GET /api/reports/shortage (Students below threshold)
router.get('/shortage', async (_req, res: Response): Promise<void> => {
  try {
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'attendance_threshold_percent' },
    });
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75;

    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        department: true,
        course: true,
        enrollments: { include: { classSection: true } },
        attendanceRecords: true,
      },
    });

    const shortageList = [];

    for (const student of students) {
      const sectionIds = student.enrollments.map((e) => e.classSectionId);
      const totalSessions = await prisma.attendanceSession.count({
        where: {
          classSectionId: { in: sectionIds },
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      });

      if (totalSessions > 0) {
        const attended = student.attendanceRecords.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'EXCUSED'
        ).length;

        const percentage = Math.round((attended / totalSessions) * 1000) / 10;

        if (percentage < threshold) {
          shortageList.push({
            studentId: student.id,
            rollNumber: student.rollNumber,
            fullName: student.user.fullName,
            email: student.user.email,
            department: student.department.code,
            totalConducted: totalSessions,
            attended,
            missed: totalSessions - attended,
            percentage,
            deficitPercentage: Math.round((threshold - percentage) * 10) / 10,
          });
        }
      }
    }

    res.json({
      success: true,
      threshold,
      shortageCount: shortageList.length,
      shortageStudents: shortageList,
    });
  } catch (error) {
    console.error('Shortage report error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shortage report.' });
  }
});

export default router;
