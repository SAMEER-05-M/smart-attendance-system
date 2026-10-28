import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../prisma.js';

describe('Smart Attendance Management System (SAMS) Backend Tests', () => {
  let adminToken: string;
  let facultyToken: string;
  let studentToken: string;
  let nonEnrolledStudentToken: string;
  let activeSessionId: string;
  let activeQrToken: string;
  let studentProfileId: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Faculty login
    const facultyRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty.ml@college.edu', password: 'Faculty@123' });
    expect(facultyRes.status).toBe(200);
    facultyToken = facultyRes.body.token;

    // 3. Student (Aarav - Section A) login
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav.23aiml@college.edu', password: 'Student@123' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.token;
    studentProfileId = studentRes.body.user.studentProfile.id;

    // 4. Non-enrolled student (Pooja - Section B) login
    const nonEnrolledRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pooja.23aiml@college.edu', password: 'Student@123' });
    expect(nonEnrolledRes.status).toBe(200);
    nonEnrolledStudentToken = nonEnrolledRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication & Role-Based Authorization', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@college.edu', password: 'Admin@123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@college.edu', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should prevent student from accessing admin endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to access admin statistics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.stats.totalStudents).toBeGreaterThan(0);
    });
  });

  describe('2. Attendance Session Management', () => {
    it('should allow faculty to create a new attendance session', async () => {
      // Get subject and class section
      const subject = await prisma.subject.findFirst({ where: { code: 'AI601' } });
      const section = await prisma.classSection.findFirst({ where: { name: 'Section A' } });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          subjectId: subject!.id,
          classSectionId: section!.id,
          title: 'Test Automated Attendance Session',
          lectureTopic: 'Vitest Automated Suite Verification',
          durationMinutes: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.session.qrToken).toBeDefined();
      expect(res.body.session.status).toBe('ACTIVE');

      activeSessionId = res.body.session.id;
      activeQrToken = res.body.session.qrToken;
    });

    it('should prevent students from creating attendance sessions', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hacked Session',
          durationMinutes: 15,
        });
      expect(res.status).toBe(403);
    });
  });

  describe('3. QR Code Attendance & Validation Logic', () => {
    it('should successfully mark attendance for eligible enrolled student via valid QR token', async () => {
      const res = await request(app)
        .post('/api/attendance/qr/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrToken: activeQrToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.record.status).toBe('PRESENT');
    });

    it('should prevent duplicate attendance submissions for the same session', async () => {
      const res = await request(app)
        .post('/api/attendance/qr/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrToken: activeQrToken });

      expect(res.status).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already marked');
    });

    it('should reject attendance for student not enrolled in this class section', async () => {
      const res = await request(app)
        .post('/api/attendance/qr/verify')
        .set('Authorization', `Bearer ${nonEnrolledStudentToken}`)
        .send({ qrToken: activeQrToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not enrolled');
    });

    it('should reject expired QR tokens', async () => {
      // Create session with past expiration date
      const subject = await prisma.subject.findFirst();
      const section = await prisma.classSection.findFirst();
      const fp = await prisma.facultyProfile.findFirst();

      const dynamicCode = `SAMS-EXP-${Date.now()}`;
      const dynamicToken = `sams_expired_token_test_${Date.now()}`;

      const expiredSession = await prisma.attendanceSession.create({
        data: {
          code: dynamicCode,
          subjectId: subject!.id,
          classSectionId: section!.id,
          facultyProfileId: fp!.id,
          title: 'Expired Session Test',
          durationMinutes: 1,
          qrToken: dynamicToken,
          qrTokenExpiresAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          status: 'ACTIVE',
        },
      });

      const res = await request(app)
        .post('/api/attendance/qr/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrToken: expiredSession.qrToken });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('4. Attendance Calculations & Percentages', () => {
    it('should accurately calculate attendance percentage based on database records', async () => {
      const res = await request(app)
        .get('/api/students/me/attendance-summary')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalConducted).toBeGreaterThan(0);
      expect(res.body.summary.totalAttended).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.summary.overallPercentage).toBe('number');
      expect(res.body.summary.overallPercentage).toBeGreaterThanOrEqual(0);
      expect(res.body.summary.overallPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('5. Unauthorized Attendance Corrections', () => {
    it('should prevent student from directly editing attendance records', async () => {
      const record = await prisma.attendanceRecord.findFirst();
      const res = await request(app)
        .patch(`/api/attendance/${record!.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'PRESENT', reason: 'Self marked' });

      expect(res.status).toBe(403);
    });

    it('should allow faculty to correct attendance with mandatory reason', async () => {
      const record = await prisma.attendanceRecord.findFirst();
      const res = await request(app)
        .patch(`/api/attendance/${record!.id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          status: 'EXCUSED',
          reason: 'Student provided valid medical certificate acknowledged by HoD.',
        });

      expect(res.status).toBe(200);
      expect(res.body.record.status).toBe('EXCUSED');
      expect(res.body.record.correctionReason).toContain('medical certificate');
    });
  });
});
