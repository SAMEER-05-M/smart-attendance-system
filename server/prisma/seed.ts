import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.faceTemplate.deleteMany();
  await prisma.attendanceCorrectionRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.facultyAssignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'attendance_threshold_percent', value: '75', description: 'Minimum attendance percentage required to be in good standing' },
      { key: 'late_grace_period_mins', value: '10', description: 'Minutes after start time before attendance is marked LATE' },
      { key: 'qr_default_duration_minutes', value: '15', description: 'Default valid duration for attendance session QR code' },
      { key: 'face_match_threshold', value: '0.60', description: 'Maximum Euclidean distance between descriptors to consider a face match' },
    ],
  });

  // 3. Department
  const cseDept = await prisma.department.create({
    data: {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      description: 'Department of Computer Science & Engineering and Artificial Intelligence',
    },
  });

  // 4. Course
  const aimlCourse = await prisma.course.create({
    data: {
      code: 'BTECH-CSE-AIML',
      name: 'B.Tech in CSE (Artificial Intelligence & Machine Learning)',
      totalSemesters: 8,
      departmentId: cseDept.id,
    },
  });

  // 5. Subjects
  const mlSubject = await prisma.subject.create({
    data: {
      code: 'AI601',
      name: 'Deep Learning & Neural Networks',
      credits: 4,
      semester: 6,
      departmentId: cseDept.id,
    },
  });

  const nlpSubject = await prisma.subject.create({
    data: {
      code: 'AI602',
      name: 'Natural Language Processing & LLMs',
      credits: 4,
      semester: 6,
      departmentId: cseDept.id,
    },
  });

  // 6. Class Sections
  const sectionA = await prisma.classSection.create({
    data: {
      name: 'Section A',
      academicYear: '2026-27',
      semester: 6,
      courseId: aimlCourse.id,
    },
  });

  const sectionB = await prisma.classSection.create({
    data: {
      name: 'Section B',
      academicYear: '2026-27',
      semester: 6,
      courseId: aimlCourse.id,
    },
  });

  // Standard password for demonstration
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const facultyPassword = await bcrypt.hash('Faculty@123', salt);
  const studentPassword = await bcrypt.hash('Student@123', salt);

  // 7. Users - Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      passwordHash: adminPassword,
      role: 'ADMIN',
      fullName: 'Dr. Rajesh Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // 8. Users - Faculty
  const faculty1User = await prisma.user.create({
    data: {
      email: 'faculty.ml@college.edu',
      passwordHash: facultyPassword,
      role: 'FACULTY',
      fullName: 'Prof. Ananya Sen',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const faculty1Profile = await prisma.facultyProfile.create({
    data: {
      userId: faculty1User.id,
      employeeId: 'FAC-CSE-001',
      designation: 'Associate Professor & AI Lab Head',
      departmentId: cseDept.id,
    },
  });

  const faculty2User = await prisma.user.create({
    data: {
      email: 'faculty.nlp@college.edu',
      passwordHash: facultyPassword,
      role: 'FACULTY',
      fullName: 'Dr. Vikram Malhotra',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const faculty2Profile = await prisma.facultyProfile.create({
    data: {
      userId: faculty2User.id,
      employeeId: 'FAC-CSE-002',
      designation: 'Assistant Professor',
      departmentId: cseDept.id,
    },
  });

  // 9. Assign Faculty to Subjects & Sections
  await prisma.facultyAssignment.createMany({
    data: [
      {
        facultyProfileId: faculty1Profile.id,
        subjectId: mlSubject.id,
        classSectionId: sectionA.id,
        academicYear: '2026-27',
      },
      {
        facultyProfileId: faculty1Profile.id,
        subjectId: mlSubject.id,
        classSectionId: sectionB.id,
        academicYear: '2026-27',
      },
      {
        facultyProfileId: faculty2Profile.id,
        subjectId: nlpSubject.id,
        classSectionId: sectionA.id,
        academicYear: '2026-27',
      },
    ],
  });

  // 10. Students (10 Demo Students)
  const studentData = [
    { name: 'Aarav Patel', roll: '23AIML001', email: 'aarav.23aiml@college.edu', section: sectionA },
    { name: 'Diya Sharma', roll: '23AIML002', email: 'diya.23aiml@college.edu', section: sectionA },
    { name: 'Rohan Verma', roll: '23AIML003', email: 'rohan.23aiml@college.edu', section: sectionA },
    { name: 'Sneha Iyer', roll: '23AIML004', email: 'sneha.23aiml@college.edu', section: sectionA },
    { name: 'Kabir Mehta', roll: '23AIML005', email: 'kabir.23aiml@college.edu', section: sectionA },
    { name: 'Pooja Reddy', roll: '23AIML006', email: 'pooja.23aiml@college.edu', section: sectionB },
    { name: 'Arjun Das', roll: '23AIML007', email: 'arjun.23aiml@college.edu', section: sectionB },
    { name: 'Tanvi Joshi', roll: '23AIML008', email: 'tanvi.23aiml@college.edu', section: sectionB },
    { name: 'Nikhil Nair', roll: '23AIML009', email: 'nikhil.23aiml@college.edu', section: sectionB },
    { name: 'Meera Kulkarni', roll: '23AIML010', email: 'meera.23aiml@college.edu', section: sectionB },
  ];

  const studentProfiles = [];

  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: studentPassword,
        role: 'STUDENT',
        fullName: s.name,
      },
    });

    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        rollNumber: s.roll,
        departmentId: cseDept.id,
        courseId: aimlCourse.id,
        currentSemester: 6,
        faceEnrolled: s.roll === '23AIML001', // Aarav has face enrolled
      },
    });

    // Enrollment
    await prisma.enrollment.create({
      data: {
        studentProfileId: profile.id,
        classSectionId: s.section.id,
        academicYear: '2026-27',
      },
    });

    // Mock enrolled face template for student 1 (128-D vector)
    if (s.roll === '23AIML001') {
      const mockDescriptor = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) * 0.1);
      await prisma.faceTemplate.create({
        data: {
          studentProfileId: profile.id,
          descriptor: JSON.stringify(mockDescriptor),
          consentGiven: true,
          modelVersion: 'face-api-v1',
        },
      });
    }

    studentProfiles.push({ ...profile, sectionId: s.section.id, user });
  }

  // 11. Create Sample Past Completed Attendance Sessions
  const now = new Date();
  
  // Session 1: 3 days ago, Deep Learning, Section A (Completed)
  const session1Date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const session1 = await prisma.attendanceSession.create({
    data: {
      code: 'SAMS-ML01',
      subjectId: mlSubject.id,
      classSectionId: sectionA.id,
      facultyProfileId: faculty1Profile.id,
      title: 'Lecture 18: Convolutional Neural Networks (CNN)',
      lectureTopic: 'Kernels, Pooling, Feature Maps, PyTorch Conv2d',
      sessionDate: session1Date,
      startTime: session1Date,
      endTime: new Date(session1Date.getTime() + 50 * 60 * 1000),
      durationMinutes: 15,
      qrToken: 'sams_seed_token_past_ml01_' + crypto.randomBytes(6).toString('hex'),
      qrTokenExpiresAt: new Date(session1Date.getTime() + 15 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  // Session 2: 2 days ago, NLP, Section A (Completed)
  const session2Date = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const session2 = await prisma.attendanceSession.create({
    data: {
      code: 'SAMS-NLP01',
      subjectId: nlpSubject.id,
      classSectionId: sectionA.id,
      facultyProfileId: faculty2Profile.id,
      title: 'Lecture 12: Transformers and Self-Attention Mechanism',
      lectureTopic: 'Scaled Dot-Product Attention, Multi-Head Architecture',
      sessionDate: session2Date,
      startTime: session2Date,
      endTime: new Date(session2Date.getTime() + 50 * 60 * 1000),
      durationMinutes: 15,
      qrToken: 'sams_seed_token_past_nlp01_' + crypto.randomBytes(6).toString('hex'),
      qrTokenExpiresAt: new Date(session2Date.getTime() + 15 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  // Session 3: 1 day ago, Deep Learning, Section A (Completed)
  const session3Date = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const session3 = await prisma.attendanceSession.create({
    data: {
      code: 'SAMS-ML02',
      subjectId: mlSubject.id,
      classSectionId: sectionA.id,
      facultyProfileId: faculty1Profile.id,
      title: 'Lecture 19: Residual Networks (ResNet) & Skip Connections',
      lectureTopic: 'Vanishing Gradients, Degradation Problem, Identity Mapping',
      sessionDate: session3Date,
      startTime: session3Date,
      endTime: new Date(session3Date.getTime() + 50 * 60 * 1000),
      durationMinutes: 15,
      qrToken: 'sams_seed_token_past_ml02_' + crypto.randomBytes(6).toString('hex'),
      qrTokenExpiresAt: new Date(session3Date.getTime() + 15 * 60 * 1000),
      status: 'COMPLETED',
    },
  });

  // Session 4: Today - ACTIVE Attendance Session for Section A!
  // Active session allows instant testing of QR scanning right upon login!
  const activeToken = 'sams_live_token_' + crypto.randomBytes(12).toString('hex');
  const sessionActive = await prisma.attendanceSession.create({
    data: {
      code: 'SAMS-ML03',
      subjectId: mlSubject.id,
      classSectionId: sectionA.id,
      facultyProfileId: faculty1Profile.id,
      title: 'Lecture 20: Vision Transformers (ViT) & Attention Maps',
      lectureTopic: 'Patch Extraction, Positional Encodings, Linear Projections',
      sessionDate: now,
      startTime: now,
      durationMinutes: 30,
      qrToken: activeToken,
      qrTokenExpiresAt: new Date(now.getTime() + 30 * 60 * 1000), // Valid for 30 minutes
      status: 'ACTIVE',
    },
  });

  // 12. Create Attendance Records for Section A students in past sessions
  const sectionAStudents = studentProfiles.filter(s => s.sectionId === sectionA.id);

  // For Session 1 (All 5 present)
  for (const s of sectionAStudents) {
    await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session1.id,
        studentProfileId: s.id,
        status: 'PRESENT',
        verificationMethod: 'QR_SCAN',
        markedAt: new Date(session1Date.getTime() + 2 * 60 * 1000),
      },
    });
  }

  // For Session 2: 4 Present, 1 Absent (Kabir Mehta)
  for (const s of sectionAStudents) {
    const isKabir = s.rollNumber === '23AIML005';
    await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session2.id,
        studentProfileId: s.id,
        status: isKabir ? 'ABSENT' : 'PRESENT',
        verificationMethod: isKabir ? 'MANUAL_FACULTY' : 'QR_SCAN',
        markedAt: new Date(session2Date.getTime() + 3 * 60 * 1000),
      },
    });
  }

  // For Session 3: Aarav present (FACE_VERIFIED), Diya present, Rohan LATE, Sneha present, Kabir ABSENT
  for (const s of sectionAStudents) {
    let status = 'PRESENT';
    let method = 'QR_SCAN';
    if (s.rollNumber === '23AIML001') {
      method = 'FACE_VERIFIED';
    } else if (s.rollNumber === '23AIML003') {
      status = 'LATE';
    } else if (s.rollNumber === '23AIML005') {
      status = 'ABSENT';
      method = 'MANUAL_FACULTY';
    }

    await prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: session3.id,
        studentProfileId: s.id,
        status,
        verificationMethod: method,
        markedAt: new Date(session3Date.getTime() + 4 * 60 * 1000),
      },
    });
  }

  // 13. Create a sample correction request from Kabir Mehta for Session 2
  const kabirStudent = sectionAStudents.find(s => s.rollNumber === '23AIML005')!;
  const kabirRecord = await prisma.attendanceRecord.findFirst({
    where: { studentProfileId: kabirStudent.id, attendanceSessionId: session2.id },
  });

  if (kabirRecord) {
    await prisma.attendanceCorrectionRequest.create({
      data: {
        attendanceRecordId: kabirRecord.id,
        studentProfileId: kabirStudent.id,
        attendanceSessionId: session2.id,
        requestedStatus: 'EXCUSED',
        reason: 'Attended Inter-College Hackathon representing CSE AI/ML Department with prior Dean approval.',
        status: 'PENDING',
      },
    });
  }

  // 14. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'System Initialized',
        message: 'Smart Attendance Management System initialized with academic session 2026-27.',
        type: 'INFO',
      },
      {
        userId: faculty1User.id,
        title: 'New Session Started',
        message: 'Active attendance session created for AI601 (Section A). QR Code is active.',
        type: 'SUCCESS',
      },
      {
        userId: sectionAStudents[0].user.id,
        title: 'Attendance Alert',
        message: 'Live attendance session is ongoing for Deep Learning & Neural Networks.',
        type: 'ALERT',
      },
    ],
  });

  // 15. Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_SEED',
        entity: 'Database',
        details: JSON.stringify({ note: 'Initial demonstration data seeded successfully' }),
      },
      {
        userId: faculty1User.id,
        action: 'SESSION_STARTED',
        entity: 'AttendanceSession',
        entityId: sessionActive.id,
        details: JSON.stringify({ code: sessionActive.code, title: sessionActive.title }),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('--------------------------------------------------');
  console.log('DEMO ACCOUNTS FOR LOCAL EVALUATION:');
  console.log('ADMIN:   email: admin@college.edu       | pass: Admin@123');
  console.log('FACULTY: email: faculty.ml@college.edu  | pass: Faculty@123');
  console.log('STUDENT: email: aarav.23aiml@college.edu| pass: Student@123');
  console.log('--------------------------------------------------');
  console.log(`Active QR Token for testing: ${activeToken}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
