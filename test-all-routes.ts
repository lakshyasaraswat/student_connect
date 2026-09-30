import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import { connectDB } from './server/config/db.ts';
import { seedIfEmpty } from './server/config/seed.ts';
import apiRouter from './server/routes/api.ts';
import { errorHandler } from './server/middlewares/errorHandler.ts';
import { initSocketServer } from './server/sockets/chatSocket.ts';
import { signToken } from './server/config/jwt.ts';
import { UserModel } from './server/models/schemas.ts';

interface TestResult {
  category: string;
  method: string;
  endpoint: string;
  expectedStatus: number | number[];
  actualStatus: number;
  passed: boolean;
  notes?: string;
  error?: string;
}

const results: TestResult[] = [];
const TEST_PORT = 3099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function run() {
  console.log('====================================================');
  console.log('🚀 STUDENT_CONNECT COMPREHENSIVE ROUTE TEST SUITE');
  console.log('====================================================\n');

  // 1. Initialize DB and Seed Data
  await connectDB();
  await seedIfEmpty();

  // 2. Start Test Express Server
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  app.get('/health/db', (_req, res) => {
    res.json({
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      db: mongoose.connection.name,
    });
  });

  app.use('/api', apiRouter);
  app.use(errorHandler);

  await new Promise<void>((resolve) => {
    httpServer.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`📡 Test server running on ${BASE_URL}\n`);
      resolve();
    });
  });

  // 3. Prepare Test Users & Auth Tokens
  const adminUser = await UserModel.findOne({ role: 'admin' }).lean() as any;
  const studentUser1 = await UserModel.findOne({ id: 'usr_sarah_chen' }).lean() as any;
  const studentUser2 = await UserModel.findOne({ id: 'usr_marcus_v' }).lean() as any;

  if (!adminUser || !studentUser1 || !studentUser2) {
    throw new Error('Required demo users not found in database.');
  }

  const adminToken = signToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    campusId: adminUser.campusId,
    collegeName: adminUser.collegeName,
    name: adminUser.name,
  });

  const studentToken1 = signToken({
    userId: studentUser1.id,
    email: studentUser1.email,
    role: studentUser1.role,
    campusId: studentUser1.campusId,
    collegeName: studentUser1.collegeName,
    name: studentUser1.name,
  });

  const studentToken2 = signToken({
    userId: studentUser2.id,
    email: studentUser2.email,
    role: studentUser2.role,
    campusId: studentUser2.campusId,
    collegeName: studentUser2.collegeName,
    name: studentUser2.name,
  });

  // Helper for requests
  async function testRoute(
    category: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    expectedStatus: number | number[],
    options: {
      body?: any;
      token?: string;
      customHeaders?: Record<string, string>;
      validator?: (data: any, res: Response) => boolean | string;
    } = {}
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.customHeaders,
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const url = `${BASE_URL}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      let json: any = null;
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      const expectedList = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      let passed = expectedList.includes(res.status);
      let notes = `Status ${res.status}`;

      if (passed && options.validator) {
        const valRes = options.validator(json, res as any);
        if (valRes !== true) {
          passed = false;
          notes = typeof valRes === 'string' ? valRes : 'Validation failed';
        }
      }

      results.push({
        category,
        method,
        endpoint: path,
        expectedStatus,
        actualStatus: res.status,
        passed,
        notes,
        error: passed ? undefined : JSON.stringify(json).slice(0, 150),
      });

      const icon = passed ? '✅' : '❌';
      console.log(`${icon} [${category}] ${method} ${path} -> ${res.status} (${notes})`);
      return json;
    } catch (err: any) {
      results.push({
        category,
        method,
        endpoint: path,
        expectedStatus,
        actualStatus: 0,
        passed: false,
        error: err.message,
      });
      console.log(`❌ [${category}] ${method} ${path} -> NETWORK ERROR: ${err.message}`);
      return null;
    }
  }

  // =========================================================================
  // 1. HEALTH CHECKS
  // =========================================================================
  console.log('\n--- 1. Health Checks ---');
  await testRoute('Health', 'GET', '/health/db', 200, {
    validator: (d) => d.readyState === 1 || 'DB readyState is not 1',
  });
  await testRoute('Health', 'GET', '/api/health', 200, {
    validator: (d) => d.status === 'online' || 'Status is not online',
  });

  // =========================================================================
  // 2. AUTHENTICATION & USER PROFILE
  // =========================================================================
  console.log('\n--- 2. Authentication & User Profile ---');
  await testRoute('Auth', 'GET', '/api/auth/campuses', 200, {
    validator: (d) => Array.isArray(d.campuses) && d.campuses.length > 0,
  });

  const testEmail = `test_student_${Date.now()}@stanford.edu`;
  const otpRes = await testRoute('Auth', 'POST', '/api/auth/request-otp', 200, {
    body: { email: testEmail },
    validator: (d) => d.success === true && Boolean(d.demoOtp),
  });

  const demoOtp = otpRes?.demoOtp || '123456';
  const newUsername = `testuser_${Date.now().toString().slice(-5)}`;
  await testRoute('Auth', 'POST', '/api/auth/register', 201, {
    body: {
      name: 'Test Student User',
      phone: '+1 (555) 019-9988',
      email: testEmail,
      collegeName: 'Stanford University',
      collegeIdCardUrl: 'https://example.com/id.png',
      username: newUsername,
      admissionNumber: `ADM-${Date.now().toString().slice(-5)}`,
      otp: demoOtp,
    },
    validator: (d) => d.success === true && Boolean(d.token),
  });

  await testRoute('Auth', 'POST', '/api/auth/login', 200, {
    body: { identifier: 'sarah_chen', role: 'student' },
    validator: (d) => d.success === true && Boolean(d.token),
  });

  await testRoute('Auth', 'POST', '/api/auth/login', 200, {
    body: { identifier: 'admin_mitchell', role: 'admin' },
    validator: (d) => d.success === true && Boolean(d.token),
  });

  // Direct switch-user should return 403 as designed
  await testRoute('Auth', 'POST', '/api/auth/switch-user', 403, {
    validator: (d) => d.success === false,
  });

  // Auth guards
  await testRoute('Auth', 'GET', '/api/auth/me', 401);
  await testRoute('Auth', 'GET', '/api/auth/me', 200, {
    token: studentToken1,
    validator: (d) => d.user?.id === studentUser1.id,
  });

  await testRoute('Auth', 'PUT', '/api/auth/profile', 200, {
    token: studentToken1,
    body: { bio: 'Updated test bio for student' },
    validator: (d) => d.user?.bio === 'Updated test bio for student',
  });

  await testRoute('Auth', 'GET', '/api/auth/activity', 200, {
    token: studentToken1,
    validator: (d) => Boolean(d.activity),
  });

  await testRoute('Auth', 'PUT', '/api/auth/id-verification', 200, {
    token: studentToken1,
    body: { collegeIdCardUrl: 'https://example.com/updated_id.png' },
    validator: (d) => d.success === true,
  });

  await testRoute('Auth', 'POST', '/api/auth/wallet/topup', 200, {
    token: studentToken1,
    body: { amount: 250 },
    validator: (d) => typeof d.walletBalance === 'number',
  });

  // =========================================================================
  // 3. CARPOOLING / RIDES
  // =========================================================================
  console.log('\n--- 3. Carpooling / Rides ---');
  await testRoute('Rides', 'GET', '/api/rides', 200, {
    validator: (d) => Array.isArray(d.rides),
  });

  await testRoute('Rides', 'POST', '/api/rides/calc/cost-split', 200, {
    body: { distanceKm: 45, fuelPricePerLitre: 1.5, mileageKmPerLitre: 15, passengersCount: 3 },
    validator: (d) => typeof d.calculation?.costPerPerson === 'number',
  });

  const createdRideRes = await testRoute('Rides', 'POST', '/api/rides', 201, {
    token: studentToken1,
    body: {
      source: 'Stanford Main Quad',
      destination: 'San Francisco Downtown',
      date: '2026-10-15',
      time: '09:00',
      seatsTotal: 3,
      pricePerSeat: 15,
      vehicleType: 'Car',
      vehicleModel: 'Honda Civic',
    },
    validator: (d) => Boolean(d.ride?.id),
  });

  const rideId = createdRideRes?.ride?.id;

  if (rideId) {
    await testRoute('Rides', 'GET', `/api/rides/${rideId}`, 200, {
      validator: (d) => d.ride?.id === rideId,
    });

    await testRoute('Rides', 'POST', `/api/rides/${rideId}/request-seat`, 200, {
      token: studentToken2,
      body: { seatsBooked: 1 },
      validator: (d) => d.success === true,
    });

    // Test withdrawing a pending request (should succeed with 200)
    await testRoute('Rides', 'POST', `/api/rides/${rideId}/withdraw-request`, 200, {
      token: studentToken2,
      validator: (d) => d.success === true,
    });

    // Request seat again to test driver acceptance
    await testRoute('Rides', 'POST', `/api/rides/${rideId}/request-seat`, 200, {
      token: studentToken2,
      body: { seatsBooked: 1 },
      validator: (d) => d.success === true,
    });

    await testRoute('Rides', 'POST', `/api/rides/${rideId}/manage-passenger`, 200, {
      token: studentToken1,
      body: { passengerId: studentUser2.id, action: 'accept' },
      validator: (d) => d.success === true,
    });

    // Test withdrawing an accepted request (should return 400 as designed)
    await testRoute('Rides (Guard)', 'POST', `/api/rides/${rideId}/withdraw-request`, 400, {
      token: studentToken2,
    });

    await testRoute('Rides', 'DELETE', `/api/rides/${rideId}`, 200, {
      token: studentToken1,
      validator: (d) => d.success === true,
    });
  }

  // =========================================================================
  // 4. NOTES MARKETPLACE
  // =========================================================================
  console.log('\n--- 4. Notes Marketplace ---');
  await testRoute('Notes', 'GET', '/api/notes', 200, {
    validator: (d) => Array.isArray(d.notes),
  });

  await testRoute('Notes', 'GET', '/api/notes/dashboard', 200, {
    token: studentToken1,
    validator: (d) => Boolean(d.dashboard),
  });

  const createdNoteRes = await testRoute('Notes', 'POST', '/api/notes', 201, {
    token: studentToken1,
    body: {
      title: 'CS 106B Comprehensive Midterm Revision Notes',
      subject: 'Computer Science',
      semester: 'Fall 2026',
      professor: 'Dr. Jerry Cain',
      description: 'Complete data structures, recursion, pointers and tree traversal study guide.',
      price: 15,
      isFree: false,
      fileUrl: 'https://example.com/cs106b-notes.pdf',
    },
    validator: (d) => Boolean(d.note?.id),
  });

  const noteId = createdNoteRes?.note?.id;

  if (noteId) {
    await testRoute('Notes', 'GET', `/api/notes/${noteId}`, 200, {
      validator: (d) => d.note?.id === noteId,
    });

    await testRoute('Notes', 'POST', `/api/notes/${noteId}/purchase`, 200, {
      token: studentToken2,
      validator: (d) => d.success === true,
    });

    await testRoute('Notes', 'POST', `/api/notes/${noteId}/review`, 200, {
      token: studentToken2,
      body: { rating: 5, comment: 'Extremely detailed and clear!' },
      validator: (d) => d.note?.rating >= 1,
    });
  }

  // =========================================================================
  // 5. LAB EQUIPMENT SHARING
  // =========================================================================
  console.log('\n--- 5. Lab Equipment Sharing ---');
  await testRoute('Equipment', 'GET', '/api/equipment', 200, {
    validator: (d) => Array.isArray(d.equipment),
  });

  const createdEqRes = await testRoute('Equipment', 'POST', '/api/equipment', 201, {
    token: studentToken1,
    body: {
      name: 'Digital Storage Oscilloscope 100MHz',
      category: 'Electronics',
      condition: 'Good',
      pricePerDay: 10,
      deposit: 50,
      lateFeePerDay: 5,
      allowBuy: true,
      buyPrice: 350,
      description: 'Dual-channel portable oscilloscope for EE lab assignments.',
    },
    validator: (d) => Boolean(d.equipment?.id),
  });

  const eqId = createdEqRes?.equipment?.id;

  if (eqId) {
    await testRoute('Equipment', 'POST', `/api/equipment/${eqId}/rent`, 200, {
      token: studentToken2,
      body: { days: 2 },
      validator: (d) => d.equipment?.status === 'rented',
    });

    await testRoute('Equipment', 'POST', `/api/equipment/${eqId}/return`, 200, {
      token: studentToken1,
      validator: (d) => d.equipment?.status === 'available',
    });

    await testRoute('Equipment', 'POST', `/api/equipment/${eqId}/purchase`, 200, {
      token: studentToken2,
      validator: (d) => d.equipment?.status === 'sold',
    });

    // Delete equipment
    await testRoute('Equipment', 'DELETE', `/api/equipment/${eqId}`, 200, {
      token: studentToken1,
      validator: (d) => d.success === true,
    });
  }

  // =========================================================================
  // 6. PEER TUTORING
  // =========================================================================
  console.log('\n--- 6. Peer Tutoring ---');
  await testRoute('Tutoring', 'GET', '/api/tutoring/tutors', 200, {
    validator: (d) => Array.isArray(d.tutors),
  });

  const tutorProfileRes = await testRoute('Tutoring', 'POST', '/api/tutoring/tutor-profile', [200, 201], {
    token: studentToken1,
    body: {
      subjects: ['Data Structures', 'Python', 'Algorithms'],
      hourlyRate: 25,
      bio: 'Junior CS tutor experienced with exam preparations.',
      availability: ['Mon 4-6 PM', 'Wed 5-7 PM'],
    },
    validator: (d) => Boolean(d.tutor?.id),
  });

  const tutorId = tutorProfileRes?.tutor?.id;

  let sessionId: string | null = null;
  if (tutorId) {
    const bookRes = await testRoute('Tutoring', 'POST', '/api/tutoring/book', 201, {
      token: studentToken2,
      body: {
        tutorId,
        subject: 'Data Structures',
        date: '2026-10-20',
        time: '17:00',
        durationHours: 1,
        sessionType: '1-on-1',
        notes: 'Need help with red-black trees.',
      },
      validator: (d) => Boolean(d.session?.id),
    });
    sessionId = bookRes?.session?.id;
  }

  await testRoute('Tutoring', 'GET', '/api/tutoring/sessions', 200, {
    token: studentToken2,
    validator: (d) => Array.isArray(d.sessions),
  });

  if (sessionId) {
    await testRoute('Tutoring', 'POST', `/api/tutoring/sessions/${sessionId}/complete`, 200, {
      token: studentToken1,
      body: { rating: 5, feedback: 'Great and productive session!' },
      validator: (d) => d.session?.status === 'completed',
    });

    await testRoute('Tutoring', 'POST', `/api/tutoring/sessions/${sessionId}/rate`, 200, {
      token: studentToken2,
      body: { rating: 5, feedback: 'Understood trees clearly.' },
      validator: (d) => d.session?.studentRating === 5,
    });

    // Book another session to test cancelSession
    const book2Res = await testRoute('Tutoring', 'POST', '/api/tutoring/book', 201, {
      token: studentToken2,
      body: {
        tutorId,
        subject: 'Algorithms',
        date: '2026-10-22',
        time: '18:00',
        durationHours: 1,
      },
    });
    const session2Id = book2Res?.session?.id;
    if (session2Id) {
      await testRoute('Tutoring', 'POST', `/api/tutoring/sessions/${session2Id}/cancel`, 200, {
        token: studentToken2,
        validator: (d) => d.session?.status === 'cancelled',
      });
    }
  }

  // =========================================================================
  // 7. STUDY GROUPS
  // =========================================================================
  console.log('\n--- 7. Study Groups ---');
  await testRoute('Study Groups', 'GET', '/api/study-groups', 200, {
    validator: (d) => Array.isArray(d.groups),
  });

  const createdGroupRes = await testRoute('Study Groups', 'POST', '/api/study-groups', 201, {
    token: studentToken1,
    body: {
      name: 'Machine Learning Study Circle',
      subject: 'CS 229',
      topic: 'Neural Networks & Optimization',
      description: 'Weekly collaborative study squad for problem sets.',
      maxMembers: 6,
      type: 'public',
      locationType: 'Campus Library',
    },
    validator: (d) => Boolean(d.group?.id),
  });

  const groupId = createdGroupRes?.group?.id;

  if (groupId) {
    await testRoute('Study Groups', 'GET', `/api/study-groups/${groupId}`, 200, {
      validator: (d) => d.group?.id === groupId,
    });

    await testRoute('Study Groups', 'POST', `/api/study-groups/${groupId}/join`, 200, {
      token: studentToken2,
      validator: (d) => d.group?.members?.some((m: any) => m.userId === studentUser2.id),
    });

    await testRoute('Study Groups', 'POST', `/api/study-groups/${groupId}/resources`, 200, {
      token: studentToken2,
      body: {
        title: 'Linear Algebra Review Notes',
        url: 'https://example.com/linalg.pdf',
        type: 'pdf',
      },
      validator: (d) => d.group?.resources?.length > 0,
    });

    await testRoute('Study Groups', 'POST', `/api/study-groups/${groupId}/schedule`, 200, {
      token: studentToken1,
      body: {
        topic: 'Gradient Descent Walkthrough',
        date: '2026-10-18',
        time: '16:00',
        location: 'Green Library',
      },
      validator: (d) => d.group?.schedule?.length > 0,
    });

    await testRoute('Study Groups', 'POST', `/api/study-groups/${groupId}/leave`, 200, {
      token: studentToken2,
      validator: (d) => d.success === true,
    });

    await testRoute('Study Groups', 'DELETE', `/api/study-groups/${groupId}`, 200, {
      token: studentToken1,
      validator: (d) => d.success === true,
    });
  }

  // =========================================================================
  // 8. ROOMMATE MATCHING
  // =========================================================================
  console.log('\n--- 8. Roommate Matching ---');
  await testRoute('Roommates', 'GET', '/api/roommates', 200, {
    validator: (d) => Array.isArray(d.roommates),
  });

  const postRes = await testRoute('Roommates', 'POST', '/api/roommates', 200, {
    token: studentToken1,
    body: {
      userGender: 'Female',
      budgetMin: 800,
      budgetMax: 1300,
      preferredLocation: 'Palo Alto Downtown',
      bio: 'CS student looking for a quiet, study-focused roommate.',
      preferences: {
        preferredGender: 'Female',
        smoking: 'Non-Smoker',
        food: 'Vegetarian',
        sleepSchedule: 'Early Bird (before 11 PM)',
        cleanliness: 'Extremely Clean',
        studyHabit: 'Quiet Study',
      },
    },
    validator: (d) => Boolean(d.post?.id),
  });

  const rmPostId = postRes?.post?.id;

  if (rmPostId) {
    await testRoute('Roommates', 'PUT', `/api/roommates/${rmPostId}/status`, 200, {
      token: studentToken1,
      body: { status: 'found' },
      validator: (d) => d.post?.status === 'found',
    });

    await testRoute('Roommates', 'DELETE', `/api/roommates/${rmPostId}`, 200, {
      token: studentToken1,
      validator: (d) => d.success === true,
    });
  }

  // =========================================================================
  // 9. HOUSING & PG LISTINGS
  // =========================================================================
  console.log('\n--- 9. Housing & PG Listings ---');
  await testRoute('Listings', 'GET', '/api/listings', 200, {
    validator: (d) => Array.isArray(d.listings),
  });

  const listingRes = await testRoute('Listings', 'POST', '/api/listings', 201, {
    token: studentToken1,
    body: {
      title: 'Spacious 2BHK Shared Flat near Campus',
      type: 'Flat',
      rent: 1100,
      deposit: 1100,
      address: 'College Terrace, Palo Alto',
      distanceToCampusKm: 1.2,
      amenities: ['High-speed Wi-Fi', 'Furnished', 'Washer/Dryer'],
      genderPreference: 'Any',
    },
    validator: (d) => Boolean(d.listing?.id),
  });

  const listingId = listingRes?.listing?.id;

  if (listingId) {
    await testRoute('Listings', 'GET', `/api/listings/${listingId}`, 200, {
      validator: (d) => d.listing?.id === listingId,
    });

    await testRoute('Listings', 'POST', `/api/listings/${listingId}/reviews`, 200, {
      token: studentToken2,
      body: { rating: 5, comment: 'Clean, safe, right next to bike route.' },
      validator: (d) => d.listing?.reviewsCount >= 1,
    });

    await testRoute('Listings', 'DELETE', `/api/listings/${listingId}`, 200, {
      token: studentToken1,
      validator: (d) => d.success === true,
    });
  }

  // =========================================================================
  // 10. ASSIGNMENT HELP & BOUNTY ESCROW
  // =========================================================================
  console.log('\n--- 10. Assignment Help & Bounty Escrow ---');
  await testRoute('Assignments', 'GET', '/api/assignments', 200, {
    validator: (d) => Array.isArray(d.assignments),
  });

  const asgnRes = await testRoute('Assignments', 'POST', '/api/assignments', 201, {
    token: studentToken1,
    body: {
      title: 'OS Pintos Project Kernel Synchronization',
      subject: 'Operating Systems',
      courseCode: 'CS 140',
      description: 'Help needed with priority donation locks and timer sleep.',
      bounty: 40,
      deadline: '2026-10-30',
      urgency: 'High',
    },
    validator: (d) => Boolean(d.assignment?.id),
  });

  const asgnId = asgnRes?.assignment?.id;

  if (asgnId) {
    await testRoute('Assignments', 'GET', `/api/assignments/${asgnId}`, 200, {
      validator: (d) => d.assignment?.id === asgnId,
    });

    // Add proposal / bid
    await testRoute('Assignments', 'POST', `/api/assignments/${asgnId}/apply`, 200, {
      token: studentToken2,
      body: {
        pitch: 'I have successfully solved Pintos priority donation in my OS course.',
        proposedTime: 'Within 24 hours',
        offeredPrice: 40,
      },
      validator: (d) => d.assignment?.proposals?.length > 0,
    });

    // Counter offer
    await testRoute('Assignments', 'POST', `/api/assignments/${asgnId}/counter`, 200, {
      token: studentToken2,
      body: { counterPrice: 45, counterNote: 'Includes unit tests' },
      validator: (d) => d.assignment?.proposals?.some((p: any) => p.counterPrice === 45),
    });

    // Assign solver
    await testRoute('Assignments', 'POST', `/api/assignments/${asgnId}/assign`, 200, {
      token: studentToken1,
      body: { solverId: studentUser2.id },
      validator: (d) => d.assignment?.status === 'assigned',
    });

    // Submit solution
    await testRoute('Assignments', 'POST', `/api/assignments/${asgnId}/submit`, 200, {
      token: studentToken2,
      body: {
        solutionNotes: 'Completed priority donation logic with locks and conditional variables.',
        solutionFileUrl: 'https://example.com/pintos-sol.zip',
      },
      validator: (d) => d.assignment?.status === 'submitted',
    });

    // Review solution (approve & release escrow)
    await testRoute('Assignments', 'POST', `/api/assignments/${asgnId}/review`, 200, {
      token: studentToken1,
      body: { action: 'approve', rating: 5, review: 'Code passes all Pintos regression tests.' },
      validator: (d) => d.assignment?.status === 'completed',
    });

    // Test addDemoOffer and cancelAssignment on a separate assignment
    const asgn2Res = await testRoute('Assignments', 'POST', '/api/assignments', 201, {
      token: studentToken1,
      body: {
        title: 'Calculus III Vector Fields Problem Set',
        subject: 'Mathematics',
        description: 'Green theorem and surface integrals help needed.',
        bounty: 25,
        deadline: '2026-10-25',
      },
    });
    const asgn2Id = asgn2Res?.assignment?.id;

    if (asgn2Id) {
      await testRoute('Assignments', 'POST', `/api/assignments/${asgn2Id}/demo-offer`, 200, {
        token: studentToken1,
        validator: (d) => d.assignment?.proposals?.length > 0,
      });

      // Claim assignment
      await testRoute('Assignments', 'POST', `/api/assignments/${asgn2Id}/claim`, 200, {
        token: studentToken2,
        validator: (d) => d.assignment?.status === 'assigned',
      });

      // Cancel assignment
      await testRoute('Assignments', 'POST', `/api/assignments/${asgn2Id}/cancel`, 200, {
        token: studentToken1,
        validator: (d) => d.assignment?.status === 'cancelled',
      });

      // Delete assignment
      await testRoute('Assignments', 'DELETE', `/api/assignments/${asgn2Id}`, 200, {
        token: studentToken1,
        validator: (d) => d.success === true,
      });
    }
  }

  // =========================================================================
  // 11. ADMINISTRATOR PORTAL & ESCROW MEDIATION
  // =========================================================================
  console.log('\n--- 11. Administrator Portal & Escrow Mediation ---');
  // First, verify role guard blocks students from admin routes (403)
  await testRoute('Admin (Guard)', 'GET', '/api/admin/metrics', 403, {
    token: studentToken1,
  });

  // Now test with admin token (200)
  await testRoute('Admin', 'GET', '/api/admin/metrics', 200, {
    token: adminToken,
    validator: (d) => Boolean(d.metrics?.totalStudents !== undefined),
  });

  await testRoute('Admin', 'GET', '/api/admin/users', 200, {
    token: adminToken,
    validator: (d) => Array.isArray(d.users),
  });

  await testRoute('Admin', 'GET', '/api/admin/escrow-transactions', 200, {
    token: adminToken,
    validator: (d) => Array.isArray(d.transactions),
  });

  await testRoute('Admin', 'POST', '/api/admin/resolve-dispute', [200, 400], {
    token: adminToken,
    body: { referenceId: 'non_existent_ref', resolution: 'refund_to_buyer' },
    validator: () => true, // Handles expected validation or not found cleanly without 500
  });

  await testRoute('Admin', 'PUT', `/api/admin/toggle-user-verification/${studentUser2.id}`, 200, {
    token: adminToken,
    validator: (d) => d.user?.id === studentUser2.id,
  });

  await testRoute('Admin', 'PUT', `/api/admin/approve-verification/${studentUser2.id}`, 200, {
    token: adminToken,
    validator: (d) => d.user?.isVerified === true,
  });

  await testRoute('Admin', 'PUT', `/api/admin/reject-verification/${studentUser2.id}`, 200, {
    token: adminToken,
    body: { reason: 'Test audit review' },
    validator: (d) => d.user?.isVerified === false,
  });

  // Verify listing route
  const adminListingRes = await testRoute('Listings', 'POST', '/api/listings', 201, {
    token: adminToken,
    body: {
      title: 'Campus Verified Studio',
      rent: 900,
      address: 'University Ave',
    },
  });
  const adminListingId = adminListingRes?.listing?.id;
  if (adminListingId) {
    await testRoute('Admin', 'PUT', `/api/admin/verify-listing/${adminListingId}`, 200, {
      token: adminToken,
      validator: (d) => d.listing?.verified === true,
    });
    // Cleanup
    await testRoute('Listings', 'DELETE', `/api/listings/${adminListingId}`, 200, {
      token: adminToken,
    });
  }

  // =========================================================================
  // 12. NOTIFICATIONS
  // =========================================================================
  console.log('\n--- 12. Notifications ---');
  const notifsRes = await testRoute('Notifications', 'GET', '/api/notifications', 200, {
    token: studentToken1,
    validator: (d) => Array.isArray(d.notifications),
  });

  const notifId = notifsRes?.notifications?.[0]?.id || 'notif_test';
  await testRoute('Notifications', 'PUT', `/api/notifications/${notifId}/read`, 200, {
    token: studentToken1,
    validator: (d) => d.success === true,
  });

  await testRoute('Notifications', 'PUT', '/api/notifications/read-all', 200, {
    token: studentToken1,
    validator: (d) => d.success === true,
  });

  // =========================================================================
  // 13. CHAT & MESSAGING
  // =========================================================================
  console.log('\n--- 13. Chat & Messaging ---');
  const testRoomId = `test_room_${Date.now()}`;
  await testRoute('Chat', 'POST', '/api/chat/messages', 201, {
    token: studentToken1,
    body: { roomId: testRoomId, text: 'Hello from automated test!' },
    validator: (d) => Boolean(d.message?.id),
  });

  await testRoute('Chat', 'GET', `/api/chat/${testRoomId}/messages`, 200, {
    token: studentToken1,
    validator: (d) => Array.isArray(d.messages) && d.messages.length > 0,
  });

  // =========================================================================
  // 14. GEMINI AI & GOOGLE MAPS GROUNDING
  // =========================================================================
  console.log('\n--- 14. Gemini AI & Google Maps Grounding ---');
  await testRoute('Gemini', 'GET', '/api/gemini/verified-locations?campusId=stanford', 200, {
    validator: (d) => Array.isArray(d.locations) && d.locations.length > 0,
  });

  await testRoute('Gemini', 'POST', '/api/gemini/locate-nearby', 200, {
    body: { category: 'carpool', campusId: 'stanford', collegeName: 'Stanford University' },
    validator: (d) => Boolean(d.text) && Array.isArray(d.places),
  });

  await testRoute('Gemini', 'POST', '/api/gemini/chat', 200, {
    body: { message: 'Where are the best carpool pickup spots on campus?', campusId: 'stanford' },
    validator: (d) => Boolean(d.text),
  });

  // =========================================================================
  // FINAL REPORT & SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('====================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Routes Tested: ${total}`);
  console.log(`Passed:              ${passed} ✅`);
  console.log(`Failed:              ${failed} ${failed === 0 ? '🎉' : '❌'}`);

  if (failed > 0) {
    console.log('\n⚠️ Failed Tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`- [${r.category}] ${r.method} ${r.endpoint}: expected ${r.expectedStatus}, got ${r.actualStatus}. Note: ${r.notes || r.error}`);
    });
  }

  // Gracefully close server & DB connection
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
