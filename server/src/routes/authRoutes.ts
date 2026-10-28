import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { loginSchema } from '../validators/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sams-fallback-secret-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        studentProfile: {
          include: {
            department: true,
            course: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'This account has been deactivated. Contact the administrator.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      studentProfileId: user.studentProfile?.id,
      facultyProfileId: user.facultyProfile?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: (JWT_EXPIRES_IN || '24h') as any });

    await logAuditEvent({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { role: user.role, email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            department: true,
            course: true,
            enrollments: {
              include: {
                classSection: true,
              },
            },
          },
        },
        facultyProfile: {
          include: {
            department: true,
            assignments: {
              include: {
                subject: true,
                classSection: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user.id,
        details: { role: req.user.role },
        ipAddress: req.ip,
      });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
});

export default router;
