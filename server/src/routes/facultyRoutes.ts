import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize('FACULTY', 'ADMIN'));

// GET /api/faculty/me/subjects or /api/faculty/subjects
router.get(['/me/subjects', '/subjects'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facultyProfile = await prisma.facultyProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!facultyProfile && req.user!.role !== 'ADMIN') {
      res.status(404).json({ success: false, message: 'Faculty profile not found.' });
      return;
    }

    const assignments = await prisma.facultyAssignment.findMany({
      where: req.user!.role === 'ADMIN' ? {} : { facultyProfileId: facultyProfile?.id },
      include: {
        subject: true,
        classSection: {
          include: {
            course: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    res.json({ success: true, assignments });
  } catch (error) {
    console.error('Fetch faculty subjects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assigned subjects.' });
  }
});

// GET /api/faculty/me/sessions or /api/faculty/sessions
router.get(['/me/sessions', '/sessions'], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facultyProfile = await prisma.facultyProfile.findFirst({
      where: { userId: req.user!.id },
    });

    const sessions = await prisma.attendanceSession.findMany({
      where: req.user!.role === 'ADMIN' ? {} : { facultyProfileId: facultyProfile?.id },
      include: {
        subject: true,
        classSection: true,
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve sessions.' });
  }
});

export default router;
