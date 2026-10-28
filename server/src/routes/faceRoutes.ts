import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { faceEnrollSchema, faceVerifySchema } from '../validators/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();

// Euclidean distance between two numerical feature vectors
function computeEuclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// POST /api/face/enroll (Enroll student facial biometric template)
router.post('/enroll', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'STUDENT') {
      res.status(403).json({ success: false, message: 'Only students can enroll face templates.' });
      return;
    }

    const parseResult = faceEnrollSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid face enrollment payload.',
      });
      return;
    }

    const { descriptor, consent } = parseResult.data;

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Upsert face template (storing ONLY numerical 128D descriptor, NEVER raw images)
    await prisma.faceTemplate.upsert({
      where: { studentProfileId: studentProfile.id },
      update: {
        descriptor: JSON.stringify(descriptor),
        consentGiven: consent,
        consentTimestamp: new Date(),
        modelVersion: 'face-api-v1-128d',
      },
      create: {
        studentProfileId: studentProfile.id,
        descriptor: JSON.stringify(descriptor),
        consentGiven: consent,
        consentTimestamp: new Date(),
        modelVersion: 'face-api-v1-128d',
      },
    });

    await prisma.studentProfile.update({
      where: { id: studentProfile.id },
      data: { faceEnrolled: true },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'FACE_TEMPLATE_ENROLLED',
      entity: 'FaceTemplate',
      details: { rollNumber: studentProfile.rollNumber, modelVersion: 'face-api-v1-128d' },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Facial biometric template enrolled securely. You can now use AI face verification.',
      faceEnrolled: true,
    });
  } catch (error) {
    console.error('Face enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll face template.' });
  }
});

// POST /api/face/verify (Verify face against live session)
router.post('/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'STUDENT') {
      res.status(403).json({ success: false, message: 'Only students can mark face attendance.' });
      return;
    }

    const parseResult = faceVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid face verification input.',
      });
      return;
    }

    const { sessionId, descriptor: liveDescriptor } = parseResult.data;

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
      include: { faceTemplate: true },
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    if (!studentProfile.faceTemplate) {
      res.status(400).json({
        success: false,
        message: 'No facial biometric enrolled for your profile. Please complete face enrollment first or use QR code.',
      });
      return;
    }

    // Check active session
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        classSection: true,
      },
    });

    if (!session || session.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Session is not active or has ended.' });
      return;
    }

    // Check enrollment
    const isEnrolled = await prisma.enrollment.findFirst({
      where: {
        studentProfileId: studentProfile.id,
        classSectionId: session.classSectionId,
      },
    });

    if (!isEnrolled) {
      res.status(403).json({ success: false, message: 'You are not enrolled in this class session.' });
      return;
    }

    // Check duplicate
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        attendanceSessionId_studentProfileId: {
          attendanceSessionId: session.id,
          studentProfileId: studentProfile.id,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Attendance is already marked as ${existing.status} for this session.`,
        record: existing,
      });
      return;
    }

    // Compare embeddings
    const enrolledDescriptor: number[] = JSON.parse(studentProfile.faceTemplate.descriptor);
    const distance = computeEuclideanDistance(liveDescriptor, enrolledDescriptor);

    // Get threshold setting
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'face_match_threshold' },
    });
    const maxThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 0.60;

    const matchScorePercent = Math.max(0, Math.min(100, Math.round((1 - distance / 1.4) * 100)));
    const isMatch = distance <= maxThreshold;

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: `Face verification failed: Confidence score is ${matchScorePercent}% (required distance <= ${maxThreshold}). Please re-center face or scan QR code.`,
        distance: Math.round(distance * 100) / 100,
        similarityPercent: matchScorePercent,
      });
      return;
    }

    // Attendance match successful
    const serverNow = new Date();
    const record = await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session.id,
        studentProfileId: studentProfile.id,
        status: 'PRESENT',
        verificationMethod: 'FACE_VERIFIED',
        markedAt: serverNow,
        remarks: `AI/ML Face Match Verified (Euclidean Distance: ${distance.toFixed(3)}, Match: ${matchScorePercent}%)`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Face Attendance Verified',
        message: `Face identity verified (${matchScorePercent}% match) for ${session.subject.name}. Marked PRESENT.`,
        type: 'SUCCESS',
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'FACE_ATTENDANCE_MARKED',
      entity: 'AttendanceRecord',
      entityId: record.id,
      details: {
        sessionCode: session.code,
        distance,
        matchScorePercent,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Face identity successfully verified! Confidence: ${matchScorePercent}%. Marked as PRESENT.`,
      record,
      matchScorePercent,
      distance: Math.round(distance * 1000) / 1000,
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ success: false, message: 'Error processing face verification.' });
  }
});

export default router;
